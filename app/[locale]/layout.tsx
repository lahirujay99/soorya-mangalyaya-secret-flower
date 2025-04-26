// Correct location: app/[locale]/layout.tsx
import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/request'; // Updated import path to match middleware
import BackgroundWrapper from '@/components/layout/BackgroundWrapper';
import './globals.css';

// Import messages directly for each locale - this ensures proper hydration
async function getMessages(locale: string) {
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    // Fallback to English if the requested locale isn't available
    return (await import(`../../messages/en.json`)).default;
  }
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default async function RootLayout({
  children,
  params, // Receive params object
}: RootLayoutProps) {

  // Access locale after receiving params
  const locale = params.locale;
  console.log(`Layout: Rendering for locale "${locale}"`); // Log entry

  // --- Validate locale ---
  if (!locales.includes(locale)) {
    console.error(`Layout: Invalid locale "${locale}". Calling notFound().`);
    notFound();
  }

  // Load messages directly
  const messages = await getMessages(locale);

  return (
    <html lang={locale} className="h-full">
      <body className="h-full">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Colombo">
          <BackgroundWrapper>
            {children}
          </BackgroundWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}