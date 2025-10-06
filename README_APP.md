# Explorador de Archivos - IPN/ESCOM

Aplicación de explorador de archivos desarrollada con React Native y Expo para Android.

## Características Principales

### 1. Exploración de Archivos
- ✅ Explorar directorios del almacenamiento interno
- ✅ Visualizar estructura jerárquica de carpetas y archivos
- ✅ Mostrar información detallada: nombre, tamaño, fecha de modificación, tipo
- ✅ Navegación intuitiva con breadcrumbs
- ✅ Vista de lista y cuadrícula

### 2. Visualización de Archivos
- ✅ Visor de archivos de texto (.txt, .md, .log, .json, .xml)
- ✅ Visor de imágenes con zoom, desplazamiento y rotación
- ✅ Abrir archivos con otras aplicaciones mediante intents

### 3. Gestión de Archivos
- ✅ Crear carpetas
- ✅ Renombrar archivos y carpetas
- ✅ Eliminar archivos y carpetas
- ✅ Compartir archivos
- ⚠️ Copiar y mover (implementados, requiere pruebas adicionales)

### 4. Interfaz de Usuario
- ✅ Tema Guinda (IPN: #6B2E5F)
- ✅ Tema Azul (ESCOM: #003D6D)
- ✅ Adaptación automática a modo claro/oscuro del sistema
- ✅ Diseño responsivo
- ✅ Iconos diferenciados por tipo de archivo

### 5. Almacenamiento Local
- ✅ Historial de archivos recientes
- ✅ Sistema de favoritos
- ✅ Configuración persistente (tema y modo de vista)

### 6. Permisos y Seguridad
- ✅ Gestión de permisos según versión de Android
- ✅ Soporte para Android 10+ (Scoped Storage)
- ✅ Manejo de errores y excepciones

## Instalación

### Prerrequisitos
- Node.js 18 o superior
- npm o yarn
- Expo CLI
- Android Studio (para emulador) o dispositivo Android físico

### Pasos de Instalación

1. Clonar o descargar el repositorio

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar la aplicación:
```bash
npx expo start
```

4. Ejecutar en Android:
- Presiona `a` para abrir en Android
- O escanea el código QR con la app Expo Go

## Librerías Utilizadas

- **expo-file-system**: Acceso al sistema de archivos
- **expo-document-picker**: Selector de documentos
- **expo-sharing**: Compartir archivos
- **expo-intent-launcher**: Abrir archivos con otras apps (Android)
- **expo-image-manipulator**: Manipulación de imágenes
- **@react-native-async-storage/async-storage**: Almacenamiento local
- **react-native-gesture-handler**: Gestos táctiles
- **react-native-reanimated**: Animaciones
- **expo-haptics**: Retroalimentación háptica
- **@expo/vector-icons**: Iconos

## Estructura del Proyecto

```
practica-3/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Layout de tabs
│   │   ├── index.tsx             # Tab explorador
│   │   └── explore.tsx           # Tab historial
│   ├── screens/
│   │   ├── file-browser.tsx      # Pantalla principal de exploración
│   │   ├── history.tsx           # Pantalla de historial y favoritos
│   │   └── settings.tsx          # Pantalla de configuración
│   └── _layout.tsx               # Layout raíz
├── components/
│   ├── file-browser/
│   │   ├── breadcrumbs.tsx       # Navegación de ruta
│   │   ├── file-list-item.tsx    # Item de lista
│   │   └── file-grid-item.tsx    # Item de cuadrícula
│   ├── modals/
│   │   ├── action-modal.tsx      # Modal para acciones
│   │   └── file-actions-menu.tsx # Menú de acciones de archivo
│   └── viewers/
│       ├── text-viewer.tsx       # Visor de texto
│       └── image-viewer.tsx      # Visor de imágenes
├── contexts/
│   ├── theme-context.tsx         # Contexto de tema
│   └── file-system-context.tsx   # Contexto de sistema de archivos
├── types/
│   └── file-system.ts            # Tipos TypeScript
├── utils/
│   ├── file-utils.ts             # Utilidades de archivos
│   └── storage.ts                # Gestión de almacenamiento local
└── constants/
    └── colors.ts                 # Definición de colores de temas
```

## Uso

### Explorar Archivos
1. La aplicación inicia en el directorio de documentos
2. Toca una carpeta para abrirla
3. Toca un archivo para abrirlo
4. Usa el botón de retroceso para volver

### Cambiar Vista
- Toca el ícono de lista/cuadrícula en la parte superior para cambiar entre vistas

### Acciones de Archivos
- **Mantén presionado** un archivo o carpeta para ver las opciones disponibles:
  - Agregar/quitar de favoritos
  - Compartir
  - Abrir con otra aplicación
  - Renombrar
  - Eliminar

### Crear Carpeta
- Toca el ícono de carpeta en la parte superior
- Ingresa el nombre de la carpeta
- Confirma

### Cambiar Tema
1. Ve a la pestaña de historial
2. Desliza hacia abajo para ver la pantalla de configuración (o accede desde el menú)
3. Selecciona entre Tema IPN (Guinda) o Tema ESCOM (Azul)

## Limitaciones Conocidas

⚠️ **Nota sobre expo-file-system**: La aplicación fue desarrollada con la versión más reciente de expo-file-system (v19), que tiene una API completamente rediseñada. Algunos ajustes pueden ser necesarios para asegurar la compatibilidad completa.

### Problemas Potenciales:
1. La nueva API de expo-file-system usa clases (`Directory`, `File`, `Paths`) en lugar de funciones asíncronas
2. Algunas propiedades como tamaño y fecha de modificación pueden no estar disponibles en todos los archivos
3. El acceso a almacenamiento externo requiere permisos específicos de Android

### Soluciones Sugeridas:
- Para producción, considerar usar una versión anterior de expo-file-system (v17 o v18)
- O actualizar completamente la implementación para usar la nueva API de clases
- Implementar manejo de permisos más robusto para Android 11+

## Permisos de Android

La aplicación solicita los siguientes permisos:
- `READ_EXTERNAL_STORAGE` (Android < 13)
- `WRITE_EXTERNAL_STORAGE` (Android < 13)
- `READ_MEDIA_IMAGES` (Android 13+)
- `READ_MEDIA_VIDEO` (Android 13+)
- `READ_MEDIA_AUDIO` (Android 13+)

## Desarrollo

### Errores de Compilación
Si encuentras errores de TypeScript relacionados con expo-file-system, puedes:

1. Ignorar temporalmente los errores de tipo:
```bash
npx expo start --no-check
```

2. O actualizar las importaciones para usar la API correcta de expo-file-system v19

### Debug
```bash
npx expo start --dev-client
```

## Créditos

Desarrollado para IPN / ESCOM
- Tema Guinda IPN: #6B2E5F
- Tema Azul ESCOM: #003D6D

## Licencia

Este proyecto es para fines educativos.
