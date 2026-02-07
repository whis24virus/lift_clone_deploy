# Deploying TitanLift Clone (lift_clone_deploy)

This repository is optimized for deployment. Follow these steps to get your full stack app running.

## 1. Frontend (Vercel)
The frontend is built with React/Vite.

1.  **Create a Vercel Project**:
    *   Import this repository in Vercel.
    *   **Root Directory**: Set to `frontend`.
    *   **Environment Variables**:
        *   `VITE_API_BASE`: The URL of your deployed backend (e.g., `https://titanlift-backend.up.railway.app/api`).
2.  **Deploy**: Vercel will build and deploy the site.

## 2. Backend (Railway / Render / Fly.io)
The backend is a Rust server using `axum` and `sqlx`. Since it's a long-running process, **it cannot be deployed as a Vercel Serverless Function** easily. Use a container platform like Railway.

1.  **Create a Railway Project**:
    *   Connect your GitHub repo.
    *   Set **Root Directory** to `backend`.
    *   Railway should auto-detect the `Dockerfile` in `backend/`.
2.  **Database (Postgres)**:
    *   Add a **Postgres** service in Railway (or use Neon/Supabase).
    *   Get the **Connection String** (e.g., `postgres://user:pass@host:5432/db`).
3.  **Environment Variables (Backend)**:
    *   `DATABASE_URL`: Your Postgres connection string.
    *   `PORT`: `8080` (or whatever Railway assigns).
4.  **Deploy**: Railway will build the Docker container and run it.

## 3. Connecting Them
Once the backend is live, update the `VITE_API_BASE` variable in your Vercel frontend project to point to the backend URL + `/api` (e.g. `https://your-backend.railway.app/api`).

## Database Migrations
The backend will automatically run migrations on startup thanks to:
```rust
sqlx::migrate!().run(&pool).await
```
in `main.rs`. Ensure your database is empty or compatible.
