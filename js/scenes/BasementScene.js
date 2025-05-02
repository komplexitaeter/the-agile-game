class BasementScene extends BaseScene {
    constructor() {
        super({ key: 'BasementScene' });
        this.isJeffAway = false;
    }

    create() {
        super.create();
        this.controls.show();

        this.dialogSwitcher = new DialogSwitcher(this);

        this.frontRight = this.add.image(this.viewport.width / 2, this.viewport.height / 2
            , 'basementFrontRight')
        this.frontRight.setOrigin(0.5, 0.5);
        this.frontRight.setDepth(this.sophie.depth + 10);
        this.frontRight.setVisible(false);

        this.jeff = null;
        this.jeffRelativeX = 0.448;
        this.setupJeff();
        this.jeff.play('jeff_sitting');

        this.frontLeft = this.add.image(this.viewport.width / 2, this.viewport.height / 2
            , 'basementFrontLeft')
        this.frontLeft.setOrigin(0.5, 0.5);
        this.frontLeft.setDepth(this.jeff.depth + 10);
        this.frontLeft.setVisible(false);

        this.toiletDore = this.add.image(this.viewport.width / 2, this.viewport.height / 2
            , 'basementToiletDore')
        this.toiletDore.setOrigin(0.5, 0.5);
        this.toiletDore.setDepth(this.frontRight + 1);
        this.toiletDore.setVisible(false);

        if (!this.gameState.progress.coinOnPlate) {
            this.interactiveObjects['basementCoin'].gameObject.setVisible(false);
        }

        if (this.entryPoint === 'teamRoom') {
            this.focusInteraction();

            this.sophie.x = this.viewport.width * 0.7 * 0.88;
            this.sophie.y = this.viewport.height * 0.76;
            this.sophie.setScale(this.sophie.scale * 0.8);

            // Start with Sophie facing left (coming back from team room)
            this.sophie.play('walk_right');

            // Animate Sophie returning from the team room (reverse of useBasementTeamRoom animation)
            this.tweens.add({
                targets: this.sophie,
                scale: this.sceneConfig.sophieScale,
                y: this.viewport.height * this.sceneConfig.sophieBottomPosition,
                x: this.viewport.width * 0.7,
                duration: 1200,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    this.backToDefault();
                }
            });
        } else {
            this.sophie.x = this.viewport.width * 0.95;
            this.sophie.play('walk_left');
            this.backToDefault();
        }

    }

    setupJeff() {
        const jeffScale = 0.655;
        const jeffBottomPosition = 0.99;

        // Sophie an der relativen Position platzieren
        const jeffX = this.viewport.width * this.jeffRelativeX;
        const jeffY = this.viewport.height * jeffBottomPosition; // Anpassbare Bodenposition

        this.jeff = this.add.sprite(jeffX, jeffY, 'jeff', 0).setOrigin(0.5, 1);
        this.jeff.key = 'jeff';
        this.jeff.setScale(jeffScale); // Anpassbare Skalierung
        this.jeff.setDepth(10);

        // Animationen
        if (!this.anims.exists('jeff_sitting')) {
            this.anims.create({ key: 'jeff_sitting', frames: [{ key: 'jeff', frame: 0 }] });
            this.anims.create({ key: 'jeff_right', frames: [{ key: 'jeff', frame: 1 }] });
            this.anims.create({ key: 'jeff_left', frames: [{ key: 'jeff', frame: 2 }] });
        }
    }


    useBasementExit() {
        this.focusInteraction();
        this.moveSophie({x: this.viewport.width * 1.1, y:  this.viewport.height}, ()=>{
            this.changeScene('ElevatorScene');
        },'walk_right', true);
    }

    talkToBasementJeff() {
        let switcherOptions = [];
        this.focusInteraction();
        this.moveSophie({x:this.viewport.width*0.5, y:this.sophie.y},()=>{

            switcherOptions.push({
                text: "Wie läuft das Geschäft?",
                callback: () => {
                    this.subTalkJeffBusiness();
                }
            });

            switcherOptions.push({
                text: "Icb bin Sophie Plaice und ich möchte diese Organisation agil machen.",
                callback: () => {
                    this.subTalkJeffAgile();
                }
            });

            if (this.gameState.progress.lightHouseProjectGiven) {
                switcherOptions.push({
                    text: "Kannst du mir sagen, was ich bei einer Scrum Einführung beachten muss? ",
                    callback: () => {
                        this.subTalkJeffScrum();
                    }
                });
            }

            switcherOptions.push({
                text: "Kennst du Ken vom Empfang gut? ",
                callback: () => {
                    this.subTalkJeffSocial();
                }
            });

            this.dialogSwitcher.showOptions(switcherOptions);
        });
        return true;
    }

    subTalkJeffBusiness() {
        this.showMonolog(["Wie läuft das Geschäft?"], ()=>{
            if (this.gameState.progress.toiletEverUsed>1) {
                if (this.gameState.progress.scrumGuideGiven) {
                    this.showCharacterMonolog(this.jeff, ["Seit du im Unternehmen bist habe ich das Gefühlt, es geht vorn."],()=>{
                        this.backToDefault();
                    })
                } else {
                    this.showCharacterMonolog(this.jeff, ["Du bist mit Abstand meine beste Kundin heute.", "Als kleines Dankeschön habe ich hier ein Geschenk für dich.", "Eine Premium Ausgabe des Scrum Guide.", "Möge sie dir zu mehr Ruhm gereichen, als mir."],()=>{
                        this.stateManager.addAsset(this.gameState, 'invScrumGuide');
                        this.updateGameState({
                            progress: {
                                scrumGuideGiven: true
                            }
                        });

                        this.controls.updateAssetsTaken();
                        this.showMonolog(["Der Scum Guide in Version 2017.", "Meine Liblingsversion.", "Persönlich signiert von Jeff Sutherland.", "Vielen, vielen Dank!"], ()=>{
                            this.backToDefault();
                        });
                    })
                }
            } else {
                this.showCharacterMonolog(this.jeff, ["Heute ist ein durchschnittlicher Tag. ", "Der Rekord an Toilettenbenutzungen liegt aktuell bei 1."],()=>{
                    this.backToDefault();
                });
            }
        })
    }

    subTalkJeffScrum() {
        this.showMonolog(["Kannst du mir sagen, was ich bei einer Scrum Einführung beachten muss?"], ()=>{
            this.showCharacterMonolog(this.jeff, ["Da kenne ich mich zufällig etwas aus.", " Beachte immer die 3 Säulen von Scrum!"],()=>{
                this.showMonolog(["Diese waren nochmal?"], ()=>{
                    this.showCharacterMonolog(this.jeff, ["Bist du dir wirklich sicher, was du hier tust?"
                        , " Die 3 Säulen von Scrum sind natürlich:"
                            ,"Ein Whiteboard."
                            ,"Karten mit User Stories."
                            ,"Und eine tragfähige Prozessanweisung."],()=>{
                        this.showMonolog(["Ich bin mir nicht sicher, welchem Cargo-Kult wir damit folgen?."], ()=>{
                            this.showCharacterMonolog(this.jeff, ["Vertraue mir, du wirst es fühlen, wenn es soweit ist.", "Es geht hier um das richtige Mindset."],()=>{
                                this.updateGameState({
                                    progress: {
                                        youKnowTheThreePillars: true
                                    }
                                });
                                this.backToDefault();
                            });
                        });
                    });
                });
            });
        });
    }

    subTalkJeffAgile() {
        this.showMonolog(["Icb bin Sophie Plaice und ich möchte diese Organisation agil machen."], ()=>{
            this.showCharacterMonolog(this.jeff, ["Ich muss dich warnen.", "Der Weg zur dunklen Seite der Macht ist sehr verlockend."],()=>{
                this.showMonolog(["Und ich dachte, mit Agile wird alles besser?"], ()=>{
                    this.showCharacterMonolog(this.jeff, ["Das dachte ich einst auch.", "Aber Agilität löst tatsächlich gar kein einziges Problem."],()=>{
                        this.showMonolog(["Ich hatte es befürchtet."], ()=>{
                            this.showCharacterMonolog(this.jeff, ["Sie macht nur SEHR VIELE Probleme transparent.", "Und glaub mir, einige davon möchtest du nicht sehen, mein Kind."],()=>{
                                this.backToDefault();
                            });
                        });
                    });
                });
            });
        });
    }

    subTalkJeffSocial() {
        this.showMonolog(["Kennst du Ken vom Empfang gut?"], ()=>{
            this.showCharacterMonolog(this.jeff, ["Wir hatten mal zusammen ein spannendes Projekt in den 90ern.", "Aber auf Grund von professionellen Differenzen ist unserer Beziehung inzwischen eher … sachlich."],()=>{
                this.backToDefault();
            });
        });
    }



    takeBasementCoin() {
        this.focusInteraction();
        this.moveSophie({x:this.viewport.width*0.5, y:this.sophie.y},()=>{
            if (this.isJeffAway) {
                this.interactiveObjects['basementCoin'].gameObject.setVisible(false);
                this.hideAllHoverTexts();
                this.stateManager.addAsset(this.gameState, 'invCoin');
                this.controls.updateAssetsTaken();
                this.updateGameState({
                    progress: {
                        coinOnPlate: false
                    }
                });

                this.backToDefault();
            } else {
                this.showMonolog(["Jeff kann mich sehen und würde es nicht mögen."], ()=>{
                    this.backToDefault();
                });
            }
        });
        return true;
    }

    useInvCoinWithBasementPlate() {
        this.focusInteraction();

        this.moveSophie({x: this.viewport.width * 0.5, y: this.sophie.y}, () => {

            if (this.isJeffAway) {

                this.showMonolog(["Ich warte besser kurz, bis Jeff zurück ist."], ()=>{
                    this.backToDefault();
                });

            } else {


                this.updateGameState({
                    progress: {
                        coinOnPlate: true
                    }
                });
                this.stateManager.removeAsset(this.gameState, 'invCoin', 1);
                this.controls.updateAssetsTaken();
                this.interactiveObjects['basementCoin'].gameObject.setVisible(true)
                this.showCharacterMonolog(this.jeff, ["Wow, ein Bitcoin!", "Ich bin reich."], ()=>{
                    this.showMonolog(["Theoretisch."], ()=>{
                        this.updateGameState({
                            progress: {
                                toiletUsesPayed: this.gameState.progress.toiletUsesPayed + 1
                            }
                        });
                        this.showCharacterMonolog(this.jeff, ["Danke, du kannst die Toilette nun " + this.gameState.progress.toiletUsesPayed + "x benutzen."], () => {
                            this.backToDefault();

                        });
                    });
                });

            }
        });


    }

    useBasementJeffWithInvEmptyToiletPaperRole() {
        this.useInvEmptyToiletPaperRoleWithBasementJeff();
    }

    useInvEmptyToiletPaperRoleWithBasementJeff() {
        this.focusInteraction();
        this.interactiveObjects['basementJeff'].gameObject.setVisible(false);

        this.moveSophie({x:this.viewport.width*0.5, y:this.sophie.y}, () => {
            this.showMonolog(["Ich habe das hier."], () => {
                this.showCharacterMonolog(this.jeff, ["Ist es schon wieder alle?", "Was machen diese Tech-Kids damit nur?", "Ich gehe es auffüllen."], () => {
                    this.sendJeffToToilet();
                });
            });
        });
    }

// Jeff geht zum Toilettenpapier-Schrank
    sendJeffToToilet() {
        // Jeff dreht sich nach rechts
        this.jeff.play('jeff_right');

        this.time.delayedCall(500, () => {
            // Jeff dreht sich nach links und bewegt sich
            this.jeff.play('jeff_left');
            this.moveJeffToStairs();
            this.backToDefault();

        });
    }

// Jeff bewegt sich zur Treppe
    moveJeffToStairs() {
        this.tweens.add({
            targets: this.jeff,
            x: this.viewport.width * 0.35,
            duration: 600,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.moveJeffToBack();
            }
        });
    }

    // Jeff bewegt sich nach hinten (Skalierung verändert sich)
    moveJeffToBack() {
        this.tweens.add({
            targets: this.jeff,
            y: this.viewport.height * 0.8,
            scale: 0.57,
            duration: 600,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.moveJeffToToiletCabinet();
            }
        });
    }

    // Jeff bewegt sich zum Schrank
    moveJeffToToiletCabinet() {
        this.frontLeft.setVisible(true);
        this.isJeffAway = true;

        this.tweens.add({
            targets: this.jeff,
            x: this.viewport.width * 0.2,
            duration: 1000,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.playJeffToiletSounds();
            }
        });
    }

    // Spiele die Jeff-Geräusche ab
    playJeffToiletSounds() {
        const jeffX = this.viewport.width * 0.2;
        const jeffY = this.viewport.height * 0.4;

        // Definiere die Geräusche mit zeitlichen Variationen
        const jeffSounds = [
            { sound: "KLACK!", delay: 200, duration: 800 },
            { sound: "QUIETSCH!", delay: 600, duration: 700 },
            { sound: "ZISCH!", delay: 1200, duration: 600 },
            { sound: "GRUMMEL!", delay: 1800, duration: 900 },
            { sound: "VERDAMMT!", delay: 2500, duration: 1000 },
            { sound: "FLUPP!", delay: 3300, duration: 500 }
        ];

        // Für jedes Geräusch einen verzögerten Aufruf einrichten
        jeffSounds.forEach(this.scheduleSoundEffect.bind(this, jeffX, jeffY));

        // Nach allen Geräuschen Jeff zurückkehren lassen
        this.time.delayedCall(4000, () => {
            this.returnJeffFromToilet();
        });
    }

    // Plane einen einzelnen Soundeffekt
    scheduleSoundEffect(jeffX, jeffY, soundInfo) {
        this.time.delayedCall(soundInfo.delay, () => {
            // Kleine zufällige Positionsabweichung für natürlicheren Effekt
            const offsetX = Phaser.Math.Between(-15, 15);
            const offsetY = Phaser.Math.Between(-10, 10);

            // Textstil für Soundeffekte, mit Variationen ähnlich dem MeetingScene-Beispiel
            const textStyle = {
                fontSize: `${Phaser.Math.Between(28, 36)}px`,
                fill: Phaser.Math.RND.pick(['#ff9e80', '#80d8ff', '#b9f6ca']), // Farben aus MeetingScene
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

            // SoundEffects-Klasse verwenden, um den Sound abzuspielen
            if (this.soundEffects) {
                this.soundEffects.play(soundInfo.sound, jeffX + offsetX, jeffY + offsetY, {
                    duration: soundInfo.duration,
                    depth: 1000,
                    style: textStyle
                });
            }
        });
    }

    // Jeff kehrt zurück, nimmt den gleichen Weg
    returnJeffFromToilet() {
        // Jeff geht zurück zur Treppe
        this.jeff.play('jeff_right');
        this.tweens.add({
            targets: this.jeff,
            x: this.viewport.width * 0.35,
            duration: 1000,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.frontLeft.setVisible(false);
                this.returnJeffToFront();
            }
        });
    }

    // Jeff geht nach vorne
    returnJeffToFront() {
        // Die ursprüngliche Position und Größe aus dem setupJeff() wiederherstellen
        const jeffScale = 0.655; // Aus der setupJeff-Methode
        const jeffBottomPosition = 0.99; // Aus der setupJeff-Methode
        this.isJeffAway = false;

        this.tweens.add({
            targets: this.jeff,
            y: this.viewport.height * jeffBottomPosition,
            scale: jeffScale,
            duration: 600,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.returnJeffToSeat();
            }
        });
    }

    // Jeff kehrt zu seinem Platz zurück
    returnJeffToSeat() {
        // Dreht sich nach rechts, um an seinen Platz zu gehen
        this.jeff.play('jeff_right');

        this.tweens.add({
            targets: this.jeff,
            x: this.viewport.width * this.jeffRelativeX, // Ursprüngliche Position verwenden
            duration: 600,
            ease: 'Sine.easeOut',
            onComplete: () => {
                // Wieder im Sitzen
                this.jeff.play('jeff_sitting');
                this.interactiveObjects['basementJeff'].gameObject.setVisible(true);
            }
        });
    }

    useToiletDore() {
        this.focusInteraction();
        this.moveSophie({x:this.viewport.width*0.67, y:this.sophie.y}, ()=>{
            if (this.gameState.progress.mustPee) {

                if (this.gameState.progress.toiletUsesPayed > 0) {
                    this.goToToilet();
                } else {
                    this.showCharacterMonolog(this.jeff, ["Warte, eine kostenlose Nutzung wäre für mich kein gutes Geschäftsmodell."], ()=>{
                       this.backToDefault();
                    });
                }
            } else {
                this.showMonolog(["Im Moment habe ich nicht das Bedürfnis, dort hin zu gehen."], ()=>{
                    this.backToDefault();
                });
            }
        }, 'walk_right',true);
    }

    // Korrigierte Sophie Toiletten-Funktionen mit richtigen z-index (depth) Werten
// und vollständiger Animation

    goToToilet() {
        this.moveSophie(this.sophie, ()=>{
            // Sophie geht nach hinten und wird kleiner
            this.tweens.add({
                targets: this.sophie,
                scale: this.sophie.scale * 0.8,
                y: this.sophie.y * 0.82,
                duration: 1000,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    this.sophie.play('walk_right');
                    // Setze frontRight mit richtiger Tiefe sichtbar
                    this.frontRight.setVisible(true);

                    this.tweens.add({
                        targets: this.sophie,
                        x: this.viewport.width * 0.9,
                        duration: 1200,
                        ease: 'Sine.easeOut',
                        onComplete: () => {
                            // Stelle sicher, dass Sophie hinter der Tür ist
                            this.sophie.setDepth(this.frontRight.depth - 2);

                            // Setze die Tür richtig ein - mit korrekter Tiefe
                            this.toiletDore.setDepth(this.frontRight.depth + 1);
                            this.toiletDore.setVisible(true);

                            this.playSophieToiletSounds();
                        }
                    });
                }
            });
        }, 'back', true);
    }

    playSophieToiletSounds() {
        const sophieX = this.viewport.width * 0.9;
        const sophieY = this.viewport.height * 0.4;

        // Bestimme die Länge des Aufenthalts basierend auf cokesDrunken
        const durationFactor = this.gameState.progress.cokesDrunken || 1;
        const baseDuration = 4000; // Basiszeit in Millisekunden
        const totalDuration = baseDuration * Math.min(durationFactor, 3); // Maximal 3x so lang

        // Berechne die Verzögerungen für die Geräusche basierend auf der Gesamtdauer
        const delayFactor = totalDuration / baseDuration;

        // Definiere die Geräusche mit zeitlichen Variationen
        const sophieSounds = [
            { sound: "KLACK!", delay: 200 * delayFactor, duration: 800 },
            { sound: "QUIETSCH!", delay: 600 * delayFactor, duration: 700 },
            { sound: "PLÄTSCHER!", delay: 1200 * delayFactor, duration: 600 },
            { sound: "FLUSH!", delay: 1800 * delayFactor, duration: 900 },
            { sound: "ZISCH!", delay: 2500 * delayFactor, duration: 1000 },
            { sound: "FLUPP!", delay: 3300 * delayFactor, duration: 500 }
        ];

        // Für jedes Geräusch einen verzögerten Aufruf mit spezieller Tiefe einrichten
        sophieSounds.forEach(soundInfo => {
            this.time.delayedCall(soundInfo.delay, () => {
                // Kleine zufällige Positionsabweichung für natürlicheren Effekt
                const offsetX = Phaser.Math.Between(-15, 15);
                const offsetY = Phaser.Math.Between(-10, 10);

                // Textstil für Soundeffekte, mit Variationen ähnlich dem MeetingScene-Beispiel
                const textStyle = {
                    fontSize: `${Phaser.Math.Between(28, 36)}px`,
                    fill: Phaser.Math.RND.pick(['#ff9e80', '#80d8ff', '#b9f6ca']), // Farben aus MeetingScene
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

                // SoundEffects-Klasse verwenden, um den Sound abzuspielen
                // Hier überschreiben wir die Standard-Tiefe, um sicherzustellen, dass die Soundeffekte
                // über allem anderen erscheinen (frontRight, toiletDore, etc.)
                if (this.soundEffects) {
                    this.soundEffects.play(soundInfo.sound, sophieX + offsetX, sophieY + offsetY, {
                        duration: soundInfo.duration,
                        depth: this.frontRight.depth + 1,
                        style: textStyle
                    });
                }
            });
        });

        // Nach allen Geräuschen Sophie zurückkehren lassen
        this.time.delayedCall(totalDuration, () => {
            this.returnSophieFromToilet();
        });
    }

    returnSophieFromToilet() {
        // Tür schließen, indem wir sie ausblenden
        this.toiletDore.setVisible(false);

        // Den cokesDrunken-Wert zurücksetzen
        this.updateGameState({
            progress: {
                cokesDrunken: 0,
                mustPee: false,
                toiletUsesPayed: Math.max(0, this.gameState.progress.toiletUsesPayed - 1),
                toiletEverUsed: this.gameState.progress.toiletEverUsed + 1
            }
        });

        // Sophie zurückbewegen und normale Tiefe wiederherstellen
        this.sophie.play('walk_left');

        this.tweens.add({
            targets: this.sophie,
            x: this.viewport.width * 0.7,
            duration: 1000,
            ease: 'Sine.easeOut',
            onComplete: () => {
                // Sophie bewegt sich nach vorne und wird wieder größer
                this.sophie.play('walk_left');
                this.frontRight.setVisible(false);

                this.tweens.add({
                    targets: this.sophie,
                    scale: this.sophie.scale / 0.8, // Ursprüngliche Größe wiederherstellen
                    y: this.sophie.y / 0.82,        // Ursprüngliche Position wiederherstellen
                    duration: 1000,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        // Sophie wieder auf normale Tiefe setzen
                        this.sophie.setDepth(10); // Annahme: Standard-Tiefe ist 10

                        // Monolog nach dem Toilettengang
                        this.showMonolog(["Ahhh, das war nötig."], () => {
                            this.backToDefault();
                        });
                    }
                });
            }
        });
    }

    useBasementTeamRoom() {
        this.focusInteraction();
        this.moveSophie({x: this.viewport.width * 0.7, y:  this.viewport.height}, ()=>{

            this.tweens.add({
                targets: this.sophie,
                scale: this.sophie.scale * 0.8,
                y: this.sophie.y * 0.76,
                x: this.sophie.x * 0.88,
                duration: 1200,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    this.changeScene('TeamScene');
                }
            });

        },'back', true);
    }

}