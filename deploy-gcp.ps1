# GCP Deployment Script for YouTube Channel Analyzer (PowerShell)
# This script deploys backend and frontend to Google Cloud Run

param(
    [string]$Region = "us-central1",
    [string]$ProjectId = "",
    [string]$YouTubeApiKey = ""
)

$ErrorActionPreference = "Stop"

# Service names
$BACKEND_SERVICE = "youtube-analyzer-backend"
$FRONTEND_SERVICE = "youtube-analyzer-frontend"

# Color output functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check requirements
function Test-Requirements {
    Write-Info "Checking requirements..."
    
    if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "gcloud CLI is not installed. Please install from https://cloud.google.com/sdk/docs/install"
        exit 1
    }
    
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "Docker is not installed. Please install from https://www.docker.com/products/docker-desktop"
        exit 1
    }
    
    Write-Info "All requirements met!"
}

# Get GCP project ID
function Get-GcpProjectId {
    if ([string]::IsNullOrEmpty($script:ProjectId)) {
        $script:ProjectId = gcloud config get-value project 2>$null
        
        if ([string]::IsNullOrEmpty($script:ProjectId)) {
            Write-Error-Custom "No GCP project is set. Please run: gcloud config set project YOUR_PROJECT_ID"
            exit 1
        }
    }
    
    Write-Info "Using GCP project: $script:ProjectId"
}

# Enable required APIs
function Enable-GcpApis {
    Write-Info "Enabling required GCP APIs..."
    
    gcloud services enable `
        cloudbuild.googleapis.com `
        run.googleapis.com `
        containerregistry.googleapis.com `
        artifactregistry.googleapis.com `
        --quiet
    
    Write-Info "APIs enabled successfully!"
}

# Deploy backend
function Deploy-Backend {
    Write-Info "Building and deploying backend to Cloud Run..."
    
    # Build and push
    gcloud builds submit backend/ `
        --tag "gcr.io/$script:ProjectId/$BACKEND_SERVICE" `
        --quiet
    
    # Deploy
    gcloud run deploy $BACKEND_SERVICE `
        --image "gcr.io/$script:ProjectId/$BACKEND_SERVICE" `
        --region $Region `
        --platform managed `
        --allow-unauthenticated `
        --port 3000 `
        --memory 512Mi `
        --cpu 1 `
        --min-instances 0 `
        --max-instances 10 `
        --set-env-vars "NODE_ENV=production,YOUTUBE_API_KEY=$script:YouTubeApiKey" `
        --quiet
    
    $backendUrl = gcloud run services describe $BACKEND_SERVICE `
        --region $Region `
        --format="value(status.url)"
    
    Write-Info "Backend deployed successfully!"
    Write-Info "Backend URL: $backendUrl"
    
    return $backendUrl
}

# Deploy frontend
function Deploy-Frontend {
    Write-Info "Building and deploying frontend to Cloud Run..."
    
    # Build and push
    gcloud builds submit frontend/ `
        --tag "gcr.io/$script:ProjectId/$FRONTEND_SERVICE" `
        --quiet
    
    # Deploy
    gcloud run deploy $FRONTEND_SERVICE `
        --image "gcr.io/$script:ProjectId/$FRONTEND_SERVICE" `
        --region $Region `
        --platform managed `
        --allow-unauthenticated `
        --port 80 `
        --memory 256Mi `
        --cpu 1 `
        --min-instances 0 `
        --max-instances 10 `
        --quiet
    
    $frontendUrl = gcloud run services describe $FRONTEND_SERVICE `
        --region $Region `
        --format="value(status.url)"
    
    Write-Info "Frontend deployed successfully!"
    Write-Info "Frontend URL: $frontendUrl"
    
    return $frontendUrl
}

# Main execution
function Main {
    Write-Info "Starting YouTube Channel Analyzer deployment to GCP..."
    Write-Host ""
    
    # Get YouTube API key if not provided
    if ([string]::IsNullOrEmpty($script:YouTubeApiKey)) {
        if ([string]::IsNullOrEmpty($env:YOUTUBE_API_KEY)) {
            Write-Warning-Custom "YOUTUBE_API_KEY not found."
            $script:YouTubeApiKey = Read-Host "Enter your YouTube API Key"
        } else {
            $script:YouTubeApiKey = $env:YOUTUBE_API_KEY
        }
    }
    
    Test-Requirements
    Get-GcpProjectId
    Enable-GcpApis
    
    Write-Host ""
    Write-Info "Deploying services to region: $Region"
    Write-Host ""
    
    $backendUrl = Deploy-Backend
    Write-Host ""
    $frontendUrl = Deploy-Frontend
    
    Write-Host ""
    Write-Info "========================================="
    Write-Info "Deployment Complete!"
    Write-Info "========================================="
    Write-Info "Backend URL: $backendUrl"
    Write-Info "Frontend URL: $frontendUrl"
    Write-Info "========================================="
}

# Run main
Main
