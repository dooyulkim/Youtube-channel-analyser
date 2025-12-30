#!/bin/bash

# GCP Deployment Script for YouTube Channel Analyzer
# This script deploys backend and frontend to Google Cloud Run

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
REGION="us-central1"
BACKEND_SERVICE="youtube-analyzer-backend"
FRONTEND_SERVICE="youtube-analyzer-frontend"

# Print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_info "Checking requirements..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it from https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    print_info "All requirements met!"
}

# Get GCP project ID
get_project_id() {
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "No GCP project is set. Please run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    
    print_info "Using GCP project: $PROJECT_ID"
}

# Enable required APIs
enable_apis() {
    print_info "Enabling required GCP APIs..."
    
    gcloud services enable cloudbuild.googleapis.com \
        run.googleapis.com \
        containerregistry.googleapis.com \
        artifactregistry.googleapis.com \
        --quiet
    
    print_info "APIs enabled successfully!"
}

# Build and push backend image
deploy_backend() {
    print_info "Building and deploying backend to Cloud Run..."
    
    # Build and push using Cloud Build
    gcloud builds submit backend/ \
        --tag "gcr.io/$PROJECT_ID/$BACKEND_SERVICE" \
        --quiet
    
    # Deploy to Cloud Run
    gcloud run deploy "$BACKEND_SERVICE" \
        --image "gcr.io/$PROJECT_ID/$BACKEND_SERVICE" \
        --region "$REGION" \
        --platform managed \
        --allow-unauthenticated \
        --port 3000 \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --set-env-vars "NODE_ENV=production,YOUTUBE_API_KEY=$YOUTUBE_API_KEY" \
        --quiet
    
    BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" \
        --region "$REGION" \
        --format="value(status.url)")
    
    print_info "Backend deployed successfully!"
    print_info "Backend URL: $BACKEND_URL"
}

# Build and push frontend image
deploy_frontend() {
    print_info "Building and deploying frontend to Cloud Run..."
    
    # Build and push using Cloud Build
    gcloud builds submit frontend/ \
        --tag "gcr.io/$PROJECT_ID/$FRONTEND_SERVICE" \
        --quiet
    
    # Deploy to Cloud Run
    gcloud run deploy "$FRONTEND_SERVICE" \
        --image "gcr.io/$PROJECT_ID/$FRONTEND_SERVICE" \
        --region "$REGION" \
        --platform managed \
        --allow-unauthenticated \
        --port 80 \
        --memory 256Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --quiet
    
    FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" \
        --region "$REGION" \
        --format="value(status.url)")
    
    print_info "Frontend deployed successfully!"
    print_info "Frontend URL: $FRONTEND_URL"
}

# Main deployment flow
main() {
    print_info "Starting YouTube Channel Analyzer deployment to GCP..."
    echo ""
    
    # Check YouTube API key
    if [ -z "$YOUTUBE_API_KEY" ]; then
        print_warning "YOUTUBE_API_KEY environment variable is not set."
        read -p "Enter your YouTube API Key: " YOUTUBE_API_KEY
        export YOUTUBE_API_KEY
    fi
    
    check_requirements
    get_project_id
    enable_apis
    
    echo ""
    print_info "Deploying services to region: $REGION"
    echo ""
    
    deploy_backend
    echo ""
    deploy_frontend
    
    echo ""
    print_info "========================================="
    print_info "Deployment Complete!"
    print_info "========================================="
    print_info "Backend URL: $BACKEND_URL"
    print_info "Frontend URL: $FRONTEND_URL"
    print_info "========================================="
}

# Run main function
main "$@"
