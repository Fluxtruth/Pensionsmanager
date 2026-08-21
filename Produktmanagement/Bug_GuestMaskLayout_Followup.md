# Bug: Guest Mask Layout Break (Follow-up)

## Technical Overview
Nach dem ersten Fix für die Gästemaske hat sich gezeigt, dass die Input-Felder (durch den neuen `LimitedInput`-Wrapper) weiterhin in der Breite wachsen können, wenn kontinuierlich viele Zeichen ohne Leerzeichen eingegeben werden. Dies liegt daran, dass dem Wrapper-`div` in `LimitedInput` die CSS-Klassen `w-full min-w-0` fehlen, wodurch das Grid die Spalten auf den Inhalt anpasst und das Modal sprengt.
Zudem bricht der Dialog-Titel lange Namen nicht wie gewünscht ab, weshalb der Name auf maximal 30 Zeichen per JavaScript gekürzt werden muss, um das Layout endgültig abzusichern.

## User Story
Als Benutzer möchte ich, dass die Eingabefelder eine feste Breite behalten und nicht über den Bildschirmrand hinauswachsen, selbst wenn ich lange Zeichenketten ohne Leerzeichen eingebe. Der Titel der Maske soll nach 30 Zeichen mit "..." abgekürzt werden.

## Acceptance Criteria
- [x] Der `LimitedInput` Wrapper hat `w-full min-w-0`, um ein Mitwachsen im Grid zu verhindern.
- [x] Der angezeigte Name im `DialogTitle` der Gästemasken (Gäste-Seite und Buchungen-Seite) wird strikt auf maximal 30 Zeichen begrenzt (mit `...` am Ende).
