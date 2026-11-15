# Liftlog — System Design

**Liftlog** is a simple gym workout tracker: log workouts (exercises, sets, weight × reps) and see your streak, weekly volume, personal records and per-exercise progress.

- **Live app:** https://liftlog-mauve.vercel.app (demo login `demo@liftlog.app` / `liftlog123`)
- **Hi-fi Figma mockup:** https://www.figma.com/design/JGtZhIBJ7DXjVZXNeMExgn
- **Code:** https://github.com/duckish-ui/liftlog

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router, React 19, TypeScript), Tailwind CSS 4, Redux Toolkit (in-progress workout state), Recharts (charts), lucide-react (icons) |
| Backend | Next.js Route Handlers (REST API), Zod (request validation), bcryptjs (password hashing), jose (JWT sessions), Next.js middleware (route protection) |
| Database | PostgreSQL (Neon, serverless) via Prisma ORM, with migrations and a seed script |
| External API | wger Workout Manager API — `https://wger.de/api/v2/exerciseinfo/` (free, no key) |
| Design | Figma (hi-fi mockup with shared components + color variables) |
| Hosting | Vercel (Neon connected through Vercel Storage) |

## Architecture

```
Browser (React pages + Redux store)
   │  fetch() JSON                 ▲ server-rendered HTML (RSC)
   ▼                               │
Next.js on Vercel ──── middleware.ts: checks JWT cookie, redirects to /login
   ├─ /api/* Route Handlers ──► Prisma ──► Neon Postgres
   ├─ Server Components (dashboard, history, exercises) ──► Prisma ──► Neon
   └─ Exercise detail page ──► wger API (cached 24h)
Build step: prisma migrate deploy → seed (imports ~970 exercises from wger once, creates demo user)
```

## Data model

| Table | Fields | Notes |
| --- | --- | --- |
| `User` | id, email (unique), name, passwordHash, unit, createdAt | |
| `Exercise` | id, wgerId (unique, nullable), name, category, muscles[], equipment[], description, userId (nullable) | `userId = null` → shared library exercise imported from wger; set → user's custom exercise |
| `Workout` | id, userId → User, title, notes, date, durationMin, createdAt | indexed on (userId, date) |
| `WorkoutSet` | id, workoutId → Workout, exerciseId → Exercise, order, setNumber, reps, weight | `order` = position of the exercise in the workout |

Relations: User 1—* Workout 1—* WorkoutSet *—1 Exercise. Deleting a workout cascades to its sets.

## REST API

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Validate, hash password, create user, set session cookie |
| POST | `/api/auth/login` | Verify password, set session cookie |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/me` | Current user profile |
| GET | `/api/exercises?q=&category=&limit=` | Search library + own custom exercises (prefix matches ranked first) |
| POST | `/api/exercises` | Create a custom exercise |
| GET | `/api/workouts` | List own workouts with summary (sets, exercises, volume) |
| POST | `/api/workouts` | Create a workout with nested exercises/sets |
| GET | `/api/workouts/:id` | One workout, sets grouped by exercise |
| PUT | `/api/workouts/:id` | Replace a workout's details and sets (transaction) |
| DELETE | `/api/workouts/:id` | Delete a workout |

Every `/api` route except auth requires a valid session and only reads/writes the logged-in user's rows.

## Features — frontend and backend

### 1. Accounts & authentication
- **Frontend:** `/signup` and `/login` pages (shared `AuthForm`), errors shown inline; nav shows "Hi, name" and a log-out button. Logged-out visitors see the landing page.
- **Backend:** signup/login routes validate with Zod, hash with bcrypt (10 rounds), and set an HTTP-only, SameSite=Lax JWT cookie (30 days, signed with jose). `middleware.ts` redirects unauthenticated requests for `/dashboard`, `/log`, `/history`, `/exercises` to `/login?next=…`, and logged-in users away from auth pages.

### 2. Log a workout
- **Frontend:** `/log` — "Start empty workout" starts a timer; add exercises through a searchable picker modal (category chips), edit weight/reps per set, tick sets done, add/remove sets, reorder/remove exercises, notes, then **Finish workout**. The whole in-progress workout lives in a **Redux Toolkit** slice and is persisted to localStorage, so reloading the page never loses a session.
- **Backend:** `POST /api/workouts` validates the payload (≥1 exercise, ≥1 set each), checks every exercise belongs to the library or the user, and creates the `Workout` + `WorkoutSet` rows in one nested write.

### 3. Exercise library (external API)
- **Frontend:** `/exercises` — search, category filter, "★ Trained" filter, pagination, cards showing muscles/equipment and how many sets you've logged. `/exercises/:id` shows the wger illustration, description, primary/secondary muscles.
- **Backend:** the seed step pages through `wger.de/api/v2/exerciseinfo` and upserts ~970 English exercises into `Exercise` (keyed by `wgerId`). The detail page also fetches live details for that exercise from wger (cached for 24 h).

### 4. Custom exercises
- **Frontend:** "Create custom exercise" inside the picker (name, category, muscles) adds it straight into the workout.
- **Backend:** `POST /api/exercises` stores it with the user's `userId`; search returns library + own custom exercises only.

### 5. Workout history (CRUD)
- **Frontend:** `/history` groups workouts by month (date tile, exercises, duration, sets, volume). `/history/:id` shows a summary and per-exercise set table with estimated 1RM; **Edit** loads the workout back into the Redux logger (`/history/:id/edit`), **Delete** asks for confirmation.
- **Backend:** `GET/PUT/DELETE /api/workouts/:id`, all scoped to the owner; PUT replaces sets inside a transaction.

### 6. Dashboard & progress
- **Frontend:** `/dashboard` — stat cards (this week, streak, total workouts, total volume), 8-week volume bar chart, recent workouts, personal-record cards. Exercise pages show a line chart of heaviest set and estimated 1RM per session plus session history.
- **Backend:** server components query the user's workouts/sets with Prisma and compute stats in `lib/stats.ts` (volume = Σ weight × reps, streak = consecutive training days, Epley e1RM = w × (1 + reps/30)).

### 7. Responsive design
- Max-width content on desktop; on phones the top links become a bottom tab bar and the logger is touch-friendly. Mobile screens are included in the Figma file.

## Team split

| Member | Responsibilities |
| --- | --- |
| Daksh | Backend & data: Prisma schema/migrations, Neon + Vercel setup, auth (JWT, middleware), REST API routes, wger import/seed, deployment |
| Partner | Frontend & design: Figma mockup, Tailwind design system, dashboard/history/exercise pages, charts, Redux workout logger, responsive layout |

Both members review each other's pull requests and test the full flow before each checkpoint.
