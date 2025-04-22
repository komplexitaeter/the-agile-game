class MeetingScene extends BaseScene {
    constructor() {
        super({ key: 'MeetingScene' });
        this.managers = [
            {key: 'ManagerA', x:0.34, y:0.57, displayHeight: 0, color: '#ff9e80'}, // Orange-Rot
            {key: 'ManagerB', x:0.43, y:0.534, displayHeight: 0, color: '#80d8ff'}, // Hellblau
            {key: 'ManagerC', x:0.65, y:0.535, displayHeight: 0, color: '#b9f6ca'},  // Mintgrün
        ];

        this.pros = [
            "Ich denke, wir müssen das ganz anders angehen.",
            "Wir sollten hier mal etwas Neues ausprobieren.",
            "Wir dürfen nicht die Kunden aus dem Auge verlieren.",
            "Der Markt zwingt uns aber jetzt zu einer Lösung.",
            "Innovation ist jetzt das Wichtigste überhaupt.",
            "Lasst uns hier bitte ganz pragmatisch sein.",
            "Du musst mit euren Leuten halt mal mehr Druck machen.",
            "Lasst uns doch hier bitte mal das Silodenken weglassen.",
            "Wir sollten hier mal die Experten mit an Bord holen.",
            "Jemand muss das Thema mal richtig aufgleisen.",
            "Die Mannschaft muss nur mal richtig abgeholt werden.",
            "Wollen wir uns mal auf das Wesentliche fokussieren?",
            "Ich würde gerne mal einen konkreten Vorschlag machen.",
            "Wir sollen uns besser an unserer Prozesse halten.",
            "Da sollten wir auch mal vom Prozess abweichen.",
            "Wollen wir es nicht ein mal richtig angehen?"
        ];

        this.cons = [
            "Vorher sollten wir erstmal einen genauen Plan haben.",
            "Das müssten wir erstmal mit allen im Detail besprechen.",
            "Das klingt nach sehr viel Aufwand.",
            "Sowas Ähnliches haben wir schon mal versucht.",
            "Das machen wir doch schon die ganze Zeit.",
            "Das ist schnell gesagt, aber im Detail geht das so nicht.",
            "Dazu müssen wir uns erstmal mit den Juristen abstimmen.",
            "Das ist mir viel zu unkonkret.",
            "Dafür müssten erstmal Rollen und Verantwortung klar sein.",
            "Das klingt ja fast wie Bäume umarmen.",
            "Wenn das so ist, muss ich es dem Vorstand melden.",
            "Das bringt uns keinen Schritt voran.",
            "Das ist gegen jeden Verstand und jede Regel.",
            "Das haben wir so noch nie gemacht.",
            "Das dauert mir alles viel zu lange."
        ];
    }

    create() {
        super.create();
        this.controls.show();

        this.dialogSwitcher = new DialogSwitcher(this);

        this.chair = this.add.image(this.viewport.width / 2, this.viewport.height / 2
            , 'meetingChair')
        this.chair.setOrigin(0.5, 0.5);
        this.chair.setDepth(this.sophie.depth + 2);

        this.chair = this.add.image(this.viewport.width / 2, this.viewport.height / 2
            , 'meetingManagers')
        this.chair.setOrigin(0.5, 0.5);
        this.chair.setDepth(this.bg.depth + 20);

        // Manager-Stile einrichten
        this.setupManagerStyles();

        if (this.gameState.progress.gummyBearsTaken) {
            this.interactiveObjects['meetingGummyBears'].gameObject.setVisible(false);
        }

        if (!(this.gameState.progress.businessCardsOnTable > 0)) {
            this.interactiveObjects['meetingBusinessCards'].gameObject.setVisible(false);
        }

        // Sofort den Background-Talk starten, BEVOR Sophies Intro beginnt
        this.startBackgroundTalk();

        this.sophie.x = this.viewport.width * 0.85;
        this.sophie.y = this.viewport.height * this.sceneConfig.sophieBottomPosition;
        this.sophie.play('walk_left');

        // Jetzt erst das Intro starten (der Background-Talk läuft bereits)
        this.introSophie();
    }

    // Manager-Stile einrichten
    setupManagerStyles() {
        // Die Grundeinstellungen aus dem Standard-Stil kopieren
        const baseStyle = { ...this.monologManager.defaultStyle };

        // Stil für Manager in den MonologManager eintragen
        this.monologManager.speakerStyles['manager'] = {
            ...baseStyle,
            backgroundColor: '#333333' // Dunkler Hintergrund für alle Manager-Texte
        };
    }

    startBackgroundTalk() {
        if (this.playBackgroundTalk) {
            return;
        }

        // Flag zum Verfolgen, ob der Hintergrund-Talk aktiv ist
        this.playBackgroundTalk = true;

        // Sicherheitshalber vorherigen Timer anhalten
        if (this.backgroundTalkTimer) {
            this.backgroundTalkTimer.remove();
            this.backgroundTalkTimer = null;
        }

        // Aktuellen Manager-Index initialisieren
        this.currentManagerIndex = Phaser.Math.Between(0, this.managers.length - 1);

        // Letzten Manager-Index speichern, um Wiederholungen zu vermeiden
        this.lastManagerIndex = this.currentManagerIndex;

        // Flag, ob wir pro oder con verwenden sollen
        this.useProArgument = true;

        // Bereits verwendete Indizes für Texte, um Wiederholungen zu vermeiden
        this.usedProIndices = [];
        this.usedConIndices = [];

        // Starte mit dem ersten Gesprächsbeitrag
        this.playNextTalk();
    }

    playNextTalk() {
        if (!this.playBackgroundTalk) return;

        // Zum nächsten Manager wechseln
        this.moveToNextManager();

        // Aktuelle Manager-Position abrufen
        const manager = this.managers[this.currentManagerIndex];

        // Position im Viewport berechnen
        const managerX = this.viewport.width * manager.x;
        // Vertikaler Offset für die Manager-Texte (nach oben verschieben)
        const managerY = this.viewport.height * manager.y - 80; // 80 Pixel nach oben verschoben

        // Etwas Variation in der Position des Sounds, aber weniger als zuvor
        const offsetX = Phaser.Math.Between(-10, 10);
        const offsetY = Phaser.Math.Between(-5, 5);

        // Text auswählen (entweder pro oder con)
        let talkText;

        if (this.useProArgument) {
            // Pro-Argument auswählen und sicherstellen, dass es nicht wiederholt wird
            let textIndex;

            if (this.usedProIndices.length >= this.pros.length) {
                // Alle wurden verwendet, Index zurücksetzen
                this.usedProIndices = [];
            }

            do {
                textIndex = Phaser.Math.Between(0, this.pros.length - 1);
            } while (this.usedProIndices.includes(textIndex));

            this.usedProIndices.push(textIndex);
            talkText = this.pros[textIndex];
        } else {
            // Con-Argument auswählen
            let textIndex;

            if (this.usedConIndices.length >= this.cons.length) {
                // Alle wurden verwendet, Index zurücksetzen
                this.usedConIndices = [];
            }

            do {
                textIndex = Phaser.Math.Between(0, this.cons.length - 1);
            } while (this.usedConIndices.includes(textIndex));

            this.usedConIndices.push(textIndex);
            talkText = this.cons[textIndex];
        }

        // Konstante Anzeigedauer für jeden Text
        const displayDuration = 2600; // 2 Sekunden

        // Feste Schriftgröße für konsistentere Darstellung
        const fontSize = 30;

        // Bestimme die Farbe direkt aus dem Manager-Objekt
        const managerColor = manager.color;

        // Text-Objekt erstellen mit der Manager-Farbe
        const textStyle = {
            fontSize: `${fontSize}px`,
            fill: managerColor,
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000',
                blur: 5,
                fill: true
            }
        };

        // Text direkt anzeigen
        const text = this.add.text(managerX + offsetX, managerY + offsetY, talkText, textStyle);
        text.setOrigin(0.5);
        text.setDepth(1000);

        // Speichern des aktuellen Textes, damit er in stopBackgroundTalk() sofort entfernt werden kann
        this.currentBackgroundText = text;

        // Timer für nächsten Text setzen (genau nach displayDuration)
        this.backgroundTalkTimer = this.time.delayedCall(displayDuration, () => {
            // Text mit einem kurzen Fade ausblenden
            this.tweens.add({
                targets: text,
                alpha: 0,
                duration: 300,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    text.destroy();
                    this.currentBackgroundText = null;

                    // Pro und Con-Argumente abwechseln
                    this.useProArgument = !this.useProArgument;

                    // Direkt zum nächsten Text
                    if (this.playBackgroundTalk) {
                        this.playNextTalk();
                    }
                }
            });
        });
    }

    moveToNextManager() {
        // Letzten Manager speichern
        this.lastManagerIndex = this.currentManagerIndex;

        // Sicherstellen, dass wir keinen Manager zweimal hintereinander verwenden
        let attemptsLeft = 10; // Begrenzung der Versuche
        let newIndex;

        do {
            newIndex = Phaser.Math.Between(0, this.managers.length - 1);
            attemptsLeft--;
        } while (newIndex === this.currentManagerIndex && attemptsLeft > 0);

        // Neuen Manager setzen
        this.currentManagerIndex = newIndex;
    }

    stopBackgroundTalk() {
        this.playBackgroundTalk = false;

        // Aktuellen Timer anhalten
        if (this.backgroundTalkTimer) {
            this.backgroundTalkTimer.remove();
            this.backgroundTalkTimer = null;
        }

        // Aktuellen Text sofort entfernen, falls vorhanden
        if (this.currentBackgroundText) {
            this.tweens.killTweensOf(this.currentBackgroundText);
            this.currentBackgroundText.destroy();
            this.currentBackgroundText = null;
        }

        // Alle Text-Elemente entfernen, die zur Managerklasse gehören
        // Wir filtern nach den Manager-Farben
        const managerColors = this.managers.map(manager => manager.color);

        const texts = this.children.list.filter(child =>
            child.type === 'Text' &&
            child.style &&
            managerColors.includes(child.style.fill)
        );

        texts.forEach(text => {
            this.tweens.killTweensOf(text);
            text.destroy();
        });
    }

    introSophie() {
        this.focusInteraction();

        this.showMonolog(["Das Meeting ist in vollem Gange.", "Ich setze mich besser hin."], ()=>{
            this.focusInteraction();
            this.tweens.add({
                targets: this.sophie,
                x: this.viewport.width * 0.503,
                duration: 1200,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    this.sophie.play('back');
                    this.tweens.add({
                        targets: this.sophie,
                        y: this.viewport.height * 1.13,
                        duration: 1200,
                        ease: 'Sine.easyInOut',
                        onComplete: () => {
                            if (this.gameState.progress.managerAttention) {
                                this.stopBackgroundTalk();
                            }
                            this.backToDefault();
                        }
                    });
                }
            });
        });
    }

    useMeetingExit() {
        this.focusInteraction();
        this.tweens.add({
            targets: this.sophie,
            y: this.viewport.height * this.sceneConfig.sophieBottomPosition,
            duration: 900,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.startBackgroundTalk();
                this.sophie.play('walk_right');
                this.tweens.add({
                    targets: this.sophie,
                    x: this.viewport.width * 0.85,
                    duration: 1100,
                    ease: 'Sine.easyInOut',
                    onComplete: () => {
                        this.tweens.add({
                            targets: this.sophie,
                            x: this.viewport.width * 0.9,
                            y: this.viewport.height * 0.95,
                            duration: 300,
                            ease: 'Sine.easyInOut',
                            onComplete: () => {
                                this.sophie.play('back');
                                this.tweens.add({
                                    targets: this.sophie,
                                    x: this.viewport.width * 0.835,
                                    y: this.viewport.height * 0.73,
                                    scale: this.sceneConfig.sophieScale * 0.7,
                                    duration: 1100,
                                    ease: 'Sine.easyInOut',
                                    onComplete: () => {
                                        this.tweens.add({
                                            targets: this.sophie,
                                            alpha: 0.3,
                                            duration: 400,
                                            onComplete: () => {
                                                this.stopBackgroundTalk();
                                                this.changeScene('LoungeScene');
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    takeMeetingCoke() {
        const gameState = this.gameState;
        if (this.stateManager.hasAsset(gameState,'invCokeClosed')
            || this.stateManager.hasAsset(gameState,'invCokeOpen')) {
            this.showMonolog(["Ich habe schon genug Cola bei mir.", "Ich will an meinem ersten Tag nicht unangenehm auffallen."], ()=>{
                this.backToDefault();
            });
            return true;
        }
    }

    takeMeetingGummyBears() {
        this.updateGameState({
            progress: {
                gummyBearsTaken: true
            }
        });
    }

    talkToManagers() {
        this.focusInteraction();
        let switcherOptions = [];

        // Option 1
        switcherOptions.push({
            text: "Ich bin Sophie Plaice und ich will die Company agil machen.",
            callback: () => {
                this.subTalkOptionReject("Ich bin Sophie Plaice und ich will die Company agil machen.");
            }
        });

        // Option 2
        switcherOptions.push({
            text: "Lasst uns bitte klären, welches Problem wir hier lösen wollen?",
            callback: () => {
                this.subTalkOptionReject("Lasst uns erstmal klären, welches Problem wir hier lösen wollen?");
            }
        });

        // Option 3
        switcherOptions.push({
            text: "Ich habe das Gefühl, dieses Meeting dreht sich im Kreis.",
            callback: () => {
                this.subTalkOptionAccept("Ich habe das Gefühl, dieses Meeting dreht sich im Kreis.");
            }
        });

        if (this.stateManager.hasAsset(this.gameState,'invCokeBomb')
        &&  this.stateManager.hasAsset(this.gameState,'invBottleOpener')) {
            switcherOptions.push({
                text: "Ich habe eine disruptive Idee!",
                callback: () => {
                    this.subExplodeCokeBomb();
                }
            });
        } else {
            const randomProsIndex = Phaser.Math.Between(0, this.pros.length - 1);
            const randomProsText = this.pros[randomProsIndex];
            switcherOptions.push({
                text: randomProsText,
                callback: () => {
                    this.subTalkOptionReject(randomProsText);
                }
            });
        }

        this.dialogSwitcher.showOptions(switcherOptions);
        return true;
    }

    subTalkOptionReject(text) {
        this.showMonolog([text], () => {
            if (this.gameState.progress.managerAttention) {
                // Zufälligen Manager auswählen
                const randomManager = this.getRandomManager();

                // Position des Managers berechnen
                const managerX = this.viewport.width * randomManager.x;
                const managerY = this.viewport.height * randomManager.y;

                // Zufällige Zeile aus cons auswählen
                const randomConsIndex = Phaser.Math.Between(0, this.cons.length - 1);
                const randomConsText = this.cons[randomConsIndex];

                // Manager-Stil definieren
                const managerStyle = {
                    ...this.monologManager.speakerStyles['manager'],
                    fill: randomManager.color // Manager-spezifische Farbe
                };

                // Dummy-Sprecher erstellen
                const dummySpeaker = this.add.sprite(managerX, managerY, 'pixel');
                dummySpeaker.setAlpha(0); // Unsichtbar machen
                dummySpeaker.key = randomManager.key;
                dummySpeaker.displayHeight = 100;

                // Manager antworten lassen
                this.monologManager.show({
                    lines: [randomConsText],
                    speaker: dummySpeaker,
                    speakerType: 'manager',
                    style: managerStyle,
                    onComplete: () => {
                        dummySpeaker.destroy();
                        this.backToDefault();
                    }
                });
            } else {
                this.backToDefault();
            }
        });
    }

    subTalkOptionAccept(text) {
        this.showMonolog([text], () => {
            if (this.gameState.progress.managerAttention) {
                // Ersten Manager auswählen (ManagerA)
                const managerA = this.getRandomManager();

                // Position des ersten Managers berechnen
                const managerAX = this.viewport.width * managerA.x;
                const managerAY = this.viewport.height * managerA.y;

                // Stil für ManagerA
                const managerAStyle = {
                    ...this.monologManager.speakerStyles['manager'],
                    fill: managerA.color
                };

                // Dummy-Sprecher für ManagerA
                const dummySpeakerA = this.add.sprite(managerAX, managerAY, 'pixel');
                dummySpeakerA.setAlpha(0);
                dummySpeakerA.key = managerA.key;
                dummySpeakerA.displayHeight = 100;

                // ManagerA spricht
                this.monologManager.show({
                    lines: ["Das Gefühl habe ich auch."],
                    speaker: dummySpeakerA,
                    speakerType: 'manager',
                    style: managerAStyle,
                    onComplete: () => {
                        dummySpeakerA.destroy();

                        // Zweiten, anderen Manager wählen (ManagerB)
                        let managerB;
                        do {
                            managerB = this.getRandomManager();
                        } while (managerB === managerA);

                        const managerBX = this.viewport.width * managerB.x;
                        const managerBY = this.viewport.height * managerB.y;

                        // Stil für ManagerB
                        const managerBStyle = {
                            ...this.monologManager.speakerStyles['manager'],
                            fill: managerB.color
                        };

                        // Dummy-Sprecher für ManagerB
                        const dummySpeakerB = this.add.sprite(managerBX, managerBY, 'pixel');
                        dummySpeakerB.setAlpha(0);
                        dummySpeakerB.key = managerB.key;
                        dummySpeakerB.displayHeight = 100;

                        // ManagerB spricht
                        this.monologManager.show({
                            lines: ["Was schlägst du vor?"],
                            speaker: dummySpeakerB,
                            speakerType: 'manager',
                            style: managerBStyle,
                            onComplete: () => {
                                dummySpeakerB.destroy();

                                // Sophie antwortet mit ihrem Vorschlag
                                this.showMonolog([
                                    "Eine guter Check-In ins Meeting kann Wunder bewirken.",
                                    "Jeder stellt sich einmal kurz vor und beantwortet diese Frage in einem Satz:",
                                    "Warum bin ich hier und in welcher Stimmung?"
                                ], () => {
                                    // Dritten, anderen Manager wählen (ManagerC)
                                    let managerC;
                                    do {
                                        managerC = this.getRandomManager();
                                    } while (managerC === managerA || managerC === managerB);

                                    const managerCX = this.viewport.width * managerC.x;
                                    const managerCY = this.viewport.height * managerC.y;

                                    // Stil für ManagerC
                                    const managerCStyle = {
                                        ...this.monologManager.speakerStyles['manager'],
                                        fill: managerC.color
                                    };

                                    // Dummy-Sprecher für ManagerC
                                    const dummySpeakerC = this.add.sprite(managerCX, managerCY, 'pixel');
                                    dummySpeakerC.setAlpha(0);
                                    dummySpeakerC.key = managerC.key;
                                    dummySpeakerC.displayHeight = 100;

                                    // ManagerC spricht und beendet das Gespräch
                                    this.monologManager.show({
                                        lines: [
                                            "Ein sehr guter Vorschlag.",
                                            "Aber das können wir noch effizienter machen.",
                                            "Hier, unsere Visitenkarten."
                                        ],
                                        speaker: dummySpeakerC,
                                        speakerType: 'manager',
                                        style: managerCStyle,
                                        onComplete: () => {

                                            this.focusInteraction();

                                            dummySpeakerC.destroy();

                                            this.updateGameState({
                                                progress: {
                                                    businessCardsOnTable: this.gameState.progress.businessCardsOnTable + 3
                                                }
                                            });

                                            this.animateBusinessCards(()=>{
                                                this.backToDefault();
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
            } else {
                this.backToDefault();
            }
        });
    }

    animateBusinessCards(onComplete) {
        // Zielposition für alle Karten
        const targetX = this.viewport.width * 0.52;
        const targetY = this.viewport.height * 0.69;
        const targetScale = 1;

        // Array zum Sammeln aller Karten
        const allCards = [];

        // Karte A erstellen und animieren
        const cardA = this.add.image(
            this.viewport.width * 0.38,  // Start X
            this.viewport.height * 0.68, // Start Y
            'meetingBusinessCardA'
        )
            .setOrigin(0.5, 0.5)
            .setDepth(19)
            .setScale(1);

        allCards.push(cardA);

        // Karte B erstellen (verzögert)
        this.time.delayedCall(300, () => {
            const cardB = this.add.image(
                this.viewport.width * 0.44,  // Start X
                this.viewport.height * 0.554, // Start Y
                'meetingBusinessCardB'
            )
                .setOrigin(0.5, 0.5)
                .setDepth(19)
                .setScale(0.4);

            allCards.push(cardB);

            // Karte B animieren
            this.tweens.add({
                targets: cardB,
                x: targetX,
                y: targetY,
                scale: targetScale,
                duration: 600,
                ease: 'Sine.easeOut'
            });
        });

        // Karte C erstellen (stärker verzögert)
        this.time.delayedCall(600, () => {
            const cardC = this.add.image(
                this.viewport.width * 0.61,  // Start X
                this.viewport.height * 0.63, // Start Y
                'meetingBusinessCardC'
            )
                .setOrigin(0.5, 0.5)
                .setDepth(19)
                .setScale(0.8);

            allCards.push(cardC);

            // Karte C animieren - letzte Animation mit finalem Callback
            this.tweens.add({
                targets: cardC,
                x: targetX,
                y: targetY,
                scale: targetScale,
                duration: 600,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    // Warte einen kurzen Moment, damit der Betrachter die Karten sehen kann
                    this.time.delayedCall(300, () => {
                        // Interaktives Objekt sichtbar machen
                        this.interactiveObjects['meetingBusinessCards'].gameObject.setVisible(true);

                        // Nun alle Karten löschen
                        allCards.forEach(card => card.destroy());

                        // Callback aufrufen, wenn vorhanden
                        if (onComplete) onComplete();
                    });
                }
            });
        });

        // Karte A animieren (startet sofort)
        this.tweens.add({
            targets: cardA,
            x: targetX,
            y: targetY,
            scale: targetScale,
            duration: 600,
            ease: 'Sine.easeOut'
        });
    }

    subExplodeCokeBomb() {
        this.focusInteraction();
        this.stopBackgroundTalk();

        this.showMonolog(["Ich habe eine disruptive Idee!"], () => {
            // Ersten Manager für die erste Antwort wählen
            const firstManager = this.getRandomManager();

            // Position des Managers berechnen
            const managerX = this.viewport.width * firstManager.x;
            const managerY = this.viewport.height * firstManager.y;

            // Eigenen Stil für den Manager-Text definieren
            const managerStyle = {
                ...this.monologManager.speakerStyles['manager'],
                fill: firstManager.color // Manager-spezifische Farbe
            };

            // Wir erstellen einen Dummy-Sprecher an der Position des Managers
            const dummySpeaker = this.add.sprite(managerX, managerY, 'pixel');
            dummySpeaker.setAlpha(0); // Unsichtbar machen
            dummySpeaker.key = firstManager.key; // Key für Styling
            dummySpeaker.displayHeight = 100; // Damit der Text richtig positioniert wird

            // Text über dem ersten Manager anzeigen
            this.monologManager.show({
                lines: ["Das klingt nach einem guten Vorschlag."],
                speaker: dummySpeaker,
                speakerType: 'manager',
                onComplete: () => {
                    // Dummy-Sprecher entfernen
                    dummySpeaker.destroy();

                    // Zweiten, anderen Manager wählen
                    let secondManager;
                    do {
                        secondManager = this.getRandomManager();
                    } while (secondManager === firstManager);

                    const manager2X = this.viewport.width * secondManager.x;
                    const manager2Y = this.viewport.height * secondManager.y;

                    // Manager 2 Stil
                    const manager2Style = {
                        ...this.monologManager.speakerStyles['manager'],
                        fill: secondManager.color
                    };

                    const dummySpeaker2 = this.add.sprite(manager2X, manager2Y, 'pixel');
                    dummySpeaker2.setAlpha(0);
                    dummySpeaker2.key = secondManager.key;
                    dummySpeaker2.displayHeight = 100;

                    // Zweiter Manager spricht
                    this.monologManager.show({
                        lines: ["Lass uns an deinen Gedanken teilhaben."],
                        speaker: dummySpeaker2,
                        speakerType: 'manager',
                        style: manager2Style,
                        onComplete: () => {
                            dummySpeaker2.destroy();

                            // Sophie antwortet
                            this.showMonolog(["Ich habe diese Cola-Bombe und ich werde sie benutzen!"], () => {
                                // Hier Animation der Explosion einfügen
                                this.playCokeBombAnimation(() => {
                                    // Dritten Manager für die Reaktion wählen
                                    let thirdManager;
                                    do {
                                        thirdManager = this.getRandomManager();
                                    } while (thirdManager === firstManager || thirdManager === secondManager);

                                    const manager3X = this.viewport.width * thirdManager.x;
                                    const manager3Y = this.viewport.height * thirdManager.y;

                                    // Manager 3 Stil
                                    const manager3Style = {
                                        ...this.monologManager.speakerStyles['manager'],
                                        fill: thirdManager.color
                                    };

                                    const dummySpeaker3 = this.add.sprite(manager3X, manager3Y, 'pixel');
                                    dummySpeaker3.setAlpha(0);
                                    dummySpeaker3.key = thirdManager.key;
                                    dummySpeaker3.displayHeight = 100;

                                    this.updateGameState({
                                        progress: {
                                            managerAttention: true
                                        }
                                    });

                                    this.stateManager.removeAsset(this.gameState, 'invCokeBomb', 1);
                                    this.stateManager.addAsset(this.gameState, 'invCokeEmpty', 1);
                                    this.controls.updateAssetsTaken();

                                    // Dritter Manager reagiert auf die Explosion
                                    this.monologManager.show({
                                        lines: ["Genial!", "Jetzt hast du unsere volle Aufmerksamkeit!"],
                                        speaker: dummySpeaker3,
                                        speakerType: 'manager',
                                        style: manager3Style,
                                        onComplete: () => {
                                            dummySpeaker3.destroy();
                                            this.talkToManagers();
                                        }
                                    });
                                });
                            });
                        }
                    });
                },
                style: managerStyle
            });
        });
    }

    // Funktion für die Animation der Cola-Bombe
    playCokeBombAnimation(onComplete) {
        const centerX = this.viewport.width / 2;
        const centerY = this.viewport.height / 2;

        // Explosionseffekt als Text
        const explosionText = this.add.text(centerX, centerY, "SPLASH!", {
            fontSize: '60px',
            fontFamily: 'Arial Black, sans-serif',
            fill: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Explosion animieren
        this.tweens.add({
            targets: explosionText,
            scale: 2,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                explosionText.destroy();

                // Callback ausführen
                if (onComplete) onComplete();
            }
        });

        // Optional: Soundeffekt abspielen
        if (this.soundEffects) {
            this.soundEffects.play("SPLASH!", centerX, centerY, {
                duration: 1000,
                depth: 10000,
                style: {
                    fontSize: '48px',
                    fill: '#ff0000',
                    fontFamily: 'Impact, sans-serif',
                    stroke: '#ffffff',
                    strokeThickness: 8
                }
            });
        }
    }

    getRandomManager() {
        // Zufälliger Index zwischen 0 und der Länge des Arrays - 1
        const randomIndex = Phaser.Math.Between(0, this.managers.length - 1);
        return this.managers[randomIndex];
    }

    useInvCokeBombWithManagers() {
        this.useManagersWithInvCokeBomb();
    }

    useManagersWithInvCokeBomb() {
        this.focusInteraction();
        if (this.stateManager.hasAsset(this.gameState,'invBottleOpener')) {
            this.subExplodeCokeBomb();
        } else {
            this.showMonolog(["Ich habe nichts, um die Flasche zu öffnen."], ()=>{
               this.backToDefault();
            });
        }
    }

    useInvBottleOpenerWithInvCokeBomb() {
        this.subExplodeCokeBomb();
    }

    useInvCokeBombWithInvBottleOpener() {
        this.subExplodeCokeBomb();
    }

    takeMeetingBusinessCards() {
        this.stateManager.addAsset(this.gameState, 'invBusinessCards', this.gameState.progress.businessCardsOnTable);
        this.controls.updateAssetsTaken();
        this.interactiveObjects['meetingBusinessCards'].gameObject.setVisible(false);
        this.updateGameState({
            progress: {
                businessCardsOnTable: 0
            }
        });

        this.time.delayedCall(400, () => {
            this.backToDefault();
        });

        return true;
    }

    shutdown() {
        // Stellen wir sicher, dass der Background-Talk beim Szenenwechsel gestoppt wird
        this.stopBackgroundTalk();

        // Rest des Shutdowns von der Basisklasse ausführen
        super.shutdown();
    }
}