require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Test route
app.get("/", (req, res) => {
  res.send("Brainrack Backend Working 🚀");
});

// Chat route
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("OpenRouter Error:", data);
      return res.status(400).json({ error: "AI request failed", details: data });
    }

    res.json([{ generated_text: data.choices[0].message.content }]);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Server crashed" });
  }
});

// Image generation route
app.post("/generate-image", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
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
      model: "stability-ai/sdxl",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  }
);

    // 🔥 IMPORTANT — DO NOT PARSE JSON YET
    const raw = await response.text();

    console.log("STATUS:", response.status);
    console.log("RAW RESPONSE:", raw);

    return res.status(response.status).send(raw);

  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(3000, () => {
  console.log("Brainrack Backend Running on Port 3000 🔥");
});