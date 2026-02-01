# AI 3D Print Quote Calculator API

**A conversational AI-powered quote calculator for 3D printing services**

This is a SaaS product that provides an API for generating 3D printing quotes through natural conversation. Other 3D printing businesses can integrate this into their websites to provide instant, accurate quotes to their customers.

---

## Features

### Core Functionality
- Conversational AI that asks natural questions about print projects
- Automatic quote calculation based on material, size, quantity, and requirements
- Detailed quote breakdowns with transparent pricing
- IP-based rate limiting (no login required)
- RESTful API for easy integration
- JSON file storage (easy to migrate to database later)

### Pricing Intelligence
- Material-based pricing (PLA: $20/kg, PETG: $25/kg, TPU: $35/kg, ABS: $22/kg)
- Automated weight estimation from dimensions
- Print time estimation
- Labor markup (1.5x material cost)
- Color and finish premiums
- Rush order handling (+50% surcharge)

### Security & Rate Limiting
- **Free Tier**: 50 quotes per month per IP
- **Pro Tier**: 2,000 quotes/month ($79/mo) - Coming soon
- **Enterprise Tier**: Unlimited quotes ($199/mo) - Coming soon
- Input sanitization and validation
- Conversation ID verification (prevents hijacking)
- CORS configuration for production

---

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) (v1.0+)
- OpenClaw API key from https://api.moikas.com

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-quote-tool

# Install dependencies
bun install

# Create environment file
cp .env.example .env

# Edit .env and add your OpenClaw API key
# OPENCLAW_API_KEY=your_key_here
```

### Running the Server

```bash
# Development mode (with auto-reload)
bun run dev

# Production mode
bun run start

# Server runs on http://localhost:3002
```

### Testing the Frontend

Open `index.html` in your browser or serve it:

```bash
# Option 1: Simple HTTP server
python3 -m http.server 8000

# Option 2: Bun
bun --hot index.html

# Then visit http://localhost:8000
```

---

## API Documentation

### Base URL
```
http://localhost:3002/api
```

### Endpoints

#### 1. Start New Quote
**POST** `/api/quote/start`

Start a new quote conversation.

**Request:**
```json
// No body required
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_abc123_def456",
    "message": "Hi! I'm here to help you get a quote for your 3D printing project. What would you like to print?"
  }
}
```

**Rate Limited Response (429):**
```json
{
  "success": false,
  "error": "You've reached your monthly limit of 50 quotes. Limit resets on 02/28/2026..."
}
```

---

#### 2. Send Message
**POST** `/api/quote/message`

Send a message in an existing conversation.

**Request:**
```json
{
  "conversationId": "conv_abc123_def456",
  "message": "I want to print a dragon figurine"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Great choice! How big should the dragon be? Please provide dimensions in inches or centimeters.",
    "quoteDetails": {
      "object": "I want to print a dragon figurine",
      "quantity": 1
    }
  }
}
```

**Complete Quote Response:**
```json
{
  "success": true,
  "data": {
    "message": "Here's your quote...",
    "quoteDetails": {
      "object": "dragon figurine",
      "dimensions": {
        "length": 6,
        "unit": "inches"
      },
      "material": "PLA",
      "quantity": 1,
      "color": "standard",
      "finish": "standard"
    },
    "quoteCalculation": {
      "materialCost": 18.50,
      "printTime": 3.5,
      "laborCost": 27.75,
      "rushFee": 0,
      "subtotal": 56.25,
      "total": 56.25,
      "breakdown": {
        "materialType": "PLA",
        "materialWeight": 92,
        "pricePerKg": 20,
        "printTimeHours": 3.5,
        "laborMarkup": 1.5
      }
    },
    "conversationComplete": true
  }
}
```

---

#### 3. Retrieve Quote
**GET** `/api/quote/:conversationId`

Retrieve a previous quote conversation.

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conv_abc123_def456",
      "startedAt": 1738425600000,
      "messages": [...],
      "quoteDetails": {...},
      "status": "quoted"
    },
    "quote": {
      "total": 56.25,
      ...
    }
  }
}
```

---

#### 4. Rate Limit Status
**GET** `/api/rate-limit-status`

Check current rate limit usage.

**Response:**
```json
{
  "success": true,
  "data": {
    "quotesUsed": 5,
    "quotesRemaining": 45,
    "quotesLimit": 50,
    "resetAt": 1740931200000,
    "currentConversation": {
      "messageCount": 4,
      "maxMessages": 30
    }
  }
}
```

---

#### 5. Health Check
**GET** `/health` or `/api/health`

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1738425600000
}
```

---

## Conversation Flow

The AI guides customers through this structured flow:

1. **What to print?** - Identify the object/item
2. **Size/Dimensions** - Get specific measurements
3. **Material preference** - PLA, PETG, TPU, or ABS
4. **Quantity** - How many copies
5. **Color** - Standard or custom color
6. **Finish** - Standard, smooth, or painted
7. **Timing** - Standard or rush order
8. **Generate Quote** - Calculate and present detailed breakdown

---

## Pricing Structure

### Material Costs (per kg)
- **PLA**: $20/kg - Best for decorative items
- **PETG**: $25/kg - Strong, durable, heat resistant
- **TPU**: $35/kg - Flexible, rubber-like
- **ABS**: $22/kg - Strong, heat resistant

### Additional Fees
- **Discovery Fee**: $10 (one-time setup)
- **Labor**: 1.5x material cost
- **Custom Color**: +$20
- **Smooth Finish**: +$15 (sanding/smoothing)
- **Painted Finish**: +$30
- **Rush Order**: +50% of subtotal

### Quote Calculation Formula
```
materialCost = (estimatedWeight / 1000) * pricePerKg
laborCost = materialCost * 1.5
subtotal = (materialCost + laborCost + $10 + colorFee + finishFee) * quantity
rushFee = rushOrder ? subtotal * 0.5 : 0
total = subtotal + rushFee
```

---

## Project Structure

```
ai-quote-tool/
├── src/
│   ├── server.ts              # Main API server
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── services/
│   │   ├── ai-service.ts      # OpenClaw API integration
│   │   ├── quote-calculator.ts # Quote calculation logic
│   │   └── rate-limiter.ts    # Rate limiting service
│   └── utils/
│       ├── storage.ts         # JSON file storage
│       └── helpers.ts         # Utility functions
├── data/
│   ├── conversations/         # Stored conversation JSON files
│   ├── quotes/                # Archived quotes
│   └── rate-limits.json       # Rate limit tracking
├── index.html                 # Demo frontend
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Server
PORT=3002

# OpenClaw API
OPENCLAW_API_URL=https://api.moikas.com/v1
OPENCLAW_API_KEY=your_api_key_here
OPENCLAW_MODEL=anthropic/claude-sonnet-4-5-20250929

# CORS (set to your domain in production)
CORS_ORIGINS=*
```

---

## Development

### Running Tests
```bash
# Test the API with curl
curl -X POST http://localhost:3002/api/quote/start

# Check rate limit status
curl http://localhost:3002/api/rate-limit-status
```

### Cleanup Data
```bash
# Remove all stored conversations and reset rate limits
bun run clean
```

### Build for Production
```bash
bun run build
```

---

## Deployment

### Recommended Platforms
1. **DigitalOcean Droplet** - Full control, $6/month
2. **Vercel** - Edge functions, auto-scaling
3. **Railway** - Simple deployment, pay-as-you-go
4. **Fly.io** - Global deployment, free tier available

### Production Checklist
- [ ] Set proper `CORS_ORIGINS` in `.env`
- [ ] Add SSL/HTTPS (use Cloudflare or Let's Encrypt)
- [ ] Set up monitoring (e.g., Sentry, LogRocket)
- [ ] Configure backups for `data/` directory
- [ ] Set up analytics tracking
- [ ] Add Cloudflare for DDoS protection
- [ ] Consider migrating to Redis for rate limiting
- [ ] Consider migrating to PostgreSQL for conversations

---

## Future Enhancements

### Planned Features
- [ ] File upload support (STL files)
- [ ] Image recognition for object identification
- [ ] Email collection for lead capture
- [ ] Webhook integration for CRM systems
- [ ] Multi-language support
- [ ] Voice input for mobile users
- [ ] Admin dashboard for monitoring quotes
- [ ] Automatic quote expiration
- [ ] Integration with payment systems
- [ ] White-label customization for Pro/Enterprise tiers

### Pricing Tiers (Coming Soon)

**Free Tier**
- 50 quotes/month
- Basic features
- Community support

**Pro Tier - $79/month**
- 2,000 quotes/month
- API access with higher limits
- White-label option
- Priority email support
- Custom branding

**Enterprise Tier - $199/month**
- Unlimited quotes
- Dedicated support
- Custom domain
- Advanced analytics
- SLA guarantee

---

## Security Notes

### Current Security Measures
- Input sanitization (removes HTML, control characters)
- Conversation ID validation
- IP-based rate limiting
- CORS protection
- Message length limits (2000 chars)
- Conversation ownership verification

### Production Recommendations
- Use HTTPS only
- Add request signing for API authentication
- Implement CAPTCHA for abuse prevention
- Set up WAF (Web Application Firewall)
- Monitor for suspicious patterns
- Regular security audits

---

## Troubleshooting

### Common Issues

**API not responding**
```bash
# Check if server is running
curl http://localhost:3002/health

# Check logs for errors
bun run dev
```

**Rate limit errors**
```bash
# Check current status
curl http://localhost:3002/api/rate-limit-status

# Reset rate limits (development only)
bun run clean
```

**OpenClaw API errors**
- Verify `OPENCLAW_API_KEY` is set correctly
- Check API key has credits/access
- Verify network connectivity to https://api.moikas.com

---

## Support

For questions or issues:
- Email: hello@moikas.com
- Documentation: See this README
- Issues: Create a GitHub issue

---

## License

Proprietary - Moikas 3D Printing Service

---

**Built with:**
- [Bun](https://bun.sh) - Fast JavaScript runtime
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [OpenClaw](https://api.moikas.com) - AI API (Claude Sonnet 4.5)
- Vanilla HTML/CSS/JS - Simple, fast frontend

**Author:** Moikas
**Version:** 1.0.0
**Last Updated:** February 2026
