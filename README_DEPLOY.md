# Deployment Guide for Railway

Follow these steps to deploy TaskFlow to Railway:

## 1. Prerequisites
- A Railway account (railway.app)
- GitHub repository with the code pushed

## 2. Environment Variables
You must set the following variables in the Railway dashboard:

| Variable | Description | Recommended Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Prisma DB URL | `file:./dev.db` (for SQLite) or a PostgreSQL URL |
| `NEXTAUTH_SECRET` | Secret for auth | `generate_a_long_random_string` |
| `NEXTAUTH_URL` | Deployment URL | `https://your-app-name.up.railway.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | From Google Cloud Console |

## 3. Database Setup (SQLite)
If using SQLite on Railway:
- Ensure you use a **Volume** to persist `dev.db`, otherwise data will be lost on every deploy.
- Mount the volume at `/app/prisma` (if using `file:./dev.db`).

**Better Alternative:** Use a Railway PostgreSQL service and update `DATABASE_URL` and `schema.prisma` provider to `postgresql`.

## 4. Deploy Steps
1. Create a new Project on Railway.
2. Select "Deploy from GitHub repo".
3. Add the Environment Variables.
4. Railway will automatically detect the `package.json` and use Nixpacks to build.
5. The `postinstall` script in `package.json` will automatically run `prisma generate`.
6. Run `npx prisma db push` once from the Railway terminal (or add it to your start command) to initialize the DB.

## 5. Verification
- Visit your `.up.railway.app` URL.
- Try signing up and creating a project.
- Verify that tasks can be assigned and deleted.
