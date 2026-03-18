---
ID: E2E-TOU-002
Title: Data Export
Seite: Tourismus
Linear-Issue: PEN-27
Status: Draft
Tags: ['@regression']
---

# Use Case: Data Export

Dieser Use Case beschreibt den Export von Tourismusdaten als CSV oder Excel.

## Klickstrecke (Mermaid.js)

```mermaid
flowchart TD
    A[Start: Tourismusseite] --> B[Wähle Export-Format]
    B --> C[Klicke auf 'Exportieren']
    C --> D[Verifiziere Datei-Download]
    D --> E[Ende: Erfolg]
```
