---
ID: E2E-KAL-001
Title: Termin verschieben (Drag-and-Drop)
Seite: Kalender
Linear-Issue: PEN-26
Status: Draft
Tags: ['@smoke', '@regression']
---

# Use Case: Termin verschieben (Drag-and-Drop)

Dieser Use Case beschreibt das Verschieben eines bestehenden Termins im Kalender auf ein anderes Datum oder Zimmer mittels Drag-and-Drop.

## Klickstrecke (Mermaid.js)

```mermaid
flowchart TD
    A[Start: Kalender Seite] --> B[Identifiziere Termin-Element]
    B --> C[Ziehe Termin auf neuen Slot]
    C --> D[Bestätige Dialog falls vorhanden]
    D --> E[Verifiziere neue Position des Termins]
    E --> F[Ende: Erfolg]
```
