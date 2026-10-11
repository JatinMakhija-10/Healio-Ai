#!/usr/bin/env python3
"""
Arovia.ai — Interactive Clinical Chatbot CLI Test Tool
======================================================
Allows pair-testing the full clinical RAG pipeline directly from the command line:
  1. Live Vector Retrieval (311,668 vectors from 186 ingested medical/Ayurvedic books)
  2. Strict 2-Category Remedy Engine:
       • Home Remedies (Dadi-Nani ke Nuskhe — Kitchen items only)
       • Ayurvedic Remedies (Classical Formulations & Herbs)
  3. High-authority Classical Citations (Charak, Sushrut, Bhavprakash, etc.)
  4. Ultra-fast LLM Response (Groq Qwen-27B / Gemini fallback)
  5. Multi-turn conversation memory

Usage:
  python cli_chat.py
"""

import os, sys, time, json, requests
from pathlib import Path

# Fix Windows console encoding for UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── ANSI Color Codes for Beautiful CLI UX ─────────────────────────────────────
class Colors:
    HEADER    = '\033[95m'
    BLUE      = '\033[94m'
    CYAN      = '\033[96m'
    GREEN     = '\033[92m'
    YELLOW    = '\033[93m'
    RED       = '\033[91m'
    BOLD      = '\033[1m'
    DIM       = '\033[2m'
    UNDERLINE = '\033[4m'
    RESET     = '\033[0m'

ROOT_DIR = Path(__file__).parent
ENV_LOCAL = ROOT_DIR / ".env.local"

if ENV_LOCAL.exists():
    for line in ENV_LOCAL.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Load Groq keys pool
GROQ_KEYS = [k.strip() for k in os.environ.get("GROQ_API_KEYS", os.environ.get("GROQ_API_KEY", "")).split(",") if k.strip()]
_groq_idx = 0

def next_groq_key() -> str:
    global _groq_idx
    if not GROQ_KEYS:
        return ""
    k = GROQ_KEYS[_groq_idx % len(GROQ_KEYS)]
    _groq_idx += 1
    return k

# Load Gemini keys pool
GEMINI_KEYS = [k.strip() for k in os.environ.get("GEMINI_API_KEYS", os.environ.get("GEMINI_API_KEY", "")).split(",") if k.strip()]
_gemini_idx = 0

def next_gemini_key() -> str:
    global _gemini_idx
    if not GEMINI_KEYS:
        return ""
    k = GEMINI_KEYS[_gemini_idx % len(GEMINI_KEYS)]
    _gemini_idx += 1
    return k

# ── Load Local FastEmbed Model ────────────────────────────────────────────────
print(f"{Colors.CYAN}⚡ Initializing local 768-dim FastEmbed ONNX Engine (BAAI/bge-base-en-v1.5)...{Colors.RESET}")
try:
    from fastembed import TextEmbedding
    embedder = TextEmbedding(model_name="BAAI/bge-base-en-v1.5")
    print(f"{Colors.GREEN}✓ Local embedder ready (sub-20ms vector generation).{Colors.RESET}\n")
except Exception as e:
    print(f"{Colors.RED}❌ Error loading FastEmbed: {e}{Colors.RESET}")
    sys.exit(1)

# ── Supabase Retrieval ────────────────────────────────────────────────────────
SB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def query_vector_knowledge(query_text: str, top_k: int = 4):
    """Retrieve classical medical & Ayurvedic book chunks from Supabase."""
    t0 = time.time()
    vec = list(embedder.embed([query_text]))[0].tolist()
    embed_ms = (time.time() - t0) * 1000

    t1 = time.time()
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/search_ayurvedic_knowledge",
            headers=SB_HEADERS,
            json={
                "query_embedding": vec,
                "match_threshold": 0.60,
                "match_count": top_k
            },
            timeout=8
        )
        rpc_ms = (time.time() - t1) * 1000
        if r.status_code == 200:
            return r.json(), embed_ms, rpc_ms
        else:
            return [], embed_ms, rpc_ms
    except Exception as e:
        return [], embed_ms, (time.time() - t1) * 1000

# ── Groq / Gemini LLM Query ───────────────────────────────────────────────────
def call_llm(messages: list) -> str:
    """Call Groq (Qwen 27B / GPT-OSS) with fallback to Gemini across key pools."""
    # 1. Try Groq key pool
    for _ in range(len(GROQ_KEYS)):
        groq_key = next_groq_key()
        if not groq_key:
            continue
        for model in ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]:
            try:
                resp = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": 0.4,
                        "max_tokens": 1200
                    },
                    timeout=12
                )
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"]
                elif resp.status_code == 429:
                    break # try next key on rate limit
            except Exception:
                continue

    # 2. Try Gemini fallback key pool
    for _ in range(len(GEMINI_KEYS)):
        gemini_key = next_gemini_key()
        if not gemini_key:
            continue
        try:
            gem_contents = []
            for m in messages:
                role = "user" if m["role"] == "user" else "model"
                if m["role"] == "system":
                    continue
                gem_contents.append({"role": role, "parts": [{"text": m["content"]}]})

            sys_prompt = next((m["content"] for m in messages if m["role"] == "system"), "")
            
            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "systemInstruction": {"parts": [{"text": sys_prompt}]},
                    "contents": gem_contents,
                    "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1200}
                },
                timeout=12
            )
            if resp.status_code == 200:
                return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            continue

    return "Error: Could not obtain response from AI services (all Groq and Gemini keys exhausted)."

# ── System Instruction Template ───────────────────────────────────────────────
SYSTEM_PROMPT = """You are Arovia.ai's Clinical Health Assistant — an integrative medical AI combining modern clinical discernment, authentic Ayurvedic science, and evidence-informed Indian home remedies.

CRITICAL REMEDY CATEGORIZATION RULES:
Always structure remedy guidance into STRICTLY TWO DISTINCT CATEGORIES:

1. 🌿 HOME REMEDIES (Dadi-Nani ke Nuskhe)
   - Scope: IMMEDIATE kitchen-shelf items ONLY (Haldi, Adrak, Tulsi, Ajwain, Jeera, Hing, Lemon, Raw Honey, Pudina, Methi seeds, Mustard Oil, etc.).
   - Accessibility: 0 pharmacy or prescription needed.
   - For each remedy: State ingredient quantities, exact preparation method, timing, and frequency.

2. 🕉️ AYURVEDIC REMEDIES (Classical Herbs & Formulations)
   - Scope: Classical Ayurvedic herbs and formulations (Triphala, Ashwagandha, Yograj Guggulu, Sitopaladi Churna, Avipattikar Churna, Kaishore Guggulu, Maharasnadi Kwath, Vasavaleha, etc.).
   - Authority: Cite the specific classical treatise or text (e.g. Charak Samhita, Sushrut Samhita, Bhavprakash Nighantu).
   - For each formulation: State recommended dosage, anupana (vehicle: warm water, honey, or ghee), and optimal timing.

CLINICAL SAFETY RULES:
- Always highlight Red Flags & Warning Signs (when the patient MUST seek emergency care).
- Include clear Contraindications (e.g., pregnancy, high blood pressure, diabetes, acid peptic disease).
- Always include the Arovia medical disclaimer: "Arovia provides health education and traditional wellness guidance, not a medical diagnosis. Consult a qualified physician for persistent or worsening symptoms."
"""

# ── Interactive CLI Loop ──────────────────────────────────────────────────────
def run_cli():
    print(f"{Colors.BOLD}{Colors.HEADER}{'=' * 75}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.GREEN} 🩺  AROVIA.AI CLINICAL CHATBOT — INTERACTIVE CLI TESTING SUITE{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.HEADER}{'=' * 75}{Colors.RESET}")
    print(f"{Colors.CYAN} • Knowledge Base : {Colors.BOLD}311,668 Live Indexed Vectors (186 Medical/Ayurvedic Books){Colors.RESET}")
    print(f"{Colors.CYAN} • Vector Index    : {Colors.BOLD}Active IVFFlat (idx_ayurvedic_knowledge_ivfflat){Colors.RESET}")
    print(f"{Colors.CYAN} • LLM Engine     : {Colors.BOLD}Groq Qwen-27B (~400ms) / Gemini Flash Fallback{Colors.RESET}")
    print(f"{Colors.CYAN} • Embeddings     : {Colors.BOLD}Local FastEmbed ONNX (BAAI/bge-base-en-v1.5){Colors.RESET}")
    print(f"{Colors.DIM}{'─' * 75}{Colors.RESET}")
    print(f"{Colors.YELLOW} Commands:{Colors.RESET}")
    print(f"   • Type your symptoms (e.g. {Colors.BOLD}'acid reflux heartburn for 3 days'{Colors.RESET})")
    print(f"   • Type {Colors.BOLD}'clear'{Colors.RESET} to reset conversation memory")
    print(f"   • Type {Colors.BOLD}'exit'{Colors.RESET} or {Colors.BOLD}'quit'{Colors.RESET} to exit")
    print(f"{Colors.BOLD}{Colors.HEADER}{'=' * 75}{Colors.RESET}\n")

    history = []

    while True:
        try:
            user_input = input(f"{Colors.BOLD}{Colors.BLUE}You > {Colors.RESET}").strip()
        except (KeyboardInterrupt, EOFError):
            print(f"\n{Colors.YELLOW}Exiting Arovia CLI. Stay healthy!{Colors.RESET}")
            break

        if not user_input:
            continue

        if user_input.lower() in ["exit", "quit", "q"]:
            print(f"\n{Colors.YELLOW}Goodbye from Arovia.ai! 👋{Colors.RESET}")
            break

        if user_input.lower() == "clear":
            history = []
            print(f"{Colors.GREEN}✓ Conversation memory cleared.{Colors.RESET}\n")
            continue

        # ── Step 1: Vector RAG Retrieval ──────────────────────────────────────
        print(f"\n{Colors.DIM}🔍 Querying 311k indexed vectors across 186 classical books...{Colors.RESET}", end="\r", flush=True)
        chunks, t_embed, t_rpc = query_vector_knowledge(user_input, top_k=4)
        
        # Display RAG Citations Box
        print(f"{Colors.CYAN}┌── 📚 KNOWLEDGE BASE RETRIEVAL ({len(chunks)} citations in {t_rpc:.0f}ms | embed: {t_embed:.0f}ms) ──────────{Colors.RESET}")
        rag_context_parts = []
        if chunks:
            for idx, c in enumerate(chunks, 1):
                book = c.get("book", "Classical Treatise")
                section = c.get("section", "General")
                sim = c.get("similarity", 0)
                text = c.get("text", "").replace("\n", " ")
                print(f"{Colors.CYAN}│{Colors.RESET} [{idx}] {Colors.BOLD}{book}{Colors.RESET} | {Colors.DIM}{section}{Colors.RESET} ({Colors.GREEN}{sim*100:.1f}% match{Colors.RESET})")
                rag_context_parts.append(f"[{idx}] Source: {book} | Section: {section} | Match: {sim*100:.0f}%\nExcerpt: {text}")
        else:
            print(f"{Colors.CYAN}│{Colors.RESET} {Colors.DIM}No direct vector threshold match (using classical medical baseline).{Colors.RESET}")
        print(f"{Colors.CYAN}└{'─' * 65}{Colors.RESET}\n")

        # ── Step 2: Build LLM Prompt ──────────────────────────────────────────
        rag_text = "\n\n".join(rag_context_parts) if rag_context_parts else "No specific text excerpts retrieved."
        turn_prompt = f"""PATIENT SYMPTOM / QUERY:
"{user_input}"

RETRIEVED KNOWLEDGE BASE EXCERPTS (186 Ingested Books):
{rag_text}

Provide your complete clinical response strictly formatted into:
1. Primary Assessment & Differential Considerations
2. 🌿 Home Remedies (Dadi-Nani ke Nuskhe — Household kitchen items only)
3. 🕉️ Ayurvedic Remedies (Classical formulations with dosage and citations)
4. Red Flags & When to Consult a Doctor
5. Medical Disclaimer
"""

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for h in history:
            messages.append(h)
        messages.append({"role": "user", "content": turn_prompt})

        # ── Step 3: Stream/Fetch AI Response ──────────────────────────────────
        print(f"{Colors.DIM}🧠 Generating clinical response via Arovia Medical Engine...{Colors.RESET}", end="\r", flush=True)
        t_llm0 = time.time()
        reply = call_llm(messages)
        t_llm = (time.time() - t_llm0) * 1000

        # Update multi-turn history
        history.append({"role": "user", "content": user_input})
        history.append({"role": "assistant", "content": reply})

        # Keep history bounded to last 6 turns
        if len(history) > 12:
            history = history[-12:]

        # ── Step 4: Display Formatted AI Output ───────────────────────────────
        print(f"{Colors.BOLD}{Colors.GREEN}Arovia.ai ({t_llm:.0f}ms){Colors.RESET}:")
        print(f"{Colors.DIM}{'─' * 75}{Colors.RESET}")
        print(reply)
        print(f"{Colors.DIM}{'─' * 75}{Colors.RESET}\n")

if __name__ == "__main__":
    run_cli()
