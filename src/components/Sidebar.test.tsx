import { render, screen, waitFor } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { vi, describe, it, expect } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: () => '/',
}));

// Mock SyncService
vi.mock('@/lib/sync', () => ({
    SyncService: {
        getInstance: () => ({
            getPensionId: vi.fn().mockResolvedValue('test-pension-id')
        })
    }
}));

// Mock the DB
vi.mock('@/lib/db', () => ({
    initDb: vi.fn().mockResolvedValue({
        select: vi.fn().mockImplementation(async (query: string, params?: any[]) => {
            return [
                { key: 'branding_title', value: 'Test Pension' },
                { key: 'branding_logo', value: '/test-logo.png' }
            ];
        }),
        execute: vi.fn()
    })
}));

describe('Sidebar Component', () => {
    it('renders correctly with default values', async () => {
        render(<Sidebar isOpen={true} onClose={() => {}} />);

        // Check if primary navigation items are present
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Zimmer')).toBeInTheDocument();
        expect(screen.getByText('Buchungen')).toBeInTheDocument();
        expect(screen.getByText('Mein Account')).toBeInTheDocument();
        expect(screen.getByText('Impressum')).toBeInTheDocument();

        // Ensure subpages are NOT rendered in the sidebar
        expect(screen.queryByText('Konfiguration')).not.toBeInTheDocument();
        expect(screen.queryByText('Datenbank')).not.toBeInTheDocument();
        expect(screen.queryByText('System-Dokumentation')).not.toBeInTheDocument();
        expect(screen.queryByText('Update & Versionshinweise')).not.toBeInTheDocument();
    });

    it('loads branding title and logo from db', async () => {
        render(<Sidebar isOpen={true} onClose={() => {}} />);

        // Wait for useEffect to load the mock DB values
        const titleElement = await screen.findByText('Test Pension', {}, { timeout: 2000 });
        expect(titleElement).toBeInTheDocument();

        const logoImg = screen.getByAltText('Logo');
        expect(logoImg).toHaveAttribute('src', '/test-logo.png');
    });
});
