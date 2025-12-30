# Pensionsmanager

Eine moderne, desktop-basierte Anwendung zur Verwaltung von Pensionen, Ferienwohnungen und Gästehäusern. Entwickelt mit Next.js und Tauri für eine performante und intuitive Benutzererfahrung.

## Features

- **🚀 Dashboard**: Zentrale Übersicht über heutige Anreisen, Abreisen und den aktuellen Reinigungsstatus.
- **📅 Belegungsplan**: Interaktiver Kalender zur Verwaltung von Buchungen und Echtzeit-Zimmerverfügbarkeiten.
- **📝 Buchungsmanagement**: Geführter Buchungs-Assistent zum schnellen Anlegen von Einzel- und Gruppenbuchungen.
- **👥 Gästeverwaltung (CRM)**: Vollständige Datenbank zur Pflege von Gastprofilen, Nationalitäten und speziellen Präferenzen.
- **🏨 Zimmerverwaltung**: Detaillierte Konfiguration von Zimmerkategorien, Bettenanzahl und Statusüberwachung.
- **🧹 Reinigungsplan**: Intelligentes System zur automatischen Generierung von Reinigungsaufgaben mit konfigurierbaren Frequenzen.
- **🍳 Frühstücksplaner**: Effiziente Planung der Frühstückskapazitäten basierend auf der aktuellen Belegung.
- **📊 Tourismusmeldung**: Automatisierter Export von melderelevanten Daten im CSV-Format.

## Technologien

- **Frontend**: [Next.js](https://nextjs.org/) (React)
- **Desktop**: [Tauri](https://tauri.app/) (Rust-basiertes Framework für sichere und kleine Apps)
- **UI/UX**: Tailwind CSS & Shadcn UI für ein modernes, responsives Design
- **Datenbank**: SQLite für lokale Datenspeicherung

## Installation & Entwicklung

### Voraussetzungen

Stellen Sie sicher, dass Sie [Node.js](https://nodejs.org/) und die [Tauri-Abhängigkeiten](https://tauri.app/v1/guides/getting-started/prerequisites) (inkl. Rust) installiert haben.

### Development-Server starten

```bash
npm run tauri dev
```

### Produktions-Build erstellen

```bash
npm run tauri build
```

---

*Entwickelt für eine effiziente und moderne Pensionsverwaltung.*
