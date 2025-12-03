/**
 * Smart Profanity Filter for UniRide
 *
 * This filter uses a severity-based approach:
 * - Mild words (bad, terrible, damn, hell) are ALLOWED
 * - Context-aware: allows words in normal sentences
 * - Only blocks severe profanity, hate speech, and direct harassment
 */

class SmartProfanityFilter {
  // Severe words that should ALWAYS be blocked (hate speech, explicit content, harassment)
  private readonly severeWords = [
    // Explicit sexual content
    'fuck', 'fucking', 'fucked', 'fucker', 'motherfucker', 'fck', 'fuk',
    'shit', 'shitting', 'shitted', 'bitch', 'bitches', 'bastard', 'whore', 'slut',
    'cock', 'pussy', 'cunt', 'twat', 'dick', 'penis', 'vagina',

    // Racial slurs and hate speech
    'nigger', 'nigga', 'chink', 'spic', 'kike',
    'fag', 'faggot', 'dyke', 'tranny', 'retard',

    // Harassment and threats
    'kill yourself', 'kys', 'die', 'suicide', 'kill urself'
  ];

  // Phrases that indicate acceptable context (prevents false positives)
  private readonly acceptableContexts = [
    'bad weather', 'bad traffic', 'bad driver', 'bad driving',
    'terrible weather', 'terrible traffic', 'terrible road',
    'damn weather', 'hell of a', 'what the hell',
    'bad experience', 'bad ride', 'bad route'
  ];

  constructor() {
    // No external library needed - we handle everything ourselves
  }

  /**
   * Check if text contains severe profanity
   * @param text - Text to check
   * @returns Object with isProfane flag and message
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
    const hasSevereProfanity = this.containsSevereProfanity(lowerText);

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
      // Escape special regex characters in the word
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use word boundaries to match whole words only
      const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
      if (regex.test(lowerText)) {
        return true;
      }
    }

    return false;
  }
}

// Export singleton instance
export const profanityFilter = new SmartProfanityFilter();

// Export helper function for easy use
export const checkMessageProfanity = (text: string) => {
  return profanityFilter.checkProfanity(text);
};