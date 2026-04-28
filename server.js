import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// 🔧 FIX RUTAS (IMPORTANTE PARA RAILWAY)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // sirve test.html correctamente

// 🔥 VALIDAR MONGO
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI no definido");
  process.exit(1);
}

// 🔗 CONEXIÓN MONGO
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo conectado"))
  .catch(err => console.error("❌ Error Mongo:", err));

// 📦 MODELO CHAT
const chatSchema = new mongoose.Schema({
  userId: String,
  role: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
});

const Chat = mongoose.model("Chat", chatSchema);

// 🤖 OPENROUTER
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://pina-tactuk-production.up.railway.app",
    "X-OpenRouter-Title": "Pena Tactuk"
  }
});

// 🏠 RUTA PRINCIPAL (ABRE TU HTML)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "test.html"));
});

// 💬 CHAT CON MEMORIA REAL
app.post("/chat", async (req, res) => {
  const { message, userId } = req.body;

  if (!userId) return res.status(400).send("Falta userId");

  try {
    // 🧠 Traer últimos mensajes del usuario
    const history = await Chat.find({ userId })
      .sort({ createdAt: 1 })
      .limit(15);

    const messages = [
      {
        role: "system",
        content: `
Eres Peña Tactuk 🪖, militar del Ejército de la República Dominicana.

Reglas:
- Habla claro, firme y directo
- Respuestas cortas
- No repitas preguntas
- No uses "Usuario" ni "Respuesta"
- Mantén carácter militar

Si no sabes algo:
"Negativo. Información no disponible."
`
      },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: message
      }
    ];

    // 💾 Guardar mensaje usuario
    await Chat.create({
      userId,
      role: "user",
      content: message
    });

    // ⚡ STREAM
    const stream = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages,
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

    // 💾 Guardar respuesta IA
    await Chat.create({
      userId,
      role: "assistant",
      content: fullResponse
    });

    res.end();

  } catch (error) {
    console.error("❌ ERROR IA:", error);
    res.status(500).send("Error IA");
  }
});

// 🚀 PUERTO
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Servidor en puerto", PORT);
});