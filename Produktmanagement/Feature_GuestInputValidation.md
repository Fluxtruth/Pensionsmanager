# Feature: Gästedaten Eingabebeschränkung und Validierung

## Technical Overview
In der Maske "Neuen Gast anlegen" gibt es derzeit keine Längenbeschränkung für Eingabefelder und keine Formatvalidierung für Telefonnummern. Dies führt dazu, dass zu lange Texte eingegeben werden können und potenziell ungültige Telefonnummern gespeichert werden. Die Eingabefelder müssen mit einer maximalen Zeichenanzahl versehen werden (`maxLength`), und das Telefonnummernfeld benötigt eine Validierung (`pattern` oder Regex).

## User Story
Als Benutzer möchte ich, dass die Eingabefelder beim Anlegen eines neuen Gastes auf eine sinnvolle Länge begrenzt sind und die Telefonnummer auf ihre Gültigkeit geprüft wird, damit ich keine falschen oder zu langen Daten in das System eintragen kann.

## Acceptance Criteria
- [x] Das Feld "Vorname" ist auf maximal 50 Zeichen beschränkt.
- [x] Das Feld "Zweitname" ist auf maximal 50 Zeichen beschränkt.
- [x] Das Feld "Nachname" ist auf maximal 50 Zeichen beschränkt.
- [x] Das Feld "E-Mail" ist auf maximal 50 Zeichen beschränkt.
- [x] Das Feld "Firma" ist auf maximal 50 Zeichen beschränkt.
- [x] Das Feld "Telefon" wird einer Plausibilitätsprüfung (Sanity Check) unterzogen.
- [x] Das Feld "Notizen" ist auf maximal 300 Zeichen beschränkt.
