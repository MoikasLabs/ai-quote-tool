# AI Quote Tool - All-in-One Next.js Application

**A complete, production-ready AI-powered 3D printing quote calculator built entirely in Next.js**

This is the full-stack version combining frontend and backend into a single Next.js application using Next.js API Route Handlers.

## 🎯 What's This?

An all-in-one Next.js application that includes:
- **Modern Frontend**: React 19 + Next.js 15 with App Router
- **Backend API**: Next.js Route Handlers (no separate backend needed!)
- **AI Integration**: OpenClaw API for conversational quotes
- **Rate Limiting**: IP-based limits (50 quotes/month free tier)
- **Data Storage**: JSON file storage (easy to migrate to database)
- **TypeScript**: Full type safety throughout

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) (v1.0+) or Node.js (v18+)
- OpenClaw API key from https://api.moikas.com

### Installation

```bash
# Clone and navigate to frontend
cd frontend

# Install dependencies
bun install
# or
npm install
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your OpenClaw API key:
```bash
OPENCLAW_API_URL=https://api.moikas.com/v1
OPENCLAW_API_KEY=your_api_key_here
OPENCLAW_MODEL=anthropic/claude-sonnet-4-5-20250929
```

### Run Development Server

```bash
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app includes:
- Frontend UI at http://localhost:3000
- API routes at http://localhost:3000/api/*

**That's it!** No separate backend server needed.

## 📂 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/                    # 🔥 API Route Handlers
│   │   │   ├── health/route.ts
│   │   │   ├── quote/
│   │   │   │   ├── start/route.ts
│   │   │   │   ├── message/route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   └── rate-limit-status/route.ts
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   └── globals.css             # Global styles
│   ├── components/                 # React Components
│   │   ├── ChatInterface.tsx
│   │   ├── Message.tsx
│   │   ├── LoadingIndicator.tsx
│   │   └── RateLimitBanner.tsx
│   ├── lib/                        # Business Logic
│   │   ├── api-client.ts           # Frontend API client
│   │   ├── services/               # Backend services
│   │   │   ├── ai-service.ts
│   │   │   ├── quote-calculator.ts
│   │   │   └── rate-limiter.ts
│   │   └── utils/                  # Utilities
│   │       ├── helpers.ts
│   │       └── storage.ts
│   └── types/
│       └── index.ts                # TypeScript types
├── data/                           # Runtime data storage
│   ├── conversations/
│   ├── quotes/
│   └── rate-limits.json
├── public/                         # Static assets
├── .env.local                      # Environment variables
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## 🔌 API Routes (Next.js Route Handlers)

All API routes are built using Next.js Route Handlers in the App Router:

### Health Check
**GET** `/api/health`
- Returns server status

### Start Quote
**POST** `/api/quote/start`
- Starts new conversation
- Returns conversation ID

### Send Message
**POST** `/api/quote/message`
- Body: `{ conversationId, message }`
- Returns AI response and quote details

### Get Quote
**GET** `/api/quote/[id]`
- Retrieves conversation by ID

### Rate Limit Status
**GET** `/api/rate-limit-status`
- Returns current usage stats

## 🛠️ Technology Stack

### Frontend
- **Next.js 15**: App Router with server/client components
- **React 19**: Latest React with hooks
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling

### Backend (API Routes)
- **Next.js Route Handlers**: Server-side API endpoints
- **OpenClaw API**: AI integration (Claude Sonnet 4.5)
- **File Storage**: JSON-based storage (easy DB migration)
- **Rate Limiting**: IP-based limits

## 💾 Data Storage

Data is stored in JSON files in the `data/` directory:

- `data/conversations/` - Chat conversations
- `data/quotes/` - Generated quotes
- `data/rate-limits.json` - Rate limit tracking

**Production Note**: For production, migrate to a database like PostgreSQL or MongoDB.

## 🎨 Features

### Conversational AI
- Natural language quote gathering
- Asks clarifying questions
- Extracts details automatically

### Smart Quote Calculation
- Material-based pricing (PLA/PETG/TPU/ABS)
- Weight estimation from dimensions
- Print time estimation
- Labor markup
- Color and finish fees
- Rush order handling

### Rate Limiting
- **Free Tier**: 50 quotes/month
- **Pro Tier**: 2,000 quotes/month (coming soon)
- **Enterprise**: Unlimited (coming soon)
- Per-IP tracking
- Message limits per conversation

### Security
- Input sanitization
- Conversation ownership verification
- IP-based access control
- CORS configuration

## 🔧 Development

### Build for Production

```bash
bun run build
```

### Start Production Server

```bash
bun run start
```

### Check for Errors

```bash
bun run lint
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables:
   - `OPENCLAW_API_KEY`
   - `OPENCLAW_API_URL`
   - `OPENCLAW_MODEL`
4. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

### Other Platforms

Works on any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean
- AWS Amplify
- Self-hosted (Docker)

### Environment Variables

Set these in your deployment platform:

```bash
OPENCLAW_API_URL=https://api.moikas.com/v1
OPENCLAW_API_KEY=your_actual_api_key
OPENCLAW_MODEL=anthropic/claude-sonnet-4-5-20250929
```

## 🧪 Testing the API

### Test with curl

```bash
# Health check
curl http://localhost:3000/api/health

# Start quote
curl -X POST http://localhost:3000/api/quote/start

# Send message
curl -X POST http://localhost:3000/api/quote/message \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"conv_xxx","message":"I want to print a dragon"}'

# Check rate limits
curl http://localhost:3000/api/rate-limit-status
```

### Test the Frontend

Just open http://localhost:3000 and start chatting!

## 📊 Pricing Structure

### Material Costs (per kg)
- **PLA**: $20/kg - Decorative items
- **PETG**: $25/kg - Durable parts
- **TPU**: $35/kg - Flexible items
- **ABS**: $22/kg - Heat resistant

### Additional Fees
- Discovery Fee: $10 (one-time)
- Labor: 1.5x material cost
- Custom Color: +$20
- Smooth Finish: +$15
- Painted Finish: +$30
- Rush Order: +50% of subtotal

## 🔍 How It Works

### Conversation Flow

1. User starts conversation → GET conversation ID
2. User sends messages → AI asks questions
3. AI extracts quote details (object, size, material, quantity)
4. System calculates quote when enough info gathered
5. Returns detailed breakdown with pricing

### Quote Calculation

```typescript
materialCost = (estimatedWeight / 1000) * pricePerKg
laborCost = materialCost * 1.5
subtotal = (materialCost + laborCost + fees) * quantity
rushFee = rushOrder ? subtotal * 0.5 : 0
total = subtotal + rushFee
```

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear build cache
rm -rf .next
bun run build
```

### API Not Working

- Check `.env.local` exists with API key
- Verify API key is valid
- Check console for errors

### Data Not Saving

- Ensure `data/` directory has write permissions
- Check disk space

### Port Already in Use

```bash
# Change port
PORT=3001 bun run dev
```

## 🔐 Security Notes

### Current Security
- Input sanitization (XSS prevention)
- Conversation ownership verification
- IP-based rate limiting
- Message length limits

### Production Recommendations
- Enable HTTPS only
- Add request signing
- Implement CAPTCHA
- Set up WAF
- Regular security audits

## 📈 Scaling Considerations

### Current Setup (MVP)
- JSON file storage
- Single server
- IP-based rate limiting

### Production Scaling
- Migrate to PostgreSQL/MongoDB
- Use Redis for rate limiting
- Add CDN for static assets
- Implement caching
- Use load balancer
- Monitor with Sentry/DataDog

## 🎯 Next Steps

1. **Add your API key** in `.env.local`
2. **Customize branding** in `tailwind.config.ts`
3. **Test the quote flow** end-to-end
4. **Deploy to Vercel** for production
5. **Add analytics** (Google Analytics, Plausible)
6. **Set up monitoring** (Sentry, LogRocket)

## 📝 Migration from Separate Backend

This version **replaces** the need for a separate Bun backend. All backend logic now runs in Next.js API routes.

### What Changed:
- ✅ Backend code moved to `src/app/api/` as Route Handlers
- ✅ Services/utils moved to `src/lib/`
- ✅ API client uses relative paths (`/api/*`)
- ✅ Single `bun run dev` starts everything
- ✅ Single deployment (no separate backend)

### Benefits:
- Simpler deployment (one app, not two)
- Easier development (one server)
- Better performance (no CORS overhead)
- Cheaper hosting (one instance)

## 📚 Learn More

### Next.js Route Handlers
- [Official Docs](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Building APIs with Next.js](https://nextjs.org/blog/building-apis-with-nextjs)

### Technologies Used
- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [OpenClaw API](https://api.moikas.com)

## 💡 Support

For issues or questions:
- Email: hello@moikas.com
- Check the main project README
- Review API route handlers in `src/app/api/`

## 📄 License

Proprietary - Moikas 3D Printing Service

---

**Built with Next.js 15 App Router + Route Handlers** 🚀

Version: 2.0.0 (All-in-One)
Last Updated: February 2026
