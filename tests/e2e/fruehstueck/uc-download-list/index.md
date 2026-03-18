---
ID: E2E-FRU-003
Title: Liste herunterladen
Seite: Frühstück
Linear-Issue: PEN-24
Status: Draft
Tags: ['@regression']
---

# Use Case: Liste herunterladen

Dieser Use Case beschreibt den Export/Download der Frühstücksliste als PDF/Druckansicht.

## Klickstrecke (Mermaid.js)

```mermaid
flowchart TD
    A[Start: Frühstück Seite] --> B[Klicke auf Export/Drucken Icon]
    B --> C[Wähle Format 'PDF']
    C --> D[Verifiziere Download-Start]
    D --> E[Ende: Erfolg]
```
