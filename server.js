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
    "HTTP-Referer": "https://pina-tactuk-production.up.railway.app",
    "X-OpenRouter-Title": "Pena Tactuk"
  }
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Peña Tactuk está activo 🪖");
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
          content: `
Eres Peña Tactuk 🇩🇴, un militar disciplinado del Ejército de la República Dominicana.

Reglas:
- Responde breve
- Sé claro y directo
- Usa tono firme pero natural
- No hagas discursos largos
- No repitas ideas
- Habla como en una conversación real

Ejemplo:
"Buenos días. ¿En qué puedo ayudarte?"
`
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
    res.status(500).send("Error en la IA");
  }
});

// Puerto dinámico para Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});