require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ================= AI CHAT ================= */

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Reply in the same language as user." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });

  } catch (err) {
    res.status(500).json({ error: "AI error" });
  }
});

/* ================= IMAGE GENERATOR ================= */

app.post("/generate-image", async (req, res) => {
  const { prompt } = req.body;

  const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "stability-ai/sdxl",
      prompt
    })
  });

  const data = await response.json();
  res.json({ image: data.data[0].url });
});

/* ================= DOCUMENT ANALYSIS ================= */

const upload = multer({ dest: "uploads/" });

app.post("/analyze", upload.single("file"), async (req, res) => {
  const { question } = req.body;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Summarize or answer based on provided text." },
        { role: "user", content: question }
      ]
    })
  });

  const data = await response.json();
  res.json({ result: data.choices[0].message.content });
});

/* ================= WEATHER ================= */

app.get("/weather/:city", async (req, res) => {
  const city = req.params.city;

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_KEY}&units=metric`
  );

  const data = await response.json();
  res.json(data);
});

/* ================= NEWS ================= */

app.get("/news/:category", async (req, res) => {
  const category = req.params.category;

  const response = await fetch(
    `https://newsapi.org/v2/top-headlines?country=in&category=${category}&apiKey=${process.env.NEWSAPI_KEY}`
  );

  const data = await response.json();
  res.json(data);
});

app.listen(PORT, () => console.log("Brainrack running..."));