'use client'

import React from 'react';
import TokenForm from '@/components/forms/TokenForm';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function HomePage() {
  // Make sure we're using the correct namespace
  const t = useTranslations('HomePage');

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

      <main className="relative z-10 flex min-h-screen flex-col items-center pt-10 p-6">
        <div className="max-w-md w-full bg-[#222831] backdrop-blur-md p-6 rounded-lg shadow-md">
          <div className="flex justify-center mb-4">
            <div className="bg-[#222831] text-white">
              <LanguageSwitcher />
            </div>
          </div>
           
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">{t('mainTitle')}</h1>
            <p className="text-white">{t('subTitle')}</p>
          </div>
          <TokenForm />
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">{t('poweredBy')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}