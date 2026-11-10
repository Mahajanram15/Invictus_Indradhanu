import { Platform } from 'react-native';

const DEFAULT_API_HOST = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  ios: 'http://localhost:8000/api/v1',
  default: 'http://localhost:8000/api/v1',
});

export const Config = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_HOST,
  API_URL: process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_HOST,
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://adtoonyjctxcdrfksurp.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdG9vbnlqY3R4Y2RyZmtzdXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MjQ5MDAsImV4cCI6MjEwOTMwMDkwMH0.-oZ1oKJE3CnHChZnagR0p29PA1IfhCa5w-LRurNDtxk',
  APP_NAME: 'Indradhanu',
  VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'mr',
  CACHE_TTL_MS: 3600 * 1000,
  REQUEST_TIMEOUT_MS: 15000,
  // When true, the app runs entirely on built-in sample data instead of
  // calling a real backend — used for the public GitHub Pages deployment,
  // which has no live API to talk to (matching the web dashboard's own
  // presentation-mode demo pattern).
  DEMO_MODE: process.env.EXPO_PUBLIC_DEMO_MODE === 'true',
};

export const CONFIG = Config;
export default Config;

