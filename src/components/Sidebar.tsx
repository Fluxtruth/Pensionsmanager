"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    BedDouble,
    CalendarDays,
    Users,
    Eraser,
    Coffee,
    BarChart3,
    Settings,
    Database,
    Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initDb } from "@/lib/db";

const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Zimmer", href: "/zimmer", icon: BedDouble },
    { name: "Buchungen", href: "/buchungen", icon: CalendarDays },
    { name: "Gäste", href: "/gaeste", icon: Users },
    { name: "Reinigungsplan", href: "/reinigung", icon: Eraser },
    { name: "Frühstück", href: "/fruehstueck", icon: Coffee },
    { name: "Tourismusmeldung", href: "/tourismusmeldung", icon: BarChart3 },
    { name: "Datenbank", href: "/admin/database", icon: Database },
];

export function Sidebar() {
    const pathname = usePathname();
    const [title, setTitle] = useState("Pensionsmanager");
    const [logo, setLogo] = useState("/logo.jpg");

    React.useEffect(() => {
        const loadSettings = async () => {
            const db = await initDb();
            if (db) {
                const titleRes = await db.select<{ value: string }[]>("SELECT value FROM settings WHERE key = ?", ["branding_title"]);
                if (titleRes.length > 0) setTitle(titleRes[0].value);

                const logoRes = await db.select<{ value: string }[]>("SELECT value FROM settings WHERE key = ?", ["branding_logo"]);
                if (logoRes.length > 0) setLogo(logoRes[0].value);
            }
        };
        loadSettings();
    }, []);

    return (
        <div className="flex flex-col w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-screen sticky top-0">
            <div className="p-6">
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
                    >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                    </Link>
                ))}
            </nav>
            <div className="px-7 pb-2">
                <span className="text-xs text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    v.1.0.1
                </span>
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                <Link
                    href="/konfiguration"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        pathname === "/konfiguration"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    )}
                >
                    <Palette className="w-4 h-4" />
                    Konfiguration
                </Link>
            </div>
        </div>
    );
}
