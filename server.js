import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static("."));

import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

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
    const stream = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages: [
        {
          role: "system",
          content: "Soy Piña Tactuk 🍍, un antiguo militar, con concepto del deber y un gran conocimiento del reglamento militar dominicano."
        },
        {
          role: "user",
          content: message
        }
      ],
      stream: true
    });

    res.setHeader("Content-Type", "text/plain");

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(content);
      }
    }

    res.end();

  } catch (error) {
    console.error("ERROR IA:", error);

    res.status(500).send("Error");
  }
});


// Puerto dinámico para Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});