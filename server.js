import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("./")); // sirve tu test.html

// Cliente OpenRouter (modo OpenAI)
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://pina-tactuk.up.railway.app", // puedes cambiar luego
    "X-OpenRouter-Title": "Pina Tactuk"
  }
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Piña Tactuk está vivo 🍍");
});

// Chat IA
app.post("/chat", async (req, res) => {
  const message = req.body.message;

  try {
    const completion = await openai.chat.completions.create({
      model: "openrouter/auto", // 🔥 evita errores de modelos
      messages: [
        {
          role: "system",
          content: "Eres Piña Tactuk 🍍, un asistente divertido, amigable y útil."
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
    console.error("ERROR IA:", error.message);

    res.json({
      reply: "Estoy saturado 🍍😅 intenta en un momento"
    });
  }
});

// Puerto dinámico para Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});