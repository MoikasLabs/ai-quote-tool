# AI 3D Print Quote Calculator - Prototype

**Status:** Working Mockup  
**Created:** 2026-01-31  
**Purpose:** Demo AI-powered quote tool with IP rate limiting (no login required)

---

## What This Is

A conversational AI quote calculator for 3D printing services that:
- ✅ Asks questions in natural language
- ✅ Estimates costs based on project details
- ✅ **IP-based rate limiting** (no login/signup needed)
- ✅ Stays focused on 3D printing (rejects off-topic questions)
- ✅ Directs qualified leads to official quote form

---

## Features

### 1. **IP Rate Limiting**
- 5 conversations per hour per IP
- 20 messages max per conversation
- Resets after 1 hour
- Prevents abuse without requiring login

### 2. **Focused AI Prompt**
- Only answers 3D printing questions
- Rejects off-topic requests ("weather", "news", etc.)
- Structured conversation flow
- Estimates costs based on size, material, complexity

### 3. **Simple UX**
- Clean chat interface
- Example questions to get started
- Real-time rate limit display
- Mobile-responsive

---

## How to Run

### Quick Start

```bash
cd /root/dev/experiments/ai-quote-tool

# Start the server
bun run dev

# Open in browser
# http://localhost:3002 (API)
# Open index.html in browser for UI
```

### Serve the HTML File

```bash
# Option 1: Python simple server
python3 -m http.server 8000

# Option 2: Bun serve
bun --hot index.html

# Then visit: http://localhost:8000
```

---

## Architecture

```
┌─────────────────────┐
│   index.html        │  Frontend (browser)
│   - Chat UI         │
│   - Rate limit info │
└──────────┬──────────┘
           │ HTTP
           ▼
┌─────────────────────┐
│   server.ts         │  Backend (Bun server)
│   - IP rate limiting│
│   - AI responses    │
│   - CORS headers    │
└─────────────────────┘
```

---

## API Endpoints

### `POST /chat`
Send a message to the AI

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "How much to print a phone stand?" }
  ],
  "isNewConvo": true
}
```

**Response:**
```json
{
  "message": "I can help! How big should the phone stand be?"
}
```

**Rate Limited Response (429):**
```json
{
  "error": "You've reached the limit of 5 conversations per hour..."
}
```

### `GET /rate-limit-status`
Check current rate limit usage

**Response:**
```json
{
  "conversationsUsed": 2,
  "conversationsLimit": 5,
  "messagesInCurrentConvo": 5,
  "messagesLimit": 20
}
```

### `POST /end-conversation`
Manually end current conversation (frees up message limit)

---

## Rate Limiting Logic

```typescript
const LIMITS = {
  conversationsPerHour: 5,      // Max conversations
  messagesPerConversation: 20,  // Max messages per conversation
  resetWindowMs: 3600000,       // 1 hour in milliseconds
}
```

**How it works:**
1. Each IP gets 5 conversation slots per hour
2. Each conversation has 20 message limit
3. After 1 hour, counters reset
4. If limits hit, user gets clear error message

---

## AI System Prompt (Constrained)

```typescript
const SYSTEM_PROMPT = `You are a 3D printing quote assistant for Moikas.

YOUR ONLY JOB: Help estimate print costs.

STRICT RULES:
- ONLY answer 3D printing questions
- If asked ANYTHING else, respond: 
  "I can only help with 3D printing quotes. What would you like to print?"
- Never discuss: weather, news, coding, homework, etc.

YOUR PROCESS:
1. Ask what they want to print
2. Get size/dimensions
3. Ask about material needs
4. Calculate estimate
5. Direct to quote form

STAY FOCUSED. NO OFF-TOPIC RESPONSES.`
```

---

## Example Conversation Flow

**User:** "How much to print a dragon?"

**AI:** "Great choice! How big should the dragon be?"

**User:** "About 6 inches tall"

**AI:** "Perfect! Do you need it to be strong (PETG) or decorative (PLA)?"

**User:** "Decorative"

**AI:** "Based on 6 inches in PLA:
- Material: ~$15-25
- Discovery Fee: $10
- **Total: $25-35 + shipping**

Ready for official quote? Upload file at: moikas.com/products/quote"

---

## Testing Off-Topic Protection

Try asking:
- "What's the weather?"
- "Write me a poem"
- "Help with my homework"

**AI will respond:**
"I can only help with 3D printing quotes. What would you like to print?"

---

## Next Steps (Production)

### To make this production-ready:

1. **Replace mock AI with real OpenClaw API**
   ```typescript
   // In server.ts
   async function getAIResponse(messages: Message[]): Promise<string> {
     const response = await fetch('http://localhost:18789/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${process.env.OPENCLAW_TOKEN}`
       },
       body: JSON.stringify({
         model: 'anthropic/claude-sonnet-4-5-20250929',
         messages: [
           { role: 'system', content: SYSTEM_PROMPT },
           ...messages
         ]
       })
     })
     
     const data = await response.json()
     return data.choices[0].message.content
   }
   ```

2. **Use Redis for rate limiting**
   ```typescript
   import { Redis } from 'ioredis'
   const redis = new Redis()
   
   // Store rate limits in Redis instead of Map
   ```

3. **Add analytics**
   ```typescript
   // Track conversions, common questions, abuse attempts
   analytics.track('quote_requested', { cost, material, ip })
   ```

4. **Deploy**
   - Backend: Droplet or Vercel Edge Functions
   - Frontend: Vercel or embed on Shopify
   - Domain: quote.moikas.com

5. **SEO optimization**
   - Meta tags, schema markup
   - Blog content linking to tool
   - "3D printing cost calculator" keyword targeting

---

## Cost Estimates

**Running costs (production):**
- API calls: ~$0.01-0.05 per conversation
- With rate limiting: Max $0.25/hour per IP
- 100 conversations/day = ~$2-5/day
- **ROI:** 1 converted order ($20-50) pays for 10-50 conversations

**Worst case abuse:**
- Abuser hits 5 convos × 20 msgs = 100 messages
- Cost: ~$0.50-1.00
- Rate limit prevents further damage for 1 hour

---

## Improvements for Later

- [ ] Email collection after 3 messages (capture leads)
- [ ] Save conversation history (follow up on quotes)
- [ ] Multi-language support
- [ ] Voice input (mobile users)
- [ ] Image upload (show what they want to print)
- [ ] Estimate ranges based on real order data
- [ ] Integration with Shopify quote form (pre-fill)

---

## Security Notes

- IP-based rate limiting (good for public tool)
- CORS configured for local testing
- No credentials stored (stateless)
- For production: add HTTPS, proper CORS origins
- Consider Cloudflare for DDoS protection

---

**This is a working prototype!** Test it, refine the prompts, then connect to real OpenClaw API for production. 🐉
