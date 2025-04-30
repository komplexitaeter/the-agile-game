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

// Alle Haupteinträge abrufen, sortiert nach last_updated absteigend
$mainStates = [];
try {
    // SQL-Abfrage, die auch die Anzahl der Historieneinträge für jeden Spielstand abruft
    $sql = "
        SELECT 
            m.id, 
            m.json_id, 
            m.creation_date, 
            m.last_updated,
            COUNT(h.id) as history_count
        FROM 
            game_state_main m
        LEFT JOIN 
            game_state_history h ON m.id = h.game_state_id
        GROUP BY 
            m.id
        ORDER BY 
            m.last_updated DESC
    ";

    $stmt = $pdo->query($sql);
    $mainStates = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Fehler beim Abrufen der Haupteinträge: " . $e->getMessage());
}

// Funktion zum Formatieren von Datum und Uhrzeit
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
    <title>The Agile Game - Spielstand-Übersicht</title>
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

        h1, h2 {
            color: #2c3e50;
        }

        .header {
            margin-bottom: 30px;
        }

        .header h1 {
            margin-bottom: 5px;
        }

        .header p {
            color: #7f8c8d;
            margin-top: 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background-color: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }

        th {
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }

        tr:hover {
            background-color: #f1f9ff;
        }

        a {
            color: #2980b9;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        .btn {
            display: inline-block;
            padding: 8px 12px;
            background-color: #3498db;
            color: white;
            border-radius: 4px;
            text-decoration: none;
            transition: background-color 0.3s;
        }

        .btn:hover {
            background-color: #2980b9;
            text-decoration: none;
        }

        .history-count {
            font-size: 0.9em;
            color: #777;
        }

        /* Responsive Anpassungen */
        @media (max-width: 768px) {
            th, td {
                padding: 8px 10px;
            }

            table {
                font-size: 0.9em;
            }
        }
    </style>
</head>
<body>
<div class="page-container">
    <div class="header">
        <h1>The Agile Game - Spielstand-Übersicht</h1>
        <p>Hier findest du alle gespeicherten Spielstände mit Details und Historie</p>
    </div>

    <h2>Verfügbare Spielstände</h2>

    <table>
        <thead>
        <tr>
            <th style="width: 50px;">ID</th>
            <th style="width: 150px;">JSON-ID</th>
            <th>Erstellt</th>
            <th>Letztes Update</th>
            <th style="width: 120px;">Historieneinträge</th>
            <th style="width: 100px;">Aktionen</th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($mainStates as $state): ?>
            <tr>
                <td><?= htmlspecialchars($state['id']) ?></td>
                <td><?= htmlspecialchars($state['json_id']) ?></td>
                <td><?= formatDateTime($state['creation_date']) ?></td>
                <td><?= formatDateTime($state['last_updated']) ?></td>
                <td>
                    <?php if ($state['history_count'] > 0): ?>
                        <span class="history-count"><?= $state['history_count'] ?> Einträge</span>
                    <?php else: ?>
                        <span class="history-count">Keine Historie</span>
                    <?php endif; ?>
                </td>
                <td>
                    <a href="game_state_details.php?id=<?= $state['id'] ?>" class="btn">Details</a>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>

    <?php if (empty($mainStates)): ?>
        <p>Keine Spielstände gefunden.</p>
    <?php endif; ?>
</div>
</body>
</html>