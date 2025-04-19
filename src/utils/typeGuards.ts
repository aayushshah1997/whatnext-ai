import { NewAlternative, LegacyAlternative } from '../types/moses';

/**
 * Type guard to check if an alternative is in the new format
 */
export const isNewAlternative = (alternative: any): alternative is NewAlternative => {
  return alternative && 'feeling' in alternative && 'suggestions' in alternative;
};

/**
 * Type guard to check if an alternative is in the legacy format
 */
export const isLegacyAlternative = (alternative: any): alternative is LegacyAlternative => {
  return alternative && 'name' in alternative && 'description' in alternative;
};
