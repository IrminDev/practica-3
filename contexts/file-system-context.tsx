import { FileItem, ViewMode } from '@/types/file-system';
import { sortFiles } from '@/utils/file-utils';
import { getSettings, saveSettings } from '@/utils/storage';
import { Directory, File, Paths } from 'expo-file-system';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

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
  const [currentPath, setCurrentPath] = useState<string>(Paths.document.uri);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [viewMode, setViewModeState] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
          ]);
          return Object.values(granted).every(
            status => status === PermissionsAndroid.RESULTS.GRANTED
          );
        } else if (Platform.Version >= 30) {
          // Android 11+ usa Scoped Storage por defecto
          return true;
        } else {
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

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError(null);

    try {
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
        };
      });

      setFiles(sortFiles(fileItems));
    } catch (err: any) {
      console.error('Error loading files:', err);
      setError(err.message || 'Error al cargar archivos');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    setCurrentPath(path);
  };

  const navigateBack = () => {
    const directory = new Directory(currentPath);
    const parent = directory.parentDirectory;
    if (parent && parent.uri !== directory.uri) {
      setCurrentPath(parent.uri);
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
