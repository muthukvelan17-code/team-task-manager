# Team Task Manager

A full-stack project and task management application built with Next.js, Prisma, and Tailwind CSS. Features role-based access control (Admin/Member), dynamic dashboards, and a premium user interface.

## 🚀 Features

- **Authentication**: Secure Signup & Login with NextAuth.js and bcrypt.
- **Role-Based Access Control**: Admins can create projects and tasks, while Members can only update the status of tasks assigned to them.
- **Project & Team Management**: Group tasks under dedicated projects.
- **Task Tracking**: Assign users, set due dates, and update statuses (PENDING, IN_PROGRESS, COMPLETED).
- **Dynamic Dashboard**: Overview of tasks, statuses, and overdue tracking.
- **Premium UI**: Modern design with vibrant colors, micro-animations, and glassmorphism.

## 🛠️ Technology Stack

- **Framework**: Next.js (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS & Lucide React

## 💻 Local Development

1. **Clone the repository** (if not already done) and navigate to the project folder.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Setup**:
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/taskmanager"
   NEXTAUTH_SECRET="your_random_secret_string"
   NEXTAUTH_URL="http://localhost:3000"
   ```
   *(Ensure you have a local PostgreSQL database running, or use a cloud database URL like Railway).*
4. **Run Database Migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```
5. **Start Development Server**:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Railway Deployment

This application is ready to be deployed on [Railway](https://railway.app).

1. **Push your code to GitHub**: Create a repository and push this source code.
2. **Create a Railway Project**:
   - Go to Railway Dashboard and click **New Project** -> **Deploy from GitHub repo**.
   - Select your repository.
3. **Add PostgreSQL Database**:
   - In your Railway project, click **New** -> **Database** -> **Add PostgreSQL**.
4. **Configure Environment Variables**:
   - Go to your Web App settings on Railway -> **Variables**.
   - Railway will automatically detect and link the `DATABASE_URL` from the PostgreSQL instance.
   - Add `NEXTAUTH_SECRET` (generate a secure random string).
   - Add `NEXTAUTH_URL` (set to your generated Railway domain, e.g., `https://your-app.up.railway.app`).
5. **Database Migrations on Railway**:
   - Railway's build process automatically runs `npm install` and `npm run build`.
   - The `postinstall` script in `package.json` will automatically generate the Prisma client.
   - To apply your schema to the production database, go to the Web App's **Deployments** tab. Under **Deploy Command**, you can either set it manually or open the Railway terminal (CLI) and run:
     ```bash
     npx prisma db push
     ```
6. **Domain Setup**:
   - Go to **Settings** -> **Domains** -> click **Generate Domain** to get your public URL.
   - Access your live web application!
