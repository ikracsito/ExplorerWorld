# WorldExplorer - Explorador de Países 🌎

Una aplicación web moderna que te permite explorar información detallada sobre todos los países del mundo. Construida con Vue 3, TypeScript, Tailwind CSS y AG Grid. 

##  Características Principales

- **Información Completa**: Datos detallados de todos los países, incluyendo:
  - Población
  - Capital
  - Región
  - Idiomas
  - Monedas
  - Y mucho más...

-  **Múltiples Vistas**:
  - Vista de Cuadrícula (Grid)
  - Vista de Lista
  - Vista de Tabla
  - Panel de Control con Estadísticas

- 🌤️ **Información en Tiempo Real**:
  - Clima actual en las capitales
  - Hora local de cada país
  - Distancia desde tu ubicación

-  **Características Adicionales**:
  - 🌓 Modo oscuro/claro
  - 💾 Sistema de favoritos
  - 🔄 Comparación entre países
  - 📊 Estadísticas interactivas
  - 🗺️ Mapas integrados
  - 📱 Diseño responsive para todos los dispositivos

## 🚀 Requisitos Previos

Para ejecutar este proyecto necesitarás:

- Node.js (versión 14 o superior)
- npm (viene con Node.js) o yarn
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet (para las APIs de clima y mapas)

## Instalación

### 1️ Clonar el Repositorio

Tienes tres opciones:

a) **Usando Git** (si lo tienes instalado):
```bash
git clone <url-del-repositorio>
cd WorldExplorer
```

b) **Descarga directa**:
- Ve a la página principal del repositorio
- Haz clic en el botón verde "Code"
- Selecciona "Download ZIP"
- Descomprime el archivo en tu computadora

c) **GitHub Desktop**:
- Abre GitHub Desktop
- Ve a File -> Clone Repository
- Selecciona este repositorio
- Elige una ubicación en tu computadora

### 2️⃣ Instalar Dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
# Si usas npm:
npm install

# Si usas yarn:
yarn install
```

### 3️⃣ Configurar Variables de Entorno

1. Crea un archivo llamado `.env` en la raíz del proyecto
2. Copia el siguiente contenido:
```env
VITE_OPENWEATHER_API_KEY=tu_clave_de_openweather
VITE_TIMEZONE_API_KEY=tu_clave_de_timezone
```
3. Reemplaza los valores con tus propias claves API:
   - Obtén tu clave de OpenWeather en: https://openweathermap.org/api
   - Obtén tu clave de TimezoneDB en: https://timezonedb.com/

### 4️⃣ Iniciar el Proyecto

```bash
# Usando npm:
npm run dev

# Usando yarn:
yarn dev
```

La aplicación estará disponible en: http://localhost:5173

## 🛠 Comandos Disponibles

```bash
# Iniciar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar la versión de producción
npm run preview
```

## Uso de la Aplicación

### Navegación
- Usa la barra superior para cambiar entre diferentes vistas
- El botón de modo oscuro está en la esquina superior derecha
- Utiliza la barra de búsqueda para encontrar países
- Filtra por región usando el menú desplegable

### Funciones Principales
1. **Búsqueda de Países**:
   - Escribe en la barra de búsqueda
   - Los resultados se actualizan automáticamente

2. **Favoritos**:
   - Haz clic en la estrella para agregar/quitar de favoritos
   - Los favoritos se guardan automáticamente

3. **Comparación**:
   - Selecciona hasta 3 países para comparar
   - Haz clic en el botón "Comparar" para ver detalles

4. **Detalles del País**:
   - Haz clic en cualquier país para ver información detallada
   - Navega entre las pestañas para ver diferentes datos

## 🔧 Solución de Problemas Comunes

### La aplicación no carga
1. Verifica tu conexión a internet
2. Asegúrate de que todas las dependencias están instaladas
3. Comprueba que las claves API en `.env` son correctas

### No se muestra el clima
1. Verifica tu clave de OpenWeather
2. Asegúrate de tener conexión a internet
3. Comprueba la consola del navegador para ver errores

### Problemas con la geolocalización
1. Permite el acceso a la ubicación en tu navegador
2. Actualiza la página después de dar permisos

##  Contribuir al Proyecto

¿Quieres contribuir? ¡Excelente! Aquí te explicamos cómo:

1. Haz un "Fork" del repositorio
2. Crea una rama para tu función: `git checkout -b nueva-funcion`
3. Haz tus cambios y commitea: `git commit -m 'Agrega nueva función'`
4. Sube tus cambios: `git push origin nueva-funcion`
5. Crea un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE.md](LICENSE.md) para detalles


## Agradecimientos

- [REST Countries API](https://restcountries.com/) por los datos de países
- [OpenWeather](https://openweathermap.org/) por la información del clima
- [TimezoneDB](https://timezonedb.com/) por los datos de zonas horarias
- [OpenStreetMap](https://www.openstreetmap.org/) por los mapas

---
