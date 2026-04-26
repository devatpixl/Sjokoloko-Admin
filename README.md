# Sjokoloko Admin — Next.js Dashboard

Internal admin dashboard for managing the Sjokoloko store. Built with Next.js 16, React 19, and NextAuth v5. Runs on port 3001.

## Tech Stack

- **Framework:** Next.js 16.2.4
- **UI:** React 19
- **Auth:** NextAuth v5 (beta)
- **Language:** TypeScript

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard overview |
| `/orders` | Order management |
| `/products` | Product management |
| `/customers` | Customer management |
| `/waitlist` | Waitlist management |
| `/contact` | Contact submissions |
| `/login` | Admin login |

## Getting Started

### Prerequisites

- Node.js 18+
- A running instance of the Sjokoloko backend API (default: `http://localhost:8000`)

### Install

```bash
npm install
```

### Environment Variables

Copy `.env.local` and adjust as needed:

```env
NEXTAUTH_URL=http://localhost:3001
AUTH_SECRET=<change-this-in-production>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Important:** Generate a strong `AUTH_SECRET` before deploying to production.
> Run `npx auth secret` to generate one.

### Run

```bash
npm run dev      # development server on http://localhost:3001
npm run build    # production build
npm run start    # start production build (port 3001)
npm run lint     # lint
```

## Project Structure

```
app/
  (dashboard)/    # Protected dashboard routes
  api/            # API routes (admin proxy, auth, debug)
  login/          # Login page
components/       # AdminSidebar, AdminTopBar, shared UI
lib/api/          # Admin API helpers
```
