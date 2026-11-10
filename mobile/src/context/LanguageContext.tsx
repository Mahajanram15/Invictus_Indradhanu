import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS, SupportedLanguage } from '../localization/translations';
import { StorageService } from '../services/storage';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'mr',
  setLanguage: async () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('mr');

  useEffect(() => {
    StorageService.getLanguage().then((stored) => {
      if (stored && ['mr', 'hi', 'te', 'en'].includes(stored)) {
        setLanguageState(stored as SupportedLanguage);
      }
    });
  }, []);

  const setLanguage = async (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    await StorageService.saveLanguage(newLang);
  };

  const t = (key: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict[key]) {
      return langDict[key];
    }
    if (TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key];
    }
    // No translation exists in any language. Return an empty string (not the
    // raw key) so call sites using `t(key) || 'fallback text'` actually fall
    // through to their inline fallback instead of rendering the key itself.
    return '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

