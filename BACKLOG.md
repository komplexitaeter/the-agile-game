# Backlog

Gemeinsames Backlog für Wartung und Weiterentwicklung. Ablauf siehe `CLAUDE.md`, Abschnitt „Zusammenarbeit“.

Status: `neu` → `refined` (gemeinsam verstanden, bereit für einen Sprint) → `im Sprint` → `erledigt`.
Reihenfolge = grobe Priorität, wird im Refinement angepasst. Die Einträge unten sind noch nicht priorisiert
(Reihenfolge = Anlage beim ersten Durchsehen des Codes, 2026-11-10).

## Aktueller Sprint

Noch kein Sprint geplant.

## Einträge

### B-01 Zugangsdaten aus dem Repo: `config.example.php` + `.gitignore`
**Status:** erledigt (live seit 2026-11-10, komplexitaeter/the-agile-game#1, #2)
`config.php` war eingecheckt. Jetzt: `config.example.php` mit Platzhaltern, `config.php` per `.gitignore`
ausgeschlossen und aus dem Index entfernt. Die Werte auf dem Server weichen ohnehin von denen im Repo ab.
**Achtung beim Deploy:** Der Commit löscht `config.php` aus Git. Ein `git pull` auf dem Server würde die Datei
löschen bzw. bricht ab, weil sie dort lokal geändert ist. Vorher sichern, nach dem Pull zurückkopieren
(Befehle bereitet Kai vor). Sicherung **außerhalb** von `~/the-agile-game` (sonst öffentlich abrufbar), Rechte
`600`; Pull mit `--ff-only`; danach keine Editor-Kopien wie `config.php~`/`.bak` im Web-Ordner.

### B-02 Branch `release` einführen
**Status:** erledigt (2026-11-10)
`release` von `master` angelegt; Branch-Schutz für `release` und `master`, gemergte Branches werden automatisch
gelöscht (Andreas). Kein Staging, getestet wird vor dem Merge nach `master` lokal.

### B-03 Betrieb dokumentieren
**Status:** erledigt (2026-11-10)
Angaben von Andreas: Checkout `/home/ubuntu/the-agile-game/`, `git pull`, nginx-`root` = Checkout, PHP 8.4-FPM.
In `CLAUDE.md`, Abschnitt „Betrieb“. Daraus folgt B-10.

### B-04 Englische Übersetzung vervollständigen
**Status:** neu
Begonnen im Juli 2025: Theme, Intro, Building fertig. Ab der Lobby kein `t()` mehr (Nora schätzt ~400 Stellen inkl.
`GameData`), dazu „Benutze … mit …“ in `GameControls` und Lautschrift. Vorschlag: szenenweise (Lobby, Elevator/Lounge,
Meeting, CEO, Basement, Team, Rest), Wortwitz übertragen statt wörtlich übersetzen.
Laut Logdaten (Stand 2026-11-10) kaum englische Spieler: 21 von 133 EN-Besuchern starten das Intro, 17 erreichen
die Lobby. Offen: Wollt ihr gezielt international werben? Wer prüft die englischen Texte?

### B-05 DB-Schema ins Repo
**Status:** neu
Schema der Logging-DB (`game_state_main`, `game_state_history`) aus der Live-DB exportieren (ohne Daten) und als
`db_schema.sql` einchecken. Nur für das Logging nötig. Export macht Andreas, z. B. `mysqldump --no-data`.

### B-06 Playwright-Smoke-Tests und CI
**Status:** neu
Spiel lädt, erste Szenenwechsel, keine Konsolenfehler, beide Sprachen. Phaser aus npm (gleiche Version) statt CDN,
Analytics blockieren. Danach GitHub Actions bei PRs nach `release`.
Vorschlag Tessa für den ersten Schritt: (a) Seite lädt, Start-Button da, keine Fehler; (b) jede Szene per vorbereitetem
Spielstand laden, keine Fehler, keine 4xx; (c) ein Interaktionstest in Building (Zettel nehmen → 2 Items);
(d) EN-Check der Hover-Texte (`test.fixme` ab Lobby). Intro nur über Spielstand testen (Klickverhalten schwankt).

### B-07 Cache-Busting für JS und Assets
**Status:** neu
`?v=`-Parameter an den Script-Tags in `index.html` (und ggf. an Asset-Pfaden in `GameData.js`), damit Änderungen
beim Spieler ankommen.

### B-08 Logger härten
**Status:** neu
`api/game_state_logger.php` gibt `$e->getMessage()` an den Client zurück und begrenzt weder Größe noch Anzahl der
POSTs. Interne Fehler nur ins Log, Größenlimit für `json`/`json_diff`.

### B-09 Phaser und Font Awesome selbst ausliefern
**Status:** neu
Beide kommen vom CDN (Phaser 3.55.2). Selbst ausliefern macht das Spiel unabhängiger und vereinfacht Tests.
Font Awesome wird nirgends benutzt und kann ersatzlos weg. Phaser-Update separat (B-30).

### B-10 Interne Dateien auf Live nicht ausliefern (`.git`, Quellen, Doku)
**Status:** erledigt (2026-11-10)
nginx-`root` ist der Git-Checkout; interne Dateien (u. a. `/.git/`) waren abrufbar. Seit 2026-11-10 sperrt ein
nginx-Snippet Punkt-Dateien/-Ordner (außer `.well-known`), `*.md`, `/assets/xcf/` und `config.example.php`.
Prüfen: `curl -I https://the-agile-game.komplexitaeter.de/.git/HEAD` muss `404` liefern.

### B-11 Admin-Login härten
**Status:** neu (Vorschlag Sina, 2026-11-10)
`require_auth()` vergleicht im Klartext mit `!==`. Besser `hash_equals()` bzw. Hash mit `password_verify()`.
Außerdem sicher abbrechen (500 statt Login), wenn `_API_PASSWORD` leer oder noch `change_me` ist. Achtung:
`require_auth()` liegt in `config.php` auf dem Server – Änderung dort von Hand nachziehen oder Funktion in eine
versionierte Datei verschieben (ohne „Cannot redeclare“ mit der alten Server-Config).

### B-12 XSS in der Admin-Detailseite
**Status:** erledigt (live seit 2026-11-10, komplexitaeter/the-agile-game#3)
Das JSON-Highlighting in `api/game_state_details.php` schrieb geloggte Daten ungeschützt per `innerHTML` zurück;
über den öffentlichen Logger ließ sich so Skriptcode einschleusen, der beim Öffnen durch einen Admin läuft.
Fix: escapen vor dem Highlighting (Branch `feature/B-12-xss-admin-details`).
Nebenbefunde (Sina, nicht sicherheitsrelevant): `formatJson()` escaped ungültiges JSON doppelt
(`game_state_details.php:55`); Admin-Seiten geben DB-Fehler per `die(… getMessage())` aus – mit B-08 erledigen.

## Vorschläge aus der Team-Sichtung (2026-11-10)

Alle Einträge `neu`, nicht priorisiert. Grundlage: Sichtung durch Gero, Nora, Pia, Tessa, Ben, Sina und Auswertung
der Logdaten (899 Spiele von Menschen, April 2025 bis November 2026; 58 bis zum Outro).

### B-13 Einstiegs-Hinweis Lobby → Fenster
**Status:** neu
Größte Hürde laut Logdaten: Von 412 Spielern in der Lobby finden nur 171 den Meetingraum (Fernrohr am Fenster); wer
aufgibt, tut es nach im Median 1,7 Minuten, nur 14 % davon haben das Fenster je angeschaut. Idee (Andreas): Ken
verrät nichts, aber Sophie sagt nach der Abfuhr etwa „sinnlose Bürokratie, ich muss das System austricksen – wenn ich
nur eine winzige Information über das Innere des Gebäudes hätte“. Optional eine zweite, vorsichtige Stufe.
**Das Rätsel bleibt** (Einstiegsprüfung, ob man das Genre mag), nur Richtung, kein Lösungshinweis.
Messen: Anteil Lobby → Fernrohr (heute 42 %) und Verweildauer.

### B-14 Visitenkarten: Pointe und Obergrenze
**Status:** neu
Die Karten sammeln sich bewusst an (bis zu 105 im Log). Ab einer Schwelle sagt Sophie etwas Witziges, das die
Sinnlosigkeit zeigt („genug Visitenkarten für drei Reorganisationen“), danach nimmt sie keine weiteren mehr.

### B-15 Inventar-Items betrachten
**Status:** neu
Ohne Verbleiste sind die `view`-Texte der Inventar-Items unerreichbar. Idee: zweiter Klick auf dasselbe Item (heute
ohne Wirkung) zeigt den Betrachten-Text.

### B-16 Weniger Laufwege
**Status:** neu
Spieler bis zum Outro brauchen im Median 19 Aufzugfahrten, 7–8 Klicks auf die Toilettentür, 9 Gespräche mit Jeff.
Ideen: Aufzug direkt ins Stockwerk, Meeting-Intro beim Wiederbetreten kürzen, Cola und Toilette näher zusammen,
Rückweg nach „gefeuert“. Die zwei Toilettengänge sind zäh, aber kein Abbruchgrund (ab Lighthouse-Projekt 72 % bis Outro).

### B-17 Optionale gestufte Hilfe
**Status:** neu (Idee)
Hinweise nur auf Wunsch, z. B. über Sophies Notizbuch: vage → deutlicher → Lösung. Hintergrund (Andreas): Heute
spielt niemand wochenlang ein Adventure. Offen: Zielspieldauer für Part One (z. B. 20–30 min)?

### B-18 Deutsche Tippfehler in Spieltexten
**Status:** neu
Liste von Nora, u. a. „nicht to schwer“, „wenn ich das wegnehmen“, „eine Whiteboard“, „Scum Guide“, „das Gefühlt“,
„Alle was ich“, „Experiment, dass“, „Eine guter Check-In“, „die letzte Säulen“, „Das steht ‚Ken S.‘“.

### B-19 Handy: Prototyp für gutes Spielgefühl im Querformat
**Status:** neu
Heute: hochkant nur ein schmaler Streifen ohne Hinweis; quer winzig im Browser (iOS: kein Vollbild, die
Vollbild-API gibt es auf dem iPhone nur für Videos), Bedienung teils per Hover, Touch-Ziele und Texte zu klein
(6–11 px, Start-Buttons ~20 px). Laut Log kaum Handy-Spieler (35, davon 2 bis Outro) – deshalb auch keine
LinkedIn-Werbung mehr (Andreas).
Vorschlag: zeitlich begrenzter Prototyp (1–2 Tage) an 2–3 Szenen (z. B. Building, Lobby), Pia und Gero, auf einem
Branch; Andreas testet auf dem iPhone (`php -S` auf dem Mac, iPhone im selben WLAN). Inhalt:
- Hinweis „Bitte quer drehen“ im Hochformat.
- Tippen statt Hover: erster Tipp zeigt Namen und hebt hervor, zweiter Tipp führt aus; Knopf „Hotspots zeigen“.
- Klickflächen mindestens fingergroß, Texte/Inventar/Buttons mit Mindestgröße auf dem Bildschirm.
- Tasche/Inventar in den seitlichen Rändern (iPhone quer ist breiter als 1792×1024).
- Testweise: Kamera näher an Sophie auf kleinen Bildschirmen (größter Hebel, größter Umbau).
- Optional: Web-App-Manifest für den Home-Bildschirm (Andreas: nutzt praktisch niemand – nur mitnehmen, wenn
  billig).
Danach entscheidet Andreas über den Ausbau. Alternative: B-32.

### B-20 Lesbarkeit der Sprechtexte
**Status:** neu
Manager-/Dev-Texte frei auf unruhigem Hintergrund, mehrere Sprecherfarben unter 4,5:1 (devA/devG 2,7, Jeff 3,0),
Footer 1,6:1. Texte in Boxen setzen; Lesezeit (1,2 s + 0,3 s/Wort) anheben oder Weiterschalten per Klick.

### B-21 Assets verkleinern
**Status:** neu
34 MB Bilder: 8 Hintergründe als PNG (2,5–3,2 MB), Inventar-Icons 950×950 px bei ~100 px Anzeige,
`character_ken.png` 2160×1024. Mit WebP und kleineren Icons geschätzt 6–8 MB. Mit B-07 (Cache) abstimmen.

### B-22 Ton ausschalten
**Status:** neu
Kein Mute-/Lautstärke-Regler, mehrere Loops. Idee: Lautsprecher-Symbol neben der Tasche.

### B-23 Spielstand robust machen
**Status:** neu
Defaults mit alten Ständen zusammenführen (`undefined + 1` → `NaN`), kaputtes JSON verwerfen statt still neue IDs
zu erzeugen, unbekannte `currentScene` abfangen (sonst weißer Bildschirm), ggf. `stateVersion`.

### B-24 Aufräumen beim Szenenwechsel
**Status:** neu
`shutdown()` wird nie aufgerufen (kein `events.on('shutdown')`), Resize-Listener und Sounds sammeln sich bei jedem
Szenenbesuch an. Dazu Absturzsicherungen in `createInteractiveObject`/`handlePointerDown`.

### B-25 Intro und Einblenden
**Status:** neu
Klickverhalten im Intro schwankt (11–27 Klicks bis Building), Einblenden nach „Fortsetzen“ 2,5 s weißlich, Warnung
„Camera not available in scaleToFit“ 4–6× pro Szenenwechsel.

### B-26 Logging drosseln und Eingaben prüfen
**Status:** neu (ergänzt B-08)
Bis zu 5 POSTs pro Klick, jeweils mit komplettem Stand. Zusammenfassen (z. B. bei Szenenwechsel oder alle paar
Sekunden), `json_id` nur `^[0-9]{12}$`, `json`/`json_diff` als Strings. Für Auswertungen: Zeit der *letzten*
Ausführung je Aktion, `gameFinished`, User-Agent bzw. `isMobile` bei jedem Start.

### B-27 Auswertungsseite für die Logdaten
**Status:** neu
Admin-Seite mit Trichter je Story-Flag, Abbruch je Szene, DE/EN, Mobile/Desktop, Bots herausgefiltert (z. B.
Bytespider). Übersichtsseite paginieren bzw. auf Zeitraum begrenzen (lädt heute alles inkl. History-Zählung).

### B-28 Datenschutz und Löschfrist
**Status:** neu
Datenschutzerklärung mit dem tatsächlichen Logging abgleichen (vollständiger User-Agent, Spiel-ID, Klickverlauf,
Speicherdauer); Löschfrist festlegen, z. B. per MySQL-Event. Offen: Andreas.

### B-29 Part Two: Ideen sammeln
**Status:** neu
Offene Fäden: Mimi, Gewerkschafts-Manifest. Ideen: Sprint Review vor Noel und den Managern, Skalierung, ein
Augenzwinkern zu den echten drei Säulen (Transparenz, Überprüfung, Anpassung). Technik vorbereiten: Nachbarszenen
in `GameData`, Debug-Einstieg (`?scene=…`).

### B-30 Phaser auf 3.90
**Status:** neu
Nach B-06 und B-09. Hauptrisiko Tween-Änderungen ab 3.60; geschätzt 1–2 Tage inkl. Durchspielen.

### B-31 Code aufräumen
**Status:** neu (nebenbei)
Toter Verbleisten-Code und `removeInventoryAsset`, Duplikate (Mobile-Erkennung, Lesezeit, Lautschrift-Stil,
Cola-Handler), viele `console.log`. Am besten zusammen mit einem anderen Eintrag.

### B-32 Handy als Türöffner (Plan B zu B-19)
**Status:** neu (Idee)
Wer den Link auf dem Handy öffnet, bekommt einen guten Einstieg (Titel, ein Satz Story, ggf. Intro) und das Angebot,
am Rechner zu spielen: Link per Mail schicken bzw. kopieren. Optional „Auf dem Rechner weiterspielen“ über einen
Fortsetzen-Link mit der Spiel-ID (Stand liegt dank Logger schon auf dem Server). Native App (z. B. Capacitor)
bewusst nicht: Installieren wäre für LinkedIn-Besucher eine noch größere Hürde, dazu Store-Kosten und -Prüfung.
