class MonologManager {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.currentIndex = 0;
        this.currentLines = [];
        this.timer = null;
        this.textObject = null;
        this.speakerObject = null;
        this.onCompleteCallback = null;
        this.useTimer = false;
        this.currentOffsetY = null;
        this.blockingOverlay = null;

        // Standard-Styling (kann überschrieben werden)
        this.defaultStyle = {
            fontSize: '18px',
            fill: '#3b2a1e',
            fontFamily: 'Courier New, monospace',
            backgroundColor: '#e3d0b4',
            padding: { x: 10, y: 6 },
            stroke: '#a68a6d',
            strokeThickness: 2
        };

        // Mapping für verschiedene Sprecher-Stile
        this.speakerStyles = {
            'sophie': { ...this.defaultStyle },
            'ken': {
                ...this.defaultStyle,
                backgroundColor: '#d4e3f4',
                fill: '#1e3b5a'
            },
            'noel': {
                ...this.defaultStyle,
                backgroundColor: '#755200',
                fill: '#FFD700'
            },
            'jeff': {
                ...this.defaultStyle,
                backgroundColor: '#4b61ff',
                fill: '#c5cfef'
            },
            'devA': {
                ...this.defaultStyle,
                backgroundColor: '#088585',
                fill: '#ecc381'
            },
            'devB': {
                ...this.defaultStyle,
                backgroundColor: '#0abebe',
                fill: '#170d01'
            },
            'devC': {
                ...this.defaultStyle,
                backgroundColor: '#773f02',
                fill: '#dabd9a'
            },
            'devD': {
                ...this.defaultStyle,
                backgroundColor: '#f19529',
                fill: '#4f2b02'
            },
            'devE': {
                ...this.defaultStyle,
                backgroundColor: '#91028F',
                fill: '#b4a696'
            },
            'devF': {
                ...this.defaultStyle,
                backgroundColor: '#91028F',
                fill: '#ea9737'
            },
            'devG': {
                ...this.defaultStyle,
                backgroundColor: '#07148A',
                fill: '#6c6c6c'
            },
            'outro': {
                fontSize: '22px',
                fill: '#3b2a1e',
                fontFamily: 'Courier New, monospace',
                backgroundColor: '#e3d0b4',
                padding: { x: 12, y: 8 },
                stroke: '#a68a6d',
                strokeThickness: 3
            }
            // Weitere Sprecher können hier hinzugefügt werden
        };
    }

    /**
     * Zeigt einen Monolog an
     * @param {Object} options Konfigurationsoptionen
     * @param {string[]} options.lines Array mit Textzeilen für den Monolog
     * @param {Phaser.GameObjects.Sprite} options.speaker Sprecher-Objekt (Position wird für Textplatzierung verwendet)
     * @param {string} options.speakerType Typ des Sprechers (für Styling)
     * @param {Function} options.onComplete Callback nach Abschluss des Monologs
     * @param {boolean} options.timer Ob automatisch weitergeschaltet werden soll
     * @param {Object} options.style Optionales benutzerdefiniertes Styling
     * @param {number} options.offsetY Vertikaler Offset vom Sprecher
     */
    show(options) {
        // Bestehenden Monolog abbrechen, falls einer aktiv ist, ohne Callback auszuführen
        this.stop(false);

        const {
            lines,
            speaker,
            speakerType = 'sophie',
            onComplete = null,
            timer = false,
            style = null,
            offsetY = null
        } = options;

        // Grundeinstellungen speichern
        this.isActive = true;
        this.currentIndex = 0;
        this.currentLines = lines;
        this.onCompleteCallback = onComplete;
        this.useTimer = timer;
        this.speakerObject = speaker;
        this.currentOffsetY = offsetY;

        // UI vorbereiten
        this.scene.hideAllHoverTexts();
        this.scene.controls.disable();
        this.scene.controls.closeBag();

        // Transparente Blockierschicht erstellen, die alle Klicks abfängt
        this.blockingOverlay = this.scene.add.rectangle(
            this.scene.viewport.width / 2,
            this.scene.viewport.height / 2,
            this.scene.viewport.width,
            this.scene.viewport.height,
            0x000000, 0.01 // Fast unsichtbar
        ).setDepth(12000); // Hoher Depth-Wert, um über anderen Elementen zu liegen

        this.blockingOverlay.setInteractive();
        this.blockingOverlay.on('pointerdown', () => {
            // Beim Klick auf die transparente Schicht: Monolog weiterschalten
            if (this.timer && this.timer.getProgress() < 1) {
                this.timer.remove();
                this.timer = null;
            }
            this._advance();
        });

        // Textposition bestimmen
        const textPosition = this._calculateTextPosition(speaker, offsetY);

        // Styling bestimmen (Standard, Sprecher-spezifisch oder benutzerdefiniert)
        const textStyle = style || this.speakerStyles[speakerType] || this.defaultStyle;

        // Text erstellen
        this.textObject = this.scene.add.text(
            textPosition.x,
            textPosition.y,
            lines[this.currentIndex],
            textStyle
        ).setOrigin(0.5, 0.5)
            .setDepth(12001); // Höher als blockingOverlay, damit Text über der Blockierschicht liegt

        // Fontgröße anpassen
        if (GameData.constants.textScale) {
            const fontSize = Math.max(
                18,
                Math.round(parseInt(textStyle.fontSize) * GameData.constants.textScale)
            );
            this.textObject.setFontSize(fontSize + 'px');
        }

        // Text im Viewport anpassen
        this._adjustTextPosition();

        // Timer für automatisches Weiterschalten einrichten (falls aktiviert)
        if (this.useTimer) {
            const currentText = this.currentLines[this.currentIndex];
            const duration = this._calculateReadingTime(currentText);

            // Timer erstellen für automatisches Weitergehen
            this.timer = this.scene.time.delayedCall(duration, () => {
                this._advance();
            });
        }
    }

    /**
     * Berechnet die initiale Position des Textes basierend auf dem Sprecher
     */
    _calculateTextPosition(speaker, customOffsetY) {
        // Sprecher-spezifische Berechnung
        if (speaker.key === 'sophie') {
            const sophieActualHeight = speaker.displayHeight;
            const sophieHeadY = speaker.y - sophieActualHeight;

            // Offset kann aus Szenen-Konfiguration oder Parameter kommen
            const headSpacing = customOffsetY ||
                sophieActualHeight * (this.scene.sceneConfig.monologOffset || 0.13);

            return {
                x: speaker.x,
                y: sophieHeadY - headSpacing
            };
        }
        // Spezielle Positionierung für Ken
        else if (speaker.key === 'ken') {
            const kenActualHeight = speaker.displayHeight;
            const kenHeadY = speaker.y - kenActualHeight;

            // Größerer Abstand für Ken, damit der Text weiter oben erscheint
            const headSpacing = customOffsetY ||
                kenActualHeight * (this.scene.sceneConfig.kenMonologOffset || 0.4);

            return {
                x: speaker.x,
                y: kenHeadY - headSpacing
            };
        }
        // Spezielle Positionierung für Noel
        else if (speaker.key === 'noel') {

            return {
                x: speaker.x,
                y: speaker.y - (speaker.displayHeight * 1.03)
            };
        }
        // Spezielle Positionierung für Jeff
        else if (speaker.key === 'jeff') {

            return {
                x: speaker.x,
                y: speaker.y - (speaker.displayHeight * 1.03)
            };
        }

        else if(speaker.key === 'outro') {
            return {
                x: speaker.x * this.scene.viewport.width,
                y: speaker.y * this.scene.viewport.height
            }
        }

        else if(speaker.key.startsWith("dev")) {
            return {
                x: speaker.x * this.scene.viewport.width,
                y: speaker.y * this.scene.viewport.height
            }
        }

        // Für andere Objekte: Text über dem Objekt positionieren
        return {
            x: speaker.x,
            y: speaker.y - (speaker.displayHeight / 2) - (customOffsetY || 30)
        };
    }

    /**
     * Passt die Textposition an, damit der Text im Viewport bleibt
     * und nicht mit der Controls-Box überlappt
     */
    _adjustTextPosition() {
        if (!this.textObject) return;

        // Randabstand auf jeder Seite
        const margin = 10;

        // Berechnen der aktuellen Grenzen des Textes
        const bounds = this.textObject.getBounds();

        // Prüfen, ob der Text links oder rechts außerhalb des Viewports liegt
        let newX = this.textObject.x;
        let newY = this.textObject.y;

        // Wenn der Text links rausragt
        if (bounds.left < margin) {
            newX = margin + bounds.width / 2;
        }
        // Wenn der Text rechts rausragt
        else if (bounds.right > this.scene.viewport.width - margin) {
            newX = this.scene.viewport.width - margin - bounds.width / 2;
        }

        // Auch die vertikale Position überprüfen
        // Wenn der Text oben rausragt
        if (bounds.top < margin) {
            newY = margin + bounds.height / 2;
        }
        // Wenn der Text unten rausragt
        else if (bounds.bottom > this.scene.viewport.height - margin) {
            newY = this.scene.viewport.height - margin - bounds.height / 2;
        }

        // Prüfen auf Überlappung mit der Controls-Box
        const controlsBoxWidth = this.scene.controls ?
            (this.scene.controls.config.startX + this.scene.controls.config.buttonWidth + this.scene.controls.config.boxExtraWidth) :
            180; // Fallback-Wert, falls scene.controls nicht verfügbar

        const controlsBoxTop = this.scene.controls ?
            (this.scene.controls.config.startY - this.scene.controls.config.boxPadding) :
            280; // Fallback für obere Position

        const controlsBoxBottom = this.scene.controls ?
            (controlsBoxTop +
                (this.scene.controls.config.buttonHeight + this.scene.controls.config.spacing) *
                this.scene.controls.config.actions.length +
                this.scene.controls.config.boxPadding * 2 +
                120 - this.scene.controls.config.spacing) :
            500; // Fallback für untere Position

        // Wenn der Text mit der Controls-Box überlappt (horizontal und vertikal)
        if (bounds.left < controlsBoxWidth &&
            bounds.bottom > controlsBoxTop &&
            bounds.top < controlsBoxBottom) {
            // Verschiebe den Text nach rechts, außerhalb der Controls-Box
            newX = controlsBoxWidth + margin + bounds.width / 2;
        }

        // Position aktualisieren, wenn sich etwas geändert hat
        if (newX !== this.textObject.x) {
            this.textObject.setX(newX);
        }

        if (newY !== this.textObject.y) {
            this.textObject.setY(newY);
        }
    }

    /**
     * Schaltet zum nächsten Monolog-Text weiter oder beendet den Monolog
     */
    _advance() {
        this.currentIndex++;

        if (this.currentIndex < this.currentLines.length) {
            // Zum nächsten Text wechseln
            const currentText = this.currentLines[this.currentIndex];
            this.textObject.setText(currentText);

            // Position nach Textänderung anpassen
            this._adjustTextPosition();

            // Neuen Timer einrichten (falls aktiviert)
            if (this.useTimer) {
                const duration = this._calculateReadingTime(currentText);
                this.timer = this.scene.time.delayedCall(duration, () => {
                    this._advance();
                });
            }
        } else {
            // Monolog beenden und Callback ausführen
            this.stop(true);
        }
    }

    /**
     * Berechnet die Lesedauer für automatisches Weiterschalten
     */
    _calculateReadingTime(text) {
        // Leerer oder ungültiger Text
        if (!text || typeof text !== 'string') {
            return 1500;
        }

        // Text in Wörter aufteilen
        const words = text.trim().split(/\s+/);
        const wordCount = words.length;

        // Lesedauer berechnen: 1200ms Grundwert + 300ms pro Wort
        return 1200 + (wordCount * 300);
    }

    /**
     * Bricht den aktuellen Monolog ab und räumt auf
     * @param {boolean} executeCallback Ob der onComplete-Callback ausgeführt werden soll
     */
    stop(executeCallback = true) {
        if (!this.isActive) return;

        // Timer stoppen, falls aktiv
        if (this.timer) {
            this.timer.remove();
            this.timer = null;
        }

        // Text-Objekt aufräumen
        if (this.textObject) {
            this.textObject.destroy();
            this.textObject = null;
        }

        // Blockierschicht aufräumen
        if (this.blockingOverlay) {
            this.blockingOverlay.off('pointerdown'); // Event-Listener entfernen
            this.blockingOverlay.destroy();
            this.blockingOverlay = null;
        }

        // Callback für später speichern, falls vorhanden
        const callback = this.onCompleteCallback;

        // Szenen-Zustand wiederherstellen
        this.scene.isMonologActive = false;
        this.scene.controls.enable();

        // IntroScene-spezifische Logik (aus BaseScene übernommen)
        if (this.scene.scene.key === 'IntroScene' &&
            this.currentLines === GameData.monologs.intro) {
            this.scene.updateGameState({
                progress: {
                    hasSeenIntro: true
                }
            });
        }

        // Status zurücksetzen
        this.isActive = false;
        this.currentIndex = 0;
        this.currentLines = [];
        this.speakerObject = null;
        this.onCompleteCallback = null;

        // Callback NACH dem Zurücksetzen ausführen, wenn gewünscht
        if (callback && executeCallback) {
            callback();
        }
    }

    /**
     * Passt die Textposition an Veränderungen in der Bildschirmgröße an
     * Diese Methode kann vom Resize-Handler der Szene aufgerufen werden
     */
    adjustToScreenSize() {
        if (this.isActive && this.textObject && this.speakerObject) {
            // Neu berechnen der Text-Position basierend auf dem aktuellen Sprecher
            const textPosition = this._calculateTextPosition(
                this.speakerObject,
                this.currentOffsetY
            );

            // Text an die neue Position setzen
            this.textObject.setPosition(textPosition.x, textPosition.y);

            // Blockierungsschicht an neue Viewport-Größe anpassen
            if (this.blockingOverlay) {
                this.blockingOverlay.setPosition(
                    this.scene.viewport.width / 2,
                    this.scene.viewport.height / 2
                );
                this.blockingOverlay.setSize(
                    this.scene.viewport.width,
                    this.scene.viewport.height
                );
            }

            // Sicherstellen, dass der Text im Viewport bleibt
            this._adjustTextPosition();
        }
    }

    /**
     * Gibt zurück, ob gerade ein Monolog aktiv ist
     */
    isMonologActive() {
        return this.isActive;
    }
}