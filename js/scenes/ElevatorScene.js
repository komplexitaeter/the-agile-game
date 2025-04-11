class ElevatorScene extends BaseScene {
    constructor() {
        super({ key: 'ElevatorScene' });

        this.floors = [
            {digit: 'G.O.A.T', lable: 'CEO', sceneKey: 'CEOOfficeScene'},
            {digit: '09', lable: 'Meetingräume', sceneKey: 'LoungeScene'},
            {digit: 'EG', lable: 'Lobby (EG)', sceneKey: 'LobbyScene'},
            {digit: '-1', lable: 'Toilette & IT', sceneKey: 'BasementScene'},
        ];
    }

    create() {
        super.create();
        this.controls.show();

        this.dialogSwitcher = new DialogSwitcher(this);

        this.dore_bg = this.add.image(this.viewport.width / 2, this.viewport.height / 2
            , 'elevator_dore_bg')
        this.dore_bg.setOrigin(0.5, 0.5);
        this.dore_bg.setDepth(this.bg.depth - 2);

        this.dore_left = this.add.image(this.viewport.width / 2 + (this.viewport.width * -0.075)
            , this.viewport.height / 2
            , 'elevator_dore_left')
        this.dore_left.setOrigin(0.5, 0.5);
        this.dore_left.setDepth(this.bg.depth - 1);

        this.dore_right = this.add.image(this.viewport.width / 2 + (this.viewport.width * 0.075)
            , this.viewport.height / 2
            , 'elevator_dore_right')
        this.dore_right.setOrigin(0.5, 0.5);
        this.dore_right.setDepth(this.bg.depth - 1);

        if (this.gameState.progress.manifestTaken) {
            this.interactiveObjects['manifest'].gameObject.setVisible(false);
        }

        this.floorDisplay =this.add.text(
            this.viewport.width * 0.505,
            this.bg.y - this.viewport.height * 0.3,
            '0',
            {
                fontFamily: 'Courier New, monospace',
                fontSize: '28px',
                fontStyle: 'bold',
                color: '#FFFFFF',
                align: 'center',
            }
        ).setDepth(20)
            .setFixedSize(this.viewport.width * 0.4, 0)
            .setOrigin(0.5);

        this.updateFloorDisplay();

        if (this.entryPoint === 'lightHouseProjectGiven') {
            this.showMonolog(["Mein größter Traum ist wahr geworden."
                                    ,"Ich habe keine Ahnung was ich jetzt tun soll."], ()=>{
                this.backToDefault();
            })
        } else {
            this.backToDefault();
        }

    }

    takeManifest(objectKey, worldPoint) {
        this.updateGameState({
            progress: {
                manifestTaken: true
            }
        });
    }

    useControlPanel() {
        this.focusInteraction();
        this.moveSophie(this.interactiveObjects['controlPanel'].gameObject, ()=>{

            let switcherOptions = [];

            this.floors.forEach(f => {
                let callback;
                if (f.digit === this.gameState.progress.floorDigit) {
                    callback = ()=>{
                        this.soundEffects.play("MÖP-MOP",
                            this.viewport.width * 0.3,
                            this.viewport.height * 0.4,
                            {
                                duration: 1200,
                                depth: 30,
                                style: {
                                    fontSize: `40px`,
                                    fill: '#ff6f61',
                                    fontFamily: 'Courier New, monospace',
                                    stroke: '#000000',
                                    strokeThickness: 7
                                },
                                onComplete: ()=>{
                                    this.backToDefault();
                                }
                            }
                        );
                    }
                } else {
                    callback = ()=>  this.moveElevator(f.digit)
                }

                switcherOptions.push({
                    text: f.lable,
                    callback: () =>  callback()
                });
            })

            this.dialogSwitcher.showOptions(switcherOptions);

        });
    }

    moveElevator(floor) {
        this.focusInteraction();

        this.updateGameState({
            progress: {
                floorDigit: floor
            }
        });

        this.moveDore('close', ()=>{
            this.shakeElevator(()=>{

                this.updateFloorDisplay(floor);

                this.soundEffects.play("BLING",
                    this.viewport.width * 0.3,
                    this.viewport.height * 0.4,
                    {
                        duration: 1000,
                        depth: 30,
                        style: {
                            fontSize: `40px`,
                            fill: '#ff6f61',
                            fontFamily: 'Courier New, monospace',
                            stroke: '#000000',
                            strokeThickness: 7
                        },
                        onComplete: ()=>{
                            this.moveDore('open')
                            this.backToDefault();
                        }
                    }
                );
            });
        });
    }

    moveDore(mode, onComplete = ()=>{}) {

        console.log(mode);

        let leftX = this.viewport.width / 2 + (this.viewport.width * -0.075);
        let rightX = this.viewport.width / 2 + (this.viewport.width * 0.075);

        if (mode === 'close') {
            leftX = this.viewport.width / 2;
            rightX = this.viewport.width / 2;
        }

        this.tweens.add({
            targets: this.dore_left,
            x: leftX,
            duration: 1200,
            ease: 'Sine.easeOut',
            onComplete: () => onComplete()
        });
        this.tweens.add({
            targets: this.dore_right,
            x: rightX,
            duration: 1200,
            ease: 'Sine.easeOut'
        });
    }

    shakeElevator(onComplete = ()=>{}) {
        // Speichere alle Originalwerte
        const originalValues = {
            bg: { x: this.bg.x, y: this.bg.y, scaleX: this.bg.scaleX, scaleY: this.bg.scaleY },
            doreLeft: { x: this.dore_left.x, y: this.dore_left.y, scaleX: this.dore_left.scaleX, scaleY: this.dore_left.scaleY },
            doreRight: { x: this.dore_right.x, y: this.dore_right.y, scaleX: this.dore_right.scaleX, scaleY: this.dore_right.scaleY },
            doreBg: { x: this.dore_bg.x, y: this.dore_bg.y, scaleX: this.dore_bg.scaleX, scaleY: this.dore_bg.scaleY },
            sophie: this.sophie ? { x: this.sophie.x, y: this.sophie.y, scaleX: this.sophie.scaleX, scaleY: this.sophie.scaleY } : null,
            manifest: this.interactiveObjects['manifest']?.gameObject ?
                { x: this.interactiveObjects['manifest'].gameObject.x,
                    y: this.interactiveObjects['manifest'].gameObject.y,
                    scaleX: this.interactiveObjects['manifest'].gameObject.scaleX,
                    scaleY: this.interactiveObjects['manifest'].gameObject.scaleY } : null,
            floorDisplay: {
                x: this.floorDisplay.x,
                y: this.floorDisplay.y,
                fontSize: parseInt(this.floorDisplay.style.fontSize)
            }
        };

        const scaleFactor = 1.008;

        // Skalierung für die meisten Elemente
        this.bg.setScale(this.bg.scaleX * scaleFactor, this.bg.scaleY * scaleFactor);
        this.dore_left.setScale(this.dore_left.scaleX * scaleFactor, this.dore_left.scaleY * scaleFactor);
        this.dore_right.setScale(this.dore_right.scaleX * scaleFactor, this.dore_right.scaleY * scaleFactor);
        this.dore_bg.setScale(this.dore_bg.scaleX * scaleFactor, this.dore_bg.scaleY * scaleFactor);

        if (this.sophie) {
            this.sophie.setScale(this.sophie.scaleX * scaleFactor, this.sophie.scaleY * scaleFactor);
        }

        // Manifest mit korrigierter Position - KEINE X-Anpassung mehr
        if (this.interactiveObjects['manifest']?.gameObject) {
            const manifest = this.interactiveObjects['manifest'].gameObject;
            manifest.setScale(manifest.scaleX * scaleFactor, manifest.scaleY * scaleFactor);
            // Leicht nach rechts verschieben
            manifest.x = manifest.x + 6; // 5 Pixel nach rechts
        }

        this.sophie.x = this.sophie.x - 2;
        this.sophie.y = this.sophie.y + 2;

        // Text vergrößern und Position feiner anpassen (weiter nach oben)
        this.floorDisplay.setFontSize(Math.round(originalValues.floorDisplay.fontSize * scaleFactor));
        // Weiter nach oben anpassen (-12 statt -8)
        this.floorDisplay.y = originalValues.floorDisplay.y -2;

        // Rest der Funktion bleibt unverändert
        this.time.delayedCall(250, () => {
            let tweenCount = 0;
            const totalTweens = 12;

            const allObjects = [
                this.bg, this.dore_left, this.dore_right, this.dore_bg, this.floorDisplay
            ];

            if (this.sophie) allObjects.push(this.sophie);
            if (this.interactiveObjects['manifest']?.gameObject) {
                allObjects.push(this.interactiveObjects['manifest'].gameObject);
            }

            const doSingleTween = (isUp) => {
                const yOffset = isUp ? -6 : 6;

                this.tweens.add({
                    targets: allObjects,
                    y: `+=${yOffset}`,
                    duration: 95,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        tweenCount++;
                        if (tweenCount < totalTweens) {
                            doSingleTween(tweenCount % 2 === 0);
                        } else {
                            resetAllObjects();
                        }
                    }
                });
            };

            const resetAllObjects = () => {
                this.bg.x = originalValues.bg.x;
                this.bg.y = originalValues.bg.y;
                this.bg.setScale(originalValues.bg.scaleX, originalValues.bg.scaleY);

                this.dore_left.x = originalValues.doreLeft.x;
                this.dore_left.y = originalValues.doreLeft.y;
                this.dore_left.setScale(originalValues.doreLeft.scaleX, originalValues.doreLeft.scaleY);

                this.dore_right.x = originalValues.doreRight.x;
                this.dore_right.y = originalValues.doreRight.y;
                this.dore_right.setScale(originalValues.doreRight.scaleX, originalValues.doreRight.scaleY);

                this.dore_bg.x = originalValues.doreBg.x;
                this.dore_bg.y = originalValues.doreBg.y;
                this.dore_bg.setScale(originalValues.doreBg.scaleX, originalValues.doreBg.scaleY);

                if (this.sophie && originalValues.sophie) {
                    this.sophie.x = originalValues.sophie.x;
                    this.sophie.y = originalValues.sophie.y;
                    this.sophie.setScale(originalValues.sophie.scaleX, originalValues.sophie.scaleY);
                }

                if (this.interactiveObjects['manifest']?.gameObject && originalValues.manifest) {
                    const manifest = this.interactiveObjects['manifest'].gameObject;
                    manifest.x = originalValues.manifest.x;
                    manifest.y = originalValues.manifest.y;
                    manifest.setScale(originalValues.manifest.scaleX, originalValues.manifest.scaleY);
                }

                this.floorDisplay.x = originalValues.floorDisplay.x;
                this.floorDisplay.y = originalValues.floorDisplay.y;
                this.floorDisplay.setFontSize(originalValues.floorDisplay.fontSize);

                if (onComplete) onComplete();
            };

            doSingleTween(true);
        });
    }

    updateFloorDisplay() {
        this.floorDisplay.text = this.gameState.progress.floorDigit;
    }

    useElevatorExit() {
        this.focusInteraction();
        this.moveSophie({x: this.viewport.width * 0.5, y: 0}, ()=>{

            this.tweens.add({
                targets: this.sophie,
                y: this.sophie.y - (this.viewport.height * 0.13),
                scale: this.sophie.scale * 0.95,
                duration: 800,
                ease: 'Sine.easeOut',
                onComplete: () => {

                    this.tweens.add({
                        targets: this.sophie,
                        y: this.sophie.y - (this.viewport.height * 0.06),
                        scale: this.sophie.scale * 0.8,
                        duration: 800,
                        alpha: 0,
                        ease: 'Sine.easeOut',
                        onComplete: () => {
                            const nexScene = this.floors.find(floor => floor.digit === this.gameState.progress.floorDigit).sceneKey;
                            this.changeScene(nexScene, 'elevator');
                        }
                    });
                }
            });
        }, 'back', true);
    }

}