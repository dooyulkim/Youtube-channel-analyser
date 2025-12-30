# Docker Quick Reference

## Local Development with Docker

### Quick Start
```bash
# 1. Set your API key
echo "YOUTUBE_API_KEY=your_api_key" > .env

# 2. Build images
npm run docker:build

# 3. Start services
npm run docker:up

# 4. Access application
# Frontend: http://localhost:8080
# Backend: http://localhost:3000
```

### Common Commands

| Command | Description |
|---------|-------------|
| `npm run docker:build` | Build all Docker images |
| `npm run docker:up` | Start all containers (detached) |
| `npm run docker:down` | Stop all containers |
| `npm run docker:logs` | View logs (follow mode) |
| `npm run docker:restart` | Restart all containers |
| `npm run docker:clean` | Stop and remove volumes |

### Individual Service Management
```bash
# Build specific service
docker-compose build backend
docker-compose build frontend

# Start specific service
docker-compose up backend
docker-compose up frontend

# Restart specific service
docker-compose restart backend

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Exec into container
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Development Workflow
```bash
# 1. Make changes to code
# 2. Rebuild affected service
docker-compose build backend  # or frontend

# 3. Restart service
docker-compose up -d backend

# 4. Check logs
docker-compose logs -f backend
```

## GCP Deployment

### Automated Deployment

**Windows (PowerShell):**
```powershell
$env:YOUTUBE_API_KEY = "your_api_key"
npm run deploy:gcp:windows
```

**Linux/Mac (Bash):**
```bash
export YOUTUBE_API_KEY="your_api_key"
npm run deploy:gcp
```

### Manual Deployment

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Deploy backend
gcloud builds submit backend/ --tag gcr.io/$PROJECT_ID/youtube-analyzer-backend
gcloud run deploy youtube-analyzer-backend \
  --image gcr.io/$PROJECT_ID/youtube-analyzer-backend \
  --region us-central1 \
  --allow-unauthenticated

# Deploy frontend
gcloud builds submit frontend/ --tag gcr.io/$PROJECT_ID/youtube-analyzer-frontend
gcloud run deploy youtube-analyzer-frontend \
  --image gcr.io/$PROJECT_ID/youtube-analyzer-frontend \
  --region us-central1 \
  --allow-unauthenticated
```

## Troubleshooting

### View Container Status
```bash
docker-compose ps
docker ps -a
```

### Check Container Logs
```bash
# All services
docker-compose logs

# Specific service with timestamps
docker-compose logs -t backend

# Last 100 lines
docker-compose logs --tail=100 frontend

# Follow in real-time
docker-compose logs -f
```

### Debugging Inside Container
```bash
# Access shell
docker-compose exec backend sh
docker-compose exec frontend sh

# Run commands
docker-compose exec backend npm run analyze -- --help
docker-compose exec backend ls -la /backend/reports
```

### Clean Up
```bash
# Stop and remove containers
docker-compose down

# Remove volumes too
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a

# Remove specific image
docker rmi youtube-analyzer-backend
docker rmi youtube-analyzer-frontend
```

### Rebuild from Scratch
```bash
# Clean everything
docker-compose down -v
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

## Production Tips

### Resource Management
```bash
# View resource usage
docker stats

# Limit resources (edit docker-compose.yml)
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

### Health Checks
```bash
# Frontend health
curl http://localhost:8080/health

# Check health status
docker-compose ps
```

### Environment Variables
```bash
# View env vars in container
docker-compose exec backend printenv

# Set additional env vars
# Edit docker-compose.yml or .env file
```

### Logs Management
```bash
# Limit log size (docker-compose.yml)
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## File Structure

```
youtube-channel-analyzer/
├── docker-compose.yml       # Orchestration configuration
├── deploy-gcp.sh           # Bash deployment script
├── deploy-gcp.ps1          # PowerShell deployment script
├── .env                    # Environment variables (not in git)
│
├── backend/
│   ├── Dockerfile          # Backend image definition
│   ├── .dockerignore       # Files to exclude
│   ├── package.json
│   └── ...
│
└── frontend/
    ├── Dockerfile          # Frontend image definition
    ├── nginx.conf          # Nginx configuration
    ├── .dockerignore       # Files to exclude
    ├── package.json
    └── ...
```

## Port Mappings

| Service | Container Port | Host Port | Description |
|---------|---------------|-----------|-------------|
| Backend | 3000 | 3000 | Node.js application |
| Frontend | 80 | 8080 | Nginx web server |

## Volume Mounts

| Local Path | Container Path | Description |
|------------|---------------|-------------|
| `./backend/reports` | `/backend/reports` | Analysis reports storage |
| `./backend/channel_config.json` | `/backend/channel_config.json` | Channel configuration (read-only) |

## Network

- **Network Name:** `youtube-analyzer-network`
- **Driver:** bridge
- **Services:** backend, frontend
- Frontend can access backend via: `http://backend:3000`

## Next Steps

1. ✅ Local development with Docker Compose
2. ✅ Deploy to GCP Cloud Run
3. ⬜ Set up CI/CD pipeline
4. ⬜ Configure monitoring and alerts
5. ⬜ Set up custom domain

For detailed documentation, see:
- [DOCKER.md](DOCKER.md) - Complete Docker guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment options
- [README.md](README.md) - Project overview
