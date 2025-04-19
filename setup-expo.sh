#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up Expo development environment...${NC}"

# Create .expo directory if it doesn't exist
mkdir -p .expo

# Create settings.json with tunnel mode enabled
cat > .expo/settings.json << EOL
{
  "hostType": "tunnel",
  "lanType": "ip",
  "dev": true,
  "minify": false,
  "urlRandomness": null,
  "https": false,
  "scheme": null,
  "devClient": false
}
EOL

echo -e "${GREEN}✅ Created .expo/settings.json with tunnel mode enabled${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  No .env file found. Creating a template...${NC}"
  
  cat > .env << EOL
# What Next AI Environment Variables
# IMPORTANT: This file contains sensitive information and should not be committed to version control

# Together AI API Configuration
TOGETHER_API_KEY=your_api_key_here
TOGETHER_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
API_BASE_URL=https://api.together.xyz/v1
EOL

  echo -e "${YELLOW}⚠️  Please edit .env and add your actual API keys${NC}"
else
  echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Update package.json scripts
if [ -f package.json ]; then
  echo -e "${GREEN}Updating package.json scripts...${NC}"
  
  # Check if jq is installed
  if command -v jq &> /dev/null; then
    # Use jq to update package.json
    jq '.scripts["start:dev"] = "expo start --tunnel"' package.json > package.json.tmp && mv package.json.tmp package.json
    jq '.scripts["start:clear"] = "expo start --tunnel --clear"' package.json > package.json.tmp && mv package.json.tmp package.json
    jq '.scripts["start:port"] = "PORT=\$(find-port.sh) expo start --tunnel --port \$PORT"' package.json > package.json.tmp && mv package.json.tmp package.json
    echo -e "${GREEN}✅ Updated package.json scripts${NC}"
  else
    echo -e "${YELLOW}⚠️  jq not installed. Please manually add these scripts to package.json:${NC}"
    echo -e "  \"start:dev\": \"expo start --tunnel\","
    echo -e "  \"start:clear\": \"expo start --tunnel --clear\","
    echo -e "  \"start:port\": \"PORT=\$(find-port.sh) expo start --tunnel --port \$PORT\""
  fi
else
  echo -e "${RED}❌ package.json not found${NC}"
fi

# Create port finder script
cat > find-port.sh << EOL
#!/bin/bash

# Find an available port starting from 8081
for PORT in \$(seq 8081 8099); do
  if ! lsof -i :\$PORT > /dev/null; then
    echo \$PORT
    exit 0
  fi
done

# Default to 8081 if no ports are available
echo 8081
EOL

chmod +x find-port.sh
echo -e "${GREEN}✅ Created find-port.sh script${NC}"

# Make this script executable
chmod +x setup-expo.sh

echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${GREEN}To start the app with tunnel mode, run:${NC}"
echo -e "  npm run start:dev"
echo -e "${GREEN}To start with a clean cache:${NC}"
echo -e "  npm run start:clear"
echo -e "${GREEN}To start with an available port:${NC}"
echo -e "  npm run start:port"
