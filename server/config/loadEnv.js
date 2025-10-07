// This file ensures the app loads environment variables in development
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// ...existing code...

// Place this at the top of your main server.js file, before any other imports that use process.env
