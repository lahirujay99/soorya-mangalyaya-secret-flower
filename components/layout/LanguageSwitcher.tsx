'use client';

import { useLocale } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Define available locales
  const locales = ['en', 'si'];
  
  // Function to handle language change
  const handleLocaleChange = (newLocale: string) => {
    // Determine current pathname structure
    const pathSegments = pathname.split('/');
    
    // Create new path by replacing locale segment
    const newPathSegments = [...pathSegments];
    
    // The locale is usually the first segment after the initial '/'
    if (pathSegments.length > 1) {
      newPathSegments[1] = newLocale;
    }
    
    let newPath = newPathSegments.join('/');
    
    // Preserve all query parameters (including the token)
    const params = new URLSearchParams(searchParams);
    if (params.toString()) {
      newPath += '?' + params.toString();
    }
    
    // Force a full browser navigation to ensure translations are loaded properly
    window.location.href = newPath;
  };

  return (
    <div className="flex space-x-4 items-center p-4 bg-[#222831] rounded-md">
      <span className="text-base text-white">Language:</span>
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          className={`text-base font-medium ${
            locale === loc 
              ? 'text-blue-300 underline' 
              : 'text-white hover:text-blue-300'
          }`}
        >
          {loc === 'en' ? 'English' : 'සිංහල'}
        </button>
      ))}
    </div>
  );
}