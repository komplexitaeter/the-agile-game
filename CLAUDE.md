# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# The Agile Game (komplexitaeter)

Point-and-Click-Adventure im Browser („Part One: A Lighthouse Project“): Agile Coach Sophie muss bei Fraxicle Inc.
ein Team zum Laufen bringen. Phaser 3.55.2, Vanilla JS, kein Build. Live: https://the-agile-game.komplexitaeter.de.
Lizenz: GPL-3.0.

> **Sprache: Antworte im Chat immer auf Deutsch.** Englisch für Code, neue Kommentare und Commit-Messages.
> `CLAUDE.md` und `BACKLOG.md` auf Deutsch. Spieltexte sind **zweisprachig** (siehe Konventionen).

> Grundsatz: **pragmatisch bleiben.** Kleines Team, kleines Spiel. Einfache, verständliche Lösungen statt
> „richtiger“ Architektur; kleine, einzeln auslieferbare Schritte.

## Lokal starten und testen

Kein Build, kein `package.json`. Die Seite braucht einen Webserver (Assets per XHR); PHP liefert zugleich `api/` aus:

```bash
cp config.example.php config.php   # einmalig; config.php ist per .gitignore ausgeschlossen
php -S 127.0.0.1:8000              # im Repo-Root, dann http://127.0.0.1:8000/
```

- Ohne MySQL antwortet `api/game_state_logger.php` mit 500 → nur Konsolen-Warnung „Spielstand konnte nicht geloggt
  werden“; das Spiel läuft trotzdem (Spielstand liegt in `localStorage`).
- Phaser, Font Awesome und Plausible kommen vom CDN. In der Cloud-Umgebung ist das CDN im Browser nicht erreichbar:
  in Playwright `phaser@3.55.2` aus npm per `page.route()` ausliefern und Plausible/Font Awesome blockieren.
- Spielstand zurücksetzen: `localStorage` leeren (`sophieAdventureState`, `gameLanguage`).
- Sprache erzwingen: `?language=en` bzw. `?language=de` (nur wenn `localStorage.gameLanguage` noch leer ist).
- Klickflächen sichtbar machen: `GameData.debug = true` in `js/GameData.js` (nicht committen).
- Klicks per Playwright: Die Kamera ist gezoomt und zentriert (Rand am Desktop). Welt- auf Seitenkoordinaten über
  `camera.worldView` und die Canvas-Box umrechnen, nicht direkt relativ zur Canvas-Box. Headless sinken die FPS stark,
  Kamera-Fades bleiben dann ggf. halb weiß.
- Automatisierte Tests gibt es noch keine (B-06).

## Architektur

**Laden:** `index.html` bindet alle Skripte als klassische `<script>`-Tags in fester Reihenfolge ein (globale Klassen,
keine Module): `GameData` → Hilfsklassen → `BaseScene` → Szenen → `game.js`. Neue Dateien dort eintragen, Reihenfolge
beachten. `game.js` erzeugt `Phaser.Game` (Scale `FIT`, Referenzgröße 1792×1024 aus `GameData.viewport`) mit der
Szenenliste.

**Szenen** (`js/scenes/*Scene.js`, alle `extends BaseScene`): Theme → Intro → Building → Lobby → Elevator →
Lounge/Meeting, CEOOffice, Basement → Team → Outro. Neue Szene: Klasse anlegen, in `index.html` und in die
`scene`-Liste in `game.js` eintragen, Eintrag in `GameData.scenes`, Nachbarn in `preloadAdjacentScenes()`
(`BaseScene.js`) ergänzen.

**Daten statt Code – `js/GameData.js`:** Je Szene `background`, `assets` (image/spritesheet/audio) und
`interactiveObjects` (Klickflächen mit relativen Koordinaten, `hoverText`, Texte für `view`/`take`, `defaultAction`,
`inventoryAssets`, `removable`, Sounds …). Dazu `commonAssets` (Sophie, Inventar-Icons, Standard-Sounds) und
`inventoryItems`. Einfache Objekte brauchen keinen Szenen-Code.

**Bedienung ohne Verbleiste (bewusst, Andreas):** Die frühere Verbleiste war Testern zu anstrengend; fast jede
Objekt-Verb-Kombination ist eindeutig. Ein Klick löst die `defaultAction` des Objekts aus (`GameData`), Inventar-Items
werden immer benutzt („Benutze X mit …“). Inventar-Items lassen sich deshalb nicht betrachten (ihre `view`-Texte sind
unerreichbar, B-15). Reste der Verbleiste in `GameControls` (Styles, `buttons`) sind toter Code.

**Verb-Dispatch (zentral, `GameControls.handle()`/`handleUse()`):** Aktionen `goTo`, `view`, `take`, `talkTo`, `use`.
Klick auf Objekt `foo` ruft – falls vorhanden – die Szenenmethode `<aktion>Foo(objectKey, worldPoint)` auf
(z. B. `viewTrashBins`, `useMeetingRoomEntry`); gibt sie nichts Truthy zurück, folgt der generische
`<aktion>Anything()` aus `BaseScene` (liest die Texte aus `GameData`). Inventar: `use<Item>` bzw.
`use<ItemA>With<ItemB>` (z. B. `useInvPenWithInvAccessForm`) – Kombinationen in **beiden** Reihenfolgen anlegen;
szenenübergreifende Kombinationen stehen in `BaseScene`. `combinedKey` lässt mehrere Objekte einen Handler teilen.
Methodennamen sind also Teil der Spiellogik: Umbenennen von IDs bricht Handler stumm.

**Spielstand – `js/GameStateManager.js`:** Ein JSON-Objekt in `localStorage` (`sophieAdventureState`):
`currentScene`, `entryPoint`, `gameLanguage`, `progress` (Story-Flags, Zähler, `inventory`) und `interactions`
(Zähler je aufgerufenem Handler). Neue Story-Flags im Default-Stand in `loadGameState()` ergänzen (alte Spielstände
haben sie nicht → `undefined` muss wie `false` funktionieren). Jedes `saveGameState()` schickt den Stand plus Diff per
`fetch` POST an `api/game_state_logger.php` (fire-and-forget).

**Weitere Bausteine:** `MonologManager` (Sprechtexte, Klick zum Weiterschalten), `DialogSwitcher` (Antwortauswahl),
`SoundEffect` (Comic-Lautschrift wie „FLUP“), `GameControls` (Verbleiste, Tasche/Inventar). Szenenwechsel immer über
`changeScene(target, entryPoint)`; die Zielszene positioniert Sophie anhand von `entryPoint`.

**Backend `api/`** (PHP, PDO, MySQL-DB `the-agile-game`): nur Telemetrie, keine Spiellogik.
- `game_state_logger.php` – öffentlich, schreibt `game_state_main` (aktueller Stand je Spiel-ID) und
  `game_state_history` (Diffs), mit `GET_LOCK` je ID.
- `game_state_overview.php`, `game_state_details.php` – Admin-Ansicht, Basic Auth über `require_auth()` aus `config.php`.
- Ein DB-Schema liegt nicht im Repo (B-05). Die DB dient nur dem Logging; das Spiel braucht sie nicht.
- `config.php` (DB-Zugang, Admin-Login, `require_auth()`) existiert nur auf dem Server bzw. lokal; Vorlage ist
  `config.example.php`. Änderungen an `require_auth()` deshalb in beiden Dateien bedenken.

**Assets:** `assets/images/` (PNG/WebP, Präfixe: `inv_*` Inventar, `character_*` Spritesheets, sonst
`<szene>_<objekt>`), `assets/sounds/` (MP3), `assets/xcf/` GIMP-Quellen (nicht ausgeliefert, nicht referenziert).

## Konventionen im Code

- **Spieltexte immer zweisprachig** über `t("Deutsch", "English")` aus `GameData.js`; Sprache aus
  `localStorage.gameLanguage` → `?language=` → Browsersprache. Kein neuer einsprachiger Text.
- `t()` wird beim Laden von `GameData` ausgewertet: Sprachwechsel wirkt erst nach Neuladen der Seite.
- Bestehende Kommentare und Konsolenmeldungen sind deutsch; nicht massenhaft übersetzen, neuer Code englisch.
- Positionen relativ zum Viewport (`relativeX`, `this.viewport.width * 0.445`), nie absolute Pixel.
- Story-Flags in `gameState.progress` per `this.updateGameState({...})` bzw. über den StateManager ändern, nicht direkt
  in `localStorage`.
- PHP: nur Prepared Statements (so bereits im Logger), Ausgaben in HTML mit `htmlspecialchars`.
- **Cache-Busting:** Kein Build mit Hashes, bisher keine `?v=`-Parameter (seit Veröffentlichung kaum Änderungen).
  Bis B-07 umgesetzt ist, geänderte JS-Dateien bzw. ersetzte Assets im PR erwähnen.

## Bekannte technische Schulden

- Keine Tests, kein Linting, keine CI (B-06).
- Kein DB-Schema im Repo (B-05).
- **Englische Übersetzung unvollständig** (B-04): übersetzt sind Theme, Intro, Building (und Teile von Outro,
  Inventar, `BaseScene`); ab der Lobby kein `t()`, dazu „Benutze … mit …“ in `GameControls` und Lautschrift.
- Logger: Fehlermeldung mit `$e->getMessage()` geht an den Client; keine Begrenzung von Größe/Rate der POSTs.
- Admin-Passwort im Klartext-Vergleich in `config.php`.
- Viel Logik in großen Szenen-Dateien (`BaseScene`, `MeetingScene`, `TeamScene`: 850–1.300 Zeilen),
  viel `console.log`.
- Phaser vom CDN (3.55.2, nicht die aktuelle 3.x), Plausible-Analytics extern.

## Betrieb

- Nur ein Server (Live, Branch `master`), kein Staging. Ubuntu, nginx, PHP 8.4-FPM (`php8.4-fpm.sock`), MySQL.
- Code: `/home/ubuntu/the-agile-game/` – ein Git-Checkout von `master`. **nginx-`root` ist der Checkout selbst**:
  jede Datei im Repo ist öffentlich abrufbar, wenn nginx sie nicht sperrt (B-10). Nichts ins Repo legen, was nicht
  öffentlich sein darf; Backups und Kopien von `config.php` nie in diesem Ordner ablegen.
- nginx-Site: `/etc/nginx/sites-available/the-agile-game.komplexitaeter.de` (HTTPS per Let's Encrypt, `.php` an FPM).
- Deployment: manuell `git pull` in `~/the-agile-game`; kein Build, keine Migrationen. `config.php` liegt nur dort.
- Claude hat keinen Zugriff auf Server oder Datenbanken. Änderungen an Servern, Config oder DB bereitet Claude als
  Befehle vor und gibt vorher Bescheid; ausgeführt werden sie vom Betreiber.
- **Das Repo ist öffentlich** (wie alle komplexitaeter-Repos): Alles, was je committet wurde, ist öffentlich. Keine
  Secrets im Repo; Config-Dateien mit Zugangsdaten nie committen.

## Zusammenarbeit

**Ablauf in Mini-Sprints:**

1. **Backlog** – Themen in `BACKLOG.md` (ID `B-xx`, Status `neu` → `refined` → `im Sprint` → `erledigt`, kurze
   Beschreibung, offene Fragen). Claude darf Einträge anlegen, aber nicht eigenmächtig priorisieren.
2. **Refinement** – gemeinsam, bis Ziel, Umfang, Akzeptanzkriterien und offene Fragen geklärt sind → `refined`.
3. **Sprint-Auswahl** – gemeinsam.
4. **Planning** – je Eintrag Umsetzungsplan abstimmen, bevor Code entsteht.
5. **Umsetzung** – nur das Geplante. Neues kommt ins Backlog.
6. **Abschluss** – manueller Test des `release`-Stands lokal (es gibt kein Staging), dann `release` → `master` und
   Deploy auf Live, Status in `BACKLOG.md` aktualisieren.

Ausnahme: akute Probleme sofort beheben und nachträglich im Backlog vermerken.

**Git:**

- Basis ist `release`; `master` ändert sich nur durch Merge von `release` (gibt Andreas frei und mergt).
- Je Backlog-Eintrag ein kurzlebiger Feature-Branch von `release` (`feature/B-xx-kurzname`), PR nach `release`.
- Merge nach `release` macht Kai nach Review durch einen anderen Agenten als den Autor und grüner CI (sobald es CI gibt).
- Kleinigkeiten (Doku, Backlog) direkt auf `release`.
- Remote-Branches löscht GitHub nach dem Merge automatisch; `release` und `master` sind per Ruleset geschützt
  (beides einzurichten, B-02).
  Kai räumt lokale Worktrees und Branches nach dem Merge auf.

**Rollen:** Die Hauptsitzung **„Kai“** spricht mit dem Team, koordiniert die Agenten, reviewt, mergt nach `release`
und legt den PR `release` → `master` an. Implementierungs-Agenten (`.claude/agents/`) arbeiten je
in einem eigenen Git-Worktree, geben einen Branch zurück und mergen nie selbst. Reviewt wird immer von einem anderen
Agenten als dem Autor.

| Agent (`.claude/agents/`) | Name | Zuständig für |
|---|---|---|
| (Hauptsitzung) | **Kai (KO)** | Kommunikation, Koordination, Review, Merges nach `release`, `master`-PR |
| `gameplay` | **Gero (GP)** | Mechanik: `BaseScene`, `GameControls`, `GameStateManager`, Monolog/Dialog/Sound-Klassen, `game.js`, Szenenwechsel, Input, Skalierung, Spielstand |
| `content` | **Nora (STORY)** | `GameData.scenes`, Szenen-Handler, Rätsel, Dialoge, Story-Flags, Texte DE/EN |
| `art` | **Pia (ART)** | Bilder, Sprites, Sounds, Aussehen der UI, `index.html`-CSS, Mobile, Barrierefreiheit – gestaltet **und** setzt um |
| `qa` | **Tessa (QA)** | Spiel lokal starten, Playwright-Smoke-Tests (lädt, Szenenwechsel, keine Konsolenfehler, beide Sprachen) |
| `backend` | **Ben (BE)** | `api/`, `config.example.php`, DB-Schema |
| `security-reviewer` | **Sina (SEC)** | prüft vor dem Merge: Secrets, SQL-Injection, XSS, Admin-Auth, Logger-Missbrauch |

Abgrenzung: Gero baut Mechanik, Nora nutzt sie für Inhalte – braucht Nora eine neue Mechanik, beschreibt sie sie und
Gero setzt um. Pia besitzt Aussehen und Assets, Verhalten bleibt bei Gero. Alle drei berühren `js/GameData.js`:
gleichzeitige Arbeit daran kurz abstimmen (Merge-Konflikte).
