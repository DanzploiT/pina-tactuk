import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // sirve index.html

// 🔗 MONGO
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("Mongo conectado"))
.catch(err => console.log(err));

// 📦 MODELOS
const MessageSchema = new mongoose.Schema({
  role: String,
  content: String
});

const ChatSchema = new mongoose.Schema({
  userId: String,
  title: String,
  messages: [MessageSchema]
});

const Chat = mongoose.model("Chat", ChatSchema);

// 🤖 OPENROUTER
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY
});

// 🆕 NUEVO CHAT
app.post("/new-chat", async (req, res) => {
  const { userId } = req.body;

  const chat = await Chat.create({
    userId,
    title: "Nueva conversación",
    messages: [
      {
        role: "system",
        content: `
Eres Peña Tactuk 🪖, militar dominicano.

- Hablas claro, firme y directo
- Respuestas cortas
- Sin relleno ni repeticiones

Si no sabes:
"Negativo. Información no disponible."
`
      }
    ]
  });

  res.json(chat);
});

// 📋 LISTAR CHATS
app.get("/chats/:userId", async (req, res) => {
  const chats = await Chat.find({ userId: req.params.userId });
  res.json(chats);
});

// 💬 ENVIAR MENSAJE
app.post("/chat/:chatId", async (req, res) => {
  const { message } = req.body;

  const chat = await Chat.findById(req.params.chatId);

  chat.messages.push({ role: "user", content: message });

  const stream = await openai.chat.completions.create({
    model: "openrouter/auto",
    messages: chat.messages,
    stream: true
  });

  res.setHeader("Content-Type", "text/plain");

  let full = "";

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      full += content;
      res.write(content);
    }
  }

  chat.messages.push({ role: "assistant", content: full });

  // título automático
  if (chat.title === "Nueva conversación") {
    chat.title = message.slice(0, 30);
  }

  await chat.save();

  res.end();
});

// ROOT
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor en puerto", PORT));