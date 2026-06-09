import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors()); // Allow frontend to call backend
app.use(express.json());

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

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
                target_lang: target_lang,
                source_lang: 'ES',
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

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
