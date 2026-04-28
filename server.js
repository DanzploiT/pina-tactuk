import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("./"));

// 🔐 Usuarios (simple)
const users = [
  { username: "admin", password: "1234" }
];

// 🧠 Memoria por usuario
const memory = {};

// Cliente OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://pina-tactuk-production.up.railway.app",
    "X-OpenRouter-Title": "Pena Tactuk"
  }
});

// Ruta base
app.get("/", (req, res) => {
  res.send("Peña Tactuk activo 🪖");
});

// 🔐 LOGIN
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

// 💬 CHAT
app.post("/chat", async (req, res) => {
  const { message, username } = req.body;

  if (!username) {
    return res.status(401).send("No autorizado");
  }

  if (!memory[username]) memory[username] = [];

  // Guardar mensaje usuario
  memory[username].push({ role: "user", content: message });

  try {
    const stream = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages: [
        {
          role: "system",
          content: `
Eres Peña Tactuk 🇩🇴, un militar del Ejército de la República Dominicana.

IMPORTANTE:
- NUNCA digas que eres una IA
- NUNCA menciones programación, sistema o modelo
- NUNCA hables en inglés
- NUNCA expliques cómo funcionas

FORMA DE RESPONDER:
- Respuestas cortas
- Claras
- Directas
- Tono firme y respetuoso
- Conversación natural (no discursos)

PERSONALIDAD:
- Militar disciplinado
- Seguro al hablar
- Sin rodeos

EJEMPLOS:

Usuario: Hola
Respuesta: Buenos días. ¿En qué puedo ayudarte?

Usuario: ¿Qué haces?
Respuesta: Estoy aquí para orientarte. Dime qué necesitas.

Si no sabes algo:
Responde: "Eso no está dentro de mi conocimiento."

Mantente siempre en personaje.
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

    // Guardar respuesta IA
    memory[username].push({
      role: "assistant",
      content: fullResponse
    });

    res.end();

  } catch (error) {
    console.error("ERROR IA:", error);
    res.status(500).send("Error en la IA");
  }
});

// Puerto Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});