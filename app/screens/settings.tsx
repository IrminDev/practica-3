import { useTheme } from '@/contexts/theme-context';
import { ThemeType } from '@/types/file-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SettingsScreen() {
  const { colors, theme, setTheme, isDark } = useTheme();

  const themeOptions: { value: ThemeType; label: string; color: string }[] = [
    { value: 'ipn', label: 'IPN (Guinda)', color: '#6B2E5F' },
    { value: 'escom', label: 'ESCOM (Azul)', color: '#003D6D' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Configuración</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tema</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Modo: {isDark ? 'Oscuro' : 'Claro'} (automático)
        </Text>
      </View>

      {themeOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.option,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
          onPress={() => setTheme(option.value)}
          activeOpacity={0.7}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.colorIndicator, { backgroundColor: option.color }]} />
            <Text style={[styles.optionText, { color: colors.text }]}>{option.label}</Text>
          </View>
          
          {theme === option.value && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      ))}

      <View style={[styles.section, { backgroundColor: colors.surface, marginTop: 24 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Información</Text>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Versión</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
        </View>

        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Desarrollado para</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>IPN / ESCOM</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Plataforma</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>React Native + Expo</Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, marginTop: 24 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Características</Text>
      </View>

      <View style={[styles.featureCard, { backgroundColor: colors.surface }]}>
        <View style={styles.featureItem}>
          <Ionicons name="folder" size={24} color={colors.primary} style={styles.featureIcon} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            Explorador de archivos completo
          </Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="image" size={24} color={colors.primary} style={styles.featureIcon} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            Visor de imágenes con zoom y rotación
          </Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="document-text" size={24} color={colors.primary} style={styles.featureIcon} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            Visor de archivos de texto
          </Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="star" size={24} color={colors.primary} style={styles.featureIcon} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            Sistema de favoritos
          </Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="time" size={24} color={colors.primary} style={styles.featureIcon} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            Historial de archivos recientes
          </Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="create" size={24} color={colors.primary} style={styles.featureIcon} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            Gestión de archivos: crear, renombrar, eliminar
          </Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="share-social" size={24} color={colors.primary} style={styles.featureIcon} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            Compartir archivos
          </Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="grid" size={24} color={colors.primary} style={styles.featureIcon} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            Vista de lista y cuadrícula
          </Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="color-palette" size={24} color={colors.primary} style={styles.featureIcon} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            Temas personalizables (IPN y ESCOM)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
  },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  featureCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
});
