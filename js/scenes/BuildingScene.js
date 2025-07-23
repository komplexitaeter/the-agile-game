// BuildingScene.js - Hauptszene mit interaktiver Sophie
class BuildingScene extends BaseScene {
    constructor() {
        super({ key: 'BuildingScene' });
    }

    create() {
        super.create();
        this.controls.show();

        if (this.gameState.progress.lanternNoticeTaken) {
            this.interactiveObjects['lanternNotice'].gameObject.setVisible(false);
        }

        if (this.gameState.progress.trashBinsViewedOnce) {
            this.interactiveObjects['trashBins'].gameObject.setVisible(false);
            this.interactiveObjects['trashBins'].gameObject.removeInteractive();
        }

        if (this.gameState.progress.trashTaken) {
            this.interactiveObjects['trash'].gameObject.setVisible(false);
        }

        if (this.gameState.progress.emptyBottleTaken) {
            this.interactiveObjects['emptyBottle'].gameObject.setVisible(false);
        }

        this.windowCover = this.add.image(this.viewport.width *0.4951, this.viewport.height *0.269
            , 'strangeWindowCover')
        this.windowCover.setOrigin(0.5, 0.5);
        this.windowCover.setDepth(12);

        this.windowPerson = this.add.image(this.viewport.width * 0.485, this.viewport.height *0.269
            , 'strangeWindowPerson')
        this.windowPerson.setOrigin(0.5, 0.5);
        this.windowPerson.setDepth(11);

        if (this.gameState.progress.meetingRoomKnown) {
            this.interactiveObjects['strangeWindow'].gameObject.setVisible(false);
            this.windowPerson.setVisible(false);
        } else {
            this.animatePerson();
        }

        if (this.entryPoint === 'fired') {
            this.sophie.play('walk_left');
            this.showMonolog(["Ich hatte mir meinen ersten Arbeitstag anders vorgestellt."], ()=>{
                this.backToDefault();
            })
        } else {
            this.backToDefault();

        }

    }

    animatePerson() {
        // Berechne die Boundaries basierend auf der Viewport-Breite
        const leftBoundary = this.viewport.width * 0.48;
        const rightBoundary = this.viewport.width * 0.505;

        // Starte die Person an der linken Grenze
        this.windowPerson.x = leftBoundary;

        // Funktion für Bewegung nach rechts
        const moveRight = () => {
            this.windowPerson.setFlipX(true); // Person schaut nach rechts
            this.tweens.add({
                targets: this.windowPerson,
                x: rightBoundary,
                duration: 3000,
                ease: 'Sine.easeInOut',
                onComplete: moveLeft
            });
        };

        // Funktion für Bewegung nach links
        const moveLeft = () => {
            this.windowPerson.setFlipX(false); // Person schaut nach links
            this.tweens.add({
                targets: this.windowPerson,
                x: leftBoundary,
                duration: 3000,
                ease: 'Sine.easeInOut',
                onComplete: moveRight
            });
        };

        // Starte die Animation
        moveRight();
    }

    takeLanternNotice(objectKey, worldPoint) {
       this.updateGameState({
           progress: {
               lanternNoticeTaken: true
           }
       });
    }

    takeEmptyBottle(objectKey, worldPoint) {
        this.updateGameState({
            progress: {
                emptyBottleTaken: true
            }
        });
    }

    viewTrashBins(objectKey, worldPoint) {
        this.updateGameState({
            progress: {
                trashBinsViewedOnce: true
            }
        });

    }

    viewStrangeWindow(objectKey, worldPoint) {
        this.updateGameState({
            progress: {
                strangeWindowViewedOnce: true
            }
        });

    }

    takeTrash(objectKey, worldPoint) {
        this.updateGameState({
            progress: {
                trashTaken: true
            }
        });
    }

    useInvCokeEmptyWithStrangeWindow() {
        this.useInvEmptyToiletPaperRoleWithStrangeWindow();
    }

    useStrangeWindowWithInvCokeEmpty() {
        this.useInvEmptyToiletPaperRoleWithStrangeWindow();
    }

    useStrangeWindowWithInvEmptyToiletPaperRole() {
        this.useInvEmptyToiletPaperRoleWithStrangeWindow();
    }

    useInvEmptyToiletPaperRoleWithStrangeWindow() {

        this.focusInteraction();

        this.showMonolog(
            ["Ich kann es als eine Art Fernrohr verwenden."],
            ()=>{

                this.moveSophie({x: this.viewport.width * 0.43, y: 0},
                    ()=>{
                        const magicSound = this.sound.add('magicSound', {volume:0.2, rate: 1});
                        magicSound.play();

                        this.showMonolog(
                            ["Da steht R9.012 Ernie & Bert", "Ein weiteres Milliardenunternehmen, das Meetingräume nach der Sesamstraße benennt."],
                            ()=>{
                                this.sophie.play('walk_left');
                                this.updateGameState({
                                    progress: {
                                        meetingRoomKnown: true
                                    }
                                });
                                this.interactiveObjects['strangeWindow'].gameObject.setVisible(false);
                                this.windowPerson.setVisible(false);
                                this.backToDefault();
                            }
                        )
                    },'back_hand_up'
                );
            }
        );

    }

    useOfficeEntry() {
        this.focusInteraction();

        this.moveSophie({x: this.viewport.width * 0.52, y: 0},
            () => {
                // Nachdem Sophie am Eingang steht und sich umgedreht hat,
                // starten wir einen weiteren Tween, der sie ins Gebäude gehen lässt

                this.tweens.add({
                    targets: this.sophie,
                    y: this.sophie.y - this.viewport.height * 0.085,          // Nach oben bewegen (ins Gebäude hinein)
                    scaleX: 0.19,     // Horizontal verkleinern für Perspektive
                    scaleY: 0.19,     // Vertikal verkleinern für Perspektive
                    alpha: 0.85,      // Leicht ausblenden während sie reingeht
                    duration: 1500,  // Dauer der Animation
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        this.walkingSound.play();
                        this.tweens.add({
                            targets: this.sophie,
                            alpha: 0,      // Leicht ausblenden während sie reingeht
                            duration: 400,  // Dauer der Animation
                            ease: 'Sine.easeOut',
                            onComplete: () => {
                                this.changeScene('LobbyScene');
                                this.walkingSound.stop();
                            }
                        });

                    }
                });
            },
            'back',
            true,
            false
        );
    }

}