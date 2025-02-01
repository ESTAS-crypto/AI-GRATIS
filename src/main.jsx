import React from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css"
import App from "./App.jsx"
// Hapus baris import "./assets/styles/chat.jsx" karena tidak diperlukan

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)