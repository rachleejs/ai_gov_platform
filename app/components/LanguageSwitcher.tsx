'use client';

import { useLanguage } from '../contexts/LanguageContext';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  };

  const tooltipText = language === 'ko' ? 'English' : '한국어';

  return (
    <div className="relative">
      <button
        onClick={toggleLanguage}
        className="p-2 rounded-lg hover:bg-cream transition-colors group"
        aria-label="Toggle language"
      >
        <GlobeAltIcon className="h-6 w-6 text-slate-blue group-hover:text-navy" />
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block 
                     bg-navy text-white text-xs font-semibold rounded-md px-2 py-1 shadow-lg whitespace-nowrap"
        >
          {tooltipText}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-navy"></div>
        </div>
      </button>
    </div>
  );
};

export default LanguageSwitcher; 