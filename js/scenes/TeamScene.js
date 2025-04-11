class TeamScene extends BaseScene {
    constructor() {
        super({ key: 'TeamScene' });
        this.devs = [
            {key: 'devA', x:0.125, y:0.55},
            {key: 'devB', x:0.215, y:0.268},
            {key: 'devC', x:0.465, y:0.51},
            {key: 'devD', x:0.545, y:0.34},
            {key: 'devE', x:0.62, y:0.555},
            {key: 'devF', x:0.77, y:0.265},
            {key: 'devG', x:0.9, y:0.56},
        ];
    }
    create() {
        super.create();
        this.controls.show();

        this.dialogSwitcher = new DialogSwitcher(this);

        this.front = this.add.image(this.viewport.width / 2, this.viewport.height / 2
            , 'teamFront')
        this.front.setOrigin(0.5, 0.5);
        this.front.setDepth(this.sophie.depth + 1);
        this.front.setVisible(false);

        if (this.gameState.progress.whiteBoardPainted) {
            this.wb = this.add.image(this.viewport.width / 2, this.viewport.height / 2
                , 'teamWB100')
            this.wb.setOrigin(0.5, 0.5);
            this.wb.setDepth(this.bg.depth + 1);
            this.interactiveObjects['teamWhiteBoard'].gameObject.setVisible(true);
        } else {
            this.interactiveObjects['teamWhiteBoard'].gameObject.setVisible(false);
        }

        this.story1 = this.createStoryCard(0.39, 0.27, 0.03, 0.03,
            "Als Nutzer möchte ich die Software starten können",
            0xff0000);

        this.story2 = this.createStoryCard(0.45, 0.285, 0.03, 0.03,
            "Als Entwickler möchte ich Bugs ignorieren können",
            0x0000ff);

        this.story3 = this.createStoryCard(0.41, 0.35, 0.03, 0.03,
            "Als Team-Mitglied möchte ich früh gehen können",
            0x00ff00);

        if (!this.gameState.progress.ticketsOnBoard) {
            this.story1.setVisible(false);
            this.story2.setVisible(false);
            this.story3.setVisible(false);
        }

        this.scrumGuide = this.add.image(this.viewport.width * 0.064, this.viewport.height * 0.916
            , 'teamScrumGuide')
        this.scrumGuide.setOrigin(0.5, 0.5);
        this.scrumGuide.setDepth(this.bg.depth + 1);
        if (!this.gameState.progress.scrumGuideUsed) {
            this.scrumGuide.setVisible(false);
        }

        this.sophie.x = this.viewport.width * 0.78;

        this.backToDefault();
    }

    rest() {
        this.updateGameState({
            progress: {
                ticketsOnBoard: false,
                pillarsFulfilled: 2
            }
        });

        this.stateManager.addAsset(this.gameState, 'invBusinessCards', 3);
        this.stateManager.addAsset(this.gameState, 'invMagnet', 3);
    }

    createStoryCard(x, y, width, height, text, color) {
        // Container erstellen, der alle Elemente enthalten wird
        const container = this.add.container(
            this.viewport.width * x,
            this.viewport.height * y
        );

        // Tiefe des Containers setzen
        container.setDepth(this.sophie.depth - 2);

        // 1. Karte (Rechteck) erstellen
        const card = this.add.rectangle(
            0, 0, // Position relativ zum Container (0,0 = Zentrum des Containers)
            this.viewport.width * width,
            this.viewport.height * height
        );

        // Stil der Karte
        card.setStrokeStyle(1, color, 1);
        card.setFillStyle(color, 0.6);

        // 2. Text erstellen
        const storyText = this.add.text(
            0, 0, // Position relativ zum Container
            text,
            {
                fontSize: '4px',
                fontFamily: 'Arial',
                color: '#000000',
                align: 'center',
                wordWrap: { width: this.viewport.width * width - 10 }
            }
        );

        // Text zentrieren
        storyText.setOrigin(0.5, 0.5);

        // 3. Magnet (Kreis) erstellen
        const magnet = this.add.circle(
            0,
            0 - this.viewport.height * height * 0.55,
            this.viewport.width * 0.004, // Radius
            0x666666 // Graue Farbe
        );

        // Alle Elemente zum Container hinzufügen
        container.add([card, storyText, magnet]);

        // Container zurückgeben
        return container;
    }


    getDevByKey(key) {
        const dev = this.devs.find(dev => dev.key === key);
        return dev || null;
    }

    getRandomDev() {
        const randomIndex = Math.floor(Math.random() * this.devs.length);
        return this.devs[randomIndex];
    }


    useTeamExit() {
        this.focusInteraction();
        this.moveSophie({x: this.viewport.width, y:this.sophie.y}, ()=>{
            this.changeScene('BasementScene', 'teamRoom');
        });
    }

    talkToDevs() {
        this.focusInteraction();
        this.moveSophie({x:this.viewport.width*0.3, y:this.sophie.y}, ()=>{
            if (this.gameState.progress.lightHouseOrderAccepted) {
                if (this.gameState.progress.teamMotivated) {
                    this.checkTheThreePillars();
                } else {
                    this.motivateTeam();
                }
            } else {
                this.convinceTeam();
            }
        },'walk_right', true);
        return true;
    }

    convinceTeam() {
        let switcherOptions = [];
        switcherOptions.push({
            text: "Ich bin Sophie Plaice und ich will dieses Team agil machen.",
            callback: () => {
                this.convinceByArguments();
            }
        });
        if (this.gameState.progress.lightHouseProjectGiven) {
            switcherOptions.push({
                text: "Ich bin V.P. of Agile und ich habe den Auftrag von ganz oben, hier Scrum einzuführen.",
                callback: () => {
                    this.convinceByOrder();
                }
            });
        }
        switcherOptions.push({
            text: "Ich bin Agile Coachin. Darf ich euch helfen?",
            callback: () => {
                this.convinceByOffer();
            }
        });
        this.dialogSwitcher.showOptions(switcherOptions);
    }

    convinceByArguments() {
        this.showMonolog(["Ich bin Sophie Plaice und ich will dieses Team agil machen."],()=>{
            this.showCharacterMonolog(this.getRandomDev(), ["Das haben schon viele gesagt."],()=>{
                this.showCharacterMonolog(this.getRandomDev(), ["Wir haben wirksame Techniken etabliert das zu verhindern."],()=>{
                    this.showCharacterMonolog(this.getRandomDev(), ["Zum Beispiel diese hier ..."],()=>{
                        this.showCharacterMonolog(this.getRandomDev(), ["Wenn der CEO die Veränderung nicht mitträgt, machen wir hier erstmal gar nichts."],()=>{
                            this.backToDefault();
                        });
                    });
                });
            });
        });
    }

    convinceByOrder() {
            this.showMonolog(["Ich bin V.P. of Agile und ich habe den Auftrag von ganz oben, hier Scrum einzuführen."],()=>{
                this.showCharacterMonolog(this.getRandomDev(), ["Ok. Herzlichen Glückwunsch!"],()=>{
                    this.showCharacterMonolog(this.getRandomDev(), ["Aber ohne unsere Motivation als Team wirs du nichts bewirken können."],()=>{
                        this.showCharacterMonolog(this.getRandomDev(), ["Also, motivier uns."],()=>{
                            this.updateGameState({
                                progress: {
                                    lightHouseOrderAccepted: true
                                }
                            });
                            this.motivateTeam();
                        });
                    });
                });
            });
    }

    convinceByOffer() {
        this.showMonolog(["Ich bin Agile Coachin. Darf ich euch helfen?"],()=>{
            this.showCharacterMonolog(this.getRandomDev(), ["Ja na klar."],()=>{
                this.showCharacterMonolog(this.getRandomDev(), ["Wir haben hier einen wichtigen Arbeitskodex."],()=>{
                    this.showCharacterMonolog(this.getRandomDev(), ["DO LESS WORKS BEST!"],()=>{
                        this.showCharacterMonolog(this.getRandomDev(), ["Hilf uns, den zur dominanten Unternehmenskultur zu machen."],()=>{
                            this.showCharacterMonolog(this.getRandomDev(), ["Dann haben wir hier auch deutlich weniger Stress."],()=>{
                                this.showMonolog(["Äh. Ok?"], ()=>{
                                   this.backToDefault();
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    motivateTeam() {
        let switcherOptions = [];

        // Liste aller möglichen Motivationstexte
        const motivationTexts = [
            "Tägliche Stand-up Meetings bedeuten Pünktlichkeit und aktive Teilnahme.",
            "Sprint Plannings ermöglichen detaillierte Aufgabenplanung und Teamwork.",
            "Story Points zwingen zur ehrlichen Einschätzung des Arbeitsaufwands.",
            "Burn-down Charts machen mangelnden Fortschritt für alle sichtbar.",
            "Sprint Reviews bedeuten regelmäßige Präsentationen der erledigten Arbeit.",
            "Retrospektiven fordern ständige Prozessverbesserung statt gemütlichen Stillstand.",
            "Selbstorganisierte Teams tragen mehr Verantwortung für Erfolg und Misserfolg.",
            "Transparenz macht es unmöglich, Aufgaben unauffällig zu ignorieren.",
            "Kontinuierliche Verbesserung bedeutet, dass ihr immer mehr Arbeit schaffen werdet.",
            "Sprint-Verpflichtungen erhöhen die Verbindlichkeit, eigene Zusagen einzuhalten.",
            "Velocity-Messung macht die Arbeitsgeschwindigkeit messbar und transparent.",
            "Cross-funktionale Teams bedeuten keine bequeme Spezialisierung auf nur eine Aufgabe.",
            "Der Scrum Master als 'Hindernis-Beseitiger' lässt keine Ausreden für Verzögerungen gelten."
        ];

        // Drei zufällige Texte auswählen, ohne Wiederholung
        const selectedTexts = [];
        const availableTexts = [...motivationTexts]; // Kopie erstellen, um Originalliste nicht zu verändern

        for (let i = 0; i < 3; i++) {
            if (availableTexts.length === 0) break; // Falls weniger als 3 Texte verfügbar

            // Zufälligen Index generieren
            const randomIndex = Math.floor(Math.random() * availableTexts.length);

            // Text auswählen und aus verfügbaren entfernen
            const selectedText = availableTexts.splice(randomIndex, 1)[0];
            selectedTexts.push(selectedText);
        }

        // Für jeden ausgewählten Text eine Option hinzufügen
        selectedTexts.forEach(text => {
            switcherOptions.push({
                text: text,
                callback: () => {
                    this.motivateWithArguments(text);
                }
            });
        });

        // Option für Gummibären hinzufügen, falls vorhanden
        if (this.stateManager.hasAsset(this.gameState, 'invGummyBears')) {
            switcherOptions.push({
                text: "Ich habe diese Tüte Gummibären.",
                callback: () => {
                    this.motivateWithSweets();
                }
            });
        }

        this.dialogSwitcher.showOptions(switcherOptions);
    }

    motivateWithArguments(argumentText) {
        // Liste von ablehnenden Antworten
        const rejectionResponses = [
            "Das ist mit Abstand das demotivierendste, was ich je gehört habe.",
            "Wenn das motivierend sein soll, gehe ich lieber zurück zu COBOL-Programmierung.",
            "Super, ich fühle ich mich jetzt schon schlechter als vor deiner Ansprache.",
            "Ist das eine neue Management-Methode? Mitarbeiter durch Depressionen produktiver machen?",
            "Wow, ich habe selten so effektiv jede Spur von Motivation verloren.",
            "Danke, ich reserviere schon mal einen Therapieplatz für das ganze Team."
        ];

        // Zufällige Antwort auswählen
        const randomResponse = rejectionResponses[Math.floor(Math.random() * rejectionResponses.length)];

        this.showMonolog(["Das hier sollte euch motivieren:", argumentText], ()=>{
            this.showCharacterMonolog(this.getRandomDev(), [randomResponse], ()=>{
                this.backToDefault();
            });
        });
    }

    motivateWithSweets() {
        this.showMonolog(["Ich habe diese Tüte Gummibären."], ()=>{
            this.updateGameState({
                progress: {
                    teamMotivated: true
                }
            });
            this.stateManager.removeAsset(this.gameState, 'invGummyBears', 1);
            this.controls.updateAssetsTaken();
            this.showCharacterMonolog(this.getRandomDev(), ["Ich denke, jetzt sind wir ausreichend motiviert."], ()=>{
                this.checkTheThreePillars();
            });
        });
    }

    useDevsWithInvGummyBears() {
        this.useInvGummyBearsWithDevs();
    }
    useInvGummyBearsWithDevs() {
        this.focusInteraction();
        if (this.gameState.progress.lightHouseOrderAccepted) {
            this.motivateWithSweets()
        } else {
            this.showMonolog(["Ich denke das Team und ich müssen erst die richtige Ebene finden, um auf diesem Level zu kommunizieren."], ()=>{
               this.backToDefault();
            });
        }
    }

    checkTheThreePillars() {
        this.showMonolog(["Und, arbeitet ihr schon nach Scrum?"], ()=>{
            if (this.gameState.progress.pillarsFulfilled >= 3) {
                this.finalizeGame();
            } else {
                let answerText = "Nein, wir müssen noch die drei Säulen von Scrum beachten.";
                let askText = "Welche sind das?";
                if (this.gameState.progress.pillarsFulfilled === 1) {
                    answerText = "Nein, wir müssen noch zwei weitere Säulen von Scrum beachten.";
                }
                if (this.gameState.progress.pillarsFulfilled === 2) {
                    answerText = "Nein, wir müssen noch die letzte Säulen von Scrum beachten.";
                    askText = "Welche ist das?";
                }
                this.showCharacterMonolog(this.getRandomDev(), [answerText], ()=>{
                    this.showMonolog([askText], ()=>{
                        this.showCharacterMonolog(this.getRandomDev(), ["Das solltest du als unser Scrum Master doch wissen."], ()=>{
                            this.backToDefault()
                        });
                    });
                });
            }
        });
    }


    checkRoomModificationsPossible(checkTooling = false) {
        this.focusInteraction();
        if (!this.gameState.progress.teamMotivated) {
            this.showMonolog(["Ohne das Commitment des Teams fange ich damit nicht an."], ()=>{
                this.backToDefault();
            });
            return false;
        }
        if (!this.gameState.progress.youKnowTheThreePillars) {
            this.showMonolog(["Ich bin mir nicht ganz sicher, ob eine Einführung von Scrum so ablaufen sollte?"
                , "Ich sollte da vorher noch mal den Rat eines echten Experten einholen."], ()=>{
                this.backToDefault();
            });
            return false;
        }

        if (checkTooling) {
            if (!this.stateManager.hasAsset(this.gameState, 'invPen', 1)) {
                this.showMonolog(["Ich habe nichts, um die Karten zu beschriften."], ()=>{
                    this.backToDefault();
                });
                return false;
            }
            if (!this.stateManager.hasAsset(this.gameState, 'invMagnet', 3)) {
                this.showMonolog(["Ich vermute ich habe nicht genug Magnete für alle User Stories des Teams."], ()=>{
                    this.backToDefault();
                });
                return false;
            }
        }

        return true;
    }

    useTeamBlackBoardWithInvSprayCan() {
        this.useInvSprayCanWithTeamBlackBoard();
    }
    useInvSprayCanWithTeamBlackBoard() {
        if (this.checkRoomModificationsPossible()) {
            this.moveSophie({x:this.viewport.width * 0.35, y:this.sophie.y}, ()=>{
                this.front.setVisible(true);
                this.tweens.add({
                        targets: this.sophie,
                        x: this.viewport.width * 0.42,
                        y: this.viewport.height * 0.72,
                        scale: this.sophie.scale * 0.9,
                        duration: 1500,
                        ease: 'Power1',
                        onComplete: () => {
                            this.showMonolog(["Darauf habe ich mich schon die ganze Zeit gefreut."], ()=>{

                                this.updateGameState({
                                    progress: {
                                        whiteBoardPainted: true,
                                        pillarsFulfilled: this.gameState.progress.pillarsFulfilled + 1
                                    }
                                });
                                this.sophie.play('give');
                                this.animatePainting();
                            });
                        }
                    }
                );
            },'back', true)
        }
    }

    animatePainting() {
        // Define the whiteboard painting progression keys in order
        const paintStages = [
            'teamWB20', 'teamWB30', 'teamWB40', 'teamWB50',
            'teamWB60', 'teamWB70', 'teamWB80', 'teamWB90', 'teamWB100'
        ];

        // Total animation duration in milliseconds (approximately 4 seconds)
        const totalDuration = 4000;

        // Calculate delay for each stage transition
        const stageDelay = totalDuration / (paintStages.length - 1);

        // Track the current image for cleanup
        let currentImage = null;

        // Create SoundEffect instance if it doesn't exist yet
        if (!this.soundEffects) {
            this.soundEffects = new SoundEffect(this);
        }

        // Spray sound effect texts
        const sprayTexts = ['PSSSST!', 'TSSSSSH!', 'SHHHHH!', 'PSSHHT!', 'FSSSSSH!'];

        // Create a function to show each painting stage
        const showPaintingStage = (index) => {
            // Remove previous image if it exists
            if (currentImage && index < paintStages.length) {
                currentImage.destroy();
            }

            // If we've displayed all stages, complete the animation
            if (index >= paintStages.length) {
                // Update the whiteboard interactive object to be visible
                this.interactiveObjects['teamWhiteBoard'].gameObject.setVisible(true);

                // Return Sophie to default position
                this.moveSophieBackAfterPainting();

                // Animation complete
                return;
            }

            // Create and show the current painting stage
            const stageName = paintStages[index];
            currentImage = this.add.image(
                this.viewport.width / 2,
                this.viewport.height / 2,
                stageName
            );

            // Set image properties
            currentImage.setOrigin(0.5, 0.5);
            // Set depth to be below Sophie but above the background
            currentImage.setDepth(this.sophie.depth - 10);

            // Add spray sound effect using SoundEffect class
            // Get a random spray text
            const randomSprayText = sprayTexts[Math.floor(Math.random() * sprayTexts.length)];

            // Position the text near Sophie's hand/arm level, not feet
            const textX = this.viewport.width * 0.44;  // Offset to the right of Sophie
            const textY  = this.viewport.height * 0.3;  // Above Sophie's feet, closer to hands

            // Display the sound effect text
            this.soundEffects.play(randomSprayText, textX, textY, {
                duration: stageDelay * 0.8,  // Make sure it finishes before the next stage
                style: {
                    fontSize: '28px',
                    fill: '#a49a9a',         // Dark color for the text
                    fontFamily: 'Arial, sans-serif',
                    stroke: '#0c0c0c',       // Darker outline
                    strokeThickness: 13,
                }, depth: this.sophie.depth+10
            });
            this.focusInteraction();

            // Schedule the next stage
            this.time.delayedCall(stageDelay, () => {
                showPaintingStage(index + 1);
            });
        };

        // Start the animation sequence with the first stage
        showPaintingStage(0);
    }

    moveSophieBackAfterPainting() {
        this.sophie.play('walk_left');
        this.tweens.add({
                targets: this.sophie,
                x: this.viewport.width * 0.36,
                y: this.viewport.height * this.sceneConfig.sophieBottomPosition,
                scale: this.sceneConfig.sophieScale,
                duration: 1300,
                ease: 'Power1',
                onComplete: () => {
                    this.showMonolog(["Ich liebe weiße Whiteboards."], ()=>{
                       this.showCharacterMonolog(this.getRandomDev(), ["Die wichtigste Säule von Scrum."], ()=>{
                           this.showCharacterMonolog(this.getRandomDev(), ["Ich fühle es, wir sind ganz nahe."], ()=>{
                               this.front.setVisible(false);
                               this.checkFinalizeGame();
                           });
                       });
                    });
                }
            }
        );

    }

    useTeamBlackBoardWithInvBusinessCards() {
        this.useInvBusinessCardsWithTeamBlackBoard();
    }

    useInvBusinessCardsWithTeamBlackBoard() {
        this.focusInteraction();
        this.showMonolog(["Karten auf einem Blackboard sind ein absolutes No-Go in Scrum."],()=>{
            this.backToDefault();
        });
    }

    useTeamTableLegWithInvScrumGuide() {
        this.useInvScrumGuideWithTeamTableLeg();
    }

    useInvScrumGuideWithTeamTableLeg() {
        if (this.checkRoomModificationsPossible()) {

            this.moveSophie({x: this.viewport.width * 0.07, y: this.sophie.y}, () => {
                this.updateGameState({
                    progress: {
                        scrumGuideUsed: true,
                        pillarsFulfilled: this.gameState.progress.pillarsFulfilled + 1
                    }
                });

                this.stateManager.removeAsset(this.gameState, 'invScrumGuide');
                this.controls.updateAssetsTaken();

                this.soundEffects.play('RUCKEL', this.viewport.width * 0.064, this.viewport.height * 0.916, {
                    duration: 1300,
                    style: {
                        fontSize: '28px',
                        fill: '#a7ace3',         // Dark color for the text
                        fontFamily: 'Arial, sans-serif',
                        stroke: 'rgb(54,70,183)',       // Darker outline
                        strokeThickness: 10,
                    }, depth: this.sophie.depth + 10
                });
                this.scrumGuide.setVisible(true);

                this.showCharacterMonolog(this.getDevByKey('devA'),
                    ["Cool, jetzt wackelt er nicht mehr.", "Damit kann ich doppelt so schnell programmieren."], () => {
                        this.showCharacterMonolog(this.getRandomDev(), ["Quasi eine tragende Prozessanweisung. Eine der zentralen Säulen von Scrum."], () => {
                            this.moveSophie({x: this.viewport.width * 0.4, y: this.sophie.y}, () => {
                                this.showMonolog(["Scrum ist leicht zu beherrschen, aber schwer zu verstehen."], () => {
                                    this.checkFinalizeGame();
                                });
                            });
                        });
                    });
            });
        }
    }

    useInvPenWithBusinessCards() {
        this.useInvBusinessCardsWithInvPen();
    }

    useInvBusinessCardsWithInvPen() {
        if (this.checkRoomModificationsPossible()) {
            if (this.gameState.progress.whiteBoardPainted) {
                this.useInvBusinessCardsWithTeamWhiteBoard();
            } else {
                this.showMonolog(["Mir fehlt ein passender Ort, wo ich die Karten hinhängen könnte."], ()=>{
                    this.backToDefault();
                })
            }

        }
    }


    useTeamWhiteBoardWithInvBusinessCards() {
        this.useInvBusinessCardsWithTeamWhiteBoard();
    }

    useInvBusinessCardsWithTeamWhiteBoard() {
        if (this.checkRoomModificationsPossible(true)) {

            this.moveSophie({x:this.viewport.width * 0.349, y:this.sophie.y}, ()=>{

                this.front.setVisible(true);

                this.tweens.add({
                        targets: this.sophie,
                        x: this.viewport.width * 0.439,
                        y: this.viewport.height * 0.722,
                        scale: this.sophie.scale * 0.9,
                        duration: 1400,
                        ease: 'Power1',
                        onComplete: () => {
                            this.showMonolog(["Also, welche User Stories habt ihr?"], ()=>{
                                this.showCharacterMonolog(this.getRandomDev(), ["Als Nutzer möchte ich die Software starten können, ...", "...damit ich sie überhaupt nutzen kann."], ()=>{
                                    this.sophie.play('give');
                                    this.controls.updateAssetsTaken();
                                    this.story1.setVisible(true);
                                    this.showCharacterMonolog(this.getRandomDev(), ["Als Entwickler möchte ich Bugs...", "...als nicht reproduzierbar kennzeichnen können, ...", "...damit ich weniger Arbeit habe."], ()=>{
                                        this.controls.updateAssetsTaken();
                                        this.story2.setVisible(true);
                                        this.showCharacterMonolog(this.getRandomDev(), ["Als Anwender möchte ich Aufgaben...", "...einem anderen Team zuweisen können, ... ", "...damit ich die Arbeit nicht machen muss."], ()=>{

                                            this.story3.setVisible(true);

                                            this.updateGameState({
                                                progress: {
                                                    ticketsOnBoard: true,
                                                    pillarsFulfilled: this.gameState.progress.pillarsFulfilled + 1
                                                }
                                            });

                                            this.stateManager.removeAsset(this.gameState, 'invBusinessCards', 3);
                                            this.stateManager.removeAsset(this.gameState, 'invMagnet', 3);

                                            this.controls.updateAssetsTaken();

                                            this.sophie.play('back');
                                            this.showMonolog(["Das ist alles?"], ()=>{
                                                this.sophie.play('walk_left');
                                                this.showCharacterMonolog(this.getRandomDev(), ["DO LESS WORKS BEST!"], ()=>{
                                                    this.tweens.add({
                                                        targets: this.sophie,
                                                        x: this.viewport.width * 0.349,
                                                        y: this.viewport.height * this.sceneConfig.sophieBottomPosition,
                                                        scale: this.sceneConfig.sophieScale,
                                                        duration: 1400,
                                                        ease: 'Power1',
                                                        onComplete: () => {
                                                            this.front.setVisible(false);
                                                            this.showCharacterMonolog(this.getRandomDev(), ["Eine der wichtigen Säule von Scrum: Karten mit User Stories!"],()=>{
                                                                this.showMonolog(["Man muss nur das richtige Mindset haben."], ()=>{
                                                                    this.checkFinalizeGame();
                                                                });
                                                            });
                                                        }
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    }
                );
            },'back', true)

        }
    }

    checkFinalizeGame() {
        if (this.gameState.progress.pillarsFulfilled >= 3) {
            this.checkTheThreePillars();
        } else {
            this.backToDefault();
        }
    }

    finalizeGame() {
        this.focusInteraction();

        this.showCharacterMonolog(this.getRandomDev(), ["Ja, du hast es geschafft."], ()=>{
            this.showCharacterMonolog(this.getRandomDev(), ["Herzlichen Glückwunsch!"], ()=>{
                this.showCharacterMonolog(this.getRandomDev(), ["Das war eine der erfolgreichsten Scrum-Einführungen der Geschichte."], ()=>{
                    this.showCharacterMonolog(this.getDevByKey('devC'), ["Zur Belohnung möchten wir dir diesen Scrum Master Ring schenken."], ()=>{
                        this.moveSophie({x: this.viewport.width * 0.45, y: this.sophie.y}, ()=>{
                            this.controls.updateAssetsTaken();
                            this.showCharacterMonolog(this.getRandomDev(), ["Und jetzt lass und in Ruhe, unser Sprint läuft bereits."], ()=>{
                                this.changeScene('OutroScene');
                            });
                        });
                    });
                });
            });
        });

    }

}