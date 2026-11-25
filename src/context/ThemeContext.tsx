import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

export type ThemePreference = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isDaytimeByClock: boolean;
  currentTimeLabel: string;
  setThemePreference: (mode: ThemePreference) => void;
}

const THEME_STORAGE_KEY = 'sdncikawao_theme_mode_v1';
const DAY_START_HOUR = 6;
const NIGHT_START_HOUR = 18;

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function resolveThemeByHour(hour: number): ResolvedTheme {
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? 'light' : 'dark';
}

function formatClockHHMM(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'auto' || saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // Ignore storage read errors
    }
    return 'auto';
  });

  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const syncClock = () => setNow(new Date());
    const interval = window.setInterval(syncClock, 30_000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncClock();
      }
    };
    window.addEventListener('focus', syncClock);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', syncClock);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const setThemePreference = useCallback((mode: ThemePreference) => {
    setThemePreferenceState(mode);
    setNow(new Date());
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const clockTheme = resolveThemeByHour(now.getHours());
  const resolvedTheme: ResolvedTheme =
    themePreference === 'auto' ? clockTheme : themePreference;

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.dataset.themeMode = resolvedTheme;
    root.dataset.themePreference = themePreference;
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, themePreference]);

  const currentTimeLabel = useMemo(() => formatClockHHMM(now), [now]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themePreference,
      resolvedTheme,
      isDaytimeByClock: clockTheme === 'light',
      currentTimeLabel,
      setThemePreference,
    }),
    [themePreference, resolvedTheme, clockTheme, currentTimeLabel, setThemePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
