---
ID: E2E-TOU-001
Title: Monthly Report
Seite: Tourismus
Linear-Issue: PEN-27
Status: Draft
Tags: ['@smoke', '@regression']
---

# Use Case: Monthly Report

Dieser Use Case beschreibt das Erstellen und Einsehen des monatlichen Tourismusberichts.

## Klickstrecke (Mermaid.js)

```mermaid
flowchart TD
    A[Start: Tourismusseite] --> B[Wähle Monat und Jahr]
    B --> C[Klicke auf 'Bericht generieren']
    C --> D[Prüfe Berichtsvorschau]
    D --> E[Ende: Erfolg]
```
