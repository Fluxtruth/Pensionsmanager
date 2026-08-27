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
    ExternalLink
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
                if (custTypeRes.length > 0 && custTypeRes[0].value in CUSTOMER_TYPES) {
                    setCustomerType(custTypeRes[0].value as CustomerTypeKey);
                }

                // Fetch pension name from branding
                const titleRes = await db.select<{ value: string }[]>(
                    "SELECT value FROM settings WHERE key = 'branding_title' AND (pension_id = ? OR ? IS NULL)",
                    [pId, pId]
                );
                if (titleRes.length > 0 && titleRes[0].value) {
                    setPensionName(titleRes[0].value);
                }
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
        syncEvents.on("sync-completed", handleSync);
        return () => syncEvents.off("sync-completed", handleSync);
    }, []);

    const handleSaveCustomerType = async (type: CustomerTypeKey) => {
        setCustomerType(type);
        try {
            const pId = await SyncService.getInstance().getPensionId();
            const db = await initDb(pId || undefined);
            if (db) {
                const now = new Date().toISOString();
                await db.execute(
                    "INSERT OR REPLACE INTO settings (key, value, updated_at, pension_id) VALUES (?, ?, ?, ?)",
                    ["customer_type", type, now, pId]
                );
            }
        } catch (err) {
            console.error("Failed to save customer type:", err);
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
                            <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border-rose-200 dark:border-rose-800 text-xs font-semibold px-2.5 py-0.5">
                                Aktiver Plan: {planInfo.plan.name}
                            </Badge>
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            Übersicht Ihres aktuellen Pricing-Plans, Zimmerkontingents, aktiven Leistungsumfangs und zubuchbarer Erweiterungen.
                        </p>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Status-Karten Grid: Aktiver Tarif & Kundentyp */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Aktiver Tarif & Zimmer-Auslastung */}
                <Card className="md:col-span-2 shadow-md border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-blue-950/20">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold">
                                        Aktueller Tarif: {planInfo.plan.name}
                                    </CardTitle>
                                    <CardDescription>
                                        {planInfo.plan.tagline} • {planInfo.plan.pricePerMonth} / Monat
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="font-semibold text-blue-700 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/40 border-blue-300 dark:border-blue-800">
                                Automatisch eingestuft
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
                                    Die Tarifeinstufung passt sich flexibel Ihrer tatsächlichen Zimmeranzahl an. Sie zahlen stets nur das Kontingent, das Sie tatsächlich nutzen.
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Kundentyp Card */}
                <Card className="shadow-md border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Crown className="w-5 h-5 text-amber-500" />
                                <CardTitle className="text-base font-bold">Kundentyp</CardTitle>
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
                                Kundentyp wechseln (Entwicklungsstand)
                            </Label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {(Object.keys(CUSTOMER_TYPES) as CustomerTypeKey[]).map((key) => {
                                    const c = CUSTOMER_TYPES[key];
                                    const isSelected = customerType === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => handleSaveCustomerType(key)}
                                            className={cn(
                                                "text-xs px-2 py-1.5 rounded-md font-medium text-center border transition-all",
                                                isSelected 
                                                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm"
                                                    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                                            )}
                                        >
                                            {c.label.replace("-Kunde", "")}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 leading-snug">
                            <strong className="text-zinc-700 dark:text-zinc-300">Hinweis:</strong> Alle Kundentypen haben im aktuellen Entwicklungsstand identischen, vollen Zugriff auf alle Funktionen.
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
                        const isActive = planInfo.plan.id === plan.id;
                        return (
                            <Card 
                                key={plan.id}
                                className={cn(
                                    "relative flex flex-col justify-between transition-all duration-200",
                                    isActive 
                                        ? "border-2 border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-500/10 bg-white dark:bg-zinc-900 scale-[1.02]"
                                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 hover:border-zinc-300 dark:hover:border-zinc-700"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                                        <Check className="w-3 h-3 stroke-[3]" /> Aktiver Tarif
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
                                        {isActive ? (
                                            <div className="w-full py-2 text-center text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-900">
                                                Derzeit aktiv ({roomCount} Zimmer)
                                            </div>
                                        ) : (
                                            <div className="w-full py-2 text-center text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                                                {plan.id === "S" && roomCount > 5 ? "Unterhalb Ihres Kontingents" : "Aktiv ab passender Zimmeranzahl"}
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

            {/* Zusatzmodule (Ausgegraut & Gesperrt / Noch nicht verfügbar) */}
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

                            <CardHeader className="pb-3">
                                <div className="w-10 h-10 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center mb-3 text-zinc-600 dark:text-zinc-400">
                                    {module.id === "booking-com" && <Globe className="w-5 h-5" />}
                                    {module.id === "ai-assistant" && <Bot className="w-5 h-5" />}
                                    {module.id === "ai-reception" && <Headphones className="w-5 h-5" />}
                                </div>
                                <CardTitle className="text-base font-bold text-zinc-800 dark:text-zinc-200">{module.title}</CardTitle>
                                <CardDescription className="text-xs font-semibold text-zinc-500">
                                    {module.subtitle}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4 pt-0 flex-1">
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    {module.description}
                                </p>
                                <div className="space-y-1.5 bg-zinc-100/80 dark:bg-zinc-950/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Highlights (Geplant)</div>
                                    {module.highlightFeatures.map((h, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                                            <span>{h}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>

                            <CardFooter className="pt-0">
                                <Button 
                                    variant="outline" 
                                    className="w-full gap-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-colors text-xs font-semibold"
                                    onClick={() => handleOpenRequest(module)}
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    Freischaltung anfragen
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Modal: Freischaltung anfragen (Mail an info@pensionsmanager.de) */}
            <Dialog open={!!requestModalModule} onOpenChange={(open) => { if (!open) setRequestModalModule(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-blue-600" />
                            Freischaltung anfragen: {requestModalModule?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Senden Sie eine Anfrage direkt per E-Mail an <strong className="text-zinc-900 dark:text-zinc-100">info@pensionsmanager.de</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {requestSuccess ? (
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-base">E-Mail-Anfrage vorbereitet!</h4>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Ihr Standard-E-Mail-Programm wurde mit der vorformulierten Anfrage an <strong>info@pensionsmanager.de</strong> aufgerufen.
                                </p>
                            </div>
                            {lastMailtoUrl && (
                                <div className="pt-2 flex flex-col gap-2">
                                    <a href={lastMailtoUrl}>
                                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 text-xs">
                                            <ExternalLink className="w-3.5 h-3.5" /> E-Mail-Programm erneut öffnen
                                        </Button>
                                    </a>
                                </div>
                            )}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs text-zinc-500" 
                                onClick={() => setRequestModalModule(null)}
                            >
                                Schließen
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSendRequest} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="req-pension">Pension / Betriebsname</Label>
                                <Input 
                                    id="req-pension" 
                                    value={pensionName} 
                                    onChange={(e) => setPensionName(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="req-email">Ihre Kontakt-E-Mail</Label>
                                <Input 
                                    id="req-email" 
                                    type="email" 
                                    placeholder="pension@beispiel.de" 
                                    value={requestEmail}
                                    onChange={(e) => setRequestEmail(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="req-note">Besondere Wünsche oder Anmerkungen (optional)</Label>
                                <Textarea 
                                    id="req-note" 
                                    placeholder="z.B. geplante Anbindungstermine, Anforderungen..."
                                    value={requestNote}
                                    onChange={(e) => setRequestNote(e.target.value)}
                                    className="resize-none text-xs"
                                    rows={3}
                                />
                            </div>
                            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                <Info className="w-4 h-4 shrink-0" />
                                <span>Beim Absenden öffnet sich eine vorformulierte E-Mail an <strong>info@pensionsmanager.de</strong>.</span>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => setRequestModalModule(null)}
                                >
                                    Abbrechen
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
                                >
                                    <Mail className="w-4 h-4" /> E-Mail absenden
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
