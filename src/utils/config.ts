import Constants from 'expo-constants';
import { TOGETHER_API_KEY as ENV_API_KEY, TOGETHER_MODEL as ENV_MODEL, API_BASE_URL as ENV_BASE_URL } from '@env';

interface ExpoConfig {
  TOGETHER_API_KEY?: string;
  TOGETHER_MODEL?: string;
  API_BASE_URL?: string;
}

const extra = Constants.expoConfig?.extra as ExpoConfig;

// Debug logging
console.log('Raw config:', {
  extra: extra,
  hasKey: Boolean(extra?.TOGETHER_API_KEY),
  keyLength: extra?.TOGETHER_API_KEY?.length,
  keyPrefix: extra?.TOGETHER_API_KEY ? extra.TOGETHER_API_KEY.substring(0, 7) + '...' : 'none',
});

// Prioritize env variables from @env, then from expo config, then fallbacks
export const API_CONFIG = {
  TOGETHER_API_KEY: ENV_API_KEY || extra?.TOGETHER_API_KEY || '',
  TOGETHER_MODEL: ENV_MODEL || extra?.TOGETHER_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
  API_BASE_URL: ENV_BASE_URL || extra?.API_BASE_URL || 'https://api.together.xyz/v1',
};

// Log the actual model being used
console.log('🔍 Using Together AI model:', API_CONFIG.TOGETHER_MODEL);

if (!API_CONFIG.TOGETHER_API_KEY) {
  console.warn('⚠️ TOGETHER_API_KEY is not set in environment variables');
}

if (!API_CONFIG.TOGETHER_MODEL) {
  console.warn('⚠️ TOGETHER_MODEL is not set in environment variables');
}

if (!API_CONFIG.API_BASE_URL) {
  console.warn('⚠️ API_BASE_URL is not set in environment variables');
}

export const LLM_CONFIG = {
  DEFAULT_SYSTEM_PROMPT: "You're a witty, safety-conscious party assistant and a top bartender who gives drink and vibe suggestions.",
  MAX_TOKENS: 500,
  TEMPERATURES: {
    CREATIVE: 0.9,
    BALANCED: 0.7,
    PRECISE: 0.5,
  },
};
