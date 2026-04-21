# HumDard — Humanitarian Social Platform

HumDard connects Citizens, NGOs, and Volunteers across Pakistan with AI-powered fake image detection (Content Reality badges) built in.

## Stack

| Service      | Technology              | Port  |
|--------------|-------------------------|-------|
| Frontend     | React + Vite + Tailwind | 80    |
| Backend API  | FastAPI + SQLAlchemy    | 8000  |
| ML Service   | FastAPI + Transformers  | 8001  |
| Database     | PostgreSQL 15           | 5432  |
| Cache        | Redis 7                 | 6379  |
| Object Store | MinIO                   | 9000  |
| MinIO UI     | MinIO Console           | 9001  |
| Reverse Proxy| Nginx                   | 80    |

---

## Prerequisites

- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) installed and running
- Git (to clone the repo)
- 6 GB free RAM recommended (ML service loads PyTorch)

Verify Docker is running:

```
docker --version
docker compose version
```

---

## Step 1 — Clone the Repository

```
git clone <your-repo-url>
cd HumDard
```

---

## Step 2 — Create Your .env File

Copy the example file:

```
copy .env.example .env
```

Open `.env` in any text editor and fill in the values below.

### Minimum values required to run

These are the only values you **must** change before the stack will start:

```env
# Pick any strong password for the database
POSTGRES_PASSWORD=change_me_strong_password

# Pick any password for Redis
REDIS_PASSWORD=change_me_redis_password

# Generate a random 32+ character secret (used to sign JWTs)
# Quick way: open PowerShell and run:
#   -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | % {[char]$_})
JWT_SECRET_KEY=change_me_to_a_random_32char_secret
```

Everything else has safe defaults for local development.

### Full .env reference

```env
# ── PostgreSQL ─────────────────────────────────────────────────────────────
POSTGRES_USER=humdard_user
POSTGRES_PASSWORD=change_me_strong_password   # REQUIRED: change this
POSTGRES_DB=humdard_db
POSTGRES_HOST=db
POSTGRES_PORT=5432

# ── Redis ──────────────────────────────────────────────────────────────────
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=change_me_redis_password       # REQUIRED: change this

# ── JWT ────────────────────────────────────────────────────────────────────
JWT_SECRET_KEY=change_me_to_a_random_32char_secret   # REQUIRED: change this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# ── Email / OTP (optional for local dev — leave as-is to skip email) ───────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@humdard.pk

# ── MinIO (pre-configured, no change needed) ───────────────────────────────
MINIO_ROOT_USER=humdard_admin
MINIO_ROOT_PASSWORD=humdard_secret_123
MINIO_ENDPOINT=http://minio:9000
MINIO_BUCKET=humdard-media

# ── ML Service (pre-configured, no change needed) ──────────────────────────
ML_SERVICE_URL=http://ml_service:8001

# ── Google Maps (optional) ─────────────────────────────────────────────────
GOOGLE_MAPS_API_KEY=

# ── App ────────────────────────────────────────────────────────────────────
APP_ENV=development
CORS_ORIGINS=["http://localhost", "http://localhost:3000"]
```

---

## Step 3 — Build and Start the Stack

Run this single command from the `HumDard` folder:

```
docker compose up --build
```

**First run takes 10–20 minutes** because:
- Python dependencies are downloaded and compiled
- ML service downloads PyTorch (~800 MB) and Transformers
- React app is compiled

Subsequent starts (without `--build`) take under 30 seconds:

```
docker compose up
```

To run in the background (detached mode):

```
docker compose up --build -d
```

---

## Step 4 — Open in Browser

Once all containers show `Started` in the terminal, open these URLs:

| What                    | URL                              | Login                                    |
|-------------------------|----------------------------------|------------------------------------------|
| **Frontend (app)**      | http://localhost                 | Register a new account                   |
| **Backend Swagger docs**| http://localhost/api/docs        | Authorize with Bearer token from login   |
| **Backend ReDoc**       | http://localhost/api/redoc       | —                                        |
| **MinIO dashboard**     | http://localhost:9001            | `humdard_admin` / `humdard_secret_123`   |
| **ML Service docs**     | http://localhost:8001/docs       | —                                        |

> The frontend and API are served through Nginx on port 80. MinIO console and ML service are on their own ports.

---

## Step 5 — Check All Containers Are Running

```
docker compose ps
```

Expected output — all services should show `running`:

```
NAME                    STATUS          PORTS
humdard-nginx-1         running         0.0.0.0:80->80/tcp
humdard-frontend-1      running
humdard-backend-1       running
humdard-ml_service-1    running
humdard-db-1            running
humdard-redis-1         running
humdard-minio-1         running         0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp
```

### Check individual service health

```
# Backend API health check
curl http://localhost/api/health

# ML service health check
curl http://localhost:8001/health
```

Both should return `{"status": "ok"}`.

### View logs for a specific service

```
docker compose logs backend
docker compose logs ml_service
docker compose logs db
```

### Follow live logs for all services

```
docker compose logs -f
```

---

## Step 6 — Stop Everything

Stop containers but keep data volumes:

```
docker compose down
```

Stop and **delete all data** (database, MinIO files, Redis cache):

```
docker compose down -v
```

---

## Troubleshooting

### Port 80 is already in use

Stop IIS or any other web server using port 80, or change the nginx port in `docker-compose.yml`:

```yaml
nginx:
  ports:
    - "8080:80"   # change 80 to 8080
```

Then access the app at `http://localhost:8080`.

### Backend crashes on startup

Usually means the `.env` file is missing or has wrong values. Check:

```
docker compose logs backend
```

Common causes:
- `POSTGRES_PASSWORD` mismatch between backend and db service
- `JWT_SECRET_KEY` is empty

### Database connection refused

The `db` container may still be initialising. Wait 10 seconds and restart:

```
docker compose restart backend
```

### MinIO bucket not created

The backend creates the bucket automatically on startup. If it fails:

1. Open http://localhost:9001
2. Log in with `humdard_admin` / `humdard_secret_123`
3. Create a bucket named `humdard-media` manually
4. Set its access policy to **Public**

### ML service is slow to start

PyTorch loads on first request, not at boot. The first image analysis request may take 30–60 seconds. Subsequent requests are fast.

---

## Project Structure

```
HumDard/
├── docker-compose.yml          # All 7 services
├── .env.example                # Environment template
├── .env                        # Your local config (git-ignored)
├── nginx/
│   └── nginx.conf              # Reverse proxy config
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── pages/              # 11 pages (Landing, Feed, Profile, ...)
│   │   ├── components/         # 10 components (PostCard, Sidebar, ...)
│   │   ├── store/              # Zustand stores (auth, feed, notifications)
│   │   └── api/                # Axios API clients
│   └── package.json
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── core/               # config, database, security
│       ├── models/             # SQLAlchemy ORM models
│       ├── api/routers/        # FastAPI route handlers
│       └── utils/              # storage (MinIO), email
└── ml_service/
    ├── Dockerfile
    ├── requirements.txt
    └── app/
        ├── main.py
        ├── model.py            # Fake detection pipeline (3 fallback options)
        └── tasks.py            # Background callbacks with retry
```

---

## Team Development Workflow

### Running only the backend (faster iteration)

```
docker compose up db redis minio -d
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Running only the frontend

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the Vite dev server proxies `/api` to the backend.

### Rebuilding a single service after code changes

```
docker compose up --build backend
```

---

## Environment Notes

- Do **not** commit `.env` to git — it contains secrets
- `POSTGRES_HOST=db`, `REDIS_HOST=redis`, `MINIO_ENDPOINT=http://minio:9000` — these hostnames work inside Docker only. When running services locally, change them to `localhost`
- The `humdard-media` MinIO bucket is created automatically on first backend startup with public-read access so uploaded images are viewable without authentication
