import { useTheme } from '@/contexts/theme-context';
import { FileItem } from '@/types/file-system';
import { formatFileSize, getFileType } from '@/utils/file-utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FileGridItemProps {
  item: FileItem;
  onPress: () => void;
  onLongPress: () => void;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 3;

export const FileGridItem: React.FC<FileGridItemProps> = ({ item, onPress, onLongPress }) => {
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
      style={[
        styles.container, 
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          width: ITEM_WIDTH 
        }
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getIcon()} 
          size={48} 
          color={item.isDirectory ? colors.primary : colors.textSecondary} 
        />
      </View>
      
      <Text 
        style={[styles.name, { color: colors.text }]} 
        numberOfLines={2}
        ellipsizeMode="middle"
      >
        {item.name}
      </Text>
      
      {!item.isDirectory && item.size !== undefined && (
        <Text style={[styles.size, { color: colors.textSecondary }]}>
          {formatFileSize(item.size)}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 8,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  size: {
    fontSize: 10,
  },
});
