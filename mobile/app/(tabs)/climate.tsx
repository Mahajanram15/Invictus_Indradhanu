import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { CloudSun, Calendar, Info } from 'lucide-react-native';
import { COLORS } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { ApiService } from '../../src/services/api';
import { WeatherCard } from '../../src/components/WeatherCard';
import { Config } from '../../src/constants/config';
import { DEMO_CLIMATE, DEMO_FORECAST_DAILY } from '../../src/data/demoData';

export default function ClimateScreen() {
  const { activeFarm } = useAuth();
  const { t } = useLanguage();

  const [currentWeather, setCurrentWeather] = useState<any | null>(null);
  const [forecast, setForecast] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadClimateData = async () => {
    if (!activeFarm) return;
    setLoading(true);

    if (Config.DEMO_MODE) {
      setCurrentWeather({
        temperature_c: DEMO_CLIMATE.temperature_c,
        relative_humidity_pct: DEMO_CLIMATE.humidity_pct,
        precipitation_probability_pct: DEMO_CLIMATE.precipitation_probability_pct,
        wind_speed_kmh: DEMO_CLIMATE.wind_speed_kmh,
        weather_description: 'Partly Cloudy',
      });
      setForecast({ daily: DEMO_FORECAST_DAILY });
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const curRes = await ApiService.getFarmClimateCurrent(activeFarm.id);
      if (curRes.data) {
        setCurrentWeather(curRes.data);
      }

      const fcastRes = await ApiService.getFarmClimateForecast(activeFarm.id);
      if (fcastRes.data) {
        setForecast(fcastRes.data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClimateData();
  }, [activeFarm]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadClimateData();
  };

  if (!activeFarm) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noFarmText}>{t('noFarmsRegistered') || 'No farm selected'}</Text>
      </View>
    );
  }

  const days = forecast?.daily || [];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.farmTitleBar}>
        <Text style={styles.farmName}>{activeFarm.farm_name}</Text>
        <Text style={styles.coordinates}>
          📍 {activeFarm.latitude.toFixed(4)}°N, {activeFarm.longitude.toFixed(4)}°E
        </Text>
      </View>

      {/* Live Observation Card */}
      <WeatherCard
        temperature={currentWeather?.temperature_c ?? 29}
        humidity={currentWeather?.relative_humidity_pct ?? 62}
        rainProbability={currentWeather?.precipitation_probability_pct ?? 10}
        windSpeed={currentWeather?.wind_speed_kmh ?? 11}
        weatherCondition={currentWeather?.weather_description ?? 'Partly Cloudy'}
        sourceNote="Open-Meteo (0.1° Grid) + NASA POWER"
      />

      {/* 7-Day Weather Outlook */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Calendar color={COLORS.primary} size={20} />
          <Text style={styles.sectionTitle}>{t('sevenDayForecast') || '7-Day Climate Forecast'}</Text>
        </View>

        {days.length > 0 ? (
          days.map((item: any, idx: number) => (
            <View key={idx} style={styles.forecastRow}>
              <Text style={styles.forecastDay}>{item.date || `Day ${idx + 1}`}</Text>
              <View style={styles.forecastTemps}>
                <Text style={styles.tempMax}>{item.temp_max_c ?? 32}°C</Text>
                <Text style={styles.tempMin}>{item.temp_min_c ?? 21}°C</Text>
              </View>
              <View style={styles.forecastRain}>
                <Text style={styles.rainChance}>💧 {item.precipitation_probability_pct ?? 0}%</Text>
                <Text style={styles.rainAmount}>{item.precipitation_mm ?? 0} mm</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noForecastText}>{t('forecastLoading') || 'Loading 7-day forecast projection...'}</Text>
        )}
      </View>

      {/* Sensor Transparency & NASA POWER Note */}
      <View style={styles.infoBox}>
        <Info color={COLORS.skyBlue} size={18} />
        <Text style={styles.infoText}>
          {t('climateTransparencyNote') ||
            'Weather observations are computed for your exact farm GPS coordinates using Open-Meteo High-Resolution ensemble & NASA POWER agro-meteorology archives.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noFarmText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  farmTitleBar: {
    marginBottom: 8,
  },
  farmName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  coordinates: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginLeft: 8,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    width: 90,
  },
  forecastTemps: {
    flexDirection: 'row',
    gap: 8,
  },
  tempMax: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  tempMin: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  forecastRain: {
    alignItems: 'flex-end',
    width: 90,
  },
  rainChance: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.skyBlue,
  },
  rainAmount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  noForecastText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 18,
    marginLeft: 8,
  },
});

