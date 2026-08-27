import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AccountRechtlichesPage from './page';

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

describe('Account Legal & Compliance Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders header, description and all legal documents', () => {
        render(<AccountRechtlichesPage />);

        expect(screen.getByRole('heading', { level: 2, name: 'Rechtsdokumente & Compliance' })).toBeInTheDocument();
        expect(screen.getByText('Pilotvereinbarung')).toBeInTheDocument();
        expect(screen.getByText('Auftragsverarbeitungsvertrag (AVV / DPA)')).toBeInTheDocument();
        expect(screen.getByText('Technische & Organisatorische Maßnahmen (TOMs)')).toBeInTheDocument();
        expect(screen.getByText('Geheimhaltungsvereinbarung (NDA)')).toBeInTheDocument();
        expect(screen.getByText('Datenschutzerklärung (Privacy Policy)')).toBeInTheDocument();
        expect(screen.getByText('TIA-Bewertung (Transfer Impact Assessment)')).toBeInTheDocument();
        expect(screen.getByText('AGB & Nutzungsbedingungen')).toBeInTheDocument();
        expect(screen.getByText('Impressum & Anbieterkennzeichnung')).toBeInTheDocument();
    });

    it('filters documents by category', () => {
        render(<AccountRechtlichesPage />);

        // Filter DSGVO
        fireEvent.click(screen.getByRole('button', { name: 'DSGVO' }));
        expect(screen.getByText('Auftragsverarbeitungsvertrag (AVV / DPA)')).toBeInTheDocument();
        expect(screen.getByText('Datenschutzerklärung (Privacy Policy)')).toBeInTheDocument();
        expect(screen.getByText('TIA-Bewertung (Transfer Impact Assessment)')).toBeInTheDocument();
        expect(screen.queryByText('Pilotvereinbarung')).not.toBeInTheDocument();

        // Filter Vertrag
        fireEvent.click(screen.getByRole('button', { name: 'Vertrag' }));
        expect(screen.getByText('Pilotvereinbarung')).toBeInTheDocument();
        expect(screen.getByText('Geheimhaltungsvereinbarung (NDA)')).toBeInTheDocument();
        expect(screen.queryByText('Datenschutzerklärung (Privacy Policy)')).not.toBeInTheDocument();
    });

    it('opens document viewer dialog on click', () => {
        render(<AccountRechtlichesPage />);

        const viewButtons = screen.getAllByRole('button', { name: /Ansehen/i });
        fireEvent.click(viewButtons[0]);

        expect(screen.getByText(/Tipp: Klicken Sie auf/i)).toBeInTheDocument();
    });
});
