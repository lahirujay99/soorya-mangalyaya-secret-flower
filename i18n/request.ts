import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'si'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({ locale }) => {
  console.log(`i18n/request.ts: getRequestConfig called for locale: "${locale}"`);
  
  // Use defaultLocale if locale is undefined or not in supported locales
  const safeLocale = locale && locales.includes(locale) ? locale : defaultLocale;
  
  try {
    // Load messages without dynamic query parameters
    const messages = await import(`../messages/${safeLocale}.json`).then(module => module.default);
    
    console.log(`i18n/request.ts: Successfully loaded messages for locale "${safeLocale}"`);
    
    return {
      locale: safeLocale,
      messages,
      timeZone: 'Asia/Colombo',
      now: new Date()
    };
  } catch (error) {
    console.error(`Error loading messages for locale "${safeLocale}":`, error);
    
    // Fallback to empty messages if loading fails
    return {
      locale: safeLocale,
      messages: {},
      timeZone: 'Asia/Colombo',
      now: new Date()
    };
  }
});