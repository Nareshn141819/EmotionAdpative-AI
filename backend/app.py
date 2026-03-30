import os, re, requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth 

cred = credentials.Certificate('FIREBASE_SERVICE_ACCOUNT')
firebase_admin.initialize_app(cred)

def verify_token(token):
    decoded = firebase_auth.verify_id_token(token)
    return decoded['uid']

app = Flask(__name__)

# Allow requests from GitHub Pages domain + localhost
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*")
CORS(app, origins=ALLOWED_ORIGINS)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
MURF_API_KEY = os.environ.get("MURF_API_KEY", "")

# ─── Health ────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "groq": bool(GROQ_API_KEY),
        "murf": bool(MURF_API_KEY),
    })

# ─── Emotion detection ─────────────────────────────────────────
EMOTION_KEYWORDS = {
    "confused":    ["confused","understand","what","how","why","unclear","lost","stuck","help me","explain","don't get"],
    "frustrated":  ["frustrated","annoyed","angry","difficult","hard","can't","impossible","ugh","nothing works"],
    "excited":     ["excited","amazing","wow","awesome","love","fantastic","cool","interesting","want to know more"],
    "happy":       ["happy","good","thanks","thank you","nice","got it","makes sense","clear"],
    "sad":         ["sad","depressed","tired","whatever","fine","i guess"],
    "curious":     ["curious","wonder","tell me","more about","what if","why does","fascinating"],
    "bored":       ["boring","bored","not interested","skip","move on","already know"],
}

def detect_emotion(text: str) -> str:
    lower = text.lower()
    scores = {em: sum(1 for k in kws if k in lower)
              for em, kws in EMOTION_KEYWORDS.items()}
    scores["neutral"] = 0.4
    return max(scores, key=scores.get)

# ─── System prompt builder ─────────────────────────────────────
EMOTION_STYLES = {
    "confused":    "The student is CONFUSED. Use simple, clear language. Break things down step-by-step. Use analogies and real-world examples. Be patient and reassuring.",
    "frustrated":  "The student is FRUSTRATED. Be empathetic and encouraging first. Acknowledge their struggle, then give a clear direct path forward. Keep it concise.",
    "excited":     "The student is EXCITED! Match their energy! Go deeper, add fascinating details, use advanced concepts, challenge them further.",
    "happy":       "The student is in a GREAT mood! Build on their positive momentum. Reinforce understanding and add interesting extensions.",
    "sad":         "The student seems LOW ENERGY. Be warm, gentle and encouraging. Keep explanations simple and end with something uplifting.",
    "curious":     "The student is CURIOUS! Feed their curiosity with rich interesting explanations, surprising facts, and connections to other topics.",
    "bored":       "The student is BORED. Make this INTERESTING! Use surprising angles, fun analogies, unexpected connections to re-engage them.",
    "neutral":     "Provide a clear, balanced, educational response.",
}

def build_system_prompt(emotion: str) -> str:
    style = EMOTION_STYLES.get(emotion, EMOTION_STYLES["neutral"])
    return f"""You are Emotion AI, an emotionally intelligent AI tutor that adapts its teaching style to the student's emotional state.

DETECTED EMOTION: {emotion}
TEACHING STYLE: {style}

RULES:
- Adapt your tone, depth and style to the emotion above
- Use markdown: **bold** for key terms, `code` for technical terms, code blocks for code
- Be concise but complete (2-4 paragraphs max)
- Always end with one engaging follow-up question to check understanding
- Never be condescending; make learning feel personal and emotionally responsive"""

# ─── /api/chat ─────────────────────────────────────────────────
@app.route("/api/chat", methods=["POST"])
def chat():
    if not GROQ_API_KEY:
        return jsonify({"error": "GROQ_API_KEY not configured on server"}), 500

    body      = request.get_json(force=True)
    user_text = body.get("text", "").strip()
    history   = body.get("history", [])
    model     = body.get("model", "llama-3.3-70b-versatile")

    if not user_text:
        return jsonify({"error": "text is required"}), 400

    emotion = detect_emotion(user_text)

    messages = [{"role": "system", "content": build_system_prompt(emotion)}]
    for turn in history[-8:]:
        if turn.get("role") in ("user", "assistant"):
            messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": user_text})

    temp_map    = {"excited": 0.9, "confused": 0.5, "frustrated": 0.6}
    temperature = temp_map.get(emotion, 0.7)

    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        json={"model": model, "messages": messages, "max_tokens": 900, "temperature": temperature},
        timeout=30,
    )

    if not resp.ok:
        err = resp.json().get("error", {})
        return jsonify({"error": f"Groq error: {err.get('message', resp.status_code)}"}), 502

    reply = resp.json()["choices"][0]["message"]["content"]
    return jsonify({"reply": reply, "emotion": emotion})

# ─── /api/tts ──────────────────────────────────────────────────
VOICE_STYLES = {
    "confused":    {"rate": -10, "pitch":  0},
    "frustrated":  {"rate":   0, "pitch": -5},
    "excited":     {"rate":  10, "pitch":  5},
    "happy":       {"rate":   5, "pitch":  5},
    "sad":         {"rate":  -5, "pitch": -5},
    "curious":     {"rate":   5, "pitch":  5},
    "bored":       {"rate":  -5, "pitch":  0},
    "neutral":     {"rate":   0, "pitch":  0},
}

@app.route("/api/tts", methods=["POST"])
def tts():
    if not MURF_API_KEY:
        return jsonify({"error": "MURF_API_KEY not configured"}), 500

    body     = request.get_json(force=True)
    text     = re.sub(r"[*`#>]", "", body.get("text", ""))[:3000]
    emotion  = body.get("emotion", "neutral")
    voice_id = body.get("voiceId", "en-US-natalie")

    if not text:
        return jsonify({"error": "text is required"}), 400

    vs = VOICE_STYLES.get(emotion, VOICE_STYLES["neutral"])

    resp = requests.post(
        "https://api.murf.ai/v1/speech/generate",
        headers={"api-key": MURF_API_KEY, "Content-Type": "application/json"},
        json={"voiceId": voice_id, "text": text, "rate": vs["rate"], "pitch": vs["pitch"], "format": "MP3"},
        timeout=60,
    )

    if not resp.ok:
        err = resp.json() if resp.content else {}
        return jsonify({"error": f"Murf error: {err.get('errorMessage', resp.status_code)}"}), 502

    data = resp.json()
    return jsonify({"audioUrl": data.get("audioFile") or data.get("encodedAudio") or ""})

# ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
