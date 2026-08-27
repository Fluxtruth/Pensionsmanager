"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
    ArrowLeft, 
    Sparkles, 
    Check, 
    Lock, 
    Layers, 
    ShieldCheck, 
    Building2, 
    Zap, 
    HelpCircle, 
    Send, 
    Bot, 
    Globe, 
    Headphones, 
    CheckCircle2, 
    Info, 
    TrendingUp,
    BedDouble,
    Crown,
    Mail,
    ExternalLink,
    AlertTriangle,
    RefreshCw,
    XCircle,
    CheckCircle,
    Calendar,
    CreditCard
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    PRICING_PLANS, 
    CUSTOMER_TYPES, 
    ADDON_MODULES, 
    CORE_FEATURES, 
    calculatePlanInfo,
    CustomerTypeKey,
    AddonModule
} from "@/lib/pricing";
import { initDb } from "@/lib/db";
import { supabase } from "@/lib/supabase/client";
import { SyncService, syncEvents } from "@/lib/sync";
import { cn } from "@/lib/utils";

export default function TarifDetailsPage() {
    const [roomCount, setRoomCount] = useState<number>(0);
    const [customerType, setCustomerType] = useState<CustomerTypeKey>("test");
    const [loading, setLoading] = useState(true);
    const [requestModalModule, setRequestModalModule] = useState<AddonModule | null>(null);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [requestNote, setRequestNote] = useState("");
    const [requestEmail, setRequestEmail] = useState("");
    const [pensionName, setPensionName] = useState("Meine Pension");
    const [lastMailtoUrl, setLastMailtoUrl] = useState("");

    // Stripe Subscription States
    const [subscriptionId, setSubscriptionId] = useState<string | null>("sub_test_pension_default");
    const [isCancelAtPeriodEnd, setIsCancelAtPeriodEnd] = useState<boolean>(false);
    const [subscriptionActive, setSubscriptionActive] = useState<boolean>(true);
    const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
    const [cancelModalMode, setCancelModalMode] = useState<"period_end" | "immediate">("period_end");
    const [cancelLoading, setCancelLoading] = useState<boolean>(false);
    const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
    const [cancelFeedback, setCancelFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const planInfo = calculatePlanInfo(roomCount);

    const loadData = async () => {
        try {
            const pId = await SyncService.getInstance().getPensionId();
            const db = await initDb(pId || undefined);
            if (db) {
                // Fetch room count
                const rooms = await db.select<{ count: number }[]>(
                    "SELECT COUNT(*) as count FROM rooms WHERE (is_deleted = 0 OR is_deleted IS NULL) AND (pension_id = ? OR ? IS NULL)",
                    [pId, pId]
                );
                const count = rooms && rooms[0] ? Number(rooms[0].count) : 0;
                setRoomCount(count);

                // Fetch customer type from settings
                const custTypeRes = await db.select<{ value: string }[]>(
                    "SELECT value FROM settings WHERE key = 'customer_type' AND (pension_id = ? OR ? IS NULL)",
                    [pId, pId]
                );
                let currentCustType: CustomerTypeKey = (custTypeRes.length > 0 && custTypeRes[0].value in CUSTOMER_TYPES)
                    ? (custTypeRes[0].value as CustomerTypeKey)
                    : "subscriber";

                // Fetch pension name from branding
                const titleRes = await db.select<{ value: string }[]>(
                    "SELECT value FROM settings WHERE key = 'branding_title' AND (pension_id = ? OR ? IS NULL)",
                    [pId, pId]
                );
                if (titleRes.length > 0 && titleRes[0].value) {
                    setPensionName(titleRes[0].value);
                }

                // Fetch subscription cancel status
                const cancelRes = await db.select<{ value: string }[]>(
                    "SELECT value FROM settings WHERE key = 'stripe_cancel_at_period_end' AND (pension_id = ? OR ? IS NULL)",
                    [pId, pId]
                );
                if (cancelRes.length > 0) {
                    setIsCancelAtPeriodEnd(cancelRes[0].value === "1" || cancelRes[0].value === "true");
                }

                const subStatusRes = await db.select<{ value: string }[]>(
                    "SELECT value FROM settings WHERE key = 'stripe_subscription_status' AND (pension_id = ? OR ? IS NULL)",
                    [pId, pId]
                );
                let isSubActive = subStatusRes.length > 0 ? subStatusRes[0].value !== "canceled" : currentCustType !== "none";

                // Query live Stripe sync API to synchronize latest checkout / subscriptions
                try {
                    const syncRes = await fetch("/api/subscriptions/sync", { method: "POST" });
                    if (syncRes.ok) {
                        const syncData = await syncRes.json();
                        if (syncData.hasActiveSubscription) {
                            currentCustType = "subscriber";
                            isSubActive = true;
                            setIsCancelAtPeriodEnd(!!syncData.cancelAtPeriodEnd);
                            if (syncData.subscriptionId) setSubscriptionId(syncData.subscriptionId);

                            await db.execute(
                                "INSERT OR REPLACE INTO settings (key, value, pension_id, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
                                ["customer_type", "subscriber", pId]
                            );
                            await db.execute(
                                "INSERT OR REPLACE INTO settings (key, value, pension_id, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
                                ["stripe_subscription_status", "active", pId]
                            );
                            await db.execute(
                                "INSERT OR REPLACE INTO settings (key, value, pension_id, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
                                ["stripe_cancel_at_period_end", syncData.cancelAtPeriodEnd ? "1" : "0", pId]
                            );
                            if (syncData.subscriptionId) {
                                await db.execute(
                                    "INSERT OR REPLACE INTO settings (key, value, pension_id, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
                                    ["stripe_subscription_id", syncData.subscriptionId, pId]
                                );
                            }
                            if (typeof window !== "undefined") {
                                window.dispatchEvent(new CustomEvent("settings-changed", { detail: { customer_type: "subscriber" } }));
                            }
                        }
                    }
                } catch (e) {
                    console.warn("Could not sync live Stripe status:", e);
                }

                setCustomerType(currentCustType);
                setSubscriptionActive(isSubActive);
            }

            // Get user email
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setRequestEmail(user.email);
            }
        } catch (err) {
            console.error("Failed to load pricing and room data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        const handleSync = () => loadData();
        const handleSettingsChanged = () => loadData();

        syncEvents.on("sync-completed", handleSync);
        if (typeof window !== "undefined") {
            window.addEventListener("settings-changed", handleSettingsChanged);
        }

        return () => {
            syncEvents.off("sync-completed", handleSync);
            if (typeof window !== "undefined") {
                window.removeEventListener("settings-changed", handleSettingsChanged);
            }
        };
    }, []);

    const handleSaveCustomerType = async (type: CustomerTypeKey) => {
        setCustomerType(type);
        setSubscriptionActive(type !== "none");
        try {
            const pId = await SyncService.getInstance().getPensionId();
            const db = await initDb(pId || undefined);
            if (db) {
                const now = new Date().toISOString();
                await db.execute(
                    "INSERT OR REPLACE INTO settings (key, value, updated_at, pension_id) VALUES (?, ?, ?, ?)",
                    ["customer_type", type, now, pId]
                );
                await db.execute(
                    "INSERT OR REPLACE INTO settings (key, value, updated_at, pension_id) VALUES (?, ?, ?, ?)",
                    ["stripe_subscription_status", type === "none" ? "canceled" : "active", now, pId]
                );
            }
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("settings-changed", { detail: { customer_type: type } }));
            }
        } catch (err) {
            console.error("Failed to save customer type:", err);
        }
    };

    const handleStartCheckout = async (targetPlanId?: string) => {
        setCheckoutLoading(true);
        setCancelFeedback(null);
        const selectedPlan = targetPlanId || planInfo.plan.id || "S";
        try {
            const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId: selectedPlan }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else if (data.error) {
                setCancelFeedback({ type: "error", message: `Checkout-Fehler: ${data.error}` });
            }
        } catch (err: any) {
            setCancelFeedback({ type: "error", message: err.message || "Checkout-Aufruf fehlgeschlagen." });
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleOpenCancelModal = (mode: "period_end" | "immediate") => {
        setCancelModalMode(mode);
        setCancelModalOpen(true);
        setCancelFeedback(null);
    };

    const handleConfirmCancel = async () => {
        setCancelLoading(true);
        setCancelFeedback(null);

        const immediate = cancelModalMode === "immediate";

        try {
            const res = await fetch("/api/subscriptions/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subscriptionId: subscriptionId || "sub_test_pension_default",
                    immediate,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Fehler beim Kündigen des Abonnements.");
            }

            const pId = await SyncService.getInstance().getPensionId();
            const db = await initDb(pId || undefined);
            const now = new Date().toISOString();

            if (immediate) {
                setSubscriptionActive(false);
                setCustomerType("none");
                setIsCancelAtPeriodEnd(false);
                if (db) {
                    await db.execute(
                        "INSERT OR REPLACE INTO settings (key, value, updated_at, pension_id) VALUES (?, ?, ?, ?)",
                        ["customer_type", "none", now, pId]
                    );
                    await db.execute(
                        "INSERT OR REPLACE INTO settings (key, value, updated_at, pension_id) VALUES (?, ?, ?, ?)",
                        ["stripe_subscription_status", "canceled", now, pId]
                    );
                    await db.execute(
                        "INSERT OR REPLACE INTO settings (key, value, updated_at, pension_id) VALUES (?, ?, ?, ?)",
                        ["stripe_cancel_at_period_end", "0", now, pId]
                    );
                }
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("settings-changed", { detail: { customer_type: "none" } }));
                }
                setCancelFeedback({
                    type: "success",
                    message: "Abonnement sofort beendet. Der Kundentyp wurde auf 'Kein Kunde' gesetzt und die App gesperrt, bis ein neues Abo gebucht wird.",
                });
            } else {
                setIsCancelAtPeriodEnd(true);
                if (db) {
                    await db.execute(
                        "INSERT OR REPLACE INTO settings (key, value, updated_at, pension_id) VALUES (?, ?, ?, ?)",
                        ["stripe_cancel_at_period_end", "1", now, pId]
                    );
                }
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("settings-changed"));
                }
                setCancelFeedback({
                    type: "success",
                    message: "Kündigung zum Periodenende vorgemerkt. Ihr Zugriff bleibt bis zum Ende des Abrechnungsmonats vollständig aktiv.",
                });
            }

            setCancelModalOpen(false);
        } catch (err: any) {
            setCancelFeedback({
                type: "error",
                message: err.message || "Fehler bei der Kündigung.",
            });
        } finally {
            setCancelLoading(false);
        }
    };

    const handleReactivate = async () => {
        setCancelLoading(true);
        setCancelFeedback(null);
        try {
            const res = await fetch("/api/subscriptions/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subscriptionId: subscriptionId || "sub_test_pension_default",
                    reactivate: true,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Fehler beim Reaktivieren des Abonnements.");
            }

            setIsCancelAtPeriodEnd(false);
            setSubscriptionActive(true);

            const pId = await SyncService.getInstance().getPensionId();
            const db = await initDb(pId || undefined);
            const now = new Date().toISOString();
            if (db) {
                await db.execute(
                    "INSERT OR REPLACE INTO settings (key, value, updated_at, pension_id) VALUES (?, ?, ?, ?)",
                    ["stripe_cancel_at_period_end", "0", now, pId]
                );
                await db.execute(
                    "INSERT OR REPLACE INTO settings (key, value, updated_at, pension_id) VALUES (?, ?, ?, ?)",
                    ["stripe_subscription_status", "active", now, pId]
                );
            }

            setCancelFeedback({
                type: "success",
                message: "Kündigung erfolgreich widerrufen. Ihr Abonnement wird automatisch fortgeführt.",
            });
        } catch (err: any) {
            setCancelFeedback({
                type: "error",
                message: err.message || "Fehler beim Widerrufen der Kündigung.",
            });
        } finally {
            setCancelLoading(false);
        }
    };

    const handleOpenRequest = (module: AddonModule) => {
        setRequestModalModule(module);
        setRequestSuccess(false);
        setRequestNote("");
        setLastMailtoUrl("");
    };

    const handleSendRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestModalModule) return;

        const subject = `Freischaltungsanfrage Zusatzmodul: ${requestModalModule.title}`;
        const body = `Hallo Pensionsmanager-Team,

hiermit möchte ich die Freischaltung für das folgende Zusatzmodul anfragen:

• Modul: ${requestModalModule.title} (${requestModalModule.subtitle})
• Pension / Betrieb: ${pensionName}
• Kontakt-E-Mail: ${requestEmail}
• Aktueller Tarif: ${planInfo.plan.name} (${roomCount} Zimmer)
• Kundentyp: ${CUSTOMER_TYPES[customerType].label}
${requestNote ? `\nAnmerkungen / Wünsche:\n${requestNote}\n` : ""}
Bitte informieren Sie mich, sobald das Modul verfügbar ist bzw. freigeschaltet werden kann.

Mit freundlichen Grüßen
${pensionName}`;

        const mailto = `mailto:info@pensionsmanager.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setLastMailtoUrl(mailto);

        try {
            window.location.href = mailto;
        } catch (err) {
            console.error("Failed to open mailto URL:", err);
        }

        setRequestSuccess(true);
    };

    const currentCustomerType = CUSTOMER_TYPES[customerType];

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-6xl mx-auto">
            {/* Header & Back Link */}
            <div className="space-y-2">
                <Link href="/account">
                    <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                        <ArrowLeft className="w-4 h-4" /> Zurück zur Account-Übersicht
                    </Button>
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            Tarifdetails & Module
                            <Badge className={cn(
                                "text-xs font-semibold px-2.5 py-0.5 border",
                                subscriptionActive && customerType !== "none"
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700"
                            )}>
                                {subscriptionActive && customerType !== "none" ? `Aktiver Plan: ${planInfo.plan.name}` : "Kein aktiver Plan"}
                            </Badge>
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            Übersicht Ihres aktuellen Pricing-Plans, Zimmerkontingents, aktiven Leistungsumfangs und zubuchbarer Erweiterungen.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadData()}
                        disabled={loading}
                        className="text-xs gap-1.5 text-zinc-600 dark:text-zinc-400 self-start sm:self-auto"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                        Status aktualisieren
                    </Button>
                </div>
            </div>

            {/* Feedback Banners */}
            {cancelFeedback && (
                <div className={cn(
                    "p-4 rounded-xl border flex items-start gap-3 text-sm animate-in fade-in-50",
                    cancelFeedback.type === "success" 
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                        : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
                )}>
                    {cancelFeedback.type === "success" ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 font-medium">{cancelFeedback.message}</div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCancelFeedback(null)} 
                        className="h-6 px-2 text-xs -mr-1"
                    >
                        Schließen
                    </Button>
                </div>
            )}

            {/* Kündigung vorgemerkt Info Banner */}
            {isCancelAtPeriodEnd && (
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-sm">Kündigung zum Periodenende vorgemerkt</h4>
                            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                                Ihr Abonnement endet zum Ende des laufenden Abrechnungsmonats. Bis dahin haben Sie weiterhin uneingeschränkten Zugriff auf alle Funktionen.
                            </p>
                        </div>
                    </div>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleReactivate} 
                        disabled={cancelLoading}
                        className="bg-white dark:bg-zinc-900 border-amber-400 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-zinc-800 shrink-0 gap-1.5"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", cancelLoading && "animate-spin")} />
                        Kündigung widerrufen
                    </Button>
                </div>
            )}

            <Separator />

            {/* Status-Karten Grid: Aktiver Tarif & Kundentyp */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Aktiver Tarif & Zimmer-Auslastung */}
                <Card className={cn(
                    "md:col-span-2 shadow-md transition-all",
                    subscriptionActive && customerType !== "none"
                        ? "border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-blue-950/20"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
                )}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className={cn(
                                    "p-2 rounded-xl text-white shadow-sm",
                                    subscriptionActive && customerType !== "none" ? "bg-blue-600" : "bg-zinc-500"
                                )}>
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold">
                                        {subscriptionActive && customerType !== "none" 
                                            ? `Aktueller Tarif: ${planInfo.plan.name}` 
                                            : "Kein aktiver Tarif"}
                                    </CardTitle>
                                    <CardDescription>
                                        {subscriptionActive && customerType !== "none" 
                                            ? `${planInfo.plan.tagline} • ${planInfo.plan.pricePerMonth} / Monat`
                                            : `Passende Tarifstufe für ${roomCount} Zimmer: ${planInfo.plan.name} (${planInfo.plan.pricePerMonth} / Monat)`}
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className={cn(
                                "font-semibold",
                                subscriptionActive && customerType !== "none"
                                    ? "text-blue-700 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/40 border-blue-300 dark:border-blue-800"
                                    : "text-rose-700 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-900/40 border-rose-300 dark:border-rose-800"
                            )}>
                                {subscriptionActive && customerType !== "none" ? "Abonnement Aktiv" : "Inaktiv / Kein Abonnement"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-1">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                                    <BedDouble className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    Zimmer-Kontingent
                                </span>
                                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                    {roomCount} {planInfo.roomsLimit ? `von ${planInfo.roomsLimit} Zimmern` : "Zimmer (Unbegrenzt)"}
                                </span>
                            </div>
                            <Progress 
                                value={planInfo.progressPercentage} 
                                className="h-2.5 bg-zinc-200 dark:bg-zinc-800"
                            />
                        </div>

                        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white dark:bg-zinc-950/60 border border-blue-100 dark:border-blue-900/40 text-xs text-zinc-600 dark:text-zinc-400">
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                                <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                                    {planInfo.upgradeNotice}
                                </span>
                                <div className="mt-0.5 text-zinc-500">
                                    Ihr Zimmerkontingent bestimmt, wie viele Zimmer Sie maximal anlegen können. Das Abonnement wird niemals automatisch teurer – ein Upgrade auf mehr Zimmer führen Sie bei Bedarf jederzeit manuell über Stripe durch.
                                </div>
                            </div>
                        </div>

                        {/* Abonnement-Aktionen (Kündigen & Testmodus) */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/60 dark:border-zinc-800">
                            {subscriptionActive && !isCancelAtPeriodEnd ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleOpenCancelModal("period_end")}
                                        className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border-zinc-300 dark:border-zinc-700"
                                    >
                                        Abo zum Monatsende kündigen
                                    </Button>

                                    {/* Testmodus / Sandbox Sofort-Kündigung */}
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleOpenCancelModal("immediate")}
                                        className="text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 gap-1.5"
                                    >
                                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                                        ⚡ Sofort kündigen (Testmodus)
                                    </Button>
                                </div>
                            ) : (
                                <Button 
                                    size="sm"
                                    onClick={() => handleStartCheckout(planInfo.plan.id)}
                                    disabled={checkoutLoading}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Neues Abo buchen / Checkout starten
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Kundentyp Card (System-Driven / Automatisch) */}
                <Card className="shadow-md border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Crown className="w-5 h-5 text-amber-500" />
                                <div>
                                    <CardTitle className="text-base font-bold">Kundentyp</CardTitle>
                                    <span className="text-[10px] text-zinc-400 font-medium">Automatisch ermittelt</span>
                                </div>
                            </div>
                            <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full border", currentCustomerType.colorClass)}>
                                {currentCustomerType.label}
                            </span>
                        </div>
                        <CardDescription className="text-xs mt-1">
                            {currentCustomerType.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                                Ihr aktiver Kundentyp
                            </Label>
                            <div className="space-y-1.5">
                                {(Object.keys(CUSTOMER_TYPES) as CustomerTypeKey[]).map((key) => {
                                    const c = CUSTOMER_TYPES[key];
                                    const isSelected = customerType === key;
                                    return (
                                        <div
                                            key={key}
                                            className={cn(
                                                "text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center justify-between border transition-all",
                                                isSelected 
                                                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm"
                                                    : "bg-zinc-50/70 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    isSelected 
                                                        ? (key === "none" ? "bg-rose-500 dark:bg-rose-600" : "bg-emerald-400 dark:bg-emerald-600")
                                                        : "bg-zinc-300 dark:bg-zinc-600"
                                                )} />
                                                <span>{c.label}</span>
                                            </div>
                                            {isSelected ? (
                                                <span className={cn(
                                                    "text-[10px] uppercase tracking-wider font-bold",
                                                    key === "none" ? "text-rose-400 dark:text-rose-600" : "text-emerald-400 dark:text-emerald-700"
                                                )}>
                                                    {key === "none" ? "Inaktiv / Gesperrt" : "Aktiv"}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{c.tagline}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pricing-Pläne Vergleich */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight">Übersicht der Tarifstufen</h3>
                        <p className="text-xs text-muted-foreground">
                            Transparente Abrechnung nach Zimmeranzahl – monatlich kündbar mit voller Kostenkontrolle.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {PRICING_PLANS.map((plan) => {
                        const PLAN_TIER_ORDER: Record<string, number> = { S: 1, M: 2, L: 3 };
                        const currentRank = PLAN_TIER_ORDER[planInfo.plan.id] || 1;
                        const thisRank = PLAN_TIER_ORDER[plan.id] || 1;

                        const isSubscribedPlan = subscriptionActive && customerType !== "none" && planInfo.plan.id === plan.id;
                        const isRecommendedPlan = (!subscriptionActive || customerType === "none") && planInfo.plan.id === plan.id;
                        const isHigherTier = subscriptionActive && customerType !== "none" && thisRank > currentRank;

                        return (
                            <Card 
                                key={plan.id}
                                className={cn(
                                    "relative flex flex-col justify-between transition-all duration-200",
                                    isSubscribedPlan
                                        ? "border-2 border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-500/10 bg-white dark:bg-zinc-900 scale-[1.02]"
                                        : isRecommendedPlan
                                        ? "border-2 border-blue-300 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/10 shadow-sm"
                                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 hover:border-zinc-300 dark:hover:border-zinc-700"
                                )}
                            >
                                {isSubscribedPlan && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                                        <Check className="w-3 h-3 stroke-[3]" /> Aktiver Tarif
                                    </div>
                                )}
                                {isRecommendedPlan && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Passend ({roomCount} Zimmer)
                                    </div>
                                )}
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                                        <Badge variant="secondary" className="text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                            {plan.tagline}
                                        </Badge>
                                    </div>
                                    <div className="flex items-baseline gap-1 my-2">
                                        <span className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                                            {plan.pricePerMonth}
                                        </span>
                                        <span className="text-xs text-zinc-500 font-medium">/ Monat</span>
                                    </div>
                                    <CardDescription className="text-xs min-h-[32px]">
                                        {plan.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-2.5 pt-0 pb-6 flex-1">
                                    <Separator className="my-2" />
                                    <div className="space-y-2">
                                        {plan.features.map((feat, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-0">
                                    <div className="w-full">
                                        {isSubscribedPlan ? (
                                            <div className="w-full py-2 text-center text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-900">
                                                Derzeit aktiv ({roomCount} {planInfo.roomsLimit ? `von ${planInfo.roomsLimit}` : ""} Zimmer)
                                            </div>
                                        ) : (!subscriptionActive || customerType === "none") ? (
                                            <Button 
                                                onClick={() => handleStartCheckout(plan.id)}
                                                disabled={checkoutLoading}
                                                className={cn(
                                                    "w-full text-xs gap-1.5",
                                                    isRecommendedPlan 
                                                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                                        : "bg-zinc-800 hover:bg-zinc-900 text-zinc-200"
                                                )}
                                            >
                                                <CreditCard className="w-3.5 h-3.5" />
                                                {isRecommendedPlan ? "Diesen Tarif wählen" : "Tarif buchen"}
                                            </Button>
                                        ) : isHigherTier ? (
                                            <Button 
                                                onClick={() => handleStartCheckout(plan.id)}
                                                disabled={checkoutLoading}
                                                className="w-full text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 gap-1.5 shadow-sm font-semibold"
                                            >
                                                <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                                                Auf {plan.name} upgraden
                                            </Button>
                                        ) : (
                                            <div className="w-full py-2 text-center text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                                                Unterhalb Ihres aktuellen Tarifs
                                            </div>
                                        )}
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Aktiver Leistungsumfang */}
            <div className="space-y-4 pt-2">
                <div>
                    <h3 className="text-xl font-bold tracking-tight">Aktiver Leistungsumfang</h3>
                    <p className="text-xs text-muted-foreground">
                        Alle Kernmodule sind für Ihre Pension vollumfänglich freigeschaltet und einsatzbereit.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {CORE_FEATURES.map((feature, idx) => (
                        <div 
                            key={idx}
                            className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="text-[10px] font-semibold text-zinc-500">
                                        {feature.category}
                                    </Badge>
                                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                                </div>
                                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 mb-1">
                                    {feature.name}
                                </h4>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Zusatzmodule */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold tracking-tight text-zinc-800 dark:text-zinc-200">Zusatzmodule & Erweiterungen</h3>
                            <Badge variant="outline" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-xs border-zinc-300 dark:border-zinc-700">
                                Noch nicht verfügbar
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Diese Zusatzmodule befinden sich aktuell noch in der Entwicklung. Sie können eine unverbindliche Freischaltungsanfrage an unser Team senden.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {ADDON_MODULES.map((module) => (
                        <Card 
                            key={module.id} 
                            className="relative border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 opacity-70 grayscale-[0.8] hover:grayscale-0 hover:opacity-100 transition-all duration-300 shadow-none hover:shadow-md rounded-2xl flex flex-col justify-between overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3">
                                <Badge variant="outline" className="gap-1 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800/60 text-[10px] font-semibold">
                                    <Lock className="w-3 h-3 text-zinc-500" /> Noch nicht verfügbar
                                </Badge>
                            </div>

                            <CardHeader className="pb-2">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                                    {module.category === "Integration" && <Globe className="w-5 h-5" />}
                                    {module.category === "Künstliche Intelligenz" && <Bot className="w-5 h-5" />}
                                    {module.category === "Automatisierung" && <Headphones className="w-5 h-5" />}
                                </div>
                                <CardTitle className="text-base font-bold">{module.title}</CardTitle>
                                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {module.subtitle}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3 pt-0">
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    {module.description}
                                </p>
                                <div className="space-y-1.5 pt-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                        Geplante Highlights:
                                    </span>
                                    <div className="space-y-1">
                                        {module.highlightFeatures.map((h, i) => (
                                            <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                                                <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                                                <span>{h}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full text-xs font-semibold gap-2 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                    onClick={() => handleOpenRequest(module)}
                                >
                                    <Send className="w-3.5 h-3.5" /> Freischaltung anfragen
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Kündigungs-Bestätigungsdialog */}
            <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
                            <AlertTriangle className="w-5 h-5" />
                            <DialogTitle className="text-lg font-bold">
                                {cancelModalMode === "immediate" 
                                    ? "Abonnement sofort beenden (Testmodus)?" 
                                    : "Abonnement zum Monatsende kündigen?"}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {cancelModalMode === "immediate" ? (
                                <span>
                                    <strong>Achtung Test-Funktion:</strong> Das Abonnement wird in Stripe und lokal mit sofortiger Wirkung beendet. Der Account fällt direkt auf den Teststatus zurück, sodass Sie sofort neue Checkout-Sessions und Abos testen können.
                                </span>
                            ) : (
                                <span>
                                    Ihr Zugriff auf den vollen Funktionsumfang bleibt bis zum <strong>Ende des aktuellen Abrechnungszeitraums</strong> uneingeschränkt bestehen. Es erfolgt danach keine automatische Verlängerung mehr.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setCancelModalOpen(false)}
                            disabled={cancelLoading}
                        >
                            Abbrechen
                        </Button>
                        <Button 
                            variant={cancelModalMode === "immediate" ? "destructive" : "default"}
                            size="sm" 
                            onClick={handleConfirmCancel}
                            disabled={cancelLoading}
                            className="gap-1.5"
                        >
                            {cancelLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                            {cancelModalMode === "immediate" ? "Sofort beenden (Reset)" : "Kündigung bestätigen"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Freischaltungs-Modal (Zusatzmodule) */}
            <Dialog open={!!requestModalModule} onOpenChange={(open) => !open && setRequestModalModule(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                            <Sparkles className="w-5 h-5" />
                            <DialogTitle className="text-lg font-bold">
                                Freischaltung anfragen: {requestModalModule?.title}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs">
                            Senden Sie eine Benachrichtigung an das Entwickler-Team, um als Pilotbetrieb für das Modul vorgemerkt zu werden.
                        </DialogDescription>
                    </DialogHeader>

                    {requestSuccess ? (
                        <div className="py-6 text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-sm">E-Mail-Anfrage vorbereitet!</h4>
                            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                                Ihr E-Mail-Programm sollte sich mit einer vorausgefüllten Nachricht an <strong>info@pensionsmanager.de</strong> geöffnet haben.
                            </p>
                            <Button 
                                size="sm" 
                                onClick={() => setRequestModalModule(null)}
                                className="mt-2"
                            >
                                Schließen
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSendRequest} className="space-y-4 pt-1">
                            <div className="space-y-2">
                                <Label htmlFor="req-email" className="text-xs font-semibold">Ihre Kontakt-E-Mail</Label>
                                <Input 
                                    id="req-email" 
                                    type="email" 
                                    value={requestEmail} 
                                    onChange={(e) => setRequestEmail(e.target.value)}
                                    placeholder="ihre-email@pension.de"
                                    required 
                                    className="text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="req-note" className="text-xs font-semibold">Individuelle Wünsche & Anmerkungen (optional)</Label>
                                <Textarea 
                                    id="req-note" 
                                    value={requestNote} 
                                    onChange={(e) => setRequestNote(e.target.value)}
                                    placeholder="z. B. Welche Funktionen oder OTA-Kanäle sind für Sie besonders wichtig?"
                                    rows={3}
                                    className="text-xs"
                                />
                            </div>

                            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-[11px] text-zinc-500 space-y-1 border border-zinc-200 dark:border-zinc-800">
                                <div><strong>Übermittelte Betriebsdaten:</strong></div>
                                <div>• Betrieb: {pensionName}</div>
                                <div>• Aktueller Tarif: {planInfo.plan.name} ({roomCount} Zimmer)</div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setRequestModalModule(null)}
                                >
                                    Abbrechen
                                </Button>
                                <Button 
                                    type="submit" 
                                    size="sm" 
                                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Send className="w-3.5 h-3.5" /> Anfrage absenden
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
