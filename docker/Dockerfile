FROM node:22

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json pnpm-lock.yaml pnpm-lock.yaml  pnpm-workspace.yaml ./

# Enable yarn
RUN corepack enable

# Install dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy project files
COPY . .

# Build vocabulary during container build
RUN pnpm run create-vocabs /app/vocab.json

# Set environment variables
ENV CONFIG_PATH=/app/config/configuration.json

# Create a directory for the configuration file
RUN mkdir -p /app/config

# Expose port for dev server
EXPOSE 5173

# Copy the entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Use the entrypoint script to start the dev server
ENTRYPOINT ["/entrypoint.sh"]
CMD ["pnpm", "run", "dev", "--host"]
