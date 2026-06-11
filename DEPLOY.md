# PlanWise Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Git
- Server with SSH access (for production)

## Local Development

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example be/.env

# Edit be/.env with your configuration
```

### 2. Start Services

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
```

### 3. Stop Services

```bash
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v
```

## Production Deployment via GitHub Actions

### Repository Variables (Settings > Variables > Actions)

| Variable | Description | Example |
|----------|-------------|---------|
| `DEPLOY_HOST` | Server hostname/IP | `203.0.113.45` |
| `DEPLOY_PATH` | Path to repo on server | `/opt/planwise` |
| `DEPLOY_USER` | SSH username | `deploy` |

### Repository Secrets (Settings > Secrets > Actions)

| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | Private SSH key for deployment user |

### Server Setup

```bash
# 1. Create deployment user
sudo adduser deploy
sudo usermod -aG docker deploy

# 2. Setup SSH access
# Copy your public key to authorized_keys
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

# 3. Create deployment directory
sudo mkdir -p /opt/planwise
sudo chown deploy:deploy /opt/planwise

# 4. Initial clone
cd /opt/planwise
git init
git remote add origin <your-repo-url>
git pull origin main

# 5. Setup environment
cp .env.example be/.env
# Edit be/.env with production values

# 6. Start services
docker compose up -d --build
```

### Deployment Flow

1. Push to `main` branch → triggers auto-deploy
2. Or manually trigger via `Actions` tab → `Deploy via SSH` → `Run workflow`

### Useful Server Commands

```bash
# Connect to server
ssh deploy@<server-ip>

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Full rebuild
docker compose down && docker compose up -d --build

# Database backup
docker compose exec postgres pg_dump -U postgres planwise > backup.sql

# Restore database
docker compose exec -T postgres psql -U postgres planwise < backup.sql
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5173 | React + Vite dev server |
| Backend | 8080 | Spring Boot API |
| PostgreSQL | 5432 | Database |

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker compose logs backend

# Common issues: missing .env, DB connection failure
```

### Database connection issues
```bash
# Verify postgres is running
docker compose ps postgres

# Check .env configuration
cat be/.env
```

### Frontend can't connect to backend
```bash
# Verify backend is healthy
curl http://localhost:8080/actuator/health

# Check VITE_API_BASE_URL in docker-compose.yml
```
