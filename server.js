// server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const messageContexts = new Map();

app.post('/chat', async(req, res) => {
    const { message, sessionId } = req.body;
    console.log('Received message:', message);

    const context = messageContexts.get(sessionId) || [];

    // Sistem prompt yang lebih terstruktur dan detail
    const systemPrompt = `Anda adalah asisten AI senior yang sangat ahli dalam pemrograman, pengembangan web, dan dokumentasi teknis. Anda selalu memberikan jawaban yang detail, akurat, dan dalam bahasa Indonesia yang jelas.

PANDUAN UTAMA:
1. Selalu pahami konteks pertanyaan dengan cermat
2. Berikan jawaban yang relevan dan tepat sasaran
3. Jika diminta membuat sesuatu, berikan contoh lengkap dan detail
4. Jika ada yang kurang jelas, tetap berikan solusi terbaik yang relevan

KETIKA DIMINTA MEMBUAT KODE:
1. Berikan kode lengkap yang siap pakai
2. Sertakan semua file yang diperlukan (HTML, CSS, JavaScript, dll)
3. Berikan penjelasan detail untuk setiap bagian kode
4. Tambahkan komentar pada bagian-bagian penting
5. Jelaskan cara penggunaan dan implementasi

KETIKA DIMINTA MEMBUAT HTML/CSS:
1. Berikan struktur HTML yang lengkap dan semantik
2. Sertakan CSS yang diperlukan dengan styling yang baik
3. Gunakan best practices dan standar modern
4. Pastikan kode bersih dan terorganisir
5. Berikan penjelasan untuk setiap bagian penting

KETIKA MENJAWAB PERTANYAAN:
1. Berikan jawaban langsung dan informatif
2. Sertakan contoh jika diperlukan
3. Jelaskan konsep dengan bahasa yang mudah dipahami
4. Berikan referensi atau sumber jika relevan

CATATAN PENTING:
- Jangan memberikan jawaban yang tidak relevan
- Jangan mengabaikan detail dari pertanyaan
- Selalu berikan solusi praktikal dan dapat diimplementasikan
- Jika ada bagian yang kompleks, jelaskan step by step

Konteks percakapan sebelumnya:
${context.map(c => c).join('\n')}

Pesan dari pengguna:
${message}

Mohon berikan jawaban yang detail dan tepat dalam bahasa Indonesia:`;

    try {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek-r1:1.5b',
                prompt: systemPrompt,
                max_tokens: 8000, // Ditingkatkan untuk jawaban lebih lengkap
                temperature: 0.8, // Sedikit ditingkatkan untuk kreativitas
                top_p: 0.95,
                frequency_penalty: 0.3,
                presence_penalty: 0.3,
                stop: ['Pesan dari pengguna:', 'Konteks percakapan:', 'PANDUAN UTAMA:'],
                stream: false
            }),
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama error: ${ollamaResponse.statusText}`);
        }

        const data = await ollamaResponse.json();
        let cleanResponse = data.response.trim();

        // Verifikasi kualitas respons
        const needsRetry =
            cleanResponse.length < 50 || // Terlalu pendek
            cleanResponse.toLowerCase().includes('maaf, saya tidak bisa') ||
            cleanResponse.toLowerCase().includes('saya tidak yakin') ||
            !cleanResponse.includes(' '); // Kemungkinan respons error

        if (needsRetry) {
            // Coba lagi dengan prompt yang lebih spesifik
            const retryPrompt = `${systemPrompt}\n\nPERHATIAN KHUSUS: Mohon berikan jawaban yang sangat detail dan lengkap untuk pertanyaan ini. Jika diminta membuat sesuatu, berikan contoh konkret dan lengkap. Jangan berikan jawaban yang tidak relevan atau terlalu singkat.\n\nPertanyaan: ${message}`;

            const retryResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'deepseek-r1:1.5b',
                    prompt: retryPrompt,
                    max_tokens: 8000,
                    temperature: 0.7,
                    top_p: 1,
                    frequency_penalty: 0.5,
                    presence_penalty: 0.5,
                    stream: false
                }),
            });

            if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                cleanResponse = retryData.response.trim();
            }
        }

        // Post-processing untuk memastikan format jawaban
        cleanResponse = cleanResponse
            .replace(/^\s*```\s*$/, '') // Hapus blok kode kosong
            .replace(/^(Jawaban|Solusi|Response):\s*/i, '') // Hapus prefix yang tidak perlu
            .trim();

        // Update konteks dengan jawaban yang sudah diverifikasi
        if (sessionId) {
            const newContext = [
                ...context,
                `User: ${message}`,
                `Assistant: ${cleanResponse}`
            ].slice(-6); // Simpan 6 interaksi terakhir
            messageContexts.set(sessionId, newContext);
        }

        res.json({ response: cleanResponse });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'Gagal mendapatkan respons dari Ollama',
            details: error.message
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});