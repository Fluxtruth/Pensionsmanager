---
ID: E2E-ANR-001
Title: View Arrival List
Seite: Anreise
Linear-Issue: PEN-28
Status: Draft
Tags: ['@smoke', '@regression']
---

# Use Case: View Arrival List

Dieser Use Case beschreibt das Einsehen der Anreiseliste für den heutigen Tag.

## Klickstrecke (Mermaid.js)

```mermaid
flowchart TD
    A[Start: Anreiseseite] --> B[Prüfe Liste der erwarteten Anreisen]
    B --> C[Prüfe Uhrzeiten und Zimmer]
    C --> D[Ende: Erfolg]
```
