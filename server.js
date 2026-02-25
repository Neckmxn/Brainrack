require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Brainrack AI Backend Running 🚀");
});

/* ===========================
   CHAT ROUTE
=========================== */
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "No response";
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Error generating response" });
  }
});

/* ===========================
   IMAGE GENERATION ROUTE
=========================== */
app.post("/image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: "1024x1024"
      })
    });

    const data = await response.json();
    const imageUrl = data?.data?.[0]?.url || null;

    res.json({ imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ imageUrl: null });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Brainrack AI running on port ${PORT} 🚀`));