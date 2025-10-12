import { FileItem, ViewMode } from '@/types/file-system';
import { getEnvironmentInfo, isExpoGo } from '@/utils/environment';
import { getFileType, sortFiles } from '@/utils/file-utils';
import { getSettings, saveSettings } from '@/utils/storage';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

interface FileSystemContextType {
  currentPath: string;
  files: FileItem[];
  viewMode: ViewMode;
  loading: boolean;
  error: string | null;
  navigateTo: (path: string) => void;
  navigateBack: () => void;
  refreshFiles: () => void;
  setViewMode: (mode: ViewMode) => void;
  createFolder: (name: string) => Promise<boolean>;
  deleteItem: (path: string) => Promise<boolean>;
  renameItem: (oldPath: string, newName: string) => Promise<boolean>;
  copyItem: (sourcePath: string, destinationPath: string) => Promise<boolean>;
  moveItem: (sourcePath: string, destinationPath: string) => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export const FileSystemProvider = ({ children }: { children: ReactNode }) => {
  // Determinar el directorio home según el entorno
  const getHomeDirectory = (): string => {
    // En Expo Go, usar el directorio de documentos de la app
    if (isExpoGo()) {
      return Paths.document.uri;
    }
    
    if (Platform.OS === 'android') {
      // En APK standalone, usar el almacenamiento externo
      return 'file:///storage/emulated/0/';
    }
    
    // Para otras plataformas, usar el directorio de documentos
    return Paths.document.uri;
  };

  const [currentPath, setCurrentPath] = useState<string>(getHomeDirectory());
  const [files, setFiles] = useState<FileItem[]>([]);
  const [viewMode, setViewModeState] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [homeDirectory] = useState<string>(getHomeDirectory());
  const [runningInExpoGo] = useState<boolean>(isExpoGo());

  useEffect(() => {
    loadSettings();
    requestPermissions();
    
    // Log del entorno para debugging
    const envInfo = getEnvironmentInfo();
    console.log('🔍 === INICIALIZANDO FILE SYSTEM CONTEXT ===');
    console.log('🔍 Información del entorno:', envInfo);
    console.log('🔍 runningInExpoGo (useState):', runningInExpoGo);
    console.log('🔍 isExpoGo() (función directa):', isExpoGo());
    
    if (runningInExpoGo) {
      console.warn('⚠️ CORRIENDO EN EXPO GO: Funcionalidad limitada de file system');
      console.log('💡 Para ver todos los archivos, construye un APK standalone');
    } else {
      console.log('✅ CORRIENDO EN APK STANDALONE: Acceso completo al file system');
    }
  }, []);

  useEffect(() => {
    if (currentPath) {
      loadFiles(currentPath);
    }
  }, [currentPath]);

  const loadSettings = async () => {
    const settings = await getSettings();
    setViewModeState(settings.viewMode);
  };

  const setViewMode = async (mode: ViewMode) => {
    setViewModeState(mode);
    const settings = await getSettings();
    await saveSettings({ ...settings, viewMode: mode });
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        // Si estamos en Expo Go, solicitar permisos de MediaLibrary
        if (runningInExpoGo) {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Permisos necesarios',
              'Esta aplicación necesita acceso a tus archivos multimedia para funcionar correctamente en Expo Go.'
            );
            return false;
          }
          return true;
        }
        
        // En APK standalone, solicitar permisos según la versión de Android
        if (Platform.Version >= 30) {
          // Android 11+ requiere MANAGE_EXTERNAL_STORAGE para acceso completo
          // Primero verificar si ya tenemos el permiso
          console.log('📋 Android 11+: Verificando MANAGE_EXTERNAL_STORAGE');
          
          // Solicitar permisos de medios primero (Android 13+)
          if (Platform.Version >= 33) {
            const mediaGranted = await PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
            ]);
            console.log('📋 Permisos de medios solicitados (Android 13+):', mediaGranted);
          }
          
          // Mostrar alerta para dirigir a configuración y otorgar MANAGE_EXTERNAL_STORAGE
          Alert.alert(
            'Acceso completo a archivos',
            'Para ver TODOS los tipos de archivos (PDF, documentos, etc.), necesitas otorgar acceso completo al almacenamiento.\n\n' +
            'En la siguiente pantalla:\n' +
            '1. Busca "practica-3"\n' +
            '2. Activa "Permitir acceso a todos los archivos"',
            [
              {
                text: 'Cancelar',
                style: 'cancel',
                onPress: () => {
                  console.log('⚠️ Usuario canceló permisos completos');
                }
              },
              {
                text: 'Abrir Configuración',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('❌ Error abriendo configuración:', error);
                  }
                }
              }
            ]
          );
          
          return true;
        } else if (Platform.Version >= 30) {
          // Android 11-12 usa Scoped Storage
          const readGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
          const writeGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          
          const allGranted = readGranted === PermissionsAndroid.RESULTS.GRANTED &&
                            writeGranted === PermissionsAndroid.RESULTS.GRANTED;
          
          console.log('📋 Permisos solicitados (Android 11-12):', { readGranted, writeGranted });
          return allGranted;
        } else {
          // Android 10 y anteriores
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
          const writeGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          
          const allGranted = granted === PermissionsAndroid.RESULTS.GRANTED &&
                            writeGranted === PermissionsAndroid.RESULTS.GRANTED;
          
          console.log('📋 Permisos solicitados (Android 10-):', { granted, writeGranted });
          return allGranted;
        }
      } catch (err) {
        console.error('Error requesting permissions:', err);
        return false;
      }
    }
    return true;
  };

  const isAccessiblePath = (path: string): boolean => {
    if (Platform.OS !== 'android') {
      // En otras plataformas, permitir acceso a los directorios de la app
      const accessiblePaths = [
        Paths.document.uri,
        Paths.cache.uri,
      ];
      return accessiblePaths.some(allowedPath => path.startsWith(allowedPath));
    }

    // En Android APK, permitir acceso solo dentro del directorio home (/storage/emulated/0/)
    const androidHomePath = 'file:///storage/emulated/0/';
    
    // Verificar que el path esté dentro del directorio home
    if (!path.startsWith(androidHomePath)) {
      return false;
    }

    // Evitar navegación fuera del home usando paths relativos
    const relativePath = path.substring(androidHomePath.length);
    if (relativePath.includes('..')) {
      return false;
    }

    return true;
  };

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 loadFiles - runningInExpoGo:', runningInExpoGo);
      console.log('🔍 loadFiles - Platform:', Platform.OS);
      console.log('🔍 loadFiles - path:', path);
      
      // En Expo Go, usar MediaLibrary para listar archivos multimedia
      if (runningInExpoGo && Platform.OS === 'android') {
        console.log('📱 Usando MediaLibrary en Expo Go (modo limitado)');
        
        // Obtener assets de la galería
        const { status } = await MediaLibrary.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            throw new Error('Se necesitan permisos para acceder a archivos multimedia');
          }
        }

        // Obtener los primeros 100 archivos multimedia
        const media = await MediaLibrary.getAssetsAsync({
          first: 100,
          mediaType: [
            MediaLibrary.MediaType.photo,
            MediaLibrary.MediaType.video,
            MediaLibrary.MediaType.audio,
          ],
          sortBy: [MediaLibrary.SortBy.modificationTime],
        });

        const fileItems: FileItem[] = media.assets.map((asset) => {
          // Determinar el tipo basado en mediaType
          let type: string;
          if (asset.mediaType === MediaLibrary.MediaType.photo) {
            type = 'image';
          } else if (asset.mediaType === MediaLibrary.MediaType.video) {
            type = 'video';
          } else if (asset.mediaType === MediaLibrary.MediaType.audio) {
            type = 'audio';
          } else {
            type = 'unknown';
          }

          return {
            name: asset.filename,
            path: asset.uri,
            uri: asset.uri,
            isDirectory: false,
            size: undefined,
            modificationTime: asset.modificationTime,
            type: type,
          };
        });

        setFiles(sortFiles(fileItems));
        
        if (fileItems.length === 0) {
          Alert.alert(
            'Expo Go - Limitaciones',
            'Expo Go solo puede mostrar archivos multimedia (fotos, videos, audio). Para ver todos los archivos, construye un APK standalone con "eas build".',
            [{ text: 'Entendido' }]
          );
        }
        
        setLoading(false);
        return;
      }

      console.log('📁 Usando acceso directo al file system (APK standalone)');
      
      // Verificar si tenemos permisos para acceder a este path en Android
      if (Platform.OS === 'android' && !isAccessiblePath(path)) {
        throw new Error('No tiene permisos para acceder a este directorio');
      }

      const directory = new Directory(path);
      
      if (!directory.exists) {
        setError('El directorio no existe');
        setFiles([]);
        setLoading(false);
        return;
      }

      console.log('📂 Listando archivos en:', path);
      const items = directory.list();
      console.log('📊 Total de items encontrados:', items.length);
      
      const fileItems: FileItem[] = items.map((item) => {
        const isDir = item instanceof Directory;
        const fileType = getFileType(item.name, isDir);
        
        console.log(`   📄 ${item.name} -> tipo: ${fileType}`);
        
        return {
          name: item.name,
          path: item.uri,
          uri: item.uri,
          isDirectory: isDir,
          size: isDir ? undefined : (item as File).size,
          modificationTime: undefined, // No disponible en nueva API
          type: fileType, // IMPORTANTE: Agregar el tipo de archivo
        };
      });

      console.log('✅ Total de archivos mapeados:', fileItems.length);
      console.log('📋 Tipos encontrados:', [...new Set(fileItems.map(f => f.type))].join(', '));
      
      setFiles(sortFiles(fileItems));
    } catch (err: any) {
      console.error('Error loading files:', err);
      const errorMessage = err.message || 'Error al cargar archivos';
      setError(errorMessage);
      setFiles([]);
      
      // Mostrar alerta al usuario si es un error de permisos
      if (errorMessage.includes('permisos') || errorMessage.includes('permission')) {
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          Alert.alert(
            'Acceso Denegado',
            Platform.OS === 'android' 
              ? 'No tiene permisos para acceder a este directorio. Solo puede acceder a carpetas dentro del almacenamiento interno (home).'
              : 'No tiene permisos para acceder a este directorio.',
            [{ text: 'OK' }]
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    try {
      // Verificar permisos antes de navegar
      if (!isAccessiblePath(path)) {
        setError('No tiene permisos para acceder a este directorio');
        Alert.alert(
          'Acceso Denegado',
          Platform.OS === 'android'
            ? 'No tiene permisos para acceder a este directorio. Solo puede navegar dentro del directorio home del almacenamiento interno.'
            : 'No tiene permisos para acceder a este directorio.',
          [{ text: 'OK' }]
        );
        return;
      }
      setCurrentPath(path);
    } catch (err: any) {
      console.error('Error navigating to path:', err);
      setError(err.message || 'Error al navegar al directorio');
    }
  };

  const navigateBack = () => {
    try {
      const directory = new Directory(currentPath);
      const parent = directory.parentDirectory;
      
      // Si ya estamos en el directorio home, no permitir retroceder más
      if (currentPath === homeDirectory) {
        setError('Ya está en el directorio raíz');
        return;
      }
      
      if (parent && parent.uri !== directory.uri) {
        // Verificar permisos antes de navegar al directorio padre
        if (!isAccessiblePath(parent.uri)) {
          setError('No puede navegar fuera del directorio home');
          Alert.alert(
            'Acceso Denegado',
            'No puede navegar fuera del directorio home. Esta es la carpeta raíz del almacenamiento.',
            [{ text: 'OK' }]
          );
          return;
        }
        setCurrentPath(parent.uri);
      }
    } catch (err: any) {
      console.error('Error navigating back:', err);
      setError(err.message || 'Error al navegar hacia atrás');
    }
  };

  const refreshFiles = () => {
    loadFiles(currentPath);
  };

  const createFolder = async (name: string): Promise<boolean> => {
    try {
      const newDir = new Directory(currentPath, name);
      newDir.create();
      await refreshFiles();
      return true;
    } catch (err: any) {
      console.error('Error creating folder:', err);
      setError(err.message || 'Error al crear carpeta');
      return false;
    }
  };

  const deleteItem = async (path: string): Promise<boolean> => {
    try {
      const item = path.includes('.') ? new File(path) : new Directory(path);
      item.delete();
      await refreshFiles();
      return true;
    } catch (err: any) {
      console.error('Error deleting item:', err);
      setError(err.message || 'Error al eliminar');
      return false;
    }
  };

  const renameItem = async (oldPath: string, newName: string): Promise<boolean> => {
    try {
      const isDir = !oldPath.includes('.');
      const oldItem = isDir ? new Directory(oldPath) : new File(oldPath);
      const parent = isDir ? (oldItem as Directory).parentDirectory : (oldItem as File).parentDirectory;
      const newItem = isDir ? new Directory(parent, newName) : new File(parent, newName);
      
      oldItem.move(newItem);
      await refreshFiles();
      return true;
    } catch (err: any) {
      console.error('Error renaming item:', err);
      setError(err.message || 'Error al renombrar');
      return false;
    }
  };

  const copyItem = async (sourcePath: string, destinationPath: string): Promise<boolean> => {
    try {
      const source = new File(sourcePath);
      const destination = new File(destinationPath);
      source.copy(destination);
      await refreshFiles();
      return true;
    } catch (err: any) {
      console.error('Error copying item:', err);
      setError(err.message || 'Error al copiar');
      return false;
    }
  };

  const moveItem = async (sourcePath: string, destinationPath: string): Promise<boolean> => {
    try {
      const isDir = !sourcePath.includes('.');
      const source = isDir ? new Directory(sourcePath) : new File(sourcePath);
      const destination = isDir ? new Directory(destinationPath) : new File(destinationPath);
      source.move(destination);
      await refreshFiles();
      return true;
    } catch (err: any) {
      console.error('Error moving item:', err);
      setError(err.message || 'Error al mover');
      return false;
    }
  };

  return (
    <FileSystemContext.Provider
      value={{
        currentPath,
        files,
        viewMode,
        loading,
        error,
        navigateTo,
        navigateBack,
        refreshFiles,
        setViewMode,
        createFolder,
        deleteItem,
        renameItem,
        copyItem,
        moveItem,
        requestPermissions,
      }}
    >
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within FileSystemProvider');
  }
  return context;
};
