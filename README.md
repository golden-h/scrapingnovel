# Scraping Novel System

This project is a web application designed for scraping, translating, and displaying novels. It consists of a Next.js web application and a Chrome extension working together.

## System Requirements

- Node.js (Latest LTS version recommended)
- Chrome browser (Latest version)
- Internet connection for translation services
- Storage space for translated content

## Project Structure

- `/app`: Main application code
- `/components`: Reusable UI components
- `/services`: Backend services
- `/utils`: Utility functions
- `/storage`: Translation storage
- `/chrome-extension`: Browser extension code

## Installation

1. Install project dependencies:
```bash
npm install
```

2. Install the Chrome extension:
   - Open Chrome browser
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right corner)
   - Click "Load unpacked"
   - Select the `/chrome-extension` directory from this project

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Features

- Novel listing and chapter navigation
- Translation status tracking
- Chapter content display
- Filter system for translated/untranslated chapters
- Chrome extension for:
  - Content extraction from novel websites
  - Integration with ChatGPT for translation
  - Translation injection into web pages
  - Chapter status management

## Usage

1. Start the web application:
```bash
npm run dev
```

2. Ensure the Chrome extension is installed and enabled

3. Visit a supported novel website through Chrome

4. Use the extension to:
   - Extract novel content
   - Manage translations
   - Track chapter status

5. View translated content through the web application

## Notes

- The system uses ChatGPT for translations
- Translations are stored locally in JSON format
- Chapter status is tracked for translation progress
- The Chrome extension integrates with specific novel websites

## Troubleshooting

If you encounter any issues:

1. Ensure all dependencies are installed correctly
2. Check if the Chrome extension is properly loaded
3. Verify your internet connection for translation services
4. Check the storage directory permissions

For more detailed technical information, refer to `SYSTEM_DOCUMENTATION.txt`.
