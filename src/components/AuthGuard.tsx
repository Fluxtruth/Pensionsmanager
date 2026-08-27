"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { initDb } from "@/lib/db";
import { PinEntry } from "@/components/PinEntry";
import { SyncService } from "@/lib/sync";
import { Menu, X, Lock, CreditCard, ArrowRight, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [appPin, setAppPin] = useState<string | null>(null);
    const [isPinEnabled, setIsPinEnabled] = useState(true);
    const [isPinVerified, setIsPinVerified] = useState(false);
    const [customerType, setCustomerType] = useState<string>("test");
    const [hasSession, setHasSession] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const syncService = SyncService.getInstance();

    const loadAppSettings = async (pensionId: string | null) => {
        try {
            const db = await initDb(pensionId || undefined);
            if (db) {
                const settings = await db.select<any[]>(
                    "SELECT key, value, pension_id FROM settings WHERE key IN ('app_pin', 'is_pin_enabled', 'customer_type', 'stripe_subscription_status') AND (pension_id = ? OR pension_id IS NULL)",
                    [pensionId]
                );

                const findSetting = (key: string) => {
                    const matching = settings.find(s => s.key === key && s.pension_id === pensionId);
                    return matching || settings.find(s => s.key === key);
                };

                const pinSetting = findSetting('app_pin');
                const enabledSetting = findSetting('is_pin_enabled');
                const custTypeSetting = findSetting('customer_type');

                if (custTypeSetting) {
                    setCustomerType(custTypeSetting.value);
                }

                if (pinSetting) {
                    setAppPin(pinSetting.value);
                    const enabled = enabledSetting?.value !== 'false';
                    setIsPinEnabled(enabled);
                    if (!enabled) setIsPinVerified(true);
                } else {
                    setIsPinVerified(true);
                }
            } else {
                setIsPinVerified(true);
            }
        } catch (err) {
            console.error("Failed to load app settings:", err);
            setIsPinVerified(true);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setHasSession(!!session);

                const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/reset-password');
                const isPublicRoute = isAuthRoute || pathname === '/impressum';

                if (!session && !isPublicRoute) {
                    router.replace('/login');
                } else {
                    if (session && !isAuthRoute) {
                        await syncService.initializeWebContext();
                        if (!syncService.isAutoSyncActive()) {
                            console.log("[AuthGuard] Starting background auto-sync...");
                            syncService.startAutoSync();
                        }
                    }
                    
                    setIsAuthorized(true);

                    if (session && !isAuthRoute) {
                        const pensionId = await syncService.getPensionId();
                        await loadAppSettings(pensionId);
                    } else {
                        setIsPinVerified(true);
                    }
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsPinVerified(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setHasSession(!!session);
            const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/reset-password');

            if (event === 'SIGNED_OUT' && !isAuthRoute) {
                SyncService.getInstance().clearSession();
                router.replace('/login');
            } else if (event === 'SIGNED_IN' && isAuthRoute) {
                router.replace('/');
            } else if (event === 'TOKEN_REFRESHED' && !session) {
                console.warn("[Auth] Token refresh failed");
                supabase.auth.signOut().catch(() => {});
                router.replace('/login');
            }
        });

        const originalConsoleError = console.error;
        const authErrorHandler = (...args: any[]) => {
            const errorMsg = args.map(a => String(a)).join(' ');
            if (errorMsg.includes('Refresh Token Not Found') || errorMsg.includes('Invalid Refresh Token')) {
                console.warn("[Auth] Invalid refresh token detected");
                supabase.auth.signOut().catch(() => {});
                const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/reset-password');
                if (!isAuthRoute) {
                    router.replace('/login');
                }
                return;
            }
            if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('fetch failed')) {
                console.warn("[Auth/Network] Supabase fetch failed (offline or network issue):", errorMsg);
                return;
            }
            originalConsoleError.apply(console, args);
        };
        console.error = authErrorHandler;

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            const message = reason?.message || String(reason || '');
            if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('fetch failed')) {
                console.warn("[Network] Suppressed unhandled network rejection:", message);
                event.preventDefault();
            }
        };
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        const handleManualLock = () => {
            if (isPinEnabled) {
                setIsPinVerified(false);
            }
        };

        const reloadSettings = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const isAuth = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/reset-password');
                if (session && !isAuth) {
                    const pensionId = await syncService.getPensionId();
                    await loadAppSettings(pensionId);
                }
            } catch (err) {
                console.error("Failed to reload settings:", err);
            }
        };

        window.addEventListener('app-lock', handleManualLock);
        window.addEventListener('settings-changed', reloadSettings);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('app-lock', handleManualLock);
            window.removeEventListener('settings-changed', reloadSettings);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            console.error = originalConsoleError;
        };
    }, [pathname, router]);

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/reset-password');
    const isPublicRoute = isAuthRoute || pathname === '/impressum';

    // Don't render main content until we've checked auth
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthorized && !isPublicRoute) {
        return null;
    }

    // A lock should trigger if they are NOT verified, as long as a PIN actually exists AND is enabled
    const isLocked = isAuthorized && isPinEnabled && appPin && !isPinVerified;

    if (isLocked && !isPublicRoute) {
        return (
            <div className="h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                <PinEntry 
                    correctPin={appPin || ""} 
                    onSuccess={() => setIsPinVerified(true)} 
                    onCancel={() => {
                        supabase.auth.signOut();
                        router.replace('/login');
                    }}
                    onSwitchToPassword={() => {
                        supabase.auth.signOut();
                        router.replace('/login');
                    }}
                />
            </div>
        );
    }

    // showSidebar only if we HAVE A SESSION and are NOT LOCKED and NOT on an auth route
    const showSidebar = hasSession && isAuthorized && !isLocked && !isAuthRoute;

    if (!showSidebar) {
        return <main className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950">{children}</main>;
    }

    // Check if subscription is missing ("none" / Kein Kunde)
    const isSubscriptionLocked = customerType === "none";
    const isExemptFromSubscriptionLock = 
        pathname.startsWith('/account') ||
        pathname.startsWith('/impressum') ||
        pathname.startsWith('/agb') ||
        pathname.startsWith('/datenschutz') ||
        pathname.startsWith('/dokumentation') ||
        pathname.startsWith('/success');

    // Standard Layout with Sidebar
    return (
        <div className="flex h-full">
            {/* Backdrop for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
                <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-zinc-900 dark:text-white">Pensionsmanager</span>
                    <div className="w-10" />
                </div>
                <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
                    {isSubscriptionLocked && !isExemptFromSubscriptionLock ? (
                        <div className="min-h-[70vh] flex items-center justify-center p-4">
                            <Card className="max-w-lg w-full text-center border-rose-200 dark:border-rose-900 shadow-xl bg-white dark:bg-zinc-900/90 backdrop-blur-md">
                                <CardHeader className="pb-3">
                                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                                        <Lock className="w-8 h-8" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                                        Abonnement erforderlich
                                    </CardTitle>
                                    <CardDescription className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
                                        Für Ihre Pension liegt derzeit kein aktives Abonnement vor (Status: <strong>Kein Kunde</strong>). Die Verwaltungsfunktionen sind vorübergehend gesperrt.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-1">
                                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-300 text-left space-y-1.5">
                                        <div className="font-semibold flex items-center gap-1.5">
                                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                                            Gesperrte Bereiche:
                                        </div>
                                        <div>• Zimmerverwaltung & Belegungsplan</div>
                                        <div>• Kalender, Buchungen & Gästedatenbank</div>
                                        <div>• Reinigungsplan & Meldescheine</div>
                                    </div>

                                    <p className="text-xs text-zinc-500">
                                        Wählen Sie jetzt einen passenden Tarif für Ihre Zimmeranzahl, um alle Funktionen unmittelbar wieder freizuschalten.
                                    </p>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <Link href="/account/tarif" className="flex-1">
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
                                                <CreditCard className="w-4 h-4" />
                                                Tarif wählen & Abo aktivieren
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </main>
        </div>
    );
}
