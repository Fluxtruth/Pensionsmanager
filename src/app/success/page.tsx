"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, ShieldCheck, Mail, CreditCard, Loader2 } from "lucide-react";
import { initDb } from "@/lib/db";
import { SyncService } from "@/lib/sync";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [activating, setActivating] = useState(true);

  useEffect(() => {
    const activateSubscription = async () => {
      try {
        let subscriptionId = "sub_active";

        if (sessionId) {
          try {
            const res = await fetch("/api/checkout-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.subscriptionId) {
                subscriptionId = data.subscriptionId;
              }
            }
          } catch (e) {
            console.warn("Could not retrieve Stripe session details:", e);
          }
        }

        const pId = await SyncService.getInstance().getPensionId();
        const db = await initDb(pId || undefined);
        if (db) {
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
            ["stripe_cancel_at_period_end", "0", pId]
          );
          await db.execute(
            "INSERT OR REPLACE INTO settings (key, value, pension_id, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
            ["stripe_subscription_id", subscriptionId, pId]
          );
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("settings-changed", {
              detail: { customer_type: "subscriber", stripe_subscription_status: "active" },
            })
          );
        }
      } catch (err) {
        console.error("Error activating subscription on success page:", err);
      } finally {
        setActivating(false);
      }
    };

    activateSubscription();
  }, [sessionId]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center border-none shadow-lg dark:bg-zinc-900/70 backdrop-blur-md">
        <CardHeader className="pb-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            {activating ? (
              <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
            ) : (
              <CheckCircle2 className="w-9 h-9" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {activating ? "Abonnement wird aktiviert..." : "Vielen Dank für Ihre Bestellung!"}
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
            {activating
              ? "Ihr Kontostatus wird aktualisiert und die App freigeschaltet..."
              : "Ihr Abonnement wurde erfolgreich aktiviert und ist nun für Ihre Pension freigeschaltet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 text-left bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              <span>Sofortiger Zugriff auf alle gebuchten Funktionen & Zimmerkontingente</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Ihre Rechnung & Zahlungsbestätigung werden von Stripe per E-Mail zugestellt</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Fragen? Kontaktieren Sie uns jederzeit unter{" "}
                <a href="mailto:info@pensionsmanager.de" className="text-blue-600 hover:underline">
                  info@pensionsmanager.de
                </a>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link href="/account/tarif" className="flex-1">
              <Button variant="outline" className="w-full">
                Tarifübersicht
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                Zum Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {sessionId && (
            <div className="pt-2 text-[11px] text-zinc-400 dark:text-zinc-500 text-center font-mono select-all">
              Transaktions-Referenz: {sessionId}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Laden...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
