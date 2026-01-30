/**
 * Healio.AI - Main Application Entry
 */

import { App } from './app.js';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    const app = new App('#app');
    app.init();
});
