# Feature: Versteckte Dokumentationsseite

## Technische Übersicht
Eine versteckte Dokumentationsseite (`/dokumentation`) soll erstellt werden, die nur über einen Doppelklick auf das Wort "Inhalt" im Abschnitt "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV" im Impressum zugänglich ist. Die Seite soll technische Dokumentationen sowie ein MoSCoW-priorisiertes Backlog (aktuell leer) enthalten.

## User Story
Als Entwickler oder Administrator möchte ich eine versteckte Dokumentationsseite in der App haben, um wichtige technische Informationen (Architektur, Stages, Updater, Mailserver) und das Backlog direkt einsehen zu können, ohne dass normale Nutzer darauf stoßen.

## Acceptance Criteria
- [ ] Es gibt eine neue Route `/dokumentation`.
- [ ] Im Impressum beim Text "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV" kann man auf das Wort "Inhalt" doppelklicken.
- [ ] Der Doppelklick leitet den Nutzer auf `/dokumentation` weiter.
- [ ] Die Dokumentationsseite enthält Abschnitte für:
  - Technische Architektur
  - Stages und Umgebungen
  - Dokumentation des Updaters
  - Mailserver-Dokumentation
  - Ein MoSCoW priorisiertes Backlog (Must-have, Should-have, Could-have, Won't-have) mit leeren Inhalten.
- [ ] Die Seite ist ansprechend und professionell gestaltet (Dark Mode Support, übersichtliche Struktur).
