# Team Task Manager

A production-ready, full-stack collaborative Team Task Management web application built with **Node.js, Express, PostgreSQL, Passport.js (Session-based Auth), React, Vite, and Tailwind CSS**.

---

## Architecture Overview

```
Team Task Manager/
├── backend/
│   ├── src/
│   │   ├── config/             # PostgreSQL connection pool & Passport strategy
│   │   ├── controllers/        # Auth, Team, and Task controllers
│   │   ├── db/                 # database.sql schema & initDb.js runner
│   │   ├── middleware/         # Session auth guard & Express-validator rules
│   │   ├── routes/             # RESTful API route definitions
│   │   ├── app.js              # Express app, Helmet, CORS, Sessions, Passport
│   │   └── server.js           # Server bootstrap & graceful shutdown
│   ├── database.sql            # Top-level DB initialization script
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios instance (withCredentials: true)
│   │   ├── components/         # Navbar, Sidebar, TaskCard, Modals, Kanban, Table
│   │   ├── context/            # AuthContext (user state, login, register, logout)
│   │   ├── pages/              # LoginPage, RegisterPage, DashboardPage
│   │   ├── App.jsx             # React Router with ProtectedRoute wrapper
│   │   └── main.jsx
│   ├── nginx.conf              # Production Nginx SPA routing & API reverse proxy
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml          # Multi-container orchestration (Postgres, Backend, Frontend)
└── README.md
```

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14.0 or higher (or Docker Desktop)

---

## 2. Environment Variables Configuration

### Backend (`./backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your settings:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection (Option A: Full connection URI)
# DATABASE_URL=postgres://postgres:postgres@localhost:5432/team_task_manager

# Database Connection (Option B: Individual parameters)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=team_task_manager
DB_SSL=false

# Session Security
SESSION_SECRET=your_super_secret_session_key_make_it_long_and_random
SESSION_LIFETIME_HOURS=24
```

### Frontend (`./frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
# URL pointing to the Express backend API
VITE_API_URL=http://localhost:5000/api
```

---

## 3. Database Setup & Initialization

### Option A: Automatic Initialization Script (Recommended)
You can automatically create the database and run the schema script using the built-in migration runner:

```bash
cd backend
npm run db:init
```

This script:
1. Connects to PostgreSQL.
2. Creates the `team_task_manager` database if it does not already exist.
3. Applies `database.sql` (creating `users`, `teams`, `team_members`, `tasks`, and the `session` table with all indexes).

### Option B: Manual Execution via `psql` or GUI
If you prefer running the SQL script manually using `psql`, pgAdmin, or DBeaver:

```bash
# 1. Create the database
createdb -U postgres team_task_manager

# 2. Run the initialization script
psql -U postgres -d team_task_manager -f backend/database.sql
```

---

## 4. Running Development Servers Locally

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Start the Backend Server

```bash
cd backend
npm run dev
```
> The API will be available at `http://localhost:5000`
> Health check: `http://localhost:5000/health`

### Step 3: Start the Frontend Application

```bash
cd frontend
npm run dev
```
> The React app will run at `http://localhost:5173`

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. API Documentation Reference

All routes except `/auth/register` and `/auth/login` require an active session cookie.

### Authentication (`/auth` or `/api/auth`)
| Method | Route | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new user with `{ name, email, password }` |
| `POST` | `/auth/login` | Authenticate via Passport local strategy, sets HTTP-only session cookie |
| `POST` | `/auth/logout` | Destroy session and clear session cookie |
| `GET` | `/auth/me` | Retrieve currently authenticated user profile |

### Teams (`/teams` or `/api/teams`)
| Method | Route | Description |
|---|---|---|
| `POST` | `/teams` | Create new team with `{ name, description }` (creator automatically added as member) |
| `GET` | `/teams` | Get all teams the authenticated user belongs to |
| `POST` | `/teams/:id/members` | Add a member to team by `{ email }` or `{ userId }` |
| `GET` | `/teams/:id/members` | List all members of a specific team |

### Tasks (`/tasks` or `/api/tasks`)
| Method | Route | Description |
|---|---|---|
| `POST` | `/tasks` | Create task under a team with `{ title, description, team_id, assigned_to, due_date, status }` |
| `GET` | `/tasks` | Query tasks with filters: `?team_id=&assigned_to=&status=&search=` |
| `PUT` | `/tasks/:id` | Update task details, status (`'Pending'`, `'In Progress'`, `'Completed'`), or assignee |
| `DELETE` | `/tasks/:id` | Delete a task |

---

## 6. Docker Deployment (Local Multi-Container)

You can launch the complete stack (PostgreSQL + Backend + Frontend) using Docker Compose with a single command:

```bash
docker compose up --build
```

- **Frontend**: [http://localhost](http://localhost) (Port 80)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **PostgreSQL**: `localhost:5432`

To shut down:
```bash
docker compose down -v
```

---

## 7. Google Cloud Platform (GCP) Production Deployment

Follow these steps to deploy the application on GCP using **Cloud SQL (PostgreSQL)** and **Cloud Run**:

### Step 1: Set Up Cloud SQL for PostgreSQL
1. Create a Cloud SQL PostgreSQL instance:
   ```bash
   gcloud sql instances create task-manager-db \
       --database-version=POSTGRES_16 \
       --cpu=1 \
       --memory=3840MB \
       --region=us-central1
   ```
2. Create the application database and user:
   ```bash
   gcloud sql databases create team_task_manager --instance=task-manager-db
   gcloud sql users set-password postgres --instance=task-manager-db --password=STRONG_DB_PASSWORD
   ```
3. Initialize the schema using `gcloud sql import sql` or via Cloud SQL Studio running `backend/database.sql`.

### Step 2: Build & Push Docker Images to Google Artifact Registry
1. Create an Artifact Registry repository:
   ```bash
   gcloud artifacts repositories create task-manager-repo \
       --repository-format=docker \
       --location=us-central1
   ```
2. Build and push backend image:
   ```bash
   docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/task-manager-repo/backend:latest ./backend
   docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/task-manager-repo/backend:latest
   ```
3. Build and push frontend image:
   ```bash
   docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/task-manager-repo/frontend:latest ./frontend
   docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/task-manager-repo/frontend:latest
   ```

### Step 3: Deploy Backend to Cloud Run
Connect to Cloud SQL via Unix socket `/cloudsql/INSTANCE_CONNECTION_NAME`:

```bash
gcloud run deploy task-manager-backend \
    --image=us-central1-docker.pkg.dev/YOUR_PROJECT_ID/task-manager-repo/backend:latest \
    --region=us-central1 \
    --platform=managed \
    --allow-unauthenticated \
    --add-cloudsql-instances=YOUR_PROJECT_ID:us-central1:task-manager-db \
    --set-env-vars=NODE_ENV=production,PORT=5000,CLIENT_URL=https://task-manager-frontend-URL,DATABASE_URL="postgres://postgres:STRONG_DB_PASSWORD@localhost:5432/team_task_manager?host=/cloudsql/YOUR_PROJECT_ID:us-central1:task-manager-db",SESSION_SECRET="STRONG_RANDOM_SECRET_KEY"
```

### Step 4: Deploy Frontend to Cloud Run
Deploy the Nginx container image to Cloud Run:

```bash
gcloud run deploy task-manager-frontend \
    --image=us-central1-docker.pkg.dev/YOUR_PROJECT_ID/task-manager-repo/frontend:latest \
    --region=us-central1 \
    --platform=managed \
    --allow-unauthenticated \
    --port=80
```
Update the backend's `CLIENT_URL` environment variable with the frontend's deployed URL to ensure CORS and secure session cookies align properly.
