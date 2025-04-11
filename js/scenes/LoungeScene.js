class LoungeScene extends BaseScene {
    constructor() {
        super({ key: 'LoungeScene' });
    }

    create() {
        super.create();
        this.controls.show();

        this.shaker = this.add.image(this.viewport.width / 2, this.viewport.height / 2
            , 'loungeShaker')
        this.shaker.setOrigin(0.5, 0.5);
        this.shaker.setDepth(this.bg.depth + 2);

        this.coke = this.add.image(this.viewport.width * 0.67
            , this.viewport.height * 0.455
            , 'loungeCoke')
            .setScale(0.13)
            .setVisible(false)
            .setOrigin(0.5, 0.5)
            .setDepth(this.bg.depth + 1);

        if (this.gameState.progress.bottleOpenerTaken) {
            this.interactiveObjects['loungeBottleOpener'].gameObject.setVisible(false);
        }


        this.backToDefault();
    }

    useMeetingRoomEntry() {
        this.focusInteraction();
        this.moveSophie({x: this.viewport.width * 0.445, y: this.viewport.height}, ()=>{
            this.changeScene('MeetingScene');
        }, 'back', true);
    }

    useLoungeExit() {
        this.focusInteraction();
        this.moveSophie({x: this.viewport.width * 1.1, y:  this.viewport.height}, ()=>{
            this.changeScene('ElevatorScene');
        },'walk_right', true);
    }

    shakeShaker(onComplete) {

        // Ursprüngliche Position speichern
        const originalX = this.shaker.x;
        const originalY = this.shaker.y;

        // Konfiguration für das Shaken
        const shakeDuration = 75; // Kurze Dauer für schnelle Bewegungen
        const yShakeDistance = 4; // Kleinere vertikale Bewegungsdistanz
        const xShakeDistance = 1; // Sehr geringe horizontale Bewegungsdistanz

        // Gesamtanzahl der Shake-Bewegungen
        const totalShakes = 15; // Mehrere Bewegungen für einen guten Shake-Effekt
        let currentShake = 0;

        // Soundeffekte definieren - mit unterschiedlichen Positionen
        const soundEffects = [
            { text: "RÜTTEL", offsetX: -70, offsetY: -50 },
            { text: "SCHÜTTEL", offsetX: 80, offsetY: -40 },
            { text: "KLACK", offsetX: -60, offsetY: 60 },
            { text: "KLONG", offsetX: 70, offsetY: 40 }
        ];

        // Funktion für eine einzelne Shake-Bewegung
        const doSingleShake = () => {
            // Abwechselnde Richtung für Y-Achse
            const yOffset = (currentShake % 2 === 0) ? yShakeDistance : -yShakeDistance;

            // Leichte X-Bewegung mit anderer Frequenz für natürlicheres Aussehen
            const xOffset = (currentShake % 3 === 0) ? xShakeDistance :
                (currentShake % 3 === 1) ? -xShakeDistance : 0;

            // Soundeffekte bei bestimmten Bewegungen
            if (currentShake % 4 === 0 && Math.floor(currentShake / 4) < soundEffects.length) {
                const soundIndex = Math.floor(currentShake / 4);
                const effect = soundEffects[soundIndex];

                // Explizite absolute Positionen für den Sound berechnen
                const soundX = (this.shaker.x + this.viewport.width * 0.17) + effect.offsetX;
                const soundY = (this.shaker.y + this.viewport.height * 0.08) + effect.offsetY;

                // Direkter Aufruf mit konsistenten Parametern
                this.soundEffects.play(effect.text, soundX, soundY, {
                    duration: 800, // Längere Dauer damit der Text sichtbar bleibt
                    depth: 10000, // Sehr hoher Depth-Wert um sicherzustellen, dass es über allem anderen liegt
                    style: {
                        fontSize: '36px',
                        fill: '#ff0000', // Hellere Farbe für bessere Sichtbarkeit
                        fontFamily: 'Arial, sans-serif',
                        stroke: '#000000',
                        strokeThickness: 5
                    }
                });

                // Debug-Ausgabe
                console.log(`Sound played: ${effect.text} at position (${soundX}, ${soundY})`);
            }

            // Shaker bewegen - primär Y-Achse mit leichter X-Komponente
            this.tweens.add({
                targets: this.shaker,
                x: originalX + xOffset,
                y: originalY + yOffset,
                duration: shakeDuration,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    currentShake++;
                    if (currentShake < totalShakes) {
                        // Nächste Shake-Bewegung
                        doSingleShake();
                    } else {
                        // Zurück zur Ausgangsposition
                        this.tweens.add({
                            targets: this.shaker,
                            x: originalX,
                            y: originalY,
                            duration: shakeDuration,
                            ease: 'Sine.easeOut',
                            onComplete: () => {
                                // Animation abgeschlossen
                                onComplete();
                            }
                        });
                    }
                }
            });
        };

        // Animation starten
        doSingleShake();
    }

    useMilkShakerWithInvCokeClosed() {
        this.useInvCokeClosedWithMilkShaker();
    }
    useInvCokeClosedWithMilkShaker() {
        this.focusInteraction();
        if (this.gameState.progress.cokeBombBuildOnce && !GameData.debug) {
            this.showMonolog(["Das war ein Experiment, dass ich nicht wiederholen möchte."], ()=>{this.backToDefault()});
        } else {
            this.shakeCokeAnimation();
        }
    }

    shakeCokeAnimation() {
        this.focusInteraction();
        this.moveSophie({x:this.viewport.width*0.65, y:this.sophie.y}, ()=>{

            this.stateManager.removeAsset(this.gameState, 'invCokeClosed', 1);
            this.controls.updateAssetsTaken();

            this.coke.setVisible(true);
            this.tweens.add({
                targets: this.coke,
                y: this.viewport.height * 0.55,
                duration: 1200,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.sophie.play('back');
                    this.shakeShaker(()=> {
                        this.tweens.add({
                            targets: this.coke,
                            y:  this.viewport.height * 0.455,
                            duration: 1200,
                            ease: 'Sine.easeInOut',
                            onComplete: () => {
                                this.sophie.play('give');
                                this.tweens.add({
                                    targets: this.sophie,
                                    x:  this.viewport.width*0.649,
                                    duration: 200,
                                    ease: 'Sine.easeInOut',
                                    onComplete: () => {
                                        this.sophie.play('back');
                                        this.coke.setVisible(false);
                                        this.addInventoryAssets(['invCokeBomb']);
                                        this.controls.updateAssetsTaken();
                                        this.backToDefault();
                                        this.updateGameState({
                                            progress: {
                                                cokeBombBuildOnce: true
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });
                }
            });
        },'give', true);
    }

    useMilkShakerWithInvCokeOpen() {
        this.useInvCokeOpenWithMilkShaker();
    }
    useInvCokeOpenWithMilkShaker() {
        this.showMonolog(["Die Flasche ist schon offen.", "Das würde den Shaker zerstören."]);
    }

    useMilkShakerWithInvCokeBomb() {
        this.useInvCokeBombWithMilkShaker();
    }

    useInvCokeBombWithMilkShaker() {
        this.showMonolog(["Einmal schütteln genügt völlig.", "Ich will keinen zu großen Schaden anrichten."]);
    }

    takeLoungeBottleOpener() {
        this.updateGameState({
            progress: {
                bottleOpenerTaken: true
            }
        });
    }

}