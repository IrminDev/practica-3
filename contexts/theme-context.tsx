import { Colors } from '@/constants/colors';
import { ThemeType } from '@/types/file-system';
import { getSettings, saveSettings } from '@/utils/storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: typeof Colors.ipn.light;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('ipn');
  const isDark = systemColorScheme === 'dark';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await getSettings();
    setThemeState(settings.theme);
  };

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    const settings = await getSettings();
    await saveSettings({ ...settings, theme: newTheme });
  };

  const colors = isDark ? Colors[theme].dark : Colors[theme].light;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
