// Pruebas unitarias del servicio AI-Agent (VelkyBot)
// Probamos:
// 1. construirPrompt(): que arme bien el prompt
// 2. extraerMensaje(): que sepa leer el body en distintos formatos
// 3. POST /agent/chat: validacion de errores
// 4. GET /health

const request = require('supertest');
const { app, construirPrompt, extraerMensaje } = require('../index');

describe('Servicio AI-Agent (VelkyBot)', () => {

  // ----------- construirPrompt() -----------
  describe('construirPrompt()', () => {

    test('incluye el mensaje del usuario en el prompt', () => {
      const prompt = construirPrompt('Mi perro esta enfermo');

      expect(prompt).toContain('Mi perro esta enfermo');
      expect(prompt).toContain('VelkyBot');
    });

    test('el prompt menciona que no debe dar diagnosticos', () => {
      const prompt = construirPrompt('Hola');

      expect(prompt).toContain('NUNCA');
      expect(prompt).toContain('diagnosticos');
    });
  });

 

  // ----------- POST /agent/chat -----------
  describe('POST /agent/chat', () => {

    test('devuelve 400 si no hay mensaje', async () => {
      const res = await request(app)
        .post('/agent/chat')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('devuelve 500 si no hay GEMINI_API_KEY configurada', async () => {
      // Borramos temporalmente la variable
      const original = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const res = await request(app)
        .post('/agent/chat')
        .send({ message: 'Hola' });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('GEMINI_API_KEY');

      // Restauramos la variable
      if (original) process.env.GEMINI_API_KEY = original;
    });
  });

  // ----------- GET /health -----------
  describe('GET /health', () => {

    test('devuelve ok true', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

});
