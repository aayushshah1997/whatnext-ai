// AI Configuration
import { fetchLLMResponse, LLMRequestOptions } from '../src/utils/fetchLLMResponse';
import { LLM_CONFIG } from '../src/utils/config';

export interface QuizAnswers {
  lastDrink: string;
  alcoholPreference: string;
  drinksConsumed: string;
  mood: string;
  flavorProfile: string;
  socialContext: string;
}

export interface UserContext {
  location?: string;
  time?: string;
  previousRecommendations?: string[];
  budget?: string;
  groupSize?: string;
}

// AI Service
export class AIService {
  private static instance: AIService;
  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateDrinkRecommendation(params: {
    quizAnswers: QuizAnswers;
    userContext?: UserContext;
  }): Promise<string> {
    try {
      const options: LLMRequestOptions = {
        system: "You are Moses AI, an expert bartender and drink recommendation system. Your recommendations are personalized, considering the user's preferences and context. Be concise but engaging.",
        user: `Based on these preferences:
- Last drink: ${params.quizAnswers.lastDrink}
- Preferred alcohol: ${params.quizAnswers.alcoholPreference}
- Drinks consumed: ${params.quizAnswers.drinksConsumed}
- Current mood: ${params.quizAnswers.mood}
- Flavor preference: ${params.quizAnswers.flavorProfile}
- Social setting: ${params.quizAnswers.socialContext}
${params.userContext?.time ? `- Current time: ${params.userContext.time}` : ''}

Recommend ONE specific drink that would be perfect for this situation. Explain why it's a good choice in 2-3 sentences.`,
      };

      return await fetchLLMResponse(options);
    } catch (error) {
      console.error('Error generating drink recommendation:', error);
      throw error;
    }
  }

  async generateBarRecommendation(params: {
    location: string;
    preferences: {
      vibeType: string;
      budget: string;
      groupSize: string;
      musicPreference?: string;
    };
    userContext?: UserContext;
  }): Promise<string> {
    try {
      const options: LLMRequestOptions = {
        system: "You are Moses AI, an expert in nightlife and bar recommendations. You know all the best spots in every city and can match people with their perfect venue. Be concise but engaging.",
        user: `Find a bar in ${params.location} that matches these preferences:
- Vibe: ${params.preferences.vibeType}
- Budget: ${params.preferences.budget}
- Group size: ${params.preferences.groupSize}
${params.userContext?.time ? `- Current time: ${params.userContext.time}` : ''}
${params.preferences.musicPreference ? `- Music preference: ${params.preferences.musicPreference}` : ''}

Recommend ONE specific bar that would be perfect. Include the name and a brief 2-3 sentence description of why it's a good match.`,
      };

      return await fetchLLMResponse(options);
    } catch (error) {
      console.error('Error generating bar recommendation:', error);
      throw error;
    }
  }

  async generateMosesAdvice(params: {
    question: string;
    context: UserContext;
  }): Promise<string> {
    try {
      const options: LLMRequestOptions = {
        system: "You are Moses AI, a wise and friendly nightlife advisor. You provide helpful, responsible advice about drinks, bars, and social situations. Be concise but engaging.",
        user: `Question: ${params.question}
${params.context.time ? `Current time: ${params.context.time}` : ''}
${params.context.location ? `Location: ${params.context.location}` : ''}
${params.context.previousRecommendations?.length ? `Previous recommendations: ${params.context.previousRecommendations.join(', ')}` : ''}
${params.context.budget ? `Budget: ${params.context.budget}` : ''}
${params.context.groupSize ? `Group size: ${params.context.groupSize}` : ''}

Please provide helpful advice about nightlife, drinks, or social situations.`,
      };

      return await fetchLLMResponse(options);
    } catch (error) {
      console.error('Error generating Moses advice:', error);
      throw error;
    }
  }
}
