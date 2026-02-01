# AI Quote Tool - Next.js Frontend

Modern, responsive frontend for the AI 3D Print Quote Calculator built with Next.js 15, React 19, TypeScript, and Tailwind CSS.

## Features

- **Latest Next.js 15** with App Router
- **React 19** with hooks and server components
- **TypeScript** for type safety
- **Tailwind CSS** for modern, responsive styling
- **Real-time chat interface** with typing indicators
- **Rate limit tracking** with visual feedback
- **Mobile responsive** design
- **SEO optimized** with metadata

## Getting Started

### Prerequisites

- Bun (v1.0+) or Node.js (v18+)
- Backend API running on port 3002

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
bun install
# or
npm install
```

### Configuration

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3002
```

For production, update to your API URL:
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Development

```bash
# Run development server
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build
bun run build
# or
npm run build

# Start production server
bun run start
# or
npm run start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with metadata
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── ChatInterface.tsx      # Main chat component
│   │   ├── Message.tsx            # Message bubble
│   │   ├── LoadingIndicator.tsx  # Typing animation
│   │   └── RateLimitBanner.tsx   # Rate limit display
│   ├── lib/
│   │   └── api-client.ts   # API communication
│   └── types/
│       └── index.ts        # TypeScript types
├── public/                 # Static assets
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json
```

## Components

### ChatInterface
Main chat component that manages conversation state, handles user input, and communicates with the backend API.

### Message
Displays individual chat messages with different styles for user and assistant messages.

### LoadingIndicator
Animated typing indicator shown while waiting for AI responses.

### RateLimitBanner
Displays current rate limit usage and warns when approaching limits.

## API Integration

The frontend communicates with the backend API using the following endpoints:

- `POST /api/quote/start` - Start new conversation
- `POST /api/quote/message` - Send messages
- `GET /api/rate-limit-status` - Check rate limits

All API calls are handled through `src/lib/api-client.ts`.

## Styling

Uses Tailwind CSS with custom color palette matching the brand:

- **Primary**: Purple gradient (`#667eea` to `#764ba2`)
- **Responsive**: Mobile-first design
- **Animations**: Smooth transitions and typing indicators

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel
```

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean
- AWS Amplify

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3002` |

## Performance

- **Static Generation** where possible
- **Client-side rendering** for interactive components
- **Optimized images** with Next.js Image component
- **Code splitting** automatic with Next.js

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development Tips

### Hot Reload
The dev server supports hot module replacement - changes are reflected instantly.

### TypeScript
All components are fully typed. Check types with:
```bash
bun run build
```

### Linting
```bash
bun run lint
```

## Troubleshooting

### API Connection Issues
- Ensure backend is running on port 3002
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS settings in backend

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && bun install`
- Check TypeScript errors: `bun run build`

### Styling Issues
- Ensure Tailwind CSS is properly configured
- Check `tailwind.config.ts` and `postcss.config.mjs`
- Verify `globals.css` imports Tailwind directives

## License

Proprietary - Moikas 3D Printing Service

## Support

For issues or questions:
- Email: hello@moikas.com
- Check the main README in project root
