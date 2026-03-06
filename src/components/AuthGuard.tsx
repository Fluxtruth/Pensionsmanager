"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Sidebar } from "@/components/Sidebar";

// Client-side Supabase client (only uses public anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

                if (!session && !isAuthRoute) {
                    router.replace('/login');
                } else {
                    setIsAuthorized(true);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();

        // Set up a listener for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
            if (event === 'SIGNED_OUT' && !isAuthRoute) {
                router.replace('/login');
            } else if (event === 'SIGNED_IN' && isAuthRoute) {
                router.replace('/');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [pathname, router]);

    // Don't render main content until we've checked auth (prevents flash of content)
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
    if (!isAuthorized && !isAuthRoute) {
        return null; // Will redirect shortly
    }

    // If on an auth route, just render the children (no sidebar)
    if (isAuthRoute) {
        return <main className="h-full w-full">{children}</main>;
    }

    // If authorized and NOT on an auth route, render the standard layout structure expects children to be injected into
    return (
        <div className="flex h-full">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
                <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
