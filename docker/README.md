# Oni UI Docker Container

This directory contains Docker configuration for running Oni UI in a container.

## Quick Start

From Docker Hub:
```bash
docker run -p 8080:80 -v /path/to/your/configuration.json:/app/config/configuration.json nabu/oni-ui:latest
```

From GitHub Container Registry:
```bash
docker run -p 8080:80 -v /path/to/your/configuration.json:/app/config/configuration.json ghcr.io/nabu/oni-ui:latest
```

Then access the UI at http://localhost:8080

## Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  oni-ui:
    image: ghcr.io/nabu/oni-ui:latest
    # Or use Docker Hub: nabu/oni-ui:latest
    ports:
      - "8080:80"
    volumes:
      - ./configuration.json:/app/config/configuration.json
```

Then run:

```bash
docker-compose up -d
```

## Configuration

The container requires a mounted `configuration.json` file to function properly. This file should be mounted to `/app/config/configuration.json` in the container.

### Creating Your Configuration

Start by copying the `configuration.sample.json` file from the repository and modify it to suit your needs:

```bash
cp configuration.sample.json my-configuration.json
```

Key settings that need to be customized:

1. **API Endpoints**: Ensure all API endpoints point to your backend services
2. **Authentication**: Set up proper OAuth credentials (GitHub, CILogon)
3. **Storage Paths**: Configure OCFL and other storage paths
4. **Security Keys**: Update all security tokens and secrets

## Environment Variables

- `CONFIG_PATH`: Path to the configuration file (default: `/app/config/configuration.json`)

## Building Locally

To build the container locally:

```bash
docker build -t oni-ui -f docker/Dockerfile .
```

## Available Tags

The container is published with the following tags:

- `latest`: Latest build from the main branch
- `paradisec`: Latest build from the paradisec branch
- `vX.Y.Z`: Specific version releases
- `main`: Latest build from main branch
- `sha-xxxxxx`: Specific commit SHA

## Advanced Usage

### Custom Nginx Configuration

If you need to customize the Nginx configuration, you can mount your own config file:

```bash
docker run -p 8080:80 \
  -v /path/to/your/configuration.json:/app/config/configuration.json \
  -v /path/to/your/nginx.conf:/etc/nginx/conf.d/default.conf \
  ghcr.io/nabu/oni-ui:latest
```

### Health Checks

The container exposes port 80 which can be used for health checks with the following command:

```bash
curl -f http://container-ip/
```