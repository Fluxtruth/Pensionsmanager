import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AccountPage from './page';
import { supabase } from '@/lib/supabase/client';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

vi.mock('@/lib/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
            signOut: vi.fn(),
        },
    },
}));

vi.mock('@/lib/db', () => ({
    initDb: vi.fn().mockResolvedValue({
        select: vi.fn().mockResolvedValue([]),
        execute: vi.fn().mockResolvedValue({}),
    }),
}));

vi.mock('@/lib/sync', () => ({
    SyncService: {
        getInstance: () => ({
            getPensionId: vi.fn().mockResolvedValue('test-pension-id'),
            clearSession: vi.fn(),
        }),
    },
}));

describe('Account Hub Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
            data: {
                user: {
                    id: 'user-123',
                    email: 'tester@pensionsmanager.app',
                    created_at: '2026-01-01T00:00:00.000Z',
                },
            },
            error: null,
        } as any);
    });

    it('renders user profile, PIN card and subpage hub cards', async () => {
        render(<AccountPage />);

        await waitFor(() => {
            expect(screen.getByText('Mein Account')).toBeInTheDocument();
            expect(screen.getByText('tester@pensionsmanager.app')).toBeInTheDocument();
        });

        // Verify PIN card
        expect(screen.getByText('PIN-Sperre')).toBeInTheDocument();

        // Verify Subpage Hub section
        expect(screen.getByText('Verwaltung & Systembereiche')).toBeInTheDocument();

        // Verify all 6 subpage tiles are present
        expect(screen.getByText('Konfiguration')).toBeInTheDocument();
        expect(screen.getByText('Datenbank & Datensicherheit')).toBeInTheDocument();
        expect(screen.getByText('System-Dokumentation')).toBeInTheDocument();
        expect(screen.getByText('Update & Versionshinweise')).toBeInTheDocument();
        expect(screen.getByText('Tarifdetails & Module')).toBeInTheDocument();
        expect(screen.getByText('Rechtsdokumente & Compliance')).toBeInTheDocument();
    });
});
