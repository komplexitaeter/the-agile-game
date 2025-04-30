<?php
// Zentrale Konfiguration einbinden
require_once('../config.php');
require_auth();


// Datenbankverbindung herstellen
try {
    $pdo = new PDO(
        "mysql:host=" . _MYSQL_HOST . ";port=" . _MYSQL_PORT . ";dbname=" . _MYSQL_DB . ";charset=utf8mb4",
        _MYSQL_USER,
        _MYSQL_PWD,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    die("Datenbankverbindung fehlgeschlagen: " . $e->getMessage());
}

// Prüfen, ob eine ID übergeben wurde
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    header('Location: game_state_overview.php');
    exit;
}

$stateId = $_GET['id'];

// Haupteintrag laden
$selectedState = null;
try {
    $stmt = $pdo->prepare("SELECT * FROM game_state_main WHERE id = :id");
    $stmt->execute(['id' => $stateId]);
    $selectedState = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$selectedState) {
        die("Spielstand mit ID $stateId nicht gefunden.");
    }
} catch (PDOException $e) {
    die("Fehler beim Laden des Spielstands: " . $e->getMessage());
}

// Historie laden
$historyEntries = [];
try {
    $stmt = $pdo->prepare("SELECT * FROM game_state_history WHERE game_state_id = :game_state_id ORDER BY creation_date");
    $stmt->execute(['game_state_id' => $stateId]);
    $historyEntries = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Fehler beim Laden der Historie: " . $e->getMessage());
}

// Funktion zur besseren Formatierung des JSONs
function formatJson($json) {
    if (!$json) return "";
    $decoded = json_decode($json, true);
    if ($decoded === null) return htmlspecialchars($json);
    return json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

// Funktion zum Extrahieren von Datum und Uhrzeit aus einem DateTime-String
function formatDateTime($dateTime) {
    $date = new DateTime($dateTime);
    return $date->format('d.m.Y H:i:s');
}
?>

<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Agile Game - Spielstand Details</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }

        .page-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            box-sizing: border-box;
        }

        h1, h2, h3, h4 {
            color: #2c3e50;
        }

        .header {
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .back-link {
            display: inline-block;
            padding: 8px 15px;
            background-color: #3498db;
            color: white;
            border-radius: 4px;
            text-decoration: none;
            transition: background-color 0.3s;
        }

        .back-link:hover {
            background-color: #2980b9;
            text-decoration: none;
        }

        .info-section {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }

        .detail-section {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .meta-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
        }

        .meta-item {
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
        }

        .meta-item h4 {
            margin: 0 0 5px 0;
            font-size: 14px;
            color: #7f8c8d;
        }

        .meta-item p {
            margin: 0;
            font-weight: 500;
        }

        pre {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            white-space: pre-wrap;
            overflow-x: auto;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            line-height: 1.5;
        }

        .json-key {
            color: #881391;
        }

        .json-string {
            color: #1C00CF;
        }

        .json-number {
            color: #1A01CC;
        }

        .json-boolean {
            color: #0000FF;
        }

        .json-null {
            color: #808080;
        }

        .history-entry {
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            overflow: hidden;
        }

        .history-header {
            padding: 15px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #eee;
        }

        .history-header h3 {
            margin: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .history-timestamp {
            font-size: 14px;
            color: #7f8c8d;
            font-weight: normal;
        }

        .history-content {
            padding: 15px;
        }

        .changes-summary {
            margin: 15px 0;
            padding: 10px 15px;
            background-color: #fffde7;
            border-left: 3px solid #ffc107;
        }

        .changes-summary h4 {
            margin-top: 0;
            margin-bottom: 10px;
            color: #5d4037;
        }

        .changes-summary ul {
            margin: 0;
            padding-left: 20px;
        }

        .changes-summary li {
            margin-bottom: 5px;
        }

        .diff-details {
            margin-top: 15px;
        }

        .diff-details h4 {
            margin-top: 0;
            margin-bottom: 10px;
        }

        /* Responsive Anpassungen */
        @media (max-width: 768px) {
            .page-container {
                padding: 10px;
            }

            .meta-info {
                grid-template-columns: 1fr;
            }

            pre {
                font-size: 12px;
                padding: 10px;
            }

            .history-header h3 {
                flex-direction: column;
                align-items: flex-start;
            }

            .history-timestamp {
                margin-top: 5px;
            }
        }
    </style>
</head>
<body>
<div class="page-container">
    <div class="header">
        <h1>Spielstand Details</h1>
        <a href="game_state_overview.php" class="back-link">← Zurück zur Übersicht</a>
    </div>

    <div class="info-section">
        <h2>Spielstand: <?= htmlspecialchars($selectedState['json_id']) ?></h2>

        <div class="meta-info">
            <div class="meta-item">
                <h4>ID</h4>
                <p><?= htmlspecialchars($selectedState['id']) ?></p>
            </div>

            <div class="meta-item">
                <h4>Erstellt am</h4>
                <p><?= formatDateTime($selectedState['creation_date']) ?></p>
            </div>

            <div class="meta-item">
                <h4>Letztes Update</h4>
                <p><?= formatDateTime($selectedState['last_updated']) ?></p>
            </div>

            <div class="meta-item">
                <h4>Historieneinträge</h4>
                <p><?= count($historyEntries) ?></p>
            </div>
        </div>
    </div>

    <div class="detail-section">
        <h3>Vollständiger JSON-Spielstand</h3>
        <pre><code class="json"><?= htmlspecialchars(formatJson($selectedState['json'])) ?></code></pre>
    </div>

    <h2>Historie (<?= count($historyEntries) ?> Einträge)</h2>

    <?php if (empty($historyEntries)): ?>
        <p>Keine Historieneinträge für diesen Spielstand vorhanden.</p>
    <?php else: ?>
        <?php foreach ($historyEntries as $entry): ?>
            <div class="history-entry">
                <div class="history-header">
                    <h3>
                        Änderung #<?= $entry['id'] ?>
                        <span class="history-timestamp"><?= formatDateTime($entry['creation_date']) ?></span>
                    </h3>
                </div>

                <div class="history-content">
                    <?php
                    // JSON-Diff analysieren und zusammenfassen
                    $diffData = json_decode($entry['json_diff'], true);
                    $changesSummary = [];

                    if (isset($diffData['progress'])) {
                        if (isset($diffData['progress']['inventoryAdded'])) {
                            $items = array_map(function($item) {
                                return $item['objectKey'];
                            }, $diffData['progress']['inventoryAdded']);
                            $changesSummary[] = "Inventar: " . count($items) . " Item(s) hinzugefügt (" . implode(', ', $items) . ")";
                        }
                        if (isset($diffData['progress']['inventoryRemoved'])) {
                            $items = array_map(function($item) {
                                return $item['objectKey'];
                            }, $diffData['progress']['inventoryRemoved']);
                            $changesSummary[] = "Inventar: " . count($items) . " Item(s) entfernt (" . implode(', ', $items) . ")";
                        }
                        if (isset($diffData['progress']['inventoryQuantityChanged'])) {
                            $items = array_map(function($item) {
                                return $item['objectKey'] . " (" . $item['oldQuantity'] . " → " . $item['newQuantity'] . ")";
                            }, $diffData['progress']['inventoryQuantityChanged']);
                            $changesSummary[] = "Inventar: Mengen geändert (" . implode(', ', $items) . ")";
                        }

                        // Einfache Zustandsänderungen erkennen
                        foreach ($diffData['progress'] as $key => $value) {
                            if (!in_array($key, ['inventoryAdded', 'inventoryRemoved', 'inventoryQuantityChanged', 'inventory'])) {
                                if (isset($value['old']) && isset($value['new'])) {
                                    $oldValue = is_bool($value['old']) ? ($value['old'] ? 'true' : 'false') : $value['old'];
                                    $newValue = is_bool($value['new']) ? ($value['new'] ? 'true' : 'false') : $value['new'];
                                    $changesSummary[] = "Progress: " . $key . " geändert (" . $oldValue . " → " . $newValue . ")";
                                }
                            }
                        }
                    }

                    if (isset($diffData['newInteraction'])) {
                        $changesSummary[] = "Neue Interaktion: " . $diffData['newInteraction']['functionKey'];
                    }

                    if (isset($diffData['interactionCountChanged'])) {
                        $items = array_map(function($item) {
                            return $item['functionKey'] . " (" . $item['oldCount'] . " → " . $item['newCount'] . ")";
                        }, $diffData['interactionCountChanged']);
                        $changesSummary[] = "Interaktionszähler geändert: " . implode(', ', $items);
                    }

                    if (isset($diffData['sceneChanged'])) {
                        $changesSummary[] = "Szenenwechsel: " . $diffData['sceneChanged']['old'] . " → " . $diffData['sceneChanged']['new'];
                    }
                    ?>

                    <?php if (!empty($changesSummary)): ?>
                        <div class="changes-summary">
                            <h4>Zusammenfassung der Änderungen:</h4>
                            <ul>
                                <?php foreach ($changesSummary as $change): ?>
                                    <li><?= htmlspecialchars($change) ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    <?php endif; ?>

                    <div class="diff-details">
                        <h4>Diff-Details:</h4>
                        <pre><code class="json"><?= htmlspecialchars(formatJson($entry['json_diff'])) ?></code></pre>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</div>

<script>
    // Einfache Syntax-Hervorhebung für JSON
    document.addEventListener('DOMContentLoaded', function() {
        const codeBlocks = document.querySelectorAll('code.json');

        codeBlocks.forEach(function(block) {
            const content = block.textContent;
            if (content.trim()) {  // Nur verarbeiten, wenn Inhalt vorhanden ist
                highlighted = content
                    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
                        let cls = 'json-number';
                        if (/^"/.test(match)) {
                            if (/:$/.test(match)) {
                                cls = 'json-key';
                            } else {
                                cls = 'json-string';
                            }
                        } else if (/true|false/.test(match)) {
                            cls = 'json-boolean';
                        } else if (/null/.test(match)) {
                            cls = 'json-null';
                        }
                        return '<span class="' + cls + '">' + match + '</span>';
                    });

                block.innerHTML = highlighted;
            }
        });
    });
</script>
</body>
</html>