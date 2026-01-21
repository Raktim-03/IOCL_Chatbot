import os
import base64
import uuid
from datetime import datetime
from typing import Optional, List
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

# LangChain imports
import fitz  # pymupdf
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq & Embeddings Setup
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
llm = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=os.getenv("GROQ_API_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Database path
CHROMA_PATH = "db"

# Ensure temp_pdfs folder exists
os.makedirs("temp_pdfs", exist_ok=True)

# Chat history storage (in-memory, use database for production)
chat_sessions = {}  # {session_id: {"created_at": datetime, "messages": [...]}}

# Pydantic models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: str

class ChatSession(BaseModel):
    session_id: str
    created_at: str
    messages: List[ChatMessage]

# Text splitter for chunking documents
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

# Extract text from image using Groq Vision
def extract_text_with_groq_vision(image_bytes):
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    response = groq_client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract ALL text from this image exactly as it appears. Include all content, numbers, tables, and formatting. Return only the extracted text, nothing else."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=4096
    )
    return response.choices[0].message.content

# PDF Processing Logic 
def process_pdf_to_rag(file_path):
    try:
        # Use pymupdf directly - more robust than PyPDFLoader
        doc = fitz.open(file_path)
        all_text = ""
        
        # First try to extract text directly
        for page in doc:
            all_text += page.get_text()
        
        if len(all_text.strip()) < 50:  # Likely scanned PDF, use Groq Vision
            all_text = ""
            for page_num in range(len(doc)):
                page = doc[page_num]
                # Convert page to image
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better quality
                img_bytes = pix.tobytes("png")
                
                # Extract text using Groq Vision
                page_text = extract_text_with_groq_vision(img_bytes)
                all_text += f"\n--- Page {page_num + 1} ---\n{page_text}"
        
        doc.close()
        
        if not all_text.strip():
            return "No text content found in PDF"
        
        # Create documents from extracted text
        documents = [Document(page_content=all_text, metadata={"source": file_path})]
        docs = text_splitter.split_documents(documents)
        
        if not docs:
            return "No text content found in PDF"
        
        # Store in vector DB
        vector_db = Chroma.from_documents(
            documents=docs, 
            embedding=embeddings, 
            persist_directory=CHROMA_PATH
        )
        return f"Success - {len(docs)} chunks indexed"
    
    except Exception as e:
        return f"Error processing PDF: {str(e)}"

@app.get("/")
def read_root():
    return {"message": "IOCL Chatbot API is running!"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    temp_path = f"temp_pdfs/{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())
    
    status = process_pdf_to_rag(temp_path)
    return {"status": status, "filename": file.filename}

@app.post("/chat")
async def chat(
    question: str = Form(...),
    session_id: Optional[str] = Form(None)
):
    # Create or get session
    if not session_id or session_id not in chat_sessions:
        session_id = str(uuid.uuid4())
        chat_sessions[session_id] = {
            "created_at": datetime.now().isoformat(),
            "messages": []
        }
    
    # Get chat history for context
    session = chat_sessions[session_id]
    chat_history = session["messages"][-10:]  # Last 10 messages for context
    
    # Format chat history for prompt
    history_text = ""
    if chat_history:
        history_text = "\nPrevious conversation:\n"
        for msg in chat_history:
            history_text += f"{msg['role'].capitalize()}: {msg['content']}\n"
    
    # Get relevant context from vector DB
    vector_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
    results = vector_db.similarity_search(question, k=6)
    context = "\n".join([res.page_content for res in results])
    
    prompt = f"""You are a friendly and knowledgeable assistant for Indian Oil Corporation Limited (IOCL). 
Your name is IOCL Assistant. Respond naturally like a helpful colleague, not like a robot.

Guidelines:
- Be conversational and warm, but professional
- Give direct, concise answers without unnecessary preambles like "Based on the context" or "According to the provided information"
- Use simple language that's easy to understand
- When listing points, use natural flow rather than always using bullet points
- If asked for a summary, provide a clear and engaging overview
- If you don't know something, politely say so and offer to help with something else
- Remember the conversation context and refer back to it naturally
{history_text}
Context from documents:
{context}

User's question: {question}

Respond naturally and helpfully:"""
    response = llm.invoke(prompt)
    
    # Save to chat history
    timestamp = datetime.now().isoformat()
    session["messages"].append({
        "role": "user",
        "content": question,
        "timestamp": timestamp
    })
    session["messages"].append({
        "role": "assistant",
        "content": response.content,
        "timestamp": timestamp
    })
    
    return {
        "answer": response.content,
        "session_id": session_id
    }

@app.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    if session_id not in chat_sessions:
        return {"error": "Session not found", "messages": []}
    
    session = chat_sessions[session_id]
    return {
        "session_id": session_id,
        "created_at": session["created_at"],
        "messages": session["messages"]
    }

@app.get("/chat/sessions")
async def list_sessions():
    sessions = []
    for sid, session in chat_sessions.items():
        sessions.append({
            "session_id": sid,
            "created_at": session["created_at"],
            "message_count": len(session["messages"])
        })
    return {"sessions": sessions}

@app.delete("/chat/history/{session_id}")
async def delete_chat_history(session_id: str):
    if session_id not in chat_sessions:
        return {"error": "Session not found"}
    
    del chat_sessions[session_id]
    return {"message": f"Session {session_id} deleted successfully"}

@app.delete("/chat/history")
async def delete_all_chat_history():
    count = len(chat_sessions)
    chat_sessions.clear()
    return {"message": f"All {count} sessions deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)