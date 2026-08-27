"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Shield, Lock, Database, FileText, Printer } from "lucide-react";
import Link from "next/link";

export default function DatenschutzPage() {
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
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Datenschutzerklärung</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Informationen zur Verarbeitung personenbezogener Daten nach Art. 13, 14 DSGVO</p>
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
              <Shield className="w-5 h-5 text-blue-600" />
              1. Name und Anschrift des Verantwortlichen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-600 dark:text-zinc-400">
            <p>
              Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze ist:
            </p>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200">
              <p className="font-semibold">Philipp Tschakert</p>
              <p>c/o IP-Management #6258</p>
              <p>Ludwig-Erhard-Straße 18</p>
              <p>20459 Hamburg, Deutschland</p>
              <p className="mt-2">E-Mail: <a href="mailto:info@pensionsmanager.de" className="text-blue-600 hover:underline">info@pensionsmanager.de</a></p>
              <p>Telefon: 030 23597650</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5 text-blue-600" />
              2. Grundsatz: Offline-First & Datensouveränität
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-zinc-600 dark:text-zinc-400">
            <p>
              Bei Pensionsmanager gilt das Prinzip der Datensparsamkeit und maximalen Datensouveränität für Beherbergungsbetriebe:
            </p>
            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900 text-sm text-blue-950 dark:text-blue-200">
              <strong>Lokale Datenspeicherung:</strong> Ihre operativen Gästedaten, Buchungsdetails und Zimmerpläne werden primär auf Ihrem lokalen Endgerät in einer SQLite-Datenbank gespeichert. Die optionale Cloud-Synchronisation erfolgt verschlüsselt zur Datensicherung und zum Abgleich autorisierter Arbeitsplätze.
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-5 h-5 text-blue-600" />
              3. Erhebung von Nutzer- und Kontodaten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-zinc-600 dark:text-zinc-400 text-sm">
            <p>Bei der Registrierung und Nutzung eines Benutzerkontos erheben wir:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>E-Mail-Adresse und verschlüsselte Authentifizierungsdaten (Supabase Auth)</li>
              <li>Zeitpunkt der Kontoerstellung und der letzten Anmeldung</li>
              <li>Gerätekennungen (Device-IDs) zur Autorisierung und Synchronisationsverwaltung</li>
              <li>Abrechnungs- und Zahlungsstatus (über unseren Zahlungsdienstleister Stripe)</li>
            </ul>
            <p className="pt-2">
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung bzw. Durchführung vorvertraglicher Maßnahmen).
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              4. Zahlungsabwicklung (Stripe)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-zinc-600 dark:text-zinc-400 text-sm">
            <p>
              Zur sicheren Abwicklung von Zahlungen und wiederkehrenden Abonnements nutzen wir den Zahlungsdienstleister <strong>Stripe Payments Europe, Ltd.</strong>, 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland.
            </p>
            <p>
              Die im Rahmen des Zahlungsvorgangs eingegebenen Zahlungsdaten (z. B. Kreditkartennummer, IBAN) werden direkt von Stripe verarbeitet und nicht auf unseren Servern gespeichert. Wir erhalten lediglich Transaktionsbestätigungen, Rechnungs-IDs und Abonnement-Statusmeldungen.
            </p>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-blue-600" />
              5. Rechte der betroffenen Person
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-zinc-600 dark:text-zinc-400 text-sm">
            <p>Sie haben nach der DSGVO folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
              <li>Recht auf Löschung (Art. 17 DSGVO)</li>
              <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruchsrecht gegen die Verarbeitung (Art. 21 DSGVO)</li>
            </ul>
            <p className="pt-2">
              Zur Ausübung Ihrer Rechte können Sie sich jederzeit formlos per E-Mail an <a href="mailto:info@pensionsmanager.de" className="text-blue-600 hover:underline">info@pensionsmanager.de</a> wenden.
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
