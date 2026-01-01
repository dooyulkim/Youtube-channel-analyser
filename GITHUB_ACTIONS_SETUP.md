# GitHub Actions GCP Deployment Setup

This guide explains how to set up and use the GitHub Actions workflow for deploying to Google Cloud Platform.

## Overview

The workflow automatically deploys both the backend and frontend services to Google Cloud Run whenever code is pushed to the `main` branch. It can also be triggered manually with custom environment selection.

## Prerequisites

1. A Google Cloud Platform account with billing enabled
2. A GCP project created
3. GitHub repository with admin access

## Setup Instructions

### Step 1: Set up GCP Service Account

1. Go to the [GCP Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **IAM & Admin > Service Accounts**
4. Click **Create Service Account**
5. Name it (e.g., `github-actions-deployer`)
6. Grant the following roles:
   - Cloud Run Admin
   - Cloud Build Editor
   - Service Account User
   - Storage Admin (for Container Registry)
   - Artifact Registry Administrator

### Step 2: Set up Workload Identity Federation (Recommended)

Workload Identity Federation is more secure than using service account keys.

1. Go to **IAM & Admin > Workload Identity Federation**
2. Click **Create Pool**
   - Pool name: `github-actions-pool`
   - Pool ID: `github-actions-pool`
3. Click **Add Provider**
   - Provider type: OpenID Connect (OIDC)
   - Provider name: `github-provider`
   - Issuer: `https://token.actions.githubusercontent.com`
   - Audiences: Default audience
   - Attribute mapping:
     ```
     google.subject=assertion.sub
     attribute.actor=assertion.actor
     attribute.repository=assertion.repository
     ```
   - Attribute conditions (replace with your org/repo):
     ```
     assertion.repository == 'YOUR_GITHUB_USERNAME/Youtube-channel-analyser'
     ```
4. Grant the service account access to the workload identity pool
5. Note the Workload Identity Provider resource name (format: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID`)

### Step 3: Configure GitHub Secrets

Go to your GitHub repository → **Settings → Secrets and variables → Actions** and add the following secrets:

#### Required Secrets:

1. **GCP_PROJECT_ID**
   - Your GCP project ID
   - Example: `my-project-12345`

2. **GCP_WORKLOAD_IDENTITY_PROVIDER**
   - The full resource name from Step 2
   - Example: `projects/123456789/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider`

3. **GCP_SERVICE_ACCOUNT**
   - The email of the service account created in Step 1
   - Example: `github-actions-deployer@my-project-12345.iam.gserviceaccount.com`

4. **YOUTUBE_API_KEY**
   - Your YouTube Data API v3 key
   - Get it from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### Alternative: Using Service Account Key (Less Secure)

If you prefer using a service account key instead of Workload Identity Federation:

1. Create a JSON key for the service account
2. Base64 encode the key: `base64 -i key.json`
3. Add as **GCP_SA_KEY** secret in GitHub
4. Modify the workflow authentication step to use:
   ```yaml
   - name: Authenticate to Google Cloud
     uses: google-github-actions/auth@v2
     with:
       credentials_json: ${{ secrets.GCP_SA_KEY }}
   ```

## Usage

### Automatic Deployment

The workflow automatically runs when you push to the `main` branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Manual Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Deploy to Google Cloud Platform** workflow
4. Click **Run workflow**
5. Select the environment (production/staging)
6. Click **Run workflow**

## Workflow Configuration

### Environment Variables

Edit these in `.github/workflows/deploy-gcp.yml`:

- **GCP_REGION**: The GCP region for deployment (default: `us-central1`)
- **BACKEND_SERVICE**: Name of the backend Cloud Run service
- **FRONTEND_SERVICE**: Name of the frontend Cloud Run service

### Service Configuration

To modify Cloud Run service settings (memory, CPU, scaling):

1. Edit the `Deploy backend to Cloud Run` and `Deploy frontend to Cloud Run` steps
2. Modify the flags:
   - `--memory`: e.g., `512Mi`, `1Gi`
   - `--cpu`: e.g., `1`, `2`
   - `--min-instances`: Minimum number of instances
   - `--max-instances`: Maximum number of instances

## Monitoring Deployments

### View Deployment Status

1. Go to **Actions** tab in your GitHub repository
2. Click on the latest workflow run
3. View the deployment logs and summary

### View Deployed Services

After deployment, the workflow outputs:
- Backend URL
- Frontend URL
- Deployment details in the GitHub Actions summary

You can also view services in [GCP Console](https://console.cloud.google.com/run):
- Navigate to **Cloud Run**
- Select your services to view logs, metrics, and settings

## Troubleshooting

### Authentication Failed

**Error**: `Unable to authenticate`

**Solution**:
- Verify Workload Identity Federation is set up correctly
- Check that the service account has the required permissions
- Ensure the GitHub repository condition matches your actual repository

### Insufficient Permissions

**Error**: `Permission denied` or `PERMISSION_DENIED`

**Solution**:
- Verify the service account has all required roles
- Check IAM permissions in GCP Console
- Ensure APIs are enabled (Cloud Run, Cloud Build, Artifact Registry)

### API Not Enabled

**Error**: `API [service] not enabled`

**Solution**:
- Run the "Enable required GCP APIs" step in the workflow
- Or manually enable APIs in GCP Console

### Build Failed

**Error**: Build errors during Cloud Build

**Solution**:
- Check Docker files for syntax errors
- Verify all dependencies are correctly specified
- Review build logs in GCP Console → Cloud Build

### Deployment Timeout

**Error**: Deployment takes too long or times out

**Solution**:
- Increase memory/CPU allocation
- Check application startup time
- Review Cloud Run logs for errors

## Cost Considerations

Cloud Run pricing is based on:
- **CPU and Memory**: Allocated resources during request processing
- **Requests**: Number of requests handled
- **Networking**: Egress data

To optimize costs:
- Set `min-instances: 0` to scale to zero when not in use
- Adjust memory/CPU to match actual needs
- Use `--max-instances` to cap maximum costs
- Monitor usage in [GCP Console](https://console.cloud.google.com/billing)

## Security Best Practices

1. **Use Workload Identity Federation** instead of service account keys
2. **Limit service account permissions** to only what's needed
3. **Protect secrets** - never commit secrets to the repository
4. **Use branch protection** to prevent unauthorized deployments
5. **Enable audit logging** in GCP for security monitoring
6. **Rotate secrets regularly** (especially API keys)

## Next Steps

- Set up separate staging and production environments
- Add automated testing before deployment
- Configure custom domains for your services
- Set up monitoring and alerting
- Implement blue-green deployments for zero-downtime updates

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
