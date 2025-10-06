import { Breadcrumbs } from '@/components/file-browser/breadcrumbs';
import { FileGridItem } from '@/components/file-browser/file-grid-item';
import { FileListItem } from '@/components/file-browser/file-list-item';
import { ActionModal } from '@/components/modals/action-modal';
import { FileActionsMenu } from '@/components/modals/file-actions-menu';
import { ImageViewer } from '@/components/viewers/image-viewer';
import { TextViewer } from '@/components/viewers/text-viewer';
import { useFileSystem } from '@/contexts/file-system-context';
import { useTheme } from '@/contexts/theme-context';
import { FileItem } from '@/types/file-system';
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
        // Intentar abrir con intent
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
    if (!selectedFile) return;

    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: selectedFile.uri,
        flags: 1,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el archivo con otra aplicación');
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

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
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

          <TextViewer
            visible={textViewerVisible}
            onClose={() => setTextViewerVisible(false)}
            filePath={selectedFile.path}
            fileName={selectedFile.name}
          />

          <ImageViewer
            visible={imageViewerVisible}
            onClose={() => setImageViewerVisible(false)}
            imageUri={selectedFile.uri}
            imageName={selectedFile.name}
          />
        </>
      )}

      <ActionModal
        visible={createFolderVisible}
        onClose={() => setCreateFolderVisible(false)}
        title="Nueva carpeta"
        placeholder="Nombre de la carpeta"
        onConfirm={handleCreateFolder}
      />
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
    padding: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
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
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  gridContainer: {
    padding: 4,
  },
});
