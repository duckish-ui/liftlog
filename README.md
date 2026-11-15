# Liftlog

A simple gym workout tracker. Log workouts (exercises, sets, weight × reps), then see your streak, weekly volume, personal records and per-exercise progress charts.

**Live:** _see Vercel URL below_ · **Demo login:** `demo@liftlog.app` / `liftlog123`

Built for **Full Stack Decal — Project 3: Final Project**.

## Features
- **Auth** – sign up / log in with email + password (bcrypt hashes, JWT in an HTTP-only cookie). Middleware protects every app page; API routes check the session and only return the user's own data.
- **Log a workout** – start a timer, add exercises from the library, add/remove sets, tick sets off, reorder exercises, add notes. The in-progress workout lives in a **Redux Toolkit** store (persisted to localStorage so a reload never loses it).
- **Exercise library (external API)** – ~800 exercises imported from the free **wger Workout Manager API**; exercise pages also fetch live details (image, description, muscles) from wger.
- **Custom exercises** – create your own from the exercise picker.
- **History** – every workout grouped by month; open one to view, **edit** or **delete** it (full CRUD).
- **Dashboard** – workouts this week, streak, total volume, 8-week volume chart, recent workouts, personal records.
- **Progress** – per-exercise chart of heaviest set and estimated 1RM (Epley) over time.
- Responsive, with a bottom tab bar on phones.

## Tech stack
| Layer | Tools |
| --- | --- |
| Frontend | Next.js 15 (App Router, React 19, TypeScript), Tailwind CSS 4, Redux Toolkit, Recharts, lucide-react |
| Backend | Next.js Route Handlers (REST), Zod validation, jose (JWT), bcryptjs |
| Database | PostgreSQL on Neon, Prisma ORM |
| External API | wger Workout Manager API (`https://wger.de/api/v2/`) |
| Hosting | Vercel |

## REST API
| Method | Route | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create account, set session cookie |
| POST | `/api/auth/login` | Log in, set session cookie |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/me` | Current user |
| GET | `/api/exercises?q=&category=` | Search library + your custom exercises |
| POST | `/api/exercises` | Create a custom exercise |
| GET | `/api/workouts` | Your workouts with summary stats |
| POST | `/api/workouts` | Save a workout (with sets) |
| GET/PUT/DELETE | `/api/workouts/:id` | Read / replace / delete one workout |

## Data model
`User` 1—* `Workout` 1—* `WorkoutSet` *—1 `Exercise`. Library exercises have `userId = null` (imported from wger, keyed by `wgerId`); custom exercises belong to a user.

## Running locally
Requires Node 20+ and a Postgres database (e.g. a free Neon project).

```bash
cp .env.example .env      # fill in DATABASE_URL and DATABASE_URL_UNPOOLED
npm install
npx prisma migrate deploy # create tables
npm run db:seed           # import wger exercises + demo account
npm run dev               # http://localhost:3000
```

## Deploying
Import the repo in Vercel and connect a Neon database from the project's **Storage** tab (this injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED`). The build runs `prisma migrate deploy`. Sessions are signed with `JWT_SECRET` if set, otherwise with a key derived from the database URL.
