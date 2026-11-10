import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Volume2, Square } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { AudioService } from '../services/audio';
import { useLanguage } from '../context/LanguageContext';

interface AudioPlayerProps {
  textToSpeak: string;
  label?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ textToSpeak, label }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const { language, t } = useLanguage();

  useEffect(() => {
    return () => {
      AudioService.stop();
    };
  }, []);

  const handleToggle = async () => {
    if (isPlaying) {
      await AudioService.stop();
      setIsPlaying(false);
    } else {
      if (!textToSpeak) return;
      setIsLoading(true);
      setErrorMsg('');
      try {
        await AudioService.speakText(
          textToSpeak,
          language,
          () => {
            setIsPlaying(false);
            setIsLoading(false);
          },
          () => {
            setIsPlaying(false);
            setIsLoading(false);
            setErrorMsg(
              t('audioUnavailableError') ||
                'Voice playback unavailable on this device for the selected language.'
            );
          },
          () => {
            // Non-fatal: speech is still playing, just with a fallback voice.
            setErrorMsg(
              t('audioDegradedWarning') ||
                'No Marathi voice found on this device — playing with the closest available voice.'
            );
          }
        );
        setIsPlaying(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.container, isPlaying && styles.containerPlaying]}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <View style={[styles.iconCircle, isPlaying && styles.iconCirclePlaying]}>
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : isPlaying ? (
            <Square color={COLORS.white} size={22} fill={COLORS.white} />
          ) : (
            <Volume2 color={COLORS.white} size={24} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isPlaying ? t('stopAudio') : label || t('listenAdvisory')}
          </Text>
          <Text style={styles.subtitle}>
            {isPlaying ? t('playingAudio') : t('tapToListen')}
          </Text>
        </View>
      </TouchableOpacity>
      {errorMsg ? <Text style={styles.errorText}>⚠️ {errorMsg}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.primaryLight,
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    marginVertical: 10,
  },
  containerPlaying: {
    backgroundColor: '#FFEBE6',
    borderColor: COLORS.riskHigh,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconCirclePlaying: {
    backgroundColor: COLORS.riskHigh,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  errorText: {
    color: COLORS.riskCritical,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
});

