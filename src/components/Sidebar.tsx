"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    BedDouble,
    CalendarDays,
    CalendarRange,
    Users,
    Eraser,
    Coffee,
    BarChart3,
    Settings,
    Database,
    Palette,
    Download,
    User,
    Lightbulb,
    Bug,
    Lock,
    X,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initDb } from "@/lib/db";
import { check } from "@tauri-apps/plugin-updater";
import { FeedbackDialog } from "./FeedbackDialog";

// ... existing navigation const ...
const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Zimmer", href: "/zimmer", icon: BedDouble },
    { name: "Kalender", href: "/kalender", icon: CalendarRange },
    { name: "Buchungen", href: "/buchungen", icon: CalendarDays },
    { name: "Gäste", href: "/gaeste", icon: Users },
    { name: "Reinigungsplan", href: "/reinigung", icon: Eraser },
    { name: "Frühstück", href: "/fruehstueck", icon: Coffee },
    { name: "Tourismusmeldung", href: "/tourismusmeldung", icon: BarChart3 },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [title, setTitle] = useState("Pensionsmanager");
    const [logo, setLogo] = useState("/logo.jpg");
    const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);
    const [feedbackType, setFeedbackType] = useState<"bug" | "feature" | null>(null);
    const [hasPin, setHasPin] = useState(false);
    const [appVersion, setAppVersion] = useState("v1.11.1"); // Fallback for web or initial load

    React.useEffect(() => {
        const loadSettings = async () => {
            try {
                const db = await initDb();
                if (db) {
                    const settings = await db.select<{ key: string, value: string }[]>("SELECT key, value FROM settings WHERE key IN ('branding_title', 'branding_logo', 'app_pin', 'is_pin_enabled')");
                    
                    const titleRes = settings.find(s => s.key === "branding_title");
                    if (titleRes) {
                        setTitle(titleRes.value);
                        document.title = titleRes.value;
                    }

                    const logoRes = settings.find(s => s.key === "branding_logo");
                    if (logoRes) setLogo(logoRes.value);

                    const pinRes = settings.find(s => s.key === "app_pin");
                    const enabledRes = settings.find(s => s.key === "is_pin_enabled");
                    setHasPin(!!pinRes && enabledRes?.value !== "false");
                }
            } catch (err) {
                console.error("Failed to load settings:", err);
            }
        };
        loadSettings();

        const handleSettingsChanged = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.title) {
                setTitle(detail.title);
                document.title = detail.title;
            }
            if (detail?.logo) {
                setLogo(detail.logo);
            }
        };
        window.addEventListener('settings-changed', handleSettingsChanged);

        // Check for updates and get version
        const fetchAppInfo = async () => {
            if (!('__TAURI_INTERNALS__' in window)) return;
            try {
                const { getVersion } = await import("@tauri-apps/api/app");
                const version = await getVersion();
                setAppVersion(`v${version}`);

                const update = await check();
                if (update) {
                    setUpdateAvailable(update.version);
                }
            } catch (error) {
                // Ignore errors here, they are handled by the main Updater component
            }
        };
        fetchAppInfo();

        return () => window.removeEventListener('settings-changed', handleSettingsChanged);
    }, []);

    return (
        <div className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src={logo}
                        alt="Logo"
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {title}
                    </h1>
                </div>
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <nav className="flex-1 px-4 space-y-1">
                {navigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                            pathname === item.href
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        )}
                        onClick={() => {
                            if (window.innerWidth < 1024) {
                                onClose();
                            }
                        }}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                    </Link>
                ))}
            </nav>
            {updateAvailable && (
                <div className="px-7 pb-2 flex items-center justify-end">
                    <span
                        onClick={() => window.dispatchEvent(new CustomEvent('check-for-updates'))}
                        title={`Update auf ${updateAvailable} verfügbar! Starte das Update beim nächsten Neustart der App.`}
                        className="flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full animate-pulse cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-3 h-3" />
                        Update
                    </span>
                </div>
            )}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                <Link
                    href="/konfiguration"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        pathname === "/konfiguration"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    )}
                    onClick={() => {
                        if (window.innerWidth < 1024) {
                            onClose();
                        }
                    }}
                >
                    <Palette className="w-4 h-4" />
                    Konfiguration
                </Link>
                <Link
                    href="/admin/database"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        pathname === "/admin/database"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    )}
                    onClick={() => {
                        if (window.innerWidth < 1024) {
                            onClose();
                        }
                    }}
                >
                    <Database className="w-4 h-4" />
                    Datenbank
                </Link>
                <Link
                    href="/account"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        pathname === "/account"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    )}
                    onClick={() => {
                        if (window.innerWidth < 1024) {
                            onClose();
                        }
                    }}
                >
                    <User className="w-4 h-4" />
                    Mein Account
                </Link>
                <Link
                    href="/impressum"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        pathname === "/impressum"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    )}
                    onClick={() => {
                        if (window.innerWidth < 1024) {
                            onClose();
                        }
                    }}
                >
                    <Info className="w-4 h-4 text-zinc-400" />
                    Impressum
                </Link>

                <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                    <button
                        onClick={() => {
                            setFeedbackType("feature");
                            if (window.innerWidth < 1024) onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            Funktion wünschen
                        </div>
                    </button>
                    <button
                        onClick={() => {
                            setFeedbackType("bug");
                            if (window.innerWidth < 1024) onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <Bug className="w-4 h-4 text-red-500" />
                            Fehler melden
                        </div>
                    </button>
                    {hasPin && (
                        <button
                            onClick={() => {
                            window.dispatchEvent(new CustomEvent('app-lock'));
                            if (window.innerWidth < 1024) onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-lg transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <Lock className="w-4 h-4" />
                            App Sperren
                        </div>
                    </button>
                    )}
                </div>
            </div>

            <FeedbackDialog
                isOpen={feedbackType !== null}
                onClose={() => setFeedbackType(null)}
                type={feedbackType || "bug"}
            />
        </div>
    );
}
