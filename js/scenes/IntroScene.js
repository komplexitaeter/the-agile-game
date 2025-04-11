// IntroScene.js - Intro-Szene mit Bus und Monolog und Session Storage Integration

class IntroScene extends BaseScene {
    constructor() {
        super({ key: 'IntroScene' });
        this.soundTextCreated = false;
    }

    create() {
        super.create();

        // Bus-spezifische Elemente
        this.setupBus();

        // Start-Text, nur wenn der Bus noch nicht weg ist
        if (!this.busHasMoved) {
            this.createStartText();
        }

        // Click-Event für Start
        this.input.on('pointerdown', this.startIntro, this);

        // Flag zurücksetzen
        this.soundTextCreated = false;

        // Sophie kann interagieren
        this.canInteract = false;

        // Wenn der Bus bereits weg ist, aber das Intro noch nicht gesehen wurde, starte Monolog automatisch
        if (this.busHasMoved && !this.gameState.progress.hasSeenIntro) {
            this.time.delayedCall(150, () => {
                this.startMonolog();
            });
        } else if (this.gameState.progress.hasSeenIntro) {
            this.changeScene('BuildingScene');
        } else {
            this.sophie.play('back');
        }
    }

    setupBus() {
        // Bus-Status aus dem Spielstand laden
        this.busHasMoved = this.gameState.progress.busHasMoved || false;

        // Bus rechts unten im Viewportbereich positionieren
        const busX = this.viewport.width * 0.7; // Rechts im Bild
        const busY = this.viewport.height * 0.83; // Nahe am unteren Rand

        this.bus = this.add.image(busX, busY, 'bus').setOrigin(0.5, 0.5);
        this.bus.setScale(GameData.constants.busScale);
        this.bus.setDepth(this.sophie.depth+10);

        // Wenn der Bus bereits weggefahren ist, unsichtbar machen
        if (this.busHasMoved) {
            this.bus.setVisible(false);
        }
    }

    createStartText() {
        // Text in der Mitte des Gebäudes platzieren
        const textX = this.viewport.width * 0.5; // Mitte des Viewports
        const textY = this.viewport.height * 0.47; // Etwas über der Mitte für gute Positionierung

        // Hintergrund für besseren Kontrast
        const bgWidth = this.viewport.width * 0.8;
        const bgHeight = this.viewport.height * 0.3;

        const bg = this.add.rectangle(
            textX,
            textY,
            bgWidth,
            bgHeight,
            0x000000,
            0.6
        );
        bg.setOrigin(0.5, 0.5);

        // Den gesamten Hintergrund klickbar machen
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => this.startIntro());

        // Mit "Hinweis:" beginnen
        const saveInfoText = this.add.text(
            textX,
            textY - 30,
            "Hinweis: Dein Spielstand wird automatisch lokal im Browser gespeichert\nund bleibt auch nach einem Neustart erhalten.",
            {
                fontSize: '28px',
                fontFamily: 'Arial, sans-serif',
                color: '#FFFFFF',
                align: 'center',
                wordWrap: { width: bgWidth - 40 }
            }
        ).setOrigin(0.5, 0.5);

        // Hinweis zum Inkognito-Modus mit größerer Schrift
        const infoText = this.add.text(
            textX,
            textY + 30,
            "(Funktioniert nicht im privaten/inkognito Modus)",
            {
                fontSize: '24px',
                fontFamily: 'Arial, sans-serif',
                color: '#CCCCCC',
                align: 'center'
            }
        ).setOrigin(0.5, 0.5);

        // Start-Button deutlicher hervorheben
        const startButton = this.add.text(
            textX,
            textY + 90,
            "CLICK TO START",
            {
                fontSize: '36px',
                fontFamily: 'Arial, sans-serif',
                color: '#FFFF00',
                align: 'center',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5, 0.5);

        // Pulsieren des Start-Textes
        this.tweens.add({
            targets: startButton,
            scale: 1.1,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Alle Elemente in einer Gruppe sammeln
        this.startTextGroup = this.add.container(0, 0, [bg, saveInfoText, infoText, startButton]);

        // Die einzelnen Textelemente auch klickbar machen
        [saveInfoText, infoText, startButton].forEach(textElement => {
            textElement.setInteractive({ useHandCursor: true });
            textElement.on('pointerdown', () => this.startIntro());
        });
    }

    startIntro() {
        if (this.busHasMoved) return;

        this.startTextGroup.destroy();

        this.busHasMoved = true;

        // Bus-Status im Spielstand speichern
        this.updateGameState({
            progress: {
                busHasMoved: true
            }
        });

        if (this.startText) {
            this.startText.destroy();
        }

        // Bus-Animation
        this.animateBusOut();
    }

    animateBusOut() {
        // Verhindere, dass diese Methode mehrmals ausgeführt wird
        if (this.soundTextCreated) return;
        this.soundTextCreated = true;

        // Ziel außerhalb des Viewports rechts
        const busTargetX = this.viewport.width + this.bus.width / 1.4;

        // Sound-Effekt mit SoundEffect-Klasse erstellen
        this.soundEffects.play("BRRRRUUM", this.bus.x, this.bus.y, {
            duration: 2200,
            depth: this.bus.depth + 1,
            style: {
                fontSize: '48px',
                fill: '#ff6f61',
                fontFamily: 'Courier New, monospace',
                stroke: '#000000',
                strokeThickness: 7
            }
        });

        // Bus bewegen
        this.tweens.add({
            targets: this.bus,
            x: busTargetX,
            duration: 2000,
            ease: 'Power1',
            onComplete: () => {
                this.bus.setVisible(false);

                // Kurze Verzögerung vor dem Monolog
                this.time.delayedCall(50, () => {
                    this.sophie.play('walk_left');
                    this.time.delayedCall(850, () => {
                        this.startMonolog();
                    });
                });
            }
        });
    }

    startMonolog() {
        // Sicherstellen, dass die Szene und Sophie bereit sind
        if (!this.sophie || !this.sophie.active) {
            console.warn("Sophie ist nicht bereit für den Monolog");
            // Nochmals verzögern, falls Sophie noch nicht bereit ist
            this.time.delayedCall(100, () => {
                this.startMonolog();
            });
            return;
        }

        // Monolog anzeigen und danach zur Hauptszene wechseln
        this.showMonolog(GameData.monologs.intro, () => {
            // Zur ersten spielbaren Szene wechseln
            this.changeScene('BuildingScene');
        });
    }
}