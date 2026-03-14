import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import RegisterPage from './page';
import { supabase } from '@/lib/supabase/client';
import { getGermanAuthError } from '@/lib/auth-errors';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
    supabase: {
        auth: {
            signUp: vi.fn(),
        },
    },
}));

describe('RegisterPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows error message if user already exists (empty identities)', async () => {
        const mockSignUp = vi.mocked(supabase.auth.signUp).mockResolvedValue({
            data: {
                user: {
                    id: 'test-user-id',
                    email: 'test@example.com',
                    identities: [], // Empty identities means user already exists in Supabase "masking" mode
                },
                session: null,
            },
            error: null,
        } as any);

        render(<RegisterPage />);

        // Fill in the form
        fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: { value: 'password123' },
        });

        // Submit the form
        fireEvent.click(screen.getByRole('button', { name: /Registrieren/i }));

        // Wait for the error message
        await waitFor(() => {
            const expectedError = getGermanAuthError("User already registered");
            expect(screen.getByText(expectedError)).toBeInTheDocument();
        });

        expect(mockSignUp).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
            options: {
                emailRedirectTo: expect.stringContaining('/login'),
            },
        });
    });

    it('shows success message if registration is successful (has identities)', async () => {
        vi.mocked(supabase.auth.signUp).mockResolvedValue({
            data: {
                user: {
                    id: 'test-user-id',
                    email: 'new@example.com',
                    identities: [{ id: 'identity-id' }], // Has identities means new user
                },
                session: null,
            },
            error: null,
        } as any);

        render(<RegisterPage />);

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
            target: { value: 'new@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: { value: 'password123' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Registrieren/i }));

        await waitFor(() => {
            expect(screen.getByText(/Registrierung erfolgreich/i)).toBeInTheDocument();
        });
    });
});
