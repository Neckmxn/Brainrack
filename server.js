require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const multer = require("multer");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ===========================
   ROOT
=========================== */

app.get("/", (req, res) => {
  res.send("Brainrack Backend Running 🚀");
});

/* ===========================
   CHAT ROUTE
=========================== */

app.post("/chat", async (req, res) => {
  try {
    if (!process.env.OPENROUTER_KEY) {
      return res.status(500).json({ error: "OPENROUTER_KEY not found" });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://brainrack.onrender.com",
          "X-Title": "Brainrack"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "user", content: req.body.message }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      reply: data.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===========================
   IMAGE GENERATION (HF)
=========================== */

async function generateHFImage(prompt, retries = 3) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        options: { wait_for_model: true }
      }),
    }
  );

  if (response.status === 503 && retries > 0) {
    console.log("Model loading... retrying...");
    await new Promise(res => setTimeout(res, 5000));
    return generateHFImage(prompt, retries - 1);
  }

  return response;
}

app.post("/generate-image", async (req, res) => {
  try {
    if (!process.env.HF_TOKEN) {
      return res.status(500).json({ error: "HF_TOKEN not found" });
    }

    const prompt = req.body.prompt;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    const response = await generateHFImage(prompt);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("HF ERROR:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const contentType = response.headers.get("content-type");

    if (!contentType.includes("image")) {
      const errorText = await response.text();
      return res.status(500).json({ error: errorText });
    }

    const imageBuffer = await response.buffer();

    res.set("Content-Type", "image/png");
    res.send(imageBuffer);

  } catch (err) {
    console.error("IMAGE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===========================
   DOCUMENT SOLVER
=========================== */

// Memory storage (safe for Render free tier)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

// Smart chunking
function chunkText(text, chunkSize = 6000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

app.post("/solve-document", upload.single("file"), async (req, res) => {
  try {
    if (!process.env.OPENROUTER_KEY) {
      return res.status(500).json({ error: "OPENROUTER_KEY missing" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "File required" });
    }

    const question =
      req.body.question || "Summarize this document clearly.";

    let extractedText = "";

    // PDF
    if (req.file.mimetype === "application/pdf") {
      const data = await pdf(req.file.buffer);
      extractedText = data.text;
    }

    // DOCX
    else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({
        buffer: req.file.buffer
      });
      extractedText = result.value;
    }

    else {
      return res.status(400).json({
        error: "Only PDF or DOCX allowed"
      });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({
        error: "No readable text found"
      });
    }

    // Limit total size (important for Render timeout)
    extractedText = extractedText.slice(0, 20000);

    const chunks = chunkText(extractedText);

    let finalAnswer = "";

    for (let chunk of chunks.slice(0, 3)) { // limit chunks for safety
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://brainrack.onrender.com",
            "X-Title": "Brainrack"
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert academic assistant. Use headings, bullet points and highlight key answers clearly."
              },
              {
                role: "user",
                content: `Document Content:\n${chunk}\n\nUser Question:\n${question}`
              }
            ]
          })
        }
      );

      const data = await response.json();

      finalAnswer +=
        data.choices?.[0]?.message?.content + "\n\n";
    }

    res.json({
      solution: finalAnswer || "No solution generated"
    });

  } catch (err) {
    console.error("DOCUMENT ERROR:", err);
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