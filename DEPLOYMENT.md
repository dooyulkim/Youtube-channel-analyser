# Deploying YouTube Channel Analyzer to Google Cloud Platform

This guide covers deploying the YouTube Channel Analyzer application to Google Cloud Platform (GCP) using different deployment options.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option 1: Cloud Run (Recommended)](#option-1-cloud-run-recommended)
- [Option 2: App Engine](#option-2-app-engine)
- [Option 3: Manual Deployment](#option-3-manual-deployment)
- [CI/CD with Cloud Build](#cicd-with-cloud-build)
- [Environment Variables](#environment-variables)
- [Updating the Application](#updating-the-application)
- [Cost Optimization](#cost-optimization)
- [Troubleshooting](#troubleshooting)

## Prerequisites

1. **Google Cloud Account**: Create one at [cloud.google.com](https://cloud.google.com)

2. **Install Google Cloud CLI** (gcloud):
   ```bash
   # Windows (using PowerShell as Administrator)
   (New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
   & $env:Temp\GoogleCloudSDKInstaller.exe
   
   # macOS
   brew install --cask google-cloud-sdk
   
   # Linux
   curl https://sdk.cloud.google.com | bash
   ```

3. **Authenticate with GCP**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

4. **Enable Required APIs**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

5. **Install Docker** (for local testing):
   - Download from [docker.com](https://www.docker.com/products/docker-desktop)

## Option 1: Cloud Run (Recommended)

Cloud Run is the recommended option because:
- ✅ Serverless (pay only for what you use)
- ✅ Auto-scaling (scales to zero when not in use)
- ✅ Easy deployment and rollbacks
- ✅ Built-in HTTPS

### Quick Deployment

1. **Set your project ID**:
   ```bash
   export PROJECT_ID="your-gcp-project-id"
   gcloud config set project $PROJECT_ID
   ```

2. **Build and deploy in one command**:
   ```bash
   gcloud run deploy youtube-channel-analyzer \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --port 8080 \
     --memory 512Mi \
     --cpu 1
   ```

   This command:
   - Builds the Docker image using Cloud Build
   - Pushes it to Container Registry
   - Deploys to Cloud Run
   - Makes it publicly accessible

3. **Access your application**:
   After deployment completes, you'll receive a URL like:
   ```
   https://youtube-channel-analyzer-xxxxx-uc.a.run.app
   ```

### Advanced Deployment

For more control, use these steps:

1. **Build the Docker image**:
   ```bash
   docker build -t gcr.io/$PROJECT_ID/youtube-channel-analyzer:v1 .
   ```

2. **Test locally** (optional):
   ```bash
   docker run -p 8080:8080 gcr.io/$PROJECT_ID/youtube-channel-analyzer:v1
   ```
   Open http://localhost:8080 in your browser

3. **Push to Container Registry**:
   ```bash
   docker push gcr.io/$PROJECT_ID/youtube-channel-analyzer:v1
   ```

4. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy youtube-channel-analyzer \
     --image gcr.io/$PROJECT_ID/youtube-channel-analyzer:v1 \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --port 8080 \
     --memory 512Mi \
     --cpu 1 \
     --min-instances 0 \
     --max-instances 10
   ```

### Custom Domain (Optional)

1. **Map your domain**:
   ```bash
   gcloud run domain-mappings create \
     --service youtube-channel-analyzer \
     --domain yourdomain.com \
     --region us-central1
   ```

2. **Update DNS records** as instructed by the output

## Option 2: App Engine

App Engine provides a simpler deployment model with less configuration.

### Deployment Steps

1. **Build the web UI**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

2. **Deploy to App Engine**:
   ```bash
   gcloud app deploy app.yaml
   ```

3. **Access your application**:
   ```bash
   gcloud app browse
   ```
   Your app will be at: `https://YOUR_PROJECT_ID.appspot.com`

### Update App Engine

To deploy updates:
```bash
cd frontend && npm run build && cd ..
gcloud app deploy
```

## Option 3: Manual Deployment

For hosting on Cloud Storage (static site only):

1. **Build the web UI**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Create a Cloud Storage bucket**:
   ```bash
   gsutil mb -p $PROJECT_ID gs://youtube-analyzer-$PROJECT_ID
   gsutil web set -m index.html gs://youtube-analyzer-$PROJECT_ID
   ```

3. **Upload files**:
   ```bash
   gsutil -m cp -r dist/* gs://youtube-analyzer-$PROJECT_ID
   ```

4. **Make bucket public**:
   ```bash
   gsutil iam ch allUsers:objectViewer gs://youtube-analyzer-$PROJECT_ID
   ```

5. **Access your site**:
   ```
   https://storage.googleapis.com/youtube-analyzer-$PROJECT_ID/index.html
   ```

## CI/CD with Cloud Build

Automate deployments when you push to GitHub/GitLab/Bitbucket.

### Setup Cloud Build Trigger

1. **Connect your repository**:
   ```bash
   # Via Console: Cloud Build > Triggers > Connect Repository
   ```

2. **Create trigger**:
   - **Event**: Push to branch
   - **Branch**: `^main$`
   - **Build Configuration**: Cloud Build configuration file (yaml or json)
   - **Location**: `cloudbuild.yaml`

3. **Grant Cloud Build permissions**:
   ```bash
   PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
   
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
     --role=roles/run.admin
   
   gcloud iam service-accounts add-iam-policy-binding \
     $PROJECT_NUMBER-compute@developer.gserviceaccount.com \
     --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
     --role=roles/iam.serviceAccountUser
   ```

4. **Push to trigger deployment**:
   ```bash
   git add .
   git commit -m "Deploy to GCP"
   git push origin main
   ```

### Manual Build Trigger

```bash
gcloud builds submit --config=cloudbuild.yaml
```

## Environment Variables

### For Cloud Run

Set environment variables during deployment:

```bash
gcloud run services update youtube-channel-analyzer \
  --set-env-vars "NODE_ENV=production,CUSTOM_VAR=value" \
  --region us-central1
```

### For App Engine

Add to `app.yaml`:
```yaml
env_variables:
  NODE_ENV: 'production'
  CUSTOM_VAR: 'value'
```

## Updating the Application

### Cloud Run Updates

```bash
# Method 1: Deploy from source (easiest)
gcloud run deploy youtube-channel-analyzer \
  --source . \
  --region us-central1

# Method 2: Build new image and deploy
docker build -t gcr.io/$PROJECT_ID/youtube-channel-analyzer:v2 .
docker push gcr.io/$PROJECT_ID/youtube-channel-analyzer:v2
gcloud run deploy youtube-channel-analyzer \
  --image gcr.io/$PROJECT_ID/youtube-channel-analyzer:v2 \
  --region us-central1
```

### Rollback

```bash
# List revisions
gcloud run revisions list --service youtube-channel-analyzer --region us-central1

# Rollback to previous revision
gcloud run services update-traffic youtube-channel-analyzer \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

## Updating Data Files

Since the web UI displays data from JSON/CSV files, you'll need to regenerate and redeploy when data changes:

1. **Generate fresh data**:
   ```bash
   npm run backend:build
   npm run backend:analyze -- --output-dir ../frontend/public/data
   ```

2. **Rebuild and deploy**:
   ```bash
   # For Cloud Run
   gcloud run deploy youtube-channel-analyzer --source . --region us-central1
   
   # For App Engine
   cd frontend && npm run build && cd ..
   gcloud app deploy
   ```

## Cost Optimization

### Cloud Run Pricing Tips

- **Free Tier**: 2 million requests/month, 360,000 GB-seconds, 180,000 vCPU-seconds
- **Min Instances**: Keep at 0 to scale to zero when idle
- **CPU Allocation**: Use "CPU is only allocated during request processing"
- **Memory**: Start with 512Mi, monitor usage

```bash
# Set cost-optimized configuration
gcloud run services update youtube-channel-analyzer \
  --min-instances 0 \
  --max-instances 5 \
  --memory 512Mi \
  --cpu 1 \
  --cpu-throttling \
  --region us-central1
```

### Monitor Costs

```bash
# View Cloud Run metrics
gcloud run services describe youtube-channel-analyzer \
  --region us-central1 \
  --format="value(status.url)"

# Check billing
gcloud billing accounts list
```

## Troubleshooting

### Build Fails

**Issue**: Docker build fails
```bash
# Check Docker is running
docker version

# Test build locally
docker build -t test .

# Check logs
docker logs <container-id>
```

### Deployment Fails

**Issue**: Cloud Run deployment fails
```bash
# View deployment logs
gcloud run services describe youtube-channel-analyzer --region us-central1

# Check Cloud Build logs
gcloud builds list --limit 5
gcloud builds log <BUILD_ID>
```

### Application Not Loading

**Issue**: 404 or blank page
```bash
# Check if service is running
gcloud run services list --region us-central1

# View logs
gcloud run services logs read youtube-channel-analyzer --region us-central1

# Test health endpoint
curl https://your-service-url.run.app/health
```

### Container Errors

```bash
# Run container locally to debug
docker run -p 8080:8080 gcr.io/$PROJECT_ID/youtube-channel-analyzer:latest

# Exec into running container
docker exec -it <container-id> sh

# Check nginx logs
docker logs <container-id>
```

### Data Not Showing

**Issue**: Web UI loads but no data appears

1. Check that data files exist in `frontend/public/data/`:
   - `channel_summary.json`
   - `channel_summary.csv`

2. Regenerate data:
   ```bash
   npm run analyze -- --output-dir frontend/public/data
   ```

3. Rebuild and redeploy

### Permission Errors

**Issue**: Permission denied errors
```bash
# Ensure Cloud Build has necessary permissions
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
  --role=roles/run.admin

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser
```

## Useful Commands

```bash
# View all Cloud Run services
gcloud run services list

# Get service URL
gcloud run services describe youtube-channel-analyzer \
  --region us-central1 \
  --format="value(status.url)"

# View real-time logs
gcloud run services logs tail youtube-channel-analyzer --region us-central1

# Delete service
gcloud run services delete youtube-channel-analyzer --region us-central1

# List container images
gcloud container images list --repository=gcr.io/$PROJECT_ID

# Delete old images
gcloud container images delete gcr.io/$PROJECT_ID/youtube-channel-analyzer:old-tag
```

## Next Steps

1. ✅ Set up custom domain
2. ✅ Configure Cloud CDN for better performance
3. ✅ Set up monitoring and alerting
4. ✅ Implement authentication if needed
5. ✅ Schedule automated data updates with Cloud Scheduler
6. ✅ Set up backup and disaster recovery

## Support

For issues specific to:
- **GCP**: [GCP Support](https://cloud.google.com/support)
- **Cloud Run**: [Documentation](https://cloud.google.com/run/docs)
- **This Application**: Open an issue in the repository

## Additional Resources

- [Cloud Run Pricing Calculator](https://cloud.google.com/products/calculator)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Container Registry Documentation](https://cloud.google.com/container-registry/docs)
- [App Engine Documentation](https://cloud.google.com/appengine/docs)
