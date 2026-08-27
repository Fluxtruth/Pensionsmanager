export interface PricingPlan {
    id: "S" | "M" | "L";
    name: string;
    tagline: string;
    minRooms: number;
    maxRooms: number | null; // null for unlimited / L
    pricePerMonth: string;
    description: string;
    features: string[];
    isPopular?: boolean;
}

export type CustomerTypeKey = "test" | "subscriber" | "enterprise";

export interface CustomerType {
    id: CustomerTypeKey;
    label: string;
    tagline: string;
    badgeVariant: "default" | "secondary" | "outline";
    colorClass: string;
    description: string;
}

export interface AddonModule {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    status: "locked";
    category: "Integration" | "Künstliche Intelligenz" | "Automatisierung";
    highlightFeatures: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
    {
        id: "S",
        name: "S-Small",
        tagline: "Bis 5 Zimmer",
        minRooms: 1,
        maxRooms: 5,
        pricePerMonth: "24,99 €",
        description: "Ideal für Ferienwohnungen und kleine Pensionen.",
        features: [
            "Bis zu 5 Zimmer verwalten",
            "Alle Funktionen inklusive",
            "Echtzeit-Buchungsplan & Kalender",
            "Offline-Modus (Lokale SQLite)",
            "Cloud-Synchronisation"
        ]
    },
    {
        id: "M",
        name: "M-Medium",
        tagline: "Bis 15 Zimmer",
        minRooms: 6,
        maxRooms: 15,
        pricePerMonth: "34,99 €",
        description: "Perfekt für wachsende Betriebe.",
        isPopular: true,
        features: [
            "Bis zu 15 Zimmer verwalten",
            "Alle Funktionen inklusive",
            "Echtzeit-Buchungsplan & Kalender",
            "Offline-Modus (Lokale SQLite)",
            "Cloud-Synchronisation"
        ]
    },
    {
        id: "L",
        name: "L-Large",
        tagline: "Ab 16 Zimmern",
        minRooms: 16,
        maxRooms: null,
        pricePerMonth: "44,99 €",
        description: "Die Lösung für größere Häuser.",
        features: [
            "Ab 16 Zimmern (Unbegrenzt)",
            "Alle Funktionen inklusive",
            "Echtzeit-Buchungsplan & Kalender",
            "Offline-Modus (Lokale SQLite)",
            "Cloud-Synchronisation"
        ]
    }
];

export const CUSTOMER_TYPES: Record<CustomerTypeKey, CustomerType> = {
    test: {
        id: "test",
        label: "Testkunde",
        tagline: "Alpha-Tester & Pilotbetrieb",
        badgeVariant: "secondary",
        colorClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        description: "Individuell vereinbarter Testzugang zum Erproben von Vorabversionen (Early Alpha) ohne reguläres Abonnement."
    },
    subscriber: {
        id: "subscriber",
        label: "Abonnent",
        tagline: "Reguläres Abonnement",
        badgeVariant: "default",
        colorClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        description: "Monatlich kündbares Standard-Abonnement mit vollem Funktionsumfang."
    },
    enterprise: {
        id: "enterprise",
        label: "Enterprise-Kunde",
        tagline: "Großbetrieb & Individuell",
        badgeVariant: "outline",
        colorClass: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        description: "Individuelle Vereinbarung für Mehrbetriebs-Strukturen oder maßgeschneiderte Anforderungen."
    }
};

export const ADDON_MODULES: AddonModule[] = [
    {
        id: "booking-com",
        title: "Booking.com-Integration",
        subtitle: "OTAs & Channel-Manager",
        category: "Integration",
        status: "locked",
        description: "Automatische Zwei-Wege-Synchronisation von Belegungszeiten, Zimmerkontingenten und Preisen mit Booking.com. Direkter Import neuer Buchungen ohne manuellen Aufwand.",
        highlightFeatures: [
            "Zwei-Wege-Kalenderabgleich",
            "Vermeidung von Doppelbelegungen",
            "Automatischer Buchungsimport in Echtzeit"
        ]
    },
    {
        id: "ai-assistant",
        title: "KI-Assistent",
        subtitle: "Intelligente Gästekommunikation",
        category: "Künstliche Intelligenz",
        status: "locked",
        description: "Intelligenter Assistent für automatisierte Gäste-Mails, personalisierte Begrüßungsschreiben, Rechnungsbegleittexte und schnelle Beantwortung häufiger Gästefragen.",
        highlightFeatures: [
            "Automatische E-Mail-Vorschläge",
            "Personalisierte Gästekommunikation",
            "KI-gestützte Dokumentenerstellung"
        ]
    },
    {
        id: "ai-reception",
        title: "KI-Rezeption",
        subtitle: "24/7 Digitaler Empfang",
        category: "Automatisierung",
        status: "locked",
        description: "Vollautomatisierter digitaler Check-In & telefonischer KI-Empfang für Ihre Gäste rund um die Uhr. Intelligente Schlüsselcode-Vergabe und Auskunft zu Hausregeln.",
        highlightFeatures: [
            "24/7 telefonische Erreichbarkeit",
            "Automatisierter Self Check-In",
            "Smarte Beantwortung von Anfragen vor Ort"
        ]
    }
];

export const CORE_FEATURES = [
    {
        name: "Echtzeit-Buchungsplan & Kalender",
        description: "Interaktive grafische Belegungsübersicht mit Drag & Drop und schneller Navigation.",
        category: "Buchungsmanagement"
    },
    {
        name: "Zimmer- & Kontingentverwaltung",
        description: "Verwaltung von Zimmernummern, Bettenarten, Ausstattungsmerkmalen und Preisen.",
        category: "Zimmerverwaltung"
    },
    {
        name: "Digitale Gästekartei",
        description: "Vollständige DSGVO-konforme Gästedatenbank mit Historie, Ausweisen und Kontakten.",
        category: "Gästemanagement"
    },
    {
        name: "Reinigungs- & Aufgabenverwaltung",
        description: "Automatischer Reinigungsstatus, Zimmerfreigaben und Übergabeprotokolle.",
        category: "Housekeeping"
    },
    {
        name: "Frühstücks- & Versorgungsliste",
        description: "Tagesaktuelle Übersichten von Frühstücksgästen, Sonderwünschen und Allergien.",
        category: "Service"
    },
    {
        name: "Tourismusmeldung & Meldeschein-Export",
        description: "Erfassung von Kurtaxen, Meldescheinen und behördengerechte Auswertungen.",
        category: "Compliance"
    },
    {
        name: "Lokale SQLite-Datenbank (Offline-Fähig)",
        description: "Höchste Ausfallsicherheit: Die App läuft auch bei Internetausfall vollständig lokal.",
        category: "Sicherheit"
    },
    {
        name: "End-to-End verschlüsselte Cloud-Synchronisation",
        description: "Automatischer verschlüsselter Abgleich aller Arbeitsplätze über Supabase.",
        category: "Sicherheit"
    }
];

export interface CalculatedPlanInfo {
    plan: PricingPlan;
    roomCount: number;
    roomsLimit: number | null;
    roomsRemainingInTier: number;
    nextPlan: PricingPlan | null;
    progressPercentage: number;
    upgradeNotice: string;
}

export function calculatePlanInfo(roomCount: number): CalculatedPlanInfo {
    const validCount = Math.max(0, roomCount);

    if (validCount <= 5) {
        const plan = PRICING_PLANS[0]; // S
        const nextPlan = PRICING_PLANS[1]; // M
        const limit = 5;
        const remaining = Math.max(0, limit - validCount);
        const progress = Math.min(100, (validCount / limit) * 100);
        const upgradeNotice = remaining === 0
            ? "Maximales Kontingent in Tarif S erreicht. Bei Anlage des nächsten Zimmers erfolgt der Wechsel zu Tarif M."
            : `Noch ${remaining} ${remaining === 1 ? "Zimmer" : "Zimmer"} im Tarif S verfügbar (bis Wechsel zu Tarif M).`;

        return {
            plan,
            roomCount: validCount,
            roomsLimit: limit,
            roomsRemainingInTier: remaining,
            nextPlan,
            progressPercentage: progress,
            upgradeNotice
        };
    } else if (validCount <= 15) {
        const plan = PRICING_PLANS[1]; // M
        const nextPlan = PRICING_PLANS[2]; // L
        const limit = 15;
        const remaining = Math.max(0, limit - validCount);
        const progress = Math.min(100, ((validCount - 5) / 10) * 100);
        const upgradeNotice = remaining === 0
            ? "Maximales Kontingent in Tarif M erreicht. Bei Anlage des nächsten Zimmers erfolgt der Wechsel zu Tarif L."
            : `Noch ${remaining} ${remaining === 1 ? "Zimmer" : "Zimmer"} im Tarif M verfügbar (bis Wechsel zu Tarif L).`;

        return {
            plan,
            roomCount: validCount,
            roomsLimit: limit,
            roomsRemainingInTier: remaining,
            nextPlan,
            progressPercentage: progress,
            upgradeNotice
        };
    } else {
        const plan = PRICING_PLANS[2]; // L
        return {
            plan,
            roomCount: validCount,
            roomsLimit: null,
            roomsRemainingInTier: Infinity,
            nextPlan: null,
            progressPercentage: 100,
            upgradeNotice: "Unbegrenztes Zimmerkontingent im Tarif L aktiv."
        };
    }
}
