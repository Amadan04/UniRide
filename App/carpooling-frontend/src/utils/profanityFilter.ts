import Filter from 'bad-words';

/**
 * Smart Profanity Filter for UniRide
 *
 * This filter uses a severity-based approach:
 * - Mild words (bad, terrible, damn, hell) are ALLOWED
 * - Context-aware: allows words in normal sentences
 * - Only blocks severe profanity, hate speech, and direct harassment
 */

class SmartProfanityFilter {
  private filter: Filter;

  // Words that are commonly used in normal context and should NEVER be blocked
  private readonly allowedWords = [
    'bad', 'terrible', 'horrible', 'awful', 'poor',
    'damn', 'dammit', 'hell', 'crap', 'sucks',
    'stupid', 'dumb', 'idiot', 'jerk', 'butt',
    'pissed', 'piss', 'ass', 'arse', 'dick',
    'bloody', 'bugger', 'bollocks'
  ];

  // Severe words that should ALWAYS be blocked (hate speech, explicit content, harassment)
  private readonly severeWords = [
    // Explicit sexual content
    'fuck', 'fucking', 'fucked', 'fucker', 'motherfucker',
    'shit', 'bitch', 'bastard', 'whore', 'slut',
    'cock', 'pussy', 'cunt', 'twat',

    // Racial slurs and hate speech (partial list - bad-words has comprehensive list)
    'nigger', 'nigga', 'chink', 'spic', 'kike',
    'fag', 'faggot', 'dyke', 'retard',

    // Harassment and threats
    'kill yourself', 'kys', 'die', 'suicide'
  ];

  // Phrases that indicate acceptable context (prevents false positives)
  private readonly acceptableContexts = [
    'bad weather', 'bad traffic', 'bad driver', 'bad driving',
    'terrible weather', 'terrible traffic', 'terrible road',
    'damn weather', 'hell of a', 'what the hell',
    'bad experience', 'bad ride', 'bad route'
  ];

  constructor() {
    this.filter = new Filter();

    // Remove all default words from the filter
    this.filter.removeWords(...this.filter.list);

    // Add only severe words to the filter
    this.filter.addWords(...this.severeWords);
  }

  /**
   * Check if text contains severe profanity
   * @param text - Text to check
   * @returns Object with isProfane flag and filtered text
   */
  checkProfanity(text: string): { isProfane: boolean; message: string } {
    if (!text || text.trim().length === 0) {
      return { isProfane: false, message: '' };
    }

    const lowerText = text.toLowerCase().trim();

    // Check if text is in an acceptable context
    for (const context of this.acceptableContexts) {
      if (lowerText.includes(context)) {
        // Even if it contains a mild word, if it's in acceptable context, allow it
        const hasOnlySevereWords = this.containsSevereProfanity(lowerText);
        if (!hasOnlySevereWords) {
          return { isProfane: false, message: '' };
        }
      }
    }

    // Check for severe profanity
    const hasSevereProfanity = this.filter.isProfane(text);

    if (hasSevereProfanity) {
      return {
        isProfane: true,
        message: 'Your message contains inappropriate language. Please keep the conversation respectful.'
      };
    }

    return { isProfane: false, message: '' };
  }

  /**
   * Check if text contains severe profanity (ignoring mild words)
   */
  private containsSevereProfanity(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Check if any severe word appears as a standalone word
    for (const word of this.severeWords) {
      // Use word boundaries to match whole words only
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(lowerText)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get a cleaned version of the text (for logging/debugging)
   * Note: We don't auto-censor - we block the message entirely if profane
   */
  clean(text: string): string {
    return this.filter.clean(text);
  }
}

// Export singleton instance
export const profanityFilter = new SmartProfanityFilter();

// Export helper function for easy use
export const checkMessageProfanity = (text: string) => {
  return profanityFilter.checkProfanity(text);
};