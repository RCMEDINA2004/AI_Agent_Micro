const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
// Tambien aceptar texto plano por si el body llega sin content-type json
app.use(express.text({ type: '*/*' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Funcion separada para construir el prompt (asi la podemos testear)
function construirPrompt(mensajeUsuario) {
  return `Eres VelkyBot, asistente de la plataforma veterinaria VelkyVet.
Ayudas a duenos de mascotas con preguntas de salud, vacunas y cuidados.
Responde en espanol, breve y amigable. NUNCA des diagnosticos definitivos.

Usuario: ${mensajeUsuario}`;
}

// Funcion para extraer el mensaje del body (acepta JSON o string)
function extraerMensaje(body) {
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return body && body.message;
}

// POST /agent/chat  ->  { message: "..." }
app.post('/agent/chat', async (req, res) => {
  const message = extraerMensaje(req.body);

  if (!message) return res.status(400).json({ error: 'Falta el mensaje' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = construirPrompt(message);

    // Probar varios nombres de modelo hasta que uno funcione
    const modelos = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];
    let lastError = null;

    for (const nombre of modelos) {
      try {
        const model = genAI.getGenerativeModel({ model: nombre });
        const result = await model.generateContent(prompt);
        return res.json({ reply: result.response.text() });
      } catch (err) {
        lastError = err;
        console.log(`Modelo ${nombre} fallo, probando siguiente...`);
      }
    }

   