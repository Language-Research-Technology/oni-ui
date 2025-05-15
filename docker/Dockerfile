FROM node:22

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Enable yarn
RUN corepack enable

# Install dependencies
RUN yarn install

# Copy project files
COPY . .

# Create a directory for the configuration file
RUN mkdir -p /app/config

# Set environment variables
ENV CONFIG_PATH=/app/config/configuration.json

# Expose port for dev server
EXPOSE 5173

# Copy the entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Use the entrypoint script to start the dev server
ENTRYPOINT ["/entrypoint.sh"]
CMD ["yarn", "dev", "--host"]
