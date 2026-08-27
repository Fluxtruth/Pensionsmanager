"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Code, Server, ArrowUpCircle, Mail, ListTodo, CheckCircle2, AlertCircle, XCircle, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function AccountDokumentationPage() {
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
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">System-Dokumentation</h1>
              <p className="text-muted-foreground">Interne technische Übersicht, Architektur und Feature-Backlog.</p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Technische Architektur */}
        <Card className="border shadow-md bg-white dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Code className="w-6 h-6" />
              </div>
              Technische Architektur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-600 dark:text-zinc-300">
            <p>
              Die Anwendung basiert auf einem modernen Stack für hochperformante Desktop-Anwendungen:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Frontend:</strong> Next.js (React), Tailwind CSS, Shadcn UI</li>
              <li><strong>Backend (Desktop):</strong> Tauri (Rust)</li>
              <li><strong>Datenbank & Auth:</strong> Supabase (PostgreSQL) + Local SQLite</li>
              <li><strong>Hosting:</strong> Vercel (Web), GitHub Releases (Desktop)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Stages und Umgebungen */}
        <Card className="border shadow-md bg-white dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Server className="w-6 h-6" />
              </div>
              Stages & Umgebungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-600 dark:text-zinc-300">
            <div className="space-y-4">
              <div className="flex items-start gap-3 border-l-2 border-emerald-500 pl-4">
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Production</h4>
                  <p className="text-sm">Live-System, stabile Releases via `main` Branch.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-l-2 border-yellow-500 pl-4">
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Development (Staging)</h4>
                  <p className="text-sm">Test-Umgebung, automatische Deployments aus dem `develop` Branch.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-l-2 border-zinc-500 pl-4">
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Local</h4>
                  <p className="text-sm">Entwickler-Umgebung auf localhost via `npm run tauri dev`.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Updater Dokumentation */}
        <Card className="border shadow-md bg-white dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                <ArrowUpCircle className="w-6 h-6" />
              </div>
              Updater
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-600 dark:text-zinc-300">
            <p>
              Die App verwendet den integrierten Tauri-Updater. Er überprüft beim Start und periodisch auf neue Versionen.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Endpunkt:</strong> GitHub Releases / Tauri Updater JSON</li>
              <li><strong>Signatur:</strong> Alle Releases sind mit einem privaten Schlüssel signiert, der Client validiert diese mit dem öffentlichen Schlüssel.</li>
              <li><strong>Flow:</strong> Benachrichtigung an User -&gt; Download im Hintergrund -&gt; Neustart zur Installation.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Mailserver Dokumentation */}
        <Card className="border shadow-md bg-white dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <Mail className="w-6 h-6" />
              </div>
              Mailserver
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-600 dark:text-zinc-300">
            <p>
              Der E-Mail-Versand (z.B. für Passwort-Resets oder Bestätigungen) erfolgt über SMTP.
            </p>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg text-sm font-mono space-y-1">
              <p><span className="text-zinc-500">Host:</span> smtp.pensionsmanager.de</p>
              <p><span className="text-zinc-500">Port:</span> 465 / 587 (TLS)</p>
              <p><span className="text-zinc-500">Absender:</span> info@pensionsmanager.de</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MoSCoW Backlog */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
          <ListTodo className="w-6 h-6 text-indigo-600" />
          MoSCoW Backlog
        </h2>
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-t-4 border-t-red-500 shadow-sm dark:bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Must Have
                <AlertCircle className="w-4 h-4 text-red-500" />
              </CardTitle>
              <CardDescription className="text-xs">Kritisch für den Launch</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                <li className="line-through text-zinc-400 dark:text-zinc-500">Passwort Reset</li>
                <li>Payment</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-t-blue-500 shadow-sm dark:bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Should Have
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              </CardTitle>
              <CardDescription className="text-xs">Wichtig, aber nicht kritisch</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                <li>Frühstück-UX verbessern</li>
                <li>Mobile App UI verbessern</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-500 shadow-sm dark:bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Could Have
                <Clock className="w-4 h-4 text-emerald-500" />
              </CardTitle>
              <CardDescription className="text-xs">Nice to have</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                <li>UI Rework mit standardisierten Components</li>
                <li>Einheitliche Export Dokumente</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-zinc-500 shadow-sm dark:bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Won't Have
                <XCircle className="w-4 h-4 text-zinc-500" />
              </CardTitle>
              <CardDescription className="text-xs">Aktuell nicht geplant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-zinc-400 text-xs">
                Keine Einträge
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
