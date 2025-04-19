const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load .env file
const result = dotenv.config();
if (result.error) {
  console.warn('⚠️ Error loading .env file:', result.error.message);
  console.warn('⚠️ Using default values for environment variables');
}

// Check if .env file exists and has required variables
const envFileExists = fs.existsSync(path.resolve(__dirname, '.env'));
if (!envFileExists) {
  console.warn('⚠️ .env file not found. Please create one based on .env.example');
}

// Get Metro port from environment or use default
const METRO_PORT = process.env.EXPO_METRO_PORT || '8081';

// Ensure required environment variables have default values
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || '';
const TOGETHER_MODEL = process.env.TOGETHER_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free';
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.together.xyz/v1';

// Debug environment variables
console.log('Environment variables loaded:', {
  TOGETHER_API_KEY: TOGETHER_API_KEY ? TOGETHER_API_KEY.substring(0, 7) + '...' : 'missing',
  TOGETHER_MODEL,
  API_BASE_URL,
  METRO_PORT,
});

module.exports = {
  expo: {
    name: "What Next AI",
    slug: "what-next-ai",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#ffffff"
      }
    },
    plugins: [
      "expo-router"
    ],
    scheme: "moses-ai",
    extra: {
      TOGETHER_API_KEY,
      TOGETHER_MODEL,
      API_BASE_URL,
      METRO_PORT,
      eas: {
        projectId: "what-next-ai"
      },
      router: {
        origin: false // Set to false to avoid URL issues
      }
    },
    // Development server configuration
    dev: {
      // Always use tunnel for better device connectivity
      devClient: {
        urlType: "tunnel"
      }
    },
    // Metro bundler port configuration
    server: {
      port: parseInt(METRO_PORT, 10)
    },
    // Enable new architecture
    newArchEnabled: true
  }
};
