import React, { useState } from 'react';
import { PortraitService } from '../../../services/portraitService';

interface PortraitProps {
  passengerName: string;
  emoji: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Portrait: React.FC<PortraitProps> = ({
  passengerName,
  emoji,
  size = 'medium',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-32 h-32',
    large: 'w-40 h-40',
  };

  const emojiSizes = {
    small: 'text-4xl',
    medium: 'text-6xl',
    large: 'text-8xl',
  };

  const portrait = PortraitService.getPortraitWithFallback(passengerName, emoji);

  // If image failed to load or no portrait available, show emoji fallback
  if (imageError || !PortraitService.hasPortrait(passengerName)) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center ${className}`}>
        <span className={emojiSizes[size]}>{emoji}</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <img
        src={portrait.imageSrc}
        alt={portrait.alt}
        className="w-full h-full object-cover rounded-lg shadow-lg border border-gray-600"
        onError={() => setImageError(true)}
        onLoad={() => setImageError(false)}
      />
    </div>
  );
};

export default Portrait;
