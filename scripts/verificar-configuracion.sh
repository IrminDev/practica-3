#!/bin/bash

# Script para verificar la configuración del explorador de archivos

echo "🔍 Verificando la configuración del explorador de archivos..."
echo ""

# Verificar que el archivo existe
if [ -f "contexts/file-system-context.tsx" ]; then
    echo "✅ Archivo encontrado: contexts/file-system-context.tsx"
else
    echo "❌ ERROR: No se encuentra el archivo contexts/file-system-context.tsx"
    exit 1
fi

# Verificar que contiene la ruta del directorio home
if grep -q "file:///storage/emulated/0/" contexts/file-system-context.tsx; then
    echo "✅ Directorio home configurado: /storage/emulated/0/"
else
    echo "❌ ERROR: No se encontró la configuración del directorio home"
    exit 1
fi

# Verificar que existe la función isAccessiblePath
if grep -q "isAccessiblePath" contexts/file-system-context.tsx; then
    echo "✅ Función de validación de acceso implementada"
else
    echo "❌ ERROR: No se encontró la función isAccessiblePath"
    exit 1
fi

# Verificar que existe la función getHomeDirectory
if grep -q "getHomeDirectory" contexts/file-system-context.tsx; then
    echo "✅ Función getHomeDirectory implementada"
else
    echo "❌ ERROR: No se encontró la función getHomeDirectory"
    exit 1
fi

# Verificar permisos de Android
if grep -q "READ_EXTERNAL_STORAGE" contexts/file-system-context.tsx; then
    echo "✅ Permisos de almacenamiento configurados"
else
    echo "❌ ERROR: No se encontraron configuraciones de permisos"
    exit 1
fi

echo ""
echo "🎉 Todas las verificaciones pasaron exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Ejecutar: npm install (si es necesario)"
echo "   2. Ejecutar: npx expo start"
echo "   3. Probar en un dispositivo Android o emulador"
echo "   4. Verificar que la app inicie en /storage/emulated/0/"
echo "   5. Navegar por las carpetas (Download, Documents, etc.)"
echo "   6. Intentar retroceder desde el directorio home"
echo ""
echo "📖 Documentación: Ver CAMBIOS_DIRECTORIO_HOME.md"
