import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 180000, // 3 minutes for the full journey
    outputDir: './test-results-' + Date.now(),
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on',
        video: 'on',
        screenshot: 'on',
    },
});
