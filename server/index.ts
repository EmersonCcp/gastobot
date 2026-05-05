import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { parseExpenseText } from './services/nlp.service';
import { appendToSheet, getSummary, getCajas, addCaja } from './services/google-sheets.service';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.send('GastoBot API is running');
});

app.get('/api/summary', async (req, res) => {
  try {
    const summary = await getSummary();
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cajas', async (req, res) => {
  try {
    const cajas = await getCajas();
    res.json(cajas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cajas', async (req, res) => {
  const { nombre } = req.body;
  try {
    await addCaja(nombre);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/process', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No se proporcionó texto' });
  }

  try {
    console.log('Analizando:', text);
    const cajasDisponibles = await getCajas();
    const data = await parseExpenseText(text, cajasDisponibles);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: 'Error analizando la solicitud', details: error.message });
  }
});

app.post('/api/save', async (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: 'No se proporcionaron datos para guardar' });
  }

  try {
    await appendToSheet(data);
    res.json({ success: true, message: 'Guardado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al guardar en el Excel' });
  }
});

// Serve static files from the React app
const clientPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientPath));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('(.*)', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Serving client from: ${clientPath}`);
});

