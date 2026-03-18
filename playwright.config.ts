import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 30000,
    fullyParallel: false,
    workers: 1,
    preserveOutput: 'never',
    use: {
        trace: 'on',
        baseURL: 'http://localhost:3002',
    },
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3002',
        reuseExistingServer: true,
        timeout: 120 * 1000,
    },
});
