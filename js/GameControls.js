class GameControls {
    constructor(scene) {
        this.scene = scene;
        this.viewport = scene.viewport;
        this.buttons = {};
        this.buttonContainer = null;
        this.background = null;
        this.inventoryBag = null;
        this.inventoryPanel = null;
        this.inventoryPanelTween = null;
        this.inventorySlots = [];
        this.isBagOpen = false;
        this.activeActionIndex = 0;

        this.isPromptUseAction = false;
        this.useItemKey = null;
        this.usePrompt = null;

        // Konstanten für das Layout
        this.config = {
            padding: 8,
            buttonWidth: 140,
            buttonHeight: 40,
            spacing: 6,
            startX: 15,
            startY: 300,
            boxPadding: 35,        // Abstand zwischen Box und Buttons
            boxExtraWidth: 25,     // Zusätzliche Breite rechts der Buttons
            boxCornerRadius: 25,   // Radius für die abgerundeten Ecken
            boxAlpha: 0.8,         // Transparenz der Box (0-1)

            // Aktionen mit name und displayName
            actions: [
                { name: 'goTo', displayName: 'Gehe zu' },
                { name: 'view', displayName: 'Betrachte' },
                { name: 'take', displayName: 'Nimm' },
                { name: 'talkTo', displayName: 'Sprich mit' },
                { name: 'use', displayName: 'Benutze' }
            ]
        };

        // Button-Stile
        this.styles = {
            normal: {
                fontSize: '22px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#4a7aff',
                padding: { x: 10, y: 6 },
                stroke: '#000000',
                strokeThickness: 1,
                fixedWidth: this.config.buttonWidth,
                align: 'center'
            },
            hover: {
                backgroundColor: '#3a6aea'
            },
            active: {
                fontSize: '22px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#ff4a4a',
                padding: { x: 10, y: 6 },
                stroke: '#000000',
                strokeThickness: 2,
                fixedWidth: this.config.buttonWidth,
                align: 'center'
            },
            activeHover: {
                backgroundColor: '#ee3a3a'
            }
        };

        // Buttons erstellen
        this.create();
    }

    create() {
        // Container für alle UI-Elemente erstellen
        this.buttonContainer = this.scene.add.container(0, 0);
        this.buttonContainer.setDepth(11000); // Über allem anderen

        // Erstelle jeden Button
        this.config.actions.forEach((action, index) => {
            const buttonX = this.config.startX + this.config.buttonWidth / 2;
            const buttonY = this.config.startY + (this.config.buttonHeight + this.config.spacing) * index + this.config.buttonHeight / 2;

            // Button erstellen mit normalem Stil
            const button = this.scene.add.text(
                buttonX,
                buttonY,
                action.displayName,
                { ...this.styles.normal }
            ).setOrigin(0.5);

            // Speichere die Action-Daten im Button-Objekt für einfacheren Zugriff
            button.actionData = action;

            // Button interaktiv machen
            button.setInteractive({ useHandCursor: true });

            // Event-Listener für Hover-Effekte
            button.on('pointerover', () => {
                if (this.activeActionIndex === index) {
                    button.setStyle(this.styles.activeHover);
                } else {
                    button.setStyle(this.styles.hover);
                }
            });

            button.on('pointerout', () => {
                if (this.activeActionIndex === index) {
                    button.setStyle(this.styles.active);
                } else {
                    button.setStyle(this.styles.normal);
                }
            });

            // Click-Listener mit Event-Propagation-Stopper
            button.on('pointerdown', (pointer, localX, localY, event) => {
                // Event-Propagation stoppen, damit handlePointerDown nicht ausgelöst wird
                event.stopPropagation();

                this.setActiveAction(index);
            });

            // Zum Container hinzufügen und in der Referenz speichern
            this.buttonContainer.add(button);

            // Speichere Button-Referenz für einfachen Zugriff
            this.buttons[action.name] = button;
        });

        // Hintergrundbox für die Buttons erstellen
        this.createBackground();

        // Inventartasche hinzufügen
        this.createInventoryBag();

        // Inventory-Panel erstellen (initial außerhalb des sichtbaren Bereichs)
        this.createInventoryPanel();

        this.createInventoryItems();
        this.positionInventoryItems();

        this.createUsePrompt();

        // Standardmäßig die erste Aktion aktivieren ("Gehe zu")
        this.setActiveAction(0);
    }

    createBackground() {
        // Berechne die Dimensionen der Box basierend auf den Buttons
        const boxX = 0; // Linksbündig
        const boxY = this.config.startY - this.config.boxPadding;
        const boxWidth = this.config.startX + this.config.buttonWidth + this.config.boxExtraWidth;
        const boxHeight =
            (this.config.buttonHeight + this.config.spacing) * this.config.actions.length +
            this.config.boxPadding * 2 +
            120 - // Zusätzliche Höhe für die Inventartasche
            this.config.spacing; // Höhe für alle Buttons plus Padding

        // Erstelle die Box als Graphics-Objekt
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0xFFFFFF, this.config.boxAlpha); // Weiß mit Transparenz

        // Zeichne die Box mit abgerundeten Ecken nur auf der rechten Seite
        this.background.beginPath();

        // Startpunkt: Oben links
        this.background.moveTo(boxX, boxY);

        // Linie nach rechts oben
        this.background.lineTo(boxX + boxWidth - this.config.boxCornerRadius, boxY);

        // Abgerundete Ecke oben rechts
        this.background.arc(
            boxX + boxWidth - this.config.boxCornerRadius,
            boxY + this.config.boxCornerRadius,
            this.config.boxCornerRadius,
            1.5 * Math.PI,
            2 * Math.PI
        );

        // Linie nach rechts unten
        this.background.lineTo(boxX + boxWidth, boxY + boxHeight - this.config.boxCornerRadius);

        // Abgerundete Ecke unten rechts
        this.background.arc(
            boxX + boxWidth - this.config.boxCornerRadius,
            boxY + boxHeight - this.config.boxCornerRadius,
            this.config.boxCornerRadius,
            0,
            0.5 * Math.PI
        );

        // Linie nach links unten
        this.background.lineTo(boxX, boxY + boxHeight);

        // Linie zurück zum Startpunkt
        this.background.lineTo(boxX, boxY);

        this.background.closePath();
        this.background.fillPath();

        // Füge die Box dem Container hinzu und setze sie an den Anfang (unter die Buttons)
        this.buttonContainer.add(this.background);
        this.buttonContainer.sendToBack(this.background);

        // Setze die Tiefe der Box etwas niedriger als die Buttons, aber immer noch hoch genug
        this.background.setDepth(11001);
    }

    createInventoryBag() {
        // Position berechnen (unter den Buttons, aber innerhalb der Box)
        const lastButtonIndex = this.config.actions.length - 1;
        const lastButtonY = this.config.startY + (this.config.buttonHeight + this.config.spacing) * lastButtonIndex + this.config.buttonHeight;
        const bagY = lastButtonY + 80; // 80px Abstand unter dem letzten Button
        const bagX = this.config.startX + this.config.buttonWidth / 2; // Zentriert unter den Buttons

        // Inventartasche erstellen
        this.inventoryBag = this.scene.add.image(bagX, bagY, 'bag_closed');
        this.inventoryBag.setScale(0.15); // Auf 15% skalieren

        // Interaktiv machen
        this.inventoryBag.setInteractive({ useHandCursor: true });

        // Click-Ereignis hinzufügen
        this.inventoryBag.on('pointerdown', (pointer, localX, localY, event) => {
            // Event-Propagation stoppen
            event.stopPropagation();

            // Zustand umschalten
            this.toggleBag();
        });

        // Zum Container hinzufügen
        this.buttonContainer.add(this.inventoryBag);
    }

    createInventoryPanel() {
        // Inventarpanel als separaten Container erstellen
        this.inventoryPanel = this.scene.add.container(this.viewport.width, 0);
        this.inventoryPanel.setDepth(11000);

        // Größe des Panels (35% der Breite, 100% Höhe)
        const panelWidth = this.viewport.width * 0.35;
        const panelHeight = this.viewport.height;

        // Interaktiver Blocker - unsichtbares Rectangle über die gesamte Fläche
        const hitArea = this.scene.add.rectangle(panelWidth/2, panelHeight/2, panelWidth, panelHeight, 0x000000, 0);
        hitArea.setInteractive();

        // Event-Handler für den Blocker - verhindert, dass darunterliegende Elemente Hover-Events erhalten
        hitArea.on('pointerdown', (pointer, localX, localY, event) => {
            // Verhindert, dass das Event an darunterliegende Objekte weitergeleitet wird
            event.stopPropagation();
        });

        // Hintergrund des Panels als Graphics-Objekt
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0xFFFFFF, 0.7); // Weiß mit 70% Transparenz
        panelBg.fillRect(0, 0, panelWidth, panelHeight);

        // Füge erst den Hintergrund, dann den interaktiven Bereich hinzu
        this.inventoryPanel.add(panelBg);
        this.inventoryPanel.add(hitArea);

        // Inventar-Slots erstellen
        this.createInventorySlots(panelWidth, panelHeight);
    }

    createInventorySlots(panelWidth, panelHeight) {
        // Konfiguration für das Slot-Raster
        const columns = 3;
        const rows = 5;
        const padding = 30; // Abstand vom Rand und zwischen den Slots

        // Berechne die verfügbare Fläche für die Slots
        const availableWidth = panelWidth - (padding * 2);
        const availableHeight = panelHeight - (padding * 2);

        // Größe eines einzelnen Slots (quadratisch)
        const slotSize = Math.min(
            availableWidth / columns - padding,
            availableHeight / rows - padding
        );

        // Rundungsradius für die Ecken (15% der Slotgröße)
        const cornerRadius = slotSize * 0.15;

        // Leere das Slots-Array, falls es bereits Elemente enthält
        this.inventorySlots = [];

        // Temporäres 2D-Array für die Slots, um sie später in der gewünschten Reihenfolge zusammenzufügen
        const tempSlots = Array(columns).fill().map(() => Array(rows).fill(null));

        // Beginne mit der Y-Position
        let startY = padding+25;

        // Für jede Zeile
        for (let row = 0; row < rows; row++) {
            // Beginne mit der X-Position für diese Zeile
            let startX = padding+10;

            // Für jede Spalte in dieser Zeile
            for (let col = 0; col < columns; col++) {
                // Erstelle ein Graphics-Objekt für den Slot mit abgerundeten Ecken
                const slot = this.scene.add.graphics();

                // Normaler Alpha-Wert und Farbe
                const normalAlpha = 0.7;
                const hoverAlpha = 0.77;
                const slotColor = 0x555555;

                // Speichere diese Werte am Slot selbst für späteren Zugriff
                slot.normalAlpha = normalAlpha;
                slot.hoverAlpha = hoverAlpha;
                slot.slotColor = slotColor;
                slot.slotSize = slotSize;
                slot.cornerRadius = cornerRadius;
                slot.slotIndex = -1; // Wird später gesetzt

                // Initialer Stil
                slot.fillStyle(slotColor, normalAlpha);

                // Position im Container
                slot.x = startX;
                slot.y = startY;

                // Zeichne einen abgerundeten Slot
                slot.fillRoundedRect(0, 0, slotSize, slotSize, cornerRadius);

                // Mache den Slot interaktiv mit einer rechteckigen Hitbox
                slot.setInteractive(new Phaser.Geom.Rectangle(0, 0, slotSize, slotSize), Phaser.Geom.Rectangle.Contains);

                // Referenz zum GameControls-Objekt für Event-Handler
                const self = this;

                // Hover-Events
                slot.on('pointerover', function() {
                    // Slot neu zeichnen mit höherem Alpha-Wert
                    this.clear();
                    this.fillStyle(this.slotColor, this.hoverAlpha);
                    this.fillRoundedRect(0, 0, this.slotSize, this.slotSize, this.cornerRadius);

                    // Prüfen, ob ein Item in diesem Slot ist, und wenn ja, den Text anzeigen
                    self.showItemTitleAtSlot(this.slotIndex);

                });

                slot.on('pointerout', function() {
                    // Slot neu zeichnen mit normalem Alpha-Wert
                    this.clear();
                    this.fillStyle(this.slotColor, this.normalAlpha);
                    this.fillRoundedRect(0, 0, this.slotSize, this.slotSize, this.cornerRadius);

                    // Itemtext ausblenden
                    self.hideItemTitleAtSlot(this.slotIndex);
                });

                slot.on('pointerdown', function(pointer, localX, localY, event) {
                    // Event-Propagation stoppen
                    event.stopPropagation();

                    self.handleItemClick(this.slotIndex);
                });

                // Slot zum Panel-Container hinzufügen
                this.inventoryPanel.add(slot);

                // Slot im temporären 2D-Array speichern
                tempSlots[col][row] = slot;

                // X-Position für den nächsten Slot in dieser Zeile aktualisieren
                startX += slotSize + padding;
            }

            // Y-Position für die nächste Zeile aktualisieren
            startY += slotSize + padding;
        }

        // Slots in der richtigen Reihenfolge ins Array übertragen
        let slotIndex = 0;
        for (let col = 0; col < columns; col++) {
            for (let row = 0; row < rows; row++) {
                // Füge den aktuellen Slot zum Inventarslots-Array hinzu
                const slot = tempSlots[col][row];
                this.inventorySlots.push(slot);

                // Index speichern (für schnellen Zugriff in den Event-Handlern)
                slot.slotIndex = slotIndex++;
            }
        }
    }

    createInventoryItems() {
        GameData.inventoryItems.forEach(item => {
            // Bild erstellen
            item.image = this.scene.add.image(0, 0, item.key);
            item.image.setVisible(false);

            // Eigenschaften für den Item-Titel
            item.titleText = null;

            // Das Bild dem Panel hinzufügen
            this.inventoryPanel.add(item.image);
        });
    }

    positionInventoryItems() {
        let i = 0;

        // Konfiguration für die Slot-Größe (ähnlich wie in createInventorySlots)
        const columns = 3;
        const rows = 5;
        const padding = 30;
        const panelWidth = this.viewport.width * 0.35;
        const panelHeight = this.viewport.height;
        const availableWidth = panelWidth - (padding * 2);
        const availableHeight = panelHeight - (padding * 2);
        const slotSize = Math.min(
            availableWidth / columns - padding,
            availableHeight / rows - padding
        );

        // Erst alle Item-Slot-Zuordnungen zurücksetzen
        GameData.inventoryItems.forEach(item => {
            item.slotIndex = -1;
            item.show = this.scene.stateManager.hasAsset(this.scene.gameState, item.key);

            // Jeden Titel entfernen, falls vorhanden
            if (item.titleText) {
                item.titleText.destroy();
                item.titleText = null;
            }
        });

        // Dann neu zuordnen
        GameData.inventoryItems.forEach(item => {
            if (i < this.inventorySlots.length && item.show) {
                // Slot-Index merken
                item.slotIndex = i;

                // Die korrekte Position berechnen (Mitte des Slots)
                const slotX = this.inventorySlots[i].x + slotSize / 2;
                const slotY = this.inventorySlots[i].y + slotSize / 2;

                item.image.x = slotX;
                item.image.y = slotY;

                // Größe anpassen, damit es in den Slot passt (60% der Slot-Größe)
                const scale = (slotSize * 0.6) / Math.max(item.image.width, item.image.height);
                item.image.setScale(scale);

                item.image.setVisible(true);
                i++;
            } else {
                item.image.setVisible(false);
                item.image.x = 0;
                item.image.y = 0;
            }
        });
    }

    // Neue Methode: Zeigt den Titel eines Items an, das sich in einem bestimmten Slot befindet
    showItemTitleAtSlot(slotIndex) {
        // Zuerst prüfen, ob ein Item gefunden wurde
        const item = GameData.inventoryItems.find(item => item.show && item.slotIndex === slotIndex);

        // Nur wenn ein Item gefunden wurde, die Menge abrufen
        const itemQuantity = item ? this.scene.stateManager.getAssetQuantity(this.scene.gameState, item.key) : 0;

        if (item && !item.titleText) {
            let itemLable;
            if (itemQuantity && itemQuantity > 1) {
                itemLable = Math.min(itemQuantity, 99) + " " + (item.titlePlural || item.title);
            } else {
                itemLable = item.title;
            }
            // Text erstellen
            item.titleText = this.scene.add.text(
                item.image.x,
                item.image.y + (item.image.displayHeight / 2) + 4,
                itemLable,
                {
                    fontFamily: 'Courier New',
                    fontSize: '18px',
                    color: '#101010',
                    align: 'center'
                }
            );
            item.titleText.setOrigin(0.5, 0); // Horizontal zentriert, vertikal oben
            this.inventoryPanel.add(item.titleText);
        }
    }

    // Neue Methode: Blendet den Titel eines Items aus, das sich in einem bestimmten Slot befindet
    hideItemTitleAtSlot(slotIndex) {
        // Suche nach einem Item, das diesem Slot zugeordnet ist
        const item = GameData.inventoryItems.find(item => item.show && item.slotIndex === slotIndex);

        if (item && item.titleText) {
            item.titleText.destroy();
            item.titleText = null;
        }
    }

    handleItemClick(slotIndex) {
        // Suche nach einem Item, das diesem Slot zugeordnet ist
        const item = GameData.inventoryItems.find(item => item.show && item.slotIndex === slotIndex);

        if (item && item.key) {
            console.log('Click on Inventory Item: '+item.key);
            let action = this.getActiveAction().name;
            let talkText;

            if (action==='take') {
                talkText = ["Das habe ich bereits."]
            }

            if (action==='talkTo') {
                talkText = ["Damit kann man nicht sprechen."]
            }

            if (action==='view') {
                talkText = item.view;
                if (item.viewSound) {
                    this.scene.soundEffects.play(item.viewSound, this.scene.sophie.x, this.scene.sophie.y-100, {
                        duration: 3000,
                        depth: this.scene.sophie.depth + 1,
                        onComplete: () => {
                        },
                        style: {
                            fontSize: '48px',
                            fill: '#ff6f61',
                            fontFamily: 'Courier New, monospace',
                            stroke: '#000000',
                            strokeThickness: 7
                        }
                    });
                }
            }

            if (action==='use') {
                this.handleUse(item.key, item.title);
            }

            if (talkText) {
                this.scene.controls.disable();
                this.closeBag();
                this.scene.hideAllHoverTexts();
                this.scene.isMonologActive = true;
                this.setActiveAction(0);
                this.scene.showMonolog(talkText);
            }

        }
    }

    toggleBag() {
        // Zustand umschalten
        this.isBagOpen = !this.isBagOpen;

        // Grafik aktualisieren
        this.inventoryBag.setTexture(this.isBagOpen ? 'bag_open' : 'bag_closed');

        // Inventory-Panel ein- oder ausfahren
        this.toggleInventoryPanel();

        // Event auslösen für weitere Aktionen
        this.scene.events.emit('inventoryToggled', this.isBagOpen);

        console.log('Inventartasche ist jetzt ' + (this.isBagOpen ? 'geöffnet' : 'geschlossen'));
    }

    toggleInventoryPanel() {
        // Wenn ein Tween läuft, beenden wir ihn
        if (this.inventoryPanelTween && this.inventoryPanelTween.isPlaying()) {
            this.inventoryPanelTween.stop();
        }

        let viewFactor =  0.128;
        let assetQuantity = this.scene.stateManager.getAssetCount(this.scene.gameState);
        if (assetQuantity>5) {
            viewFactor = 0.233;
        }
        if (assetQuantity>10) {
            viewFactor = 0.345;
        }
        const panelWidth = this.viewport.width * viewFactor;

        // Zielposition basierend auf dem Status der Tasche
        const targetX = this.isBagOpen ? this.viewport.width - panelWidth : this.viewport.width;

        // Tween erstellen und ausführen
        this.inventoryPanelTween = this.scene.tweens.add({
            targets: this.inventoryPanel,
            x: targetX,
            duration: 500, // 500ms für die Animation
            ease: 'Power2'
        });
    }

    closeBag() {
        if (this.isBagOpen) {
            this.toggleBag();
        }
    }

    setActiveAction(index) {
        // Alte aktive Aktion zurücksetzen
        if (this.activeActionIndex !== undefined) {
            const prevButton = this.buttonContainer.list.find(item =>
                item.actionData && item.actionData.name === this.config.actions[this.activeActionIndex].name
            );
            if (prevButton) {
                prevButton.setStyle(this.styles.normal);
            }
        }

        // Neue aktive Aktion setzen
        this.activeActionIndex = index;
        const activeButton = this.buttonContainer.list.find(item =>
            item.actionData && item.actionData.name === this.config.actions[index].name
        );
        if (activeButton) {
            activeButton.setStyle(this.styles.active);
        }

        // Aktionsdaten abrufen
        const action = this.config.actions[index];

        // Aktion auslösen mit den neuen Namen
        this.scene.events.emit('actionChanged', {
            index: index,
            name: action.name,
            displayName: action.displayName
        });

        if (action.name !== 'use') {
            this.hideUsePrompt();
        }

        return action.name;
    }

    getActiveAction() {
        const action = this.config.actions[this.activeActionIndex];
        return {
            index: this.activeActionIndex,
            name: action.name,
            displayName: action.displayName
        };
    }

    disable() {
        Object.values(this.buttons).forEach(button => {
            button.setAlpha(0.5);
            button.disableInteractive();
        });

        // Auch die Tasche deaktivieren
        if (this.inventoryBag) {
            this.inventoryBag.setAlpha(0.5);
            this.inventoryBag.disableInteractive();
        }
    }

    enable() {
        Object.values(this.buttons).forEach(button => {
            button.setAlpha(1);
            button.setInteractive({ useHandCursor: true });
        });

        // Auch die Tasche aktivieren
        if (this.inventoryBag) {
            this.inventoryBag.setAlpha(1);
            this.inventoryBag.setInteractive({ useHandCursor: true });
        }
    }

    show() {
        this.buttonContainer.setVisible(true);
        if (this.inventoryPanel) {
            this.inventoryPanel.setVisible(true);
        }
    }

    hide() {
        this.buttonContainer.setVisible(false);
        if (this.inventoryPanel) {
            this.inventoryPanel.setVisible(false);
        }
    }

    // Methode zum Maskieren der Steuerelemente (wird von BaseScene.updateMask aufgerufen)
    setMask(mask) {
        // Maske auf beide Container anwenden
        this.buttonContainer.setMask(mask);
        if (this.inventoryPanel) {
            this.inventoryPanel.setMask(mask);
        }
    }

    capitalizeFirstLetter(string) {
        if (!string) return string;
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    handle(sceneHandle, objectKey, worldPoint, objectTitle)  {
        console.log('controls.handle');
        if (this.getActiveAction().name === 'use') {
            this.handleUse(objectKey, objectTitle);
            return;
        }


        let skipGenericAction = false;
        let moveSophie = false;


        console.log("Szene: "+ sceneHandle.scene.key +" Action: " + this.getActiveAction().name + " Object: " + objectKey );

        const combinedKey = this.scene.interactiveObjects[objectKey].data.combinedKey;
        let functionString = this.getActiveAction().name + this.capitalizeFirstLetter(combinedKey||objectKey);
        console.log("check: " + functionString);

        this.scene.stateManager.registerInteraction(this.scene.gameState, functionString);

        if (typeof sceneHandle[functionString] === 'function') {
            console.log("call: " + functionString);
            this.closeBag();
            skipGenericAction = sceneHandle[functionString](objectKey, worldPoint);
        }

        if (!skipGenericAction) {

            functionString = this.getActiveAction().name + "Anything";
            console.log("check: " + functionString);

            if (typeof sceneHandle[functionString] === 'function') {
                console.log("call: " + functionString);
                this.closeBag();
                moveSophie = sceneHandle[functionString](objectKey, worldPoint);
            }

        } else {
            console.log("Skip the generic action");
        }

        this.setActiveAction(0);

        return moveSophie;
    }

    updateAssetsTaken() {
        this.positionInventoryItems();
        this.inventoryBag.setTexture('bag_open');

        // Originalskalierung der Tasche speichern
        const originalScale = this.inventoryBag.scale;

        // Tasche animieren
        this.scene.tweens.add({
            targets: this.inventoryBag,
            scale: originalScale * 1.1, // 10% größer
            duration: 300,
            yoyo: true,
            hold: 200,
            onComplete: () => {
                this.inventoryBag.setTexture('bag_closed');
            }
        });

        let viewFactor =  0.128;
        let assetQuantity = this.scene.stateManager.getAssetCount(this.scene.gameState);
        if (assetQuantity>5) {
            viewFactor = 0.233;
        }
        if (assetQuantity>10) {
            viewFactor = 0.345;
        }
        const panelWidth = this.viewport.width * viewFactor;

        // Nur 10% des Panels einblenden
        const peekAmount = panelWidth * 0.55;

        // Originale Position speichern
        const originalX = this.inventoryPanel.x;

        // Panel kurz einblenden und wieder ausblenden
        this.scene.tweens.add({
            targets: this.inventoryPanel,
            x: this.viewport.width - peekAmount,
            duration: 200,
            ease: 'Power2',
            yoyo: true,
            hold: 200,
            onComplete: () => {
                // Panel zur Sicherheit wieder an die Ausgangsposition setzen
                this.inventoryPanel.x = originalX;
            }
        });
    }

    createUsePrompt() {
        // Position und Größe berechnen
        const promptWidth = this.viewport.width * 0.7; // 70% der Canvas-Breite
        const promptX = this.viewport.width / 2;       // Horizontal zentriert
        const promptY = 20;                            // Margin vom oberen Rand
        const padding = 10;                            // Innenabstand für den Text

        // Hintergrund erstellen
        this.usePromptBg = this.scene.add.graphics();
        this.usePromptBg.fillStyle(0x000000, 0.8);    // Schwarzer Hintergrund mit leichter Transparenz
        this.usePromptBg.fillRect(
            promptX - promptWidth/2,                  // Links
            promptY,                                  // Oben
            promptWidth,                              // Breite
            40                                        // Höhe - wird später angepasst
        );
        this.usePromptBg.setVisible(false);           // Initial unsichtbar

        // Text erstellen
        this.usePrompt = this.scene.add.text(
            promptX,
            promptY + padding,
            'Test',
            {
                fontFamily: 'Courier New',
                fontSize: '28px',
                color: '#FFFFFF',                      // Weiße Textfarbe
                align: 'center',
                wordWrap: { width: promptWidth - (padding * 2) }
            }
        );
        this.usePrompt.setOrigin(0.5, 0);              // Horizontal zentriert, vertikal oben
        this.usePrompt.setVisible(false);              // Initial unsichtbar

        // Beide Elemente dem Button-Container hinzufügen für besseres Z-Management
        if (this.buttonContainer) {
            this.buttonContainer.add(this.usePromptBg);
            this.buttonContainer.add(this.usePrompt);
        }
    }

    showUsePrompt(text, itemKey) {
        this.isPromptUseAction = true;
        this.useItemKey = itemKey;

        // Text setzen
        this.usePrompt.setText(text);

        // Hintergrund an die Textgröße anpassen
        const padding = 10;
        const bgHeight = this.usePrompt.height + (padding * 2);
        const bgWidth = this.viewport.width * 0.7;
        const bgX = this.viewport.width / 2 - bgWidth/2;
        const bgY = 20;

        this.usePromptBg.clear();
        this.usePromptBg.fillStyle(0x000000, 0.8);
        this.usePromptBg.fillRect(bgX, bgY, bgWidth, bgHeight);

        // Elemente sichtbar machen
        this.usePromptBg.setVisible(true);
        this.usePrompt.setVisible(true);
    }

    hideUsePrompt() {
        this.isPromptUseAction = false;
        this.useItemKey = null;
        this.usePromptBg.setVisible(false);
        this.usePrompt.setVisible(false);
    }


    handleUse(itemKey, itemTitle, itemQuantity=1) {

        if (this.scene.interactiveObjects[itemKey]
            && this.scene.interactiveObjects[itemKey].data.combinedKey) {
            itemKey = this.scene.interactiveObjects[itemKey].data.combinedKey;
            console.log('combinedKey=' + itemKey);
        }

        if (!this.isPromptUseAction) {

            const functionString = 'use' + this.capitalizeFirstLetter(itemKey);
            console.log("check: " + functionString);

            if (typeof this.scene[functionString] === 'function') {

                this.scene.stateManager.registerInteraction(this.scene.gameState, functionString);

                this.hideUsePrompt();
                this.closeBag();
                this.setActiveAction(0);
                this.scene.hideAllHoverTexts();
                this.scene.isMonologActive = true;
                this.setActiveAction(0);

                console.log("call: " + functionString);
                this.scene[functionString]();
            } else {
                this.showUsePrompt("Benutze " + itemTitle + " mit ...", itemKey);
            }

        } else {
            let comboItemKey = this.useItemKey;

            if (itemKey !==comboItemKey) {
                // es ist eine Combo von zwei verschiedenen Items ausgewählt worden

                this.hideUsePrompt();
                this.closeBag();
                this.setActiveAction(0);
                this.scene.hideAllHoverTexts();
                this.scene.isMonologActive = true;
                this.setActiveAction(0);



                const functionString = 'use' + this.capitalizeFirstLetter(comboItemKey) + "With" + this.capitalizeFirstLetter(itemKey);
                console.log("check: " + functionString);

                this.scene.stateManager.registerInteraction(this.scene.gameState, functionString);

                if (typeof this.scene[functionString] === 'function') {
                    console.log("call: " + functionString);
                    this.scene[functionString]();
                } else {
                    this.scene.showMonolog(["Das kann man so nicht benutzen."]);
                }
            }
        }
    }
}