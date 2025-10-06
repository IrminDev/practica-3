import { useTheme } from '@/contexts/theme-context';
import { FileItem } from '@/types/file-system';
import { formatDate, formatFileSize, getFileType } from '@/utils/file-utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FileListItemProps {
  item: FileItem;
  onPress: () => void;
  onLongPress: () => void;
}

export const FileListItem: React.FC<FileListItemProps> = ({ item, onPress, onLongPress }) => {
  const { colors } = useTheme();
  const fileType = getFileType(item.name, item.isDirectory);

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    if (item.isDirectory) return 'folder';
    
    switch (fileType) {
      case 'text': return 'document-text';
      case 'image': return 'image';
      case 'video': return 'videocam';
      case 'audio': return 'musical-notes';
      case 'document': return 'document';
      case 'archive': return 'archive';
      case 'code': return 'code-slash';
      default: return 'document-outline';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getIcon()} 
          size={32} 
          color={item.isDirectory ? colors.primary : colors.textSecondary} 
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text 
          style={[styles.name, { color: colors.text }]} 
          numberOfLines={1}
        >
          {item.name}
        </Text>
        
        <View style={styles.detailsRow}>
          <Text style={[styles.details, { color: colors.textSecondary }]}>
            {item.isDirectory ? 'Carpeta' : formatFileSize(item.size)}
          </Text>
          {item.modificationTime && (
            <>
              <Text style={[styles.separator, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.details, { color: colors.textSecondary }]}>
                {formatDate(item.modificationTime)}
              </Text>
            </>
          )}
        </View>
      </View>
      
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={colors.textSecondary} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  details: {
    fontSize: 12,
  },
  separator: {
    marginHorizontal: 6,
    fontSize: 12,
  },
});
