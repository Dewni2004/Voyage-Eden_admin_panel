import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors()); // Allow frontend to call backend (useful for local dev)
app.use(express.json());

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'dist')));

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = 'https://api.deepl.com/v2/translate';

app.post('/api/translate', async (req, res) => {
    const { text, target_lang } = req.body;

    if (!DEEPL_API_KEY) {
        return res.status(500).json({ error: 'DeepL API key is missing in backend .env' });
    }

    try {
        const response = await fetch(DEEPL_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: Array.isArray(text) ? text : [text],
                target_lang: target_lang
            }),
        });

        if (!response.ok) {
            throw new Error(`DeepL API error: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Backend translation error:", error);
        res.status(500).json({ error: 'Translation failed' });
    }
});

// Anything that doesn't match an API route should serve the React app
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});
