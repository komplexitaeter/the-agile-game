class OutroScene extends BaseScene {
    constructor() {
        super({ key: 'OutroScene' });
        this.newsletterSubscribed = false;
    }

    create() {
        super.create();

        this.congratsText = this.add.text(
            this.viewport.width * 0.5,
            this.viewport.height * 0.1,
            'Herzlichen Glückwunsch!',
            {
                fontSize: '50px',
                fontFamily: 'Courier New, monospace',
                color: '#ffffff',
                fontStyle: 'bold',
                padding: { x: 20, y: 10 },
                stroke: '#201030',
                strokeThickness: 10,
                align: 'center'
            }
        );
        this.congratsText.setOrigin(0.5, 0.5);

        // Newsletter-Box erstellen (anfangs versteckt)
        this.createNewsletterSection();
        this.newsletterContainer.setVisible(false);

        this.outroSophie = {key: 'outro', x: 0, y: 0.45};

        // Sophie Monolog starten nach kurzer Verzögerung
        this.time.delayedCall(600, () => {
            this.showCharacterMonolog(this.outroSophie, [
                      "Puh, das war aufregend. Ging es dir auch so? Aber Spaß hatten wir schon.."
                     ,"Wenn du Lust auf Teil 2 hast, melde dich doch für unseren Newsletter an.."
                     ,"So bleibst du auf dem Laufenden und erfährst, wann es weiter geht.."],()=>{
                window.location.href = 'https://www.komplexitaeter.de/kontakt/';
            });
        });

    }



    createNewsletterSection() {
        // Newsletter-Container zentriert erstellen
        this.newsletterContainer = this.add.container(
            this.viewport.width * 0.65,
            this.viewport.height * 0.35
        );

        // Hintergrund für das Formular - im Stil der ThemeScene
        const formBg = this.add.rectangle(
            0, 0,
            this.viewport.width * 0.36, // Etwas schmaler
            this.viewport.height * 0.22, // Etwas flacher
            0x000000,
            0.7
        );
        formBg.setStrokeStyle(3, 0x4a7aff, 0.8); // Blauer Rand passend zum ThemeScene Style
        this.newsletterContainer.add(formBg);

        // Newsletter-Überschrift
        const newsletterTitle = this.add.text(
            0, -formBg.height * 0.35,
            'Newsletter Anmeldung',
            {
                fontFamily: 'Courier New, monospace',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ffffff',
                align: 'center',
                stroke: '#201030',
                strokeThickness: 3
            }
        );
        newsletterTitle.setOrigin(0.5, 0.5);
        this.newsletterContainer.add(newsletterTitle);

        // E-Mail Eingabefeld
        const emailInput = this.add.rectangle(
            0, -formBg.height * 0.1,
            formBg.width * 0.8,
            40,
            0xffffff,
            1
        );
        emailInput.setStrokeStyle(2, 0x4a7aff, 0.8);

        // E-Mail Platzhaltertext
        this.emailText = this.add.text(
            -emailInput.width * 0.45, -formBg.height * 0.1 - 9,
            'Deine E-Mail-Adresse',
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#888888'
            }
        );
        this.emailText.setOrigin(0, 0.5);

        // DOM-Element für echtes Eingabefeld erstellen
        if (this.sys.game.device.os.desktop) {
            // Nur auf Desktop ein echtes Eingabefeld erstellen
            this.emailInput = this.add.dom(
                0, -formBg.height * 0.1,
                'input',
                'width: 80%; height: 35px; padding: 8px; font-size: 16px; border: 2px solid #4a7aff;'
            );
            this.emailInput.setOrigin(0.5, 0.5);
            this.emailInput.node.placeholder = 'Deine E-Mail-Adresse';

            // Sichtbaren Platzhaltertext ausblenden wenn echtes Input-Feld existiert
            this.emailText.setVisible(false);
        }

        // Checkbox Container
        const checkboxContainer = this.add.container(
            -emailInput.width * 0.4,
            formBg.height * 0.15
        );

        // Checkbox (visuell)
        this.checkbox = this.add.rectangle(
            0, 0,
            24, 24,
            0xffffff,
            1
        );
        this.checkbox.setStrokeStyle(2, 0x4a7aff, 0.8);
        this.checkbox.setOrigin(0.5, 0.5);
        this.checkbox.setInteractive({ useHandCursor: true });

        // Checkbox-Haken (anfangs unsichtbar)
        this.checkmark = this.add.text(
            0, 0,
            '✓',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#4a7aff'
            }
        );
        this.checkmark.setOrigin(0.5, 0.5);
        this.checkmark.setVisible(false);

        // Checkbox Klick-Handler
        this.checkbox.on('pointerdown', () => {
            this.checkmark.setVisible(!this.checkmark.visible);
        });

        // Checkbox-Text
        const checkboxText = this.add.text(
            this.checkbox.width + 5, 0,
            'Ja, ich möchte über Neuigkeiten informiert werden',
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff',
                wordWrap: { width: formBg.width * 0.6 },
                stroke: '#000000',
                strokeThickness: 1
            }
        );
        checkboxText.setOrigin(0, 0.5);

        // Elemente zum Checkbox-Container hinzufügen
        checkboxContainer.add([this.checkbox, this.checkmark, checkboxText]);

        // Anmelde-Button - im Stil der ThemeScene
        this.subscribeButton = this.add.rectangle(
            0, formBg.height * 0.35,
            formBg.width * 0.5,
            45,
            0x4a7aff, // Blau wie in ThemeScene
            1
        );
        this.subscribeButton.setStrokeStyle(2, 0x000000, 0.8);
        this.subscribeButton.setInteractive({ useHandCursor: true });

        // Button-Hover-Effekt
        this.subscribeButton.on('pointerover', () => {
            this.subscribeButton.setFillStyle(0x3a6aee); // Dunklere Farbe beim Hover, wie in ThemeScene
        });
        this.subscribeButton.on('pointerout', () => {
            this.subscribeButton.setFillStyle(0x4a7aff); // Normale Farbe
        });

        // Button-Text
        const buttonText = this.add.text(
            0, formBg.height * 0.35,
            'Anmelden',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 1
            }
        );
        buttonText.setOrigin(0.5, 0.5);

        // Anmelde-Button Klick-Handler
        this.subscribeButton.on('pointerdown', () => {
            this.handleSubscription();
        });

        // Erfolgstext (anfangs unsichtbar)
        this.successText = this.add.text(
            0, 0,
            'Vielen Dank für deine Anmeldung!',
            {
                fontFamily: 'Arial',
                fontSize: '22px',
                fontWeight: 'bold',
                color: '#4a7aff',
                backgroundColor: '#ffffff',
                padding: { x: 15, y: 10 },
                stroke: '#000000',
                strokeThickness: 1
            }
        );
        this.successText.setOrigin(0.5, 0.5);
        this.successText.setVisible(false);

        // Alle Elemente zum Newsletter-Container hinzufügen
        this.newsletterContainer.add([
            emailInput,
            this.emailText,
            checkboxContainer,
            this.subscribeButton,
            buttonText,
            this.successText
        ]);

        // Wenn DOM-Element vorhanden, ebenfalls hinzufügen
        if (this.emailInput) {
            this.newsletterContainer.add(this.emailInput);
        }
    }

    handleSubscription() {
        // Prüfen, ob die Checkbox aktiviert ist
        if (!this.checkmark.visible) {
            // Fehlermeldung anzeigen
            this.showToast('Bitte bestätige, dass du den Newsletter erhalten möchtest.', 0xFF0000);
            return;
        }

        // E-Mail-Adresse abrufen (je nach Implementierung)
        let email = '';
        if (this.emailInput && this.emailInput.node) {
            email = this.emailInput.node.value;
        } else {
            // Für Nicht-Desktop-Geräte könnte hier ein Overlay mit Eingabefeld angezeigt werden
            // oder eine andere Lösung implementiert werden
            this.showToast('Newsletter-Anmeldung nur auf Desktop verfügbar', 0xFF0000);
            return;
        }

        // Einfache E-Mail-Validierung
        if (!this.validateEmail(email)) {
            this.showToast('Bitte gib eine gültige E-Mail-Adresse ein.', 0xFF0000);
            return;
        }

        // Hier später die Brevo API-Integration
        console.log('Newsletter-Anmeldung:', email);

        // Anzeigen, dass die Anmeldung erfolgreich war
        this.newsletterSubscribed = true;

        // Formularelemente ausblenden
        if (this.emailInput) this.emailInput.setVisible(false);
        this.emailText.setVisible(false);
        this.checkbox.setVisible(false);
        this.checkmark.setVisible(false);
        this.subscribeButton.setVisible(false);

        // Erfolgsmeldung anzeigen
        this.successText.setVisible(true);

        // Toast-Nachricht anzeigen
        this.showToast('Vielen Dank für deine Anmeldung!', 0x4a7aff);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    showToast(message, backgroundColor = 0x000000) {
        // Toast-Container erstellen
        const toast = this.add.container(
            this.viewport.width * 0.5,
            this.viewport.height * 0.85
        );

        // Toast-Hintergrund
        const bg = this.add.rectangle(
            0, 0,
            this.viewport.width * 0.6,
            50,
            backgroundColor,
            0.8
        );
        bg.setOrigin(0.5, 0.5);
        bg.setStrokeStyle(2, 0xffffff, 0.5);

        // Toast-Text
        const text = this.add.text(
            0, 0,
            message,
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#ffffff',
                align: 'center'
            }
        );
        text.setOrigin(0.5, 0.5);

        // Elemente zum Toast hinzufügen
        toast.add([bg, text]);

        // Toast-Animation
        this.tweens.add({
            targets: toast,
            y: this.viewport.height * 0.8,
            alpha: { from: 0, to: 1 },
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Nach bestimmter Zeit ausblenden
                this.time.delayedCall(3000, () => {
                    this.tweens.add({
                        targets: toast,
                        y: this.viewport.height * 0.75,
                        alpha: 0,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => {
                            toast.destroy();
                        }
                    });
                });
            }
        });
    }
}