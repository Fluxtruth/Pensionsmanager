import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import TarifDetailsPage from "./page";
import { supabase } from "@/lib/supabase/client";

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

const mockSelect = vi.fn();
const mockExecute = vi.fn();

vi.mock("@/lib/db", () => ({
    initDb: vi.fn().mockImplementation(() => Promise.resolve({
        select: mockSelect,
        execute: mockExecute,
    })),
}));

vi.mock("@/lib/supabase/client", () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { email: "testpension@example.de" } },
                error: null,
            }),
        },
    },
}));

vi.mock("@/lib/sync", () => ({
    SyncService: {
        getInstance: () => ({
            getPensionId: vi.fn().mockResolvedValue("test-pension-id"),
        }),
    },
    syncEvents: {
        on: vi.fn(),
        off: vi.fn(),
    }
}));

describe("Tarifdetails Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSelect.mockImplementation((query: string) => {
            if (query.includes("COUNT(*)")) {
                return Promise.resolve([{ count: 4 }]);
            }
            if (query.includes("customer_type")) {
                return Promise.resolve([{ value: "test" }]);
            }
            if (query.includes("branding_title")) {
                return Promise.resolve([{ value: "Pension Sonnenschein" }]);
            }
            return Promise.resolve([]);
        });
    });

    it("renders page header and active plan S when room count is 4", async () => {
        render(<TarifDetailsPage />);

        await waitFor(() => {
            expect(screen.getByText("Tarifdetails & Module")).toBeInTheDocument();
        });

        // Current plan should be S
        expect(screen.getAllByText(/Aktiver Plan: S-Small|Aktueller Tarif: S-Small/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/4 von 5 Zimmern/i)).toBeInTheDocument();
        expect(screen.getByText(/Noch 1 Zimmer im Tarif S verfügbar/i)).toBeInTheDocument();
    });

    it("displays customer types automatically in system overview", async () => {
        render(<TarifDetailsPage />);

        await waitFor(() => {
            expect(screen.getAllByText("Testkunde").length).toBeGreaterThan(0);
        });

        expect(screen.getByText("Ihr aktiver Kundentyp")).toBeInTheDocument();
        expect(screen.getByText("Kein Kunde")).toBeInTheDocument();
        expect(screen.getByText("Abonnent")).toBeInTheDocument();
        expect(screen.getByText("Enterprise-Kunde")).toBeInTheDocument();
    });

    it("displays all 3 greyed-out addon modules with request button", async () => {
        render(<TarifDetailsPage />);

        await waitFor(() => {
            expect(screen.getByText("Booking.com-Integration")).toBeInTheDocument();
            expect(screen.getByText("KI-Assistent")).toBeInTheDocument();
            expect(screen.getByText("KI-Rezeption")).toBeInTheDocument();
        });

        expect(screen.getAllByText(/Noch nicht verfügbar/i).length).toBeGreaterThanOrEqual(3);
    });

    it("opens request modal and sends email to info@pensionsmanager.de", async () => {
        render(<TarifDetailsPage />);

        await waitFor(() => {
            expect(screen.getByText("Booking.com-Integration")).toBeInTheDocument();
        });

        const requestButtons = screen.getAllByRole("button", { name: /Freischaltung anfragen/i });
        fireEvent.click(requestButtons[0]);

        await waitFor(() => {
            expect(screen.getByText(/Freischaltung anfragen: Booking.com-Integration/i)).toBeInTheDocument();
        });

        const form = screen.getByRole("dialog").querySelector("form");
        expect(form).not.toBeNull();
        if (form) {
            fireEvent.submit(form);
        }

        await waitFor(() => {
            expect(screen.getByText(/E-Mail-Anfrage vorbereitet/i)).toBeInTheDocument();
            expect(screen.getAllByText(/info@pensionsmanager.de/i).length).toBeGreaterThan(0);
        });
    });
});
