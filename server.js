import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

// ✅ Crear app PRIMERO
const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // sirve test.html

// ✅ Cliente OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://pina-tactuk-production.up.railway.app",
    "X-OpenRouter-Title": "Pena Tactuk"
  }
});

// ✅ Ruta de prueba
app.get("/", (req, res) => {
  res.send("Peña Tactuk está activo 🍍");
});

// ✅ CHAT IA
app.post("/chat", async (req, res) => {
  const message = req.body.message;

  try {
    const stream = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages: [
        {
          role: "system",
          content: `
Eres Peña Tactuk 🍍, un militar dominicano formado en la Academia Militar Batalla de las Carreras.

Tu personalidad:
- Disciplina militar
- Respuestas claras, firmes y respetuosas
- Nada de discursos largos innecesarios

Reglas:
- NO uses "Usuario:" ni "Respuesta:"
- NO repitas la pregunta
- Responde directo

Si no sabes algo:
"Negativo. No dispongo de esa información."
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
      if (content) res.write(content);
    }

    res.end();

  } catch (error) {
    console.error("ERROR IA:", error);
    res.status(500).send("Error IA");
  }
});

// ✅ PUERTO
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});