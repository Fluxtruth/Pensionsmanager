# Bug: Tauri Version Mismatch

## Technische Übersicht
Beim letzten Release wurde vergessen, die Version in der `src-tauri/tauri.conf.json` anzuheben. Dies führt dazu, dass der Tauri Updater nicht richtig funktioniert oder die Build-Pipeline fehlschlägt.

## User Story
Als Nutzer möchte ich, dass der automatische Updater nach einem Release korrekt funktioniert und die richtige Version herunterlädt und ausführt.

## Acceptance Criteria
- [ ] In `tauri.conf.json` wurde die Versionsnummer aktualisiert.
- [ ] Alle Versionsangaben (`package.json`, `Cargo.toml`, `tauri.conf.json`) sind konsistent.
- [ ] Eine neue Version (Patch) wurde getaggt und freigegeben.
