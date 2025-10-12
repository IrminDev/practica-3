import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Detecta si la aplicación está corriendo en Expo Go o como APK/IPA standalone
 * 
 * Expo Go tiene limitaciones importantes:
 * - No puede acceder libremente al sistema de archivos de Android
 * - expo-file-system/next tiene acceso limitado en Expo Go
 * - Necesita usar expo-document-picker y expo-media-library para acceder a archivos
 */
export const isExpoGo = (): boolean => {
  // Método 1: Verificar el appOwnership (más confiable)
  if (Constants.appOwnership === 'expo') {
    console.log('🔍 isExpoGo: true (appOwnership === "expo")');
    return true;
  }

  // Si es standalone, definitivamente NO es Expo Go
  if (Constants.appOwnership === 'standalone') {
    console.log('🔍 isExpoGo: false (appOwnership === "standalone")');
    return false;
  }

  // Método 2: Verificar el executionEnvironment (más confiable en SDK 50+)
  if (Constants.executionEnvironment === 'storeClient') {
    console.log('🔍 isExpoGo: true (executionEnvironment === "storeClient")');
    return true;
  }

  if (Constants.executionEnvironment === 'standalone') {
    console.log('🔍 isExpoGo: false (executionEnvironment === "standalone")');
    return false;
  }

  // Método 3: Verificar packageName/bundleId (solo si los anteriores no son conclusivos)
  if (Platform.OS === 'android') {
    const packageName = Constants.expoConfig?.android?.package || '';
    
    // Si tiene un package name válido que NO es de Expo Go, es standalone
    if (packageName && !packageName.includes('exp.exponent')) {
      console.log('🔍 isExpoGo: false (packageName válido:', packageName + ')');
      return false;
    }
    
    // Si contiene exp.exponent, es Expo Go
    if (packageName.includes('exp.exponent')) {
      console.log('🔍 isExpoGo: true (packageName contiene exp.exponent)');
      return true;
    }
  } else if (Platform.OS === 'ios') {
    const bundleId = Constants.expoConfig?.ios?.bundleIdentifier || '';
    
    // Si tiene un bundle ID válido que NO es de Expo Go, es standalone
    if (bundleId && !bundleId.includes('exp.Exponent')) {
      console.log('🔍 isExpoGo: false (bundleId válido:', bundleId + ')');
      return false;
    }
    
    // Si contiene exp.Exponent, es Expo Go
    if (bundleId.includes('exp.Exponent')) {
      console.log('🔍 isExpoGo: true (bundleId contiene exp.Exponent)');
      return true;
    }
  }

  // Si no podemos determinar con certeza, asumir que NO es Expo Go
  // (es más seguro que asumir que sí lo es)
  console.log('🔍 isExpoGo: false (no se pudo determinar, asumiendo standalone)');
  return false;
};

/**
 * Determina el mejor método para acceder a archivos según el entorno
 */
export const getFileAccessMethod = (): 'direct' | 'picker' | 'media-library' => {
  if (isExpoGo()) {
    // En Expo Go, usar document-picker y media-library
    return 'picker';
  }
  
  // En APK/IPA standalone, usar acceso directo al file system
  return 'direct';
};

/**
 * Obtiene información del entorno actual para debugging
 */
export const getEnvironmentInfo = () => {
  return {
    isExpoGo: isExpoGo(),
    appOwnership: Constants.appOwnership,
    executionEnvironment: Constants.executionEnvironment,
    platform: Platform.OS,
    packageName: Constants.expoConfig?.android?.package || 'N/A',
    bundleId: Constants.expoConfig?.ios?.bundleIdentifier || 'N/A',
    expoVersion: Constants.expoConfig?.version || 'N/A',
    recommendedMethod: getFileAccessMethod(),
  };
};
