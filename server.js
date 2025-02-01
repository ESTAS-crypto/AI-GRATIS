import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; // Tambahkan ini

const app = express();

app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

app.post('/chat', async(req, res) => {
    const { message } = req.body;
    console.log('Received message:', message);

    try {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek-r1:1.5b',
                prompt: message,
                stream: false
            }),
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama error: ${ollamaResponse.statusText}`);
        }

        const data = await ollamaResponse.json();
        res.json({ response: data.response });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'Failed to get response from Ollama',
            details: error.message
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});