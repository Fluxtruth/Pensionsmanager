"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { initDb, DatabaseMock } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Upload, Download } from "lucide-react";

export default function ConfigurationPage() {
    const router = useRouter();
    const [db, setDb] = useState<DatabaseMock | null>(null);
    const [title, setTitle] = useState("Pensionsmanager");
    const [logo, setLogo] = useState("/logo.jpg");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [appVersion, setAppVersion] = useState("v1.11.1");

    useEffect(() => {
        const loadSettings = async () => {
            const database = await initDb();
            setDb(database);
            if (database) {
                const titleRes = await database.select<{ value: string }[]>("SELECT value FROM settings WHERE key = ?", ["branding_title"]);
                if (titleRes.length > 0) setTitle(titleRes[0].value);

                const logoRes = await database.select<{ value: string }[]>("SELECT value FROM settings WHERE key = ?", ["branding_logo"]);
                if (logoRes.length > 0) setLogo(logoRes[0].value);
            }

            // Get Version if in Tauri
            if ('__TAURI_INTERNALS__' in window) {
                try {
                    const { getVersion } = await import("@tauri-apps/api/app");
                    const version = await getVersion();
                    setAppVersion(`v${version}`);
                } catch (e) {
                    console.error("Failed to fetch version:", e);
                }
            }

            setLoading(false);
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        if (!db) return;
        setSaving(true);
        try {
            await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ["branding_title", title]);
            await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ["branding_logo", logo]);

            // Dispatch event with the new values directly so listeners can update immediately
            window.dispatchEvent(new CustomEvent('settings-changed', {
                detail: { title, logo }
            }));
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return <div className="p-8">Laden...</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Konfiguration</h2>
            </div>
            <Separator />
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Branding</CardTitle>
                        <CardDescription>
                            Passen Sie das Erscheinungsbild der Anwendung an.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Titel der Anwendung</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value.slice(0, 25))}
                                placeholder="z.B. Pension Petersohn"
                                maxLength={25}
                            />
                            <p className="text-xs text-muted-foreground">{title.length}/25 Zeichen</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logo">Logo</Label>
                            <div className="flex items-center gap-4">
                                {logo && (
                                    <img
                                        src={logo}
                                        alt="Current Logo"
                                        className="w-16 h-16 rounded-full object-cover border"
                                    />
                                )}
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors">
                                        <Upload className="w-4 h-4" />
                                        Logo hochladen
                                    </Label>
                                    <Input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pt-4">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? "Speichern..." : (
                                    <>
                                        <Check className="mr-2 w-4 h-4" />
                                        Einstellungen speichern
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Software-Update</CardTitle>
                        <CardDescription>
                            Prüfen Sie, ob eine neue Version der Anwendung verfügbar ist.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    Aktuelle Version
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {appVersion}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    if (!('__TAURI_INTERNALS__' in window)) {
                                        alert("Update-Prüfung nur in der Desktop-App verfügbar.");
                                        return;
                                    }
                                    window.dispatchEvent(new CustomEvent('check-for-updates'));
                                }}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Nach Updates suchen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
