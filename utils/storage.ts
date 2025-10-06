import { AppSettings, FavoriteFile, RecentFile } from '@/types/file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_FILES_KEY = '@recent_files';
const FAVORITES_KEY = '@favorites';
const SETTINGS_KEY = '@app_settings';
const MAX_RECENT_FILES = 50;

// Archivos recientes
export const saveRecentFile = async (file: RecentFile): Promise<void> => {
  try {
    const existingData = await AsyncStorage.getItem(RECENT_FILES_KEY);
    let recentFiles: RecentFile[] = existingData ? JSON.parse(existingData) : [];
    
    // Eliminar duplicados
    recentFiles = recentFiles.filter(f => f.path !== file.path);
    
    // Agregar al inicio
    recentFiles.unshift(file);
    
    // Limitar cantidad
    if (recentFiles.length > MAX_RECENT_FILES) {
      recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
    }
    
    await AsyncStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recentFiles));
  } catch (error) {
    console.error('Error saving recent file:', error);
  }
};

export const getRecentFiles = async (): Promise<RecentFile[]> => {
  try {
    const data = await AsyncStorage.getItem(RECENT_FILES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting recent files:', error);
    return [];
  }
};

export const clearRecentFiles = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(RECENT_FILES_KEY);
  } catch (error) {
    console.error('Error clearing recent files:', error);
  }
};

// Favoritos
export const addFavorite = async (file: FavoriteFile): Promise<void> => {
  try {
    const existingData = await AsyncStorage.getItem(FAVORITES_KEY);
    let favorites: FavoriteFile[] = existingData ? JSON.parse(existingData) : [];
    
    // Verificar si ya existe
    if (!favorites.some(f => f.path === file.path)) {
      favorites.push(file);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Error adding favorite:', error);
  }
};

export const removeFavorite = async (path: string): Promise<void> => {
  try {
    const existingData = await AsyncStorage.getItem(FAVORITES_KEY);
    if (existingData) {
      let favorites: FavoriteFile[] = JSON.parse(existingData);
      favorites = favorites.filter(f => f.path !== path);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
};

export const getFavorites = async (): Promise<FavoriteFile[]> => {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const isFavorite = async (path: string): Promise<boolean> => {
  try {
    const favorites = await getFavorites();
    return favorites.some(f => f.path === path);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};

// Configuración
export const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { theme: 'ipn', viewMode: 'list' };
  } catch (error) {
    console.error('Error getting settings:', error);
    return { theme: 'ipn', viewMode: 'list' };
  }
};
