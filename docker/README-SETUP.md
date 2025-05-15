# Setup Instructions for Docker Publishing

This document provides instructions for setting up Docker Hub publishing with GitHub Actions.

## GitHub Secrets Setup

To enable publishing to Docker Hub, you need to add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets:

   - `DOCKERHUB_USERNAME`: Your Docker Hub username
   - `DOCKERHUB_TOKEN`: A Docker Hub personal access token (not your password)

## Creating a Docker Hub Token

1. Log in to [Docker Hub](https://hub.docker.com/)
2. Click on your username > Account Settings > Security
3. Click "New Access Token"
4. Give it a name like "GitHub Actions"
5. Select the appropriate permissions (at minimum, "Read & Write")
6. Copy the token and save it as the `DOCKERHUB_TOKEN` secret in your GitHub repository

## Repository Setup on Docker Hub

1. Log in to Docker Hub
2. Create a new repository with the same name as your GitHub repository (e.g., `nabu/oni-ui`)
3. Add a description and make it public or private as needed

## Verifying the Setup

After pushing to the main or paradisec branch, check:

1. The GitHub Actions tab in your repository to ensure the workflow runs successfully
2. Your Docker Hub repository to verify that the image was published
3. The GitHub Container Registry (under your repository's packages) to verify the image was published there as well

## Testing Locally

To verify the Docker image works correctly:

```bash
# Pull from Docker Hub
docker pull nabu/oni-ui:latest

# Or pull from GitHub Container Registry
docker pull ghcr.io/nabu/oni-ui:latest

# Run with your configuration
docker run -p 8080:80 -v /path/to/your/configuration.json:/app/config/configuration.json nabu/oni-ui:latest
```