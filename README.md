# 📄 ContractIQ AI
### Enterprise AI Contract Intelligence Platform

ContractIQ AI is an enterprise-grade AI-powered Contract Intelligence Platform that helps organizations understand, analyze, compare, and manage legal contracts using Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), Semantic Search, and Knowledge Graphs.

Instead of relying on keyword search, ContractIQ AI understands the meaning of contract clauses, identifies risks, extracts important entities, and allows users to chat with their contracts using natural language.

---

## 🚀 Features

### 🔐 Authentication
- JWT Authentication
- Secure Login & Registration
- Protected Routes

### 📂 Contract Management
- Upload PDF Contracts
- Upload DOCX Contracts
- Automatic Text Extraction
- Metadata Storage

### 🤖 AI Analysis
- AI Contract Summary
- Clause Classification
- Risk Detection
- Obligation Extraction
- Important Date Extraction
- Key Entity Recognition

### 🔍 Intelligent Search
- Semantic Search
- Vector Similarity Search
- AI-powered Retrieval
- Citation-based Answers

### 💬 AI Chat
- Chat with Contracts
- Context-aware Responses
- Multi-document Question Answering
- Conversational RAG

### 📊 Dashboard
- Total Contracts
- High Risk Contracts
- Expiring Contracts
- AI Analytics
- Search History

### 📑 Contract Comparison
- Compare Multiple Contracts
- Highlight Clause Differences
- Risk Comparison
- Missing Clause Detection

### 🧠 Knowledge Graph
- Organization Relationships
- Vendor Mapping
- Contract Dependencies
- Clause Relationships

---

# 🏗️ System Architecture

```
                        User
                          │
                          ▼
                  React Frontend
                          │
                REST API / JWT Auth
                          │
                    Express Backend
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
 PostgreSQL         Vector Database      AI Models
   Metadata            Embeddings      Gemini / OpenAI
        │                 │                 │
        └────────────── RAG Pipeline ───────┘
                          │
                    AI Response Engine
```

---

# 🛠️ Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Axios

## Backend

- Node.js
- Express.js
- JWT Authentication
- Multer
- PDF Parser
- DOCX Parser

## Database

- PostgreSQL
- pgvector

## AI

- Google Gemini API
- OpenAI API (Optional)
- LangChain
- Sentence Transformers
- RAG Pipeline

## Other Tools

- Git
- GitHub
- Antigravity IDE

---

# 📁 Project Structure

```
ContractIQ_AI/

│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   ├── utils/
│   └── server.js
│
├── database/
│
├── docs/
│
├── README.md
│
└── .env
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/JISHNU322/Contract_IQ.git

cd Contract_IQ
```

---

## Backend Setup

```bash
cd backend

npm install

npm run dev
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## Environment Variables

Create a `.env` file inside the backend folder.

```env
PORT=5000

JWT_SECRET=your_secret_key

DATABASE_URL=your_database_url

GEMINI_API_KEY=your_gemini_api_key

OPENAI_API_KEY=optional
```

---

# 📌 Workflow

```
Upload Contract
       │
       ▼
Extract Text
       │
       ▼
Chunk Document
       │
       ▼
Generate Embeddings
       │
       ▼
Store in Vector Database
       │
       ▼
Semantic Retrieval
       │
       ▼
LLM Response
```

---

# 🧠 AI Capabilities

- Retrieval-Augmented Generation (RAG)
- Semantic Search
- Context-aware Question Answering
- Contract Summarization
- Legal Clause Classification
- Risk Analysis
- Entity Extraction
- Deadline Detection
- Multi-document Retrieval

---

# 📸 Screenshots

> Add screenshots of:

-Login Page
- Dashboard
- Upload Contract
- AI Chat
- Risk Analysis
- Contract Comparison
- Analytics Dashboard

---

# 🎯 Future Enhancements

- OCR Support
- Multi-language Contracts
- Voice-based Contract Search
- Knowledge Graph Visualization
- AI Contract Drafting
- Clause Recommendation
- Email Notifications
- Calendar Integration
- Team Collaboration
- Role-based Access Control
- Docker Deployment
- Kubernetes Support

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```
git checkout -b feature-name
```

3. Commit your changes

```
git commit -m "Added new feature"
```

4. Push to GitHub

```
git push origin feature-name
```

5. Create a Pull Request

---

# 👨‍💻 Author

**Jishnu Chakraborty**

B.Tech CSE Student

Full Stack Developer | AI Enthusiast | RAG Developer

GitHub:
https://github.com/JISHNU322

LinkedIn:
https://www.linkedin.com/in/jishnu-chakraborty-a2a664275/

---

# ⭐ Support

If you found this project useful,

⭐ Star this repository

🍴 Fork it
