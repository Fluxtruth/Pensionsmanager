# Feature: Mein Account als zentraler Hub mit Unterseiten

## 1. Technischer Überblick
Zur Verschlankung und Strukturierung der Anwendung wurden administrative und dokumentarische Seiten aus der Haupt-Sidebar entfernt und als dedizierte Unterseiten unterhalb von **„Mein Account“** (`/account`) gebündelt:
- ⚙️ **Konfiguration** (`/account/konfiguration`)
- 🗄️ **Datenbank & Synchronisation** (`/account/datenbank`)
- 📖 **System-Dokumentation** (`/account/dokumentation`)
- 🚀 **Update & Versionshinweise** (`/account/updates`)
- 📜 **Rechtsdokumente & Compliance** (`/account/rechtliches`)

Auf der Hauptseite von „Mein Account“ dient ein übersichtliches Kachel-Raster als Schnellzugriff. Jede Unterseite verfügt über eine konsistente Header-Navigation mit Rücksprungmöglichkeit zu „Mein Account“.

## 2. User Story
- **Als** Nutzer / Administrator,
- **möchte ich** eine aufgeräumte Hauptnavigation links mit Fokus auf das Tagesgeschäft (Zimmer, Buchungen, Gäste etc.) haben,
- **damit** Verwaltungs-, System- und Rechtsinformationen strukturiert und erst nach Aufruf von „Mein Account“ erreichbar sind.

## 3. Akzeptanzkriterien
1. **Sidebar:** Die Menüpunkte Konfiguration, Datenbank, System-Dokumentation und Update & Versionshinweise sind nicht mehr in der linken Seitenleiste vorhanden. Die Sidebar enthält im unteren Bereich nur „Mein Account“ und „Impressum“.
2. **Aktiver Zustand:** Befindet sich der Nutzer auf einer `/account/*`-Unterseite, bleibt der Sidebar-Punkt „Mein Account“ optisch aktiv.
3. **Account-Hauptseite:** Bietet neben Profil und PIN-Sicherheit ein übersichtliches Kachel-Raster für alle 5 Unterbereiche.
4. **Unterseiten:**
   - Jede Unterseite (`/account/konfiguration`, `/account/datenbank`, `/account/dokumentation`, `/account/updates`, `/account/rechtliches`) enthält einen „← Zurück zu Mein Account“-Header.
5. **Weiterleitungen:** Bisherige Pfade (`/konfiguration`, `/admin/database`, `/dokumentation`) leiten auf die neuen Unterseiten weiter.
6. **Tests:** Sämtliche Unit-Tests und TypeScript-Checks laufen erfolgreich durch.
