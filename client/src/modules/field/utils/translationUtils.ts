import { GoogleGenAI } from "@google/genai";

// Supported languages configuration
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', voiceCode: 'en-US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇲🇽', voiceCode: 'es-MX' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', voiceCode: 'ar-XA' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', voiceCode: 'vi-VN' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', voiceCode: 'ko-KR' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', voiceCode: 'cmn-CN' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog', flag: '🇵🇭', voiceCode: 'fil-PH' },
];

export type SupportedLanguage = string;

// Simple cache
const translationCache = new Map<string, string>();

/**
 * Translate text using Gemini
 */
export async function translateText(text: string, targetLang: string, sourceLang?: string): Promise<string> {
  const cacheKey = `${text}:${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // Use type assertion to bypass Vite env type issues in TS
  const env = (import.meta as any).env;
  const apiKey = env.VITE_GOOGLE_GENAI_API_KEY || "";
  
  if (!apiKey) {
    console.warn("Missing VITE_GOOGLE_GENAI_API_KEY");
    return "Error: Missing API Key";
  }

  try {
    const genAI = new GoogleGenAI({ apiKey });
    
    const targetLangConfig = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);
    const targetName = targetLangConfig ? targetLangConfig.name : targetLang;

    const prompt = `Translate the following text to ${targetName}. 
    Keep it conversational and natural for a roofing business context. 
    Return ONLY the translation, no explanation.
    
    Text: "${text}"`;

    // Match the pattern used in susan-ai.ts
    const result = await (genAI as any).models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    const translation = result.text || "";
    translationCache.set(cacheKey, translation.trim());
    return translation.trim();
  } catch (error) {
    console.error("Translation error:", error);
    return `Translation failed: ${error}`;
  }
}

export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code;
}

export function getLanguageFlag(code: string): string {
  return SUPPORTED_LANGUAGES.find(l => l.code === code)?.flag || "";
}