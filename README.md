# IOCL_Chatbot

## Project Overview

To design and develop an AI-powered conversational chatbot that provides instant, accurate responses to frequently asked operational, safety, HR, and internship-related queries at IOCL by extracting information from official documents and manuals.

## Project Structure

```
IOCL/
├── frontend/              # React-based UI
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/               # Express.js API server
│   ├── server.js
│   └── package.json
├── chatbot/               # Python FastAPI chatbot service
│   └── .venv/            # Virtual environment (install here)
├── docs/                  # Documentation
├── .gitignore
└── README.md
```

## Tech Stack

- **Frontend**: React.js
- **Backend**: Express.js (Node.js)
- **Chatbot**: FastAPI (Python)
- **Dependencies**: Axios, CORS, dotenv

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+

### 1. Frontend Setup

```bash
cd frontend
npm install
npm start
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

### 3. Chatbot Setup (Python/FastAPI)

```bash
cd chatbot
python -m venv .venv
.venv\Scripts\Activate          # Windows
# source .venv/bin/activate    # macOS/Linux
pip install fastapi uvicorn[standard]
pip freeze > requirements.txt
```

Run the chatbot:

```bash
uvicorn main:app --reload
```

## Environment Variables

Create `.env` files in `backend/` and `chatbot/` as needed (already ignored in .gitignore).

##Screenshots
![4](https://github.com/user-attachments/assets/8a36fb28-ef23-47e5-be78-abc1e9370106)
![3](https://github.com/user-attachments/assets/d95333f2-2432-4ba6-9c6f-838a87fa99e1)
![2](https://github.com/user-attachments/assets/dba4348f-28ab-4103-a3ba-68b406d1a55d)
![1](https://github.com/user-attachments/assets/5aefbd3c-fe0e-4db5-9fe4-83d6b3f8e00c)


## Contributing

Please follow the project structure and commit conventions. ::
