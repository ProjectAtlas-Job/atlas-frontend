# Atlas Frontend

Next.js frontend for Project Atlas.

## Environment

Create `.env.local` or `.env` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Email-related pages

The frontend includes flows for:

- registration with email verification guidance
- verification by link or OTP
- resend verification email
- forgot password and reset password
- contact/support submissions

All email delivery happens on the backend. SMTP credentials never belong in frontend environment files.

## Development

```bash
npm install
npm run dev
```
