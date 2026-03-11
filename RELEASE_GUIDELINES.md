# Pensionsmanager - Release Guidelines & Lessons Learned

Dieses Dokument dient als Wissensdatenbank für den Release-Prozess und zur Vermeidung von Fehlern, die in der Vergangenheit in der CI/CD-Pipeline aufgetreten sind.

## 🛠 CI/CD Pipeline & Architektur (Tauri v2)

### 1. Architektur-Bezeichnungen (x86_64 vs x86)
**Problem:** In der Vergangenheit gab es Verwirrung bei der Benennung der Artefakte für den Updater (`update.json`). Tauri v2 erwartet spezifische Platform-Keys.
- **x64 (64-Bit)**: Muss in `update.json` als `windows-x86_64` gemappt werden.
- **Arm64**: Muss als `windows-aarch64` gemappt werden.
- **x86 (32-Bit)**: Wird aktuell **nicht** standardmäßig von unserer Pipeline gebaut. Falls Nutzer Fehler melden, dass die Anwendung nicht startet, liegt es oft an einer versuchten Installation auf einem 32-Bit System.

**Lesson Learned:** Die Pipeline (`release.yml`) erzwingt aktuell `targets: x86_64-pc-windows-msvc`. Das sorgt für Stabilität, bedeutet aber auch, dass die App **nur für 64-Bit Windows** optimiert ist.

### 2. Updater-Signaturen (`.sig`)
**Problem:** Der automatische Updater schlägt fehl, wenn die `.sig` Dateien nicht korrekt im `update.json` eingebunden sind oder der Public Key im Client nicht mit dem Private Key der Pipeline übereinstimmt.
- **Wichtig**: Die `TAURI_SIGNING_PRIVATE_KEY` muss in den GitHub Secrets hinterlegt sein.
- **Wichtig**: Das PowerShell Script in `release.yml` extrahiert die Signaturen automatisch. Wenn keine `.sig` Datei gefunden wird, bricht der Build ab (Fail-Fast).

### 3. Versions-Synchronität
Die Version muss an **fünf** Stellen identisch sein (bzw. aufgeteilt nach Logik):
1. `package.json` (npm/Frontend)
2. `src-tauri/tauri.conf.json` (Tauri Config)
3. `src-tauri/Cargo.toml` (Rust Metadata)
4. `src/components/Sidebar.tsx` (UI Display)
5. `src/app/konfiguration/page.tsx` (UI Settings)

## 🚀 Release Checkliste (v1.11.0+)

1.  **Version Bump**: Alle o.g. Dateien aktualisieren.
2.  **Linting & Build**: `npm run lint` und `npm run build` lokal ausführen.
3.  **Git Tag**: Einen Git-Tag mit `v` Präfix erstellen (z.B. `git tag v1.11.0`).
4.  **Push Tags**: `git push origin --tags`.
5.  **GitHub Release**: Auf GitHub das Release finalisieren. Die Pipeline baut automatisch die Assets und lädt die `update.json` hoch.

## 🔍 Fehlerbehebung (GitHub Actions)

- **Fehler: "No .sig files found"**: Prüfen, ob `TAURI_SIGNING_PRIVATE_KEY` gesetzt ist. Ohne Key generiert Tauri keine Signaturen.
- **Fehler: Code-Signing (Windows)**: Aktuell nutzen wir kein EV-Zertifikat für Windows-Code-Signing, daher erscheint die "SmartScreen" Warnung. Das ist für die aktuelle Phase akzeptabel.
