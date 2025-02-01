import { useState } from 'react'
import '../assets/styles/Chat.css'

function Chat() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    
    setIsLoading(true)
    const userMessage = input
    setInput('')
    
    // Tambahkan pesan user
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }])

    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage })
      })
      
      const data = await response.json()
      
      // Tambahkan respon AI
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
}

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h1>Selamat datang di AI GRATIS</h1>
            <p>Apa yang ingin Anda tanyakan?</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="loading"> Tunggu sebentar BOZZZ...</div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan..."
            className="chat-input"
          />
          <button type="submit" className="send-button" disabled={isLoading}>
            Kirim
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat