# 📐 Arquitectura y Patrones de Diseño del Proyecto

## 🏗️ Arquitectura General

El proyecto implementa una **arquitectura basada en componentes** con **React Native** y **Expo**, siguiendo principios de **separación de responsabilidades** y **modularidad**.

```
practica-3/
├── app/                    # Pantallas y navegación (Presentation Layer)
├── components/             # Componentes reutilizables (UI Layer)
├── contexts/              # Estado global (State Management)
├── utils/                 # Lógica de negocio (Business Logic)
├── types/                 # Definiciones de tipos (Domain Models)
└── assets/                # Recursos estáticos
```

---

## 🎯 Patrones de Diseño Implementados

### 1. **Context API Pattern (Estado Global)**

**Ubicación:** [`contexts/file-system-context.tsx`](contexts/file-system-context.tsx)

**Descripción:** Patrón de gestión de estado centralizado que proporciona el estado del sistema de archivos a toda la aplicación.

**Implementación:**
```typescript
// Creación del contexto
const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

// Provider que encapsula la lógica
export function FileSystemProvider({ children }: { children: React.ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  // ... más estado
  
  return (
    <FileSystemContext.Provider value={{ /* estado y métodos */ }}>
      {children}
    </FileSystemContext.Provider>
  );
}

// Hook personalizado para consumir el contexto
export function useFileSystem() {
  const context = useContext(FileSystemContext);
  if (context === undefined) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
}
```

**Beneficios:**
- ✅ Estado centralizado y predecible
- ✅ Evita prop drilling
- ✅ Fácil acceso desde cualquier componente
- ✅ Separación clara entre lógica y presentación

---

### 2. **Custom Hooks Pattern**

**Ubicación:** [`contexts/file-system-context.tsx`](contexts/file-system-context.tsx)

**Descripción:** Encapsulación de lógica reutilizable en hooks personalizados.

**Implementación:**
```typescript
// Hook personalizado que expone toda la funcionalidad del sistema de archivos
export function useFileSystem() {
  const context = useContext(FileSystemContext);
  // Validación y retorno del contexto
  return context;
}
```

**Uso en componentes:**
```typescript
function FileBrowser() {
  const { files, loadFiles, navigateTo, deleteItem } = useFileSystem();
  // Uso directo de la funcionalidad
}
```

**Beneficios:**
- ✅ Lógica reutilizable
- ✅ Código más limpio
- ✅ Testeable independientemente
- ✅ Abstracción de complejidad

---

### 3. **Repository Pattern (Abstracción de Datos)**

**Ubicación:** [`contexts/file-system-context.tsx`](contexts/file-system-context.tsx)

**Descripción:** Abstracción de la capa de acceso a datos del sistema de archivos.

**Implementación:**
```typescript
// Funciones que abstraen el acceso al sistema de archivos
const loadFiles = async (path?: string) => {
  // Lógica de acceso a datos
  const directory = await Paths.get(targetPath);
  const items = await directory.list();
  // Transformación y retorno de datos
};

const deleteItem = async (item: FileItem) => {
  // Lógica de eliminación
  if (item.isDirectory) {
    await Paths.get(item.uri).delete({ idempotent: true });
  } else {
    await Paths.get(item.uri).delete();
  }
};
```

**Beneficios:**
- ✅ Abstracción de la fuente de datos
- ✅ Fácil cambio de implementación
- ✅ Código más mantenible
- ✅ Lógica de negocio separada

---

### 4. **Strategy Pattern (Gestión de Tipos de Archivo)**

**Ubicación:** [`utils/file-utils.ts`](utils/file-utils.ts)

**Descripción:** Define estrategias diferentes para manejar distintos tipos de archivos.

**Implementación:**
```typescript
// Estrategia para determinar el tipo de archivo
export const getFileType = (fileName: string, isDirectory: boolean): FileType => {
  if (isDirectory) return 'folder';
  
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'video';
  if (audioExtensions.includes(extension)) return 'audio';
  if (documentExtensions.includes(extension)) return 'document';
  // ... más estrategias
  
  return 'unknown';
};

// Estrategias específicas por tipo
export const isImageFile = (item: FileItem): boolean => {
  return item.type === 'image';
};

export const isTextFile = (item: FileItem): boolean => {
  return item.type === 'text';
};
```

**Beneficios:**
- ✅ Lógica organizada por tipo
- ✅ Fácil agregar nuevos tipos
- ✅ Código más legible
- ✅ Extensible

---

### 5. **Factory Pattern (Creación de Breadcrumbs)**

**Ubicación:** [`utils/file-utils.ts`](utils/file-utils.ts)

**Descripción:** Crea objetos de breadcrumb de manera centralizada.

**Implementación:**
```typescript
export const getBreadcrumbs = (currentPath: string): Breadcrumb[] => {
  const HOME_PATH = '/storage/emulated/0';
  
  // Factory que crea breadcrumb de home
  const homeBreadcrumb: Breadcrumb = {
    label: '🏠 0',
    path: HOME_PATH,
  };

  // Factory que crea breadcrumbs de rutas
  const pathBreadcrumbs: Breadcrumb[] = segments.map((segment, index) => ({
    label: segment,
    path: `${HOME_PATH}/${segments.slice(0, index + 1).join('/')}`,
  }));

  return [homeBreadcrumb, ...pathBreadcrumbs];
};
```

**Beneficios:**
- ✅ Creación centralizada de objetos
- ✅ Lógica consistente
- ✅ Fácil modificación

---

### 6. **Observer Pattern (React State)**

**Descripción:** React implementa este patrón nativamente con `useState` y `useEffect`.

**Implementación:**
```typescript
// En el contexto
const [files, setFiles] = useState<FileItem[]>([]);

// Los componentes observan cambios
useEffect(() => {
  loadFiles();
}, [currentPath]); // Se ejecuta cuando currentPath cambia

// En los componentes
function FileBrowser() {
  const { files } = useFileSystem(); // Observa cambios en files
  
  return (
    <FlatList
      data={files} // Se re-renderiza automáticamente cuando files cambia
      // ...
    />
  );
}
```

**Beneficios:**
- ✅ Actualización automática de UI
- ✅ Reactividad
- ✅ Código declarativo

---

### 7. **Adapter Pattern (Integración con APIs Nativas)**

**Ubicación:** [`contexts/file-system-context.tsx`](contexts/file-system-context.tsx), [`app/screens/file-browser.tsx`](app/screens/file-browser.tsx)

**Descripción:** Adapta diferentes APIs nativas (expo-file-system, expo-intent-launcher) a una interfaz común.

**Implementación:**
```typescript
// Adaptador para abrir archivos con aplicaciones externas
const handleOpenWith = async (item: FileItem) => {
  try {
    // Adapta la API de IntentLauncher a nuestra interfaz
    const contentUri = await FileSystem.getContentUriAsync(item.uri);
    const mimeType = getMimeType(item.name);
    
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      type: mimeType,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    });
  } catch (error) {
    Alert.alert('Error', 'No se pudo abrir el archivo');
  }
};

// Adaptador para el sistema de permisos
const requestPermissions = async () => {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permiso denegado');
    return false;
  }
  return true;
};
```

**Beneficios:**
- ✅ Abstracción de APIs complejas
- ✅ Código más portable
- ✅ Fácil testing con mocks

---

### 8. **Singleton Pattern (Contexto Global)**

**Descripción:** El contexto actúa como un singleton, asegurando una única instancia del estado.

**Implementación:**
```typescript
// _layout.tsx - Instancia única del provider
export default function RootLayout() {
  return (
    <FileSystemProvider> {/* Única instancia */}
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="screens/file-browser" />
      </Stack>
    </FileSystemProvider>
  );
}
```

**Beneficios:**
- ✅ Estado único y consistente
- ✅ Evita duplicación de estado
- ✅ Punto único de verdad

---

## 📦 Descripción por Bloques del Proyecto

### **Bloque 1: Capa de Presentación (UI Layer)**

**Ubicación:** `app/` y `components/`

**Responsabilidad:** Renderizar la interfaz y capturar eventos del usuario.

**Componentes principales:**

#### 1.1 **Pantallas (Screens)**
```typescript
// app/screens/file-browser.tsx
function FileBrowser() {
  const { files, loadFiles, navigateTo } = useFileSystem();
  
  return (
    <SafeAreaView>
      <BreadcrumbNavigation />  {/* Navegación */}
      <ViewToggle />             {/* Cambio de vista */}
      {viewMode === 'list' ? (
        <FileListView />         {/* Vista lista */}
      ) : (
        <FileGridView />         {/* Vista grid */}
      )}
    </SafeAreaView>
  );
}
```

**Características:**
- ✅ Componentes presentacionales puros
- ✅ No contienen lógica de negocio
- ✅ Consumen datos del contexto
- ✅ Emiten eventos (clicks, gestos)

#### 1.2 **Componentes Reutilizables**
```
components/
├── file-list-view.tsx      # Vista en lista
├── file-grid-view.tsx      # Vista en cuadrícula
├── file-item.tsx           # Item individual
├── breadcrumb-navigation.tsx  # Navegación por migas
└── view-toggle.tsx         # Botón para cambiar vista
```

**Patrón:** Composición de componentes

---

### **Bloque 2: Capa de Estado (State Management)**

**Ubicación:** `contexts/file-system-context.tsx`

**Responsabilidad:** Gestionar el estado global de la aplicación.

**Estado gestionado:**
```typescript
interface FileSystemContextType {
  // Estado
  currentPath: string;              // Ruta actual
  files: FileItem[];                // Archivos visibles
  loading: boolean;                 // Estado de carga
  selectedFiles: FileItem[];        // Archivos seleccionados
  
  // Acciones de navegación
  loadFiles: (path?: string) => Promise<void>;
  navigateTo: (path: string) => void;
  navigateBack: () => void;
  
  // Acciones de archivos
  createFolder: (name: string) => Promise<void>;
  deleteItem: (item: FileItem) => Promise<void>;
  renameItem: (item: FileItem, newName: string) => Promise<void>;
  copyItem: (item: FileItem, destinationPath: string) => Promise<void>;
  moveItem: (item: FileItem, destinationPath: string) => Promise<void>;
  
  // Selección múltiple
  toggleSelection: (item: FileItem) => void;
  clearSelection: () => void;
}
```

**Flujo de datos:**
```
Usuario interactúa → Componente llama función del contexto
                  ↓
         Contexto actualiza estado
                  ↓
      Componentes se re-renderizan automáticamente
```

---

### **Bloque 3: Capa de Lógica de Negocio (Business Logic)**

**Ubicación:** `utils/file-utils.ts`

**Responsabilidad:** Lógica pura, sin dependencias de UI o estado.

**Funciones principales:**

#### 3.1 **Gestión de Tipos de Archivo**
```typescript
// Determinar tipo de archivo
getFileType(fileName: string, isDirectory: boolean): FileType

// Validadores específicos
isImageFile(item: FileItem): boolean
isTextFile(item: FileItem): boolean
isVideoFile(item: FileItem): boolean

// Obtener tipo MIME
getMimeType(fileName: string): string
```

#### 3.2 **Navegación y Breadcrumbs**
```typescript
// Generar breadcrumbs
getBreadcrumbs(currentPath: string): Breadcrumb[]

// Validar rutas
isAccessiblePath(path: string): boolean
```

#### 3.3 **Ordenamiento**
```typescript
// Ordenar archivos (carpetas primero, luego alfabético)
sortFiles(files: FileItem[]): FileItem[]
```

**Características:**
- ✅ Funciones puras (sin side effects)
- ✅ Fácilmente testeable
- ✅ Reutilizable
- ✅ Independiente del framework

---

### **Bloque 4: Capa de Dominio (Domain Models)**

**Ubicación:** `types/file-system.ts`

**Responsabilidad:** Definir los modelos de datos de la aplicación.

**Tipos principales:**
```typescript
// Tipos de archivo soportados
export type FileType = 
  | 'folder' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'document' 
  | 'text' 
  | 'archive' 
  | 'apk' 
  | 'unknown';

// Modelo de archivo
export interface FileItem {
  name: string;
  path: string;
  uri: string;
  isDirectory: boolean;
  size?: number;
  modificationTime?: number;
  type: FileType;  // Tipo determinado por getFileType()
}

// Modelo de breadcrumb
export interface Breadcrumb {
  label: string;
  path: string;
}

// Interfaz del contexto
export interface FileSystemContextType {
  // ... (definido arriba)
}
```

**Beneficios:**
- ✅ Type safety con TypeScript
- ✅ Autocompletado en el IDE
- ✅ Documentación implícita
- ✅ Prevención de errores en tiempo de compilación

---

### **Bloque 5: Capa de Integración (Platform Integration)**

**Ubicación:** Distribuida en contextos y pantallas

**Responsabilidad:** Integrar con APIs nativas de Android/iOS.

**APIs utilizadas:**

#### 5.1 **Sistema de Archivos (expo-file-system)**
```typescript
import * as FileSystem from 'expo-file-system';
import { Paths, Directory, File } from 'expo-file-system/next';

// Acceso a directorios
const directory = await Paths.get(targetPath);
const items = await directory.list();

// Operaciones de archivos
await Paths.get(uri).delete();
await Paths.get(uri).copy(destination);
await Paths.get(uri).move(destination);
```

#### 5.2 **Intents de Android (expo-intent-launcher)**
```typescript
import * as IntentLauncher from 'expo-intent-launcher';

// Abrir archivo con app externa
const contentUri = await FileSystem.getContentUriAsync(item.uri);
await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
  data: contentUri,
  type: mimeType,
  flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
});
```

#### 5.3 **Permisos (expo-media-library)**
```typescript
import * as MediaLibrary from 'expo-media-library';

// Solicitar permisos
const { status } = await MediaLibrary.requestPermissionsAsync();
```

#### 5.4 **Alertas Nativas**
```typescript
import { Alert, Platform } from 'react-native';

// Alertas solo en móvil
if (Platform.OS !== 'web') {
  Alert.alert('Título', 'Mensaje');
}
```

---

## 🔄 Flujo de Datos Completo

### **Ejemplo: Usuario navega a una carpeta**

```
1. Usuario toca una carpeta en FileListView
   ↓
2. FileListView llama: navigateTo(folder.path)
   ↓
3. FileSystemContext valida permisos con isAccessiblePath()
   ↓
4. Si tiene permisos:
   - Actualiza currentPath
   - Llama loadFiles(newPath)
   ↓
5. loadFiles():
   - Usa Paths.get() para acceder al sistema de archivos
   - Obtiene lista de archivos
   - Transforma datos con getFileType()
   - Ordena con sortFiles()
   - Actualiza estado: setFiles()
   ↓
6. React detecta cambio en files
   ↓
7. Componentes se re-renderizan automáticamente
   ↓
8. Usuario ve la nueva lista de archivos
```

---

## 🎨 Principios de Diseño Aplicados

### **1. Separation of Concerns (SoC)**
- Cada capa tiene una responsabilidad específica
- UI separada de lógica de negocio
- Estado separado de presentación

### **2. Single Responsibility Principle (SRP)**
- Cada función/componente hace una sola cosa
- `getFileType()` solo determina tipos
- `loadFiles()` solo carga archivos

### **3. Don't Repeat Yourself (DRY)**
- Lógica reutilizable en `utils/`
- Componentes reutilizables en `components/`
- Tipos compartidos en `types/`

### **4. Dependency Inversion**
- Componentes dependen de abstracciones (contexto)
- No dependen directamente de expo-file-system

### **5. Open/Closed Principle**
- Fácil agregar nuevos tipos de archivo sin modificar código existente
- Solo agregar a las listas de extensiones

---

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    UI LAYER (app/)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ FileBrowser  │  │ ImageViewer  │  │  TextEditor  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └─────────────────┴──────────────────┘          │
│                           │                             │
└───────────────────────────┼─────────────────────────────┘
                            │ useFileSystem()
┌───────────────────────────┼─────────────────────────────┐
│              STATE MANAGEMENT LAYER (contexts/)         │
│         ┌──────────────────▼───────────────────┐        │
│         │  FileSystemContext (Singleton)       │        │
│         │  - currentPath                       │        │
│         │  - files[]                           │        │
│         │  - loading                           │        │
│         │  - selectedFiles[]                   │        │
│         └──────────────────┬───────────────────┘        │
└────────────────────────────┼────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼─────────┐  ┌───────▼─────────┐  ┌─────▼────────┐
│ BUSINESS LOGIC  │  │  DOMAIN MODELS  │  │  PLATFORM    │
│   (utils/)      │  │    (types/)     │  │ INTEGRATION  │
│                 │  │                 │  │              │
│ • getFileType() │  │ • FileItem      │  │ • FileSystem │
│ • sortFiles()   │  │ • FileType      │  │ • IntentLaun │
│ • getBreadcrumbs│  │ • Breadcrumb    │  │ • MediaLib   │
└─────────────────┘  └─────────────────┘  └──────────────┘
```

---

## 🚀 Ventajas de esta Arquitectura

✅ **Mantenibilidad:** Código organizado y fácil de entender
✅ **Escalabilidad:** Fácil agregar nuevas funcionalidades
✅ **Testabilidad:** Cada capa se puede testear independientemente
✅ **Reutilización:** Componentes y utilidades reutilizables
✅ **Type Safety:** TypeScript previene errores
✅ **Performance:** Context API optimizado con React
✅ **Separación de responsabilidades:** Cada módulo tiene un propósito claro

---

## 📚 Conclusión

Este proyecto implementa una arquitectura sólida basada en:
- **Patrones de diseño probados** (Context, Repository, Strategy, Factory, etc.)
- **Principios SOLID**
- **Separación clara de capas**
- **Type safety con TypeScript**
- **Integración limpia con APIs nativas**

La arquitectura permite que el proyecto sea:
- **Mantenible:** Fácil de entender y modificar
- **Escalable:** Fácil agregar nuevas features
- **Testeable:** Cada parte se puede testear independientemente
- **Performante:** Optimizado con React y Context API

---

*Documento generado el 10 de octubre de 2025*