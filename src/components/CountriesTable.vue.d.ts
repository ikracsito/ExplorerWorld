declare const CountriesTable: import('vue').DefineComponent<{
  countries: {
    type: Array;
    required: true;
  };
  isDarkMode: {
    type: Boolean;
    required: true;
  };
}, {}, any>

export default CountriesTable 