import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface Colors {
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary colors (Catholic theme)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Accent colors
  accent: string;
  accentLight: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  
  // UI elements
  border: string;
  shadow: string;
  overlay: string;
  
  // Liturgical colors
  liturgicalGold: string;
  liturgicalPurple: string;
  liturgicalRose: string;
  liturgicalGreen: string;
  liturgicalRed: string;
  liturgicalWhite: string;
}

interface Theme {
  colors: Colors;
  isDark: boolean;
}

const lightColors: Colors = {
  background: '#FFF8DC', // Cornsilk
  surface: '#FFFFFF',
  card: '#F8F8FF',
  
  text: '#4A2C2A',
  textSecondary: '#8B5A2B',
  textTertiary: '#D4A574',
  
  primary: '#8B5A2B',
  primaryLight: '#D4A574',
  primaryDark: '#4A2C2A',
  
  accent: '#FFD700',
  accentLight: '#FFF8DC',
  
  success: '#98FB98',
  warning: '#FFB347',
  error: '#FF6B6B',
  
  border: '#E0E0E0',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  liturgicalGold: '#FFD700',
  liturgicalPurple: '#DDA0DD',
  liturgicalRose: '#FFB6C1',
  liturgicalGreen: '#98FB98',
  liturgicalRed: '#FF6B6B',
  liturgicalWhite: '#FFFFFF',
};

const darkColors: Colors = {
  background: '#1A1A1A',
  surface: '#2D2D2D',
  card: '#3A3A3A',
  
  text: '#FFFFFF',
  textSecondary: '#D4A574',
  textTertiary: '#8B5A2B',
  
  primary: '#D4A574',
  primaryLight: '#F0E68C',
  primaryDark: '#8B5A2B',
  
  accent: '#FFD700',
  accentLight: '#FFF8DC',
  
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  
  border: '#404040',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  liturgicalGold: '#FFD700',
  liturgicalPurple: '#9C27B0',
  liturgicalRose: '#E91E63',
  liturgicalGreen: '#4CAF50',
  liturgicalRed: '#F44336',
  liturgicalWhite: '#FFFFFF',
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    loadThemeMode();
    
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('themeMode');
      if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme mode:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const toggleTheme = () => {
    const currentIsDark = getCurrentTheme().isDark;
    setThemeMode(currentIsDark ? 'light' : 'dark');
  };

  const getCurrentTheme = (): Theme => {
    let isDark = false;
    
    if (themeMode === 'auto') {
      isDark = systemColorScheme === 'dark';
    } else {
      isDark = themeMode === 'dark';
    }

    return {
      colors: isDark ? darkColors : lightColors,
      isDark,
    };
  };

  const theme = getCurrentTheme();

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}