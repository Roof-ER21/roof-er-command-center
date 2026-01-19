// Agnes Persona Utils

export function getAgnesRepIntro(): string {
  return "Hi! I'm Agnes. Select a language and I'll help you communicate with the homeowner.";
}

export function getAgnesHomeownerIntro(lang: string): string {
  const intros: Record<string, string> = {
    'es': "Hola, soy el asistente de traducción. Habla y traduciré para ti.",
    'ar': "مرحباً، أنا المساعد الصوتي. تحدث وسأترجم لك.",
    'vi': "Xin chào, tôi là trợ lý phiên dịch. Hãy nói và tôi sẽ dịch cho bạn.",
    'ko': "안녕하세요, 통역 도우미입니다. 말씀하시면 통역해 드리겠습니다.",
    'zh': "你好，我是翻译助手。请说话，我会为你翻译。",
    'tl': "Kamusta, ako ang iyong tagasalin. Magsalita ka lang at isasalin ko ito.",
    'en': "Hello, I am your translation assistant. Speak and I will translate for you."
  };
  return intros[lang] || intros['en'];
}

export function getRandomHellos(): { text: string; lang: string }[] {
  const hellos = [
    { text: "Hola", lang: "es" },
    { text: "Bonjour", lang: "fr" },
    { text: "Hallo", lang: "de" },
    { text: "Ciao", lang: "it" },
    { text: "Konnichiwa", lang: "zh" }, // approximations for TTS
    { text: "Namaste", lang: "hi" },
    { text: "Salaam", lang: "ar" },
    { text: "Privet", lang: "ru" },
    { text: "Anyoung", lang: "ko" }
  ];
  
  // Shuffle and pick 5
  return hellos.sort(() => 0.5 - Math.random()).slice(0, 5);
}