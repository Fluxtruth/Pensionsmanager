import { render, screen, fireEvent } from '@testing-library/react';
import UpdatesPage from './page';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href, className }: any) => (
        <a href={href} className={className}>{children}</a>
    )
}));

describe('Updates & Release Notes Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders header, software update card and release history', () => {
        render(<UpdatesPage />);

        expect(screen.getByRole('heading', { level: 2, name: 'Update & Versionshinweise' })).toBeInTheDocument();
        expect(screen.getByText('Software-Update')).toBeInTheDocument();
        expect(screen.getByText('Versionshinweise & Release-Historie')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Nach Updates suchen/i })).toBeInTheDocument();
    });

    it('displays release notes entries and current version badge', () => {
        render(<UpdatesPage />);

        expect(screen.getAllByText('v1.11.15').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Aktuell')).toBeInTheDocument();
        expect(screen.getByText('Fenster-Status-Persistierung & E2E-Optimierungen')).toBeInTheDocument();
        expect(screen.getByText('v1.11.14')).toBeInTheDocument();
    });

    it('filters releases by search query', () => {
        render(<UpdatesPage />);

        const searchInput = screen.getByPlaceholderText('Suche in Releases...');
        fireEvent.change(searchInput, { target: { value: 'Frühstück' } });

        expect(screen.getByText('v1.11.6')).toBeInTheDocument();
        expect(screen.queryByText('Fenster-Status-Persistierung & E2E-Optimierungen')).not.toBeInTheDocument();
    });

    it('filters releases by type filter button', () => {
        render(<UpdatesPage />);

        const fixesBtn = screen.getByRole('button', { name: 'Fixes' });
        fireEvent.click(fixesBtn);

        // v1.11.15 has fix, so it should be visible
        expect(screen.getAllByText('v1.11.15').length).toBeGreaterThanOrEqual(1);
    });

    it('handles update check button click', () => {
        window.alert = vi.fn();

        render(<UpdatesPage />);

        const checkBtn = screen.getByRole('button', { name: /Nach Updates suchen/i });
        fireEvent.click(checkBtn);

        // In web (happy-dom), alert is shown
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Desktop-App'));
    });
});
