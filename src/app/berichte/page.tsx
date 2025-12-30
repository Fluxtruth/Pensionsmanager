"use client";

import React, { useState } from "react";
import { BarChart3, Download, FileText, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ReportsPage() {
    const [data] = useState([
        { id: "1", guest: "Schmidt", checkin: "01.12.2025", checkout: "05.12.2025", duration: 4, type: "Tourismus" },
        { id: "2", guest: "Müller", checkin: "10.12.2025", checkout: "12.12.2025", duration: 2, type: "Business" },
    ]);

    const exportCSV = () => {
        const headers = ["ID", "Gast", "Check-in", "Check-out", "Nächte", "Typ"];
        const rows = data.map(r => [r.id, r.guest, r.checkin, r.checkout, r.duration, r.type]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Tourismusmeldung_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Berichte & Meldungen</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Erstelle gesetzliche Meldungen und analysiere deine Auslastung.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            Tourismusmeldung
                        </CardTitle>
                        <CardDescription>Datenexport für die Gemeinde (CSV-Format).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border">
                                <div className="text-sm font-medium mb-1">Berichtszeitraum</div>
                                <div className="text-xs text-zinc-500">Letzter Monat: 01.12 - 31.12</div>
                            </div>
                            <Button onClick={exportCSV} className="w-full">
                                <Download className="w-4 h-4 mr-2" />
                                CSV Exportieren
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-500" />
                            Statistik
                        </CardTitle>
                        <CardDescription>Auslastung und Umsatz Analyse.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
                            <p className="text-xs text-zinc-500">Diagramme werden nach Datenaufnahme generiert.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
