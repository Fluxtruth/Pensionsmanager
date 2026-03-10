"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, LogOut, Mail, Calendar, ShieldCheck, KeyRound, Pencil, Trash2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Separator } from "@/components/ui/separator";
import { initDb } from "@/lib/db";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AccountPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [pin, setPin] = useState<string | null>(null);
    const [isEditingPin, setIsEditingPin] = useState(false);
    const [newPin, setNewPin] = useState("");
    const [pinError, setPinError] = useState("");
    const router = useRouter();

    useEffect(() => {
        const loadAccountData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            // Load PIN from local DB
            try {
                const db = await initDb();
                if (db) {
                    const pinSetting = await db.select<any[]>("SELECT value FROM settings WHERE key = 'app_pin'");
                    if (pinSetting && pinSetting.length > 0) {
                        setPin(pinSetting[0].value);
                    }
                }
            } catch (err) {
                console.error("Failed to load PIN:", err);
            }

            setLoading(false);
        };
        loadAccountData();
    }, []);

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.push("/login");
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            setLogoutLoading(false);
        }
    };

    const handleSavePin = async () => {
        if (newPin.length < 4 || newPin.length > 8 || !/^\d+$/.test(newPin)) {
            setPinError("Die PIN muss zwischen 4 und 8 Ziffern lang sein.");
            return;
        }

        try {
            const db = await initDb();
            if (db) {
                await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('app_pin', ?)", [newPin]);
                setPin(newPin);
                setIsEditingPin(false);
                setNewPin("");
                setPinError("");
            }
        } catch (err) {
            console.error("Failed to save PIN:", err);
            setPinError("Fehler beim Speichern der PIN.");
        }
    };

    const handleRemovePin = async () => {
        try {
            const db = await initDb();
            if (db) {
                await db.execute("DELETE FROM settings WHERE key = 'app_pin'");
                setPin(null);
                setPinError("");
            }
        } catch (err) {
            console.error("Failed to remove PIN:", err);
            setPinError("Fehler beim Entfernen der PIN.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 text-red-600 rounded-lg">
                Kein Benutzer gefunden. Bitte melden Sie sich neu an.
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Mein Account</h2>
            </div>
            <Separator />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2 shadow-md border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold">Benutzerprofil</CardTitle>
                            <CardDescription>Verwalten Sie Ihre Kontoinformationen.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-xs font-semibold uppercase">E-Mail Adresse</Label>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Mail className="w-4 h-4 text-zinc-400" />
                                    {user.email}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-xs font-semibold uppercase">Erstellt am</Label>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="w-4 h-4 text-zinc-400" />
                                    {new Date(user.created_at).toLocaleDateString('de-DE')}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-xs font-semibold uppercase">Authentifizierung</Label>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <ShieldCheck className="w-4 h-4 text-green-500" />
                                    Supabase Auth
                                </div>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="pt-2 flex flex-wrap gap-2">
                            {pin && (
                                <Button
                                    variant="outline"
                                    className="border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 gap-2"
                                    onClick={() => window.dispatchEvent(new CustomEvent('app-lock'))}
                                >
                                    <Lock className="w-4 h-4" />
                                    App Sperren
                                </Button>
                            )}
                            <Button
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700 text-white gap-2"
                                onClick={handleLogout}
                                disabled={logoutLoading}
                            >
                                <LogOut className="w-4 h-4" />
                                {logoutLoading ? "Melde ab..." : "Abmelden"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-md border-zinc-200 dark:border-zinc-800 bg-blue-50/50 dark:bg-blue-900/5">
                    <CardHeader>
                        <CardTitle className="text-lg">Sicherheitshinweis</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Ihre Sitzung ist durch moderne JWT-Token gesichert. Sobald Sie sich abmelden, werden alle lokalen Sitzungsdaten gelöscht und der Zugriff erlischt sofort.
                    </CardContent>
                </Card>

                <Card className="col-span-2 shadow-md border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 text-amber-600 dark:text-amber-400">
                        <KeyRound className="w-6 h-6" />
                        <div>
                            <CardTitle>PIN-Sperre</CardTitle>
                            <CardDescription>Sichern Sie dieses Gerät mit einer PIN für schnellen Zugriff.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pin ? (
                            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                    <span className="text-sm font-medium">PIN ist aktiv (••••)</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { setIsEditingPin(true); setNewPin(""); }}
                                        className="h-8 gap-1.5"
                                    >
                                        <Pencil className="w-3.5 h-3.5" /> Ändern
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemovePin}
                                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 gap-1.5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Entfernen
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-zinc-500 italic py-2">
                                Keine PIN eingerichtet. Die App ist auf diesem Gerät nicht zusätzlich geschützt.
                            </div>
                        )}

                        {(!pin || isEditingPin) && (
                            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <Label htmlFor="new-pin" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        {pin ? "Neue PIN festlegen" : "PIN einrichten"}
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="new-pin"
                                            type="password"
                                            inputMode="numeric"
                                            placeholder="4-8 Ziffern"
                                            maxLength={8}
                                            value={newPin}
                                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                            className="max-w-[150px] font-mono tracking-widest text-lg h-10"
                                        />
                                        <Button
                                            onClick={handleSavePin}
                                            disabled={newPin.length < 4}
                                            className="bg-blue-600 hover:bg-blue-700 h-10 px-6"
                                        >
                                            Speichern
                                        </Button>
                                        {isEditingPin && (
                                            <Button
                                                variant="ghost"
                                                onClick={() => { setIsEditingPin(false); setNewPin(""); setPinError(""); }}
                                                className="h-10"
                                            >
                                                Abbrechen
                                            </Button>
                                        )}
                                    </div>
                                    {pinError && <p className="text-xs text-red-500 font-medium">{pinError}</p>}
                                </div>
                                <p className="text-xs text-zinc-400 max-w-md">
                                    Die PIN wird nur lokal auf diesem Gerät gespeichert und ermöglicht es Ihnen, den Zugriff schnell zu sperren/entsperren, ohne sich jedes Mal mit dem E-Mail-Passwort neu anmelden zu müssen.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
