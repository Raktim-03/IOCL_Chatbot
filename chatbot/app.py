import os
import base64
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
from typing import List

# Unstructured & LangChain
from unstructured.partition.pdf import partition_pdf
from langchain_groq import ChatGroq
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings # Updated import

load_dotenv()

app = FastAPI()

# Groq & DB Setup

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
llm = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=os.getenv("GROQ_API_KEY"))

# Database path
CHROMA_PATH = "db"

# PDF Processing Logic 
def process_pdf_to_rag(file_path):
    
    elements = partition_pdf(
        filename=file_path,
        strategy="hi_res",
        infer_table_structure=True,
        extract_image_block_types=["Image"],
        extract_image_block_to_payload=True
    )

    docs = []
    for element in elements:
        
        if "Table" in str(type(element)):
            docs.append(Document(page_content=element.metadata.text_as_html, metadata={"type": "table"}))
        else:
            docs.append(Document(page_content=element.text, metadata={"type": "text"}))

    
    vector_db = Chroma.from_documents(
        documents=docs, 
        embedding=embeddings, 
        persist_directory=CHROMA_PATH
    )
    return "Success"

# API Endpoints
@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    
    temp_path = f"temp_pdfs/{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())
    
    
    status = process_pdf_to_rag(temp_path)
    return {"status": status, "filename": file.filename}

@app.post("/chat")
async def chat(question: str = Form(...)):
    
    vector_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
    
   
    results = vector_db.similarity_search(question, k=6)
    context = "\n".join([res.page_content for res in results])
    
    
    prompt = f"""You are a professional assistant for IndianOil. 
Based on the provided context, answer the user's question clearly.
- Use short bullet points.
- Keep the language professional.
- If the information is not in the context, say you don't know.
    Context: {context}
    Question: {question}
    """
    response = llm.invoke(prompt)
    return {"answer": response.content}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)