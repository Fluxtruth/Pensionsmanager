"use client";

import React, { useState, useEffect } from "react";
import { initDb, DatabaseMock } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Upload } from "lucide-react";

export default function ConfigurationPage() {
    const [db, setDb] = useState<DatabaseMock | null>(null);
    const [title, setTitle] = useState("Pensionsmanager");
    const [logo, setLogo] = useState("/logo.jpg");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

            // Force a reload to update the sidebar (simplest way effectively)
            window.location.reload();
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
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="z.B. Pension Petersohn"
                            />
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
            </div>
        </div>
    );
}
