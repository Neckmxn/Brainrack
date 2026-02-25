require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();

// ✅ Middleware AFTER app is created
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const PORT = process.env.PORT || 5000;

// ===== STREAMING CHAT ROUTE =====
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: message }],
        stream: true
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
          "Content-Type": "application/json"
        },
        responseType: "stream"
      }
    );

    res.setHeader("Content-Type", "text/plain");

    response.data.on("data", (chunk) => {
      const lines = chunk.toString().split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const json = line.replace("data: ", "").trim();

          if (json === "[DONE]") {
            return res.end();
          }

          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              res.write(content);
            }
          } catch (err) {}
        }
      }
    });

  } catch (error) {
    console.error("CHAT ERROR:", error.response?.data || error.message);
    res.status(500).end("Error");
  }
});

// ===== IMAGE ROUTE =====
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1024"
    });

    res.json({
      data: [
        {
          url: result.data[0].url
        }
      ]
    });

  } catch (error) {
    console.error("IMAGE ERROR:", error);
    res.status(500).json({ error: "Image generation failed" });
  }
});

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`BrainRack AI running on port ${PORT}`);
});