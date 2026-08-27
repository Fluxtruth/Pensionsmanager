"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SubscriptionRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Weiterleitung auf den Tarif- und Abonnementbereich
    router.replace("/account/tarif");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center border-none shadow-sm dark:bg-zinc-900/50">
        <CardHeader>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
            <CreditCard className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl">Abonnementverwaltung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sie werden zur Abonnement- und Tarifverwaltung weitergeleitet...
          </p>
          <Link href="/account/tarif" className="inline-block">
            <Button className="gap-2">
              Direkt zur Tarifverwaltung <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
