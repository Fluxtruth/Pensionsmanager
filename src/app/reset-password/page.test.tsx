import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ResetPasswordPage from './page';
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
            updateUser: vi.fn(),
            getSession: vi.fn().mockResolvedValue({ data: { session: { user: {} } } }),
        },
    },
}));

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows error if passwords do not match', async () => {
        render(<ResetPasswordPage />);

        const inputs = screen.getAllByPlaceholderText('••••••••');
        fireEvent.change(inputs[0], { target: { value: 'newpassword123' } });
        fireEvent.change(inputs[1], { target: { value: 'differentpassword' } });

        fireEvent.click(screen.getByRole('button', { name: /Passwort speichern/i }));

        await waitFor(() => {
            expect(screen.getByText(/Die eingegebenen Passwörter stimmen nicht überein/i)).toBeInTheDocument();
        });
        expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('shows error if password is too short', async () => {
        render(<ResetPasswordPage />);

        const inputs = screen.getAllByPlaceholderText('••••••••');
        fireEvent.change(inputs[0], { target: { value: '12345' } });
        fireEvent.change(inputs[1], { target: { value: '12345' } });

        fireEvent.click(screen.getByRole('button', { name: /Passwort speichern/i }));

        await waitFor(() => {
            expect(screen.getByText(/Das Passwort muss mindestens 6 Zeichen lang sein/i)).toBeInTheDocument();
        });
        expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('updates password successfully and offers navigation to login', async () => {
        vi.mocked(supabase.auth.updateUser).mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
        } as any);

        render(<ResetPasswordPage />);

        const inputs = screen.getAllByPlaceholderText('••••••••');
        fireEvent.change(inputs[0], { target: { value: 'newpassword123' } });
        fireEvent.change(inputs[1], { target: { value: 'newpassword123' } });

        fireEvent.click(screen.getByRole('button', { name: /Passwort speichern/i }));

        await waitFor(() => {
            expect(supabase.auth.updateUser).toHaveBeenCalledWith({
                password: 'newpassword123',
            });
            expect(screen.getByText(/Ihr Passwort wurde erfolgreich aktualisiert/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Zum Login/i }));
        expect(mockPush).toHaveBeenCalledWith('/login');
    });
});
