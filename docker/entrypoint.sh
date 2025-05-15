#!/bin/sh

# Check if configuration file exists
if [ ! -f "$CONFIG_PATH" ]; then
  echo "Error: Configuration file not found at $CONFIG_PATH"
  echo "Please mount your configuration.json file to $CONFIG_PATH"
  exit 1
fi

# Copy configuration file to the project root for dev mode
cp "$CONFIG_PATH" /app/src/configuration.json

# Execute the CMD (yarn dev with arguments)
exec "$@"
