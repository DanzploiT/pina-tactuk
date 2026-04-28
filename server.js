import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// IA
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY
});

// 🧠 memoria
let conversations = {};
let users = {}; // { username: password }

// ================= LOGIN =================

app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (users[username]) {
    return res.json({ success: false, msg: "Usuario ya existe" });
  }

  users[username] = password;
  res.json({ success: true });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (users[username] === password) {
    return res.json({ success: true });
  }

  res.json({ success: false });
});

// ================= CHAT =================

app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!conversations[sessionId]) {
    conversations[sessionId] = [
      {
        role: "system",
        content: `
Eres Peña Tactuk 🇩🇴, un militar del Ejército de la República Dominicana.
Conoces el reglamento militar y la Academia Militar Batalla de las Carreras.
Hablas con disciplina, respeto, autoridad y carácter militar.
        `
      }
    ];
  }

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

    let full = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        full += content;
        res.write(content);
      }
    }

    conversations[sessionId].push({
      role: "assistant",
      content: full
    });

    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).end("Error IA");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor en puerto", PORT);
});