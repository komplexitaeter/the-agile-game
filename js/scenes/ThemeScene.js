class ThemeScene extends BaseScene {

    constructor() {
        super({ key: 'ThemeScene' });
    }

    init(data) {
        this.stateManager = new GameStateManager(this.scene.key);
        this.hasSaveGame = this.stateManager.checkForExistingGameState();

        super.init(data);
    }

    create() {
        super.create();

        // Theme-spezifische Elemente hinzufügen
        this.setupThemeElements();

        // Interaktive Buttons hinzufügen
        this.setupButtons(this.hasSaveGame);
    }

    setupThemeElements() {
        // Logo hinzufügen, wenn es existiert
        if (this.textures.exists('logo')) {
            this.logo = this.add.image(
                this.viewport.width * 0.03,
                this.viewport.height * 0.035,
                'logo'
            ).setOrigin(0, 0);

            this.logo.setInteractive({ useHandCursor: true });

            this.logo.on('pointerdown', () => {
                const url = "https://www.komplexitaeter.de";
                window.open(url, '_blank');
            });

            const maxLogoWidth = this.viewport.width * 0.12;
            if (this.logo.width > maxLogoWidth) {
                const scale = maxLogoWidth / this.logo.width;
                this.logo.setScale(scale);
            }
        }

        // Titel-Text
        this.titleText = this.add.text(
            this.viewport.width / 2,
            this.viewport.height * 0.55,
            "Part One: A Lighthouse Project",
            {
                fontSize: '70px',
                fontFamily: 'Courier New, monospace',
                color: '#ffffff',
                fontStyle: 'bold',
                padding: { x: 20, y: 10 },
                stroke: '#201030',
                strokeThickness: 14,
                align: 'center'
            }
        ).setOrigin(0.5);
    }

    setupButtons(hasSaveGame) {
        // Spielstart/Fortsetzen-Button
        const buttonText = hasSaveGame ? "Spiel fortsetzen" : "Spiel starten";

        this.playButton = this.add.text(
            this.viewport.width / 2,
            this.viewport.height * 0.8,
            buttonText,
            {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#4a7aff',
                padding: { x: 20, y: 10 },
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);

        this.playButton.setInteractive({ useHandCursor: true });

        // Hover-Effekte
        this.playButton.on('pointerover', () => {
            this.playButton.setStyle({ backgroundColor: '#3a6aee' });
        });

        this.playButton.on('pointerout', () => {
            this.playButton.setStyle({ backgroundColor: '#4a7aff' });
        });

        // Click-Event
        this.playButton.on('pointerdown', () => {
            this.startGame();
        });

        // Reset-Button nur anzeigen, wenn ein Spielstand existiert
        if (hasSaveGame) {
            this.resetButton = this.add.text(
                this.viewport.width / 2,
                this.viewport.height * 0.88,
                "Von vorne starten",
                {
                    fontSize: '24px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    backgroundColor: '#ff4a4a',
                    padding: { x: 15, y: 8 },
                    stroke: '#000000',
                    strokeThickness: 1
                }
            ).setOrigin(0.5);

            this.resetButton.setInteractive({ useHandCursor: true });

            // Hover-Effekte
            this.resetButton.on('pointerover', () => {
                this.resetButton.setStyle({ backgroundColor: '#ee3a3a' });
            });

            this.resetButton.on('pointerout', () => {
                this.resetButton.setStyle({ backgroundColor: '#ff4a4a' });
            });

            // Click-Event
            this.resetButton.on('pointerdown', () => {
                // Session Storage löschen
                this.gameState = this.stateManager.getEmptyGameState();

                console.log("Game data has been reset.");

                // Spiel neu laden
                this.startGame();
            });
        }
    }

    // Starte das Spiel basierend auf dem Spielstand
    startGame() {
        let nextScene = 'IntroScene';

        // Wenn es einen gespeicherten Zustand gibt, nutze diesen
        if (this.gameState && this.gameState.currentScene && this.gameState.currentScene !== this.scene.key) {
            nextScene = this.gameState.currentScene;
        }

        this.changeScene(nextScene);
    }
}