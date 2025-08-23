// Utility functions for formatting time, currency, and other game values

// Format time from minutes to hours:minutes display
export const formatTime = (minutes) => {
  if (typeof minutes !== 'number' || minutes < 0) return '0:00';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
};

// Format currency with proper formatting
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '$0';
  
  return `$${amount.toLocaleString()}`;
};

// Format percentage for fuel display
export const formatPercentage = (value, max = 100) => {
  if (typeof value !== 'number' || typeof max !== 'number') return '0%';
  
  const percentage = Math.round((value / max) * 100);
  return `${Math.max(0, Math.min(100, percentage))}%`;
};

// Format date for leaderboard display
export const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// Format duration in a human-readable format
export const formatDuration = (minutes) => {
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

// Format passenger rarity for display
export const formatRarity = (rarity) => {
  const rarityMap = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    legendary: 'Legendary'
  };
  
  return rarityMap[rarity] || 'Unknown';
};

// Format score with appropriate suffixes
export const formatScore = (score) => {
  if (typeof score !== 'number') return '0';
  
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  }
  
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }
  
  return score.toLocaleString();
};

// Format game difficulty level
export const formatDifficulty = (level) => {
  const difficultyLabels = {
    0: 'Beginner',
    1: 'Novice', 
    2: 'Experienced',
    3: 'Expert',
    4: 'Nightmare'
  };
  
  return difficultyLabels[level] || 'Unknown';
};

// Format list of items for display
export const formatItemList = (items) => {
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

// Truncate text to specified length with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - 3) + '...';
};

// Format violation count for display
export const formatViolations = (count) => {
  if (typeof count !== 'number' || count < 0) return 'None';
  
  if (count === 0) return 'None';
  
  return `${count} violation${count !== 1 ? 's' : ''}`;
};