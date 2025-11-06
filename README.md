# Multiagent-Elicitation
#### elicitation team meeting agent tool 



A real-time AI-powered meeting platform built using React (Vite) for the frontend and Flask for the backend.
It enables users to create meetings, join sessions, and automatically transcribe, summarize, and analyze meetings using advanced AI Agents.

## 🚀 Tech Stack
### 🖥️ Frontend

⚛️ React (Vite)

🎨 Tailwind CSS / shadcn-ui

🔊 Azure Speech-to-Text (STT)

🧩 Supabase (Authentication & Storage)

🧠 WebRTC for real-time video and audio

### ⚙️ Backend

🐍 Flask

💾 MongoDB

🔐 Supabase

🤖 OpenAI API

☁️ Azure Speech Services

🧠 Python 3.9+

## 🔑 Environment Variables

Create a .env file in the root of your project and include the following keys:
```
VITE_AZURE_KEY=<your_azure_key>
VITE_AZURE_REGION=<your_azure_region>
VITE_SUPABASE_URL=<your_supabase_project_url>
VITE_SUPABASE_KEY=<your_supabase_api_key>
MONGO_URI=<your_mongodb_connection_uri>
OPENAI_API_KEY=<your_openai_api_key>
OLLAMA_BASE_URL=<your_ollama_url>
```

## ⚙️ Installation & Setup

Follow the steps below to set up and run the project locally.

### 1️⃣ Clone the Repository
git clone https://github.com/html5technologies786/multiagent-elicitation.git
cd multiagent-elicitation

### 2️⃣ Backend Setup (Flask)
#### Step 1: Navigate to Backend Folder
cd backend

#### Step 2: Create a Virtual Environment
python -m venv venv

#### Step 3: Activate the Virtual Environment

### Windows:

venv\Scripts\activate

macOS / Linux:

source venv/bin/activate

#### Step 4: Install Dependencies
pip install -r requirements.txt

#### Step 5: Run the Flask Server
python api.py


### The backend will start running on:
 👉 http://localhost:5000

## 3️⃣ Frontend Setup (React + Vite)
#### Step 1: Navigate to Frontend Folder
cd ../frontend

#### Step 2: Install Dependencies
npm install

#### Step 3: Run the Development Server
npm run dev


### The frontend will start running on:
👉 http://localhost:5173

## 🧩 Features

✅ User Authentication (via Supabase)
✅ Create & Join Meetings
✅ Real-time Speech-to-Text (Azure STT)
✅ Multi-Agent AI Discussion System
✅ AI-generated MVP and Vision
✅ Automatic Transcript Storage (MongoDB)
✅ End Meeting Report Dashboard
✅ Multi-team AI Evaluation (OpenAI, Mistral, Ollama)

## 🧠 AI Agent Workflow

Meeting starts — Azure converts speech into text in real time.

Transcripts are stored in MongoDB every few seconds.

AI agents (OpenAI, Mistral, and Ollama teams) analyze the transcripts.

Each team generates MVP and Vision drafts based on conversation context.

At the end of the meeting, a Synthesizer Agent merges the outputs.

The End Meeting Page displays all team results and calculated metrics.
Watch a video

[![Watch the video](https://i.ytimg.com/vi/T7NF3okvtNM/maxresdefault.jpg)](https://youtu.be/T7NF3okvtNM)
