#!/bin/sh
set -e

NO_BUILD=false
while [ "$1" = "--no-build" ]; do
  NO_BUILD=true
  shift
done

if [ -z "$1" ]; then
  echo "Usage: $0 [--no-build] <path-to-configuration.json>"
  exit 1
fi

CONFIG_FILE=$(realpath "$1")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

if [ "$NO_BUILD" = false ]; then
  echo "Building Docker image..."
  docker build -t oni-ui-test -f "$SCRIPT_DIR/Dockerfile" "$REPO_ROOT"
fi

echo ""
echo "Starting container at http://localhost:8080"
echo "Press Ctrl+C to stop"
echo ""

docker run --rm -p 8080:80 -v "$CONFIG_FILE:/configuration.json:ro" oni-ui-test
