"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, LogOut, Mail, Calendar, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Separator } from "@/components/ui/separator";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AccountPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        getUser();
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

                        <div className="pt-2">
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
            </div>
        </div>
    );
}
