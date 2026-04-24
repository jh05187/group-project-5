# ScamShield Hub

ScamShield Hub is a full-stack phishing and scam detection training platform built for interactive learning. Users work through short cases, decide whether each case is a scam or safe, receive immediate feedback, and track their progress over time through profiles, badges, leaderboards, and social features.

This project was developed as a group software engineering course project and is structured as a React frontend with an Express + MongoDB backend.

## What the Platform Does

- Lets users register, verify email, and log in
- Presents phishing practice cases across email, SMS, and website formats
- Gives instant feedback and explanations after each answer
- Tracks score, level, accuracy, badges, and completed cases
- Supports comments, public profiles, friend connections, and direct messages
- Includes admin tools for case management and moderation

## Current Feature Set

### User Features

- Register with email verification via a 6-digit Resend code
- Log in and persist a JWT-authenticated session
- Browse the case feed
- Filter and search cases by type and difficulty
- Answer cases with `scam`, `safe`, or `unsure`
- Review completed cases later from the feed and profile
- Comment on cases
- View personal and public profiles
- See progress analytics such as score, accuracy, badges, recent activity, and answered cases
- Use global, friends, and custom group leaderboards
- Send friend requests and private messages to accepted friends

### Admin Features

- View platform overview statistics
- Create new cases
- Edit existing cases
- Publish or unpublish cases
- Delete cases
- Review and delete comments
- View user summaries and activity details
- Delete user accounts

## Tech Stack

### Frontend

- React
- React Router
- Vite
- Plain CSS

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- bcrypt password hashing
- Resend for email verification

## Project Structure

```text
group-project-5/
├─ src/                      # Frontend application
│  ├─ components/
│  ├─ context/
│  ├─ lib/
│  └─ pages/
├─ public/                   # Static frontend assets
├─ backend/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ middleware/
│  │  ├─ models/
│  │  ├─ routes/
│  │  ├─ services/
│  │  └─ utils/
│  └─ scripts/
│     ├─ makeAdmin.js
│     └─ seedCases.js
├─ index.html
├─ package.json
└─ vercel.json
```

## Local Development Setup

### 1. Install dependencies

From the project root:

```bash
npm install
npm --prefix backend install
```

### 2. Configure environment variables

Create the frontend `.env` in the project root:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

Create `backend/.env`:

```env
PORT=4000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLIENT_ORIGIN=http://localhost:5173
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_verified_sender_address
```

### 3. Start the backend

```bash
npm --prefix backend start
```

For development watch mode:

```bash
npm run dev:backend
```

### 4. Start the frontend

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

### 5. Check backend health

```text
http://localhost:4000/api/health
```

## Deployment

### Current Deployment Pattern

This project is designed to run with:

- Frontend on Vercel
- Backend on Render
- MongoDB Atlas for the database
- Resend for email delivery

### Frontend Deployment

The frontend is a Vite application and can be deployed to Vercel as a static site.

Important frontend environment variable:

```env
VITE_API_BASE_URL=https://your-backend-domain/api
```

The included `vercel.json` handles SPA route rewrites so refreshes on routes like `/cases` or `/profile` do not break.

### Backend Deployment

Deploy the `backend` folder as a Node.js web service.

Required backend environment variables:

```env
PORT=10000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLIENT_ORIGIN=https://your-frontend-domain
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_verified_sender_address
```

Important note:

- `CLIENT_ORIGIN` must exactly match the frontend domain
- Do not include a trailing slash in `CLIENT_ORIGIN`

## Demo and Admin Setup

### Create a normal user

Use the app registration flow:

1. Enter username, email, and password
2. Receive a 6-digit verification code by email
3. Enter the code to finish account creation
4. Log in

### Promote an admin

From the project root:

```bash
npm --prefix backend run make-admin -- user@example.com
```

Then log out and log back in so the frontend reloads the updated role.

## API Overview

The backend exposes these main route groups:

- `/api/auth`
- `/api/cases`
- `/api/users`
- `/api/leaderboard`
- `/api/messages`
- `/api/admin`
- `/api/health`

## Seed Script Safety

The original seed process was destructive because it deleted the full case collection and recreated case records with new IDs. That caused manually added cases to be lost and older vote-to-case links to break.

To protect live data:

- Root-level `npm run seed` is intentionally disabled
- `backend/scripts/seedCases.js` now refuses to run unless this variable is explicitly set:

```env
ALLOW_DESTRUCTIVE_SEED=true
```

Even with that flag, the seed script should only be used when the team explicitly agrees to reset the case database.

## Recommended Team Workflow

- Do normal frontend work from the project root
- Do backend work inside `backend/`
- Avoid running destructive scripts unless the team agrees first
- Test locally before pushing
- Use the deployed frontend and backend URLs only after verifying CORS and environment variables

## Known Operational Notes

- The free backend host may cold start after inactivity
- The frontend depends on the backend being reachable at the configured API base URL
- Email verification depends on a valid Resend API key and verified sender domain
- If case documents are deleted and recreated, older vote history may lose case links and appear as `Unknown case`

## Scripts

### Root scripts

```bash
npm run dev           # Start frontend dev server
npm run dev:backend   # Start backend in watch mode
npm run build         # Build frontend
npm run lint          # Lint frontend code
npm run preview       # Preview built frontend
```

### Backend scripts

```bash
npm --prefix backend start
npm --prefix backend run dev
npm --prefix backend run make-admin -- user@example.com
```

## Contributors

Group 5 project team.
