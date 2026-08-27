# Feature: Rechtsdokumente & Compliance-Integration

## Technical Overview
Erstellung und Ablage standardisierter, druckoptimierter Rechts- und Compliance-Dokumente im Ordner `Legal` und Bereitstellung über `public/legal/`. Integration eines zentralen Dokumenten- und Compliance-Bereichs auf der Seite "Mein Account" (`src/app/account/page.tsx`) mit Dokumentenanzeige (In-App-Vollansicht) und PDF-Download/Druckfunktion (`window.print`). Zudem Bereinigung der Seite "Datenbank & Datensicherheit" (`src/app/admin/database/page.tsx`), indem der bisherige GDPR/DSGVO-Abschnitt entfernt wird.

Zu erstellende Dokumente:
1. Pilotvereinbarung (Pilot Agreement)
2. Auftragsverarbeitungsvertrag (AVV / DPA gem. Art. 28 DSGVO)
3. Technische und organisatorische Maßnahmen (TOMs gem. Art. 32 DSGVO)
4. Geheimhaltungsvereinbarung (NDA)
5. Datenschutzerklärung (Privacy Policy gem. Art. 13/14 DSGVO)
6. TIA-Bewertung (Transfer Impact Assessment)
7. Allgemeine Geschäftsbedingungen / Nutzungsbedingungen (AGB)
8. Impressum & Anbieterkennzeichnung (§ 5 DDG)

## User Story
Als Betreiber und Tester/Kunde des Pensionsmanagers möchte ich direkt im Profil unter "Mein Account" auf alle relevanten rechtlichen Verträge, Datenschutz- und Sicherheitsdokumente zugreifen, diese im System ansehen und als PDF herunterladen oder ausdrucken können, damit alle rechtlichen und datenschutzrechtlichen Anforderungen (DSGVO) transparent erfüllt sind.

## Acceptance Criteria
- [x] Ordner `Legal/` enthält HTML-Vorlagen für alle 8 Rechtsdokumente (Pilotvereinbarung, AVV, TOMs, NDA, Datenschutzerklärung, TIA-Bewertung, AGB, Impressum).
- [x] Dokumente sind unter `public/legal/` erreichbar und für Print-to-PDF (`@media print`) optimiert.
- [x] Auf der Seite "Mein Account" (`/account`) gibt es eine Sektion "Rechtsdokumente & Compliance" mit allen Dokumenten.
- [x] Jedes Dokument kann direkt in der App eingesehen und als PDF heruntergeladen/gedruckt werden.
- [x] Auf der Seite "Datenbank & Datensicherheit" (`/admin/database`) ist die alte Sektion "GDPR / DSGVO" entfernt und das Layout harmonisiert.
