import { useTheme } from '@/contexts/theme-context';
import { getBreadcrumbs } from '@/utils/file-utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BreadcrumbsProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentPath, onNavigate }) => {
  const { colors } = useTheme();
  const breadcrumbs = getBreadcrumbs(currentPath);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={[styles.container, { backgroundColor: colors.surface }]}
      contentContainerStyle={styles.contentContainer}
    >
      {breadcrumbs.map((crumb, index) => (
        <View key={crumb.path} style={styles.crumbContainer}>
          <TouchableOpacity
            onPress={() => onNavigate(crumb.path)}
            style={styles.crumbButton}
            activeOpacity={0.7}
          >
            {index === 0 && (
              <Ionicons 
                name="home" 
                size={16} 
                color={colors.primary} 
                style={styles.homeIcon}
              />
            )}
            <Text 
              style={[
                styles.crumbText, 
                { color: index === breadcrumbs.length - 1 ? colors.primary : colors.textSecondary }
              ]}
            >
              {crumb.name}
            </Text>
          </TouchableOpacity>
          
          {index < breadcrumbs.length - 1 && (
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={colors.textSecondary}
              style={styles.separator}
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 50,
    borderBottomWidth: 1,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  crumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crumbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  homeIcon: {
    marginRight: 4,
  },
  crumbText: {
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    marginHorizontal: 4,
  },
});
