import { FormEvent, useState } from 'react'
import './App.css'
import './index.css'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Overlay from './Overlay'
import ChatArea from './ChatArea'

function ChatHomeApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [pendingMessage, setPendingMessage] = useState('')
  const hasMessages = messages.length > 0

  const toggleSidebar = () => setIsSidebarOpen((open) => !open)
  const closeSidebar = () => setIsSidebarOpen(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = pendingMessage.trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, `You: ${trimmed}`])
    setPendingMessage('')

    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem('token') || "" 
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();


      if (response.ok && data.reply) {
        setMessages((prev) => [...prev, `Bot: ${data.reply}`]);
      } else {
        setMessages((prev) => [...prev, "Bot: I am having trouble connecting to my brain right now."]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, "System: Connection to server failed."]);
    }
  }

  return (
    <div className="app-shell">
      <Navbar onMenuClick={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} />
      <Overlay isActive={isSidebarOpen} onClick={closeSidebar} />

      <main className={`main ${hasMessages ? 'main-chat' : 'main-centered'}`}>
        <ChatArea
          messages={messages}
          pendingMessage={pendingMessage}
          setPendingMessage={setPendingMessage}
          onSubmit={handleSubmit}
          hasMessages={hasMessages}
        />
      </main>
    </div>
  )
}

export default ChatHomeApp