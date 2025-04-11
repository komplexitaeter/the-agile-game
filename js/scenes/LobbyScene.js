// LobbyScene.js
/*
todo: [Warning] Missing animation: null (phaser.min.js, line 1) -> vermutlich beim Formular abholen

 */
class LobbyScene extends BaseScene {
    constructor() {
        super({ key: 'LobbyScene' });
        this.keyboardSoundTimer = null;
        this.currentKeyboardTween = null;
    }

    create() {
        super.create();
        this.controls.show();

        this.elevator_bg = this.add.image(this.viewport.width / 2, this.viewport.height / 2
            , 'lobby_elevator_bg')
        this.elevator_bg.setOrigin(0.5, 0.5);
        this.elevator_bg.setDepth(this.bg.depth - 2);

        this.elevator_dore_left = this.add.image(this.viewport.width / 2, this.viewport.height / 2
            , 'lobby_elevator_dore_left')
        this.elevator_dore_left.setOrigin(0.5, 0.5);
        this.elevator_dore_left.setDepth(this.bg.depth - 1);

        this.elevator_dore_right = this.add.image(this.viewport.width / 2, this.viewport.height / 2
            , 'lobby_elevator_dore_right')
        this.elevator_dore_right.setOrigin(0.5, 0.5);
        this.elevator_dore_right.setDepth(this.bg.depth - 1);

        this.isElevatdorOpen = false;

        if (this.entryPoint === 'elevator') {
            this.sophie.x = this.viewport.width * 0.85;
            this.sophie.play('walk_left');
        } else {
            this.sophie.x = this.viewport.width * 0.3;
            this.sophie.play('walk_right');
        }

        this.ken = null;
        this.kenRelativeX = 0.56;
        this.setupKen();
        this.ken.play('ken_slight_left');

        this.dialogSwitcher = new DialogSwitcher(this);



        // Direkt beim Laden der Szene Tastaturgeräusche starten
        this.playKeybordSounds = false;
        this.backToDefault();

        const deskX = this.viewport.width * 0.506;
        const deskY = this.viewport.height * 0.705;

        this.lobbyDesk = this.add.image(deskX, deskY, 'lobbyDesk')
            .setDepth(11)
            .setOrigin(0.5, 0.5);

    }

    setupKen() {
        const kenScale = 0.33;
        const kenBottomPosition = 0.82;

        // Sophie an der relativen Position platzieren
        const kenX = this.viewport.width * this.kenRelativeX;
        const kenY = this.viewport.height * kenBottomPosition; // Anpassbare Bodenposition

        this.ken = this.add.sprite(kenX, kenY, 'ken', 0).setOrigin(0.5, 1);
        this.ken.key = 'ken';
        this.ken.setScale(kenScale); // Anpassbare Skalierung
        this.ken.setDepth(10);

        // Animationen
        if (!this.anims.exists('ken_front')) {
            this.anims.create({ key: 'ken_front', frames: [{ key: 'ken', frame: 0 }] });
            this.anims.create({ key: 'ken_slight_left', frames: [{ key: 'ken', frame: 2 }] });
            this.anims.create({ key: 'ken_walk_left', frames: [{ key: 'ken', frame: 3 }] });
            this.anims.create({ key: 'ken_back', frames: [{ key: 'ken', frame: 4 }] });
            this.anims.create({ key: 'ken_walk_right', frames: [{ key: 'ken', frame: 5 }] });
        }
    }

    focusInteraction(stopKeyboardSounds = true) {
        if (stopKeyboardSounds) {
            this.stopKeyboardSounds();
        }
        super.focusInteraction();
    }
    backToDefault() {
        super.backToDefault();
        this.startKeyboardSounds();
    }

    startKeyboardSounds() {
        this.playKeybordSounds = true;

        // Sicherheitshalber vorherigen Timer anhalten
        if (this.keyboardSoundTimer) {
            this.keyboardSoundTimer.remove();
            this.keyboardSoundTimer = null;
        } else {
            this.playKeyboardSound();
        }

        // Timer mit variabler Verzögerung für mehr Natürlichkeit
        this.scheduleNextKeyboardSound();
    }

    scheduleNextKeyboardSound() {
        if (!this.playKeybordSounds) return;

        // Zufälliger Delay zwischen 1800 und 2500 ms für natürlicheres Tippen
        const randomDelay = Phaser.Math.Between(1700, 3000);

        this.keyboardSoundTimer = this.time.addEvent({
            delay: randomDelay,
            callback: () => {
                this.playKeyboardSound();
                this.scheduleNextKeyboardSound(); // Nächstes Geräusch planen
            },
            callbackScope: this
        });
    }

    playKeyboardSound(onComplete = null) {
        if (!this.playKeybordSounds) return;

        // Etwas Variation in der Position des Sounds
        const offsetX = Phaser.Math.Between(-20, 20);
        const offsetY = Phaser.Math.Between(-5, 15);

        // Zufällige Dauer zwischen 2000 und 2400 ms
        const duration = Phaser.Math.Between(2000, 2400);

        // Variation in der Schriftgröße für visuellen Effekt
        const fontSize = Phaser.Math.Between(45, 52);

        if (Phaser.Math.Between(0,99) > 20 ) {
            this.ken.play('ken_slight_left');
        } else {
            this.ken.play('ken_walk_left');
        }

        // Speichern des Sound-Effekt-Objekts, um es später stoppen zu können
        this.currentKeyboardSound = this.soundEffects.play("KLICK-KLACK",
            this.ken.x + offsetX,
            this.ken.y - this.viewport.height*0.2 + offsetY,
            {
                duration: duration,
                depth: this.ken.depth + 10,
                style: {
                    fontSize: `${fontSize}px`,
                    fill: '#ff6f61',
                    fontFamily: 'Courier New, monospace',
                    stroke: '#000000',
                    strokeThickness: 7
                },
                onComplete: onComplete
            }
        );
    }

    stopKeyboardSounds() {
        this.playKeybordSounds = false;

        // Timer anhalten
        if (this.keyboardSoundTimer) {
            this.keyboardSoundTimer.remove();
            this.keyboardSoundTimer = null;
        }

        // Aktuellen Sound-Effekt stoppen, falls vorhanden
        if (this.currentKeyboardSound) {
            this.currentKeyboardSound.destroy();
            this.currentKeyboardSound = null;
        }
    }

    useAccessControl()  {

        this.focusInteraction(false);


        if (this.gameState.progress.accessControlUsedOnce) {

            this.moveSophie({x: this.viewport.width* 0.8, y: 0}, ()=>{
                this.showMonolog(["Das kenne ich schon.", "Ich brauche eine Zugangskarte, Mut, Ausdauer und Verstand."]);
                this.backToDefault();
            });
        } else {

            this.moveSophie({x: this.viewport.width, y: 0},
                () => {
                    this.stopKeyboardSounds();
                    this.sophie.play('walk_right');
                    this.ken.play('ken_walk_right');
                    this.showCharacterMonolog(this.ken, ["He!"], () => {
                        this.sophie.play('walk_left');
                        this.showCharacterMonolog(this.ken, ["Der Aufzug wird mit einer Zugangskarte freigegeben."
                                , "Es benötigt Mut, Ausdauer und Verstand, um an so eine Karte zu gelangen."
                                , "Viele haben es versucht."
                                , "Nur wenige waren erfolgreich."],
                            () => {

                                this.updateGameState({
                                    progress: {
                                        accessControlUsedOnce: true
                                    }
                                });

                                this.showMonolog(["Danke!", "Ich schaue mich hier nur mal um."],
                                    () => {
                                        this.showCharacterMonolog(this.ken, ["Ach so. Ok."],
                                            () => {
                                                this.backToDefault();
                                                this.ken.play('ken_slight_left');
                                            })
                                    })
                            });
                    });
                }
            );
        }
    }

    talkToLobbyKen () {
        this.focusInteraction(false);

        let switcherOptions = [];

        this.moveSophie({x: this.viewport.width * 0.41, y: 0},
            () => {
                this.stopKeyboardSounds();
               this.showMonolog(["Hallo!"],
                   ()=>{
                        this.stopKeyboardSounds();
                        this.ken.play('ken_walk_left');
                        this.showCharacterMonolog(this.ken, ["Ja?"],
                            ()=>{
                                if (!this.gameState.progress.everTalkedToKen) {
                                    this.subTalkKenEmotional();
                                } else {
                                    switcherOptions.push({
                                        text: "Ich bin Sophie Plaice und ich möchte diese Company agil machen.",
                                        callback: () => this.subTalkKenEmotional()
                                    });

                                    if (this.gameState.progress.hasAccessForm) {
                                        switcherOptions.push({
                                            text: "Ich habe dieses Formular. Damit kann ich den Aufzug benutzen.",
                                            callback: () => this.subTalkKenAccessForm()
                                        });
                                    }

                                    if (this.gameState.progress.meetingRoomKnown
                                        && this.gameState.progress.accessControlUsedOnce
                                        && !this.gameState.progress.hasAccessCard) {
                                        switcherOptions.push({
                                            text: "Ich habe gleich ein Meeting im Raum R9.012 Ernie & Bert und brauche die Zugangskarte.",
                                            callback: () => this.subTalkKenRoomTrick()
                                        });
                                    }

                                    switcherOptions.push({
                                        text: "Ich schaue mich nur etwas um.",
                                        callback: () => this.subTalkKenAbort()
                                    });

                                    this.dialogSwitcher.showOptions(switcherOptions);
                                }
                            });
                   });
            }, 'walk_right', true
        );

        return true;
    }

    subTalkKenEmotional() {

        this.showMonolog(["Ich bin Sophie Plaice und ich möchte diese Company agil machen."],()=>{
            this.showCharacterMonolog(this.ken, ["Externer oder interner Mitarbeiter?"],
                ()=> {
                    this.updateGameState({
                        progress: {
                            everTalkedToKen: true
                        }
                    });

                    let switcherOptions = [];

                    switcherOptions.push({
                        text: "Ich bin eine interne Mitarbeiterin.",
                        callback: () => this.subTalkKenEmoInternal()
                    });

                    if (!this.gameState.progress.hasAccessForm) {
                        switcherOptions.push({
                            text: "Ich komme von extern.",
                            callback: () => this.subTalkKenEmoExternal()
                        });
                    }

                    switcherOptions.push({
                        text: "Ich schaue mich nur etwas um.",
                        callback: () => this.subTalkKenAbort()
                    });


                    this.dialogSwitcher.showOptions(switcherOptions);


                });
        });
    }

    subTalkKenEmoInternal() {
        this.showMonolog(["Ich bin eine interne Mitarbeiterin."],()=>{
            this.showCharacterMonolog(this.ken, ["Personalnummer?"],()=>{

                let switcherOptions = [];

                switcherOptions.push({
                    text: "Es ist die Nummer 1.",
                    callback: () => {
                        this.showMonolog(["Es ist die Nummer 1."], ()=>{
                            this.showCharacterMonolog(this.ken, ["Ja klar.", "Haben wir gelacht."],()=>{
                                this.backToDefault();
                            } );
                        });
                    }
                });

                switcherOptions.push({
                    text: "2442",
                    callback: () => {
                        this.showMonolog(["2442"], ()=>{
                            this.showCharacterMonolog(this.ken, ["Netter Versuch.", "Aber veralbern kann ich mich selber."],()=>{
                                this.backToDefault();
                            } );
                        });
                    }
                });

                const employeeNumber = Phaser.Math.Between(1000000000, 9999999999);

                switcherOptions.push({
                    text: "Meine Personalnummer ist die " + employeeNumber + ".",
                    callback: () => {
                        this.showMonolog(["Meine Personalnummer ist die " + employeeNumber + "."], ()=>{
                            this.showCharacterMonolog(this.ken, ["Moment.", "Ich schaue da mal nach."],()=>{
                                this.playKeybordSounds = true;
                                this.playKeyboardSound(()=>{
                                    this.showCharacterMonolog(this.ken, ["Du Schlitzohr.", "Fast hättest du mich gehabt."],()=>{
                                        this.showMonolog(["Ich gebe mein Bestes."],()=>{
                                            this.backToDefault();
                                        });
                                    } );
                                });
                            } );
                        });
                    }
                });

                this.dialogSwitcher.showOptions(switcherOptions);

            });
        });
    }

    subTalkKenEmoExternal() {
        this.showMonolog(["Ich komme von extern."],()=>{
            this.showCharacterMonolog(this.ken, ["Du musst dieses Zugangsformular von einem Mitarbeiter ausfüllen lassen.",
            "Es gilt nur mit der Unterschrift eines Managers."], ()=>{
                this.showMonolog(["Aha.", "Das ist sehr ... \"hilfreich\"."], ()=>{
                    this.moveSophie({x: this.viewport.width * 0.56, y: 0},
                        () => {

                            this.addInventoryAssets(['invAccessForm']);
                            this.controls.updateAssetsTaken();
                            this.updateGameState({
                                progress: {
                                    hasAccessForm: true
                                }
                            });

                            this.moveSophie({x: this.viewport.width * 0.35, y: 0},
                                () => {
                                    this.showMonolog(["Was auch immer ich damit anfangen soll."], ()=>{
                                        this.backToDefault();
                                    })
                                }, true);
                        }, true);
                });
            });
        });
    }

    subTalkKenAbort() {
        this.showMonolog(["Ich schaue mich nur mal um."], ()=>{
            this.showCharacterMonolog(this.ken, ["Ok, mach das. Sprich mich an, wenn du etwas brauchst."],()=>{
                this.backToDefault();
            });
        });
    }

    subTalkKenAccessForm() {
        this.focusInteraction();
        this.moveSophie({x: this.viewport.width * 0.52, y: 0},()=>{
            this.stopKeyboardSounds();
            this.showMonolog(["Ich habe dieses Formular. Damit kann ich den Aufzug benutzen."],()=>{
                this.sophie.play('back');
                this.showCharacterMonolog(this.ken,["Es ist nicht ausgefüllt und auch nicht unterschrieben.", "Damit kommst du hier nirgendwo hin."],()=>{
                    this.moveSophie({x: this.viewport.width * 0.34, y: 0},()=>{
                        this.showMonolog(["Bürokratie tötet Agile."], ()=>{
                            this.backToDefault();
                        });
                    });
                });
            });
        },'give', true);
    }

    useInvAccessFormWithLobbyKen() {
        this.subTalkKenAccessForm();
    }

    useLobbyKenWithInvAccessForm() {
        this.subTalkKenAccessForm();
    }

    subTalkKenRoomTrick() {
        this.showMonolog(["Ich habe gleich ein Meeting im Raum R9.012 Ernie & Bert."
            , "Hat schon jemand die Zugangskarte für den Meetingraum abgeholt?"], ()=>{
            this.showCharacterMonolog(this.ken, ["Moment, ich schaue da mal nach,"], ()=>{
                this.ken.play('ken_slight_left');
                this.playKeybordSounds = true;
                this.playKeyboardSound(()=>{
                    this.showCharacterMonolog(this.ken, ["Nein, da war noch niemand hier."
                        , "Komm her, ich gebe sie dir."], ()=>{
                        this.moveSophie({x: this.viewport.width * 0.52, y: 0},()=>{

                            this.addInventoryAssets(['invAccessCard']);
                            this.controls.updateAssetsTaken();

                           this.updateGameState({
                                progress: {
                                    hasAccessCard: true
                                }
                            });

                            this.showMonolog(["Danke, dann kann ich schon mal das Meeting vorbereiten."], ()=>{
                                this.moveSophie({x: this.viewport.width * 0.8, y: 0}, ()=>{
                                    this.showMonolog(["Das war einfacher als gedacht."]);
                                });
                                this.backToDefault();
                            });
                        },'give', true);
                    });
                });
            });
        });
    }

    useInvAccessCardWithAccessControl() {
        this.focusInteraction(false);

        this.moveSophie(this.interactiveObjects['accessControl'].gameObject, ()=>{



            this.soundEffects.play("PLING",
                this.interactiveObjects['elevator'].gameObject.x,
                this.interactiveObjects['elevator'].gameObject.y - (this.viewport.width * 0.05),
                {
                    duration: 1000,
                    depth: this.ken.depth + 10,
                    style: {
                        fontSize: `40px`,
                        fill: '#ff6f61',
                        fontFamily: 'Courier New, monospace',
                        stroke: '#000000',
                        strokeThickness: 7
                    },
                    onComplete: ()=>{
                        this.tweens.add({
                            targets: this.elevator_dore_left,
                            x: this.viewport.width * 0.475,
                            duration: 1200,
                            ease: 'Sine.easeOut',
                            onComplete: () => {
                                this.backToDefault();
                                this.isElevatdorOpen = true;
                            }
                        });
                        this.tweens.add({
                            targets: this.elevator_dore_right,
                            x: this.viewport.width * 0.52,
                            duration: 750,
                            ease: 'Sine.easeOut'
                        });
                    }
                }
            );
        });
    }

    useElevator() {
        this.focusInteraction(false);

        this.updateGameState({
            progress: {
                floorDigit: 'EG'
            }
        });

        if (this.isElevatdorOpen) {
            this.moveSophie(this.interactiveObjects['elevator'].gameObject, ()=>{
                this.changeScene('ElevatorScene');
            });
        } else {
            this.moveSophie(this.interactiveObjects['elevator'].gameObject, ()=>{
                this.soundEffects.play("MEEAAAP MOP",
                    this.interactiveObjects['elevator'].gameObject.x,
                    this.interactiveObjects['elevator'].gameObject.y - (this.viewport.width * 0.05),
                    {
                        duration: 2000,
                        depth: this.ken.depth + 10,
                        style: {
                            fontSize: `40px`,
                            fill: '#ff6f61',
                            fontFamily: 'Courier New, monospace',
                            stroke: '#000000',
                            strokeThickness: 7
                        },
                        onComplete: ()=>{
                            this.showMonolog(["Er lässt sich nicht öffnen."]);
                            this.backToDefault();
                        }
                    }
                );
            });
        }
    }

    useLobbyExit() {
        this.focusInteraction(false);

        this.moveSophie({x: this.viewport.width * 0.31, y: 0},
            () => {
                this.moveSophie({x: this.viewport.width * 0.33, y: 0},
                    () => {

                        this.tweens.add({
                            targets: this.sophie,
                            y: this.sophie.y - this.viewport.height * 0.085,          // Nach oben bewegen (ins Gebäude hinein)
                            scaleX: 0.5,     // Horizontal verkleinern für Perspektive
                            scaleY: 0.5,     // Vertikal verkleinern für Perspektive
                            x: this.viewport.width * 0.35,
                            duration: 1500,  // Dauer der Animation
                            ease: 'Sine.easeOut',
                            onComplete: () => {

                                this.stopKeyboardSounds();

                                this.sophie.play('walk_right');
                                this.sophie.setDepth(9);


                                this.tweens.add({
                                    targets: this.sophie,
                                    x: this.viewport.width * 0.52,
                                    duration: 1200,
                                    ease: 'Sine.easeOut',
                                    onComplete: () => {

                                        this.sophie.play('back');

                                        this.tweens.add({
                                            targets: this.sophie,
                                            y: this.sophie.y - this.viewport.height * 0.29,          // Nach oben bewegen (ins Gebäude hinein)
                                            scaleX: 0.38,     // Horizontal verkleinern für Perspektive
                                            scaleY: 0.38,     // Vertikal verkleinern für Perspektive
                                            alpha: 0.8,//                                       duration: 1000,  // Dauer der Animation
                                            ease: 'Sine.easeOut',
                                            onComplete: () => {

                                                this.ken.play('ken_back');

                                                this.tweens.add({
                                                    targets: this.sophie,
                                                    alpha: 0,      // Leicht ausblenden während sie reingeht
                                                    duration: 400,  // Dauer der Animation
                                                    ease: 'Sine.easeOut',
                                                    onComplete: () => {
                                                        this.changeScene('BuildingScene');
                                                    }
                                                });

                                            }
                                        });

                                    }
                                });

                            }
                        });

                    },
                    'back',
                    true
                );
            },
            'walk_right',
            true
        );
    }
}