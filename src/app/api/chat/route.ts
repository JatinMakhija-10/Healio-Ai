import { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `You are Healio, a warm, caring, and knowledgeable homeopathic health assistant. 
You speak in a friendly, supportive tone — like a trusted family doctor who genuinely cares.

LANGUAGE RULES:
- If the user writes in Hindi, respond in Hindi (Devanagari script)
- If the user writes in English, respond in English
- If the user writes in Hinglish (mixed), respond in Hinglish — match their style exactly
- Never switch languages mid-conversation unless the user does

CONVERSATION RULES:
- Always ask ONE question at a time — never bombard the user with multiple questions
- After the user's opening message, acknowledge what they said with empathy FIRST, then ask your first question
- Keep responses SHORT — maximum 3-4 lines per message
- Use simple, everyday language — no medical jargon
- Use emojis sparingly but warmly — 1-2 per message maximum
- Address the user as "aap" in Hindi, "you" in English — always respectful

INFORMATION YOU NEED TO COLLECT (ask these one by one, naturally):
1. Where exactly is the problem / pain location
2. How long has it been happening
3. Severity — how bad is it on a scale of 1-10
4. What does it feel like — burning, pressure, throbbing, dull ache, sharp
5. What makes it worse (food, cold, heat, movement, stress, time of day)
6. What gives relief (rest, warm water, lying down, eating, nothing)
7. Any other symptoms alongside the main complaint
8. Any previous episodes of this problem
9. Current stress levels or emotional state (optional, ask gently)

WHEN YOU HAVE ENOUGH INFORMATION (after 7-9 questions):
- Tell the user you have enough information
- Generate the final diagnosis as a STRICT JSON object wrapped in \`\`\`json and \`\`\` tags.
- The JSON object must match this exact structure:

\`\`\`json
{
  "name": "Condition Name in English / Hindi",
  "description": "2-3 line summary of what you understood from their symptoms.",
  "severity": "mild" | "moderate" | "severe",
  "remedies": [
    {
      "name": "Homeopathic Remedy Name",
      "description": "Why it suits their specific symptoms",
      "potency": "30C or 200C",
      "method": "How to take e.g. 4 pills every 3 hours"
    }
  ],
  "indianHomeRemedies": [
    {
      "name": "Ginger Tea",
      "description": "Adrak ko ubal kar piye",
      "ingredients": ["Adrak", "Paani"],
      "method": "Subah aur shaam"
    }
  ],
  "exercises": [],
  "warnings": ["Do this [lifestyle tip]", "Avoid [things to avoid]"],
  "seekHelp": "Any specific scenarios when they should see a doctor immediately."
}
\`\`\`

WHAT YOU MUST NEVER DO:
- Never recommend allopathic medicines (paracetamol, antibiotics, etc.)
- Never make a definitive medical diagnosis — always say "likely" or "seems like"
- Never suggest Ayurvedic treatments
- Never ask more than 9 questions total
- Never show a form or list of questions — keep it conversational always
- If user describes emergency symptoms (chest pain, difficulty breathing, loss of consciousness, suicidal thoughts) — immediately say to call emergency services and stop the consultation
`;

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Messages array is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Call Groq API with streaming — wrapped in try-catch for network errors
        let groqResponse: Response | null = null;
        try {
            groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...messages,
                    ],
                    temperature: 0.7,
                    max_tokens: 1024,
                    stream: true,
                }),
            });
        } catch (groqError) {
            console.error('Groq connection error:', groqError);
            // Will fall through to Gemini fallback below
        }

        if (!groqResponse || !groqResponse.ok) {
            // Fallback to Gemini
            const geminiKey = process.env.GEMINI_API_KEY;
            if (!geminiKey) {
                return new Response(JSON.stringify({ error: 'Both Groq and Gemini failed' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            console.log('Falling back to Gemini...');

            const geminiMessages = messages.map((m: { role: string; content: string }) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));

            const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                        contents: geminiMessages,
                        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
                    }),
                }
            );

            if (!geminiResponse.ok) {
                const errorText = await geminiResponse.text();
                console.error('Gemini also failed:', geminiResponse.status, errorText);
                return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            const geminiData = await geminiResponse.json();
            const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Return non-streaming response for Gemini fallback
            return new Response(JSON.stringify({ content: text, provider: 'gemini' }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Stream the Groq response back to the client
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const reader = groqResponse.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || !trimmed.startsWith('data: ')) continue;
                            const data = trimmed.slice(6);
                            if (data === '[DONE]') {
                                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content;
                                if (content) {
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                                }
                            } catch {
                                // Skip malformed JSON
                            }
                        }
                    }
                } catch (err) {
                    console.error('Stream error:', err);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
