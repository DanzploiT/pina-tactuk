import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// 🔧 Fix rutas (importante en Railway)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());

// Servir frontend
app.use(express.static(__dirname));

// Cliente OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://pina-tactuk-production.up.railway.app",
    "X-OpenRouter-Title": "Pina Tactuk"
  }
});

// Ruta base
app.get("/", (req, res) => {
  res.send("Piña Tactuk está vivo 🍍");
});

// 🚀 Chat SIN streaming (compatible con tu frontend actual)
app.post("/chat", async (req, res) => {
  const message = req.body.message;

  try {
    const completion = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages: [
        {
          role: "system",
          content: "Soy Piña Tactuk 🍍, un antiguo militar con disciplina, honor y conocimiento del reglamento militar dominicano."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });

  } catch (error) {
    console.error("ERROR IA:", error);
    res.status(500).json({ reply: "Error con la IA" });
  }
});

// Puerto Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});