"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    ShieldCheck,
    Lock,
    FileText,
    ScrollText,
    Scale,
    Info,
    Download,
    Eye,
    Printer,
    ExternalLink,
    ArrowLeft,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LegalDoc {
    id: string;
    title: string;
    category: "DSGVO" | "Vertrag" | "Sicherheit" | "Allgemein";
    description: string;
    fileName: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeColor: string;
}

const LEGAL_DOCUMENTS: LegalDoc[] = [
    {
        id: "pilot",
        title: "Pilotvereinbarung",
        category: "Vertrag",
        description: "Regelt Testzeitraum, Zweckbindung (Erprobung), Verzicht auf feste SLAs, Haftungsausschluss und Rechte am Feedback.",
        fileName: "pilotvereinbarung.html",
        icon: ScrollText,
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
    },
    {
        id: "avv",
        title: "Auftragsverarbeitungsvertrag (AVV / DPA)",
        category: "DSGVO",
        description: "Pflichtvertrag nach Art. 28 DSGVO zur Verarbeitung von Gästedaten und Festlegung von Unterauftragsverarbeitern.",
        fileName: "avv_auftragsverarbeitungsvertrag.html",
        icon: ShieldCheck,
        badgeColor: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
    },
    {
        id: "toms",
        title: "Technische & Organisatorische Maßnahmen (TOMs)",
        category: "Sicherheit",
        description: "Anlage zum AVV gem. Art. 32 DSGVO: AES-GCM Verschlüsselung, Zugriffskontrollen, Backups und Mandantentrennung.",
        fileName: "toms_technische_organisatorische_massnahmen.html",
        icon: Lock,
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400"
    },
    {
        id: "nda",
        title: "Geheimhaltungsvereinbarung (NDA)",
        category: "Vertrag",
        description: "Schutz von nicht-öffentlichen UI/UX-Konzepten, Architekturen, Geschäftsmodellen und vertraulichen Daten.",
        fileName: "nda_geheimhaltungsvereinbarung.html",
        icon: FileText,
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
    },
    {
        id: "privacy",
        title: "Datenschutzerklärung (Privacy Policy)",
        category: "DSGVO",
        description: "Informationspflichten nach Art. 13/14 DSGVO über Nutzeraccounts, Fehlerberichte, Logs und Betroffenenrechte.",
        fileName: "datenschutzerklaerung.html",
        icon: Shield,
        badgeColor: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
    },
    {
        id: "tia",
        title: "TIA-Bewertung (Transfer Impact Assessment)",
        category: "DSGVO",
        description: "Risikoanalyse internationaler Datentransfers und Cloud-Infrastrukturen (EU-Standort Frankfurt am Main).",
        fileName: "tia_bewertung.html",
        icon: ShieldCheck,
        badgeColor: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
    },
    {
        id: "agb",
        title: "AGB & Nutzungsbedingungen",
        category: "Allgemein",
        description: "Lizenzbedingungen, Pflichten der Nutzer, Gewährleistungsausschluss und allgemeine Plattformregeln.",
        fileName: "agb_nutzungsbedingungen.html",
        icon: Scale,
        badgeColor: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
    },
    {
        id: "impressum",
        title: "Impressum & Anbieterkennzeichnung",
        category: "Allgemein",
        description: "Gesetzliche Anbieterkennzeichnung nach § 5 Digitale-Dienste-Gesetz (DDG).",
        fileName: "impressum.html",
        icon: Info,
        badgeColor: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
    }
];

export default function AccountRechtlichesPage() {
    const [selectedDoc, setSelectedDoc] = useState<LegalDoc | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>("Alle");
    const viewerIframeRef = React.useRef<HTMLIFrameElement>(null);

    const handleOpenDocument = (doc: LegalDoc) => {
        setSelectedDoc(doc);
        setIsViewerOpen(true);
    };

    const handlePrintDocument = (fileName: string) => {
        if (isViewerOpen && selectedDoc?.fileName === fileName && viewerIframeRef.current?.contentWindow) {
            try {
                viewerIframeRef.current.contentWindow.focus();
                viewerIframeRef.current.contentWindow.print();
                return;
            } catch (err) {
                console.error("Viewer iframe print failed, falling back to hidden iframe:", err);
            }
        }

        const existing = document.getElementById("legal-print-iframe") as HTMLIFrameElement;
        if (existing) {
            existing.remove();
        }
        const iframe = document.createElement("iframe");
        iframe.id = "legal-print-iframe";
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        iframe.style.opacity = "0";
        iframe.style.pointerEvents = "none";
        iframe.src = `/legal/${fileName}`;
        document.body.appendChild(iframe);
        iframe.onload = () => {
            setTimeout(() => {
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error("Print failed:", e);
                }
            }, 300);
        };
    };

    const handleOpenInNewWindow = async (doc: LegalDoc) => {
        try {
            if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
                const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
                const label = `legal-${doc.id}-${Date.now()}`;
                const webview = new WebviewWindow(label, {
                    url: `/legal/${doc.fileName}`,
                    title: `${doc.title} - Pensionsmanager`,
                    width: 960,
                    height: 850,
                    center: true,
                });
                webview.once("tauri://error", (e) => {
                    console.error("Tauri WebviewWindow error:", e);
                    window.open(`/legal/${doc.fileName}`, "_blank");
                });
            } else {
                window.open(`/legal/${doc.fileName}`, "_blank");
            }
        } catch (err) {
            console.error("Error opening window:", err);
            window.open(`/legal/${doc.fileName}`, "_blank");
        }
    };

    const handleDownloadHtml = async (doc: LegalDoc) => {
        try {
            const res = await fetch(`/legal/${doc.fileName}`);
            const text = await res.text();
            const blob = new Blob([text], { type: "text/html;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = doc.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download HTML failed:", err);
        }
    };

    const filteredDocs = categoryFilter === "Alle" 
        ? LEGAL_DOCUMENTS 
        : LEGAL_DOCUMENTS.filter(d => d.category === categoryFilter);

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl mx-auto">
            {/* Header mit Zurück-Link */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link 
                            href="/account" 
                            className="inline-flex items-center text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors gap-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Zurück zu Mein Account
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Rechtsdokumente & Compliance</h2>
                            <p className="text-muted-foreground">
                                Verträge, DSGVO-Auftragsverarbeitung, TOMs und Sicherheitsmaßnahmen.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Kategorie-Filter */}
                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg self-start sm:self-auto">
                    {["Alle", "DSGVO", "Vertrag", "Sicherheit", "Allgemein"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={cn(
                                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                                categoryFilter === cat
                                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Rechtsdokumente Tabelle Card */}
            <Card className="shadow-md border-zinc-200 dark:border-zinc-800">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-zinc-50/60 dark:bg-zinc-900/60">
                                <TableRow>
                                    <TableHead className="pl-6 py-3 font-semibold text-xs text-zinc-700 dark:text-zinc-300">Dokument</TableHead>
                                    <TableHead className="py-3 px-4 font-semibold text-xs text-zinc-700 dark:text-zinc-300 w-32">Kategorie</TableHead>
                                    <TableHead className="pr-6 py-3 font-semibold text-xs text-zinc-700 dark:text-zinc-300 text-right w-64">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDocs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-xs text-zinc-500">
                                            Keine Dokumente in dieser Kategorie gefunden.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredDocs.map((doc) => {
                                        const IconComponent = doc.icon;
                                        return (
                                            <TableRow 
                                                key={doc.id}
                                                className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors"
                                            >
                                                <TableCell className="pl-6 py-3 align-middle">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-1.5 mt-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 text-blue-600 dark:text-blue-400 shrink-0">
                                                            <IconComponent className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0 pr-4">
                                                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                                {doc.title}
                                                            </div>
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">
                                                                {doc.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 align-middle whitespace-nowrap">
                                                    <Badge variant="outline" className={cn("text-[10px] font-semibold tracking-wide", doc.badgeColor)}>
                                                        {doc.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="pr-6 py-3 text-right align-middle whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenDocument(doc)}
                                                            className="h-8 text-xs gap-1.5 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                                        >
                                                            <Eye className="w-3.5 h-3.5 text-zinc-500" />
                                                            <span>Ansehen</span>
                                                        </Button>
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => handlePrintDocument(doc.fileName)}
                                                            className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                            <span>PDF / Drucken</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* In-App Document Viewer Dialog */}
            <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
                <DialogContent className="max-w-4xl w-[95vw] h-[88vh] flex flex-col p-6">
                    <DialogHeader className="flex-shrink-0">
                        <div className="flex items-center justify-between pr-6">
                            <div className="flex items-center gap-2">
                                <DialogTitle className="text-xl font-bold">
                                    {selectedDoc?.title}
                                </DialogTitle>
                                {selectedDoc && (
                                    <Badge variant="outline" className={cn("text-xs", selectedDoc.badgeColor)}>
                                        {selectedDoc.category}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <DialogDescription className="text-xs text-zinc-500">
                            {selectedDoc?.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 w-full min-h-0 bg-white rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden my-2">
                        {selectedDoc && (
                            <iframe
                                ref={viewerIframeRef}
                                src={`/legal/${selectedDoc.fileName}`}
                                className="w-full h-full border-none bg-white"
                                title={selectedDoc.title}
                            />
                        )}
                    </div>

                    <DialogFooter className="flex-shrink-0 flex flex-wrap items-center justify-between gap-2 pt-2">
                        <div className="text-xs text-zinc-400 flex items-center gap-1">
                            <span>Tipp: Klicken Sie auf „Drucken / Als PDF“, um das Dokument sauber zu exportieren.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedDoc && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownloadHtml(selectedDoc)}
                                        className="gap-1.5 h-9 text-xs"
                                        title="HTML Quelldatei herunterladen"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        HTML Datei
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenInNewWindow(selectedDoc)}
                                        className="gap-1.5 h-9 text-xs"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        In neuem Fenster öffnen
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handlePrintDocument(selectedDoc.fileName)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-9 text-xs"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        Als PDF herunterladen / Drucken
                                    </Button>
                                </>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
