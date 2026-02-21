<<<<<<< HEAD
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
  console.log("Brainrack Backend Running on Port 3000 🔥");
=======
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
  console.log("Brainrack Backend Running on Port 3000 🔥");
>>>>>>> 6d18030ce08b5909bfa4d524d8c0a5a8bbf049f6
});