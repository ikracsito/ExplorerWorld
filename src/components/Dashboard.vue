<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'vue-chartjs'
import type { ChartOptions } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

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

const props = defineProps<{
  countries: Country[]
  isDarkMode: boolean
}>()

// Stats
const totalPopulation = computed(() => {
  return props.countries.reduce((acc, country) => acc + country.population, 0)
})

const averagePopulation = computed(() => {
  return Math.round(totalPopulation.value / props.countries.length)
})

const totalArea = computed(() => {
  return props.countries.reduce((acc, country) => acc + country.area, 0)
})

const averageArea = computed(() => {
  return Math.round(totalArea.value / props.countries.length)
})

const regionStats = computed(() => {
  const stats = props.countries.reduce((acc, country) => {
    if (!acc[country.region]) {
      acc[country.region] = {
        count: 0,
        population: 0,
        area: 0
      }
    }
    acc[country.region].count++
    acc[country.region].population += country.population
    acc[country.region].area += country.area
    return acc
  }, {} as Record<string, { count: number; population: number; area: number }>)

  return Object.entries(stats).map(([region, data]) => ({
    region,
    count: data.count,
    population: data.population,
    area: data.area,
    populationDensity: Math.round(data.population / data.area)
  }))
})

const mostPopulousCountries = computed(() => {
  return [...props.countries]
    .sort((a, b) => b.population - a.population)
    .slice(0, 5)
})

const largestCountries = computed(() => {
  return [...props.countries]
    .sort((a, b) => b.area - a.area)
    .slice(0, 5)
})

const mostLanguages = computed(() => {
  return [...props.countries]
    .sort((a, b) => Object.keys(b.languages || {}).length - Object.keys(a.languages || {}).length)
    .slice(0, 5)
})

// Chart Data
const regionDistributionData = computed(() => ({
  labels: regionStats.value.map(stat => stat.region),
  datasets: [{
    data: regionStats.value.map(stat => stat.count),
    backgroundColor: [
      'rgba(255, 99, 132, 0.8)',   // Rosa para África
      'rgba(54, 162, 235, 0.8)',   // Azul para Europa
      'rgba(255, 206, 86, 0.8)',   // Amarillo para Oceanía
      'rgba(75, 192, 192, 0.8)',   // Turquesa para Antártica
      'rgba(153, 102, 255, 0.8)',  // Morado para América
      'rgba(255, 159, 64, 0.8)'    // Naranja para Asia
    ],
    borderColor: [
      'rgba(255, 99, 132, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)'
    ],
    borderWidth: 2,
    hoverBackgroundColor: [
      'rgba(255, 99, 132, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)'
    ],
    hoverBorderWidth: 3
  }]
}))

const populationChartData = computed(() => ({
  labels: mostPopulousCountries.value.map(country => country.name.common),
  datasets: [{
    label: 'Población',
    data: mostPopulousCountries.value.map(country => country.population),
    backgroundColor: [
      'rgba(54, 162, 235, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 99, 132, 0.8)'
    ],
    borderColor: [
      'rgba(54, 162, 235, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 99, 132, 1)'
    ],
    borderWidth: 2,
    borderRadius: 8,
    hoverBackgroundColor: [
      'rgba(54, 162, 235, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 99, 132, 1)'
    ],
    hoverBorderWidth: 3
  }]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: props.isDarkMode ? '#fff' : '#000',
        font: {
          size: 13
        },
        padding: 20
      },
      position: 'top' as const
    },
    tooltip: {
      backgroundColor: props.isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      titleColor: props.isDarkMode ? '#fff' : '#000',
      bodyColor: props.isDarkMode ? '#fff' : '#000',
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      usePointStyle: true,
      borderColor: props.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderWidth: 1
    }
  },
  animation: {
    duration: 2000,
    easing: 'easeInOutQuart'
  },
  elements: {
    arc: {
      borderWidth: 2
    }
  },
  layout: {
    padding: 20
  }
}))

const barChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: props.isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      titleColor: props.isDarkMode ? '#fff' : '#000',
      bodyColor: props.isDarkMode ? '#fff' : '#000',
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      usePointStyle: true,
      borderColor: props.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderWidth: 1
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: props.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        drawBorder: false
      },
      ticks: {
        color: props.isDarkMode ? '#fff' : '#000',
        font: {
          size: 12
        },
        padding: 8,
        callback: function(value: number) {
          if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
          if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
          if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
          return value
        }
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: props.isDarkMode ? '#fff' : '#000',
        font: {
          size: 12
        },
        padding: 8
      }
    }
  },
  animation: {
    duration: 2000,
    easing: 'easeInOutQuart'
  },
  layout: {
    padding: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    }
  }
}))
</script>

<template>
  <div class="space-y-8">
    <!-- Global Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Total de Países</h3>
        <p class="text-3xl font-bold text-blue-500 dark:text-blue-400">{{ countries.length }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Población Total</h3>
        <p class="text-3xl font-bold text-green-500 dark:text-green-400">{{ totalPopulation.toLocaleString() }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">Promedio: {{ averagePopulation.toLocaleString() }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Área Total (km²)</h3>
        <p class="text-3xl font-bold text-purple-500 dark:text-purple-400">{{ totalArea.toLocaleString() }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">Promedio: {{ averageArea.toLocaleString() }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Densidad Poblacional</h3>
        <p class="text-3xl font-bold text-red-500 dark:text-red-400">{{ Math.round(totalPopulation / totalArea).toLocaleString() }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">habitantes/km²</p>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Region Distribution Pie Chart -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Distribución por Región</h3>
        <div class="h-[300px]">
          <Pie
            :data="regionDistributionData"
            :options="chartOptions"
          />
        </div>
      </div>

      <!-- Population Bar Chart -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Países más Poblados</h3>
        <div class="h-[300px]">
          <Bar
            :data="populationChartData"
            :options="barChartOptions"
          />
        </div>
      </div>
    </div>

    <!-- Regional Stats -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Estadísticas por Región</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="text-left text-gray-600 dark:text-gray-400">
              <th class="py-2 px-4">Región</th>
              <th class="py-2 px-4">Países</th>
              <th class="py-2 px-4">Población</th>
              <th class="py-2 px-4">Área (km²)</th>
              <th class="py-2 px-4">Densidad (hab/km²)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stat in regionStats" :key="stat.region" class="border-t border-gray-200 dark:border-gray-700">
              <td class="py-2 px-4 text-gray-800 dark:text-white">{{ stat.region }}</td>
              <td class="py-2 px-4 text-gray-600 dark:text-gray-400">{{ stat.count }}</td>
              <td class="py-2 px-4 text-gray-600 dark:text-gray-400">{{ stat.population.toLocaleString() }}</td>
              <td class="py-2 px-4 text-gray-600 dark:text-gray-400">{{ stat.area.toLocaleString() }}</td>
              <td class="py-2 px-4 text-gray-600 dark:text-gray-400">{{ stat.populationDensity.toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Top 5 Lists -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Most Populous Countries -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Países más Poblados</h3>
        <ul class="space-y-4">
          <li v-for="country in mostPopulousCountries" :key="country.name.common" class="flex items-center gap-4">
            <img :src="country.flags.png" :alt="country.name.common" class="w-8 h-6 object-cover rounded">
            <div>
              <p class="font-medium text-gray-800 dark:text-white">{{ country.name.common }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ country.population.toLocaleString() }} habitantes</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- Largest Countries -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Países más Extensos</h3>
        <ul class="space-y-4">
          <li v-for="country in largestCountries" :key="country.name.common" class="flex items-center gap-4">
            <img :src="country.flags.png" :alt="country.name.common" class="w-8 h-6 object-cover rounded">
            <div>
              <p class="font-medium text-gray-800 dark:text-white">{{ country.name.common }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ country.area.toLocaleString() }} km²</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- Most Languages -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Mayor Diversidad Lingüística</h3>
        <ul class="space-y-4">
          <li v-for="country in mostLanguages" :key="country.name.common" class="flex items-center gap-4">
            <img :src="country.flags.png" :alt="country.name.common" class="w-8 h-6 object-cover rounded">
            <div>
              <p class="font-medium text-gray-800 dark:text-white">{{ country.name.common }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ Object.keys(country.languages || {}).length }} idiomas
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template> 