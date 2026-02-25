require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());
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
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        responseType: "stream"
      }
    );

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    response.data.on("data", (chunk) => {
      const lines = chunk.toString().split("\n");

      lines.forEach((line) => {
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
      });
    });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).end("Error");
  }
});

// ===== IMAGE ROUTE (UNCHANGED) =====
app.post("/api/image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/images/generations",
      {
        model: "openai/dall-e-3",
        prompt: prompt,
        size: "1024x1024"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Image generation failed" });
  }
});

app.listen(PORT, () => {
  console.log(`BrainRack AI running on port ${PORT}`);
});