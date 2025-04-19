export interface MosesContext {
  alcoholType: string;
  drinksConsumed: number | string;
  feeling: string;
  flavorProfile: string;
  currentMood: string;
  selfieAnalysis?: {
    dominant_emotion?: string;
    similarity_score?: number;
  };
  responseTime?: number;
  previousFeedback?: {
    type: FeedbackType;
    lastSuggestion?: string;
    tweakRequest?: string;
  };
  // Add support for chat interface
  systemPrompt?: string;
  question?: string;
}

export type FeedbackType = 'positive' | 'negative' | 'tweak' | 'alternative';

// API response from Together AI
export interface APIResponse {
  choices: {
    message: {
      content: string;
    };
    index: number;
    finish_reason: string;
  }[];
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LegacyAlternative {
  name: string;
  description: string;
  reasoning?: string;
  recipe?: string[];
  recipeUrl?: string;
}

export interface NewAlternativeSuggestion {
  drink: string;
  description: string;
  recipeLink?: string;
}

export interface NewAlternative {
  feeling: string;
  suggestions: NewAlternativeSuggestion[];
}

export type AlternativeType = NewAlternative | LegacyAlternative;

export interface DrinkRecommendation {
  mainSuggestion?: {
    drink: string;
    description: string;
  };
  alternatives?: AlternativeType[];
  safetyTip?: string;
  recipeLink?: string;
  vibeSummary?: {
    emoji: string;
    message: string;
  };
  // For API responses
  choices?: {
    message: {
      content: string;
    };
    index: number;
    finish_reason: string;
  }[];
  // Legacy fields for backward compatibility
  mainDrink?: {
    name: string;
    description: string;
    reasoning?: string;
    recipe?: string[];
    recipeUrl?: string;
  };
  hydrationTip?: string;
  introText?: string;
}
