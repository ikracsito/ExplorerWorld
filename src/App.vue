<script setup lang="ts">
import { ref, onMounted, computed, watch, Transition } from 'vue'
import axios from 'axios'
import CountriesTable from './components/CountriesTable.vue'
import Dashboard from './components/Dashboard.vue'
import CountriesAgGrid from './components/CountriesAgGrid.vue'
import { config } from './config'

// Add type declarations for components
declare module './components/CountriesTable.vue' {
  const CountriesTable: any
  export default CountriesTable
}

declare module './components/Dashboard.vue' {
  const Dashboard: any
  export default Dashboard
}

declare module './components/CountriesAgGrid.vue' {
  const CountriesAgGrid: any
  export default CountriesAgGrid
}

interface Country {
  name: { common: string; official: string }
  capital: string[]
  population: number
  region: string
  subregion: string
  flags: { png: string }
  languages: Record<string, string>
  currencies: Record<string, { name: string; symbol: string }>
  area: number
  cca2: string
  latlng: number[]
}

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
}

// View state
const isGridView = ref(true)
const isTableView = ref(false)
const isDashboardView = ref(false)

// Computed property for current view
const currentView = computed(() => {
  if (isDashboardView.value) return 'dashboard'
  if (isTableView.value) return 'table'
  return isGridView.value ? 'grid' : 'list'
})

// Toggle view function
const toggleView = (view: 'dashboard' | 'table' | 'grid' | 'list') => {
  isDashboardView.value = view === 'dashboard'
  if (view !== 'dashboard') {
    isTableView.value = view === 'table'
    isGridView.value = view === 'grid'
  }
}

// Dark mode state
const isDarkMode = ref(false)

// State
const countries = ref<Country[]>([])
const searchQuery = ref('')
const regionFilter = ref('')
const showFavoritesOnly = ref(false)
const isLoading = ref(true)
const currentPage = ref(1)
const itemsPerPage = ref(12)

// Favorites functionality
const favorites = ref<Country[]>([])

// Initialize favorites from localStorage
onMounted(() => {
  const savedFavorites = localStorage.getItem('favorites')
  if (savedFavorites) {
    favorites.value = JSON.parse(savedFavorites)
  }
})

// Watch favorites for changes and save to localStorage
watch(favorites, (newValue) => {
  localStorage.setItem('favorites', JSON.stringify(newValue))
}, { deep: true })

const toggleFavorite = (country: Country) => {
  const index = favorites.value.findIndex(f => f.name.common === country.name.common)
  if (index === -1) {
    favorites.value.push(country)
  } else {
    favorites.value.splice(index, 1)
  }
}

const isFavorite = (country: Country) => {
  return favorites.value.some(f => f.name.common === country.name.common)
}

// Initialize dark mode from localStorage
onMounted(() => {
  const savedMode = localStorage.getItem('darkMode')
  isDarkMode.value = savedMode === 'true'
  applyDarkMode(isDarkMode.value)
})

// Watch for changes in dark mode
watch(isDarkMode, (newValue) => {
  localStorage.setItem('darkMode', newValue.toString())
  applyDarkMode(newValue)
})

// Reset page when search query changes
watch(searchQuery, () => {
  currentPage.value = 1
})

// Reset page when region filter changes
watch(regionFilter, () => {
  currentPage.value = 1
})

// Reset page when favorites filter changes
watch(showFavoritesOnly, () => {
  currentPage.value = 1
})

// Apply dark mode to document
const applyDarkMode = (dark: boolean) => {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Modal state
const selectedCountry = ref<Country | null>(null)
const showModal = ref(false)
const currentModalPage = ref(1)
const totalModalPages = 2

// Weather and time state for comparison
const comparisonWeather = ref<Record<string, WeatherData>>({})
const comparisonTime = ref<Record<string, string>>({})
const comparisonTimeZones = ref<Record<string, number>>({})
const comparisonIntervals = ref<Record<string, number>>({})

// Update comparison data
const updateComparisonData = async (country: Country) => {
  if (country.capital?.[0]) {
    try {
      const response = await axios.get(
        `http://api.openweathermap.org/data/2.5/weather?q=${country.capital[0]}&units=metric&appid=${config.OPENWEATHER_API_KEY}`
      )
      
      if (response.data && response.data.main && response.data.weather && response.data.weather.length > 0) {
        comparisonWeather.value[country.name.common] = {
          temp: Math.round(response.data.main.temp),
          description: response.data.weather[0].description,
          icon: `http://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`
        }
      }
    } catch (error) {
      console.error('Error fetching comparison weather:', error)
    }
  }

  if (country.latlng?.length === 2) {
    try {
      const response = await axios.get(
        `https://api.timezonedb.com/v2.1/get-time-zone?key=${config.TIMEZONE_API_KEY}&format=json&by=position&lat=${country.latlng[0]}&lng=${country.latlng[1]}`
      )
      
      if (response.data && response.data.gmtOffset) {
        comparisonTimeZones.value[country.name.common] = response.data.gmtOffset
        updateComparisonTime(country.name.common)
        
        // Clear existing interval if any
        if (comparisonIntervals.value[country.name.common]) {
          clearInterval(comparisonIntervals.value[country.name.common])
        }
        
        // Start new interval
        comparisonIntervals.value[country.name.common] = setInterval(
          () => updateComparisonTime(country.name.common),
          1000
        )
      }
    } catch (error) {
      console.error('Error fetching comparison time:', error)
    }
  }
}

// Update time for comparison
const updateComparisonTime = (countryName: string) => {
  if (comparisonTimeZones.value[countryName] !== undefined) {
    const now = new Date()
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
    const localDate = new Date(utc + (comparisonTimeZones.value[countryName] * 1000))
    
    const hours = formatTimeUnit(localDate.getHours())
    const minutes = formatTimeUnit(localDate.getMinutes())
    const seconds = formatTimeUnit(localDate.getSeconds())
    
    comparisonTime.value[countryName] = `${hours}:${minutes}:${seconds}`
  }
}

// Clean up intervals when closing comparison
const clearComparisonIntervals = () => {
  Object.values(comparisonIntervals.value).forEach(interval => {
    clearInterval(interval)
  })
  comparisonIntervals.value = {}
}

// Update toggleComparison function
const toggleComparison = async (country: Country) => {
  const index = comparisonList.value.findIndex(c => c.name.common === country.name.common)
  if (index === -1) {
    if (comparisonList.value.length < 3) {
      comparisonList.value.push(country)
      await updateComparisonData(country)
    }
  } else {
    comparisonList.value.splice(index, 1)
    delete comparisonWeather.value[country.name.common]
    delete comparisonTime.value[country.name.common]
    if (comparisonIntervals.value[country.name.common]) {
      clearInterval(comparisonIntervals.value[country.name.common])
      delete comparisonIntervals.value[country.name.common]
    }
  }
}

// Next/Previous page in modal
const nextModalPage = () => {
  if (currentModalPage.value < totalModalPages) {
    currentModalPage.value++
  }
}

const prevModalPage = () => {
  if (currentModalPage.value > 1) {
    currentModalPage.value--
  }
}

// Clean up when closing modal
const closeModal = () => {
  if (timeInterval.value) {
    clearInterval(timeInterval.value)
    timeInterval.value = null
  }
  showModal.value = false
  selectedCountry.value = null
  currentModalPage.value = 1
}

// Comparison functionality
const comparisonList = ref<Country[]>([])
const showComparison = ref(false)

const isInComparison = (country: Country) => {
  return comparisonList.value.some(c => c.name.common === country.name.common)
}

const clearComparison = () => {
  comparisonList.value = []
  showComparison.value = false
  clearComparisonIntervals()
}

// Show favorites only
const filteredCountries = computed(() => {
  return countries.value
    .filter(country => {
      const matchesSearch = country.name.common.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesRegion = !regionFilter.value || country.region === regionFilter.value
      const matchesFavorites = !showFavoritesOnly.value || favorites.value.some(f => f.name.common === country.name.common)
      return matchesSearch && matchesRegion && matchesFavorites
    })
    .map(country => ({
      ...country,
      flag: country.flags.png,
    }))
})

const paginatedCountries = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCountries.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredCountries.value.length / itemsPerPage.value)
})

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Fetch countries data
onMounted(async () => {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all')
    countries.value = response.data
  } catch (error) {
    console.error('Error fetching countries:', error)
  } finally {
    isLoading.value = false
  }
})

// Export functionality
const exportToCSV = () => {
  // Headers for the CSV
  const headers = [
    'Country',
    'Official Name',
    'Capital',
    'Region',
    'Subregion',
    'Population',
    'Area (km²)',
    'Languages',
    'Currencies'
  ]

  // Convert filtered countries to CSV format
  const csvData = filteredCountries.value.map(country => [
    country.name.common,
    country.name.official,
    country.capital?.[0] || 'N/A',
    country.region,
    country.subregion || 'N/A',
    country.population,
    country.area,
    Object.values(country.languages || {}).join(', '),
    Object.values(country.currencies || {})
      .map(c => `${c.name} (${c.symbol})`)
      .join(', ')
  ])

  // Combine headers and data
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `countries_export_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Weather and location state
const weatherData = ref<WeatherData | null>(null)
const userLocation = ref<{ lat: number; lon: number } | null>(null)
const distanceToCountry = ref<number | null>(null)
const localTime = ref<string | null>(null)
const timeInterval = ref<number | null>(null)
const timeZoneOffset = ref<number>(0)

// Format time with leading zeros
const formatTimeUnit = (unit: number): string => {
  return unit < 10 ? `0${unit}` : `${unit}`
}

// Update local time
const updateLocalTime = () => {
  if (timeZoneOffset.value !== null) {
    const now = new Date()
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
    const localDate = new Date(utc + (timeZoneOffset.value * 1000))
    
    const hours = formatTimeUnit(localDate.getHours())
    const minutes = formatTimeUnit(localDate.getMinutes())
    const seconds = formatTimeUnit(localDate.getSeconds())
    
    localTime.value = `${hours}:${minutes}:${seconds}`
  }
}

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Get weather data for a capital city
const getWeatherData = async (capital: string) => {
  try {
    console.log('Fetching weather for:', capital)
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${capital}&units=metric&appid=${config.OPENWEATHER_API_KEY}`
    console.log('Weather API URL:', url)
    
    const response = await axios.get(url)
    console.log('Weather API response:', response.data)
    
    if (response.data && response.data.main && response.data.weather && response.data.weather.length > 0) {
      weatherData.value = {
        temp: Math.round(response.data.main.temp),
        description: response.data.weather[0].description,
        icon: `http://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`
      }
      console.log('Weather data set:', weatherData.value)
    } else {
      console.error('Invalid weather data structure:', response.data)
      weatherData.value = null
    }
  } catch (error: any) {
    console.error('Error fetching weather:', error.response?.data || error.message)
    weatherData.value = null
  }
}

// Get local time for a country
const getLocalTime = async (lat: number, lon: number) => {
  try {
    const response = await axios.get(
      `https://api.timezonedb.com/v2.1/get-time-zone?key=${config.TIMEZONE_API_KEY}&format=json&by=position&lat=${lat}&lng=${lon}`
    )
    
    if (response.data && response.data.gmtOffset) {
      timeZoneOffset.value = response.data.gmtOffset
      updateLocalTime()
      
      // Clear existing interval if any
      if (timeInterval.value) {
        clearInterval(timeInterval.value)
      }
      
      // Start new interval
      timeInterval.value = setInterval(updateLocalTime, 1000)
    }
  } catch (error) {
    console.error('Error fetching time:', error)
    localTime.value = null
  }
}

// Modal functions
const openCountryModal = async (country: Country) => {
  selectedCountry.value = country
  showModal.value = true
  currentModalPage.value = 1

  if (country.capital?.[0]) {
    await getWeatherData(country.capital[0])
  }
  
  if (country.latlng?.length === 2) {
    await getLocalTime(country.latlng[0], country.latlng[1])
  }

  if (userLocation.value && country.latlng?.length === 2) {
    distanceToCountry.value = calculateDistance(
      userLocation.value.lat,
      userLocation.value.lon,
      country.latlng[0],
      country.latlng[1]
    )
  }
}

// Corregir el error del event.target
const handleImageError = (event: Event) => {
  const imgElement = event.target as HTMLImageElement;
  if (imgElement) {
    imgElement.src = 'https://via.placeholder.com/320x200?text=No+Flag';
  }
}

// Menú Desplegable
const isMenuOpen = ref(false)

const isRegionFilterOpen = ref(false)

// Función para generar los números de página visibles
const getVisiblePageNumbers = () => {
  const range = [];
  
  if (totalPages.value <= 5) {
    // Si hay 5 páginas o menos, mostrar todas
    for (let i = 1; i <= totalPages.value; i++) {
      range.push(i);
    }
  } else {
    // Siempre mostrar un rango de 3 números
    if (currentPage.value <= 2) {
      // Inicio: mostrar 1-3
      for (let i = 1; i <= 3; i++) {
        range.push(i);
      }
      range.push('separator');
      range.push(totalPages.value);
    } else if (currentPage.value >= totalPages.value - 1) {
      // Final: mostrar últimas 3 páginas
      range.push(1);
      range.push('separator');
      for (let i = totalPages.value - 2; i <= totalPages.value; i++) {
        range.push(i);
      }
    } else {
      // Medio: mostrar rango móvil
      range.push(1);
      range.push('separator');
      for (let i = currentPage.value - 1; i <= currentPage.value + 1; i++) {
        range.push(i);
      }
      range.push('separator');
      range.push(totalPages.value);
    }
  }
  
  return range;
}

const isItemsPerPageOpen = ref(false)

// Función para ir a una página específica
const goToPage = (page: number) => {
  currentPage.value = page
  // Scroll hacia arriba suavemente
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Función para cambiar items por página
const setItemsPerPage = (amount: number) => {
  itemsPerPage.value = amount
  currentPage.value = 1
  isItemsPerPageOpen.value = false
  // Scroll hacia arriba suavemente
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
    <!-- Navbar -->
    <nav class="bg-white dark:bg-gray-800 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo y título -->
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex flex-col">
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">WorldExplorer</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">Descubre el mundo</p>
            </div>
          </div>
          
          <!-- Existing buttons -->
          <div class="flex items-center space-x-4">
            <!-- Dashboard Button -->
            <button
              @click="toggleView('dashboard')"
              class="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
              :class="{ 'ring-2 ring-blue-500': currentView === 'dashboard' }"
              title="Vista de Panel"
            >
              <svg
                class="w-6 h-6"
                :class="currentView === 'dashboard' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span class="hidden sm:inline text-gray-900 dark:text-white">Panel</span>
            </button>

            <!-- Menú Desplegable -->
            <div class="relative">
              <button
                @click="isMenuOpen = !isMenuOpen"
                class="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
                :class="{ 'ring-2 ring-blue-500': isMenuOpen }"
              >
                <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span class="hidden sm:inline text-gray-900 dark:text-white">Opciones</span>
              </button>

              <!-- Menú Desplegable Contenido -->
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <div
                  v-if="isMenuOpen"
                  class="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 shadow-xl z-50 py-2 border dark:border-gray-700"
                  @click.away="isMenuOpen = false"
                >
                  <!-- Vista de Cuadrícula -->
                  <button
                    @click="toggleView('grid'); isMenuOpen = false"
                    class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700/70 flex items-center gap-3 text-gray-700 dark:text-gray-200"
                    :class="{ 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400': currentView === 'grid' }"
                  >
                    <svg class="w-5 h-5" :class="currentView === 'grid' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Vista de Cuadrícula</span>
                  </button>

                  <!-- Vista de Lista -->
                  <button
                    @click="toggleView('list'); isMenuOpen = false"
                    class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700/70 flex items-center gap-3 text-gray-700 dark:text-gray-200"
                    :class="{ 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400': currentView === 'list' }"
                  >
                    <svg class="w-5 h-5" :class="currentView === 'list' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span>Vista de Lista</span>
                  </button>

                  <!-- Vista de Tabla -->
                  <button
                    @click="toggleView('table'); isMenuOpen = false"
                    class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700/70 flex items-center gap-3 text-gray-700 dark:text-gray-200"
                    :class="{ 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400': currentView === 'table' }"
                  >
                    <svg class="w-5 h-5" :class="currentView === 'table' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Vista de Tabla</span>
                  </button>

                  <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                  <!-- Exportar -->
                  <button
                    @click="exportToCSV(); isMenuOpen = false"
                    class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700/70 flex items-center gap-3 text-gray-700 dark:text-gray-200"
                  >
                    <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V8a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Exportar a CSV</span>
                  </button>

                  <!-- Modo Oscuro -->
                  <button
                    @click="isDarkMode = !isDarkMode; isMenuOpen = false"
                    class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700/70 flex items-center gap-3 text-gray-700 dark:text-gray-200"
                  >
                    <svg v-if="isDarkMode" class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <svg v-else class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span>{{ isDarkMode ? 'Modo Claro' : 'Modo Oscuro' }}</span>
                  </button>
                </div>
              </Transition>
            </div>

            <!-- Dark mode toggle button -->
            <button
              data-test="dark-mode-toggle"
              @click="isDarkMode = !isDarkMode"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :title="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            >
              <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Stats Overview - Mostrar diferentes stats dependiendo de la vista -->
      <div v-if="currentView === 'dashboard'" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <!-- Lenguajes más comunes -->
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-75">Lenguajes más Comunes</p>
              <h3 class="text-2xl font-bold mt-1">{{ Object.values(countries.reduce((acc, country) => {
                Object.values(country.languages || {}).forEach(lang => {
                  acc[lang] = (acc[lang] || 0) + 1
                })
                return acc
              }, {})).length }}</h3>
              <p class="text-sm mt-2 opacity-75">idiomas únicos</p>
            </div>
            <svg class="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
        </div>

        <!-- Monedas Diferentes -->
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-75">Monedas Diferentes</p>
              <h3 class="text-2xl font-bold mt-1">{{ Object.values(countries.reduce((acc, country) => {
                Object.values(country.currencies || {}).forEach(curr => {
                  acc[curr.name] = (acc[curr.name] || 0) + 1
                })
                return acc
              }, {})).length }}</h3>
              <p class="text-sm mt-2 opacity-75">monedas únicas</p>
            </div>
            <svg class="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <!-- Promedio de Población -->
        <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-75">Promedio de Población</p>
              <h3 class="text-2xl font-bold mt-1">{{ Math.round(countries.reduce((acc, country) => acc + country.population, 0) / countries.length).toLocaleString() }}</h3>
              <p class="text-sm mt-2 opacity-75">habitantes por país</p>
            </div>
            <svg class="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <!-- Promedio de Área -->
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-75">Promedio de Área</p>
              <h3 class="text-2xl font-bold mt-1">{{ Math.round(countries.reduce((acc, country) => acc + country.area, 0) / countries.length).toLocaleString() }}</h3>
              <p class="text-sm mt-2 opacity-75">km² por país</p>
            </div>
            <svg class="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Stats Overview para otras vistas -->
      <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg gradient-animate hover-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-75">Total Países</p>
              <h3 class="text-2xl font-bold mt-1 stats-number">{{ countries.length }}</h3>
            </div>
            <svg class="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg gradient-animate hover-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-75">Países Filtrados</p>
              <h3 class="text-2xl font-bold mt-1">{{ filteredCountries.length }}</h3>
            </div>
            <svg class="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
        </div>

        <div 
          @click="showFavoritesOnly = !showFavoritesOnly"
          class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105"
          :class="{ 'ring-4 ring-yellow-300 dark:ring-yellow-400': showFavoritesOnly }"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-75">Favoritos</p>
              <h3 class="text-2xl font-bold mt-1">{{ favorites.length }}</h3>
            </div>
            <svg class="w-8 h-8 opacity-75" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </div>

        <div 
          @click="comparisonList.length >= 2 ? showComparison = true : null"
          class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105 relative"
          :class="{ 'ring-4 ring-purple-300 dark:ring-purple-400': comparisonList.length >= 2 }"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-75">Para Comparar</p>
              <h3 class="text-2xl font-bold mt-1">{{ comparisonList.length }}/3</h3>
            </div>
            <svg class="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div 
            v-if="comparisonList.length >= 2" 
            class="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"
          ></div>
        </div>
      </div>

      <!-- Search and Filters - Solo mostrar cuando no estamos en dashboard -->
      <div v-if="currentView !== 'dashboard'" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="relative flex-1">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Buscar países..." 
              class="pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <!-- Filtro de Regiones Mejorado -->
          <div class="relative">
            <button 
              @click="isRegionFilterOpen = !isRegionFilterOpen"
              class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[200px] text-gray-900 dark:text-white flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600"
              :class="{ 'ring-2 ring-blue-500': isRegionFilterOpen }"
            >
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ regionFilter || 'Todas las Regiones' }}</span>
              </div>
              <svg 
                class="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200"
                :class="{ 'transform rotate-180': isRegionFilterOpen }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Menú de Regiones -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="transform -translate-y-2 opacity-0"
              enter-to-class="transform translate-y-0 opacity-100"
              leave-active-class="transition duration-200 ease-in"
              leave-from-class="transform translate-y-0 opacity-100"
              leave-to-class="transform -translate-y-2 opacity-0"
            >
              <div 
                v-if="isRegionFilterOpen"
                class="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg py-2"
                @click.away="isRegionFilterOpen = false"
              >
                <button
                  v-for="region in ['', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania']"
                  :key="region"
                  @click="regionFilter = region; isRegionFilterOpen = false"
                  class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700/70 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition-all duration-200"
                  :class="{ 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400': regionFilter === region }"
                >
                  <svg 
                    v-if="regionFilter === region"
                    class="w-5 h-5 text-blue-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="ml-2">{{ region || 'Todas las Regiones' }}</span>
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center h-[600px]">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 dark:border-blue-400 border-t-transparent"></div>
      </div>

      <!-- Countries Display -->
      <div v-else>
        <Transition name="fade" mode="out-in">
          <!-- Dashboard View -->
          <div v-if="currentView === 'dashboard'" key="dashboard">
            <Dashboard 
              :countries="countries"
              :is-dark-mode="isDarkMode"
            />
          </div>

          <!-- Grid View -->
          <div v-else-if="currentView === 'grid'" key="grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            <!-- Country Card -->
            <div 
              v-for="country in paginatedCountries" 
              :key="country.name.common"
              class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg dark:shadow-gray-900 relative flex flex-col"
            >
              <div class="flex-1">
                <!-- Flag Container -->
                <div @click="openCountryModal(country)" class="w-full h-48 relative">
                  <img 
                    :src="country.flags.png" 
                    :alt="country.name.common + ' flag'"
                    class="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    @error="handleImageError"
                  />
                </div>
                
                <!-- Country Info -->
                <div class="p-4">
                  <div @click="openCountryModal(country)" class="cursor-pointer">
                    <h3 class="font-semibold text-lg mb-2 text-gray-800 dark:text-white">{{ country.name.common }}</h3>
                    <div class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <p><span class="font-medium">Capital:</span> {{ country.capital?.[0] || 'N/A' }}</p>
                      <p><span class="font-medium">Region:</span> {{ country.region }}</p>
                      <p><span class="font-medium">Population:</span> {{ country.population.toLocaleString() }}</p>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex justify-end gap-2 mt-4 border-t pt-4 dark:border-gray-700">
                    <button
                      @click.stop="toggleFavorite(country)"
                      class="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
                      :class="{ 'text-yellow-400 dark:text-yellow-300': isFavorite(country) }"
                      :title="isFavorite(country) ? 'Remover de Favoritos' : 'Agregar a Favoritos'"
                    >
                      <svg 
                        class="w-5 h-5" 
                        :class="{ 'animate-bounce': isFavorite(country) }"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span class="text-sm">Favorito</span>
                    </button>
                    <button
                      @click.stop="toggleComparison(country)"
                      class="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
                      :class="{ 'text-blue-500 dark:text-blue-400': isInComparison(country) }"
                      :disabled="comparisonList.length >= 3 && !isInComparison(country)"
                      :title="isInComparison(country) ? 'Remover de Comparación' : 'Agregar a Comparación'"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span class="text-sm">Comparar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- List View -->
          <div v-else-if="currentView === 'list'" key="list" class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="country in paginatedCountries"
              :key="country.name.common"
              class="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 relative"
            >
              <!-- Flag image -->
              <div class="w-16 h-12 flex-shrink-0" @click="openCountryModal(country)">
                <img 
                  :src="country.flags.png" 
                  :alt="country.name.common + ' flag'"
                  class="w-full h-full object-cover rounded"
                  loading="lazy"
                  @error="handleImageError"
                />
              </div>

              <div class="flex-grow grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <div class="sm:col-span-2" @click="openCountryModal(country)">
                  <h3 class="font-semibold text-gray-800 dark:text-white">{{ country.name.common }}</h3>
                  <div class="text-sm text-gray-600 dark:text-gray-300">
                    <p><span class="font-medium">Capital:</span> {{ country.capital?.[0] || 'N/A' }}</p>
                  </div>
                </div>
                
                <div class="text-sm text-gray-600 dark:text-gray-300" @click="openCountryModal(country)">
                  <p><span class="font-medium">Region:</span> {{ country.region }}</p>
                  <p><span class="font-medium">Population:</span> {{ country.population.toLocaleString() }}</p>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2 justify-end">
                  <button
                    @click.stop="toggleFavorite(country)"
                    class="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                    :class="{ 'text-yellow-400 dark:text-yellow-300': isFavorite(country) }"
                    :title="isFavorite(country) ? 'Remover de Favoritos' : 'Agregar a Favoritos'"
                  >
                    <svg 
                      class="w-5 h-5" 
                      :class="{ 'animate-bounce': isFavorite(country) }"
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                  <button
                    @click.stop="toggleComparison(country)"
                    class="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                    :class="{ 'text-blue-500 dark:text-blue-400': isInComparison(country) }"
                    :disabled="comparisonList.length >= 3 && !isInComparison(country)"
                    :title="isInComparison(country) ? 'Remover de Comparación' : 'Agregar a Comparación'"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Table View -->
          <div v-else key="table">
            <CountriesAgGrid 
              :countries="filteredCountries"
              :is-dark-mode="isDarkMode"
              @row-clicked="openCountryModal"
            />
          </div>
        </Transition>

        <!-- Pagination (hide for dashboard and table view) -->
        <div v-if="currentView !== 'dashboard' && currentView !== 'table'" class="mt-8">
          <div class="flex flex-col items-center gap-4">
            <!-- Pagination Controls -->
            <div class="flex items-center gap-2">
              <!-- First Page -->
              <button
                @click="currentPage = 1"
                :disabled="currentPage === 1"
                class="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="{ 'hover:scale-105 active:scale-95': currentPage !== 1 }"
              >
                <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              <!-- Previous Page -->
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                class="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="{ 'hover:scale-105 active:scale-95': currentPage !== 1 }"
              >
                <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <!-- Page Numbers -->
              <div class="flex items-center gap-1">
                <template v-for="pageNum in getVisiblePageNumbers()" :key="pageNum">
                  <button
                    v-if="pageNum !== 'separator'"
                    @click="goToPage(Number(pageNum))"
                    class="min-w-[40px] h-10 rounded-lg transition-all duration-200 font-medium text-sm"
                    :class="{
                      'bg-blue-500 text-white shadow-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700': currentPage === Number(pageNum),
                      'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600': currentPage !== Number(pageNum)
                    }"
                  >
                    {{ pageNum }}
                  </button>
                  <div 
                    v-else 
                    class="flex items-center px-1"
                  >
                    <div class="w-6 flex justify-center">
                      <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                      </svg>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Next Page -->
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="{ 'hover:scale-105 active:scale-95': currentPage !== totalPages }"
              >
                <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <!-- Last Page -->
              <button
                @click="currentPage = totalPages"
                :disabled="currentPage === totalPages"
                class="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="{ 'hover:scale-105 active:scale-95': currentPage !== totalPages }"
              >
                <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <!-- Items per page selector -->
            <div class="relative">
              <button
                @click="isItemsPerPageOpen = !isItemsPerPageOpen"
                class="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 dark:text-gray-200 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <span>{{ itemsPerPage }} por página</span>
                <svg 
                  class="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200"
                  :class="{ 'transform rotate-180': isItemsPerPageOpen }"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Menú desplegable de items por página -->
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <div
                  v-if="isItemsPerPageOpen"
                  class="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg py-2"
                  @click.away="isItemsPerPageOpen = false"
                >
                  <button
                    v-for="amount in [12, 24, 48]"
                    :key="amount"
                    @click="setItemsPerPage(amount)"
                    class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700/70 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition-all duration-200"
                    :class="{ 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400': itemsPerPage === amount }"
                  >
                    <svg 
                      v-if="itemsPerPage === amount"
                      class="w-5 h-5 text-blue-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span :class="{ 'ml-8': itemsPerPage !== amount }">{{ amount }} p/p</span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-800 shadow-lg mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">WorldExplorer</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Explora el mundo desde tu navegador</p>
            </div>
          </div>
          
          <div class="flex flex-col items-center md:items-end">
            <div class="flex space-x-4">
              <a href="#" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <span class="sr-only">GitHub</span>
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                </svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <span class="sr-only">Twitter</span>
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              © 2025 WorldExplorer. Noubary tats mi.
            </p>
          </div>
        </div>
      </div>
    </footer>

    <!-- Comparison Modal -->
    <div v-if="showComparison" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Comparar Países</h2>
            <div class="flex gap-4">
              <button
                @click="clearComparison"
                class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Limpiar Todo
              </button>
              <button
                @click="showComparison = false"
                class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Comparison Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div v-for="country in comparisonList" :key="country.name.common" class="space-y-6">
              <div class="flex justify-center">
                <img :src="country.flags.png" :alt="country.name.common" class="h-32 rounded-lg shadow-lg">
              </div>
              <div class="space-y-4">
                <div>
                  <h3 class="font-semibold text-xl text-gray-800 dark:text-white">{{ country.name.common }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ country.name.official }}</p>
                </div>

                <!-- Weather information -->
                <div v-if="comparisonWeather[country.name.common]" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 class="font-semibold text-gray-800 dark:text-white mb-2">Clima en {{ country.capital?.[0] }}</h4>
                  <div class="flex items-center gap-2">
                    <img 
                      :src="comparisonWeather[country.name.common].icon" 
                      :alt="comparisonWeather[country.name.common].description" 
                      class="w-10 h-10"
                    >
                    <div>
                      <p class="text-lg font-bold text-gray-800 dark:text-white">
                        {{ comparisonWeather[country.name.common].temp }}°C
                      </p>
                      <p class="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {{ comparisonWeather[country.name.common].description }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Local time -->
                <div v-if="comparisonTime[country.name.common]" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 class="font-semibold text-gray-800 dark:text-white mb-2">Hora Local</h4>
                  <p class="text-2xl font-mono font-bold text-gray-800 dark:text-white text-center">
                    {{ comparisonTime[country.name.common] }}
                  </p>
                </div>

                <div class="space-y-2">
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-300">Capital:</span>
                    <span class="text-gray-600 dark:text-gray-400">{{ country.capital?.[0] || 'N/A' }}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-300">Region:</span>
                    <span class="text-gray-600 dark:text-gray-400">{{ country.region }}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-300">Population:</span>
                    <span class="text-gray-600 dark:text-gray-400">{{ country.population.toLocaleString() }}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-300">Area:</span>
                    <span class="text-gray-600 dark:text-gray-400">{{ country.area.toLocaleString() }} km²</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-300">Languages:</span>
                    <span class="text-gray-600 dark:text-gray-400">
                      {{ Object.values(country.languages || {}).join(', ') || 'N/A' }}
                    </span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-300">Currencies:</span>
                    <span class="text-gray-600 dark:text-gray-400">
                      {{ Object.values(country.currencies || {})
                          .map(c => `${c.name} (${c.symbol})`)
                          .join(', ') || 'N/A' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Country Details Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <!-- Modal header -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white">{{ selectedCountry?.name.common }}</h2>
            <button @click="closeModal" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Page navigation -->
          <div class="flex justify-center items-center gap-4 mt-4">
            <button 
              @click="prevModalPage" 
              :disabled="currentModalPage === 1"
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Página {{ currentModalPage }} de {{ totalModalPages }}
            </span>
            <button 
              @click="nextModalPage" 
              :disabled="currentModalPage === totalModalPages"
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal content -->
        <div class="p-6">
          <!-- Page 1: Basic Information -->
          <div v-if="currentModalPage === 1" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Flag and basic info -->
              <div>
                <img 
                  :src="selectedCountry?.flags.png" 
                  :alt="selectedCountry?.name.common + ' bandera'"
                  class="w-full h-48 object-cover rounded-lg shadow-lg mb-4"
                />
                <div class="space-y-2">
                  <p class="text-gray-600 dark:text-gray-300">
                    <span class="font-medium">Nombre Oficial:</span> {{ selectedCountry?.name.official }}
                  </p>
                  <p class="text-gray-600 dark:text-gray-300">
                    <span class="font-medium">Capital:</span> {{ selectedCountry?.capital?.[0] || 'N/A' }}
                  </p>
                  <p class="text-gray-600 dark:text-gray-300">
                    <span class="font-medium">Region:</span> {{ selectedCountry?.region }}
                  </p>
                  <p class="text-gray-600 dark:text-gray-300">
                    <span class="font-medium">Population:</span> {{ selectedCountry?.population.toLocaleString() }}
                  </p>
                </div>
              </div>

              <!-- Weather and time -->
              <div class="space-y-6">
                <!-- Weather information -->
                <div v-if="weatherData" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Clima en {{ selectedCountry?.capital?.[0] }}</h3>
                  <div class="flex items-center gap-4">
                    <img 
                      :src="weatherData.icon" 
                      :alt="weatherData.description"
                      class="w-16 h-16"
                    />
                    <div>
                      <p class="text-2xl font-bold text-gray-800 dark:text-white">{{ weatherData.temp }}°C</p>
                      <p class="text-gray-600 dark:text-gray-400 capitalize">{{ weatherData.description }}</p>
                    </div>
                  </div>
                </div>

                <!-- Local time -->
                <div v-if="localTime" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Hora Local</h3>
                  <p class="text-3xl font-mono text-center text-gray-800 dark:text-white">{{ localTime }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Page 2: Additional Information -->
          <div v-if="currentModalPage === 2" class="space-y-6">
            <!-- Topographic Map -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Mapa Topográfico</h3>
              <div class="relative w-full h-64 rounded-lg overflow-hidden">
                <iframe
                  v-if="selectedCountry?.latlng?.length === 2"
                  :src="`https://www.openstreetmap.org/export/embed.html?bbox=${
                    selectedCountry.latlng[1] - 5
                  },${
                    selectedCountry.latlng[0] - 5
                  },${
                    selectedCountry.latlng[1] + 5
                  },${
                    selectedCountry.latlng[0] + 5
                  }&layer=cyclosm&marker=${
                    selectedCountry.latlng[0]
                  },${
                    selectedCountry.latlng[1]
                  }`"
                  class="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                ></iframe>
                <div v-else class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-600">
                  <p class="text-gray-500 dark:text-gray-400">Mapa no disponible</p>
                </div>
              </div>
              <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <p v-if="selectedCountry?.latlng?.length === 2">
                  Coordenadas: {{ selectedCountry.latlng[0] }}°N, {{ selectedCountry.latlng[1] }}°E
                </p>
                <p class="mt-1" v-if="selectedCountry?.latlng?.length === 2">
                  <a
                    :href="`https://www.openstreetmap.org/?mlat=${selectedCountry.latlng[0]}&mlon=${selectedCountry.latlng[1]}#map=6/${selectedCountry.latlng[0]}/${selectedCountry.latlng[1]}&layers=C`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Ver mapa completo →
                  </a>
                </p>
              </div>
            </div>

            <!-- Languages and Currencies -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Idiomas y Monedas</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Idiomas</h4>
                  <ul class="list-disc list-inside text-gray-600 dark:text-gray-400">
                    <li v-for="lang in Object.values(selectedCountry?.languages || {})" :key="lang">
                      {{ lang }}
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Monedas</h4>
                  <ul class="list-disc list-inside text-gray-600 dark:text-gray-400">
                    <li v-for="(currency, code) in selectedCountry?.currencies" :key="code">
                      {{ currency.name }} ({{ currency.symbol }})
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Additional Statistics -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Estadísticas Adicionales</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p class="text-gray-600 dark:text-gray-400">
                    <span class="font-medium">Área:</span> {{ selectedCountry?.area.toLocaleString() }} km²
                  </p>
                  <p class="text-gray-600 dark:text-gray-400">
                    <span class="font-medium">Densidad de Población:</span>
                    {{ selectedCountry ? Math.round(selectedCountry.population / selectedCountry.area).toLocaleString() : 0 }} habitantes/km²
                  </p>
                </div>
                <div v-if="distanceToCountry">
                  <p class="text-gray-600 dark:text-gray-400">
                    <span class="font-medium">Distancia desde tu ubicación:</span>
                    {{ Math.round(distanceToCountry).toLocaleString() }} km
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Improve image loading and display */
img {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: block;
  max-width: 100%;
}

/* Improve button visibility in dark mode */
.dark button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Star animation */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-25%);
  }
}

.animate-bounce {
  animation: bounce 1s ease infinite;
}

/* Transiciones entre vistas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Fade Animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide Animation */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* Scale Animation */
.scale-enter-active,
.scale-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}

/* Hover Effects */
.hover-card {
  transition: all 0.3s ease;
}

.hover-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Stats Card Animation */
@keyframes statsNumberIncrease {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.stats-number {
  animation: statsNumberIncrease 0.5s ease-out forwards;
}

/* Pulse Animation for Notifications */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.pulse {
  animation: pulse 2s infinite;
}

/* Gradient Animation */
.gradient-animate {
  background-size: 200% 200%;
  animation: gradientMove 5s ease infinite;
}

@keyframes gradientMove {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Loading Spinner */
.loading-spinner {
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Menu Animation Styles */
.menu-enter-active,
.menu-leave-active {
  transition: all 0.2s ease;
  transform-origin: top right;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.menu-enter-to,
.menu-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Improve menu item hover animation */
.menu-item-hover {
  transition: all 0.2s ease;
}

.menu-item-hover:hover {
  transform: translateX(4px);
}

/* Add subtle animation to icons */
.menu-icon {
  transition: transform 0.2s ease;
}

button:hover .menu-icon {
  transform: scale(1.1);
}

/* Region Filter Animation */
.region-filter-enter-active,
.region-filter-leave-active {
  transition: all 0.2s ease;
  transform-origin: top;
}

.region-filter-enter-from,
.region-filter-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Improve button hover states */
.region-button {
  transition: all 0.2s ease;
}

.region-button:hover {
  transform: translateX(4px);
}

/* Pagination Animations */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Button press animation */
.active\:scale-95:active {
  transform: scale(0.95);
}

/* Improve dropdown animation */
.items-per-page-enter-active,
.items-per-page-leave-active {
  transition: all 0.2s ease;
  transform-origin: top;
}

.items-per-page-enter-from,
.items-per-page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
