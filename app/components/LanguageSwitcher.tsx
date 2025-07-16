'use client';

import React from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'ko' as Language, name: '한국어', flag: '🇰🇷' },
    { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  ];

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
        <GlobeAltIcon className="h-4 w-4 text-gray-600" />
        <div className="flex items-center space-x-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`
                flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium transition-all duration-200
                ${language === lang.code 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
                }
              `}
            >
              <span className="text-sm">{lang.flag}</span>
              <span className="hidden sm:inline">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 