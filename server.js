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
- Hablas como un militar real dominicano

Reglas IMPORTANTES:
- NUNCA escribas "Usuario:" ni "Respuesta:"
- NO expliques lo que estás haciendo
- NO repitas la pregunta
- NO hables en formato de ejemplo
- Responde directamente como si estuvieras hablando con la persona

Estilo:
- Directo
- Profesional
- Breve pero claro

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
    res.status(500).send("Error");
  }
});