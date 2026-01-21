import { FormEvent, useRef, ChangeEvent } from 'react'

interface ChatAreaProps {
  messages: string[]
  pendingMessage: string
  setPendingMessage: (message: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onFileUpload: (file: File) => void
  hasMessages: boolean
  isLoading: boolean
}

function ChatArea({ messages, pendingMessage, setPendingMessage, onSubmit, onFileUpload, hasMessages, isLoading }: ChatAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileUpload(file)
      event.target.value = ''
    }
  }

  return (
    <div className="chat-area">
      {hasMessages && (
        <div className="messages" aria-live="polite">
          {messages.map((message, index) => {
            const isUser = message.startsWith("You:");
            const isBot = message.startsWith("Bot:");
            const isSystem = message.startsWith("System:");
            
            return (
              <div 
                key={index} 
                className={`chat-bubble ${isUser ? 'user' : isBot ? 'bot' : isSystem ? 'system' : ''}`}
              >
                <span>{message}</span>
              </div>
            );
          })}
          {isLoading && (
            <div className="chat-bubble bot">
              <span>Bot: Thinking...</span>
            </div>
          )}
        </div>
      )}

      <form
        className={`input-box ${hasMessages ? 'input-bottom' : 'input-centered'}`}
        onSubmit={onSubmit}
      >
        <button 
          className="add" 
          type="button" 
          title="Upload PDF"
          onClick={handleFileClick}
          disabled={isLoading}
        >
          <i className="fa-solid fa-plus" aria-hidden="true" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          aria-hidden="true"
        />
        <input
          id="imp"
          type="text"
          placeholder="Enter your query related to IOCL"
          value={pendingMessage}
          onChange={(event) => setPendingMessage(event.target.value)}
          disabled={isLoading}
        />
        <button className="btn1" type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Search'}
        </button>
      </form>
    </div>
  )
}

export default ChatArea