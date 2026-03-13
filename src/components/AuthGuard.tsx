"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { initDb } from "@/lib/db";
import { PinEntry } from "@/components/PinEntry";
import { SyncService } from "@/lib/sync";
import { Menu, X } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [appPin, setAppPin] = useState<string | null>(null);
    const [isPinEnabled, setIsPinEnabled] = useState(true);
    const [isPinVerified, setIsPinVerified] = useState(false);
    const [hasSession, setHasSession] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const syncService = SyncService.getInstance();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setHasSession(!!session);

                const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
                const isPublicRoute = isAuthRoute || pathname === '/impressum';

                if (!session && !isPublicRoute) {
                    router.replace('/login');
                } else {
                    if (session && !isAuthRoute) {
                        await syncService.initializeWebContext();
                        // Start Auto-Sync automatically as soon as we have a session
                        if (!syncService.isAutoSyncActive()) {
                            console.log("[AuthGuard] Starting background auto-sync...");
                            syncService.startAutoSync();
                        }
                    }
                    
                    setIsAuthorized(true);

                    // Check for local PIN
                    if (session && !isAuthRoute) {
                        const db = await initDb();
                        if (db) {
                            const settings = await db.select<any[]>("SELECT key, value FROM settings WHERE key IN ('app_pin', 'is_pin_enabled')");
                            const pinSetting = settings.find(s => s.key === 'app_pin');
                            const enabledSetting = settings.find(s => s.key === 'is_pin_enabled');
                            
                            if (pinSetting) {
                                setAppPin(pinSetting.value);
                                setIsPinEnabled(enabledSetting?.value !== 'false');
                            } else {
                                setIsPinVerified(true); // No PIN set
                            }
                        } else {
                            setIsPinVerified(true); // No DB, continue
                        }
                    } else {
                        setIsPinVerified(true); // Auth route or no session
                    }
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsPinVerified(true); // Fail open
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setHasSession(!!session);
            const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

            if (event === 'SIGNED_OUT' && !isAuthRoute) {
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
                const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
                if (!isAuthRoute) {
                    router.replace('/login');
                }
                return;
            }
            originalConsoleError.apply(console, args);
        };
        console.error = authErrorHandler;

        const handleManualLock = () => {
            setIsPinVerified(false);
        };
        window.addEventListener('app-lock', handleManualLock);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('app-lock', handleManualLock);
            console.error = originalConsoleError;
        };
    }, [pathname, router]);

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
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

    const isLocked = isAuthorized && isPinEnabled && !isPinVerified;

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

    // Standard Layout with Sidebar (Only for authorized + verified users on non-auth routes)
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
                    <div className="w-10" /> {/* Spacer */}
                </div>
                <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
