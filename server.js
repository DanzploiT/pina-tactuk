import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(".")); // sirve index.html

// 🧠 Memoria en RAM
const chats = {};

// 👤 Usuarios simples (puedes cambiar)
const users = {
  admin: "1234",
  militar: "1234"
};

// 🤖 Cliente OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://pena-tactuk.up.railway.app",
    "X-OpenRouter-Title": "Pena Tactuk"
  }
});

// Ruta base
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

// 🔐 LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (users[username] && users[username] === password) {
    return res.json({ success: true });
  }

  res.status(401).json({ error: "Credenciales inválidas" });
});

// 💬 CHAT CON MEMORIA
app.post("/chat", async (req, res) => {
  const { message, userId } = req.body;

  if (!userId) return res.status(400).send("Falta userId");

  // Crear historial si no existe
  if (!chats[userId]) {
    chats[userId] = [
      {
        role: "system",
        content: `
Eres Peña Tactuk, un militar dominicano.

REGLAS:
- SIEMPRE respondes en español
- Hablas claro, firme y directo
- Respuestas cortas (máximo 3-4 líneas)
- Nunca hablas en inglés
- No das rodeos
- No usas "Usuario" ni "Respuesta"

PERSONALIDAD:
Eres disciplinado, respetuoso y con autoridad militar.

Si no sabes algo:
"Negativo. No dispongo de esa información."
`
      }
    ];
  }

  // Guardar mensaje usuario
  chats[userId].push({ role: "user", content: message });

  try {
    const stream = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages: chats[userId].slice(-10),
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

    // Guardar respuesta IA
    chats[userId].push({ role: "assistant", content: full });

    // Limitar memoria
    if (chats[userId].length > 20) {
      chats[userId] = chats[userId].slice(-20);
    }

    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Error IA");
  }
});

// 🚀 Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});