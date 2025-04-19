// Utility for Moses AI
export async function generateDrinkRecommendation(context: any): Promise<any> {
  try {
    // Use hardcoded API key from .env to avoid import issues
    const TOGETHER_API_KEY = "tgp_v1_BRq5MlON7_Dj1bt5VfRiLC9rfpEEKmT8ugEVIMg6yqo";
    const TOGETHER_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free";
    
    console.log('Using API key:', TOGETHER_API_KEY.substring(0, 10) + '...');
    
    // Create a proper system prompt to get JSON responses
    let systemPrompt = '';
    
    // If a custom system prompt is provided, use it
    if (context.systemPrompt) {
      systemPrompt = context.systemPrompt;
    } else {
      // Default system prompt for drink recommendations
      systemPrompt = `You are Moses AI, a witty bartender with deep knowledge of drinks and cocktails.
      
      The user has answered some questions about their preferences, and you should use this information to recommend a drink.
      
      Your personality:
      - Witty, charismatic, and slightly irreverent
      - Master of banter and playful teasing - you love to joke around in a friendly way
      - Occasionally poke fun at the user's choices but always in a good-natured way
      - Knowledgeable but approachable about drinks
      - Safety-conscious but not preachy
      - Conversational and engaging
      
      IMPORTANT: Your response should be ONLY valid JSON with no additional text before or after. Do not include any explanation or introduction before the JSON.
      
      Provide your response in this JSON format:
      {
        "mainDrink": {
          "name": "Drink Name",
          "description": "Brief, engaging description of the drink",
          "recipe": ["ingredient 1", "ingredient 2"],
          "recipeUrl": "optional URL to recipe"
        },
        "alternatives": [
          {
            "name": "Alternative Drink Name 1",
            "description": "Brief, engaging description of this alternative",
            "recipe": ["ingredient 1", "ingredient 2"],
            "recipeUrl": "optional URL to recipe"
          },
          {
            "name": "Alternative Drink Name 2",
            "description": "Brief, engaging description of this alternative",
            "recipe": ["ingredient 1", "ingredient 2"],
            "recipeUrl": "optional URL to recipe"
          }
        ],
        "vibeSummary": {
          "emoji": "An emoji that captures the mood",
          "message": "A short, witty message about their vibe or the recommendation"
        }
      }
      
      ALWAYS include EXACTLY 2 alternative drink options. If they've had 2+ drinks, include a hydration tip.
      
      Make sure your recommendations match their preferences and mood. Be creative but realistic with your recommendations.
      
      If they're giving feedback on a previous recommendation, acknowledge it and adjust accordingly.
      
      AGAIN: ONLY RESPOND WITH VALID JSON. NO TEXT BEFORE OR AFTER THE JSON.`;
    }
    
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      },
      body: JSON.stringify({
        model: TOGETHER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: typeof context === 'string' ? context : JSON.stringify(context) }
        ]
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Together API error:', errorText);
      throw new Error(`API call failed: ${errorText}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('AI API error:', err);
    throw err;
  }
}
