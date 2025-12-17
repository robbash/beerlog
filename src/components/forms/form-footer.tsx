'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

function isChristmasSeason(): boolean {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed, so December is 11
  const day = now.getDate();

  // December 1st through December 26th
  return month === 11 && day >= 1 && day <= 26;
}

export function FormFooter() {
  const t = useTranslations('formFooter');
  const [isAnimating, setIsAnimating] = useState(false);
  const isChristmas = isChristmasSeason();

  const handleClick = () => {
    // Trigger animation
    setIsAnimating(true);

    // Play appropriate sound based on season
    const soundFile = isChristmas ? '/sounds/merry-xmas.m4a' : '/sounds/chink.m4a';
    const audio = new Audio(soundFile);
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
        {isChristmas ? (
          <span className={`text-xl ${isAnimating ? 'animate-shake' : ''}`}>🎄</span>
        ) : (
          <Image
            src="/beerlog-icon.png"
            alt="Cheers!"
            width={20}
            height={20}
            className={isAnimating ? 'animate-shake' : ''}
          />
        )}
        <span>{t('hint')}</span>
      </div>
    </div>
  );
}
