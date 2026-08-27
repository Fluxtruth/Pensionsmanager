# Feature: Update & Versionshinweise unter Mein Account

## 1. Technischer Überblick
Verschieben des Bereichs „Software-Update“ von der Konfigurationsseite (`/konfiguration`) auf eine neu geschaffene, dedizierte Seite **„Update & Versionshinweise“** (`/account/updates`) unterhalb von **„Mein Account“**. 
Zusätzlich zur Update-Prüfung bietet die Seite eine strukturierte, interaktive Übersicht über alle bisherigen Versionen und Changelogs (Versionshinweise), sortiert nach Version und Release-Datum mit Kategorien wie *Features*, *Verbesserungen*, *Bugfixes* und *Sicherheit*.

## 2. User Story
- **Als** Pensionsbetreiber / Administrator,
- **möchte ich** Software-Updates und Versionshinweise an einem zentralen Ort unter „Mein Account“ einsehen und anstoßen können,
- **damit** die Konfigurationsseite auf Systemeinstellungen fokussiert bleibt und ich mich transparent über Neuerungen und Fehlerbehebungen in jeder Version informieren kann.

## 3. Akzeptanzkriterien
1. **Konfigurationsseite:** Der Card-Block „Software-Update“ ist von `/konfiguration` entfernt.
2. **Neue Seite `/account/updates`:**
   - Anzeige der aktuellen Versionsnummer (dynamisch via Tauri-API oder Fallback).
   - Button „Nach Updates suchen“, welcher das Event `check-for-updates` auslöst.
   - Übersicht der Versionshinweise / Changelog mit Versionsnummer, Datum und kategorisierten Änderungspunkten.
   - Filter- bzw. Suchfunktion für die Release-Notes.
3. **Navigation & Verlinkung:**
   - Neuer Menüpunkt „Update & Versionshinweise“ in der Sidebar unter „Mein Account“.
   - Verlinkung/Hinweis-Card auf der Seite „Mein Account“ (`/account`).
4. **Qualitätssicherung:**
   - Unit-Tests für die neue Seite und aktualisierte Sidebar-Tests sind vorhanden und bestehen.
