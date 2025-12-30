"use client";

import React from "react";
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
    Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Zimmer", href: "/zimmer", icon: BedDouble },
    { name: "Buchungen", href: "/buchungen", icon: CalendarDays },
    { name: "Gäste (CRM)", href: "/gaeste", icon: Users },
    { name: "Reinigungsplan", href: "/reinigung", icon: Eraser },
    { name: "Frühstück", href: "/fruehstueck", icon: Coffee },
    { name: "Berichte", href: "/berichte", icon: BarChart3 },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-screen sticky top-0">
            <div className="p-6">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Pensionsmanager
                </h1>
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
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    Einstellungen
                </Link>
            </div>
        </div>
    );
}
