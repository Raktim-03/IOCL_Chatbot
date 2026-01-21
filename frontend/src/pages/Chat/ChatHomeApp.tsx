import { FormEvent, useState, useEffect } from 'react'
import './App.css'
import './index.css'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Overlay from './Overlay'
import ChatArea from './ChatArea'

const API_URL = "http://localhost:3000/api";
const FASTAPI_URL = "http://localhost:8000";

interface ChatSession {
  session_id: string;
  created_at: string;
  message_count: number;
}

function ChatHomeApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [pendingMessage, setPendingMessage] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const hasMessages = messages.length > 0

  const toggleSidebar = () => setIsSidebarOpen((open) => !open)
  const closeSidebar = () => setIsSidebarOpen(false)

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": localStorage.getItem('token') || ""
  });

  // Fetch chat sessions on mount
  useEffect(() => {
    fetchChatSessions();
  }, []);

  const fetchChatSessions = async () => {
    try {
      const response = await fetch(`${FASTAPI_URL}/chat/sessions`);
      const data = await response.json();
      if (data.sessions) {
        setChatSessions(data.sessions);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const loadChatHistory = async (sid: string) => {
    try {
      const response = await fetch(`${FASTAPI_URL}/chat/history/${sid}`);
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        const formattedMessages = data.messages.map((msg: any) => 
          `${msg.role === 'user' ? 'You' : 'Bot'}: ${msg.content}`
        );
        setMessages(formattedMessages);
        setSessionId(sid);
        closeSidebar();
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  const deleteChatSession = async (sid: string) => {
    try {
      await fetch(`${FASTAPI_URL}/chat/history/${sid}`, { method: 'DELETE' });
      fetchChatSessions();
      if (sessionId === sid) {
        handleNewChat();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const deleteAllSessions = async () => {
    try {
      await fetch(`${FASTAPI_URL}/chat/history`, { method: 'DELETE' });
      fetchChatSessions();
      handleNewChat();
    } catch (error) {
      console.error("Failed to delete all sessions:", error);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = pendingMessage.trim()
    if (!trimmed || isLoading) return

    setMessages((prev) => [...prev, `You: ${trimmed}`])
    setPendingMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          message: trimmed,
          session_id: sessionId 
        }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        setMessages((prev) => [...prev, `Bot: ${data.reply}`]);
        if (data.session_id) {
          setSessionId(data.session_id);
          fetchChatSessions(); // Refresh sessions list
        }
      } else {
        setMessages((prev) => [...prev, `Bot: ${data.message || "Something went wrong."}`]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, "System: Connection to server failed."]);
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file || !file.name.endsWith('.pdf')) {
      setMessages((prev) => [...prev, "System: Please upload a PDF file."]);
      return;
    }

    setMessages((prev) => [...prev, `You: [Uploading ${file.name}...]`]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          "Authorization": localStorage.getItem('token') || ""
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessages((prev) => [...prev, `Bot: PDF uploaded successfully! What would you like to know from it?`]);
      } else {
        setMessages((prev) => [...prev, `Bot: Failed to upload PDF. ${data.message || ""}`]);
      }
    } catch (error) {
      console.error("Upload Error:", error);
      setMessages((prev) => [...prev, "System: Failed to upload file."]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
  }

  return (
    <div className="app-shell">
      <Navbar onMenuClick={toggleSidebar} />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onNewChat={handleNewChat}
        chatSessions={chatSessions}
        currentSessionId={sessionId}
        onSelectSession={loadChatHistory}
        onDeleteSession={deleteChatSession}
        onDeleteAllSessions={deleteAllSessions}
      />
      <Overlay isActive={isSidebarOpen} onClick={closeSidebar} />

      <main className={`main ${hasMessages ? 'main-chat' : 'main-centered'}`}>
        <ChatArea
          messages={messages}
          pendingMessage={pendingMessage}
          setPendingMessage={setPendingMessage}
          onSubmit={handleSubmit}
          onFileUpload={handleFileUpload}
          hasMessages={hasMessages}
          isLoading={isLoading}
        />
      </main>
    </div>
  )
}

export default ChatHomeApp