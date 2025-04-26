// Important: We need Suspense to read searchParams on the server in App Router pages
// Or make the component itself client-side and use useSearchParams directly
// For simplicity with forms, making this page rely on a client component is easiest.

import React, { Suspense } from 'react';
import GuessForm from '@/components/forms/GuessForm';
import { getTranslations } from 'next-intl/server';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import HomeButton from '@/components/navigation/HomeButton';
import Image from 'next/image';

// Wrapper to handle Suspense needed for useSearchParams in Server Components
// Though GuessForm is 'use client', the page itself might be server first
const GuessPageContent: React.FC = () => {
  return <GuessForm />;
};

// Add metadata generator for the page title
export async function generateMetadata({ params }: { params: { locale: string } }) {
  // Get translations properly using the params.locale
  const t = await getTranslations({ locale: params.locale, namespace: 'GuessPage' });
  return {
    title: t('pageTitle')
  };
}

export default async function SubmitGuessPage({ params }: { params: { locale: string } }) {
  // Use the locale from params to get the proper translations
  const t = await getTranslations({ locale: params.locale, namespace: 'GuessPage' });

  return (
    <div className="relative min-h-screen w-full">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/image.png" // Keeping the original image.png
          alt="Background"
          fill
          priority
          style={{ objectFit: 'cover' }}
          className="blur-sm" // Changed from blur-md to blur-sm for less blur
        />
      </div>

      <main className="relative z-10 flex min-h-screen flex-col items-center pt-10 p-6">
        <div className="max-w-md w-full bg-[#222831] backdrop-blur-md p-6 rounded-lg shadow-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">{t('flowerPageTitle')}</h1>
            <p className="text-gray-300 mt-2">{t('flowerSubtitle')}</p>
          </div>
          {/* Suspense is needed if parent components read searchParams */}
          {/* Since GuessForm is 'use client' and uses the hook directly, it should work, */}
          {/* but wrapping doesn't hurt and is good practice if params were read higher up. */}
          <Suspense fallback={<LoadingSpinner />}>
            <GuessPageContent />
          </Suspense>

          {/* Navigation buttons */}
          <div className="mt-6 text-center">
            <HomeButton locale={params.locale} />
          </div>
          
          {/* Powered by text */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">{t('poweredBy')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}