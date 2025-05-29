# WorldExplorer - Countries App

A modern web application built with Vue 3, TypeScript, and Tailwind CSS that allows users to explore information about countries around the world. The app includes features like weather information, time zones, country comparison, and more.

## Features

- 🌍 View detailed information about countries worldwide
- 🌤️ Real-time weather information for capital cities
- ⏰ Local time display for each country
- 📊 Multiple view options (Grid, List, Table)
- 🌓 Dark/Light mode support
- 💾 Favorites system with local storage
- 📱 Fully responsive design
- 🔄 Country comparison feature
- 📈 Interactive dashboard with statistics
- 🗺️ OpenStreetMap integration

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd WorldExplorer
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory and add your API keys:
```env
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_TIMEZONE_API_KEY=your_timezone_api_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Building for Production

```bash
npm run build
# or
yarn build
```

## Technologies Used

- Vue 3 with Composition API
- TypeScript
- Tailwind CSS
- Axios
- OpenWeather API
- TimezoneDB API
- OpenStreetMap

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
