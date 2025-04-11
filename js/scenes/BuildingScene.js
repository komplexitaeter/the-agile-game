// BuildingScene.js - Hauptszene mit interaktiver Sophie
/* todo: MimiZettelMitKen: Miau
*   Aufzug Anzeige direkt nach Pling ändern*/
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
            this.interactiveObjects['trashBins1'].gameObject.setVisible(false);
            this.interactiveObjects['trashBins1'].gameObject.removeInteractive();
        }

        if (this.gameState.progress.trashBinsViewedTwice) {
            this.interactiveObjects['trashBins2'].gameObject.setVisible(false);
            this.interactiveObjects['trashBins2'].gameObject.removeInteractive();
        }

        if (this.gameState.progress.trashTaken) {
            this.interactiveObjects['trash'].gameObject.setVisible(false);
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

    takeLanternNotice(objectKey, worldPoint) {
       this.updateGameState({
           progress: {
               lanternNoticeTaken: true
           }
       });
    }

    viewTrashBins1(objectKey, worldPoint) {
        this.updateGameState({
            progress: {
                trashBinsViewedOnce: true
            }
        });

    }

    viewTrashBins2(objectKey, worldPoint) {
        this.updateGameState({
            progress: {
                trashBinsViewedTwice: true
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
                        this.showMonolog(
                            ["Da steht R9.012 Ernie & Bert", "Ein weiteres Milliardenunternehmen, das Meetingräume nach der Sesamstraße benennt."],
                            ()=>{
                                this.sophie.play('walk_left');
                                this.updateGameState({
                                    progress: {
                                        meetingRoomKnown: true
                                    }
                                });
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

                        this.tweens.add({
                            targets: this.sophie,
                            alpha: 0,      // Leicht ausblenden während sie reingeht
                            duration: 400,  // Dauer der Animation
                            ease: 'Sine.easeOut',
                            onComplete: () => {
                                this.changeScene('LobbyScene');
                            }
                        });

                    }
                });
            },
            'back',
            true
        );
    }

}