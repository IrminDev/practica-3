import { Breadcrumbs } from '@/components/file-browser/breadcrumbs';
import { FileGridItem } from '@/components/file-browser/file-grid-item';
import { FileListItem } from '@/components/file-browser/file-list-item';
import { ActionModal } from '@/components/modals/action-modal';
import { FileActionsMenu } from '@/components/modals/file-actions-menu';
import { ImageViewer } from '@/components/viewers/image-viewer';
import { TextViewer } from '@/components/viewers/text-viewer';
import { useFileSystem } from "@/contexts/file-system-context";
import { useTheme } from '@/contexts/theme-context';
import { FileItem } from '@/types/file-system';
import { isExpoGo } from '@/utils/environment';
import { isImageFile, isTextFile } from '@/utils/file-utils';
import { addFavorite, isFavorite, removeFavorite, saveRecentFile } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function FileBrowserScreen() {
  const { colors } = useTheme();
  const {
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
  } = useFileSystem();

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [textViewerVisible, setTextViewerVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [selectedFile]);

  const checkFavorite = async () => {
    if (selectedFile) {
      const fav = await isFavorite(selectedFile.path);
      setIsFav(fav);
    }
  };

  const handleFilePress = async (item: FileItem) => {
    if (item.isDirectory) {
      navigateTo(item.path);
    } else {
      setSelectedFile(item);
      
      // Guardar en recientes
      await saveRecentFile({
        path: item.path,
        name: item.name,
        timestamp: Date.now(),
        type: item.type || 'unknown',
      });

      // Abrir según el tipo
      if (isTextFile(item.name)) {
        setTextViewerVisible(true);
      } else if (isImageFile(item.name)) {
        setImageViewerVisible(true);
      } else {
        // Para cualquier otro tipo de archivo, mostrar opciones
        // incluyendo "Abrir con..." para usar aplicaciones externas
        setActionsVisible(true);
      }
    }
  };

  const handleFileLongPress = (item: FileItem) => {
    setSelectedFile(item);
    setActionsVisible(true);
  };

  const handleToggleFavorite = async () => {
    if (!selectedFile) return;

    if (isFav) {
      await removeFavorite(selectedFile.path);
      Alert.alert('Eliminado', 'Eliminado de favoritos');
    } else {
      await addFavorite({
        path: selectedFile.path,
        name: selectedFile.name,
        isDirectory: selectedFile.isDirectory,
        addedAt: Date.now(),
      });
      Alert.alert('Agregado', 'Agregado a favoritos');
    }
    setIsFav(!isFav);
  };

  const handleShare = async () => {
    if (!selectedFile) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(selectedFile.uri);
      } else {
        Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir el archivo');
    }
  };

  const handleOpenWith = async () => {
    if (!selectedFile || Platform.OS !== 'android') {
      Alert.alert('Error', 'Esta función solo está disponible en Android');
      return;
    }

    // Obtener el tipo MIME basado en la extensión del archivo (fuera del try para acceso en catch)
    const extension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: { [key: string]: string } = {
        // Documentos
        pdf: 'application/pdf',
        doc: 'application/msword',
        dot: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        dotx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
        xls: 'application/vnd.ms-excel',
        xlt: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xltx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
        ppt: 'application/vnd.ms-powerpoint',
        pot: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        potx: 'application/vnd.openxmlformats-officedocument.presentationml.template',
        odt: 'application/vnd.oasis.opendocument.text',
        ods: 'application/vnd.oasis.opendocument.spreadsheet',
        odp: 'application/vnd.oasis.opendocument.presentation',
        rtf: 'application/rtf',
        epub: 'application/epub+zip',
        mobi: 'application/x-mobipocket-ebook',
        
        // Texto
        txt: 'text/plain',
        csv: 'text/csv',
        html: 'text/html',
        xml: 'text/xml',
        json: 'application/json',
        
        // Imágenes
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        bmp: 'image/bmp',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        
        // Video - con múltiples variaciones
        mp4: 'video/mp4',
        m4v: 'video/mp4', // M4V también es MP4
        avi: 'video/x-msvideo',
        mkv: 'video/x-matroska',
        mov: 'video/quicktime',
        webm: 'video/webm',
        '3gp': 'video/3gpp',
        '3gpp': 'video/3gpp',
        '3g2': 'video/3gpp2',
        flv: 'video/x-flv',
        wmv: 'video/x-ms-wmv',
        mpg: 'video/mpeg',
        mpeg: 'video/mpeg',
        ogv: 'video/ogg',
        ts: 'video/mp2t',
        mts: 'video/mp2t',
        
        // Audio
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        wave: 'audio/wav',
        ogg: 'audio/ogg',
        oga: 'audio/ogg',
        m4a: 'audio/mp4',
        flac: 'audio/flac',
        aac: 'audio/aac',
        wma: 'audio/x-ms-wma',
        opus: 'audio/opus',
        mid: 'audio/midi',
        midi: 'audio/midi',
        amr: 'audio/amr',
        
        // Archivos comprimidos
        zip: 'application/zip',
        rar: 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
        tar: 'application/x-tar',
        gz: 'application/gzip',
        
        // Aplicaciones
        apk: 'application/vnd.android.package-archive',
      };
    
    const mimeType = mimeTypes[extension] || 'application/octet-stream';

    // Convertir file:// URI a content:// URI usando FileProvider
    let contentUri = selectedFile.uri;
    
    console.log('📂 URI original:', selectedFile.uri);
    console.log('📂 Tipo de archivo:', extension);
    console.log('📂 MIME type:', mimeType);
    
    // Convertir file:// a content:// para evitar FileUriExposedException en Android 7+
    if (contentUri.startsWith('file://')) {
      // Decodificar primero si ya está encoded para evitar double encoding
      const decodedUri = decodeURIComponent(contentUri);
      const filePath = decodedUri.replace('file://', '');
      const authority = 'com.practica3.fileexplorer.fileprovider';
      
      // Convertir path absoluto a relativo desde /storage/emulated/0/
      const relativePath = filePath.replace('/storage/emulated/0/', '');
      
      // Encodear solo una vez el path relativo
      contentUri = `content://${authority}/external_storage/${encodeURIComponent(relativePath)}`;
      
      console.log('📱 Convertido a content URI:', {
        original: selectedFile.uri,
        decodedOriginal: decodedUri,
        relativePath: relativePath,
        converted: contentUri
      });
    }

    try {
      console.log('🚀 Intentando abrir archivo con IntentLauncher...');

      // Intentar abrir con el intent de Android con selector de aplicación
      // Flags importantes:
      // 1 = FLAG_GRANT_READ_URI_PERMISSION (permite a la app destino leer el archivo)
      // 268435456 = FLAG_ACTIVITY_NEW_TASK (abre en una nueva tarea)
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: mimeType,
        flags: 1 | 268435456, // Combinar ambos flags
      });
      
      setActionsVisible(false);
    } catch (error: any) {
      console.error('Error opening file:', error);
      
      // Si falló con el MIME type específico, intentar con uno genérico
      try {
        console.log('Reintentando con MIME type genérico...');
        
        // Usar el mismo content URI que ya convertimos
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          type: '*/*', // MIME type genérico
          flags: 1 | 268435456,
        });
        
        setActionsVisible(false);
      } catch (secondError: any) {
        console.error('Error en segundo intento:', secondError);
        Alert.alert(
          'No se puede abrir el archivo', 
          `No se encontró ninguna aplicación que pueda abrir este tipo de archivo (${extension}).\n\n` +
          `Tipo MIME: ${mimeType}\n\n` +
          `Intenta instalar una aplicación compatible desde Google Play Store.\n\n` +
          `Error: ${secondError.message || error.message || 'Error desconocido'}`
        );
      }
    }
  };

  const handleRename = async (newName: string) => {
    if (!selectedFile) return;

    const success = await renameItem(selectedFile.path, newName);
    if (success) {
      Alert.alert('Éxito', 'Elemento renombrado correctamente');
    } else {
      Alert.alert('Error', 'No se pudo renombrar el elemento');
    }
  };

  const handleDelete = () => {
    if (!selectedFile) return;

    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar "${selectedFile.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteItem(selectedFile.path);
            if (success) {
              Alert.alert('Éxito', 'Elemento eliminado correctamente');
            } else {
              Alert.alert('Error', 'No se pudo eliminar el elemento');
            }
          },
        },
      ]
    );
  };

  const handleCreateFolder = async (name: string) => {
    const success = await createFolder(name);
    if (success) {
      Alert.alert('Éxito', 'Carpeta creada correctamente');
    } else {
      Alert.alert('Error', 'No se pudo crear la carpeta');
    }
  };

  const getFileActions = () => {
    const actions: Array<{
      id: string;
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
      color?: string;
      onPress: () => void;
    }> = [
      {
        id: 'favorite',
        label: isFav ? 'Quitar de favoritos' : 'Agregar a favoritos',
        icon: (isFav ? 'star' : 'star-outline') as keyof typeof Ionicons.glyphMap,
        color: colors.primary,
        onPress: handleToggleFavorite,
      },
      {
        id: 'share',
        label: 'Compartir',
        icon: 'share-social' as keyof typeof Ionicons.glyphMap,
        onPress: handleShare,
      },
      {
        id: 'rename',
        label: 'Renombrar',
        icon: 'create' as keyof typeof Ionicons.glyphMap,
        onPress: () => setRenameVisible(true),
      },
      {
        id: 'delete',
        label: 'Eliminar',
        icon: 'trash' as keyof typeof Ionicons.glyphMap,
        color: colors.error,
        onPress: handleDelete,
      },
    ];

    if (!selectedFile?.isDirectory) {
      actions.splice(1, 0, {
        id: 'open',
        label: 'Abrir con...',
        icon: 'open' as keyof typeof Ionicons.glyphMap,
        onPress: handleOpenWith,
      });
    }

    return actions;
  };

  const renderItem = ({ item }: { item: FileItem }) => {
    if (viewMode === 'grid') {
      return (
        <FileGridItem
          item={item}
          onPress={() => handleFilePress(item)}
          onLongPress={() => handleFileLongPress(item)}
        />
      );
    }
    return (
      <FileListItem
        item={item}
        onPress={() => handleFilePress(item)}
        onLongPress={() => handleFileLongPress(item)}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={navigateBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>Explorador</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            style={styles.headerButton}
          >
            <Ionicons
              name={viewMode === 'list' ? 'grid' : 'list'}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setCreateFolderVisible(true)} style={styles.headerButton}>
            <Ionicons name="folder-open" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={refreshFiles} style={styles.headerButton}>
            <Ionicons name="refresh" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <Breadcrumbs currentPath={currentPath} onNavigate={navigateTo} />

      {/* Banner informativo para Expo Go */}
      {isExpoGo() && Platform.OS === 'android' && (
        <View style={[styles.expoBanner, { backgroundColor: '#FFF3CD', borderColor: '#FFC107' }]}>
          <Ionicons name="information-circle" size={20} color="#856404" style={styles.bannerIcon} />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Modo Expo Go - Funcionalidad Limitada</Text>
            <Text style={styles.bannerText}>
              Solo se muestran archivos multimedia (fotos, videos, audio). 
              Para ver todos los archivos, construye un APK standalone con "eas build".
            </Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={refreshFiles} style={styles.retryButton}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : files.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Esta carpeta está vacía
          </Text>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={files}
          renderItem={renderItem}
          keyExtractor={(item) => item.path}
          numColumns={viewMode === 'grid' ? 3 : 1}
          contentContainerStyle={viewMode === 'grid' ? styles.gridContainer : undefined}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refreshFiles} tintColor={colors.primary} />
          }
        />
      )}

      {selectedFile && (
        <>
          <FileActionsMenu
            visible={actionsVisible}
            onClose={() => setActionsVisible(false)}
            fileName={selectedFile.name}
            actions={getFileActions()}
          />

          <ActionModal
            visible={renameVisible}
            onClose={() => setRenameVisible(false)}
            title="Renombrar"
            placeholder="Nuevo nombre"
            initialValue={selectedFile.name}
            onConfirm={handleRename}
          />

          <ActionModal
            visible={createFolderVisible}
            onClose={() => setCreateFolderVisible(false)}
            title="Nueva carpeta"
            placeholder="Nombre de la carpeta"
            onConfirm={handleCreateFolder}
          />

          {textViewerVisible && (
            <TextViewer
              visible={textViewerVisible}
              onClose={() => setTextViewerVisible(false)}
              filePath={selectedFile.uri}
              fileName={selectedFile.name}
            />
          )}

          {imageViewerVisible && (
            <ImageViewer
              visible={imageViewerVisible}
              onClose={() => setImageViewerVisible(false)}
              imageUri={selectedFile.uri}
              imageName={selectedFile.name}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    padding: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  gridContainer: {
    padding: 8,
  },
  expoBanner: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  bannerIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
});
