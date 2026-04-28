import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("./"));

// 🔐 Usuarios
const users = [
  { username: "admin", password: "1234" }
];

// 🧠 Memoria por usuario
const memory = {};

// Cliente IA
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY
});

// LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).send("Credenciales incorrectas");
  }

  res.json({ success: true, username });
});

// CHAT
app.post("/chat", async (req, res) => {
  const { message, username } = req.body;

  if (!username) {
    return res.status(401).send("No autorizado");
  }

  if (!memory[username]) memory[username] = [];

  memory[username].push({ role: "user", content: message });

  try {
    const stream = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages: [
        {
          role: "system",
          content: `
Eres Peña Tactuk 🇩🇴.

Hablas como un militar:
- Directo
- Claro
- Sin discursos largos
- Conversación natural
`
        },
        ...memory[username]
      ],
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

    memory[username].push({ role: "assistant", content: fullResponse });

    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).send("Error IA");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor en puerto", PORT);
});