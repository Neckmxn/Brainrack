require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Brainrack Backend Running 🚀");
});

/* ===========================
   CHAT ROUTE
=========================== */

app.post("/chat", async (req, res) => {
  try {
    if (!process.env.OPENROUTER_KEY) {
      return res.status(500).json({ error: "API key not found" });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://brainrack.onrender.com",
          "X-Title": "Brainrack"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            { role: "user", content: req.body.message }
          ]
        })
      }
    );

    const text = await response.text();

    if (!response.headers.get("content-type")?.includes("application/json")) {
      return res.status(500).json({
        error: "Non-JSON response from OpenRouter",
        raw: text.slice(0, 200)
      });
    }

    const data = JSON.parse(text);

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      reply: data.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ===========================
   IMAGE ROUTE
=========================== */

async function generateHFImage(prompt, retries = 3) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        options: { wait_for_model: true }
      }),
    }
  );

  if (response.status === 503 && retries > 0) {
    console.log("Model loading... retrying...");
    await new Promise(res => setTimeout(res, 5000));
    return generateHFImage(prompt, retries - 1);
  }

  return response;
}

app.post("/generate-image", async (req, res) => {
  try {
    if (!process.env.HF_TOKEN) {
      return res.status(500).json({ error: "HF_TOKEN not found" });
    }

    const response = await generateHFImage(req.body.prompt);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const imageBuffer = await response.arrayBuffer();

    res.set("Content-Type", "image/png");
    res.send(Buffer.from(imageBuffer));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ===========================
   SERVER START
=========================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🔥`);
});