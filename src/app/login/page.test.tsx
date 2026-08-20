import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LoginPage from './page';
import { supabase } from '@/lib/supabase/client';
import { getGermanAuthError } from '@/lib/auth-errors';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

vi.mock('@/lib/supabase/client', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
            resetPasswordForEmail: vi.fn(),
        },
    },
}));

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('handles standard login successfully', async () => {
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
            data: { user: { id: 'test-user-id' }, session: {} },
            error: null,
        } as any);

        render(<LoginPage />);

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
            target: { value: 'user@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: { value: 'secret123' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Anmelden/i }));

        await waitFor(() => {
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'user@example.com',
                password: 'secret123',
            });
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    it('toggles forgot password mode and sends password reset email', async () => {
        vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
            data: {},
            error: null,
        } as any);

        render(<LoginPage />);

        // Click "Passwort vergessen?" button
        fireEvent.click(screen.getByText('Passwort vergessen?'));

        // Check header title changes to "Passwort zurücksetzen"
        expect(screen.getByText('Passwort zurücksetzen')).toBeInTheDocument();

        // Fill in email
        fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
            target: { value: 'reset@example.com' },
        });

        // Click send reset link
        fireEvent.click(screen.getByRole('button', { name: /Passwort-Reset-Link senden/i }));

        await waitFor(() => {
            expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
                'reset@example.com',
                expect.objectContaining({
                    redirectTo: expect.stringContaining('/reset-password'),
                })
            );
            expect(screen.getByText(/Wenn ein Konto mit dieser E-Mail-Adresse existiert/i)).toBeInTheDocument();
        });
    });

    it('allows returning back to login from reset mode', () => {
        render(<LoginPage />);

        fireEvent.click(screen.getByText('Passwort vergessen?'));
        expect(screen.getByText('Passwort zurücksetzen')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Zurück zum Login'));
        expect(screen.getByText('Willkommen zurück')).toBeInTheDocument();
    });
});
