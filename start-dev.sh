#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default connection mode
CONNECTION_MODE="tunnel"

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --lan) CONNECTION_MODE="lan"; shift ;;
    --local) CONNECTION_MODE="local"; shift ;;
    --tunnel) CONNECTION_MODE="tunnel"; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
done

echo -e "${GREEN}🚀 Starting What Next AI development server...${NC}"
echo -e "${BLUE}Connection mode: ${CONNECTION_MODE}${NC}"

# Check if any Metro server is already running
if lsof -i :8081 > /dev/null; then
  echo -e "${YELLOW}⚠️  Port 8081 is already in use.${NC}"
  
  # Try port 8082
  if lsof -i :8082 > /dev/null; then
    echo -e "${YELLOW}⚠️  Port 8082 is also in use.${NC}"
    
    # Try port 8083
    if lsof -i :8083 > /dev/null; then
      echo -e "${YELLOW}⚠️  Port 8083 is also in use.${NC}"
      
      # Find an available port between 8084 and 8099
      for PORT in $(seq 8084 8099); do
        if ! lsof -i :$PORT > /dev/null; then
          echo -e "${GREEN}✅ Found available port: $PORT${NC}"
          break
        fi
        
        # If we've checked all ports and none are available
        if [ $PORT -eq 8099 ]; then
          echo -e "${RED}❌ No available ports found between 8081-8099.${NC}"
          echo -e "${RED}❌ Please close some Metro servers and try again.${NC}"
          exit 1
        fi
      done
    else
      PORT=8083
      echo -e "${GREEN}✅ Using port 8083${NC}"
    fi
  else
    PORT=8082
    echo -e "${GREEN}✅ Using port 8082${NC}"
  fi
else
  PORT=8081
  echo -e "${GREEN}✅ Using default port 8081${NC}"
fi

# Export the port for app.config.js to use
export EXPO_METRO_PORT=$PORT

# Ensure .expo directory exists with correct settings
mkdir -p .expo
cat > .expo/settings.json << EOL
{
  "hostType": "${CONNECTION_MODE}",
  "lanType": "ip",
  "dev": true,
  "minify": false,
  "urlRandomness": null,
  "https": false,
  "scheme": null,
  "devClient": false
}
EOL
echo -e "${GREEN}✅ Updated .expo/settings.json with ${CONNECTION_MODE} mode${NC}"

# Clear Metro cache if needed
if [ -d "node_modules/.cache" ]; then
  echo -e "${YELLOW}Clearing Metro cache...${NC}"
  rm -rf node_modules/.cache
  echo -e "${GREEN}✅ Cache cleared${NC}"
fi

# Start Expo with the selected connection mode
echo -e "${GREEN}🔄 Starting Metro bundler on port $PORT with ${CONNECTION_MODE} mode...${NC}"

case $CONNECTION_MODE in
  "tunnel")
    echo -e "${BLUE}ℹ️ Using tunnel mode for remote device access${NC}"
    npx expo start --tunnel --port $PORT --clear
    ;;
  "lan")
    echo -e "${BLUE}ℹ️ Using LAN mode for local network access${NC}"
    npx expo start --lan --port $PORT --clear
    ;;
  "local")
    echo -e "${BLUE}ℹ️ Using local mode for same-device access${NC}"
    npx expo start --localhost --port $PORT --clear
    ;;
esac
