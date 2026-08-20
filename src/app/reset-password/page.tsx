"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Lock, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { getGermanAuthError } from "@/lib/auth-errors";
import { useEffect } from "react";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check URL for errors from Supabase Auth redirect (hash or query)
        const checkUrlForErrors = () => {
            const hash = window.location.hash;
            const search = window.location.search;
            
            let params = new URLSearchParams();
            if (hash.includes("error=")) {
                params = new URLSearchParams(hash.substring(1));
            } else if (search.includes("error=")) {
                params = new URLSearchParams(search.substring(1));
            }

            const errCode = params.get("error_code");
            const errDesc = params.get("error_description");

            if (errCode === "otp_expired" || errDesc?.includes("expired")) {
                setError("Der Link zum Zurücksetzen ist abgelaufen oder ungültig. Bitte fordern Sie einen neuen Link an.");
            } else if (errDesc) {
                setError(getGermanAuthError(errDesc.replace(/\+/g, " ")));
            }
        };

        checkUrlForErrors();

        // Also check if we actually have a session, since updateUser will fail without one
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session && !window.location.hash.includes("access_token=") && !window.location.search.includes("code=")) {
                // If there's no session and no tokens in the URL to be exchanged, the user shouldn't be here
                // But we don't necessarily want to block them immediately if Supabase is still initializing.
            }
        };
        
        checkSession();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!password || !confirmPassword) {
            setError("Bitte füllen Sie beide Passwortfelder aus.");
            return;
        }

        if (password.length < 6) {
            setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Die eingegebenen Passwörter stimmen nicht überein.");
            return;
        }

        setIsLoading(true);

        try {
            const params = new URLSearchParams(window.location.search);
            const tokenHash = params.get("token_hash");
            const token = params.get("token");
            const emailParam = params.get("email");

            // Wir loggen das, um zu sehen ob der Token überhaupt im Frontend ankommt
            console.log("Gefundener TokenHash:", tokenHash, "| OTP Token:", token, "| Email:", emailParam);

            if (tokenHash || (token && emailParam)) {
                console.log("Verifiziere Token mit Supabase...");
                
                let verifyPromise;
                if (tokenHash) {
                    verifyPromise = supabase.auth.verifyOtp({
                        token_hash: tokenHash,
                        type: 'recovery'
                    });
                } else if (token && emailParam) {
                    verifyPromise = supabase.auth.verifyOtp({
                        email: emailParam,
                        token: token,
                        type: 'recovery'
                    });
                }

                const { data, error: verifyError } = await verifyPromise!;

                if (verifyError) {
                    console.error("verifyOtp error details:", verifyError);
                    throw new Error(`Fehler bei der Verifizierung: ${verifyError.message}`);
                }
                
                console.log("Token erfolgreich verifiziert! Session aktiv:", data.session !== null);

                // Token erst nach erfolgreicher Verifizierung aus der URL entfernen
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                console.log("Kein Token in der URL gefunden. Versuche direkt updateUser (setzt voraus, dass bereits eine Session aktiv ist).");
            }

            console.log("Aktualisiere Passwort...");
            const { error } = await supabase.auth.updateUser({
                password,
            });

            if (error) {
                console.error("updateUser error details:", error);
                throw error;
            }

            setIsSuccess(true);
            setMessage("Ihr Passwort wurde erfolgreich geändert. Sie können sich nun mit dem neuen Passwort anmelden.");
        } catch (err: any) {
            console.error("Kompletter Fehler-Trace:", err);
            setError(err.message);
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
                <div className="w-full max-w-md">
                    <Card className="shadow-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                        <CardHeader className="text-center space-y-2 pb-2">
                            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                                {isSuccess ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                ) : (
                                    <KeyRound className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                )}
                            </div>
                            <CardTitle className="text-2xl font-bold">
                                {isSuccess ? "Passwort geändert" : "Neues Passwort festlegen"}
                            </CardTitle>
                            <CardDescription>
                                {isSuccess 
                                    ? "Ihr Passwort wurde erfolgreich aktualisiert." 
                                    : "Bitte geben Sie Ihr neues Passwort ein."
                                }
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-4">
                            {isSuccess ? (
                                <div className="space-y-6">
                                    <div className="p-4 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800/30 text-center">
                                        {message}
                                    </div>
                                    <Button
                                        onClick={() => router.push("/login")}
                                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-500/20"
                                    >
                                        Zum Login
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdatePassword} className="space-y-4">
                                    {error && (
                                        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800/30">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">Neues Passwort</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                            <Input
                                                id="new-password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-9 h-11"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                disabled={isLoading || !!error}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                            <Input
                                                id="confirm-password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-9 h-11"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                disabled={isLoading || !!error}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-500/20"
                                        disabled={isLoading || !!error}
                                    >
                                        {isLoading ? "Wird gespeichert..." : "Passwort speichern"}
                                    </Button>

                                    <div className="text-center mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-sm text-zinc-600 dark:text-zinc-400">
                                        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400 font-bold">
                                            Abbrechen und zum Login
                                        </Link>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
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
