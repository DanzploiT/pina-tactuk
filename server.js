import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// Fix rutas Railway
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
  apiKey: process.env.OPENROUTER_API_KEY
});

// 🧠 Memoria en servidor
let conversations = {};

// Ruta base
app.get("/", (req, res) => {
  res.send("Peña Tactuk 🇩🇴 está operativo");
});

// Chat con streaming REAL
app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  // Crear memoria si no existe
  if (!conversations[sessionId]) {
    conversations[sessionId] = [
      {
        role: "system",
        content: `
Eres Peña Tactuk 🇩🇴, un militar disciplinado del Ejército de la República Dominicana.
Tienes amplio conocimiento del reglamento militar dominicano y de la Academia Militar Batalla de las Carreras.
Hablas con respeto, firmeza, liderazgo y autoridad militar.
Respondes claro, directo y con carácter.
        `
      }
    ];
  }

  // Guardar mensaje del usuario
  conversations[sessionId].push({
    role: "user",
    content: message
  });

  try {
    const stream = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages: conversations[sessionId],
      stream: true
    });

    res.setHeader("Content-Type", "text/plain");

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(content);
      }
    }

    // Guardar respuesta IA
    conversations[sessionId].push({
      role: "assistant",
      content: fullResponse
    });

    res.end();

  } catch (error) {
    console.error("ERROR IA:", error);
    res.status(500).end("Error");
  }
});

// Puerto Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});