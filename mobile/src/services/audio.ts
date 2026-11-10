import * as Speech from 'expo-speech';

const LANGUAGE_CODE_MAP: Record<string, string> = {
  mr: 'mr-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  en: 'en-IN',
};

// Marathi, Hindi, and most other common fallback candidates here share the
// Devanagari script, so a voice for one can still correctly pronounce text
// in the others (unlike falling back to an English voice, which can only
// read embedded Latin-script words and silently skips the rest).
const SCRIPT_FALLBACK_CHAIN: Record<string, string[]> = {
  mr: ['mr-IN', 'mr', 'hi-IN', 'hi'],
  hi: ['hi-IN', 'hi'],
  te: ['te-IN', 'te'],
  en: ['en-IN', 'en-US', 'en'],
};

// Populated ahead of time (not inside the click-triggered speak call) so we
// can pick the best voice synchronously — awaiting anything between a user's
// tap and the actual Speech.speak() call can cause some browsers (notably
// Safari) to silently refuse to speak at all, since it's no longer treated
// as a direct result of the user gesture.
let voicesCache: Array<{ language: string }> | null = null;

async function preloadVoices(): Promise<void> {
  if (voicesCache) return;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    voicesCache = voices;
  } catch {
    // Leave voicesCache null; speakText falls back to the plain language map.
  }
}
// Fire-and-forget: start warming the cache as soon as this module loads.
preloadVoices();

function resolveLanguageCode(language: string): { code: string; hadRealVoice: boolean } {
  const chain = SCRIPT_FALLBACK_CHAIN[language] || [LANGUAGE_CODE_MAP[language] || 'hi-IN'];
  if (voicesCache && voicesCache.length > 0) {
    for (const candidate of chain) {
      const prefix = candidate.split('-')[0].toLowerCase();
      const match = voicesCache.some((v) => v.language?.toLowerCase().startsWith(prefix));
      if (match) {
        return { code: candidate, hadRealVoice: true };
      }
    }
  }
  // No matching voice found in the cache (or cache not ready yet) — still
  // attempt the best candidate in the chain; the OS/browser default voice
  // may still partially render it, but quality isn't guaranteed.
  return { code: chain[0], hadRealVoice: false };
}

export const AudioService = {
  /**
   * Speak advisory text in the requested regional language
   */
  async speakText(
    text: string,
    language: string = 'mr',
    onDone?: () => void,
    onError?: (error: any) => void,
    onNoMatchingVoice?: () => void
  ): Promise<void> {
    try {
      // Don't await anything before calling Speech.speak() — some browsers
      // (notably Safari) only allow speech synthesis to start when it's
      // triggered synchronously from a user gesture (the button press).
      // Any prior `await` breaks that chain and causes speak() to silently
      // do nothing. Speech.stop() is safe to fire without waiting on it.
      Speech.stop();
      // Keep the cache warm for next time, but never await it here.
      if (!voicesCache) preloadVoices();

      const { code: voiceCode, hadRealVoice } = resolveLanguageCode(language);
      if (!hadRealVoice && onNoMatchingVoice) {
        // Not a hard failure — speech still attempts to play with the
        // closest available voice — just a heads-up that pronunciation may
        // be degraded (e.g. no real Marathi/Hindi voice installed).
        onNoMatchingVoice();
      }

      Speech.speak(text, {
        language: voiceCode,
        pitch: 1.0,
        rate: 0.9, // Slightly slower for clear rural comprehension
        onDone: () => {
          if (onDone) onDone();
        },
        onError: (err) => {
          if (onError) onError(err);
        },
      });
    } catch (e) {
      if (onError) onError(e);
    }
  },

  /**
   * Stop any current speech playback
   */
  async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch {
      // Ignore stop errors
    }
  },

  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  }
};

