<!-- AG Grid Table Component -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Props
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

// Grid configuration
const gridApi = ref(null);
const columnDefs = ref([
  {
    headerName: 'Bandera',
    field: 'flags',
    width: 100,
    cellRenderer: (params) => {
      return `<img src="${params.data.flags.png}" alt="${params.data.name.common} flag" style="width: 40px; height: 30px; object-fit: cover; border-radius: 4px;">`;
    },
    sortable: false,
    filter: false
  },
  {
    headerName: 'País',
    field: 'name.common',
    sortable: true,
    filter: true,
    flex: 1
  },
  {
    headerName: 'Capital',
    field: 'capital',
    valueGetter: (params) => params.data.capital?.[0] || 'N/A',
    sortable: true,
    filter: true,
    flex: 1
  },
  {
    headerName: 'Región',
    field: 'region',
    sortable: true,
    filter: true,
    flex: 1
  },
  {
    headerName: 'Población',
    field: 'population',
    sortable: true,
    filter: true,
    flex: 1,
    valueFormatter: (params) => params.value.toLocaleString()
  },
  {
    headerName: 'Área',
    field: 'area',
    sortable: true,
    filter: true,
    flex: 1,
    valueFormatter: (params) => `${params.value.toLocaleString()} km²`
  },
  {
    headerName: 'Idiomas',
    field: 'languages',
    sortable: true,
    filter: true,
    flex: 1,
    valueGetter: (params) => {
      return Object.values(params.data.languages || {}).join(', ') || 'N/A';
    }
  },
  {
    headerName: 'Monedas',
    field: 'currencies',
    sortable: true,
    filter: true,
    flex: 1,
    valueGetter: (params) => {
      return Object.values(params.data.currencies || {})
        .map(curr => `${curr.name} (${curr.symbol})`)
        .join(', ') || 'N/A';
    }
  }
]);

const defaultColDef = {
  resizable: true,
  sortable: true,
  filter: true
};

const gridOptions = {
  pagination: true,
  paginationPageSize: 10,
  rowSelection: 'single',
  animateRows: true,
  enableCellTextSelection: true,
  suppressMovableColumns: false,
  suppressRowClickSelection: true,
  rowStyle: { cursor: 'pointer' }
};

// Event handlers
const onGridReady = (params) => {
  gridApi.value = params.api;
  params.api.sizeColumnsToFit();
};

const onRowClicked = (event) => {
  emit('rowClicked', event.data);
};

// Watch for dark mode changes
watch(() => props.isDarkMode, (newValue) => {
  const gridElement = document.querySelector('.ag-theme-alpine');
  if (gridElement) {
    if (newValue) {
      gridElement.classList.remove('ag-theme-alpine');
      gridElement.classList.add('ag-theme-alpine-dark');
    } else {
      gridElement.classList.remove('ag-theme-alpine-dark');
      gridElement.classList.add('ag-theme-alpine');
    }
  }
}, { immediate: true });

// Export functionality
const onExportClick = () => {
  if (gridApi.value) {
    gridApi.value.exportDataAsCsv({
      fileName: `countries_export_${new Date().toISOString().split('T')[0]}.csv`
    });
  }
};

// Emit events
const emit = defineEmits(['rowClicked']);

// Custom styles for dark mode
const darkModeStyles = `
  .ag-theme-alpine-dark .ag-row-hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
  }
`;

// Add custom styles to document
onMounted(() => {
  const styleElement = document.createElement('style');
  styleElement.textContent = darkModeStyles;
  document.head.appendChild(styleElement);
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Toolbar -->
    <div class="flex justify-end">
      <button
        @click="onExportClick"
        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V8a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Exportar CSV
      </button>
    </div>

    <!-- AG Grid -->
    <div
      :class="[
        isDarkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine',
        'w-full h-[600px] rounded-lg overflow-hidden'
      ]"
    >
      <AgGridVue
        :columnDefs="columnDefs"
        :rowData="countries"
        :defaultColDef="defaultColDef"
        :gridOptions="gridOptions"
        @grid-ready="onGridReady"
        @row-clicked="onRowClicked"
        class="w-full h-full"
      />
    </div>
  </div>
</template>

<style>
.ag-theme-alpine,
.ag-theme-alpine-dark {
  --ag-borders: none;
  --ag-row-hover-color: rgba(0, 0, 0, 0.1);
  --ag-selected-row-background-color: rgba(0, 0, 0, 0.05);
  --ag-font-family: inherit;
  --ag-font-size: 14px;
}

.ag-theme-alpine-dark {
  --ag-background-color: rgb(31, 41, 55);
  --ag-header-background-color: rgb(17, 24, 39);
  --ag-odd-row-background-color: rgba(255, 255, 255, 0.02);
  --ag-header-foreground-color: rgb(209, 213, 219);
  --ag-foreground-color: rgb(209, 213, 219);
  --ag-row-hover-color: rgba(255, 255, 255, 0.1);
  --ag-selected-row-background-color: rgba(255, 255, 255, 0.05);
}
</style> 