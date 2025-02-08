import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import DOMPurify from "dompurify";
import "@/assets/styles/chat.css";

function Chat() {
  // Core states
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationMessage, setNotificationMessage] = useState('');
  const [messageRatings, setMessageRatings] = useState({});

  // UI states
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState("medium");

  // Enhanced features states
  const [sessionId] = useState(() => Date.now().toString());
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem("chatTemplates");
    return saved ? JSON.parse(saved) : [];
  });
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatHistory");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  // Handle dark mode
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Copy function
  const copyToClipboard = async (text, messageId) => {
    try {
        await navigator.clipboard.writeText(text);
        setCopiedMessageId(messageId);
        setNotificationMessage('Teks berhasil disalin!');
        setTimeout(() => {
            setCopiedMessageId(null);
            setNotificationMessage('');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        setNotificationMessage('Gagal menyalin teks');
    }
};

  // Message handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");

    addMessage("user", userMessage);

    try {
      setIsLoading(true);
      const response = await sendMessage(userMessage);
      addMessage("assistant", response);
    } catch (error) {
      console.error("Error:", error);
      addMessage("assistant", `Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (role, content) => {
    setMessages((prev) => [
      ...prev,
      {
        role,
        content,
        timestamp: new Date().toISOString(),
        id: Date.now(),
      },
    ]);
  };

  const sendMessage = async (message) => {
    const response = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  };

  // Template management
  const saveTemplate = (name, content) => {
    const newTemplate = { id: Date.now(), name, content };
    setTemplates((prev) => [...prev, newTemplate]);
    localStorage.setItem(
      "chatTemplates",
      JSON.stringify([...templates, newTemplate])
    );
  };

  // Utility functions
  const clearChat = () => {
    if (window.confirm("Anda yakin ingin menghapus riwayat chat?")) {
      setMessages([]);
      localStorage.removeItem("chatHistory");
    }
  };

  const exportChat = () => {
    const chatHistory = messages
      .map(
        (msg) =>
          `${msg.role} (${new Date(msg.timestamp).toLocaleString()}): ${
            msg.content
          }`
      )
      .join("\n\n");

    const blob = new Blob([chatHistory], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-history-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter messages
  const filteredMessages = searchQuery
    ? messages.filter((message) =>
        message.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Markdown renderer
  const customRenderers = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <div className="code-block-wrapper">
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
          <button
            onClick={() => copyToClipboard(String(children))}
            className="code-copy-button"
            title="Salin kode"
          >
            {copiedMessageId ? "✓" : "📋"}
          </button>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div
      className={`app-container ${
        darkMode ? "dark-mode" : ""
      } font-${fontSize}`}
    >
      <div className="chat-container">
      {notificationMessage && (
    <div className="notification">
        {notificationMessage}
    </div>
)}
        {/* Header */}
        <header className="chat-header">
          <div className="header-content">
            <h1>AI Assistant</h1>
            <div className="header-actions">
              <button
                className="icon-button"
                onClick={() => setShowSettings(!showSettings)}
                title="Pengaturan"
              >
                ⚙️
              </button>
              <button
                className="icon-button"
                onClick={() => setDarkMode(!darkMode)}
                title="Ubah Tema"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="search-container">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pesan..."
              className="search-input"
            />
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="settings-panel">
              <div className="settings-group">
                <button onClick={clearChat} className="settings-button">
                  Hapus Chat
                </button>
                <button onClick={exportChat} className="settings-button">
                  Ekspor Chat
                </button>
              </div>
              <div className="settings-group">
                <label>Ukuran Font:</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="font-select"
                >
                  <option value="small">Kecil</option>
                  <option value="medium">Sedang</option>
                  <option value="large">Besar</option>
                </select>
              </div>
            </div>
          )}
        </header>

        {/* Messages */}
        <div className="messages-container">
          <div className="chat-messages">
            {filteredMessages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-bubble">
                  {message.role === "assistant" && (
                    <div className="avatar">AI</div>
                  )}
                  <div className="message-content">
                    <ReactMarkdown
                      components={customRenderers}
                      children={DOMPurify.sanitize(message.content)}
                    />
                    <div className="message-actions">
                      {message.role === "assistant" && (
                        <button
                          onClick={() =>
                            copyToClipboard(message.content, message.id)
                          }
                          className="copy-button"
                          title="Salin pesan"
                        >
                          {copiedMessageId === message.id ? "✓" : "📋"}
                        </button>
                      )}
                      <span className="message-timestamp">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {copiedMessageId === message.id && (
                      <div className="copy-notification">
                        Teks berhasil disalin!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message assistant">
                <div className="message-bubble">
                  <div className="avatar">AI</div>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="chat-input-container">
          <form onSubmit={handleSubmit} className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pesan Anda di sini..."
              className="chat-input"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="send-button"
              disabled={isLoading || !input.trim()}
            >
              <span className="button-text">
                {isLoading ? "Mengirim..." : "Kirim"}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;
