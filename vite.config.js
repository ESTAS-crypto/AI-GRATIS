import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd())

    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            port: 5173,
            strictPort: true,
            host: true,
            open: true
        },
        build: {
            outDir: 'dist',
            sourcemap: true,
            commonjsOptions: {
                include: []
            }
        }
    }
})