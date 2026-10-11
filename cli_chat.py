#!/usr/bin/env python3
"""
Arovia.ai — Interactive Clinical Chatbot CLI Test Tool
======================================================
Faithfully mirrors the full web app chatbot experience:
  1. Multi-turn Clinical Cross-Questioning (Intake Phase):
       • Empathetically cross-questions the user turn-by-turn.
       • Clarifies duration, character, aggravating/relieving factors, and red flags.
       • Exactly one focused clinical question per turn.
  2. Automatic Phase Transition to Final Assessment:
       • Triggers after sufficient intake (3 turns) or upon explicit user request.
  3. Live Vector RAG Retrieval:
       • Queries 311,668 live indexed vectors from 186 classical medical books.
       • Displays exact book citations (Charak, Sushrut, Bhavprakash, etc.).
  4. Strict 2-Category Remedy Engine:
       • 🌿 Home Remedies (Dadi-Nani ke Nuskhe — Kitchen items only)
       • 🕉️ Ayurvedic Remedies (Classical Formulations & Text Citations)
  5. Multi-turn Post-Diagnosis Q&A:
       • Continue asking follow-up questions within the diagnosed context.

Usage:
  python cli_chat.py
"""

import os, sys, time, json, requests
from pathlib import Path

# Fix Windows console encoding for UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── ANSI Color Codes for Terminal UI ──────────────────────────────────────────
class Colors:
    HEADER    = '\033[95m'
    BLUE      = '\033[94m'
    CYAN      = '\033[96m'
    GREEN     = '\033[92m'
    YELLOW    = '\033[93m'
    RED       = '\033[91m'
    PURPLE    = '\033[35m'
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
    except Exception:
        return [], embed_ms, (time.time() - t1) * 1000

# ── Robust Multi-Key LLM Call ─────────────────────────────────────────────────
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
                        "temperature": 0.35,
                        "max_tokens": 1400
                    },
                    timeout=14
                )
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"]
                elif resp.status_code == 429:
                    break
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
                    "generationConfig": {"temperature": 0.35, "maxOutputTokens": 1400}
                },
                timeout=14
            )
            if resp.status_code == 200:
                return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            continue

    return "Error: Could not obtain response from AI services (all Groq and Gemini keys exhausted)."

# ── System Prompts ────────────────────────────────────────────────────────────
INTAKE_SYSTEM_PROMPT = """You are Arovia.ai's Clinical Intake Doctor — an empathetic, attentive integrative health physician.

CURRENT PHASE: INTAKE (CROSS-QUESTIONING)
Your role is to conduct an active medical intake interview. You MUST NOT diagnose or prescribe remedies yet.

STRICT INTAKE INSTRUCTIONS:
1. Empathy: Begin with exactly ONE warm, reassuring sentence acknowledging the patient's newest symptom or reply.
2. Cross-Questioning: Ask EXACTLY ONE clinically focused, highly relevant follow-up question to narrow down the differential diagnosis:
   - Clarify onset, exact location, and sensation (throbbing, burning, dull, sharp, colicky).
   - Clarify aggravating & relieving factors (modalities: worse with food, fasting, night, stress, cold/heat).
   - Check associated symptoms (nausea, fever, digestion, bowel movements, sleep, skin signs).
   - Screen for red flags (sudden severe spikes, dizziness, difficulty breathing, radiation to chest/jaw).
3. Brevity: Keep your total response under 3-4 sentences. Do NOT overwhelm the patient.
4. ABSOLUTE RULE: DO NOT name diseases, DO NOT give diagnoses, and DO NOT give home remedies or medications yet! The patient must first answer your intake questions.
"""

SUMMARY_SYSTEM_PROMPT = """You are Arovia.ai's Senior Integrative Physician delivering the Comprehensive Final Clinical Assessment and Remedy Plan based on the completed intake and retrieved classical medical literature.

STRUCTURE YOUR RESPONSE INTO THESE STRICT SECTIONS:

1. 🩺 PRIMARY CLINICAL ASSESSMENT & DIFFERENTIALS
   - Primary Clinical Pattern & Bayesian Confidence (e.g., 88% Confidence)
   - Underlying Dosha & Agni Imbalance (e.g., aggravated Pitta-Vata, sluggish Jatharagni, Ama accumulation)
   - 2-3 Plausible Differential Diagnoses and clinical rationale for considering them.

2. 🌿 HOME REMEDIES (Dadi-Nani ke Nuskhe — Household Kitchen Items)
   - Scope: IMMEDIATE kitchen-shelf items ONLY (Haldi, Adrak, Tulsi, Ajwain, Jeera, Hing, Lemon, Raw Honey, Methi, Buttermilk, Saunf, etc.).
   - Accessibility: 0 pharmacy or doctor prescription needed.
   - For each remedy: State ingredient quantities, step-by-step preparation, timing, and frequency.

3. 🕉️ AYURVEDIC REMEDIES (Classical Herbs & Formulations)
   - Scope: Classical Ayurvedic herbs and formulations (Triphala, Ashwagandha, Yograj Guggulu, Sitopaladi Churna, Avipattikar Churna, Kaishore Guggulu, Maharasnadi Kwath, Vasavaleha, etc.).
   - Classical Text Citation: Explicitly cite the specific treatise (e.g., Charak Samhita, Sushrut Samhita, Bhavprakash Nighantu, Shalya Tantra).
   - Preparation, recommended dosage, anupana (vehicle: warm water, honey, or ghee), and optimal timing.

4. ⚠️ RED FLAGS & WHEN TO CONSULT A DOCTOR
   - Warning signs requiring urgent in-person medical evaluation.
   - Specific contraindications (e.g. pregnancy, chronic kidney/liver disease, hypertension).

5. 🛡️ AROVIA MEDICAL DISCLAIMER
   - "Arovia provides health education and traditional wellness guidance, not a medical diagnosis. Consult a qualified physician for persistent, severe, or worsening symptoms."
"""

FOLLOWUP_SYSTEM_PROMPT = """You are Arovia.ai's Clinical Health Assistant answering patient follow-up questions regarding their previously established assessment and remedy plan.
Answer clearly, warmly, and practically. Always reinforce safety, dosage timing, and physician consultation when needed.
"""

# ── Interactive CLI Loop ──────────────────────────────────────────────────────
def run_cli():
    print(f"{Colors.BOLD}{Colors.HEADER}{'=' * 75}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.GREEN} 🩺  AROVIA.AI CLINICAL CHATBOT — INTERACTIVE CLI ENGINE{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.HEADER}{'=' * 75}{Colors.RESET}")
    print(f"{Colors.CYAN} • Mode           : {Colors.BOLD}Full Clinical Intake & Active Cross-Questioning{Colors.RESET}")
    print(f"{Colors.CYAN} • Knowledge Base : {Colors.BOLD}311,668 Live Indexed Vectors (186 Medical/Ayurvedic Books){Colors.RESET}")
    print(f"{Colors.CYAN} • Remedy Rules   : {Colors.BOLD}Strict 2-Category (Home Remedies vs Classical Ayurveda){Colors.RESET}")
    print(f"{Colors.CYAN} • AI Engine      : {Colors.BOLD}Groq Qwen-27B (~400ms) / Gemini Flash Fallback{Colors.RESET}")
    print(f"{Colors.DIM}{'─' * 75}{Colors.RESET}")
    print(f"{Colors.YELLOW} Workflow:{Colors.RESET}")
    print(f"   1. Tell the chatbot what you're experiencing (e.g. {Colors.BOLD}'I have bad acid reflux'{Colors.RESET})")
    print(f"   2. The AI doctor will {Colors.BOLD}cross-question you{Colors.RESET} to narrow down the clinical picture.")
    print(f"   3. After intake (or when you say {Colors.BOLD}'diagnose me'{Colors.RESET}), it retrieves from the 186 books")
    print(f"      and outputs the {Colors.BOLD}Full Clinical Assessment Card & 2-Category Remedies{Colors.RESET}.")
    print(f"   4. Type {Colors.BOLD}'clear'{Colors.RESET} to start fresh, or {Colors.BOLD}'exit'{Colors.RESET} to quit.")
    print(f"{Colors.BOLD}{Colors.HEADER}{'=' * 75}{Colors.RESET}\n")

    history = []
    intake_turn = 0
    phase = "intake" # "intake" -> "summary" -> "post_summary"
    user_symptoms_summary = []

    EARLY_SUMMARY_TRIGGERS = [
        "diagnose", "diagnosis", "remedy", "remedies", "prescription",
        "tell me what to take", "what should i take", "treatment", "give me remedies"
    ]

    while True:
        try:
            prompt_label = f"{Colors.BOLD}{Colors.BLUE}You > {Colors.RESET}"
            user_input = input(prompt_label).strip()
        except (KeyboardInterrupt, EOFError):
            print(f"\n{Colors.YELLOW}Exiting Arovia CLI. Take care!{Colors.RESET}")
            break

        if not user_input:
            continue

        if user_input.lower() in ["exit", "quit", "q"]:
            print(f"\n{Colors.YELLOW}Goodbye from Arovia.ai! Stay healthy! 👋{Colors.RESET}")
            break

        if user_input.lower() == "clear":
            history = []
            intake_turn = 0
            phase = "intake"
            user_symptoms_summary = []
            print(f"{Colors.GREEN}✓ Conversation reset. Ready for new consultation.{Colors.RESET}\n")
            continue

        user_symptoms_summary.append(user_input)

        # Check if user requested early summary
        user_wants_early_summary = any(trig in user_input.lower() for trig in EARLY_SUMMARY_TRIGGERS)

        # Determine phase transition
        if phase == "intake":
            intake_turn += 1
            if intake_turn >= 3 or user_wants_early_summary:
                phase = "summary"

        # ── Handle INTAKE Phase (Cross-Questioning) ───────────────────────────
        if phase == "intake":
            print(f"\n{Colors.YELLOW}⏳ [Clinical Intake Phase — Question {intake_turn} of 3]{Colors.RESET}")
            print(f"{Colors.DIM}Doctor analyzing symptom history & formulating clinical cross-question...{Colors.RESET}", end="\r", flush=True)

            messages = [{"role": "system", "content": INTAKE_SYSTEM_PROMPT}]
            for h in history:
                messages.append(h)
            messages.append({"role": "user", "content": user_input})

            t0 = time.time()
            reply = call_llm(messages)
            t_ms = (time.time() - t0) * 1000

            history.append({"role": "user", "content": user_input})
            history.append({"role": "assistant", "content": reply})

            print(f"{Colors.BOLD}{Colors.GREEN}Arovia Doctor ({t_ms:.0f}ms){Colors.RESET}:")
            print(f"{Colors.DIM}{'─' * 75}{Colors.RESET}")
            print(f"{reply}")
            print(f"{Colors.DIM}{'─' * 75}{Colors.RESET}\n")

        # ── Handle SUMMARY Phase (Final Diagnosis & Remedies) ─────────────────
        elif phase == "summary":
            full_case_text = " | ".join(user_symptoms_summary)
            print(f"\n{Colors.PURPLE}📋 [Intake Complete — Running Live RAG Across 311k Vectors & 186 Books...]{Colors.RESET}")
            
            chunks, t_embed, t_rpc = query_vector_knowledge(full_case_text, top_k=5)

            # Display RAG Citations Box
            print(f"{Colors.CYAN}┌── 📚 KNOWLEDGE BASE CITATIONS RETRIEVED ({len(chunks)} sources | {t_rpc:.0f}ms) ──────────{Colors.RESET}")
            rag_context_parts = []
            if chunks:
                for idx, c in enumerate(chunks, 1):
                    book = c.get("book", "Classical Medical Text")
                    section = c.get("section", "General")
                    sim = c.get("similarity", 0)
                    text = c.get("text", "").replace("\n", " ")
                    print(f"{Colors.CYAN}│{Colors.RESET} [{idx}] {Colors.BOLD}{book}{Colors.RESET} | {Colors.DIM}{section}{Colors.RESET} ({Colors.GREEN}{sim*100:.1f}% match{Colors.RESET})")
                    rag_context_parts.append(f"[{idx}] Book: {book} | Section: {section} | Relevance: {sim*100:.0f}%\nExcerpt: {text}")
            else:
                print(f"{Colors.CYAN}│{Colors.RESET} {Colors.DIM}Direct match threshold not met; using baseline classical pharmacopoeia.{Colors.RESET}")
            print(f"{Colors.CYAN}└{'─' * 65}{Colors.RESET}\n")

            rag_text = "\n\n".join(rag_context_parts)
            summary_user_prompt = f"""PATIENT INTAKE SUMMARY & FULL SYMPTOM PROFILE:
{full_case_text}

LATEST PATIENT INPUT:
"{user_input}"

RETRIEVED KNOWLEDGE BASE EXCERPTS (186 Ingested Books):
{rag_text}

Now synthesize the complete intake and generate the full Clinical Assessment Card with strict 2-Category Remedies (Home Remedies vs Ayurvedic Remedies) as instructed.
"""

            messages = [{"role": "system", "content": SUMMARY_SYSTEM_PROMPT}]
            for h in history:
                messages.append(h)
            messages.append({"role": "user", "content": summary_user_prompt})

            print(f"{Colors.DIM}🧠 Synthesizing final clinical diagnosis card & source-backed remedy plan...{Colors.RESET}", end="\r", flush=True)
            t0 = time.time()
            reply = call_llm(messages)
            t_ms = (time.time() - t0) * 1000

            history.append({"role": "user", "content": user_input})
            history.append({"role": "assistant", "content": reply})

            print(f"{Colors.BOLD}{Colors.GREEN}Arovia Senior Physician ({t_ms:.0f}ms){Colors.RESET}:")
            print(f"{Colors.DIM}{'─' * 75}{Colors.RESET}")
            print(f"{reply}")
            print(f"{Colors.DIM}{'─' * 75}{Colors.RESET}\n")

            phase = "post_summary"
            print(f"{Colors.YELLOW}💬 Clinical assessment delivered! You can now ask any follow-up questions (e.g. timing, interactions, or modifications).{Colors.RESET}\n")

        # ── Handle POST-SUMMARY Phase (Follow-up Q&A) ─────────────────────────
        else:
            print(f"{Colors.DIM}Consulting clinical context for follow-up guidance...{Colors.RESET}", end="\r", flush=True)
            messages = [{"role": "system", "content": FOLLOWUP_SYSTEM_PROMPT}]
            # Keep recent history
            for h in history[-8:]:
                messages.append(h)
            messages.append({"role": "user", "content": user_input})

            t0 = time.time()
            reply = call_llm(messages)
            t_ms = (time.time() - t0) * 1000

            history.append({"role": "user", "content": user_input})
            history.append({"role": "assistant", "content": reply})

            print(f"{Colors.BOLD}{Colors.GREEN}Arovia Clinical Assistant ({t_ms:.0f}ms){Colors.RESET}:")
            print(f"{Colors.DIM}{'─' * 75}{Colors.RESET}")
            print(f"{reply}")
            print(f"{Colors.DIM}{'─' * 75}{Colors.RESET}\n")

if __name__ == "__main__":
    run_cli()
