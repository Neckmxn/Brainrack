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

app.post("/generate-image", async (req, res) => {
  try {
    if (!process.env.OPENROUTER_KEY) {
      return res.status(500).json({ error: "API key not found" });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://brainrack.onrender.com",
          "X-Title": "Brainrack"
        },
        body: JSON.stringify({
          model: "black-forest-labs/flux-1-schnell",
          prompt: req.body.prompt,
          size: "1024x1024"
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

    if (!data.data || !data.data[0]?.url) {
      return res.status(500).json({ error: "Invalid image response format" });
    }

    res.json({
      image: data.data[0].url
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ===========================
   SERVER START
=========================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🔥`);
});