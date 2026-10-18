# AI Mock Interview Platform 🚀

An end-to-end AI-powered technical interview simulator with realistic conversational speech, live audio recording, code execution/evaluation, and comprehensive performance feedback reports.

---

## 🌟 Key Features

- **Dynamic AI Question Generation**: Tailors interview questions (behavioral, technical architecture, and coding) to the chosen role and uploaded resume.
- **Realistic Voice Interaction**: Integrates with Murf AI text-to-speech to deliver spoken questions with natural inflection and conversational pacing.
- **Voice & Speech-to-Text Transcription**: Candidate can record their spoken answers with live microphone waveforms, automatically transcribed via AssemblyAI.
- **Interactive In-Browser Code Editor**: Live coding questions with multi-language support (JavaScript, Python, Java, C++), syntax highlighting, and instant AI code review.
- **Comprehensive Feedback & Analytics**: Generates categorized scores (Communication, Technical Knowledge, Problem Solving, Code Quality, Confidence), highlights specific strengths and actionable areas for improvement, and delivers a final performance assessment.
- **Interview History & Review**: Persistent database storage of past interview sessions, questions asked, answers submitted, and detailed evaluation scorecards.

---

## 🛠️ Tech Stack

### Frontend (`client/`)
- **React 18** with **Vite**
- **React Router v6**
- **Vanilla CSS** & Glassmorphism Design System
- **Lucide / React Icons**
- **Axios** & **React Hot Toast**

### Backend (`server/`)
- **Node.js** & **Express**
- **MongoDB** & **Mongoose**
- **Google Gen AI SDK** (`@google/genai` - Gemini 3.8 Flash)
- **Murf AI API** (Text-to-Speech)
- **AssemblyAI SDK** (Speech-to-Text)
- **JWT & Bcrypt** Authentication

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### 2. Environment Setup
Create a `.env` file in the `server/` directory (see `server/.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/ai-mock-interview

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your_gemini_api_key
MURF_API_KEY=your_murf_api_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key

CLIENT_URL=http://localhost:5173
```

### 3. Installation
Install dependencies for both client and server:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 4. Running the Application
From the repository root, start both the frontend and backend concurrently:

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 📄 License
MIT
