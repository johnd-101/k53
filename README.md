# SA Learner K53 - Next.js + Prisma + Postgres

## Setup
1. npm install
2. Copy .env.example to .env and set DATABASE_URL
3. npx prisma migrate dev --name init
4. npm run dev -> http://localhost:3000

## Features
- Next.js 14 App Router
- Prisma 6 with Postgres adapter (PrismaPg)
- API: /api/questions, /api/questions/[id], /api/health, /api/seed
- CRUD with image upload (base64 in imageData)
- Dashboard, Manage, Test (30Q), Learn tabs
- Postgres is primary, no localStorage

## Deploy
Vercel: set DATABASE_URL env var, auto deploys.
For Postgres use Supabase, Neon, or Railway.
