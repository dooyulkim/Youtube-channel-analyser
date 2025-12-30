# Docker Deployment Guide

This guide covers deploying the YouTube Channel Analyzer using Docker and Docker Compose locally and to Google Cloud Platform (GCP).

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Docker Deployment](#local-docker-deployment)
- [GCP Deployment Options](#gcp-deployment-options)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

1. **Docker Desktop** installed ([download here](https://www.docker.com/products/docker-desktop))
2. **Docker Compose** (included with Docker Desktop)
3. **Google Cloud CLI** for GCP deployment ([install guide](https://cloud.google.com/sdk/docs/install))
4. **YouTube Data API Key** ([get one here](https://console.cloud.google.com/apis/credentials))

## Local Docker Deployment

### Quick Start

1. **Set your API key in `.env` file**:
   ```bash
   echo "YOUTUBE_API_KEY=your_api_key_here" > .env
   ```

2. **Build and start all services**:
   ```bash
   # Build Docker images
   npm run docker:build
   
   # Start containers in detached mode
   npm run docker:up
   ```

3. **Access the application**:
   - Frontend: http://localhost:8080
   - Backend: http://localhost:3000 (if API endpoints are added)

4. **View logs**:
   ```bash
   npm run docker:logs
   ```

5. **Stop containers**:
   ```bash
   npm run docker:down
   ```

### Available Docker Commands

```bash
# Build images
npm run docker:build

# Start containers (detached)
npm run docker:up

# Stop containers
npm run docker:down

# View logs (follow mode)
npm run docker:logs

# Restart containers
npm run docker:restart

# Clean up everything (including volumes)
npm run docker:clean
```

### Manual Docker Compose Commands

```bash
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Scale services (if needed)
docker-compose up -d --scale backend=2
```

## Architecture

### Services

**Backend (`youtube-analyzer-backend`)**
- Node.js 18 Alpine
- Runs the CLI analyzer
- Exposes port 3000
- Generates reports in `/backend/reports` volume

**Frontend (`youtube-analyzer-frontend`)**  
- Nginx Alpine serving static React build
- Exposes port 80 (mapped to 8080 on host)
- Proxies `/api` requests to backend
- Includes health check endpoint

### Volumes

- `./backend/reports` - Persists generated channel analysis reports
- `./backend/channel_config.json` - Mounted as read-only for channel configuration

### Network

- `youtube-analyzer-network` - Bridge network connecting frontend and backend

## GCP Deployment Options

### Option 1: Cloud Run with Docker Compose (Recommended for Multi-Container)

Cloud Run doesn't directly support docker-compose, but you can deploy each service separately:

```bash
# Set your GCP project
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# Build and push backend
cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/youtube-analyzer-backend
gcloud run deploy youtube-analyzer-backend \
  --image gcr.io/$PROJECT_ID/youtube-analyzer-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars YOUTUBE_API_KEY=$YOUTUBE_API_KEY

# Build and push frontend
cd ../frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/youtube-analyzer-frontend
gcloud run deploy youtube-analyzer-frontend \
  --image gcr.io/$PROJECT_ID/youtube-analyzer-frontend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

### Option 2: Google Kubernetes Engine (GKE)

For full docker-compose compatibility with more control:

1. **Create GKE cluster**:
   ```bash
   gcloud container clusters create youtube-analyzer-cluster \
     --num-nodes=2 \
     --zone=us-central1-a
   ```

2. **Convert docker-compose to Kubernetes manifests**:
   ```bash
   # Install kompose
   curl -L https://github.com/kubernetes/kompose/releases/download/v1.31.2/kompose-windows-amd64.exe -o kompose.exe
   
   # Convert
   kompose convert -f docker-compose.yml
   ```

3. **Deploy to GKE**:
   ```bash
   kubectl apply -f .
   ```

### Option 3: Compute Engine with Docker Compose

Deploy docker-compose directly on a VM:

```bash
# Create VM instance
gcloud compute instances create youtube-analyzer-vm \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=cos-stable \
  --image-project=cos-cloud \
  --boot-disk-size=20GB

# SSH into VM
gcloud compute ssh youtube-analyzer-vm --zone=us-central1-a

# Install Docker Compose on VM
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository and deploy
git clone <your-repo-url>
cd Youtube-channel-analyser
echo "YOUTUBE_API_KEY=your_key" > .env
docker-compose up -d
```

### Option 4: App Engine (Existing Method)

Use the existing `app.yaml` configuration:

```bash
npm run deploy:appengine
```

## Environment Configuration

### Required Environment Variables

**Backend:**
- `YOUTUBE_API_KEY` - Your YouTube Data API key (required)
- `NODE_ENV` - Set to `production` in deployment (default)

**Frontend:**
- No environment variables required (static build)

### Setting Environment Variables

**Local (docker-compose):**
```bash
# Create .env file
cat > .env << EOF
YOUTUBE_API_KEY=your_actual_api_key
NODE_ENV=production
EOF
```

**GCP Cloud Run:**
```bash
gcloud run services update youtube-analyzer-backend \
  --set-env-vars "YOUTUBE_API_KEY=your_key" \
  --region us-central1
```

**GCP Compute Engine:**
```bash
# In .env file on the VM
echo "YOUTUBE_API_KEY=your_key" > .env
```

## Running Analysis in Docker

### Generate Reports

```bash
# Run analysis inside backend container
docker-compose exec backend node dist/index.js \
  --output-dir /backend/reports \
  --discover-channels \
  --channel-count 50 \
  --region-code US

# Or run as one-off container
docker run --rm \
  -v $(pwd)/backend/reports:/backend/reports \
  -v $(pwd)/backend/channel_config.json:/backend/channel_config.json:ro \
  -e YOUTUBE_API_KEY=$YOUTUBE_API_KEY \
  youtube-analyzer-backend \
  node dist/index.js --discover-channels
```

### Update Frontend Data

After generating reports, rebuild frontend to include new data:

```bash
# Copy reports to frontend public data directory
cp reports/channel_summary.json frontend/public/data/
cp reports/channel_summary.csv frontend/public/data/

# Rebuild frontend container
docker-compose build frontend
docker-compose up -d frontend
```

## Troubleshooting

### Container Not Starting

**Check logs:**
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Check container status:**
```bash
docker-compose ps
```

**Inspect container:**
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Port Conflicts

If ports 8080 or 3000 are already in use:

```bash
# Edit docker-compose.yml to change port mappings
# For example: "9090:80" instead of "8080:80"
```

### API Key Issues

**Verify environment variable:**
```bash
docker-compose exec backend printenv | grep YOUTUBE_API_KEY
```

**Update API key:**
```bash
# Edit .env file and restart
docker-compose restart backend
```

### Build Failures

**Clear Docker cache and rebuild:**
```bash
docker-compose build --no-cache
docker system prune -a
```

**Check Dockerfile syntax:**
```bash
# Backend
docker build -f backend/Dockerfile backend

# Frontend
docker build -f frontend/Dockerfile frontend
```

### Frontend Not Loading

**Check nginx logs:**
```bash
docker-compose logs frontend
```

**Test health endpoint:**
```bash
curl http://localhost:8080/health
```

**Verify build files:**
```bash
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### Network Issues

**Check network:**
```bash
docker network ls
docker network inspect youtube-channel-analyzer_youtube-analyzer-network
```

**Recreate network:**
```bash
docker-compose down
docker network prune
docker-compose up
```

## Performance Optimization

### Image Size Optimization

Both Dockerfiles use multi-stage builds and Alpine Linux for minimal image sizes:
- Backend: ~150MB
- Frontend: ~25MB (nginx + static files)

### Resource Limits

Add resource constraints in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Caching

Frontend nginx is configured with:
- Asset caching: 1 year
- Gzip compression enabled
- Static file optimization

## Security Best Practices

1. **Never commit `.env` file** - Use `.gitignore`
2. **Use secrets management** in production:
   ```bash
   # GCP Secret Manager
   echo -n "your_api_key" | gcloud secrets create youtube-api-key --data-file=-
   ```
3. **Keep images updated**:
   ```bash
   docker-compose pull
   docker-compose build --no-cache
   ```
4. **Use health checks** - Already configured in docker-compose
5. **Run as non-root user** in production containers

## Monitoring

### View Resource Usage

```bash
docker stats
```

### Health Checks

Both services have health checks configured:
- Frontend: `http://localhost:8080/health`
- Backend: Node.js process check

### Logs Management

```bash
# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# View logs with timestamps
docker-compose logs -t

# Limit log output
docker-compose logs --tail=100
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build images
        run: docker-compose build
      
      - name: Push to GCR
        run: |
          echo ${{ secrets.GCP_SA_KEY }} | docker login -u _json_key --password-stdin gcr.io
          docker-compose push
```

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GCP Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [nginx Configuration Guide](https://nginx.org/en/docs/)
