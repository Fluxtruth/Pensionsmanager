# Produkte und Dienstleistungen – Pensionsmanager

> **Zweck dieses Dokuments:**  
> Detaillierte und strukturierte Beschreibung der angebotenen Produkte, Software-Lizenzen, Software-as-a-Service (SaaS)-Dienstleistungen und Zusatzmodule. Dieses Dokument dient der internen Dokumentation, dem Produktmanagement sowie als Vorlage für Verifizierungen bei Zahlungsdienstleistern (z. B. Stripe, PayPal) und Behörden.

---

## 1. Kurzzusammenfassung (Executive Summary / Für Payment-Provider)

**Pensionsmanager** ist eine spezialisierte B2B-Software-as-a-Service (SaaS)-Lösung und Desktop-Verwaltungssoftware für Betreiber von Pensionen, Gästehäusern, Boutique-Hotels, Monteurzimmern und Ferienunterkünften. 

Wir bieten:
* **Digitale Software-Abonnements (SaaS / Lizenzierung):** Monatlich oder jährlich abgerechnete Software-Tarife zur ganzheitlichen Verwaltung von Zimmerbelegungen, Gästekarteien, Reinigungsplänen, Meldescheinen und Tourismusabgaben.
* **Optionale digitale Zusatzmodule (Add-ons):** Erweiterungsfunktionen wie Channel-Manager-Synchronisation (z. B. Booking.com), KI-gestützte Gästekommunikation und automatisierte Empfangslösungen.
* **Onboarding- & Support-Dienstleistungen:** Technische Unterstützung, Datenmigrationshilfen und Kundensupport.

---

## 2. Detaillierte Art der Produkte und Dienstleistungen

### A. Kernprodukt: Pensionsmanager SaaS-Plattform
Eine moderne Verwaltungssoftware (Hybrid aus lokaler Desktop-Anwendung via Tauri und cloudbasierter Synchronisation via Supabase), die offline-fähig arbeitet und betriebliche Kernprozesse automatisiert.

#### Kernfunktionen im Basispaket:
1. **Echtzeit-Buchungsplan & Kalender:**
   * Interaktive grafische Belegungsübersicht mit Drag & Drop.
   * Schnelle Erfassung, Verschiebung und Verlängerung von Reservierungen.
2. **Zimmer- & Kontingentverwaltung:**
   * Verwaltung von Zimmerkategorien, Bettenarten, Ausstattungsmerkmalen und saisonalen Preisen.
3. **Digitale Gästekartei (DSGVO-konform):**
   * Verwaltung von Kontaktdaten, Buchungshistorie, individuellen Vorlieben und Ausweisdokumenten.
4. **Housekeeping- & Aufgabenmanagement:**
   * Automatische Erfassung des Reinigungsstatus, Zimmerfreigaben und Übergabeprotokolle für das Reinigungspersonal.
5. **Frühstücks- & Versorgungsliste:**
   * Tagesaktuelle Übersichten über anwesende Gäste, Sonderwünsche, Allergien und Verpflegungsarten.
6. **Tourismusmeldung & Meldeschein-Export:**
   * Berechnung von Kurtaxen / Tourismusabgaben und Erstellung behördengerechter Meldescheine.
7. **Offline-First & Cloud-Synchronisation:**
   * Höchste Ausfallsicherheit durch lokale SQLite-Datenbank bei gleichzeitig Ende-zu-Ende verschlüsselter Cloud-Synchronisation über mehrere Arbeitsplätze hinweg.

---

### B. Tarif- & Preismodelle (Wiederkehrende Abonnements)

Die Software wird als flexibles monatliches Software-Abonnement (Subscription) bereitgestellt. Die Tarife skalieren mit der Anzahl der verwalteten Zimmer:

| Tarifstufe | Zimmerkontingent | Monatlicher Preis (inkl. MwSt.) | Enthaltene Leistungen |
| :--- | :--- | :--- | :--- |
| **Tarif S (Small)** | 1 bis 5 Zimmer | **24,99 € / Monat** | Voller Funktionsumfang, Buchungsplan, Gästekartei, Offline-Modus & Cloud-Sync |
| **Tarif M (Medium)** | 6 bis 15 Zimmer | **34,99 € / Monat** | Voller Funktionsumfang, ideal für wachsende Pensionen und Ferienhausanlagen |
| **Tarif L (Large)** | Ab 16 Zimmern (unbegrenzt) | **44,99 € / Monat** | Voller Funktionsumfang ohne Limitierung der Zimmeranzahl |
| **Enterprise** | Individuell | *Auf Anfrage* | Mehrbetriebs-Verwaltung, individuelle Schnittstellen und dedizierter Support |

*Hinweis für Testkunden:* Im Rahmen von Pilot- und Testphasen wird ein zeitlich befristeter Testzugang (Alpha-/Pilotbetrieb) gemäß gesonderter Pilotvereinbarung bereitgestellt.

---

### C. Digitale Zusatzmodule & Erweiterungen (Add-ons)

Zur bedarfsgerechten Erweiterung des Funktionsumfangs werden spezialisierte digitale Module angeboten:

1. **Booking.com & OTA-Channel-Manager:**
   * Automatische Zwei-Wege-Synchronisation von Zimmerverfügbarkeiten, Preisen und Buchungen zur Vermeidung von Überbuchungen.
2. **KI-Assistent für Gästekommunikation:**
   * Automatisierte, mehrsprachige Entwürfe für Buchungsbestätigungen, Begrüßungsschreiben, Rechnungsbegleittexte und Antworten auf Gästefragen.
3. **KI-Rezeption & Digitaler Check-In:**
   * 24/7 telefonischer Empfang, automatisierte Schlüsselcode-Vergabe und Self-Check-In-Funktionen für Gäste.

---

### D. Ergänzende IT- & Beratungsdienstleistungen

* **Technischer Kundensupport:** First- und Second-Level-Support per E-Mail und Ticketsystem.
* **Onboarding & Datenübernahme:** Unterstützung bei der Ersteinrichtung von Zimmerkontingenten, Preislisten und bestehenden Gästedatenbeständen.

---

## 3. Zielgruppe und Kundenkreis

Unsere Dienstleistungen und Produkte richten sich primär an gewerbliche Kunden (B2B):
* Inhaber und Betreiber von Pensionen und Gasthöfen
* Vermieter von Ferienwohnungen, Ferienhäusern und Apartments
* Betreiber von Monteurunterkünften und Privatzimmern
* Kleinere Boutique-Hotels und Beherbergungsbetriebe

---

## 4. Bereitstellungs- und Erbringungsmodell (Fulfillment)

* **Art der Bereitstellung:** Rein digital.
* **Lieferzeitpunkt:** Unmittelbar nach Vertragsschluss bzw. erfolgreicher Online-Zahlung / Registrierung.
* **Zugang:** Der Kunde erhält sofortigen Zugriff auf die Desktop-Applikation (Download) und die Cloud-Synchronisation über seine registrierten Benutzerdaten.
* **Abrechnungszyklus:** Wiederkehrend monatlich (bzw. jährlich bei entsprechender Option).
* **Kündigungsfristen:** Kundenfreundlich monatlich zum Ende des laufenden Abrechnungszeitraums kündbar (sofern nicht vertraglich anders vereinbart).

---

## 5. Vorlage für Online-Formulare & Zahlungsabwickler (Stripe / PayPal Copy-Paste)

> **Kurzbeschreibung für Eingabefelder (z. B. Stripe Business Profile):**
> 
> *„Wir entwickeln und vertreiben 'Pensionsmanager', eine Software-as-a-Service (SaaS)-Verwaltungslösung für Pensionen, Ferienwohnungen und kleine Beherbergungsbetriebe. Wir bieten monatliche Software-Abonnements (ab 24,99 €/Monat) für Belegungsplanung, Gästeverwaltung, Rechnungsstellung und Zimmerkontingent-Management sowie optionale digitale Zusatzmodule (OTA-Synchronisation, KI-Gästekommunikation). Die Bereitstellung erfolgt rein digital und sofort nach Freischaltung.“*
