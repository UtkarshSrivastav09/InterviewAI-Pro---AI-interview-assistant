import { useState, useCallback, useRef } from 'react';
import type { InterviewQuestion } from '../types';

/* ────────────────────────────────────────────
   GROQ  –  FREE, fastest AI inference on earth
   Key format: gsk_...
   Get key: https://console.groq.com/keys
   ──────────────────────────────────────────── */
async function callGroq(
  question: string,
  apiKey: string,
  signal: AbortSignal,
  ctx?: { role?: string; experience?: string },
): Promise<string> {
  const sys = 
    'You are a world-class Technical Interview Coach. Your goal is to provide perfectly structured, professional answers that a candidate can literally say aloud during a high-stakes interview.\n\n' +
    'FORMATTING RULES:\n' +
    '1. ⚡ **Direct Definition**: Start with a concise 1-2 sentence technical definition.\n' +
    '2. 🗣️ **Interview Script**: Provide a section titled "**Interview Script**" that contains the exact words a candidate should speak. Use professional, confident language.\n' +
    '3. 🔑 **Key Terms**: List 3-4 critical technical terms in a bulleted list.\n' +
    'Focus on being professional and providing a complete verbal response.';

  // Use our internal Vercel proxy to avoid CORS issues in production
  const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
  const proxyEndpoint = '/api/proxy';
  
  if (isProduction) {
    console.log('Using production proxy for Groq API');
    const res = await fetch(proxyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUrl: 'https://api.groq.com/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
        },
        body: {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: question },
          ],
          temperature: 0.6,
          max_tokens: 800,
          stream: false,
        },
      }),
      signal,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || data.details || 'Groq proxy error ' + res.status);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Groq returned empty response');
    return text;
  }

  // Fallback for local development (or if you want to use a public proxy)
  const proxyUrl = 'https://corsproxy.io/?';
  const targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
  
  const res = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: question },
      ],
      temperature: 0.6, // slightly lower for more focus
      max_tokens: 800,
      stream: false,
    }),
    signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    let msg = 'Groq error ' + res.status;
    try {
      const j = JSON.parse(txt);
      msg = j?.error?.message || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned empty response');
  return text;
}

/* ────────────────────────────────────────────
   GEMINI  –  FREE
   Key format: AIza...
   Get key: https://makersuite.google.com/app/apikey
   ──────────────────────────────────────────── */
async function callGemini(
  question: string,
  apiKey: string,
  signal: AbortSignal,
  ctx?: { role?: string; experience?: string },
): Promise<string> {
  const prompt =
    'You are a Technical Interview Assistant. Provide a professional, high-impact answer that a candidate can speak directly in an interview.\n\n' +
    'STRUCTURE:\n' +
    '- ⚡ **Direct Definition**: 1-2 sentences.\n' +
    '- 🗣️ **Interview Script**: What the candidate should say (2-3 paragraphs).\n' +
    '- 🔑 **Key Terms**: 3-4 critical terms.\n\n' +
    'Question: "' + question + '"';

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
      apiKey,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
      signal,
    },
  );

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    let msg = 'Gemini error ' + res.status;
    try {
      const j = JSON.parse(txt);
      msg = j?.error?.message || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string,
  apiKey: string,
  signal: AbortSignal
): Promise<string> {
  const prompt = "Transcribe this technical interview audio. Return only the transcription text, no preamble.";
  
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: audioBase64 } }
            ]
          }
        ],
        generationConfig: { temperature: 0.1 }
      }),
      signal,
    }
  );

  if (!res.ok) throw new Error('Transcription failed');
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/* ────────────────────────────────────────────
   Built-in knowledge base (no API needed)
   ──────────────────────────────────────────── */
const KB: Record<string, string> = {
  closure:
    '**Closure** — a function that remembers variables from its outer scope even after the outer function returns.\n\n' +
    '**Key points:**\n' +
    '- Inner function "closes over" outer variables\n' +
    '- Creates private, persistent state\n' +
    '- Used for data privacy, callbacks, factories\n\n' +
    '```js\nfunction counter() {\n  let n = 0;\n  return () => ++n;\n}\nconst inc = counter();\ninc(); // 1\ninc(); // 2\n```',

  hoisting:
    '**Hoisting** moves declarations to the top of their scope at compile time.\n\n' +
    '- `var` → hoisted, initialized as `undefined`\n' +
    '- `let/const` → hoisted but NOT initialized (Temporal Dead Zone)\n' +
    '- Function declarations → fully hoisted\n' +
    '- Function expressions → NOT hoisted',

  'event loop':
    '**Event Loop** lets single-threaded JS handle async operations.\n\n' +
    '1. **Call Stack** — runs sync code\n' +
    '2. **Web APIs** — handle timers, fetch, DOM\n' +
    '3. **Microtask Queue** — Promises (HIGH priority)\n' +
    '4. **Macrotask Queue** — setTimeout, setInterval\n\n' +
    '**Order:** Sync → ALL microtasks → ONE macrotask → repeat\n\n' +
    '```js\nconsole.log(1);\nsetTimeout(() => console.log(2), 0);\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);\n// 1, 4, 3, 2\n```',

  promise:
    '**Promise** represents eventual result of async operation.\n\n' +
    'States: Pending → Fulfilled OR Rejected\n\n' +
    '```js\nfetch(url)\n  .then(r => r.json())\n  .then(data => use(data))\n  .catch(err => handle(err));\n```\n\n' +
    '- `Promise.all` — wait for all\n' +
    '- `Promise.race` — first settled\n' +
    '- `Promise.any` — first fulfilled\n' +
    '- `async/await` — syntactic sugar',

  'virtual dom':
    '**Virtual DOM** — lightweight JS copy of real DOM.\n\n' +
    '1. React builds virtual tree\n' +
    '2. On state change → new virtual tree\n' +
    '3. **Diffing** finds minimal changes\n' +
    '4. **Reconciliation** patches real DOM\n\n' +
    'Benefit: batched updates → fewer reflows → fast UI.',

  hooks:
    '**React Hooks** let function components use state & lifecycle.\n\n' +
    '- `useState` — local state\n' +
    '- `useEffect` — side effects & cleanup\n' +
    '- `useRef` — mutable ref across renders\n' +
    '- `useMemo/useCallback` — memoization\n' +
    '- `useContext` — consume context\n\n' +
    'Rules: top level only; React functions only.',

  this:
    '**`this`** depends on how a function is called:\n\n' +
    '1. `new` → new object\n' +
    '2. `call/apply/bind` → explicit\n' +
    '3. `obj.fn()` → obj\n' +
    '4. plain call → window/undefined\n' +
    '5. Arrow fn → inherits outer `this`',

  prototype:
    '**Prototypal Inheritance** — objects inherit via prototype chain.\n\n' +
    '```js\nconst animal = { speak() { return "sound"; } };\nconst dog = Object.create(animal);\ndog.speak(); // "sound"\n```\n\n' +
    'ES6 `class` is sugar over prototypes.',

  'tell me about yourself':
    '**Structure: Present → Past → Future**\n\n' +
    '"I\'m currently [role] working on [project] with [stack]. Recently I [achievement with metrics].\n\n' +
    'Before that I [experience] where I [result].\n\n' +
    'I\'m excited about this role because [reason]."\n\n' +
    'Tips: 60-90 sec, include metrics, tailor to JD.',

  strength:
    '**Pick relevant strength + evidence:**\n\n' +
    '"My strength is problem-solving under pressure. During a production outage I found the root cause and fixed it in 2 hours."',

  weakness:
    '**Pick genuine weakness + show growth:**\n\n' +
    '"I used to struggle with delegation. I\'ve since adopted code reviews and mentoring, improving team velocity by 25%."',

  'system design':
    '**Approach:** Clarify → Estimate → API → Data Model → Architecture → Deep Dive → Trade-offs.\n\n' +
    'Building blocks: Load Balancer, Cache, CDN, Message Queue, DB Sharding, Microservices.',

  'rest api':
    '**REST:** GET (read), POST (create), PUT (update), PATCH (partial), DELETE (remove).\n\n' +
    'URL pattern: `/api/v1/users/:id`\n' +
    'Status: 200 OK, 201 Created, 400 Bad Request, 401 Unauth, 404 Not Found, 500 Error.',

  typescript:
    '**TypeScript** adds static types to JS.\n\n' +
    '- `interface` for object shapes\n' +
    '- `type` for unions/intersections\n' +
    '- Generics: `function first<T>(a:T[]):T`\n' +
    '- Utility: Partial, Pick, Omit, Record',

  mongodb:
    '**MongoDB** — NoSQL document DB.\n\n' +
    'Flexible schema, horizontal scaling, embedding/referencing.\n' +
    'Tips: indexes, `.lean()`, pagination, aggregation pipeline.',

  docker:
    '**Docker** — containers for consistent environments.\n\n' +
    '```dockerfile\nFROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\nCMD ["npm","start"]\n```',

  git:
    '**Merge** preserves history; **Rebase** linearizes. Never rebase public branches.\n\n' +
    'Useful: `git stash`, `git cherry-pick`, `git reflog`, `git bisect`.',

  testing:
    '**Pyramid:** Unit (most) → Integration → E2E (fewest).\n' +
    'Test behavior not implementation. AAA pattern. 80%+ coverage.',

  security:
    '**XSS** — sanitize input, CSP. **CSRF** — tokens, SameSite.\n' +
    '**JWT:** sign + verify. HTTPS, helmet, rate-limit, bcrypt.',

  performance:
    '**React:** `React.memo`, `useMemo`, `useCallback`, `React.lazy`.\n' +
    '**Web:** LCP<2.5s, FID<100ms, CLS<0.1. Code-split, cache, lazy-load.',

  css:
    '**Flexbox** (1D): `display:flex; justify-content; align-items; gap`.\n' +
    '**Grid** (2D): `display:grid; grid-template-columns: repeat(auto-fit, minmax(300px,1fr))`.',

  async:
    '**Patterns:** Callbacks → Promises → async/await.\n\n' +
    '```js\nasync function fetchData() {\n  try {\n    const data = await fetch(url).then(r=>r.json());\n    return data;\n  } catch(e) { console.error(e); }\n}\n```',

  redux:
    '**Redux** — predictable state container.\n' +
    'Store (single truth), Actions (what happened), Reducers (pure update).\n' +
    'Redux Toolkit: `createSlice`, `configureStore`.',

  node:
    '**Node.js** — JS runtime, non-blocking I/O, event-driven.\n\n' +
    '```js\nconst app = express();\napp.get("/api/users", async (req,res) => {\n  res.json(await User.find());\n});\n```',
};

function findBestMatch(question: string): { answer: string; category: string; confidence: number } {
  const q = question.toLowerCase();
  let best = { answer: '', category: 'General', confidence: 0 };

  for (const [key, answer] of Object.entries(KB)) {
    const words = key.split(/\s+/);
    let score = 0;
    for (const w of words) if (q.includes(w)) score += w.length * 3;
    if (q.includes(key)) score += key.length * 5;
    if (score > best.confidence)
      best = { answer, category: key.charAt(0).toUpperCase() + key.slice(1), confidence: Math.min(score * 4, 95) };
  }

  if (best.confidence < 8) {
    best = {
      answer:
        '**Heard:** "' + question + '"\n\n' +
        'I am analyzing your question, but I don\'t have a specific built-in answer for this unique topic yet. Try rephrasing or asking something related to software development.',
      category: 'General',
      confidence: 40,
    };
  }
  return best;
}

/* ════════════════════════════════════════════
   MAIN HOOK
   ════════════════════════════════════════════ */
export function useAIResponse() {
  const [isProcessing, setIsProcessing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const cancelProcessing = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsProcessing(false);
  }, []);

  const generateAnswer = useCallback(
    async (
      question: string,
      settings?: {
        apiKey?: string;
        aiModel?: string;
        role?: string;
        experience?: string;
        responseSpeed?: string;
      },
    ): Promise<InterviewQuestion> => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setIsProcessing(true);

      const id = 'q_' + Date.now();
      const key = (settings?.apiKey || '').trim();
      const model = (settings?.aiModel || '').toLowerCase();
      const ctx = { role: settings?.role, experience: settings?.experience };

      try {
        /* ── try AI if we have a key ── */
        const isPlaceholderKey = key === 'AIzaSyAbcgpDCJ2YFknf7zyhEXJb8CQ0T68IiPs';
        const isProduction = window.location.hostname !== 'localhost';

        if (key.length > 10) {
          let answer = '';
          let provider = 'AI';

          // Decide which provider to call
          const isGemini = model === 'gemini' || key.startsWith('AIza');
          const isGroq = model === 'groq' || key.startsWith('gsk_');

          try {
            if (isGemini) {
              provider = 'Gemini';
              answer = await callGemini(question, key, ctrl.signal, ctx);
            } else if (isGroq) {
              provider = 'Groq';
              answer = await callGroq(question, key, ctrl.signal, ctx);
            } else {
              // Default: try Groq first (fastest), then Gemini
              provider = 'Groq';
              answer = await callGroq(question, key, ctrl.signal, ctx);
            }
          } catch (apiErr: any) {
            // If the key is the placeholder and it fails, provide a specific helpful message
            if (isPlaceholderKey || !key) {
              const envMsg = isProduction 
                ? 'Check your Vercel Environment Variables (VITE_GEMINI_API_KEY).' 
                : 'Add a valid API key in Settings.';
              throw new Error(`The system API key failed or is missing. ${envMsg} Error: ${apiErr.message}`);
            }
            throw apiErr;
          }

          return {
            id,
            question,
            timestamp: new Date(),
            answer,
            category: provider + ' AI',
            confidence: 98,
            isProcessing: false,
          };
        }

        /* ── no key → built-in KB ── */
        const delay = settings?.responseSpeed === 'fast' ? 50 : settings?.responseSpeed === 'detailed' ? 300 : 150;
        await new Promise((r) => setTimeout(r, delay));
        const fb = findBestMatch(question);
        
        let answer = fb.answer;
        if (isProduction && !key) {
          answer = '⚠️ **Setup Required:** No API key detected. Please add `VITE_GEMINI_API_KEY` or `VITE_GROQ_API_KEY` to your Vercel project settings for live AI responses.\n\n' + answer;
        }

        return { id, question, timestamp: new Date(), answer, category: fb.category, confidence: fb.confidence, isProcessing: false };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { id, question, timestamp: new Date(), answer: '_Cancelled._', category: 'Cancelled', confidence: 0, isProcessing: false };
        }

        // API failed → fallback to built-in
        const fb = findBestMatch(question);
        return {
          id,
          question,
          timestamp: new Date(),
          answer: '⚠️ **' + (model.includes('gemini') ? 'Gemini' : 'Groq') + ' API Error:** ' + err.message + '\n\n' + fb.answer,
          category: 'API Error',
          confidence: fb.confidence,
          isProcessing: false,
        };
      } finally {
        setIsProcessing(false);
        abortRef.current = null;
      }
    },
    [],
  );

  return { isProcessing, generateAnswer, transcribeAudio, cancelProcessing };
}
