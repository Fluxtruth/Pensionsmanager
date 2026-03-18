---
ID: E2E-FRU-005
Title: Als Fertig markieren
Seite: Frühstück
Linear-Issue: PEN-24
Status: Draft
Tags: ['@smoke', '@regression']
---

# Use Case: Als Fertig markieren

Dieser Use Case beschreibt das Markieren eines Gastes als 'Erschienen' oder 'Erledigt'.

## Klickstrecke (Mermaid.js)

```mermaid
flowchart TD
    A[Start: Frühstück Seite] --> B[Suche Gast in Liste]
    B --> C[Klicke auf Checkbox/Status 'Erschienen']
    C --> D[Verifiziere visuelle Markierung (z.B. durchgestrichen)]
    D --> E[Ende: Erfolg]
```
