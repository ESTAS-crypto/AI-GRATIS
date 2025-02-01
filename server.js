import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/chat', async(req, res) => {
    const { message } = req.body;

    try {
        const ollama = spawn('ollama', ['run', 'deepseek-r1:1.5b', message]);

        let response = '';

        ollama.stdout.on('data', (data) => {
            response += data.toString();
        });

        ollama.stderr.on('data', (data) => {
            console.error(`Error: ${data}`);
        });

        ollama.on('close', (code) => {
            if (code !== 0) {
                res.status(500).json({ error: 'Failed to get response from Ollama' });
            } else {
                res.json({ response });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});