import { API_CONFIG } from './config';

export interface LLMRequestOptions {
  system?: string;
  user: string;
  temperature?: number;
  max_tokens?: number;
}

export async function fetchLLMResponse(options: LLMRequestOptions): Promise<string> {
  const { TOGETHER_API_KEY, TOGETHER_MODEL, API_BASE_URL } = API_CONFIG;

  // Debug: Print full configuration
  console.log('LLM Configuration:', {
    apiBaseUrl: API_BASE_URL,
    model: TOGETHER_MODEL,
    keyLength: TOGETHER_API_KEY?.length || 0,
    keyPrefix: TOGETHER_API_KEY ? `${TOGETHER_API_KEY.substring(0, 7)}...` : 'missing',
    hasKey: Boolean(TOGETHER_API_KEY),
    options: {
      ...options,
      user: options.user.substring(0, 50) + '...' // Truncate for logging
    }
  });

  if (!TOGETHER_API_KEY) {
    throw new Error('Together API key is not configured');
  }

  // Debug logging
  console.log('Making API request with:', {
    url: `${API_BASE_URL}/chat/completions`,
    model: TOGETHER_MODEL,
    keyLength: TOGETHER_API_KEY.length,
    keyPrefix: TOGETHER_API_KEY.substring(0, 7) + '...',
  });

  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: TOGETHER_MODEL,
      messages: [
        ...(options.system ? [{ role: 'system', content: options.system }] : []),
        { role: 'user', content: options.user }
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 800,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error);
    throw new Error(`API request failed: ${response.status} ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
