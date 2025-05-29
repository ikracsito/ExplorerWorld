<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridVue } from 'ag-grid-vue3';

const props = defineProps({
  countries: {
    type: Array,
    required: true
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
});

// Column Definitions
const columnDefs = ref([
  {
    field: 'flags.png',
    headerName: 'Bandera',
    headerTooltip: 'Bandera del país',
    width: 120,
    filter: false,
    floatingFilter: false,
    cellRenderer: params => {
      return `<img src="${params.value}" alt="Bandera de ${params.data.name.common}" style="width: 30px; height: 20px; object-fit: cover; border-radius: 4px;">`;
    }
  },
  { 
    field: 'name.common', 
    headerName: 'País',
    headerTooltip: 'Nombre del país',
    tooltipField: 'name.official',
    flex: 2,
    filter: 'agTextColumnFilter'
  },
  { 
    field: 'capital.0', 
    headerName: 'Capital',
    headerTooltip: 'Ciudad capital del país',
    valueFormatter: params => params.value || 'No disponible',
    filter: 'agTextColumnFilter'
  },
  { 
    field: 'region', 
    headerName: 'Región',
    headerTooltip: 'Región geográfica',
    filter: 'agSetColumnFilter'
  },
  { 
    field: 'population', 
    headerName: 'Población',
    headerTooltip: 'Número total de habitantes',
    valueFormatter: params => {
      if (params.value >= 1e9) return `${(params.value / 1e9).toFixed(1)} mil millones`;
      if (params.value >= 1e6) return `${(params.value / 1e6).toFixed(1)} millones`;
      if (params.value >= 1e3) return `${(params.value / 1e3).toFixed(1)} mil`;
      return params.value.toLocaleString();
    },
    type: 'numericColumn',
    filter: 'agNumberColumnFilter'
  },
  { 
    field: 'area', 
    headerName: 'Área',
    headerTooltip: 'Área total en kilómetros cuadrados',
    valueFormatter: params => params.value ? `${params.value.toLocaleString()} km²` : 'No disponible',
    type: 'numericColumn',
    filter: 'agNumberColumnFilter'
  }
]);

// Grid Options
const gridOptions = ref({
  animateRows: true,
  defaultColDef: {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
    suppressMovable: true,
    autoHeight: true
  },
  pagination: true,
  paginationAutoPageSize: false,
  paginationPageSize: 15,
  rowSelection: 'single',
  enableCellTextSelection: true,
  overlayNoRowsTemplate: 'No se encontraron países con los filtros actuales',
  overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Cargando países...</span>',
  domLayout: 'normal'
});

// Grid API Reference
const gridApi = ref(null);

// Grid Ready Event Handler
const onGridReady = (params) => {
  gridApi.value = params.api;
  params.api.sizeColumnsToFit();
  params.api.paginationGoToPage(0);
};

// Window Resize Handler
const onResize = () => {
  if (gridApi.value && !gridApi.value.isDestroyed()) {
    gridApi.value.sizeColumnsToFit();
  }
};

// Watch for dark mode changes
watch(() => props.isDarkMode, (newValue) => {
  const theme = newValue ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';
  const gridElement = document.querySelector('.ag-grid-container');
  if (gridElement) {
    gridElement.className = `ag-grid-container ${theme} h-[600px] w-full`;
  }
}, { immediate: true });

// Setup Window Resize Listener
onMounted(() => {
  window.addEventListener('resize', onResize);
});

// Cleanup on component unmount
onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  if (gridApi.value) {
    gridApi.value = null;
  }
});

// Nuevos métodos
const exportToExcel = () => {
  if (gridApi.value && !gridApi.value.isDestroyed()) {
    gridApi.value.exportDataAsCsv({
      fileName: 'paises.csv',
      processCellCallback: (params) => {
        if (params.column.colId === 'population') {
          return params.value.toLocaleString();
        }
        return params.value;
      }
    });
  }
};

const resetFilters = () => {
  if (gridApi.value && !gridApi.value.isDestroyed()) {
    gridApi.value.setFilterModel(null);
    gridApi.value.onFilterChanged();
  }
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Barra de herramientas -->
    <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="flex items-center gap-4">
        <button 
          @click="exportToExcel"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V8a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar a Excel
        </button>
        
        <button 
          @click="resetFilters"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Limpiar filtros
        </button>
      </div>
    </div>

    <!-- AG Grid -->
    <div class="ag-grid-container" :class="[
      isDarkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine',
      'h-[600px] rounded-lg overflow-hidden'
    ]">
      <ag-grid-vue
        :columnDefs="columnDefs"
        :rowData="countries"
        :gridOptions="gridOptions"
        @grid-ready="onGridReady"
        class="w-full h-full"
      />
    </div>
  </div>
</template>

<style>
.ag-theme-alpine,
.ag-theme-alpine-dark {
  --ag-border-radius: 8px;
  --ag-row-height: 48px;
  --ag-header-height: 48px;
  --ag-font-size: 14px;
  --ag-font-family: inherit;
}

.ag-theme-alpine {
  --ag-background-color: white;
  --ag-header-background-color: #f3f4f6;
  --ag-odd-row-background-color: #f9fafb;
  --ag-row-hover-color: #e5e7eb;
  --ag-selected-row-background-color: #e5e7eb;
}

.ag-theme-alpine-dark {
  --ag-background-color: rgba(31, 41, 55, 0.5);
  --ag-header-background-color: rgba(31, 41, 55, 0.8);
  --ag-odd-row-background-color: rgba(31, 41, 55, 0.3);
  --ag-row-hover-color: rgba(59, 130, 246, 0.2);
  --ag-selected-row-background-color: rgba(59, 130, 246, 0.3);
  --ag-header-foreground-color: white;
  --ag-foreground-color: white;
}

.ag-grid-container {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

/* Mejoras visuales para los filtros flotantes */
.ag-theme-alpine .ag-floating-filter-input,
.ag-theme-alpine-dark .ag-floating-filter-input {
  padding: 0.5rem;
  border-radius: 0.375rem;
}

/* Estilos para la paginación de AG Grid */
.ag-theme-alpine .ag-paging-panel,
.ag-theme-alpine-dark .ag-paging-panel {
  height: 48px;
  padding: 0 1rem;
  font-size: 0.875rem;
  border-top: 1px solid var(--ag-border-color);
}

.ag-theme-alpine .ag-paging-button,
.ag-theme-alpine-dark .ag-paging-button {
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
}

.ag-theme-alpine .ag-paging-button:hover:not(.ag-disabled),
.ag-theme-alpine-dark .ag-paging-button:hover:not(.ag-disabled) {
  background-color: var(--ag-row-hover-color);
}

/* Mejoras para el hover en las filas */
.ag-theme-alpine .ag-row:hover,
.ag-theme-alpine-dark .ag-row:hover {
  background-color: rgba(59, 130, 246, 0.1) !important;
}

/* Mejoras para la selección de filas */
.ag-theme-alpine .ag-row-selected,
.ag-theme-alpine-dark .ag-row-selected {
  background-color: rgba(59, 130, 246, 0.2) !important;
}
</style> 