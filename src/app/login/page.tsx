"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!email || !password) {
            setError("Bitte gib E-Mail und Passwort ein.");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Login fehlgeschlagen. Bitte prüfe deine Zugangsdaten.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 p-4">
            <header className="py-8 text-center">
                <a 
                    href="https://pensionsmanager.de" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                >
                    Pensionsmanager
                </a>
            </header>

            <main className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Login Card */}
                    <Card className="shadow-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                        <CardHeader className="text-center space-y-2 pb-2">
                            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                                <LogIn className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Willkommen zurück</CardTitle>
                            <CardDescription>
                                Melden Sie sich an, um auf Ihr Dashboard zuzugreifen.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-4">
                                {error && (
                                    <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800/30">
                                        {error}
                                    </div>
                                )}
                                {message && (
                                    <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800/30">
                                        {message}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email">E-Mail</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            className="pl-9 h-11"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Passwort</Label>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-9 h-11"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-500/20"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Wird verarbeitet..." : "Anmelden"}
                                </Button>

                                <div className="text-center mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-sm text-zinc-600 dark:text-zinc-400">
                                    Noch keinen Account?{" "}
                                    <Link href="/register" className="text-blue-600 hover:underline dark:text-blue-400 font-bold">
                                        Jetzt registrieren
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Instruction Box */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                    <span className="text-blue-600 dark:text-blue-400 text-sm">?</span>
                                </div>
                                So einfach geht's
                            </h3>
                            <div className="space-y-4 text-zinc-600 dark:text-zinc-400">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                        1
                                    </div>
                                    <p>Geben Sie Ihre <strong>E-Mail-Adresse</strong> und Ihr <strong>Passwort</strong> ein, um sich anzumelden.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                        2
                                    </div>
                                    <p>Falls Sie noch keinen Account haben, klicken Sie auf <strong>"Jetzt registrieren"</strong>.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                        3
                                    </div>
                                    <p>Nach der Registrierung erhalten Sie eine <strong>Bestätigungs-Mail</strong>. Klicken Sie auf den Link in der Mail, um Ihren Account zu aktivieren.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 flex gap-3 italic text-sm text-amber-800 dark:text-amber-200">
                            <div className="flex-shrink-0 mt-0.5">⚠️</div>
                            <p>Bitte prüfen Sie auch Ihren Spam-Ordner, falls Sie keine Bestätigungs-Mail erhalten.</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-8 border-t border-zinc-100 dark:border-zinc-800 flex justify-center gap-6 text-xs text-zinc-400">
                <Link href="/impressum" className="hover:text-blue-600 transition-colors">Impressum</Link>
                <span className="text-zinc-200 dark:text-zinc-700">|</span>
                <span>&copy; {new Date().getFullYear()} Pensionsmanager</span>
            </footer>
        </div>
    );
}
