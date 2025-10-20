#!/bin/sh

# Check if configuration file exists
if [ ! -f "/configuration.json" ]; then
  echo "Error: Configuration file not found"
  echo "Please mount your configuration.json file to /configuration.json"
  exit 1
fi

exec "$@"
