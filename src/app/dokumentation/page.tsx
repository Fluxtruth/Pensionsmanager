"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Code, Server, ArrowUpCircle, Mail, ListTodo, CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function DokumentationPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/impressum">
          <Button variant="ghost" size="icon" className="group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            System-Dokumentation
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Interne technische Übersicht und Backlog</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Technische Architektur */}
        <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
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
              <li><strong>Datenbank & Auth:</strong> Supabase (PostgreSQL)</li>
              <li><strong>Hosting:</strong> Vercel (Web), GitHub Releases (Desktop)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Stages und Umgebungen */}
        <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
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
        <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
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
        <Card className="border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
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
      <div className="pt-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <ListTodo className="w-7 h-7 text-indigo-600" />
          MoSCoW Backlog
        </h2>
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-t-4 border-t-red-500 shadow-sm dark:bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Must Have
                <AlertCircle className="w-5 h-5 text-red-500" />
              </CardTitle>
              <CardDescription>Kritisch für den Launch</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="line-through text-zinc-400 dark:text-zinc-500">Passwort Reset</li>
                <li>Payment</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-t-blue-500 shadow-sm dark:bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Should Have
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              </CardTitle>
              <CardDescription>Wichtig, aber nicht kritisch</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <li>Frühstück-UX verbessern</li>
                <li>Mobile App UI verbessern</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-500 shadow-sm dark:bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Could Have
                <Clock className="w-5 h-5 text-emerald-500" />
              </CardTitle>
              <CardDescription>Nice to have</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <li>UI Rework mit standardisierten Components</li>
                <li>Einheitliche Export Dokumente</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-zinc-500 shadow-sm dark:bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Won't Have
                <XCircle className="w-5 h-5 text-zinc-500" />
              </CardTitle>
              <CardDescription>Aktuell nicht geplant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-zinc-400 text-sm">
                Keine Einträge
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
