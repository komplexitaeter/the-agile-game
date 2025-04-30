<?php
header('Content-Type: application/json');

// Zentrale Konfiguration einbinden
require_once('../config.php');
require_auth();

// Daten aus dem POST-Request lesen
$inputData = file_get_contents('php://input');
$data = json_decode($inputData, true);

// Überprüfen, ob die erforderlichen Daten vorhanden sind
if (!isset($data['json_id']) || !isset($data['json'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Fehlende Daten: json_id oder json']);
    exit;
}

try {
    // Datenbankverbindung mit den zentralen Konfigurationskonstanten herstellen
    $pdo = new PDO(
        "mysql:host=" . _MYSQL_HOST . ";port=" . _MYSQL_PORT . ";dbname=" . _MYSQL_DB . ";charset=utf8mb4",
        _MYSQL_USER,
        _MYSQL_PWD,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Transaktion starten
    $pdo->beginTransaction();

    // Named-Lock für diese json_id anfordern (10 Sekunden Timeout)
    $lockName = "game_state_lock_{$data['json_id']}";
    $stmt = $pdo->prepare("SELECT GET_LOCK(:lock_name, 10) as lock_acquired");
    $stmt->execute(['lock_name' => $lockName]);
    $lockResult = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$lockResult || $lockResult['lock_acquired'] != 1) {
        // Lock konnte nicht erworben werden
        $pdo->rollBack();
        http_response_code(503);
        echo json_encode([
            'error' => 'Service Temporarily Unavailable',
            'message' => 'Die Anfrage konnte nicht bearbeitet werden, da das System ausgelastet ist. Bitte versuchen Sie es später erneut.'
        ]);
        exit;
    }

    try {
        // 1. Prüfen, ob es einen Haupteintrag für diese JSON-ID gibt
        $stmt = $pdo->prepare("SELECT id FROM game_state_main WHERE json_id = :json_id FOR UPDATE");
        $stmt->execute(['json_id' => $data['json_id']]);
        $mainRecord = $stmt->fetch(PDO::FETCH_ASSOC);

        $mainStateId = null;

        if ($mainRecord) {
            // Es existiert bereits ein Haupteintrag
            $mainStateId = $mainRecord['id'];

            // Haupteintrag aktualisieren mit dem neuesten Zustand
            $updateStmt = $pdo->prepare("
                UPDATE game_state_main 
                SET json = :json, last_updated = CURRENT_TIMESTAMP 
                WHERE id = :id
            ");
            $updateStmt->execute([
                'json' => $data['json'],
                'id' => $mainStateId
            ]);
        } else {
            // Neuen Haupteintrag anlegen
            $insertStmt = $pdo->prepare("
                INSERT INTO game_state_main (json_id, json)
                VALUES (:json_id, :json)
            ");
            $insertStmt->execute([
                'json_id' => $data['json_id'],
                'json' => $data['json']
            ]);

            $mainStateId = $pdo->lastInsertId();
        }

        // Nur wenn ein Diff existiert, in die History eintragen
        if (isset($data['json_diff']) && $data['json_diff'] !== '{}') {
            $historyStmt = $pdo->prepare("
                INSERT INTO game_state_history (game_state_id, json_diff)
                VALUES (:game_state_id, :json_diff)
            ");
            $historyStmt->execute([
                'game_state_id' => $mainStateId,
                'json_diff' => $data['json_diff']
            ]);
        }

        // Lock freigeben
        $pdo->prepare("SELECT RELEASE_LOCK(:lock_name)")->execute(['lock_name' => $lockName]);

        // Transaktion abschließen
        $pdo->commit();

        // Erfolgsmeldung zurückgeben
        echo json_encode([
            'success' => true,
            'message' => 'Spielstand erfolgreich gespeichert',
            'main_id' => $mainStateId,
            'history_id' => (isset($data['json_diff']) && $data['json_diff'] !== '{}') ? $pdo->lastInsertId() : null
        ]);

    } catch (Exception $e) {
        // Bei Fehlern während der Verarbeitung
        // Lock freigeben und Transaktion zurückrollen
        $pdo->prepare("SELECT RELEASE_LOCK(:lock_name)")->execute(['lock_name' => $lockName]);
        $pdo->rollBack();
        throw $e; // Weitergeben an den äußeren catch-Block
    }

} catch (PDOException $e) {
    // Bei Datenbankfehlern einen Fehlerstatus zurückgeben
    http_response_code(500);
    echo json_encode([
        'error' => 'Datenbankfehler',
        'message' => $e->getMessage()
    ]);
    // Den Fehler ins Fehlerlog schreiben, aber nicht dem Client zeigen
    error_log('Database Error: ' . $e->getMessage());
}