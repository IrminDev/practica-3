import { FileItem } from '@/types/file-system';
import { Paths } from 'expo-file-system';

export const ROOT_DIRECTORY = Paths.document;

export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const getFileType = (filename: string, isDirectory: boolean): string => {
  if (isDirectory) return 'folder';
  
  const extension = getFileExtension(filename);
  
  const typeMap: { [key: string]: string } = {
    // Texto
    txt: 'text',
    md: 'text',
    log: 'text',
    json: 'text',
    xml: 'text',
    csv: 'text',
    
    // Imágenes
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    bmp: 'image',
    webp: 'image',
    svg: 'image',
    
    // Documentos
    pdf: 'document',
    doc: 'document',
    docx: 'document',
    xls: 'document',
    xlsx: 'document',
    ppt: 'document',
    pptx: 'document',
    
    // Video
    mp4: 'video',
    avi: 'video',
    mkv: 'video',
    mov: 'video',
    wmv: 'video',
    
    // Audio
    mp3: 'audio',
    wav: 'audio',
    flac: 'audio',
    aac: 'audio',
    ogg: 'audio',
    
    // Archivos comprimidos
    zip: 'archive',
    rar: 'archive',
    '7z': 'archive',
    tar: 'archive',
    gz: 'archive',
    
    // Código
    js: 'code',
    jsx: 'code',
    ts: 'code',
    tsx: 'code',
    py: 'code',
    java: 'code',
    cpp: 'code',
    c: 'code',
    html: 'code',
    css: 'code',
  };
  
  return typeMap[extension] || 'unknown';
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

export const formatDate = (timestamp?: number): string => {
  if (!timestamp) return 'Desconocido';
  
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Hoy ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Ayer ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else {
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

export const isTextFile = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  const textExtensions = ['txt', 'md', 'log', 'json', 'xml', 'csv', 'html', 'css', 'js', 'jsx', 'ts', 'tsx'];
  return textExtensions.includes(extension);
};

export const isImageFile = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  return imageExtensions.includes(extension);
};

export const sortFiles = (files: FileItem[], sortBy: 'name' | 'date' | 'size' | 'type' = 'name'): FileItem[] => {
  return [...files].sort((a, b) => {
    // Carpetas primero
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return (b.modificationTime || 0) - (a.modificationTime || 0);
      case 'size':
        return (b.size || 0) - (a.size || 0);
      case 'type':
        const typeA = getFileType(a.name, a.isDirectory);
        const typeB = getFileType(b.name, b.isDirectory);
        return typeA.localeCompare(typeB);
      default:
        return 0;
    }
  });
};

export const getParentDirectory = (path: string): string => {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '/';
};

export const getBreadcrumbs = (path: string): { name: string; path: string }[] => {
  if (!path || path === '/') {
    return [{ name: 'Inicio', path: '/' }];
  }
  
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs: { name: string; path: string }[] = [
    { name: 'Inicio', path: '/' }
  ];
  
  let currentPath = '';
  for (const part of parts) {
    currentPath += '/' + part;
    breadcrumbs.push({
      name: part,
      path: currentPath
    });
  }
  
  return breadcrumbs;
};
