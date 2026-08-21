# Feature: Window State Persistence

## Technische Übersicht
Die Anwendung soll sich merken, in welchem Zustand (Fenstermodus, maximiert, Vollbild) sie geschlossen wurde und beim nächsten Start exakt diesen Zustand wiederherstellen. 

## User Story
Als Benutzer möchte ich, dass sich die App an meine Fenstergröße und Position vom letzten Mal erinnert, damit ich das Fenster nicht jedes Mal neu maximieren oder in den Vollbildmodus schieben muss.

## Acceptance Criteria
- [ ] Tauri Plugin `tauri-plugin-window-state` ist installiert.
- [ ] Das Plugin wird beim Start der Anwendung über den Tauri Builder initialisiert.
- [ ] Fensterposition, Größe und Maximierungsstatus werden beim Schließen gespeichert und beim Starten geladen.
