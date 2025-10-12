const {
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin para agregar FileProvider al AndroidManifest.xml y crear file_paths.xml
 * Esto permite compartir archivos usando content:// URIs en Android
 * 
 * Compatible con EAS Build y expo prebuild
 */
const withAndroidFileProvider = (config) => {
  // Paso 1: Agregar FileProvider al AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];

    // Verificar si ya existe el FileProvider
    const hasFileProvider = application.provider?.some(
      (provider) => provider.$['android:name'] === 'androidx.core.content.FileProvider'
    );

    if (!hasFileProvider) {
      // Asegurar que existe el array de providers
      if (!application.provider) {
        application.provider = [];
      }

      // Agregar el FileProvider
      application.provider.push({
        $: {
          'android:name': 'androidx.core.content.FileProvider',
          'android:authorities': '${applicationId}.fileprovider',
          'android:exported': 'false',
          'android:grantUriPermissions': 'true',
        },
        'meta-data': [
          {
            $: {
              'android:name': 'android.support.FILE_PROVIDER_PATHS',
              'android:resource': '@xml/file_paths',
            },
          },
        ],
      });

      console.log('✅ FileProvider agregado al AndroidManifest.xml');
    }

    return config;
  });

  // Paso 2: Crear el archivo file_paths.xml
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformProjectRoot = config.modRequest.platformProjectRoot;
      
      // Usar platformProjectRoot si está disponible (más confiable en EAS Build)
      const androidPath = platformProjectRoot || path.join(projectRoot, 'android');
      const xmlDir = path.join(androidPath, 'app', 'src', 'main', 'res', 'xml');
      const filePathsPath = path.join(xmlDir, 'file_paths.xml');

      // Crear directorio xml si no existe
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
        console.log('✅ Directorio xml creado en:', xmlDir);
      }

      // Contenido del archivo file_paths.xml
      const filePathsContent = `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permite acceso a almacenamiento externo completo -->
    <external-path name="external_storage" path="." />
    
    <!-- Permite acceso a archivos internos de la app -->
    <files-path name="internal_files" path="." />
    
    <!-- Permite acceso al directorio de caché -->
    <cache-path name="cache" path="." />
    
    <!-- Permite acceso a archivos externos de la app -->
    <external-files-path name="external_files" path="." />
    
    <!-- Permite acceso al caché externo -->
    <external-cache-path name="external_cache" path="." />
    
    <!-- Permite acceso a la raíz del sistema (requiere permisos especiales) -->
    <root-path name="root" path="." />
</paths>`;

      // Escribir o actualizar el archivo
      try {
        fs.writeFileSync(filePathsPath, filePathsContent, 'utf-8');
        console.log('✅ Archivo file_paths.xml creado exitosamente');
      } catch (error) {
        console.error('❌ Error al crear file_paths.xml:', error);
        throw error;
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withAndroidFileProvider;
