#!/bin/bash

# Find an available port starting from 8081
for PORT in $(seq 8081 8099); do
  if ! lsof -i :$PORT > /dev/null; then
    echo $PORT
    exit 0
  fi
done

# Default to 8081 if no ports are available
echo 8081
