# মোল্লা নীড়

A modern desktop application for managing renters and calculating monthly bills.

## Features

- **Renter Management**: Add, edit, and delete renter profiles.
- **Monthly Billing**: Input current meter readings and calculate bills automatically (Electricity, Rent, Fees).
- **History**: View and search past billing records.
- **Receipt Generation**: Generate printable invoices and export them as PDF.
- **Analytics**: Simple dashboard showing total renters and income trends.
- **Dark/Light Mode**: Toggle between themes for comfort.
- **Local Database**: All data is stored locally using SQLite.

## Tech Stack

- **Electron.js**: Desktop framework.
- **React**: UI library.
- **Tailwind CSS**: Styling.
- **better-sqlite3**: Local database.
- **Lucide React**: Icons.
- **Recharts**: Dashboard charts.
- **jsPDF**: PDF generation.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository (or navigate to the project folder).
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the application in development mode:

```bash
npm run dev
```

### Building for Production

To package the application for Windows:

```bash
npm run build:win
```

The output will be in the `dist` folder.

## Project Structure

- `src/main`: Electron main process logic (DB, IPC handlers).
- `src/preload`: IPC bridge between main and renderer.
- `src/renderer`: React frontend (Pages, Components, Styles).
- `package.json`: Project dependencies and scripts.

## License

MIT
