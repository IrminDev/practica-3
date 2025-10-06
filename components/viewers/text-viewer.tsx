import { useTheme } from '@/contexts/theme-context';
import { isTextFile } from '@/utils/file-utils';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TextViewerProps {
  visible: boolean;
  onClose: () => void;
  filePath: string;
  fileName: string;
}

export const TextViewer: React.FC<TextViewerProps> = ({
  visible,
  onClose,
  filePath,
  fileName,
}) => {
  const { colors } = useTheme();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && filePath) {
      loadContent();
    }
  }, [visible, filePath]);

  const loadContent = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isTextFile(fileName)) {
        setError('Este tipo de archivo no es compatible con el visor de texto');
        setLoading(false);
        return;
      }

      const fileContent = await FileSystem.readAsStringAsync(filePath);
      setContent(fileContent);
    } catch (err: any) {
      console.error('Error loading text file:', err);
      setError(err.message || 'Error al cargar el archivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {fileName}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Cargando archivo...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle" size={64} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : (
          <ScrollView style={styles.contentContainer}>
            <Text style={[styles.content, { color: colors.text }]}>{content}</Text>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  content: {
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
