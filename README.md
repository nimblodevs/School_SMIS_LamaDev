# School SMIS

School management dashboard for admins, teachers, students, and parents. It is an App Router project on **Next.js 16.3.4** and **React 19.3**.

The original Lama Dev school dashboard tutorial is the UI starting point. Auth is **NextAuth (credentials)** instead of Clerk. Data lives in **PostgreSQL** through **Prisma**.

## Stack

- Next.js 16.3.4 (App Router, Turbopack by default)
- React 19.3 / React DOM 19.3
- TypeScript
- Tailwind CSS 3
- Prisma 5 + PostgreSQL
- NextAuth 4 (JWT sessions)
- Zod + React Hook Form
- Recharts, react-big-calendar, react-calendar
- next-cloudinary (image uploads)

## Features

Role-based dashboards and list views:

- Teachers, students, parents, subjects, classes, lessons
- Exams, assignments, results
- Events and announcements
- Schedules (calendar)
- Admin charts (counts, attendance, finance)

Sign in at `/sign-in`. Create an account at `/sign-up`. Unauthenticated users are redirected away from `/admin`, `/teacher`, `/student`, and `/parent`.

## Requirements

- Node.js **20.9+** (Next.js 16 minimum)
- A PostgreSQL database (local or hosted, for example Supabase)
- npm (or yarn / pnpm / bun)

## Setup

```bash
npm install
```

Create a `.env` file in the project root. Do not commit real secrets.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"

NEXTAUTH_SECRET="generate-a-long-random-string"
NEXTAUTH_URL="http://localhost:3000"

# Optional, for Cloudinary uploads in teacher/student forms
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
```

- `DATABASE_URL` is the app connection (transaction pooler is fine).
- `DIRECT_URL` is used by Prisma migrations (session mode / direct connection).
- `NEXTAUTH_SECRET` can be generated with `openssl rand -base64 32`.

Then:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should land on sign-in.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js 16 dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config; `next lint` was removed in Next.js 16) |

Prisma helpers:

```bash
npx prisma studio
npx prisma migrate dev
```

## Project layout

```
src/app/                 App Router pages and API routes
src/app/api/auth/        NextAuth handler and sign-up API
src/components/          UI, charts, tables, forms
src/lib/                 Prisma client, Zod schemas, server actions
src/auth.ts              NextAuth options and `auth()` helper
src/proxy.ts             Next.js 16 request proxy (session redirects)
prisma/schema.prisma     Database models
prisma/seed.ts           Sample school data
```

Dashboard pages are under `src/app/(dashboard)/` and are rendered dynamically because they read the session.

## Next.js 16 / React 19 notes

This repo is aligned with the Next.js 16 upgrade path:

- App Router only (no `pages/` router)
- `src/proxy.ts` instead of `middleware.ts`
- Async `params` and `searchParams` on pages
- `useActionState` instead of deprecated `useFormState`
- ESLint flat config (`eslint.config.mjs`)
- `next/image` with `images.remotePatterns`

## Auth notes

- Sessions use the credentials provider and JWT strategy.
- Sign-up writes a `User` row (bcrypt password).
- Seeded `Admin` / `Teacher` / `Student` / `Parent` usernames can still sign in through the fallback path in `src/auth.ts`.

Change those fallback passwords before using this with real school data.

## Learn more

- [Next.js 16 docs](https://nextjs.org/docs)
- [React 19](https://react.dev)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Lama Dev](https://youtube.com/lamadev)
