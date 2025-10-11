# Cambios en el Sistema de Archivos - Directorio Home

## Resumen de Cambios

Se ha modificado el contexto del explorador de archivos para que funcione con el directorio **home** del almacenamiento interno de Android (`/storage/emulated/0/`), donde se encuentran las carpetas comunes del sistema como:

- 📥 Download
- 📄 Documents
- 📷 DCIM (fotos de cámara)
- 🖼️ Pictures
- 🎵 Music
- 🎬 Movies
- Y otras carpetas del usuario

## Cambios Principales

### 1. **Nuevo Directorio de Inicio**
```typescript
const getHomeDirectory = (): string => {
  if (Platform.OS === 'android') {
    return 'file:///storage/emulated/0/';
  }
  return Paths.document.uri; // Para otras plataformas
};
```

- **Android**: Inicia en `/storage/emulated/0/` (almacenamiento interno)
- **Otras plataformas**: Usa el directorio de documentos de la app

### 2. **Control de Acceso Mejorado**

#### Función `isAccessiblePath()` actualizada:
- ✅ Permite navegación dentro de `/storage/emulated/0/` y sus subdirectorios
- ❌ Bloquea navegación fuera del directorio home
- ❌ Previene uso de `../` para salir del directorio permitido
- ❌ Valida que los paths absolutos estén dentro del home

### 3. **Navegación Restringida**

#### `navigateBack()` mejorado:
- Detecta cuando se está en el directorio raíz (home)
- Muestra mensaje apropiado: "Ya está en el directorio raíz"
- No permite retroceder más allá del directorio home
- Alerta al usuario si intenta navegar fuera del área permitida

### 4. **Permisos de Android Actualizados**

Se solicitan los permisos apropiados según la versión de Android:

- **Android 13+ (API 33+)**: Permisos específicos por tipo de medio
  - READ_MEDIA_IMAGES
  - READ_MEDIA_VIDEO
  - READ_MEDIA_AUDIO

- **Android 11-12 (API 30-32)**: Permisos de almacenamiento
  - READ_EXTERNAL_STORAGE
  - WRITE_EXTERNAL_STORAGE

- **Android 10 y anteriores**: Permisos tradicionales de almacenamiento

### 5. **Mensajes de Error Mejorados**

Todos los mensajes de error ahora son específicos según el contexto:
- Indican claramente que solo se puede navegar dentro del "almacenamiento interno (home)"
- Alertas nativas en Android/iOS para mejor UX
- Mensajes diferenciados por plataforma

## Estructura del Directorio Home en Android

```
/storage/emulated/0/  (HOME)
├── Download/         ← Descargas
├── Documents/        ← Documentos
├── DCIM/            ← Fotos de cámara
├── Pictures/        ← Imágenes
├── Music/           ← Música
├── Movies/          ← Videos
├── Podcasts/        ← Podcasts
├── Ringtones/       ← Tonos
├── Alarms/          ← Alarmas
├── Notifications/   ← Notificaciones
├── Android/         ← Datos de apps
└── ...              ← Otras carpetas del usuario
```

## Beneficios

✅ **Acceso Completo al Almacenamiento**: El usuario puede ver y gestionar todas sus carpetas personales  
✅ **Seguridad**: No puede salir del directorio home del almacenamiento interno  
✅ **UX Familiar**: Navega por las carpetas que ve en su administrador de archivos nativo  
✅ **Compatible con Android Moderno**: Funciona con Scoped Storage (Android 11+)  
✅ **Permisos Apropiados**: Solicita los permisos necesarios según la versión de Android  
✅ **Prevención de Errores**: Validación proactiva antes de cada operación  

## Comportamiento

### Al Iniciar la App
1. La app inicia en `/storage/emulated/0/`
2. Muestra las carpetas: Download, Documents, DCIM, etc.
3. Solicita permisos de almacenamiento si es necesario

### Al Navegar
1. Se puede entrar a cualquier carpeta dentro del home
2. Se puede retroceder hasta el directorio home
3. No se puede salir del directorio home (muestra alerta)
4. Los intentos de usar `../` son bloqueados

### Operaciones de Archivos
- ✅ Crear carpetas dentro del home
- ✅ Eliminar archivos/carpetas dentro del home
- ✅ Renombrar elementos dentro del home
- ✅ Copiar/mover entre ubicaciones dentro del home
- ❌ Cualquier operación fuera del home es bloqueada con alerta

## Notas Técnicas

### Android 11+ (API 30+)
- Usa **Scoped Storage** por defecto
- Acceso completo a `/storage/emulated/0/` con los permisos adecuados
- Algunas carpetas del sistema pueden estar protegidas

### Android 13+ (API 33+)
- Permisos más granulares por tipo de medio
- Puede requerir permisos adicionales para ciertos tipos de archivos
- La app maneja estos permisos automáticamente

## Testing

Para probar los cambios:
1. Instalar la app en Android
2. Verificar que inicia en el directorio home
3. Navegar a Download, Documents, etc.
4. Intentar retroceder desde el home (debe mostrar alerta)
5. Crear/eliminar/renombrar archivos en diferentes carpetas
6. Verificar que todas las operaciones funcionan correctamente

## Compatibilidad

- ✅ Android 10+ (API 29+)
- ✅ Funciona con Scoped Storage
- ✅ Compatible con permisos granulares de Android 13+
- ⚠️ En iOS/Web usa el directorio de documentos de la app (comportamiento diferente)
