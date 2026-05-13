# Atlas Frontend

Next.js frontend for Project Atlas.

## What is here

- authenticated dashboard shell with refresh-backed sessions
- auth flows for login, registration, email verification, password reset, and support contact
- Sprint 2 profile editor with profile completeness and GitHub connect
- resume management UI backed by the Atlas API

## Requirements

- Node.js 20+
- npm

## Environment

Create `.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Point this value at the backend base URL for your environment.

## Development

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000` by default.

## Production checks

```bash
npm run build
```

This is the same command path Vercel uses during deployment.
