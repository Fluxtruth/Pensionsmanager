# Bug: Guest Table Layout Break

## Technical Overview
Nach dem Fix für die Input-Felder und Modal-Titel hat sich gezeigt, dass extrem lange Gästenamen auch die tabellarische Übersicht (`GuestsList` in `src/app/gaeste/page.tsx`) zerstören. Da die Namensteile keine Leerzeichen enthalten, wächst die Spalte unendlich weiter und drückt andere Spalten zusammen bzw. erzeugt ungewollte Zeilenumbrüche.

## User Story
Als Benutzer möchte ich, dass die Gästenamen auch in der Tabellenansicht verkürzt (mit "...") dargestellt werden, wenn sie zu lang sind, damit das Tabellenlayout übersichtlich und stabil bleibt.

## Acceptance Criteria
- [x] Der angezeigte Name in der Spalte "Name" der Gästetabelle wird auf eine maximale Zeichenlänge begrenzt (z.B. 40 Zeichen) oder mit CSS `truncate` und einer festen Maximalbreite versehen, um das Layout zu sichern.
