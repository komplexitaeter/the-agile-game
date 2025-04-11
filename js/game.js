// game.js - Optimierte Konfiguration mit ThemeScene

// Konfiguration für das Phaser-Spiel
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game-container', // Wir verwenden einen Container statt body
        autoCenter: Phaser.Scale.CENTER_BOTH, // Wichtig für die Zentrierung
        width: GameData.viewport.width,
        height: GameData.viewport.height,
        max: {
            width: GameData.viewport.width,
            height: GameData.viewport.height // Max Höhe auf die Viewport-Höhe begrenzen
        }
    },
    scene: [ThemeScene, IntroScene, BuildingScene
        ,LobbyScene, ElevatorScene, LoungeScene
        ,MeetingScene, CEOOfficeScene, BasementScene
        ,TeamScene, OutroScene],
    backgroundColor: '#ffffff',
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true
    },
    disableContextMenu: true,
    banner: false,
    fps: {
        target: 60
    }
};

// Globales Spielobjekt
let game;

// Stellen wir sicher, dass der Browser optimale Rendering-Modi verwendet
document.addEventListener('DOMContentLoaded', () => {
    // Zuerst einen Container für das Spiel erstellen
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    document.body.appendChild(gameContainer);


    // GameData muss vor dem Spiel initialisiert sein
    if (!GameData.viewport) {
        console.error("GameData.viewport nicht definiert. Stelle sicher, dass GameData.js vor game.js geladen wird.");
        return;
    }

    // Das Spiel erstellen
    game = new Phaser.Game(config);

    // Globale Variable verfügbar machen
    window.game = game;

    // Zusätzliche CSS-Regeln für das Canvas
    game.canvas.addEventListener('load', () => {
        game.canvas.style.maxWidth = GameData.viewport.width + 'px';
        game.canvas.style.maxHeight = GameData.viewport.height + 'px';
        game.canvas.style.margin = '0 auto'; // Horizontale Zentrierung
    });

    // Alternativ für den Fall, dass das Event nicht feuert
    if (game.canvas) {
        game.canvas.style.maxWidth = GameData.viewport.width + 'px';
        game.canvas.style.maxHeight = GameData.viewport.height + 'px';
        game.canvas.style.margin = '0 auto'; // Horizontale Zentrierung
    }

});