'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export function FormFooter() {
  const t = useTranslations('formFooter');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    // Trigger animation
    setIsAnimating(true);

    // Play clinking sound
    const audio = new Audio('/sounds/chink.m4a');
    audio.volume = 0.5;
    audio.play().catch((err) => console.log('Audio play failed:', err));

    // Reset animation after it completes
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div
      className="text-muted-foreground hover:text-primary cursor-pointer text-center text-xs text-balance transition-colors select-none"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="flex items-center justify-center gap-2">
        <Image
          src="/beerlog-icon.png"
          alt="Cheers!"
          width={20}
          height={20}
          className={isAnimating ? 'animate-shake' : ''}
        />
        <span>{t('hint')}</span>
      </div>
    </div>
  );
}
