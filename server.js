import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo conectado"))
  .catch(err => console.log(err));

// ================= MODELOS =================
const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  password: String
}));

const Chat = mongoose.model("Chat", new mongoose.Schema({
  userId: String,
  messages: Array
}));

// ================= OPENROUTER =================
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY
});

// ================= AUTH =================

// Registro
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const exist = await User.findOne({ username });
  if (exist) return res.status(400).send("Usuario existe");

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hash });

  res.json({ userId: user._id });
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(401).send("No existe");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).send("Incorrecto");

  res.json({ userId: user._id });
});

// ================= CHAT =================
app.post("/chat", async (req, res) => {
  const { message, userId } = req.body;

  if (!userId) return res.status(400).send("Falta userId");

  let chat = await Chat.findOne({ userId });

  if (!chat) {
    chat = await Chat.create({
      userId,
      messages: [
        {
          role: "system",
          content: `
Eres Peña Tactuk 🪖, militar dominicano.

- Hablas firme, claro y directo
- Sin rodeos
- No repites preguntas
- Nunca digas que eres IA

Si no sabes algo:
"Negativo. No dispongo de esa información."
`
        }
      ]
    });
  }

  chat.messages.push({ role: "user", content: message });

  try {
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

    if (chat.messages.length > 30) {
      chat.messages = chat.messages.slice(-30);
    }

    await chat.save();

    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Error IA");
  }
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor en puerto", PORT);
});