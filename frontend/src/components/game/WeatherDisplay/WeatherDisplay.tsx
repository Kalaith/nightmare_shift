import React from 'react';
import type { WeatherCondition, TimeOfDay, Season, EnvironmentalHazard } from '../../../types/game';
import styles from './WeatherDisplay.module.css';

interface WeatherDisplayProps {
  weather: WeatherCondition;
  timeOfDay: TimeOfDay;
  season: Season;
  hazards: EnvironmentalHazard[];
  showDetails?: boolean;
}

export const WeatherDisplay: React.FC<WeatherDisplayProps> = ({
  weather,
  timeOfDay,
  season,
  hazards,
  showDetails = false,
}) => {
  const getIntensityColor = (intensity: WeatherCondition['intensity']) => {
    switch (intensity) {
      case 'light':
        return styles.intensityLight;
      case 'moderate':
        return styles.intensityModerate;
      case 'heavy':
        return styles.intensityHeavy;
      default:
        return styles.intensityLight;
    }
  };

  const getTimeColor = (phase: TimeOfDay['phase']) => {
    switch (phase) {
      case 'dawn':
        return styles.timeDawn;
      case 'morning':
        return styles.timeMorning;
      case 'afternoon':
        return styles.timeAfternoon;
      case 'dusk':
        return styles.timeDusk;
      case 'night':
        return styles.timeNight;
      case 'latenight':
        return styles.timeLateNight;
      default:
        return styles.timeNight;
    }
  };

  const getSeasonColor = (seasonType: Season['type']) => {
    switch (seasonType) {
      case 'spring':
        return styles.seasonSpring;
      case 'summer':
        return styles.seasonSummer;
      case 'fall':
        return styles.seasonFall;
      case 'winter':
        return styles.seasonWinter;
      default:
        return styles.seasonSpring;
    }
  };

  const formatTime = (hour: number) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? 'AM' : 'PM';
    return `${displayHour}:00 ${period}`;
  };

  const getVisibilityStatus = (visibility: number) => {
    if (visibility >= 80) return { text: 'Excellent', color: styles.visibilityGood };
    if (visibility >= 60) return { text: 'Good', color: styles.visibilityOk };
    if (visibility >= 40) return { text: 'Poor', color: styles.visibilityPoor };
    if (visibility >= 20) return { text: 'Very Poor', color: styles.visibilityBad };
    return { text: 'Dangerous', color: styles.visibilityDangerous };
  };

  const visibilityStatus = getVisibilityStatus(weather.visibility);

  return (
    <div className={styles.weatherDisplay}>
      {/* Compact Display */}
      <div className={styles.compactDisplay}>
        <div className={styles.weatherIcon}>
          <span className={styles.icon}>{weather.icon}</span>
          <div className={styles.weatherInfo}>
            <div className={`${styles.weatherType} ${getIntensityColor(weather.intensity)}`}>
              {weather.type.charAt(0).toUpperCase() + weather.type.slice(1)}
            </div>
            <div className={styles.weatherIntensity}>{weather.intensity}</div>
          </div>
        </div>

        <div className={styles.timeInfo}>
          <div className={`${styles.timePhase} ${getTimeColor(timeOfDay.phase)}`}>
            {timeOfDay.phase.charAt(0).toUpperCase() + timeOfDay.phase.slice(1)}
          </div>
          <div className={styles.timeHour}>{formatTime(timeOfDay.hour)}</div>
        </div>

        <div className={styles.seasonInfo}>
          <div className={`${styles.seasonType} ${getSeasonColor(season.type)}`}>
            {season.type.charAt(0).toUpperCase() + season.type.slice(1)}
          </div>
          <div className={styles.seasonTemp}>{season.temperature}</div>
        </div>

        {hazards.length > 0 && (
          <div className={styles.hazardAlert}>
            <span className={styles.hazardIcon}>⚠️</span>
            <span className={styles.hazardCount}>{hazards.length}</span>
          </div>
        )}
      </div>

      {/* Detailed Display */}
      {showDetails && (
        <div className={styles.detailedDisplay}>
          <div className={styles.weatherDetails}>
            <h3 className={styles.sectionTitle}>Weather Conditions</h3>
            <p className={styles.description}>{weather.description}</p>

            <div className={styles.effectsGrid}>
              <div className={styles.effectItem}>
                <span className={styles.effectLabel}>Visibility:</span>
                <span className={`${styles.effectValue} ${visibilityStatus.color}`}>
                  {weather.visibility}% ({visibilityStatus.text})
                </span>
              </div>

              <div className={styles.effectItem}>
                <span className={styles.effectLabel}>Conditions:</span>
                <span className={styles.effectValue}>
                  {weather.intensity} {weather.type}
                </span>
              </div>
            </div>

            {weather.effects.length > 0 && (
              <div className={styles.weatherEffects}>
                <h4 className={styles.effectsTitle}>Current Effects:</h4>
                <ul className={styles.effectsList}>
                  {weather.effects.map((effect, index) => (
                    <li key={index} className={styles.effectListItem}>
                      <span className={styles.effectDescription}>{effect.description}</span>
                      <span className={styles.effectValue}>
                        {effect.value > 0 ? '+' : ''}
                        {effect.value}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className={styles.timeDetails}>
            <h3 className={styles.sectionTitle}>Time & Atmosphere</h3>
            <p className={styles.description}>{timeOfDay.description}</p>

            <div className={styles.atmosphereGrid}>
              <div className={styles.atmosphereItem}>
                <span className={styles.atmosphereLabel}>Light Level:</span>
                <div className={styles.lightMeter}>
                  <div
                    className={styles.lightFill}
                    style={{ width: `${timeOfDay.ambientLight}%` }}
                  />
                  <span className={styles.lightValue}>{timeOfDay.ambientLight}%</span>
                </div>
              </div>

              <div className={styles.atmosphereItem}>
                <span className={styles.atmosphereLabel}>Supernatural Activity:</span>
                <div className={styles.supernaturalMeter}>
                  <div
                    className={styles.supernaturalFill}
                    style={{ width: `${timeOfDay.supernaturalActivity}%` }}
                  />
                  <span className={styles.supernaturalValue}>
                    {timeOfDay.supernaturalActivity}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {hazards.length > 0 && (
            <div className={styles.hazardDetails}>
              <h3 className={styles.sectionTitle}>Environmental Hazards</h3>
              <div className={styles.hazardList}>
                {hazards.map(hazard => (
                  <div key={hazard.id} className={styles.hazardItem}>
                    <div className={styles.hazardHeader}>
                      <span className={styles.hazardType}>
                        {hazard.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span
                        className={`${styles.hazardSeverity} ${styles[`severity${hazard.severity.charAt(0).toUpperCase() + hazard.severity.slice(1)}`]}`}
                      >
                        {hazard.severity}
                      </span>
                    </div>
                    <div className={styles.hazardLocation}>{hazard.location}</div>
                    <div className={styles.hazardDescription}>{hazard.description}</div>

                    {hazard.effects.timeDelay && (
                      <div className={styles.hazardEffect}>
                        ⏱️ +{hazard.effects.timeDelay} min delay
                      </div>
                    )}
                    {hazard.effects.fuelIncrease && (
                      <div className={styles.hazardEffect}>
                        ⛽ +{hazard.effects.fuelIncrease}% fuel cost
                      </div>
                    )}
                    {hazard.effects.riskIncrease && (
                      <div className={styles.hazardEffect}>
                        ⚠️ +{hazard.effects.riskIncrease} risk level
                      </div>
                    )}
                    {hazard.effects.routeBlocked && (
                      <div className={styles.hazardEffect}>
                        🚫 Blocks: {hazard.effects.routeBlocked.join(', ')} routes
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.seasonDetails}>
            <h3 className={styles.sectionTitle}>Seasonal Information</h3>
            <p className={styles.description}>{season.description}</p>

            <div className={styles.seasonGrid}>
              <div className={styles.seasonItem}>
                <span className={styles.seasonLabel}>Month:</span>
                <span className={styles.seasonValue}>{season.month}</span>
              </div>
              <div className={styles.seasonItem}>
                <span className={styles.seasonLabel}>Temperature:</span>
                <span className={styles.seasonValue}>{season.temperature}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherDisplay;
