class DialogSwitcher {
    constructor(scene) {
        this.scene = scene;
        this.overlay = null;
        this.optionButtons = [];
        this.isActive = false;
    }

    // Zeigt Dialogoptionen an
    showOptions(options) {
        this.scene.isMonologActive = true;

        if (options.length === 0) return;

        // Bei nur einer Option direkt ausführen ohne Auswahl
        if (options.length === 1) {
            options[0].callback();
            return;
        }

        this.isActive = true;

        // Transparentes Overlay erstellen
        this.createOverlay();

        // Optionen als Buttons darstellen
        this.createOptionButtons(options);
    }

    // Erstellt das Overlay
    createOverlay() {
        // Falls bereits ein Overlay existiert, dieses entfernen
        this.hideOptions();

        // Transparentes weißes Overlay erstellen
        this.overlay = this.scene.add.rectangle(
            this.scene.viewport.width / 2,
            this.scene.viewport.height / 2,
            this.scene.viewport.width,
            this.scene.viewport.height,
            0xffffff,
            0.7
        ).setDepth(20000);

        this.overlay.setInteractive();

        this.overlay.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
        });
    }

    // Erstellt Buttons für jede Option
    createOptionButtons(options) {
        const buttonHeight = 50;
        const padding = 20;
        const startY = this.scene.viewport.height / 2 - (options.length * buttonHeight + (options.length - 1) * padding) / 2;

        options.forEach((option, index) => {
            const y = startY + index * (buttonHeight + padding);

            // Button-Hintergrund
            const button = this.scene.add.rectangle(
                this.scene.viewport.width / 2,
                y,
                this.scene.viewport.width * 0.7,
                buttonHeight,
                0x333333,
                0.9
            ).setDepth(20001);

            // Buttontext
            const text = this.scene.add.text(
                this.scene.viewport.width / 2,
                y,
                option.text,
                {
                    fontFamily: 'Courier New',
                    fontSize: '20px',
                    color: '#ffffff',
                    align: 'center',
                    wordWrap: { width: this.scene.viewport.width * 0.65 }
                }
            ).setOrigin(0.5, 0.5).setDepth(20002);

            // Button interaktiv machen
            button.setInteractive();

            // Klick-Event
            button.on('pointerdown', () => {
                this.hideOptions();
                option.callback();
            });

            // Hover-Effekte
            button.on('pointerover', () => {
                button.setFillStyle(0x666666, 0.9);
            });

            button.on('pointerout', () => {
                button.setFillStyle(0x333333, 0.9);
            });

            this.optionButtons.push({ button, text });
        });
    }

    // Entfernt die Optionen und das Overlay
    hideOptions() {
        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
        }

        this.optionButtons.forEach(btn => {
            btn.button.destroy();
            btn.text.destroy();
        });

        this.optionButtons = [];
        this.isActive = false;
        this.scene.isMonologActive = false;
    }
}