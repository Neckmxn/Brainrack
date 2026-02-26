import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

// Health check
app.get("/", (req, res) => {
  res.send("Brainrack AI Backend Running 🚀");
});


// ================= CHAT ROUTE =================
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();

    res.json({
      reply: data.choices?.[0]?.message?.content || "No response."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chat Error" });
  }
});


// ================= IMAGE ROUTE =================
app.post("/image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/dall-e-3",
        prompt
      })
    });

    const data = await response.json();

    res.json({
      image: data.data?.[0]?.url || null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Image Error" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});