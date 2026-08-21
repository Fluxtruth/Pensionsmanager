# Bug: Guest Mask Layout Break & UX Improvement

## Technical Overview
Wenn Gästedaten die maximale Zeichenlänge fast voll ausschöpfen, wird das Layout der Maske "Gast bearbeiten" (insbesondere im DialogTitle) zerstört, da der lange Name ohne Umbrüche angezeigt wird. Zudem wünscht sich der User eine bessere UX: Die Felder sollen ab 40 Zeichen abgeriegelt werden (statt 50), und wenn das Limit erreicht ist, soll das Eingabefeld rot markiert werden und eine Fehlermeldung anzeigen.

## User Story
Als Benutzer möchte ich, dass sich das Layout der Eingabemaske auch bei langen Namen nicht verschiebt. Außerdem möchte ich visuelles Feedback (roter Rahmen, Fehlermeldung) bekommen, wenn ich das Zeichenlimit von 40 Zeichen in einem Eingabefeld erreiche, damit ich sofort verstehe, warum ich keine weiteren Zeichen eingeben kann.

## Acceptance Criteria
- [x] DialogTitle in "Gast bearbeiten" Masken nutzt `truncate` oder `break-all`, um das Layout bei langen Namen nicht zu sprengen.
- [x] Zeichenlimit für Vorname, Zweitname, Nachname, E-Mail und Firma wird auf 40 Zeichen reduziert.
- [x] Wenn die 40 Zeichen erreicht sind, wird das Eingabefeld rot markiert (`border-red-500`, `ring-red-500` o.ä.).
- [x] Wenn die 40 Zeichen erreicht sind, erscheint ein Hinweis / eine Fehlermeldung unter oder am Feld.
