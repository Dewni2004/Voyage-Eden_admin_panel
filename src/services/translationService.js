const BACKEND_URL = 'http://localhost:5000/api/translate';

// The target languages for translation
const TARGET_LANGUAGES = ['EN-US', 'FR', 'DE', 'IT'];

/**
 * Translates text from Spanish to all target languages.
 * Returns an object with language codes as keys and translated text as values.
 * e.g., { es: "Original", en: "Translated", fr: "Translated", ... }
 */
export const autoTranslate = async (text) => {
  if (!text) return null;
  
  const translations = { es: text }; // Store original Spanish text

  try {
    for (const lang of TARGET_LANGUAGES) {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          target_lang: lang,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed for ${lang}`);
      }

      const data = await response.json();
      const langCode = lang.split('-')[0].toLowerCase(); // e.g., 'EN-US' -> 'en'
      translations[langCode] = data.translations[0].text;
    }
    
    return translations;
  } catch (error) {
    console.error("Auto-translation error:", error);
    // If translation fails, fallback to English or just the Spanish text
    return { es: text, en: text, fr: text, de: text, it: text };
  }
};

/**
 * Translates an object with multiple text fields.
 * e.g., { title: "Hola", description: "Mundo" } 
 * => { title: {es:"Hola", en:"Hello"...}, description: {es:"Mundo", en:"World"...} }
 */
export const translateFields = async (fieldsObj) => {
  const translatedData = {};
  
  for (const [key, value] of Object.entries(fieldsObj)) {
    if (typeof value === 'string' && value.trim() !== '') {
      translatedData[key] = await autoTranslate(value);
    } else {
      translatedData[key] = value; // Keep arrays, numbers, or empty strings as is
    }
  }
  
  return translatedData;
};
