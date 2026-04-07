# Emotion AI v2 — React + Firebase + Groq + Murf AI

> Emotion-Aware AI Learning Assistant with React frontend, Firebase auth, Flask backend

---

## 📁 Repo Structure
 
```
your-repo/
├── .github/
│   └── workflows/
│       └── deploy.yml        ← Auto-deploys React to GitHub Pages
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   └── pages/
│   │       ├── LandingPage.js
│   │       ├── AuthPage.js
│   │       └── ChatPage.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── Procfile
└── README.md
```

---

## 🚀 Setup Guide

### Step 1 — Get all API keys

| Service | URL | Key type |
|---------|-----|----------|
| Groq | console.groq.com | `gsk_...` |
| Murf AI | murf.ai | `ap2_...` |
| Firebase | firebase.google.com |

### Step 2 — Clerk setup

1. Go to [firebase.google.com](https://firebase.google.com) → Create account → **Create Application**
2. Name it `Emotion AI`, enable **Email** and **Google** sign-in
3. Go to **General settings config** → copy the **API key** 
4. Go to **Domains** → add your GitHub Pages URL:  
   `https://YOUR_USERNAME.github.io`

### Step 3 — Deploy backend on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Settings:

| Field | Value |
|-------|-------|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |

4. Add Environment Variables:

```
GROQ_API_KEY       = gsk_your_groq_key
MURF_API_KEY       = ap2_your_murf_key
ALLOWED_ORIGINS    = https://YOUR_USERNAME.github.io
```

5. Deploy → note your URL e.g. `https://edubot-backend.onrender.com`

### Step 4 — Configure frontend

Edit `frontend/package.json` line 5:
```json
"homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME",
```

Edit `frontend/src/pages/ChatPage.js` line 5:
```js
const API = 'https://YOUR-APP.onrender.com';
```

### Step 5 — Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New secret**

Add these two secrets:

| Secret name | Value |
|-------------|-------|
| `REACT_APP_BACKEND_URL` | `https://your-app.onrender.com` |

### Step 6 — Push to GitHub

```bash
git init
git add .
git commit -m "Emotion AI v2 - React + Firebase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 7 — Enable GitHub Pages

1. Go to repo → **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** → **/ (root)**
4. Save

The GitHub Actions workflow will automatically build and deploy on every push. Your app will be live at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME
```

---

## 🔄 How it works

```
GitHub Pages (React)          Render (Flask)
     │                              │
     │  POST /api/chat              │
     │ ─────────────────────────►  │
     │  { text, history, model }   │
     │                              │── Emotion detection
     │                              │── Groq API call
     │  { reply, emotion }         │
     │ ◄─────────────────────────  │
     │                              │
     │  POST /api/tts               │
     │ ─────────────────────────►  │
     │  { text, emotion, voiceId } │
     │                              │── Murf AI call
     │  { audioUrl }               │
     │ ◄─────────────────────────  │
     │                              │
   Play audio in browser
```

---

## 🛠 Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
export GROQ_API_KEY=gsk_...
export MURF_API_KEY=ap2_...
python app.py
# Runs on http://localhost:5000

# Frontend (new terminal)
cd frontend
cp .env.example .env
# Edit .env with your keys
npm install
npm start
# Runs on http://localhost:3000
```
