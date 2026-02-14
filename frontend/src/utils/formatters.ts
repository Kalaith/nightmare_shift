export const formatTime = (minutes: number): string => {
  if (typeof minutes !== 'number' || minutes < 0) return '0:00';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
};

export const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number') return '$0';

  return `$${amount.toLocaleString()}`;
};

export const formatPercentage = (value: number, max: number = 100): string => {
  if (typeof value !== 'number' || typeof max !== 'number') return '0%';

  const percentage = Math.round((value / max) * 100);
  return `${Math.max(0, Math.min(100, percentage))}%`;
};

export const formatDate = (timestamp: number | Date): string => {
  if (!timestamp) return 'Unknown';

  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid Date';
  }
};

export const formatDuration = (minutes: number): string => {
  if (typeof minutes !== 'number' || minutes < 0) return '0 minutes';

  if (minutes < 60) {
    return `${Math.round(minutes)} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

export const formatRarity = (rarity: string): string => {
  const rarityMap: Record<string, string> = {
    common: 'Common',
    rare: 'Rare',
    legendary: 'Legendary',
  };

  return rarityMap[rarity] || 'Unknown';
};

export const formatScore = (score: number): string => {
  if (typeof score !== 'number') return '0';

  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  }

  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }

  return score.toLocaleString();
};

export const formatDifficulty = (level: number): string => {
  const difficultyLabels: Record<number, string> = {
    0: 'Beginner',
    1: 'Novice',
    2: 'Experienced',
    3: 'Expert',
    4: 'Nightmare',
  };

  return difficultyLabels[level] || 'Unknown';
};

export const formatItemList = (items: string[]): string => {
  if (!Array.isArray(items) || items.length === 0) {
    return 'None';
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || typeof text !== 'string') return '';

  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength - 3) + '...';
};

export const formatViolations = (count: number): string => {
  if (typeof count !== 'number' || count < 0) return 'None';

  if (count === 0) return 'None';

  return `${count} violation${count !== 1 ? 's' : ''}`;
};
