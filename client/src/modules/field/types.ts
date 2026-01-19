export type SupportedLanguage = string;
export type SupportedDialect = string;

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName?: string;
  flag: string;
  voiceCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', voiceCode: 'en-US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇲🇽', voiceCode: 'es-MX' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', voiceCode: 'ar-XA' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', voiceCode: 'vi-VN' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', voiceCode: 'ko-KR' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', voiceCode: 'cmn-CN' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog', flag: '🇵🇭', voiceCode: 'fil-PH' },
];

export interface DialectConfig {
  code: string;
  parentLang: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  voiceCode: string;
}

export const DIALECT_VARIANTS: DialectConfig[] = [
  { code: 'es-mx', parentLang: 'es', name: 'Mexican', nativeName: 'Mexicano', flag: '🇲🇽', region: 'Mexico', voiceCode: 'es-MX' },
  { code: 'es-es', parentLang: 'es', name: 'Castilian', nativeName: 'Castellano', flag: '🇪🇸', region: 'Spain', voiceCode: 'es-ES' },
  { code: 'ar-eg', parentLang: 'ar', name: 'Egyptian', nativeName: 'مصري', flag: '🇪🇬', region: 'Egypt', voiceCode: 'ar-EG' },
  { code: 'ar-sa', parentLang: 'ar', name: 'Saudi', nativeName: 'سعودي', flag: '🇸🇦', region: 'Saudi Arabia', voiceCode: 'ar-SA' }
];

export type AgnesState = 'idle' | 'activating' | 'detecting' | 'introducing' | 'listening' | 'translating' | 'speaking' | 'ended';

export interface DetectionResult {
  language: string;
  dialect?: string;
  confidence: number;
  region?: string;
}

export function getDialectConfig(code: string): DialectConfig | undefined {
  return DIALECT_VARIANTS.find(d => d.code === code);
}

export function getDialectsForLanguage(langCode: string): DialectConfig[] {
  return DIALECT_VARIANTS.filter(d => d.parentLang === langCode);
}
