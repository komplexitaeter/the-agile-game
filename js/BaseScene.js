/* todo:
    - Sophie mit ClickEventHandels (view, take, talkTo, use) versehen
 */
class BaseScene extends Phaser.Scene {
    constructor(config) {
        super(config);
    }

    init(data) {
        // Daten aus der vorherigen Szene empfangen
        this.fromScene = data.fromScene;
        this.entryPoint = data.entryPoint || 'default';

        // GameStateManager initialisieren
        this.stateManager = new GameStateManager(this.scene.key);

        // Spielstand laden
        this.gameState = this.stateManager.loadGameState();

        // Viewport-Konfiguration aus GameData übernehmen
        this.viewport = {
            width: GameData.viewport.width,    // Referenzbreite aus GameData
            height: GameData.viewport.height,  // Referenzhöhe aus GameData
            scale: 1                           // Wird beim Resize berechnet
        };

        // Szenen-Konfiguration aus GameData laden
        this.sceneConfig = GameData.scenes[this.scene.key] || {};

        // Gemeinsame Variablen
        this.maskGraphics = null;
        this.canMoveSophie = false;
        this.isMonologActive = false;

        // Resize-Event-Flag zur Vermeidung von Rekursion
        this.isResizing = false;

        // Container für interaktive Objekte
        this.interactiveObjects = {};
        this.hoverTexts = {};

        // MonologManager initialisieren
        this.monologManager = new MonologManager(this);

        // Wenn wir aus einer anderen Szene kommen und einblenden sollen
        this.fadeDuration = data.doFadeIn ? 900 : 2500;

    }

    // Delegiere Spielstandsmethoden an den Manager
    updateGameState(updates) {
        this.gameState = this.stateManager.updateGameState(this.gameState, updates);
    }

    addInventoryAssets(inventoryAssets) {
        if (inventoryAssets && Array.isArray(inventoryAssets)) {
            inventoryAssets.forEach(assetKey => {
                this.stateManager.addAsset(this.gameState, assetKey);
                console.log(`Asset '${assetKey}' zum Inventar hinzugefügt`);
            });
        }
    }

    checkForExistingGameState() {
        return this.stateManager.checkForExistingGameState();
    }


    preload() {
        // Lade alle Assets für diese Szene basierend auf der GameData-Konfiguration
        this.loadSceneAssets();
    }


    isTextureLoaded(key) {
        try {
            return this.textures && this.textures.exists && this.textures.exists(key);
        } catch (e) {
            console.warn(`Fehler beim Überprüfen der Textur ${key}:`, e);
            // Im Zweifel annehmen, dass die Textur nicht geladen ist
            return false;
        }
    }

    // Neue Methode zum Laden der Assets basierend auf der Konfiguration
    loadSceneAssets() {
        // Hole alle Assets für diese Szene aus GameData
        const assets = GameData.getAssetsForScene(this.scene.key);

        // Lade jedes Asset, wenn es noch nicht im Cache ist
        assets.forEach(asset => {
            if (!this.isTextureLoaded(asset.key)) {
                switch (asset.type) {
                    case 'image':
                        this.load.image(asset.key, asset.path);
                        break;
                    case 'spritesheet':
                        this.load.spritesheet(asset.key, asset.path, asset.frameConfig);
                        break;
                    case 'audio':
                        this.load.audio(asset.key, asset.path);
                        break;
                    // Weitere Asset-Typen können hier hinzugefügt werden
                    default:
                        console.warn(`Unbekannter Asset-Typ: ${asset.type} für ${asset.key}`);
                }
            } else {
                console.log('Already loaded: '+asset.key);
            }
        });
    }

    preloadAdjacentScenes() {
        const adjacencyMap = {
            'ThemeScene': ['IntroScene', 'OutroScene'],
            'IntroScene': ['BuildingScene'],
            'BuildingScene': ['LobbyScene'],
            'LobbyScene': ['BuildingScene', 'ElevatorScene'],
            'ElevatorScene': ['LobbyScene', 'BasementScene', 'CEOOfficeScene', 'LoungeScene'],
            'BasementScene': ['ElevatorScene', 'TeamScene'],
            'TeamScene': ['BasementScene', 'OutroScene'],
            'LoungeScene': ['ElevatorScene', 'MeetingScene'],
            'MeetingScene': ['LoungeScene'],
            'CEOOfficeScene': ['ElevatorScene', 'BuildingScene'],
            'OutroScene': []
            // Passe diese Map entsprechend deines Spiels an
        };

        const adjacentScenes = adjacencyMap[this.scene.key] || [];

        adjacentScenes.forEach(sceneKey => {
            const tempSceneConfig = GameData.scenes[sceneKey] || {};

            // Den Hintergrundschlüssel abrufen
            const bgKey = tempSceneConfig.background;

            // Verwende die sichere Überprüfungsmethode
            if (!this.isTextureLoaded(bgKey)) {
                const bgAsset = tempSceneConfig.assets?.find(asset => asset.key === bgKey);

                if (bgAsset) {
                    console.log(`Lade Hintergrundbild für nächste Szene ${sceneKey}: ${bgKey}`);
                    this.load.image(bgKey, bgAsset.path);
                }
            }

            // Lade die restlichen Assets
            const sceneAssets = GameData.getAssetsForScene(sceneKey);
            sceneAssets.forEach(asset => {
                if (!this.isTextureLoaded(asset.key)) {
                    console.log(`Lade Asset für nächste Szene ${sceneKey}: ${asset.key}`);

                    if (asset.type === 'image') {
                        this.load.image(asset.key, asset.path);
                    } else if (asset.type === 'spritesheet') {
                        this.load.spritesheet(asset.key, asset.path, asset.frameConfig);
                    }
                }
            });
        });

        // Starte den Ladevorgang
        if (this.load.list.size > 0) {
            this.load.start();
        }
    }

    create() {
        // Kamera einrichten
        this.cameras.main.centerOn(this.viewport.width / 2, this.viewport.height / 2);

        // Hintergrund einrichten
        this.setupBackground();

        // Sophie einrichten (in den meisten Szenen vorhanden)
        this.setupSophie();

        // UI-Elemente einrichten (Inventar, Controls, etc.)
        this.setupUI();

        // Interaktive Objekte einrichten
        this.setupInteractiveObjects();

        // Resize-Event-Listener
        this.setupResizeListener();

        // Sound-Effekt-Manager initialisieren, damit er für alle Szenen verfügbar ist
        this.soundEffects = new SoundEffect(this);


        // Pointer-Events
        this.input.on('pointerdown', this.handlePointerDown, this);

        // Nach kurzer Verzögerung die nächsten möglichen Szenen im Hintergrund laden
        this.time.delayedCall(500, () => {
            this.preloadAdjacentScenes();
        });
    }

    // Erweiterte shutdown-Methode mit Ressourcenbereinigung
    shutdown() {
        if (this.soundEffects) {
            this.soundEffects.destroyAll();
        }
        if (this.monologManager) {
            this.monologManager.stop();
        }
        this.tweens.killAll();
    }


    setupBackground() {
        // Hintergrund in der Mitte des Viewports platzieren
        const bgKey = this.sceneConfig.background;
        this.bg = this.add.image(this.viewport.width / 2, this.viewport.height / 2, bgKey);
        this.bg.setOrigin(0.5, 0.5);

        this.cameras.main.fadeIn(this.fadeDuration, 255, 255, 255);
    }

    setupSophie() {
        // Prüfen, ob wir Sophie in dieser Szene brauchen
        if (this.sceneConfig.hideSophie) {
            return;
        }

        // Sophie-Skalierung aus Szenen-Konfiguration oder Fallback auf globale Konstante
        const sophieScale = this.sceneConfig.sophieScale || GameData.constants.sophieScale;

        // Sophie-Y-Position aus Szenen-Konfiguration oder Fallback auf Standard (0.975)

        // Sophie an der relativen Position platzieren
        const sophieX = this.viewport.width * 0.5;

        const sophieY = this.getSophieY();

        this.sophie = this.add.sprite(sophieX, sophieY, 'sophie', 0).setOrigin(0.5, 1);
        this.sophie.key = 'sophie';
        this.sophie.setScale(sophieScale); // Anpassbare Skalierung
        this.sophie.setDepth(10000);

        // Animationen
        if (!this.anims.exists('walk_left')) {
            this.anims.create({ key: 'walk_left', frames: [{ key: 'sophie', frame: 0 }] });
            this.anims.create({ key: 'walk_right', frames: [{ key: 'sophie', frame: 1 }] });
            this.anims.create({ key: 'back', frames: [{ key: 'sophie', frame: 2 }] });
            this.anims.create({ key: 'back_hand_up', frames: [{ key: 'sophie', frame: 3 }] });
            this.anims.create({ key: 'give', frames: [{ key: 'sophie', frame: 4 }] });
        }

        // Sophie interaktiv machen
        this.sophie.setInteractive({
        });

        // Hover-Text für Sophie erstellen
        const sophieHoverText = this.add.text(
            sophieX,
            sophieY - this.sophie.displayHeight - 10,
            "Sophie",
            {
                fontSize: '20px',
                fontFamily: 'Courier New',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 },
                stroke: '#000000',
                strokeThickness: 1
            }
        ).setOrigin(0.5, 0.5);

        sophieHoverText.setVisible(false);
        sophieHoverText.setDepth(10001); // Höher als Sophie, damit der Text immer sichtbar ist

        // Hover-Text in die hoverTexts-Collection einfügen
        this.hoverTexts['sophie'] = sophieHoverText;

        if (this.sceneConfig.sophieFixedFrame) {
            this.sophie.play(this.sceneConfig.sophieFixedFrame);
        }

        // Event-Handler für den Hover-Effekt
        this.sophie.on('pointerover', () => {
            // Aktualisiere die Position bevor der Text sichtbar wird
            if (!this.isMonologActive) {
                sophieHoverText.setPosition(this.sophie.x, this.sophie.y - this.sophie.displayHeight - 10);
                if (this.canMoveSophie) {
                    sophieHoverText.setVisible(true);
                }
            }
        });

        this.sophie.on('pointerout', () => {
            sophieHoverText.setVisible(false);
        });

        // Aktualisiere die Hover-Text-Position wenn Sophie sich bewegt (auch durch andere Mechanismen)
        this.sophie.on('x', () => {
            if (sophieHoverText) {
                sophieHoverText.x = this.sophie.x;
            }
        });
    }

    setupUI() {
        // Game Controls erstellen
        this.controls = new GameControls(this);
        this.controls.hide();
    }

    setupInteractiveObjects() {
        // Interaktive Objekte aus GameData für diese Szene laden
        if (this.sceneConfig && this.sceneConfig.interactiveObjects) {
            const sceneObjects = this.sceneConfig.interactiveObjects;

            // Jedes Objekt erstellen
            sceneObjects.forEach(objData => {
                this.createInteractiveObject(objData);
            });
        }
    }

    createInteractiveObject(objData) {
        let gameObj;

        // Position im Viewport berechnen
        const x = this.viewport.width * objData.relativeX;
        const y = this.viewport.height * objData.relativeY;

        const hoverTextX = this.viewport.width * (objData.relativeX + (objData.hoverXOffset || 0));
        const hoverTextY = this.viewport.height * (objData.relativeY + (objData.hoverYOffset || 0));

        // Größe im Viewport berechnen
        const width = this.viewport.width * objData.relativeWidth;
        const height = this.viewport.height * objData.relativeHeight;

        // Je nach Typ das entsprechende Objekt erstellen
        switch(objData.type) {
            case 'rectangle':
                gameObj = this.add.rectangle(x, y, width, height, 0xffffff, 0);
                break;
            case 'circle':
                gameObj = this.add.circle(x, y, Math.min(width, height) / 2, 0xffffff, 0);
                break;
            case 'image':
                if (this.textures.exists(objData.texture)) {
                    gameObj = this.add.image(
                        x,
                        y,
                        objData.texture
                    ).setOrigin(0.5, 0.5);
                    if (objData.scaleFactor) {
                        gameObj.setScale(objData.scaleFactor);
                    }
                }
                break;
            default:
                console.warn(`Unbekannter Objekttyp: ${objData.type}`);
                return;
        }

        // Debug-Visualisierung
        if (objData.debug && GameData.debug && objData.type !== 'image') {
            if (objData.type === 'rectangle' || objData.type === 'circle') {
                gameObj.setStrokeStyle(2, 0xff0000, 0.5);
                gameObj.setFillStyle(0xff0000, 0.2);
            }
        }

        // Z-Index setzen
        if (objData.depth !== undefined) {
            gameObj.setDepth(objData.depth);
        }

        // Hover-Text erstellen
        let hoverText = null;
        if (objData.hoverText) {
            hoverText = this.add.text(
                hoverTextX,
                hoverTextY - height/2 - 10,
                objData.hoverText,
                {
                    fontSize: '20px',
                    fontFamily: 'Courier New',
                    color: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 8, y: 4 },
                    stroke: '#000000',
                    strokeThickness: 1
                }
            ).setOrigin(0.5, 0.5);

            hoverText.setVisible(false);
            hoverText.setDepth(1000);
            this.hoverTexts[objData.id] = hoverText;
        }

        // Objekt speichern
        this.interactiveObjects[objData.id] = {
            gameObject: gameObj,
            data: objData
        };

        // Interaktiv machen
        gameObj.setInteractive({
        });

        // Event-Handler
        if (hoverText) {
            gameObj.on('pointerover', () => {
                if (!this.isMonologActive) {
                    hoverText.setVisible(true);
                }
            });

            gameObj.on('pointerout', () => {
                hoverText.setVisible(false);
            });
        }

        return gameObj;
    }

    setupResizeListener() {
        // Auf den Phaser Scale-Manager hören
        this.scale.on('resize', (gameSize) => {
            // Verzögerung beibehalten
            clearTimeout(window.resizeTimeout);
            window.resizeTimeout = setTimeout(() => this.handleResize(gameSize), 10);
        });

        // Initiales Resize
        this.handleResize({ width: this.scale.width, height: this.scale.height });
    }

    // Vereinfachte Resize-Methode
    handleResize(gameSize) {
        if (this.isResizing) return; // Gegen Rekursion schützen

        this.isResizing = true;

        const width = gameSize.width || window.innerWidth;
        const height = gameSize.height || window.innerHeight;

        // Das Game-Canvas direkt aktualisieren
        this.scale.resize(width, height);

        // Verzögertes Neupositionieren aller Elemente
        requestAnimationFrame(() => {
            this.scaleToFit(width, height);
            this.isResizing = false;
        });
    }

    // Neue, vereinfachte Methode zur Skalierung
    scaleToFit(width, height) {
        // Skalierungsfaktor berechnen
        const scaleX = width / this.viewport.width;
        const scaleY = height / this.viewport.height;

        // Das kleinere der beiden verwenden, um Proportionen zu wahren
        this.viewport.scale = Math.min(scaleX, scaleY) * 0.9; // 90% für etwas Rand

        // Kamera einstellen
        this.cameras.main.setZoom(this.viewport.scale);
        this.cameras.main.centerOn(this.viewport.width / 2, this.viewport.height / 2);

        this.updateMask();
    }

    updateMask() {
        // Wenn noch keine Maske existiert, erzeugen wir eine neue
        if (!this.maskGraphics) {
            this.maskGraphics = this.make.graphics();
        }

        // Maske löschen und neu zeichnen
        this.maskGraphics.clear();
        this.maskGraphics.fillStyle(0xffffff);

        // Abgerundetes Rechteck für die Maske erstellen
        const x = 0;
        const y = 0;
        const width = this.viewport.width;
        const height = this.viewport.height;
        const radius = Math.min(width, height) * 0.1; // Abgerundete Ecken (10% der kleineren Dimension)

        this.maskGraphics.fillRoundedRect(x, y, width, height, radius);

        // Neue Geometriemaske erstellen
        const mask = this.maskGraphics.createGeometryMask();

        // Alle relevanten Elemente maskieren
        if (this.bg) this.bg.setMask(mask);
        if (this.sophie) this.sophie.setMask(mask);
        if (this.bus) this.bus.setMask(mask);
        if (this.front) this.front.setMask(mask);

        // Optional: Textelemente maskieren
        if (this.monologManager && this.monologManager.textObject && this.monologManager.textObject.active) {
            this.monologManager.textObject.setMask(mask);
        }

        // Auch alle interaktiven Objekte maskieren
        for (const key in this.interactiveObjects) {
            const obj = this.interactiveObjects[key].gameObject;
            obj.setMask(mask);
        }

        // Und die Hover-Texte
        for (const key in this.hoverTexts) {
            const text = this.hoverTexts[key];
            if (text && text.active) {
                text.setMask(mask);
            }
        }

        // Stelle sicher, dass der Sophie-Hover-Text an der richtigen Position ist
        if (this.sophie && this.hoverTexts['sophie']) {
            this.hoverTexts['sophie'].setPosition(
                this.sophie.x,
                this.sophie.y - this.sophie.displayHeight - 10
            );
        }


        this.controls.setMask(mask);
    }

    moveSophie(worldPoint, onCompleteDo=null, endFrame = null, exactPositioning=false) {
        // Bestehende Tweens abbrechen, um Überlappungen zu vermeiden
        if (this.sophieTween && this.sophieTween.isPlaying()) {
            this.sophieTween.stop();
        }

        if (this.sophieHoverTextTween && this.sophieHoverTextTween.isPlaying()) {
            this.sophieHoverTextTween.stop();
        }

        this.controls.closeBag();

        // Szenen-Grenzen definieren
        const minX = (this.sceneConfig.leftBoundary || 0) * this.viewport.width;
        const maxX = (this.sceneConfig.rightBoundary || 1) * this.viewport.width;

        // Sophie's Größe für die Begrenzung berücksichtigen
        const sophieHalfWidth = this.sophie.width * this.sophie.scale / 2;
        const sophieMinX = minX + sophieHalfWidth;
        const sophieMaxX = maxX - sophieHalfWidth;

        // Richtung bestimmen
        const direction = worldPoint.x > this.sophie.x ? 'right' : 'left';

        // Zielposition berechnen
        let targetX;

        if (exactPositioning) {
            // Bei exakter Positionierung die genaue (aber begrenzte) Position verwenden
            targetX = Phaser.Math.Clamp(worldPoint.x, sophieMinX, sophieMaxX);
        } else {
            // Aktuellen Abstand berechnen
            const stopDistance = sophieHalfWidth;

            // Zielposition mit Abstand berechnen
            if (direction === 'right') {
                // Begrenzen Sie erst den Klickpunkt, dann berechnen Sie die Position mit Abstand
                const limitedClickX = Math.min(worldPoint.x, sophieMaxX + stopDistance);
                targetX = Math.max(sophieMinX, limitedClickX - stopDistance);
            } else {
                // Begrenzen Sie erst den Klickpunkt, dann berechnen Sie die Position mit Abstand
                const limitedClickX = Math.max(worldPoint.x, sophieMinX - stopDistance);
                targetX = Math.min(sophieMaxX, limitedClickX + stopDistance);
            }
        }

        // Endgültige Begrenzung, um sicherzustellen, dass Sophie in den Grenzen bleibt
        targetX = Phaser.Math.Clamp(targetX, sophieMinX, sophieMaxX);

        // Animation
        if (this.sceneConfig.sophieFixedFrame) {
            this.sophie.play(this.sceneConfig.sophieFixedFrame);
        } else {
            this.sophie.play(direction === 'right' ? 'walk_right' : 'walk_left');
        }

        // Distanz als relative Strecke berechnen (prozentual zur Viewport-Breite)
        const relativeDistance = Math.abs((targetX - this.sophie.x) / this.viewport.width);

        // Basis-Zeit für eine komplette Viewport-Durchquerung (in ms)
        const baseFullWidthDuration = 2500;

        // Geschwindigkeitsfaktor basierend auf der relativen Distanz
        let speedFactor;
        if (relativeDistance < 0.05) {
            // Sehr kurze Distanz
            speedFactor = 0.2;
        } else if (relativeDistance < 0.10) {
            // Kurze Distanz
            speedFactor = 0.4;
        } else if (relativeDistance < 0.25) {
            // Mittlere Distanz
            speedFactor = 0.5;
        } else if (relativeDistance < 0.50) {
            // Längere Distanz
            speedFactor = 0.8;
        } else if (relativeDistance < 0.75) {
            // Lange Distanz
            speedFactor = 0.9;
        } else {
            // Sehr lange Distanz
            speedFactor = 1.0;
        }

        // Dauer berechnen basierend auf relativer Distanz und Geschwindigkeitsfaktor
        let duration = baseFullWidthDuration * relativeDistance / speedFactor;

        // Minimale und maximale Dauer begrenzen
        duration = Math.min(Math.max(duration, 300), 2000);

        let targetY = this.getSophieY();

        // Hover-Text-Position aktualisieren
        const sophieHoverText = this.hoverTexts['sophie'];
        if (sophieHoverText) {
            this.sophieHoverTextTween = this.tweens.add({
                targets: sophieHoverText,
                x: targetX,
                y: targetY - this.sophie.displayHeight - 10,
                duration: duration,
                onComplete: onCompleteDo
            });
        }

        // Bewegung für Sophie
        this.sophieTween = this.tweens.add({
            targets: this.sophie,
            x: targetX,
            y: targetY,
            duration: duration,
            onComplete: () => {
                // Animation stoppen, wenn die Bewegung abgeschlossen ist
                this.sophie.anims.stop();

                // Standardframe je nach Richtung setzen
                if (endFrame) {
                    this.sophie.play(endFrame);
                } else {
                    if (this.sceneConfig.sophieFixedFrame) {
                        this.sophie.play(this.sceneConfig.sophieFixedFrame);
                    } else {
                        this.sophie.setFrame(direction === 'right' ? 1 : 0);
                    }
                }

                // onComplete-Callback aufrufen, wenn vorhanden und kein Hover-Text-Tween existiert
                if (onCompleteDo && (!sophieHoverText || !this.sophieHoverTextTween)) {
                    onCompleteDo();
                }
            }
        });
    }

    getSophieY() {
        if (this.sceneConfig.sophieFixedFrame && this.sophie) {
            return this.sophie.y;
        } else {
            return this.viewport.height * this.sceneConfig.sophieBottomPosition;
        }
    }

    handlePointerDown(pointer) {
        if (!this.canMoveSophie) {
            return;
        }
        // im Dialog-Switcher keine Click Events annehmen hier
        if (this.dialogSwitcher && this.dialogSwitcher.isActive) {
            return;
        }

        // Pointer in Weltkoordinaten umrechnen
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        let moveSophie = true;

        // Eine Liste der geklickten Objekte sammeln
        let clickedInteractives = [];

        // Alle interaktiven Objekte durchgehen und prüfen
        for (const key in this.interactiveObjects) {
            const entry = this.interactiveObjects[key];
            const gameObj = entry.gameObject;

            // Wenn das Objekt interaktiv ist
            if (gameObj.input && gameObj.input.enabled && gameObj.visible) {
                // Prüfen, ob der Klick in den Bounds liegt
                let isClicked = false;

                if (entry.data.type === 'rectangle' || entry.data.type === 'image') {
                    const halfWidth = (gameObj.width * (entry.data.scaleFactor || 1) )/ 2;
                    const halfHeight = (gameObj.height * (entry.data.scaleFactor || 1) ) / 2;
                    isClicked = (
                        worldPoint.x >= gameObj.x - halfWidth &&
                        worldPoint.x <= gameObj.x + halfWidth &&
                        worldPoint.y >= gameObj.y - halfHeight &&
                        worldPoint.y <= gameObj.y + halfHeight
                    );
                } else if (entry.data.type === 'circle') {
                    const dx = worldPoint.x - gameObj.x;
                    const dy = worldPoint.y - gameObj.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    isClicked = distance <= gameObj.radius;
                }

                if (isClicked) {
                    clickedInteractives.push({
                        key: key,
                        gameObject: gameObj,
                        data: entry.data,
                        depth: gameObj.depth || 0
                    });
                }
            }
        }

        // Prüfen, ob Sophie geklickt wurde
        let isSophieClicked = false;
        if (this.sophie && this.sophie.input && this.sophie.input.enabled) {
            // Einfache Bounding-Box-Prüfung für Sophie
            const sophieHalfWidth = this.sophie.displayWidth / 2;
            const sophieHeight = this.sophie.displayHeight;

            isSophieClicked = (
                worldPoint.x >= this.sophie.x - sophieHalfWidth &&
                worldPoint.x <= this.sophie.x + sophieHalfWidth &&
                worldPoint.y >= this.sophie.y - sophieHeight &&
                worldPoint.y <= this.sophie.y
            );

            if (isSophieClicked) {
                if (this.controls.getActiveAction().name === 'use') {
                    this.controls.handleUse('sophie', 'Sophie');
                }
                return;
            }
        }

        // Wenn interaktive Objekte gefunden wurden
        if (clickedInteractives.length > 0) {
            // Nach Z-Tiefe sortieren
            clickedInteractives.sort((a, b) => b.depth - a.depth);

            // Das oberste Objekt verwenden
            const topObject = clickedInteractives[0];
            const defaultAction = this.interactiveObjects[topObject.key].data.defaultAction;

            if (defaultAction
                && !this.controls.isPromptUseAction
                && this.controls.activeActionIndex === 0) {
                this.controls.setActiveAction(defaultAction);
            }

            // Aktion behandeln
            moveSophie = this.controls.handle(this, topObject.key, worldPoint, this.hoverTexts[topObject.key].text);
        }

        if (this.canMoveSophie && !this.isMonologActive && moveSophie) {
            if (this.controls.isBagOpen) {
                this.controls.closeBag();
            }
            else {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                this.moveSophie(worldPoint);
            }
        }
    }

    showMonolog(lines, onComplete = null, timer = false) {
        if (lines && lines.length>0) {

            // Für Rückwärtskompatibilität - die isMonologActive-Variable setzen
            this.isMonologActive = true;

            // Den MonologManager verwenden
            this.monologManager.show({
                lines: lines,
                speaker: this.sophie,
                speakerType: 'sophie',
                onComplete: onComplete,
                timer: timer
            });

        } else {
            if (onComplete) {
                onComplete();
            }
        }
    }

    showCharacterMonolog(character, lines, onComplete = null, timer = false, style = null) {
        this.isMonologActive = true;

        this.monologManager.show({
            lines: lines,
            speaker: character,
            speakerType: character.key || 'npc', // Verwende den Objekt-Key als Sprecher-Typ
            onComplete: onComplete,
            timer: timer,
            style: style
        });
    }


    // Neue Hilfsmethode zum Ausblenden aller Hover-Texte
    hideAllHoverTexts() {
        // Alle Hover-Texte durchgehen und ausblenden
        for (const key in this.hoverTexts) {
            const text = this.hoverTexts[key];
            if (text && text.active) {
                text.setVisible(false);
            }
        }
    }


    changeScene(targetScene, entryPoint = 'default') {

        console.log("Load Scene: " + targetScene);

        // Spielstand vor dem Szenenwechsel aktualisieren
        this.updateGameState({
            currentScene: targetScene,
            entryPoint: entryPoint
        });

        // Wir verwenden direkt die Kamera für den Fade-Effekt
        this.cameras.main.fadeOut(300, 255, 255, 255); // 300ms zu Weiß ausblenden

        // Wenn das Ausblenden abgeschlossen ist, zur nächsten Szene wechseln
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Szene wechseln
            this.scene.start(targetScene, {
                fromScene: this.scene.key,
                entryPoint: entryPoint,
                doFadeIn: true // Hinweis zum Einblenden
            });
        });
    }

    goToAnything(objectKey) {
        return true;
    }


    calculateReadingTime(text) {
        // Leerer oder ungültiger Text
        if (!text || typeof text !== 'string') {
            return 1500;
        }

        // Text in Wörter aufteilen (durch Leerzeichen getrennt)
        const words = text.trim().split(/\s+/);
        const wordCount = words.length;

        // Lesedauer berechnen: 1500ms Grundwert + 200ms pro Wort
        return 1200 + (wordCount * 300);
    }

    talkToAnything(objectKey, worldPoint) {
        const text = "Damit kann man sich nicht unterhalten.";

        // Zeige einen generischen Dialog mit der Monolog-Funktionalität
        this.showMonolog([text], null);

        // Rückgabewert false verhindert, dass Sophie sich bewegt
        return false;
    }

    viewAnything(objectKey, worldPoint) {
        this.focusInteraction();

        const interactiveObject = this.interactiveObjects[objectKey];
        const text = interactiveObject.data.view;
        const exactPositioning = interactiveObject.data.exactPositioning || false;

        if (interactiveObject.data.viewY) {
            worldPoint.x = this.viewport.width * interactiveObject.data.viewY;
        }

        if (interactiveObject.data.viewSound) {

            this.moveSophie(worldPoint, ()=>{

                this.soundEffects.play(interactiveObject.data.viewSound, interactiveObject.gameObject.x, interactiveObject.gameObject.y, {
                    duration: 2000,
                    depth: this.sophie.depth + 1,
                    onComplete: () => {
                        this.showMonolog(text, ()=>{
                            this.backToDefault();
                        });
                    },
                    style: {
                        fontSize: '48px',
                        fill: '#ff6f61',
                        fontFamily: 'Courier New, monospace',
                        stroke: '#000000',
                        strokeThickness: 7
                    }
                });
            }, interactiveObject.data.sophieViewFrame, exactPositioning);

        } else {
            this.moveSophie(worldPoint, ()=>{
                this.showMonolog(text, ()=>{
                    this.backToDefault();
                });
            }, interactiveObject.data.sophieViewFrame, exactPositioning);
        }

        if (interactiveObject.data.viewOnlyOnce) {
            interactiveObject.gameObject.disableInteractive();
            interactiveObject.gameObject.setVisible(false);
        }

        return false;
    }

    takeAnything(objectKey, worldPoint, showPreTak=true) {
        this.focusInteraction();

        const interactiveObject = this.interactiveObjects[objectKey];
        const preTakeText = interactiveObject.data.preTake;


        if (preTakeText && showPreTak) {
            this.showMonolog(preTakeText, ()=>{
                this.takeAnything(objectKey, worldPoint, false)
            });
            return;
        }

        const takeText = interactiveObject.data.take;
        const takeFrame = interactiveObject.data.sophieTakeFrame;

        const inventoryAssetsToAdd = interactiveObject.data.inventoryAssets;



        this.moveSophie(worldPoint, ()=>{
            if (interactiveObject.data.removable) {
                interactiveObject.gameObject.setVisible(false);
                this.hideAllHoverTexts();
            }
            if (interactiveObject.data.removeSound) {
                this.soundEffects.play(interactiveObject.data.removeSound, interactiveObject.gameObject.x, interactiveObject.gameObject.y, {
                    duration: 1000,
                    depth: this.sophie.depth + 1,
                    onComplete: ()=>{
                        this.addInventoryAssets(inventoryAssetsToAdd);
                        this.showMonolog(takeText,()=>{
                            if (inventoryAssetsToAdd) {
                                this.controls.updateAssetsTaken();
                            }
                            this.backToDefault();
                        } );
                    },
                    style: {
                        fontSize: '48px',
                        fill: '#ff6f61',
                        fontFamily: 'Courier New, monospace',
                        stroke: '#000000',
                        strokeThickness: 7
                    }
                });
            } else {
                this.addInventoryAssets(inventoryAssetsToAdd);
                this.showMonolog(takeText,()=>{
                    if (inventoryAssetsToAdd) {
                        this.controls.updateAssetsTaken();
                    }
                    this.backToDefault();
                } );
            }
        }, takeFrame);

        return false;
    }

    focusInteraction() {
        this.controls.disable();
        this.isMonologActive = true;
        this.canMoveSophie = false;
    }
    backToDefault() {
        this.isMonologActive = false;
        this.canMoveSophie = true;
        this.controls.setActiveAction(0);
        this.controls.enable();
    }

    // Event-Handler down here

    useInvBottleOpenerWithInvCokeBomb() {
        this.subExplodeCokeBomb();
    }

    useInvCokeBombWithInvBottleOpener() {
        this.subExplodeCokeBomb();
    }

    subExplodeCokeBomb() {
        this.focusInteraction();
        this.showMonolog(["Ich hebe mir das besser für den richtigen Moment auf."], ()=>{
            this.backToDefault();
        })
    }

    useInvCokeClosedWithInvBottleOpener() {
        this.useInvBottleOpenerWithInvCokeClosed();
    }

    useInvBottleOpenerWithInvCokeClosed() {
        this.focusInteraction();

        this.sophie.play('back');

        this.soundEffects.play("FLIP FLUP",
            this.sophie.x, this.sophie.y - (this.sophie.height * 0.7),
            {
                duration: 1500,
                depth: this.sophie.depth + 10000,
                style: {
                    fontSize: `40px`,
                    fill: '#ff6f61',
                    fontFamily: 'Courier New, monospace',
                    stroke: '#000000',
                    strokeThickness: 7
                },
                onComplete: ()=>{
                    this.showMonolog(["Ich sollte sie bald trinken, bevor alle Kohlensäure entweicht."], ()=>{
                        this.stateManager.removeAsset(this.gameState, 'invCokeClosed', 1);
                        this.addInventoryAssets(['invCokeOpen']);
                        this.controls.updateAssetsTaken();
                        this.backToDefault();
                    });
                }
            }
        );
    }

    useSophieWithInvCokeOpen() {
        this.useInvCokeOpenWithSophie();
    }

    useInvCokeOpenWithSophie() {


        this.stateManager.removeAsset(this.gameState, 'invCokeOpen', 1);
        this.stateManager.addAsset(this.gameState, 'invCokeEmpty', 1);


        this.focusInteraction();
        this.sophie.play('give');

        this.soundEffects.play("GLUCKGLUCKGLUCK",
            this.sophie.x, this.sophie.y - (this.sophie.height * 0.9),
            {
                duration: 3000,
                depth: this.sophie.depth + 10000,
                style: {
                    fontSize: `40px`,
                    fill: '#ff6f61',
                    fontFamily: 'Courier New, monospace',
                    stroke: '#000000',
                    strokeThickness: 7
                },
                onComplete: ()=>{
                    this.sophie.play('back');
                    this.controls.updateAssetsTaken();
                    this.gameState.progress.mustPee = true;
                    this.backToDefault();
                    this.updateGameState({
                        progress: {
                            cokesDrunken: this.gameState.progress.cokesDrunken + 1
                        }
                    });
                    this.updateGameState({
                        progress: {
                            cokesEverDrunken: this.gameState.progress.cokesEverDrunken + 1
                        }
                    });
                }
            }
        );
    }

    useInvBottleOpenerWithInvCokeOpen() {
        this.showMonolog(["Die Flasche ist bereits offen."]);
    }

    useInvCokeOpenWithInvBottleOpener() {
        this.showMonolog(["Die Flasche ist bereits offen."]);
    }

    useSophieWithInvCokeClosed() {
        this.useInvCokeClosedWithSophie();
    }
    useInvCokeClosedWithSophie() {
        if (this.stateManager.hasAsset(this.gameState, 'invBottleOpener')) {
            this.focusInteraction();

            this.sophie.play('back');

            this.soundEffects.play("FLIP FLUP",
                this.sophie.x, this.sophie.y - (this.sophie.height * 0.7),
                {
                    duration: 1500,
                    depth: this.sophie.depth + 10000,
                    style: {
                        fontSize: `40px`,
                        fill: '#ff6f61',
                        fontFamily: 'Courier New, monospace',
                        stroke: '#000000',
                        strokeThickness: 7
                    },
                    onComplete: ()=>{
                        this.stateManager.removeAsset(this.gameState, 'invCokeClosed', 1);
                        this.addInventoryAssets(['invCokeOpen']);
                        this.controls.updateAssetsTaken();
                        this.useInvCokeOpenWithSophie();
                    }
                }
            );

        } else {
            this.showMonolog(["Ich habe nichts, um die Flasche zu öffnen."]);
        }
    }

    useInvGummyBearsWithSophie() {
        this.showMonolog(["Die hebe ich mir für später auf."]);
    }

    useSophieWithInvGummyBears() {
        this.showMonolog(["Die hebe ich mir für später auf."]);
    }

    useInvPenWithInvAccessForm() {
        this.showMonolog(["Ich werde nicht noch mehr Zeit in diesen unsinnigen Prozess investieren."]);
    }

    useInvAccessFormWithInvPen() {
        this.showMonolog(["Ich werde nicht noch mehr Zeit in diesen unsinnigen Prozess investieren."]);
    }

    useInvPenWithInvBusinessCards() {
        this.useInvBusinessCardsWithInvPen();
    }

    useInvBusinessCardsWithInvPen() {
        this.focusInteraction();
        this.showMonolog(["Ich wüsste nicht, was ich da draufschreiben soll."],()=>{
            this.backToDefault();
        });
    }

}

