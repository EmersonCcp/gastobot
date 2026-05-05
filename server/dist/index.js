"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const nlp_service_1 = require("./services/nlp.service");
const google_sheets_service_1 = require("./services/google-sheets.service");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Routes
app.get('/api/health', (req, res) => {
    res.send('GastoBot API is running');
});
app.get('/api/summary', async (req, res) => {
    try {
        const summary = await (0, google_sheets_service_1.getSummary)();
        res.json(summary);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/cajas', async (req, res) => {
    try {
        const cajas = await (0, google_sheets_service_1.getCajas)();
        res.json(cajas);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/cajas', async (req, res) => {
    const { nombre } = req.body;
    try {
        await (0, google_sheets_service_1.addCaja)(nombre);
        res.json({ success: true });
    }
    catch (error) {
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
        const cajasDisponibles = await (0, google_sheets_service_1.getCajas)();
        const data = await (0, nlp_service_1.parseExpenseText)(text, cajasDisponibles);
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ error: 'Error analizando la solicitud', details: error.message });
    }
});
app.post('/api/save', async (req, res) => {
    const { data } = req.body;
    if (!data) {
        return res.status(400).json({ error: 'No se proporcionaron datos para guardar' });
    }
    try {
        await (0, google_sheets_service_1.appendToSheet)(data);
        res.json({ success: true, message: 'Guardado correctamente' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al guardar en el Excel' });
    }
});
// Serve static files from the React app
const clientPath = path_1.default.join(__dirname, '../../client/dist');
app.use(express_1.default.static(clientPath));
// The "catchall" handler: for any request that doesn't
// match one of the API routes, send back React's index.html file.
app.use((req, res) => {
    res.sendFile(path_1.default.join(clientPath, 'index.html'));
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Serving client from: ${clientPath}`);
});
