require("dotenv").config();
const express = require("express");
const cors = require("cors");
const FormData = require("form-data");
const fetch = require("node-fetch");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Brainrack Backend Running 🚀");
});

/* ===========================
   CHAT ROUTE (OpenRouter)
=========================== */

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://brainrack.onrender.com",
        "X-Title": "Brainrack"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();

    console.log("CHAT STATUS:", response.status);
    console.log("CHAT RAW:", data);

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const aiReply = data.choices[0].message.content;

    res.json({ reply: aiReply });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ===========================
   IMAGE ROUTE (Stability AI)
=========================== */

app.post("/generate-image", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("output_format", "png");

    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/sd3",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: "image/png", // 🔥 IMPORTANT FIX
          ...formData.getHeaders()
        },
        body: formData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Stability Error:", errorText);
      return res.status(response.status).send(errorText);
    }

    const imageBuffer = await response.buffer(); // ✅ better for node-fetch v2
    const base64Image = imageBuffer.toString("base64");

    res.json({
      image: `data:image/png;base64,${base64Image}`
    });

  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🔥`);
});