import { FileItem, ViewMode } from '@/types/file-system';
import { getFileType, sortFiles } from '@/utils/file-utils';
import { getSettings, saveSettings } from '@/utils/storage';
import { Directory, File, Paths } from 'expo-file-system';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

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
  // En Android, el almacenamiento interno está en /storage/emulated/0/
  // Esta es la carpeta "home" donde están Downloads, Documents, DCIM, etc.
  const getHomeDirectory = (): string => {
    if (Platform.OS === 'android') {
      // Intentar usar el directorio de almacenamiento externo
      // En Android, esto apunta a /storage/emulated/0/
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

  useEffect(() => {
    loadSettings();
    requestPermissions();
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
        if (Platform.Version >= 33) {
          // Android 13+ requiere permisos específicos por tipo de medio
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
          ]);
          return Object.values(granted).every(
            status => status === PermissionsAndroid.RESULTS.GRANTED
          );
        } else if (Platform.Version >= 30) {
          // Android 11-12 usa Scoped Storage
          // Solicitar permisos de lectura/escritura para acceder a /storage/emulated/0/
          const readGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
          const writeGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          return readGranted === PermissionsAndroid.RESULTS.GRANTED &&
                 writeGranted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // Android 10 y anteriores
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
          const writeGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED &&
                 writeGranted === PermissionsAndroid.RESULTS.GRANTED;
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

    // En Android, permitir acceso solo dentro del directorio home (/storage/emulated/0/)
    // y sus subdirectorios (Download, Documents, DCIM, Pictures, Music, etc.)
    const androidHomePath = 'file:///storage/emulated/0/';
    
    // Verificar que el path esté dentro del directorio home
    // y no intentar navegar fuera de él (evitar ../ o paths absolutos fuera)
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
      // Verificar si tenemos permisos para acceder a este path en Android
      if (Platform.OS === 'android' && !isAccessiblePath(path)) {
        throw new Error('No tiene permisos para acceder a este directorio');
      }

      const directory = new Directory(path);
      
      if (!directory.exists) {
        setError('El directorio no existe');
        setFiles([]);
        return;
      }

      const items = directory.list();
      
      const fileItems: FileItem[] = items.map((item) => {
        const isDir = item instanceof Directory;
        
        return {
          name: item.name,
          path: item.uri,
          uri: item.uri,
          isDirectory: isDir,
          size: isDir ? undefined : (item as File).size,
          modificationTime: undefined, // No disponible en nueva API
          type: getFileType(item.name, isDir), // Agregar el tipo de archivo
        };
      });

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
      // Verificar permisos antes de crear carpeta en Android
      if (Platform.OS === 'android' && !isAccessiblePath(currentPath)) {
        throw new Error('No tiene permisos para crear carpetas en este directorio');
      }

      const newDir = new Directory(currentPath, name);
      newDir.create();
      await refreshFiles();
      return true;
    } catch (err: any) {
      console.error('Error creating folder:', err);
      const errorMessage = err.message || 'Error al crear carpeta';
      setError(errorMessage);
      
      if (errorMessage.includes('permisos') || errorMessage.includes('permission')) {
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          Alert.alert(
            'Acceso Denegado',
            'No tiene permisos para crear carpetas en este directorio.',
            [{ text: 'OK' }]
          );
        }
      }
      return false;
    }
  };

  const deleteItem = async (path: string): Promise<boolean> => {
    try {
      // Verificar permisos antes de eliminar en Android
      if (Platform.OS === 'android' && !isAccessiblePath(path)) {
        throw new Error('No tiene permisos para eliminar en este directorio');
      }

      const item = path.includes('.') ? new File(path) : new Directory(path);
      item.delete();
      await refreshFiles();
      return true;
    } catch (err: any) {
      console.error('Error deleting item:', err);
      const errorMessage = err.message || 'Error al eliminar';
      setError(errorMessage);
      
      if (errorMessage.includes('permisos') || errorMessage.includes('permission')) {
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          Alert.alert(
            'Acceso Denegado',
            'No tiene permisos para eliminar elementos en este directorio.',
            [{ text: 'OK' }]
          );
        }
      }
      return false;
    }
  };

  const renameItem = async (oldPath: string, newName: string): Promise<boolean> => {
    try {
      // Verificar permisos antes de renombrar en Android
      if (Platform.OS === 'android' && !isAccessiblePath(oldPath)) {
        throw new Error('No tiene permisos para renombrar en este directorio');
      }

      const isDir = !oldPath.includes('.');
      const oldItem = isDir ? new Directory(oldPath) : new File(oldPath);
      const parent = isDir ? (oldItem as Directory).parentDirectory : (oldItem as File).parentDirectory;
      const newItem = isDir ? new Directory(parent, newName) : new File(parent, newName);
      
      oldItem.move(newItem);
      await refreshFiles();
      return true;
    } catch (err: any) {
      console.error('Error renaming item:', err);
      const errorMessage = err.message || 'Error al renombrar';
      setError(errorMessage);
      
      if (errorMessage.includes('permisos') || errorMessage.includes('permission')) {
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          Alert.alert(
            'Acceso Denegado',
            'No tiene permisos para renombrar elementos en este directorio.',
            [{ text: 'OK' }]
          );
        }
      }
      return false;
    }
  };

  const copyItem = async (sourcePath: string, destinationPath: string): Promise<boolean> => {
    try {
      // Verificar permisos antes de copiar en Android
      if (Platform.OS === 'android') {
        if (!isAccessiblePath(sourcePath) || !isAccessiblePath(destinationPath)) {
          throw new Error('No tiene permisos para copiar desde/hacia este directorio');
        }
      }

      const source = new File(sourcePath);
      const destination = new File(destinationPath);
      source.copy(destination);
      await refreshFiles();
      return true;
    } catch (err: any) {
      console.error('Error copying item:', err);
      const errorMessage = err.message || 'Error al copiar';
      setError(errorMessage);
      
      if (errorMessage.includes('permisos') || errorMessage.includes('permission')) {
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          Alert.alert(
            'Acceso Denegado',
            'No tiene permisos para copiar elementos en estos directorios.',
            [{ text: 'OK' }]
          );
        }
      }
      return false;
    }
  };

  const moveItem = async (sourcePath: string, destinationPath: string): Promise<boolean> => {
    try {
      // Verificar permisos antes de mover en Android
      if (Platform.OS === 'android') {
        if (!isAccessiblePath(sourcePath) || !isAccessiblePath(destinationPath)) {
          throw new Error('No tiene permisos para mover desde/hacia este directorio');
        }
      }

      const isDir = !sourcePath.includes('.');
      const source = isDir ? new Directory(sourcePath) : new File(sourcePath);
      const destination = isDir ? new Directory(destinationPath) : new File(destinationPath);
      source.move(destination);
      await refreshFiles();
      return true;
    } catch (err: any) {
      console.error('Error moving item:', err);
      const errorMessage = err.message || 'Error al mover';
      setError(errorMessage);
      
      if (errorMessage.includes('permisos') || errorMessage.includes('permission')) {
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          Alert.alert(
            'Acceso Denegado',
            'No tiene permisos para mover elementos en estos directorios.',
            [{ text: 'OK' }]
          );
        }
      }
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
