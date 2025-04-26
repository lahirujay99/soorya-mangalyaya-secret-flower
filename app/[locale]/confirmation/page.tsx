import React from 'react';
// import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import SuccessMessage from '@/components/feedback/SuccessMessage'; // Using SuccessMessage component
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';

// Add metadata generator for the page title
export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Confirmation' });
  return {
    title: t('title')
  };
}

export default async function ConfirmationPage() {
   const t = await getTranslations('Confirmation'); // Use server-side translation

  return (
    <div className="relative min-h-screen w-full">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/image.png"
          alt="Background"
          fill
          priority
          style={{ objectFit: 'cover' }}
          className="blur-sm" // Changed from blur-md to blur-sm for less blur
        />
      </div>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6 text-center">

        <div className="max-w-md p-8 bg-white/70 backdrop-blur-sm rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-green-600 mb-4">{t('title')}</h1>
          <SuccessMessage message={t('message')} />

          {/* Optionally add a link back home */}
          <div className="mt-6">
            <Link href="/" className="text-blue-600 hover:underline">
              {t('backHomeLink')} {/* Add translation */}
            </Link>
          </div>
          
          {/* Powered by text */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">{t('poweredBy')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}