class CEOOfficeScene extends BaseScene {
    constructor() {
        super({ key: 'CEOOfficeScene' });

        // Redefetzen für Noels Selbstgespräch
        this.speechFragments = [
            "\"DAS WIRD ALLES EINMAL MIR GEHÖREN.\"",
            "\"DIE INNOVATION VON HEUTE IST DER PROFIT VON MORGEN.\"",
            "\"WIR MÜSSEN DIE GRENZEN DES MÖGLICHEN SPRENGEN!\"",
            "\"DAS UNIVERSUM IST NUR DER ANFANG.\"",
            "\"UNSERE KONKURRENZ? LÄCHERLICH! DINOSAURIER!\"",
            "\"DIESES DENKEN IST NICHT AKZEPTABEL IN MEINEM UNTERNEHMEN!\"",
            "\"MIT DIESER TECHNOLOGIE WERDEN WIR DIE WELT NEU DEFINIEREN.\"",
            "\"DIE SCHWACHEN WERDEN UNTERGEHEN, DIE STARKEN ÜBERLEBEN!\"",
            "\"EFFIZIENZ IST KEIN LUXUS, SONDERN EINE NOTWENDIGKEIT!\"",
            "\"NIEMAND VERSTEHT MEINE VISION, NIEMAND AUSSER MIR.\"",
            "\"DIESE REGELN SIND FÜR KLEINE DENKER GEMACHT, NICHT FÜR VISIONÄRE!\"",
            "\"IN FÜNF JAHREN WIRD JEDER HAUSHALT UNSER PRODUKT HABEN, JEDER!\"",
            "\"DIE ALTE WIRTSCHAFT STIRBT, WIR SIND DIE ZUKUNFT!\"",
            "\"ICH NEHME KEINE GEFANGENEN, NUR MARKTANTEILE!\"",
            "\"DER T-REX SUPPORT BIN ICH!\"",
        ];

        // Worteinschübe für Noels Selbstgespräch
        this.speechInserts = [
            "Yeaah...",
            "Great...",
            "\"BOOM!\"",
            "\"ABSOLUT!\"",
            "\"VERSTEHST DU?\"",
            "\"GENIAL!\"",
            "\"HÖR MIR ZU!\"",
            "\"EHRLICH GESAGT...\"",
            "\"UNMÖGLICH? HAH!\"",
            "Geht das so?",
            "Moment, nochmal...",
            "Ich muss das anpassen...",
            "Noch mal von vorne...",
            "Halt, das versuche ich noch mal...",
            "Zu theatralisch?",
            "Ich muss das Publikum mehr mitreißen...",
            "Das muss ich noch besser rüberbringen..."
        ];
    }

    create() {
        super.create();
        this.controls.show();

        this.dialogSwitcher = new DialogSwitcher(this);

        this.front = this.add.image(this.viewport.width / 2, this.viewport.height / 2
            , 'ceoOfficeFront')
        this.front.setOrigin(0.5, 0.5);
        this.front.setDepth(this.sophie.depth + 2);

        this.sophie.x = 0.24 * this.viewport.width;
        this.sophie.play('walk_right');

        this.noel = null;
        this.noelRelativeX = 0.85;
        this.setupNoel();
        this.noel.play('noel_right');

        if (this.gameState.progress.officeMagnetTaken) {
            this.interactiveObjects['officeMagnet'].gameObject.setVisible(false);
            this.interactiveObjects['officeMagnet'].gameObject.removeInteractive();
        }

        this.backToDefault();


        // Sofort den Background-Talk starten, bevor andere Interaktionen beginnen
        this.startBackgroundTalk();

    }

    setupNoel() {
        const noelScale = 0.43;
        const noelBottomPosition = 0.666;

        // Sophie an der relativen Position platzieren
        const noelX = this.viewport.width * this.noelRelativeX;
        const noelY = this.viewport.height * noelBottomPosition; // Anpassbare Bodenposition

        this.noel = this.add.sprite(noelX, noelY, 'noel', 0).setOrigin(0.5, 1);
        this.noel.key = 'noel';
        this.noel.setScale(noelScale); // Anpassbare Skalierung
        this.noel.setDepth(10);

        // Animationen
        if (!this.anims.exists('noel_left')) {
            this.anims.create({ key: 'noel_left', frames: [{ key: 'noel', frame: 0 }] });
            this.anims.create({ key: 'noel_hand_up', frames: [{ key: 'noel', frame: 1 }] });
            this.anims.create({ key: 'noel_right', frames: [{ key: 'noel', frame: 2 }] });
        }
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

        // Bereits verwendete Indizes, um Wiederholungen zu vermeiden
        this.usedFragmentIndices = [];
        this.usedInsertIndices = [];

        // Flag, ob wir Fragment oder Insert verwenden sollen
        this.useFragment = true;

        // Starte mit dem ersten Gesprächsbeitrag
        this.playNextTalk();
    }

    playNextTalk() {
        if (!this.playBackgroundTalk) return;

        // Position für Noels Text - über Noel, aber mit Abstand zum rechten Rand
        // Verwende eine feste Position etwas weiter links
        const textX = this.viewport.width * 0.85; // Weiter nach links verschoben
        const textY = this.viewport.height * 0.27;

        // Text auswählen (entweder Fragment oder Insert)
        let talkText;
        let displayDuration;

        if (this.useFragment) {
            // Fragment auswählen
            let textIndex = Phaser.Math.Between(0, this.speechFragments.length - 1);
            if (this.usedFragmentIndices.length >= this.speechFragments.length) {
                this.usedFragmentIndices = [];
            }
            while (this.usedFragmentIndices.includes(textIndex)) {
                textIndex = Phaser.Math.Between(0, this.speechFragments.length - 1);
            }
            this.usedFragmentIndices.push(textIndex);
            talkText = this.speechFragments[textIndex];
            displayDuration = 3000; // Etwas schneller als 7500, aber langsamer als ursprünglich

            // Mit zufälliger Wahrscheinlichkeit die Hand-Geste ausführen
            if (Phaser.Math.Between(1, 100) <= 60) {
                this.noel.play('noel_hand_up');
                this.time.delayedCall(1200, () => {
                    this.noel.play('noel_right');
                });
            }
        } else {
            // Insert auswählen
            let textIndex = Phaser.Math.Between(0, this.speechInserts.length - 1);
            if (this.usedInsertIndices.length >= this.speechInserts.length) {
                this.usedInsertIndices = [];
            }
            while (this.usedInsertIndices.includes(textIndex)) {
                textIndex = Phaser.Math.Between(0, this.speechInserts.length - 1);
            }
            this.usedInsertIndices.push(textIndex);
            talkText = this.speechInserts[textIndex];
            displayDuration = 1400; // Etwas schneller als 3750, aber langsamer als ursprünglich
        }



        // Vorhandene Texte entfernen
        if (this.currentBackgroundText) {
            this.tweens.killTweensOf(this.currentBackgroundText);
            this.currentBackgroundText.destroy();
            this.currentBackgroundText = null;
        }

        // Text-Einstellungen mit Gelb und Umbruch, mehr Platz links lassen
        const textStyle = {
            fontSize: '30px',
            fill: '#FFD700', // Gold/Gelb
            fontFamily: 'Arial, sans-serif',
            align: 'center',
            stroke: '#755200',
            strokeThickness: 6,
            wordWrap: { width: this.viewport.width * 0.3 } // Schmaler für besseren Umbruch
        };

        // Text erstellen OHNE Hintergrund
        const text = this.add.text(textX, textY, talkText, textStyle);
        text.setOrigin(0.5, 0.5);
        text.setDepth(9001);

        // Text direkt speichern, kein Container nötig
        this.currentBackgroundText = text;

        // Pausendauer anpassen
        const pauseDuration = Phaser.Math.Between(100, 400);

        this.backgroundTalkTimer = this.time.delayedCall(displayDuration, () => {
            this.tweens.add({
                targets: text,
                alpha: 0,
                duration: 350,
                ease: 'Power1',
                onComplete: () => {
                    text.destroy();
                    this.currentBackgroundText = null;

                    this.useFragment = !this.useFragment;

                    this.time.delayedCall(pauseDuration, () => {
                        if (this.playBackgroundTalk) {
                            this.playNextTalk();
                        }
                    });
                }
            });
        });
    }

    stopBackgroundTalk() {
        this.playBackgroundTalk = false;

        // Timer anhalten
        if (this.backgroundTalkTimer) {
            this.backgroundTalkTimer.remove();
            this.backgroundTalkTimer = null;
        }

        // Text entfernen
        if (this.currentBackgroundText) {
            this.tweens.killTweensOf(this.currentBackgroundText);
            this.currentBackgroundText.destroy();
            this.currentBackgroundText = null;
        }

        // Zusätzliche Prüfung für verbliebene Texte
        this.children.list.forEach(child => {
            if (child.type === 'Text' && child.style && child.style.fill === '#FFD700') {
                this.tweens.killTweensOf(child);
                child.destroy();
            }
        });
    }

    useOfficeExit() {
        // Background-Talk stoppen wenn Sophie den Raum verlässt
        this.stopBackgroundTalk();

        this.focusInteraction();
        this.moveSophie({x: this.viewport.width * 0.2, y:  this.viewport.height}, ()=>{
            this.changeScene('ElevatorScene');
        },'walk_left', true);
    }

    talkToOfficeNoel() {
        this.focusInteraction();

        if (this.gameState.progress.lightHouseProjectGiven) {
            this.showMonolog([ "Ich habe einen klaren Auftrag.", "Ich habe das Gefühlt, es wird nicht besser, wenn ich nochmal mit ihr rede."], ()=>{
                this.backToDefault();
            });
        }
        else {

            this.moveSophie({x: this.viewport.width * 0.41, y: this.viewport.height}, () => {
                this.stopBackgroundTalk();
                this.showMonolog(["Hallo?"], () => {
                    let text = "Verdammt, es lief gerade so gut...";
                    if (this.gameState.progress.everTalkedToNoel) {
                        text = "Arg, schon wieder...";
                    }
                    this.showCharacterMonolog(this.noel, [text], () => {
                        this.noel.play('noel_left');
                        this.showCharacterMonolog(this.noel, ["Ja?"], () => {
                            this.tweens.add({
                                targets: this.noel,
                                x: this.viewport.width * 0.6,
                                duration: 1500,
                                ease: 'Power1',
                                onComplete: () => {
                                    let text = "Wer bist du und was willst du?";
                                    if (this.gameState.progress.everTalkedToNoel) {
                                        text = "Wer warst du nochmal?";
                                    }
                                    this.showCharacterMonolog(this.noel, [text], () => {
                                        if (this.gameState.progress.everTalkedToNoel) {
                                            this.subTalkNoel();
                                        } else {
                                            this.subTalkNoelFirst();
                                        }
                                    });
                                }
                            });
                        });
                    });
                });
            }, 'walk_right', true);

        }

        return true;
    }

    subTalkNoelFirst() {
        this.showMonolog(["Ich bin Sophie Plaice und ich will diese Company agil machen."], ()=>{
            this.showCharacterMonolog(this.noel, ["Was soll das bringen?"], ()=>{
                this.showMonolog(["Die Organisation kann sich besser auf Veränderung einstellen..."
                        ,"... und so lernen in einem komplexen Marktumfeld zu bestehen."]
                    , ()=>{
                        this.showCharacterMonolog(this.noel, ["Ach. Na sowas."
                            , "Hahahaha!", "Der Umgang dieser Company mit Komplexität bin ... ICH!"
                        ,   "Wir brauchen es nicht.", "Du bist gefeuert!"], ()=>{
                            this.updateGameState({
                                progress: {
                                    everTalkedToNoel: true
                                }
                            });
                            this.changeScene('BuildingScene', 'fired');
                        })
                    })
            });
        })
    }

    subTalkNoel() {
        let switcherOptions = [];

        // Option 1
        switcherOptions.push({
            text: "Ich bin Sophie Plaice und ich will diese Company agil machen.",
            callback: () => {
                this.showMonolog(["Ich bin Sophie Plaice und ich will diese Company agil machen."], ()=>{
                    this.showCharacterMonolog(this.noel, ["Wir brauchen es nicht. Du bist gefeuert!"], ()=>{
                        this.changeScene('BuildingScene', 'fired');
                    });
                });
            }
        });

        switcherOptions.push({
            text: "Mein Name ist Guybrush Threepwood und ich will Pirat werden!",
            callback: () => {
                this.showMonolog(["Mein Name ist Guybrush Threepwood und ich will Pirat werden!"], ()=>{
                    this.showCharacterMonolog(this.noel, ["Ok, du bist gefeuert, harr!"], ()=>{
                        this.changeScene('BuildingScene', 'fired');
                    });
                });
            }
        });

        switcherOptions.push({
            text: "Ich bin Agile Coachin und habe auf dem Weg hierher sehr viele Potentiale entdeckt.",
            callback: () => {
                this.showMonolog(["Ich bin Agile Coachin und habe auf dem Weg hierher sehr viele Potentiale entdeckt."], ()=>{
                    this.showCharacterMonolog(this.noel, ["Das klingt interessant.", "Lass uns schauen, was du drauf hast.", "Welche 3 konkrete Probleme hast du diese Woche schon gelöst?"], ()=>{
                        this.showMonolog(["Ich habe das Abfallsystem entlastet...", "eine Schwachstelle im Sicherheitssystem aufgedeckt...", "und eine technische Großanlage gesteuert."], ()=>{
                            this.showCharacterMonolog(this.noel, ["Ok, das klingt beeindruckend.", "Aber es reicht bei weitem nicht aus.", "Ich erwarte maximalen Einsatz und höchste Exzellenz.", "Du bist gefeuert!"], ()=>{
                                this.changeScene('BuildingScene', 'fired');
                            });
                        });
                    });
                });
            }
        });

        this.dialogSwitcher.showOptions(switcherOptions);
    }

    useOfficeNoelWithInvAccessForm() {
        this.useInvAccessFormWithOfficeNoel();
    }

    useInvAccessFormWithOfficeNoel() {
        this.focusInteraction();
        if (this.gameState.progress.formShownToNoel) {
            this.showMonolog(["Das habe ich ihr schon mal gezeigt."], ()=>{
                this.backToDefault();
            });
        } else {
            this.stopBackgroundTalk();
            this.moveSophie({x: this.viewport.width * 0.75, y:  this.viewport.height}, ()=>{
                this.showMonolog(["Ich brauche eine Unterschrift auf diesem Antrag."], ()=>{
                    this.noel.play("noel_left");
                    this.tweens.add({
                        targets: this.noel,
                        x: this.viewport.width * 0.79,
                        duration: 1000,
                        ease: 'Power1',
                        onComplete: () => {
                            this.showCharacterMonolog(this.noel, ["Ich habe keine Zeit für sowas.", "Hier, nimm diesen Stift und fülle es selbst aus!"], ()=>{
                                this.addInventoryAssets(['invPen']);
                                this.controls.updateAssetsTaken();
                                this.updateGameState({
                                    progress: {
                                        formShownToNoel: true
                                    }
                                });
                                this.noel.play('noel_right');
                                this.tweens.add({
                                    targets: this.noel,
                                    x: this.viewport.width * this.noelRelativeX,
                                    duration: 1000,
                                    ease: 'Power1',
                                    onComplete: () => {
                                        this.startBackgroundTalk();
                                        this.moveSophie({x: this.viewport.width * 0.4, y:  this.viewport.height},()=>{
                                            this.showMonolog(["Das ist wirklich das sinnloseste Formular der Welt."], ()=>{
                                                this.backToDefault();
                                            });
                                        });
                                    }
                                });
                            });
                        }
                    });
                })
            },'walk_right', true);
        }
    }

    useOfficeNoelInvCatNotice() {
        this.useInvCatNoticeWithOfficeNoel();
    }

    useInvCatNoticeWithOfficeNoel() {
        this.focusInteraction();
        if (this.gameState.progress.lightHouseProjectGiven) {
            this.showMonolog(["Es scheint für Noel ein sehr traumatisches Thema zu sein.", "Ich möchte sie nicht emotional überfordern."], ()=>{
                this.backToDefault();
            });
        } else {
            this.stopBackgroundTalk();
            this.moveSophie({x: this.viewport.width * 0.75, y:  this.viewport.height}, ()=>{
                this.showMonolog(["Ich habe das hier gefunden."], ()=>{
                    this.noel.play("noel_left");
                    this.tweens.add({
                        targets: this.noel,
                        x: this.viewport.width * 0.79,
                        duration: 1000,
                        ease: 'Power1',
                        onComplete: () => {
                            this.showCharacterMonolog(this.noel, ["Oh, meine Katze Mimi.", "***SCHLUCHZ***", "Sie ist mir vor Jahren genommen worden.", "Ich vermisse sie sehr."], ()=>{
                               this.showMonolog(["Das tut mir sehr leid.", "Wenn ich sie finde, werde ich sie dir zurückbringen."], ()=>{
                                   this.showCharacterMonolog(this.noel, ["Das ist sehr nett von dir.", "Warte, ich habe da gerade eine sehr gute Idee."], ()=>{
                                       this.showMonolog(["Jetzt bin ich gespannt."], ()=>{
                                           this.showCharacterMonolog(this.noel, ["Ich werde diese Company agil machen!"], ()=>{
                                               this.showMonolog(["Das kommt jetzt irgendwie... überraschend."], ()=>{
                                                   this.showCharacterMonolog(this.noel, ["Ich mache dich zu meinem V.P. of Agile."
                                                                            , "Wir starten mit einem Leuchtturmprojekt in Team ALOHA."
                                                                        ,"Von denen kommt eh immer nichts Gescheites rum."], ()=>{
                                                       this.showMonolog(["Wir könnten es mal mit Scrum versuchen?"], ()=>{
                                                           this.showCharacterMonolog(this.noel, ["Ich will, dass es bis morgen umgesetzt ist."
                                                               ,"Und jetzt lass mich allein.", "Ich muss noch eine wichtige Rede vorbereiten."], ()=>{
                                                               this.updateGameState({
                                                                   progress: {
                                                                       lightHouseProjectGiven: true
                                                                   }
                                                               });
                                                               this.changeScene('ElevatorScene', 'lightHouseProjectGiven');
                                                           });
                                                       });
                                                   });
                                               });
                                           });
                                       });
                                   });
                               });
                            });
                        }
                    });
                })
            },'walk_right', true);
        }
    }

    takeOfficeMagnet() {
        this.updateGameState({
            progress: {
                officeMagnetTaken: true
            }
        });
        return false;
    }
}