import { useNavigate } from 'react-router-dom'

interface ChatSession {
  session_id: string;
  created_at: string;
  message_count: number;
}

interface SidebarProps {
  isOpen: boolean
  onNewChat?: () => void
  chatSessions?: ChatSession[]
  currentSessionId?: string | null
  onSelectSession?: (sessionId: string) => void
  onDeleteSession?: (sessionId: string) => void
  onDeleteAllSessions?: () => void
}

function Sidebar({ 
  isOpen, 
  onNewChat, 
  chatSessions = [], 
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onDeleteAllSessions 
}: SidebarProps) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    navigate('/login');
    window.location.reload();
  }

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className={`sidebar ${isOpen ? 'active' : ''}`} id="sidebar">

      <div className="sidebar-top-card" />

      {/* Chat History Section */}
      <div className="chat-history-section">
        <div className="history-header">
          <span>Chat History</span>
          {chatSessions.length > 0 && (
            <button 
              className="clear-all-btn" 
              onClick={onDeleteAllSessions}
              title="Clear all chats"
            >
              <i className="fa-solid fa-trash" />
            </button>
          )}
        </div>
        <div className="history-list">
          {chatSessions.length === 0 ? (
            <p className="no-history">No chat history</p>
          ) : (
            chatSessions.map((session) => (
              <div 
                key={session.session_id} 
                className={`history-item ${currentSessionId === session.session_id ? 'active' : ''}`}
                onClick={() => onSelectSession && onSelectSession(session.session_id)}
              >
                <div className="history-item-content">
                  <i className="fa-regular fa-message" />
                  <div className="history-item-info">
                    <span className="history-date">{formatDate(session.created_at)}</span>
                    <span className="history-count">{session.message_count} messages</span>
                  </div>
                </div>
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession && onDeleteSession(session.session_id);
                  }}
                  title="Delete chat"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="side-cards grid">
        <div
          className="side-box card"
          onClick={() => window.open('https://iocl.com/', '_blank')}
        >
          <i className="fa-solid fa-house" />
          <span>Home Page</span>
        </div>

        <div
          className="side-box card"
          onClick={() => window.open('/AnnuaReport_2004_05.pdf', '_blank')}
        >
          <i className="fa-solid fa-circle-info" />
          <span>About</span>
        </div>

        <div
          className="side-box card"
          onClick={() => window.open('/HSE-brochure.pdf', '_blank')}
        >
          <i className="fa-solid fa-helmet-safety" />
          <span>Safety Guidances</span>
        </div>

        <div
          className="side-box card"
          onClick={() => window.open('https://iocl.com/pages/ppump', '_blank')}
        >
          <i className="fa-solid fa-gas-pump" />
          <span>Pump Approval</span>
        </div>

        <div
          className="side-box card"
          onClick={() => window.open('https://iocl.com/pages/careers-overview', '_blank')}
        >
          <i className="fa-solid fa-briefcase" />
          <span>Careers</span>
        </div>

        <div
          className="side-box card"
          onClick={() => window.open('https://iocl.com/contact-us', '_blank')}
        >
          <i className="fa-solid fa-address-book" />
          <span>Contact Us</span>
        </div>
      </div>

      <div className="side-menu bottom">
        <div className="side-action" onClick={handleNewChat}>
          <i className="fa-regular fa-comments" />
          <span>New Chat</span>
        </div>

        <div className="side-action logout" onClick={handleLogout}>
          <i className="fa-solid fa-right-from-bracket" />
          <span>Logout</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
