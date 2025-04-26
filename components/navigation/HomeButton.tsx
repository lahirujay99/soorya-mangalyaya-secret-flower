'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

interface HomeButtonProps {
  locale: string;
}

const HomeButton: React.FC<HomeButtonProps> = ({ locale }) => {
  const t = useTranslations('GuessPage');
  
  return (
    <Link href={`/${locale}`} passHref legacyBehavior>
      <a className="inline-block">
        <Button variant="secondary">
          {t('backToHome')}
        </Button>
      </a>
    </Link>
  );
};

export default HomeButton;