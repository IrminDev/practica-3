import { useFileSystem } from '@/contexts/file-system-context';
import { useTheme } from '@/contexts/theme-context';
import { FavoriteFile, RecentFile } from '@/types/file-system';
import { formatDate } from '@/utils/file-utils';
import { clearRecentFiles, getFavorites, getRecentFiles, removeFavorite } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { navigateTo } = useFileSystem();
  const [favorites, setFavorites] = useState<FavoriteFile[]>([]);
  const [recent, setRecent] = useState<RecentFile[]>([]);
  const [activeTab, setActiveTab] = useState<'favorites' | 'recent'>('favorites');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const favs = await getFavorites();
    const recs = await getRecentFiles();
    setFavorites(favs);
    setRecent(recs);
  };

  const handleRemoveFavorite = async (path: string) => {
    Alert.alert(
      'Eliminar favorito',
      '¿Deseas eliminar este elemento de favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await removeFavorite(path);
            await loadData();
          },
        },
      ]
    );
  };

  const handleClearRecent = () => {
    Alert.alert(
      'Limpiar recientes',
      '¿Deseas eliminar todo el historial de archivos recientes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await clearRecentFiles();
            await loadData();
          },
        },
      ]
    );
  };

  const handleFavoritePress = (item: FavoriteFile) => {
    navigateTo(item.isDirectory ? item.path : item.path.substring(0, item.path.lastIndexOf('/')));
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteFile }) => (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      onPress={() => handleFavoritePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemIcon}>
        <Ionicons
          name={item.isDirectory ? 'folder' : 'document'}
          size={32}
          color={colors.primary}
        />
      </View>
      
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.itemPath, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.path}
        </Text>
        <Text style={[styles.itemDate, { color: colors.textSecondary }]}>
          Agregado: {formatDate(item.addedAt / 1000)}
        </Text>
      </View>
      
      <TouchableOpacity
        onPress={() => handleRemoveFavorite(item.path)}
        style={styles.removeButton}
      >
        <Ionicons name="trash" size={20} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }: { item: RecentFile }) => (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      onPress={() => navigateTo(item.path.substring(0, item.path.lastIndexOf('/')))}
      activeOpacity={0.7}
    >
      <View style={styles.itemIcon}>
        <Ionicons name="document" size={32} color={colors.textSecondary} />
      </View>
      
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.itemPath, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.path}
        </Text>
        <Text style={[styles.itemDate, { color: colors.textSecondary }]}>
          {formatDate(item.timestamp / 1000)}
        </Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Historial</Text>
        {activeTab === 'recent' && recent.length > 0 && (
          <TouchableOpacity onPress={handleClearRecent}>
            <Text style={[styles.clearButton, { color: colors.error }]}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'favorites' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('favorites')}
        >
          <Ionicons
            name="star"
            size={20}
            color={activeTab === 'favorites' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'favorites' ? colors.primary : colors.textSecondary },
            ]}
          >
            Favoritos ({favorites.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'recent' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('recent')}
        >
          <Ionicons
            name="time"
            size={20}
            color={activeTab === 'recent' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'recent' ? colors.primary : colors.textSecondary },
            ]}
          >
            Recientes ({recent.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'favorites' ? (
        favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No tienes favoritos guardados
            </Text>
          </View>
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderFavoriteItem}
            keyExtractor={(item) => item.path}
          />
        )
      ) : recent.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay archivos recientes
          </Text>
        </View>
      ) : (
        <FlatList
          data={recent}
          renderItem={renderRecentItem}
          keyExtractor={(item) => item.path + item.timestamp}
        />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPath: {
    fontSize: 12,
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 11,
  },
  removeButton: {
    padding: 8,
  },
});
