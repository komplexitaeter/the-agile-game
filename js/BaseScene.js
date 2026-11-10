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

        this.playWalkingSound = true;

        // GameStateManager initialisieren
        this.stateManager = new GameStateManager(this.scene.key);

        // Spielstand laden
        this.gameState = this.stateManager.loadGameState();

        if (!this.gameState.gameLanguage || this.gameState.gameLanguage === 'n/a') {
            this.updateGameState({
                gameLanguage: getCurrentLanguage()
            });
        }

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

        // Touch (B-19): object selected by the first tap, texts with a minimum screen size
        this.touchSelectedKey = null;
        this.touchHighlight = null;
        this.minSizeTexts = [];
        this.uiCamera = null;
        this.hotspotsVisibleUntil = 0;

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

        // MonologManager initialisieren
        this.monologManager = new MonologManager(this);

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

        this.walkingSound = this.sound.add('walking', {
            volume: 0.6,
            loop: true,
            rate: 1.8
        });
        this.walkingSound.stop();

        this.openingBottle = this.sound.add('openingBottle', {
            volume: 0.6,
            rate: 1.0
        });

        this.drinkingBottle = this.sound.add('drinkingBottle', {
            volume: 0.6,
            rate: 1.0
        });


        // Pointer-Events
        this.input.on('pointerdown', this.handlePointerDown, this);

        // Nach kurzer Verzögerung die nächsten möglichen Szenen im Hintergrund laden
        this.time.delayedCall(500, () => {
            this.preloadAdjacentScenes();
        });

        // ?shine=1: let the interactive objects shine one after another once the scene has faded in
        if (GameData.touch.shine) {
            this.time.delayedCall(this.fadeDuration, () => this.shineInteractiveObjects());
        }
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
        sophieHoverText.baseHalfHeight = sophieHoverText.height / 2;

        // Hover-Text in die hoverTexts-Collection einfügen
        this.hoverTexts['sophie'] = sophieHoverText;

        if (this.sceneConfig.sophieFixedFrame) {
            this.sophie.play(this.sceneConfig.sophieFixedFrame);
        }

        // Event-Handler für den Hover-Effekt
        this.sophie.on('pointerover', () => {
            // Aktualisiere die Position bevor der Text sichtbar wird
            if (!this.isMonologActive && !GameData.isTouch) {
                sophieHoverText.setPosition(this.sophie.x, this.sophie.y - this.sophie.displayHeight - 10);
                if (this.canMoveSophie) {
                    sophieHoverText.setVisible(true);
                }
            }
        });

        this.sophie.on('pointerout', () => {
            if (!GameData.isTouch) {
                sophieHoverText.setVisible(false);
            }
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

            if (objData.hoverDepth) {
                hoverText.setDepth(objData.hoverDepth);
            } else {
                hoverText.setDepth(1000);
            }

            hoverText.setVisible(false);
            // Bottom edge of the text, used when a tap shows it with a larger font (touch)
            hoverText.baseHalfHeight = hoverText.height / 2;
            hoverText.baseBottom = hoverText.y + hoverText.baseHalfHeight;
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

        // Event-Handler (on touch devices the first tap shows the text instead, see selectTouchTarget)
        if (hoverText && !GameData.isTouch) {
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

    handleResize(gameSize) {
        if (this.isResizing) return; // Gegen Rekursion schützen

        this.isResizing = true;

        const width = gameSize.width || window.innerWidth;
        const height = gameSize.height || window.innerHeight;

        // Das Game-Canvas direkt aktualisieren
        this.scale.resize(width, height);

        // Verzögertes Neupositionieren aller Elemente mit Arrow-Function um Kontext zu bewahren
        requestAnimationFrame(() => {
            this.scaleToFit(width, height);
            this.isResizing = false;
        });
    }

    scaleToFit(width, height) {
        // Prüfe ob cameras.main existiert
        if (!this.cameras || !this.cameras.main) {
            console.warn('Camera not available in scaleToFit');
            return;
        }

        // Skalierungsfaktor berechnen
        const scaleX = width / this.viewport.width;
        const scaleY = height / this.viewport.height;

        // Mobile Detection und entsprechende Skalierung
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (window.innerWidth <= 768)
            || (matchMedia('(hover: none) and (pointer: coarse)').matches);

        const scaleFactor = isMobile ? 1 : 0.9; // 0% Rand auf Mobile, 10% auf Desktop

        if (isMobile) {
            document.body.style.backgroundColor = 'black';
        } else {
            document.body.style.backgroundColor = 'white';
        }

        // Das kleinere der beiden verwenden, um Proportionen zu wahren
        this.viewport.scale = Math.min(scaleX, scaleY) * scaleFactor;

        // Kamera einstellen
        if (this.uiCamera) {
            this.applyZoomCamera();
        } else {
            this.cameras.main.setZoom(this.viewport.scale);
            this.cameras.main.centerOn(this.viewport.width / 2, this.viewport.height / 2);
        }

        this.updateMask();

        if (GameData.isTouch) {
            this.updateMinSizeTexts();
            TouchHud.position();
        }
    }

    updateMask() {
        // Wenn noch keine Maske existiert, erzeugen wir eine neue
        if (!this.maskGraphics) {
            this.maskGraphics = this.make.graphics();
        }

        // Maske löschen und neu zeichnen
        this.maskGraphics.clear();
        this.maskGraphics.fillStyle(0xffffff);

        // Mobile Detection (gleiche Definition wie beim Skalierungsfaktor)
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (window.innerWidth <= 768)
            || (matchMedia('(hover: none) and (pointer: coarse)').matches);

        const x = 0;
        const y = 0;
        const width = this.viewport.width;
        const height = this.viewport.height;

        if (isMobile) {
            // Mobile: Einfaches Rechteck ohne runde Ecken
            this.maskGraphics.fillRect(x, y, width, height);
        } else {
            // Desktop: Abgerundetes Rechteck
            const radius = Math.min(width, height) * 0.1; // 10% der kleineren Dimension
            this.maskGraphics.fillRoundedRect(x, y, width, height, radius);
        }

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

    moveSophie(worldPoint, onCompleteDo=null, endFrame = null, exactPositioning=false, stopSound= true) {
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

        if (relativeDistance>0.02 && this.playWalkingSound) {
            this.walkingSound.play();
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

                if (stopSound) {
                    this.walkingSound.stop();
                }

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

        // WICHTIG: Wenn ein Monolog aktiv ist, soll IMMER der Monolog weitergeschaltet werden
        // Keine interaktiven Objekte verarbeiten!
        if (this.isMonologActive) {
            // Monolog-Klick wird vom MonologManager selbst über das blockingOverlay behandelt
            // Hier nichts machen - der MonologManager fängt das Event ab
            return;
        }

        // Pointer in Weltkoordinaten umrechnen
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        let moveSophie = true;

        // Touch: small objects get a larger tap area (the graphic stays as it is)
        const minHalfSize = GameData.isTouch ? this.worldSizeForCss(GameData.touch.minTargetCssPx) / 2 : 0;

        // Eine Liste ALLER geklickten Objekte sammeln (inklusive Sophie)
        let clickedObjects = [];

        // Alle interaktiven Objekte durchgehen und prüfen
        for (const key in this.interactiveObjects) {
            const entry = this.interactiveObjects[key];
            const gameObj = entry.gameObject;

            // Wenn das Objekt interaktiv ist
            if (gameObj.input && gameObj.input.enabled && gameObj.visible) {
                // Prüfen, ob der Klick in den Bounds liegt
                let isClicked = false;
                let isNear = false; // within the enlarged touch area
                const dx = Math.abs(worldPoint.x - gameObj.x);
                const dy = Math.abs(worldPoint.y - gameObj.y);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (entry.data.type === 'rectangle' || entry.data.type === 'image') {
                    const halfWidth = (gameObj.width * (entry.data.scaleFactor || 1)) / 2;
                    const halfHeight = (gameObj.height * (entry.data.scaleFactor || 1)) / 2;
                    isClicked = dx <= halfWidth && dy <= halfHeight;
                    isNear = dx <= Math.max(halfWidth, minHalfSize) && dy <= Math.max(halfHeight, minHalfSize);
                } else if (entry.data.type === 'circle') {
                    isClicked = distance <= gameObj.radius;
                    isNear = distance <= Math.max(gameObj.radius, minHalfSize);
                }

                if (isClicked || isNear) {
                    clickedObjects.push({
                        key: key,
                        gameObject: gameObj,
                        data: entry.data,
                        depth: gameObj.depth || 0,
                        type: 'interactive',
                        exact: isClicked,
                        distance: distance
                    });
                }
            }
        }

        // Sophie als klickbares Objekt hinzufügen, wenn sie geklickt wurde
        if (this.sophie && this.sophie.input && this.sophie.input.enabled) {
            // Einfache Bounding-Box-Prüfung für Sophie
            const sophieHalfWidth = this.sophie.displayWidth / 2;
            const sophieHeight = this.sophie.displayHeight;

            const isSophieClicked = (
                worldPoint.x >= this.sophie.x - sophieHalfWidth &&
                worldPoint.x <= this.sophie.x + sophieHalfWidth &&
                worldPoint.y >= this.sophie.y - sophieHeight &&
                worldPoint.y <= this.sophie.y
            );

            if (isSophieClicked) {
                clickedObjects.push({
                    key: 'sophie',
                    gameObject: this.sophie,
                    data: null,
                    depth: this.sophie.depth || 10000, // Sophie hat normalerweise depth 10000
                    type: 'sophie',
                    exact: true,
                    distance: 0
                });
            }
        }

        // Alle geklickten Objekte nach Z-Tiefe sortieren (höchste zuerst);
        // touch: direct hits before enlarged tap areas, then the nearest one
        clickedObjects.sort((a, b) => (b.exact - a.exact)
            || (b.depth - a.depth)
            || (GameData.isTouch ? a.distance - b.distance : 0));

        // Das oberste Objekt verarbeiten
        if (clickedObjects.length > 0) {
            const topObject = clickedObjects[0];

            if (topObject.type === 'sophie') {
                // Sophie wurde geklickt und ist das oberste Objekt
                if (this.controls.getActiveAction().name === 'use') {
                    // Touch: first tap only shows the name
                    if (GameData.isTouch && !this.confirmTouchTarget('sophie')) {
                        return;
                    }
                    this.controls.handleUse('sophie', 'Sophie');
                } else if (GameData.isTouch) {
                    this.clearTouchSelection();
                }
                return; // Beende hier, da Sophie geklickt wurde
            } else {
                // Touch: the first tap selects the object (name + highlight), the second one acts
                if (GameData.isTouch && !this.confirmTouchTarget(topObject.key)) {
                    return;
                }

                // Ein interaktives Objekt wurde geklickt und ist das oberste
                const defaultAction = topObject.data.defaultAction;

                if (defaultAction
                    && !this.controls.isPromptUseAction
                    && this.controls.activeActionIndex === 0) {
                    this.controls.setActiveAction(defaultAction);
                }

                // Aktion behandeln
                moveSophie = this.controls.handle(this, topObject.key, worldPoint, this.hoverTexts[topObject.key].text);
            }
        }

        // Touch: a tap somewhere else drops the selection
        if (GameData.isTouch && clickedObjects.length === 0) {
            this.clearTouchSelection();
        }

        // Nur bewegen, wenn kein interaktives Objekt behandelt wurde oder explizit erlaubt
        if (this.canMoveSophie && !this.isMonologActive && moveSophie) {
            if (this.controls.isBagOpen) {
                this.controls.closeBag();
            } else {
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

        this.touchSelectedKey = null;
        if (this.touchHighlight) {
            this.touchHighlight.destroy();
            this.touchHighlight = null;
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
        if (this.uiCamera) {
            this.uiCamera.fadeOut(300, 255, 255, 255);
        }

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
        const text = t("Damit kann man sich nicht unterhalten.", "You can't talk to that.");

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

                this.audio = this.sound.add(interactiveObject.data.viewAudioCode, {
                    volume: interactiveObject.data.viewAudioVolume || 0.5,
                    rate: interactiveObject.data.viewAudioRate || 1
                });
                this.audio.play();

                this.soundEffects.play(interactiveObject.data.viewSound, interactiveObject.gameObject.x, interactiveObject.gameObject.y, {
                    duration: 2000,
                    depth: this.sophie.depth + 1,
                    onComplete: () => {
                        this.showMonolog(text, ()=>{

                            if (interactiveObject.data.afterViewMoveY) {
                                this.moveSophie({x: this.viewport.width * interactiveObject.data.afterViewMoveY
                                    , y:this.sophie.y}, ()=>{
                                    this.backToDefault();
                                },interactiveObject.data.afterViewFrame);
                            } else {
                                this.backToDefault();
                            }


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
            if (interactiveObject.data.removeAudioCode) {
                this.audio = this.sound.add(interactiveObject.data.removeAudioCode, {
                    volume: interactiveObject.data.removeAudioVolume || 0.5,
                    rate: interactiveObject.data.removeAudioRate || 1
                });
                this.audio.play();
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

    // ---- Touch, hotspots, shine and closer camera (B-19) ----

    // CSS pixels on the screen per world unit for the given camera
    cssPerWorld(camera = this.cameras.main) {
        const canvasCssWidth = this.game.canvas ? this.game.canvas.getBoundingClientRect().width : 0;
        if (!canvasCssWidth) {
            return 1;
        }
        return canvasCssWidth / this.scale.width * camera.zoom;
    }

    // World units needed for the given size in CSS pixels
    worldSizeForCss(cssPx, camera = this.cameras.main) {
        return cssPx / this.cssPerWorld(camera);
    }

    // Touch: keep a text at least minCssPx high on the screen, also after resizing/rotating
    keepMinFontSize(text, basePx, minCssPx, isUi = false) {
        if (!GameData.isTouch || !text) {
            return;
        }
        const entry = { text, basePx, minCssPx, isUi };
        this.minSizeTexts = this.minSizeTexts.filter(e => e.text !== text && e.text.active);
        this.minSizeTexts.push(entry);
        this.applyMinFontSize(entry);
    }

    applyMinFontSize(entry) {
        const camera = entry.isUi && this.uiCamera ? this.uiCamera : this.cameras.main;
        const size = Math.max(entry.basePx, Math.ceil(this.worldSizeForCss(entry.minCssPx, camera)));
        entry.text.setFontSize(size + 'px');
    }

    updateMinSizeTexts() {
        this.minSizeTexts = this.minSizeTexts.filter(e => e.text.active);
        this.minSizeTexts.forEach(e => this.applyMinFontSize(e));
    }

    // Part of the scene that is visible on the screen (smaller than the scene with ?zoom=1)
    getVisibleWorldRect() {
        const full = new Phaser.Geom.Rectangle(0, 0, this.viewport.width, this.viewport.height);
        const view = this.cameras.main.worldView;
        if (!view || view.width === 0) {
            return full;
        }
        return Phaser.Geom.Rectangle.Intersection(full, view);
    }

    // Keys of all interactive objects that can currently be clicked
    getActiveInteractiveKeys() {
        return Object.keys(this.interactiveObjects).filter(key => {
            const gameObj = this.interactiveObjects[key].gameObject;
            return gameObj && gameObj.active && gameObj.visible && gameObj.input && gameObj.input.enabled;
        });
    }

    // Click area of an object (on touch at least minTargetCssPx)
    getTargetBounds(key) {
        if (key === 'sophie') {
            return this.sophie.getBounds();
        }
        const entry = this.interactiveObjects[key];
        const gameObj = entry.gameObject;
        let halfWidth, halfHeight;
        if (entry.data.type === 'circle') {
            halfWidth = halfHeight = gameObj.radius;
        } else {
            halfWidth = (gameObj.width * (entry.data.scaleFactor || 1)) / 2;
            halfHeight = (gameObj.height * (entry.data.scaleFactor || 1)) / 2;
        }
        if (GameData.isTouch) {
            const minHalfSize = this.worldSizeForCss(GameData.touch.minTargetCssPx) / 2;
            halfWidth = Math.max(halfWidth, minHalfSize);
            halfHeight = Math.max(halfHeight, minHalfSize);
        }
        return new Phaser.Geom.Rectangle(gameObj.x - halfWidth, gameObj.y - halfHeight, halfWidth * 2, halfHeight * 2);
    }

    // Light outline with a soft glow around a rectangle (Phaser 3.55 has no preFX)
    drawGlow(graphics, rect) {
        const px = this.worldSizeForCss(1);
        const cfg = GameData.touch;
        const pad = cfg.highlightPaddingCssPx * px;
        const x = rect.x - pad;
        const y = rect.y - pad;
        const w = rect.width + pad * 2;
        const h = rect.height + pad * 2;
        const radius = Math.min(8 * px, w / 2, h / 2);

        graphics.fillStyle(cfg.highlightColor, 0.15);
        graphics.fillRoundedRect(x, y, w, h, radius);
        for (let i = 4; i >= 1; i--) {
            graphics.lineStyle((cfg.highlightLineCssPx + i * 3) * px, cfg.highlightColor, 0.12);
            graphics.strokeRoundedRect(x, y, w, h, radius);
        }
        graphics.lineStyle(cfg.highlightLineCssPx * px + 2 * px, 0x000000, cfg.highlightEdgeAlpha);
        graphics.strokeRoundedRect(x, y, w, h, radius);
        graphics.lineStyle(cfg.highlightLineCssPx * px, cfg.highlightColor, 1);
        graphics.strokeRoundedRect(x, y, w, h, radius);
    }

    // Fade a glow in and out around a rectangle
    flashBounds(rect, delay, duration, hold = 0) {
        const graphics = this.add.graphics().setDepth(10500).setAlpha(0);
        this.drawGlow(graphics, rect);
        this.tweens.add({
            targets: graphics,
            alpha: 1,
            delay: delay,
            duration: duration / 2,
            hold: hold,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => graphics.destroy()
        });
        return graphics;
    }

    // "Show hotspots" button (touch): all active objects at once
    showHotspots() {
        if (this.hotspotsVisibleUntil && this.time.now < this.hotspotsVisibleUntil) {
            return;
        }
        const cfg = GameData.touch;
        this.hotspotsVisibleUntil = this.time.now + cfg.hotspotDurationMs + 600;
        this.getActiveInteractiveKeys().forEach(key => {
            this.flashBounds(this.getTargetBounds(key), 0, 600, cfg.hotspotDurationMs);
            const text = this.hoverTexts[key];
            if (cfg.hotspotShowNames && text && !this.isMonologActive) {
                text.setVisible(true);
                this.time.delayedCall(cfg.hotspotDurationMs + 300, () => {
                    if (this.touchSelectedKey !== key) {
                        text.setVisible(false);
                    }
                });
            }
        });
    }

    // ?shine=1: objects shine one after another (left to right) when the scene is entered
    shineInteractiveObjects() {
        const cfg = GameData.touch;
        const keys = this.getActiveInteractiveKeys()
            .sort((a, b) => this.interactiveObjects[a].gameObject.x - this.interactiveObjects[b].gameObject.x);
        keys.forEach((key, index) => {
            this.flashBounds(this.getTargetBounds(key), index * cfg.shineDelayMs, cfg.shineDurationMs);
        });
    }

    // Touch: returns true if the object was already selected (second tap = action), otherwise selects it
    confirmTouchTarget(key) {
        if (this.touchSelectedKey === key) {
            this.clearTouchSelection();
            return true;
        }
        this.selectTouchTarget(key);
        return false;
    }

    selectTouchTarget(key) {
        this.hideAllHoverTexts();
        this.controls.closeBag();
        this.touchSelectedKey = key;

        const bounds = this.getTargetBounds(key);
        this.touchHighlight = this.add.graphics().setDepth(10500);
        this.drawGlow(this.touchHighlight, bounds);
        this.tweens.add({ targets: this.touchHighlight, alpha: 0.45, duration: 700, yoyo: true, repeat: -1 });

        const text = this.hoverTexts[key];
        if (!text) {
            return;
        }
        if (text.baseHalfHeight === undefined) {
            text.baseHalfHeight = text.height / 2;
        }
        this.keepMinFontSize(text, 20, GameData.touch.minHoverTextCssPx);
        text.setOrigin(0.5, 1);
        if (key === 'sophie') {
            text.setPosition(this.sophie.x, this.sophie.y - this.sophie.displayHeight - 10 + text.baseHalfHeight);
        } else {
            text.y = text.baseBottom;
        }

        // Above the highlight, and on the screen
        text.y = Math.min(text.y, bounds.top - this.worldSizeForCss(GameData.touch.highlightPaddingCssPx + 4));
        const view = this.getVisibleWorldRect();
        const margin = this.worldSizeForCss(4);
        text.x = Phaser.Math.Clamp(text.x, view.left + text.width / 2 + margin, view.right - text.width / 2 - margin);
        text.y = Math.max(text.y, view.top + text.height + margin);
        text.setVisible(true);
    }

    clearTouchSelection() {
        if (this.touchSelectedKey && this.hoverTexts[this.touchSelectedKey]) {
            this.hoverTexts[this.touchSelectedKey].setVisible(false);
        }
        this.touchSelectedKey = null;
        if (this.touchHighlight) {
            this.touchHighlight.destroy();
            this.touchHighlight = null;
        }
    }

    // ?zoom=1 on small screens: the main camera shows a part of the scene around Sophie and follows her
    // horizontally; a second camera draws the UI (bag panel, prompts, dialog options) unzoomed.
    // Objects of the UI are marked with isUi = true (see GameControls, DialogSwitcher).
    enableZoomCamera() {
        if (this.uiCamera || !GameData.touch.zoom || !this.sophie) {
            return;
        }
        const canvasHeight = this.game.canvas.getBoundingClientRect().height;
        if (!canvasHeight || canvasHeight > GameData.touch.zoomMaxCanvasCssHeight) {
            return;
        }

        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.uiCamera.fadeIn(this.fadeDuration, 255, 255, 255);
        this.children.list.forEach(obj => this.assignCamera(obj));

        // New objects are sorted in before the next frame is drawn (then we know their container)
        let pending = [];
        const onAdded = obj => pending.push(obj);
        const onPreRender = () => {
            pending.forEach(obj => this.assignCamera(obj));
            pending = [];
        };
        this.events.on('addedtoscene', onAdded);
        this.events.on('prerender', onPreRender);
        this.events.once('shutdown', () => {
            this.events.off('addedtoscene', onAdded);
            this.events.off('prerender', onPreRender);
            this.uiCamera = null;
        });

        this.cameras.main.startFollow(this.sophie, true, 0.08, 0);
        this.applyZoomCamera();
    }

    assignCamera(obj) {
        // Children are drawn by their container
        if (!this.uiCamera || !obj.scene || obj.parentContainer) {
            return;
        }
        if (obj.isUi) {
            this.cameras.main.ignore(obj);
        } else {
            this.uiCamera.ignore(obj);
        }
    }

    applyZoomCamera() {
        const main = this.cameras.main;
        const cfg = GameData.touch;

        this.uiCamera.setZoom(this.viewport.scale);
        this.uiCamera.centerOn(this.viewport.width / 2, this.viewport.height / 2);

        main.setZoom(this.viewport.scale * cfg.zoomFactor);
        main.setBounds(0, 0, this.viewport.width, this.viewport.height);
        const viewHeight = main.height / main.zoom;
        const centerY = viewHeight / 2 + (this.viewport.height - viewHeight) * cfg.zoomVerticalAnchor;
        main.centerOn(this.sophie.x, centerY);
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
        this.showMonolog([t("Ich hebe mir das besser für den richtigen Moment auf.", "I'd better save that for the right moment.")], ()=>{
            this.backToDefault();
        })
    }

    useInvCokeClosedWithInvBottleOpener() {
        this.useInvBottleOpenerWithInvCokeClosed();
    }

    useInvBottleOpenerWithInvCokeClosed() {
        this.focusInteraction();

        this.sophie.play('back');

        this.openingBottle.play();
        this.soundEffects.play(t("FLIP FLUP", "FLIP FLOP"),
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
                    this.showMonolog([t("Ich sollte sie bald trinken, bevor alle Kohlensäure entweicht.", "I should drink it soon before all the carbonation escapes.")], ()=>{
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

        this.drinkingBottle.play();
        this.soundEffects.play(t("GLUCKGLUCKGLUCK", "GLUG GLUG GLUG"),
            this.sophie.x, this.sophie.y - (this.sophie.height * 0.9),
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
        this.showMonolog([t("Die Flasche ist bereits offen.", "The bottle is already open.")]);
    }

    useInvCokeOpenWithInvBottleOpener() {
        this.showMonolog([t("Die Flasche ist bereits offen.", "The bottle is already open.")]);
    }

    useSophieWithInvCokeClosed() {
        this.useInvCokeClosedWithSophie();
    }
    useInvCokeClosedWithSophie() {
        if (this.stateManager.hasAsset(this.gameState, 'invBottleOpener')) {
            this.focusInteraction();

            this.sophie.play('back');

            this.openingBottle.play();

            this.soundEffects.play(t("FLIP FLUP", "FLIP FLOP"),
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
            this.showMonolog([t("Ich habe nichts, um die Flasche zu öffnen.", "I don't have anything to open the bottle with.")]);
        }
    }

    useInvGummyBearsWithSophie() {
        this.showMonolog([t("Die hebe ich mir für später auf.", "I'll save those for later.")]);
    }

    useSophieWithInvGummyBears() {
        this.showMonolog([t("Die hebe ich mir für später auf.", "I'll save those for later.")]);
    }

    useInvPenWithInvAccessForm() {
        this.showMonolog([t("Ich werde nicht noch mehr Zeit in diesen unsinnigen Prozess investieren.", "I won't invest any more time in this nonsensical process.")]);
    }

    useInvAccessFormWithInvPen() {
        this.showMonolog([t("Ich werde nicht noch mehr Zeit in diesen unsinnigen Prozess investieren.", "I won't invest any more time in this nonsensical process.")]);
    }

    useInvPenWithInvBusinessCards() {
        this.useInvBusinessCardsWithInvPen();
    }

    useInvBusinessCardsWithInvPen() {
        this.focusInteraction();
        this.showMonolog([t("Ich wüsste nicht, was ich da draufschreiben soll.", "I wouldn't know what to write on there.")],()=>{            this.backToDefault();
        });
    }

}

