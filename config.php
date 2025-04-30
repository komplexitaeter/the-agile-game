<?php
error_reporting(E_ALL);
ini_set('display_errors', 'off');
ini_set('log_errors', 'on');

const _MYSQL_HOST = 'localhost';
const _MYSQL_USER = 'root';
const _MYSQL_PWD = 'root';
const _MYSQL_DB = 'the-agile-game';
const _MYSQL_PORT = '3306';

// Authentifizierungskonfiguration
const _API_USERNAME = 'admin';
const _API_PASSWORD = 'admin'; // Bitte ein starkes Passwort verwenden!
const _REQUIRE_AUTH = true; // Auf false setzen, um Auth zu deaktivieren


// Funktion zur Überprüfung der Authentifizierung
function require_auth() {
    if (!_REQUIRE_AUTH) {
        return true; // Authentifizierung deaktiviert
    }

    // Prüfen, ob Authentifizierung über Basic Auth gesendet wurde
    if (!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW'])) {
        header('WWW-Authenticate: Basic realm="The Agile Game Admin"');
        header('HTTP/1.0 401 Unauthorized');
        echo 'Authentifizierung erforderlich';
        exit;
    }

    // Prüfen, ob Benutzername und Passwort korrekt sind
    if ($_SERVER['PHP_AUTH_USER'] !== _API_USERNAME || $_SERVER['PHP_AUTH_PW'] !== _API_PASSWORD) {
        header('WWW-Authenticate: Basic realm="The Agile Game Admin"');
        header('HTTP/1.0 401 Unauthorized');
        echo 'Ungültige Zugangsdaten';
        exit;
    }

    return true;
}