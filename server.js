require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Brainrack Backend Working 🚀");
});

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
        messages: [
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("OpenRouter Error:", data);
      return res.status(400).json({ error: "AI request failed", details: data });
    }

    res.json([
      { generated_text: data.choices[0].message.content }
    ]);

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Server crashed" });
  }
});

app.listen(3000, () => {

app.post("/generate-image", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    console.log("Generating image for:", prompt);

    const response = await fetch("https://api.openrouter.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/dall-e-3",
        prompt: prompt,
        size: "1024x1024"
      })
    });

    const data = await response.json();

    console.log("OpenRouter response:", data);

    if (!response.ok) {
      return res.status(500).json({ error: data });
    }

    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({ error: "No image returned" });
    }

    res.json({ imageUrl });

  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

  console.log("Brainrack Backend Running on Port 3000 🔥");
});