import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface ImageViewerProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string;
  imageName: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  onClose,
  imageUri,
  imageName,
}) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.5, 1));
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {imageName}
            </Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleZoomOut} style={styles.iconButton}>
                <Ionicons name="remove-circle-outline" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleZoomIn} style={styles.iconButton}>
                <Ionicons name="add-circle-outline" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRotate} style={styles.iconButton}>
                <Ionicons name="sync" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReset} style={styles.iconButton}>
                <Ionicons name="refresh" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {loading && (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {error ? (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle" size={64} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                Error al cargar la imagen
              </Text>
            </View>
          ) : (
            <ScrollView 
              contentContainerStyle={styles.imageContainer}
              maximumZoomScale={3}
              minimumZoomScale={1}
            >
              <View style={{
                transform: [
                  { rotate: `${rotation}deg` },
                  { scale: scale },
                ],
              }}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="contain"
                  onLoadStart={() => setLoading(true)}
                  onLoadEnd={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError(true);
                  }}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </GestureHandlerRootView>
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
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 100,
  },
});
