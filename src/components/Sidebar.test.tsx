import { render, screen, waitFor } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { vi, describe, it, expect } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: () => '/',
}));

// Mock the DB
vi.mock('@/lib/db', () => ({
    initDb: vi.fn().mockResolvedValue({
        select: vi.fn().mockImplementation(async (query: string, params?: any[]) => {
            if (params && params.includes('branding_title')) {
                return [{ value: 'Test Pension' }];
            }
            if (params && params.includes('branding_logo')) {
                return [{ value: '/test-logo.png' }];
            }
            return [];
        }),
        execute: vi.fn()
    })
}));

describe('Sidebar Component', () => {
    it('renders correctly with default values', async () => {
        render(<Sidebar isOpen={true} onClose={() => {}} />);

        // Check if basic navigation items are present
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Zimmer')).toBeInTheDocument();
        expect(screen.getByText('Buchungen')).toBeInTheDocument();
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
