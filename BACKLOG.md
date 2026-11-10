# Backlog

Gemeinsames Backlog für Wartung und Weiterentwicklung. Ablauf siehe `CLAUDE.md`, Abschnitt „Zusammenarbeit“.

Status: `neu` → `refined` (gemeinsam verstanden, bereit für einen Sprint) → `im Sprint` → `erledigt`.
Reihenfolge = grobe Priorität, wird im Refinement angepasst. Die Einträge unten sind noch nicht priorisiert
(Reihenfolge = Anlage beim ersten Durchsehen des Codes, 2026-11-10).

## Aktueller Sprint

Noch kein Sprint geplant.

## Einträge

### B-01 Zugangsdaten aus dem Repo: `config.example.php` + `.gitignore`
**Status:** im Sprint (Andreas, 2026-11-10: „können wir gerne machen“)
`config.php` war eingecheckt. Jetzt: `config.example.php` mit Platzhaltern, `config.php` per `.gitignore`
ausgeschlossen und aus dem Index entfernt. Die Werte auf dem Server weichen ohnehin von denen im Repo ab.
**Achtung beim Deploy:** Der Commit löscht `config.php` aus Git. Ein `git pull` auf dem Server würde die Datei
löschen bzw. bricht ab, weil sie dort lokal geändert ist. Vorher sichern, nach dem Pull zurückkopieren
(Befehle bereitet Kai vor).

### B-02 Branch `release` einführen
**Status:** im Sprint
Branch `release` von `master` angelegt (Kai, 2026-11-10). Es gibt nur den Live-Server, kein Staging (Andreas,
2026-11-10); getestet wird vor dem Merge nach `master` lokal.
Offen (macht Andreas in den GitHub-Einstellungen): Ruleset „protect release and master“ wie bei Poker (kein
Löschen, kein Force-Push), „Automatically delete head branches“ aktivieren, ggf. Default-Branch auf `release`.

### B-03 Betrieb dokumentieren
**Status:** neu
Live-Server (einziger Server, kein Staging): Pfad, Deployment (vermutlich `git pull`), PHP-/MySQL-Version in
`CLAUDE.md` festhalten.
Offen: Angaben von Andreas.

### B-04 Englische Übersetzung vervollständigen
**Status:** neu
Begonnen im Juli 2025: Theme, Intro, Building fertig. Rest teilweise nur deutsch (grob 200 Stellen mit deutschem
Text außerhalb von `t()`, Heuristik), darunter die Verbleiste und Meldungen in `GameControls` und Lautschrift.
Offen: Wer übersetzt bzw. prüft die englischen Texte? Szene für Szene in mehreren kleinen Schritten?

### B-05 DB-Schema ins Repo
**Status:** neu
Schema der Logging-DB (`game_state_main`, `game_state_history`) aus der Live-DB exportieren (ohne Daten) und als
`db_schema.sql` einchecken. Nur für das Logging nötig. Export macht Andreas, z. B. `mysqldump --no-data`.

### B-06 Playwright-Smoke-Tests und CI
**Status:** neu
Spiel lädt, erste Szenenwechsel, keine Konsolenfehler, beide Sprachen. Phaser aus npm (gleiche Version) statt CDN,
Analytics blockieren. Danach GitHub Actions bei PRs nach `release`.
Offen: Umfang des ersten Schritts.

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
Offen: Gewünscht? Phaser-Update separat betrachten.
