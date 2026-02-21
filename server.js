import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/google/flan-t5-base",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: req.body.message })
    }
  );

  const data = await response.json();
  res.json(data);
});

app.listen(3000, () => console.log("Server running"));
