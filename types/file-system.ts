export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modificationTime?: number;
  type?: string;
  uri: string;
}

export interface RecentFile {
  path: string;
  name: string;
  timestamp: number;
  type: string;
}

export interface FavoriteFile {
  path: string;
  name: string;
  isDirectory: boolean;
  addedAt: number;
}

export type ViewMode = 'list' | 'grid';

export type ThemeType = 'ipn' | 'escom';

export interface AppSettings {
  theme: ThemeType;
  viewMode: ViewMode;
}
