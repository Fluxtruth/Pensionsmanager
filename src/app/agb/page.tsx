"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Scale, FileCheck, AlertCircle, CreditCard, RefreshCw, Printer } from "lucide-react";
import Link from "next/link";

export default function AgbPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="group">
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Allgemeine Geschäftsbedingungen</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Nutzungs- und Lizenzbedingungen für die SaaS-Plattform „Pensionsmanager“</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex items-center gap-2"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" />
          Drucken / PDF
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="w-5 h-5 text-blue-600" />
              § 1 Geltungsbereich und Vertragspartner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-zinc-600 dark:text-zinc-400 text-sm">
            <p>
              (1) Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für sämtliche Verträge über die Nutzung der Software-as-a-Service-Lösung <strong>„Pensionsmanager“</strong> zwischen:
            </p>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-md text-xs font-mono text-zinc-800 dark:text-zinc-200">
              Philipp Tschakert, c/o IP-Management #6258, Ludwig-Erhard-Straße 18, 20459 Hamburg (nachfolgend „Anbieter“)
            </div>
            <p>
              und dem Kunden (nachfolgend „Kunde“ oder „Nutzer“).
            </p>
            <p>
              (2) Das Angebot richtet sich ausschließlich an gewerbliche Unternehmer im Sinne des § 14 BGB (z. B. Pensionen, Gästehäuser, Hotels, Ferienwohnungsvermieter). Verbraucher im Sinne des § 13 BGB sind von der Nutzung ausgeschlossen.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileCheck className="w-5 h-5 text-blue-600" />
              § 2 Vertragsgegenstand und Leistungsumfang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-zinc-600 dark:text-zinc-400 text-sm">
            <p>
              (1) Der Anbieter stellt dem Kunden eine modulare Verwaltungssoftware zur Buchungs-, Zimmer-, Meldeschein- und Gästeverwaltung als Kombination aus lokaler Desktop-Anwendung und Cloud-Synchronisation bereit.
            </p>
            <p>
              (2) Der konkrete Leistungsumfang richtet sich nach dem jeweils gewählten Tarif (Tarif S, Tarif M, Tarif L oder Enterprise) sowie eventuell gebuchten Zusatzmodulen.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
              § 3 Tarife, Preise und Zahlungsbedingungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-zinc-600 dark:text-zinc-400 text-sm">
            <p>
              (1) Die Nutzung der Software erfolgt auf Basis wiederkehrender monatlicher (oder jährlicher) Abonnements. Die aktuellen Preise ergeben sich aus der Preisübersicht zum Zeitpunkt des Vertragsschlusses.
            </p>
            <p>
              (2) Die Abrechnung erfolgt im Voraus über den Zahlungsdienstleister Stripe. Der Rechnungsbetrag wird automatisch über das hinterlegte Zahlungsmittel (Kreditkarte, SEPA-Lastschrift etc.) eingezogen.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              § 4 Vertragslaufzeit und Kündigung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-zinc-600 dark:text-zinc-400 text-sm">
            <p>
              (1) Das Abonnement verlängert sich jeweils automatisch um den vereinbarten Abrechnungszeitraum (monatlich bzw. jährlich), sofern es nicht vor Ablauf der Periode gekündigt wird.
            </p>
            <p>
              (2) Die Kündigung kann jederzeit unkompliziert direkt im Kunden-Account über das Stripe-Kundenportal oder per E-Mail an <a href="mailto:info@pensionsmanager.de" className="text-blue-600 hover:underline">info@pensionsmanager.de</a> mit Wirkung zum Ende des laufenden Abrechnungsmonats erklärt werden.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              § 5 Nutzungsrechte, Haftung und Schlussbestimmungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-zinc-600 dark:text-zinc-400 text-sm">
            <p>
              (1) Der Kunde erhält ein einfaches, nicht ausschließliches Nutzungsrecht für die Dauer des Abonnements.
            </p>
            <p>
              (2) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Ausschließlicher Gerichtsstand für alle Streitigkeiten ist Hamburg.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="pt-8 text-center">
        <p className="text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} Pensionsmanager. Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  );
}
