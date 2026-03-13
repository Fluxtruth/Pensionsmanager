"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Info, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";

export default function ImpressumPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="group">
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Impressum</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Rechtliche Angaben und Kontaktinformationen</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="w-5 h-5 text-blue-600" />
              Angaben gemäß § 5 TMG
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-100">Philipp Tschakert</p>
              <p className="text-zinc-600 dark:text-zinc-400">c/o IP-Management #6258</p>
              <p className="text-zinc-600 dark:text-zinc-400">Ludwig-Erhard-Straße 18</p>
              <p className="text-zinc-600 dark:text-zinc-400">20459 Hamburg</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="w-5 h-5 text-blue-600" />
              Kontakt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4" />
              <span>Telefon: 030 23597650</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4" />
              <a href="mailto:info@pensionsmanager.de" className="hover:text-blue-600 transition-colors">info@pensionsmanager.de</a>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-blue-600 font-bold">€</span>
              Umsatzsteuer-ID
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-zinc-500">Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:</p>
            <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100 italic">DE455319628</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-zinc-900 dark:text-zinc-100">Philipp Tschakert</p>
            <p className="text-zinc-600 dark:text-zinc-400">Ludwig-Erhard-Straße 18</p>
            <p className="text-zinc-600 dark:text-zinc-400">20459 Hamburg</p>
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
