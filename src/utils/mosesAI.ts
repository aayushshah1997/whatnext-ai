import { API_CONFIG, LLM_CONFIG } from './config';
import { MosesContext, DrinkRecommendation, FeedbackType, APIResponse } from '../types/moses';

// Define models
const PRIMARY_MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free';
const FALLBACK_MODEL = 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free';

// Use the model from config with fallback to PRIMARY_MODEL
const DEFAULT_MODEL = API_CONFIG.TOGETHER_MODEL || PRIMARY_MODEL;

// Hydration message for when all models are rate-limited
const RATE_LIMIT_MESSAGE = {
  choices: [{
    message: {
      content: JSON.stringify({
        mainSuggestion: {
          drink: "Hydration Break",
          description: "Looks like my AI brain needs a quick break ☕. Try again in a few seconds—or sip some water while we refresh!"
        },
        alternatives: [
          {
            feeling: "While you wait...",
            suggestions: [
              {
                drink: "Water with lemon",
                description: "A refreshing palate cleanser"
              },
              {
                drink: "Sparkling water",
                description: "Bubbly and fun"
              }
            ]
          }
        ],
        safetyTip: "Hydration is key to a great night out. One water between drinks keeps the fun going longer!"
      })
    },
    index: 0,
    finish_reason: "stop"
  }],
  model: "rate-limit-fallback",
  id: "fallback-response",
  created: Date.now(),
  usage: {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  }
};

function generateVibeSummary(context: MosesContext) {
  const emojis = {
    sober: '🧠',
    tipsy: '😵‍💫',
    energetic: '⚡',
    sluggish: '🐢'
  };

  const drinksConsumed = Number(context.drinksConsumed) || 0;
  const isSlowResponse = context.responseTime && context.responseTime > 5;
  const isTired = context.selfieAnalysis?.dominant_emotion === 'tired' || 
                  context.feeling.toLowerCase().includes('tired');

  if (drinksConsumed > 2) return { emoji: emojis.tipsy, description: 'Tipsy & Vibing' };
  if (isSlowResponse || isTired) return { emoji: emojis.sluggish, description: 'Taking it Easy' };
  if (context.currentMood.toLowerCase().includes('party')) return { emoji: emojis.energetic, description: 'Party Mode' };
  return { emoji: emojis.sober, description: 'Clear & Fresh' };
}

/**
 * Makes an API request to the Together AI model with rate limit handling and fallbacks
 */
async function makeModelRequest(
  prompt: string, 
  modelToUse: string = DEFAULT_MODEL, 
  retryCount: number = 0
): Promise<APIResponse> {
  console.log(`🔍 Attempt ${retryCount + 1}: Using model: ${modelToUse}`);
  
  try {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.TOGETHER_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: 'system', content: prompt },
        ],
        temperature: LLM_CONFIG.TEMPERATURES.BALANCED,
        max_tokens: LLM_CONFIG.MAX_TOKENS,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Model request error (${modelToUse}):`, errorData);
      
      // Check for rate limit error
      if (errorData.error?.type === 'model_rate_limit' || 
          errorData.error?.message?.includes('rate limit') ||
          errorData.error?.code === 'model_rate_limit') {
        
        // If we're using the primary model, try the fallback model
        if (modelToUse === PRIMARY_MODEL && retryCount === 0) {
          console.log('⚠️ Primary model rate limited. Trying fallback model...');
          return makeModelRequest(prompt, FALLBACK_MODEL, retryCount + 1);
        }
        
        // If we're already using the fallback model or have retried, wait and try once more
        if (retryCount < 2) {
          console.log(`⚠️ Model ${modelToUse} rate limited. Waiting before retry...`);
          // Wait 10-15 seconds before retrying
          const waitTime = 10000 + Math.floor(Math.random() * 5000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return makeModelRequest(prompt, modelToUse === PRIMARY_MODEL ? FALLBACK_MODEL : PRIMARY_MODEL, retryCount + 1);
        }
        
        // If we've exhausted all retries, return the hydration message
        console.log('⚠️ All models rate limited. Returning hydration message.');
        return RATE_LIMIT_MESSAGE;
      }
      
      throw new Error(`API request failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log(`✅ Successfully received response from ${modelToUse}`);
    console.log('🧠 Raw AI response:', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error in model request:', error);
    
    // For network errors or other issues, retry with a different model if we haven't tried too many times
    if (retryCount < 2) {
      console.log('⚠️ Error occurred. Trying alternative model...');
      const alternativeModel = modelToUse === PRIMARY_MODEL ? FALLBACK_MODEL : PRIMARY_MODEL;
      return makeModelRequest(prompt, alternativeModel, retryCount + 1);
    }
    
    throw error;
  }
}

export async function generateDrinkRecommendation(context: Partial<MosesContext>): Promise<APIResponse> {
  // Log API key status (not the actual key)
  console.log('TOGETHER_API_KEY status:', Boolean(API_CONFIG.TOGETHER_API_KEY) ? 'Present' : 'Missing');
  
  // Check if this is a chat interface call or drink recommendation
  const isChatInterface = context.systemPrompt && context.question;
  
  let prompt = '';
  
  if (isChatInterface) {
    // Chat interface mode
    prompt = context.systemPrompt || '';
  } else {
    // Drink recommendation mode
    const vibeSummary = generateVibeSummary(context as MosesContext);
    const systemPrompt = `
      You are What Next AI, a witty, safety-conscious party assistant and top-tier bartender.
      Your responses must be structured in JSON format with sections for different moods/vibes.
      Be fun and creative, but always prioritize user safety.
      
      Response format must be valid JSON matching this structure:
      {
        "mainSuggestion": {
          "drink": "Primary drink name",
          "description": "Main witty description"
        },
        "alternatives": [
          {
            "feeling": "If you're feeling...",
            "suggestions": [
              {
                "drink": "Drink name",
                "description": "Brief description"
              }
            ]
          }
        ],
        "safetyTip": "Optional safety advice",
        "recipeLink": "Optional recipe URL"
      }
    `;

    const userPrompt = `
      Context:
      - Alcohol preference: ${context.alcoholType}
      - Drinks consumed: ${context.drinksConsumed}
      - Current feeling: ${context.feeling}
      - Desired flavor: ${context.flavorProfile}
      - Current vibe: ${context.currentMood}
      ${context.selfieAnalysis ? `- Selfie mood: ${context.selfieAnalysis.dominant_emotion}` : ''}
      ${context.responseTime ? `- Response time: ${context.responseTime}s` : ''}
      ${context.previousFeedback ? `- Previous feedback: ${JSON.stringify(context.previousFeedback)}` : ''}

      Current vibe summary: ${vibeSummary.emoji} ${vibeSummary.description}

      ${Number(context.drinksConsumed) > 2 ? 'IMPORTANT: Include hydration advice in safetyTip' : ''}
      ${context.previousFeedback?.type === 'negative' ? 'IMPORTANT: Suggest a completely different style than before' : ''}
      ${context.previousFeedback?.type === 'tweak' ? `IMPORTANT: User wants to tweak: ${context.previousFeedback.tweakRequest}` : ''}
    `;

    prompt = systemPrompt + userPrompt;
  }

  try {
    console.log('Making API request to Together AI...');
    
    // Use our new rate-limit-aware request function
    const data = await makeModelRequest(prompt);
    console.log('API response received successfully');
    
    // Return the API response directly
    return data;
  } catch (error) {
    console.error('Error generating drink recommendation:', error);
    throw error;
  }
}
