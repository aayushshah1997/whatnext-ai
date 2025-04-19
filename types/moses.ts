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
    type: 'positive' | 'negative' | 'tweak';
    lastSuggestion?: string;
    tweakRequest?: string;
  };
}

export interface DrinkRecommendation {
  mainDrink: {
    name: string;
    reasoning: string;
    recipeUrl?: string;
  };
  alternatives: {
    name: string;
    reasoning: string;
    recipeUrl?: string;
  }[];
  safetyTip?: string;
  vibeSummary: {
    emoji: string;
    description: string;
  };
}

export type FeedbackType = 'positive' | 'negative' | 'tweak';
