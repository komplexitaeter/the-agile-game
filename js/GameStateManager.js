// GameStateManager.js
class GameStateManager {
    constructor(defaultSceneKey) {
        this.defaultSceneKey = defaultSceneKey;
    }

    generateId() {
        // Erzeugt eine zufällige 12-stellige Zahl als String
        return Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    }

    loadGameState() {
        try {
            const savedState = localStorage.getItem('sophieAdventureState');
            if (savedState) {
                return JSON.parse(savedState);
            }
        } catch (error) {
            console.error("Fehler beim Laden des Spielstands:", error);
        }

        // Standard-Spielstand, wenn noch keiner existiert
        return {
            id: this.generateId(),
            currentScene: this.defaultSceneKey,
            entryPoint: 'default',
            sophieRelativeX: 0.52,
            progress: {
                floorDigit: 'EG',
                hasSeenIntro: false,
                busHasMoved: false,
                trashBinsViewedOnce: false,
                trashTaken: false,
                emptyBottleTaken: false,
                lanternNoticeTaken: false,
                meetingRoomKnown: false,
                accessControlUsedOnce: false,
                everTalkedToKen: false,
                hasAccessForm: false,
                hasAccessCard: false,
                manifestTaken: false,
                gummyBearsTaken: false,
                cokeBombBuildOnce: false,
                bottleOpenerTaken: false,
                managerAttention: false,
                businessCardsOnTable: 0,
                mustPee: false,
                cokesDrunken: 0,
                cokesEverDrunken: 0,
                everTalkedToNoel: false,
                formShownToNoel: false,
                lightHouseProjectGiven: false,
                lightHouseOrderAccepted: false,
                teamMotivated: false,
                officeMagnetTaken: false,
                coinOnPlate: false,
                scrumGuideGiven: false,
                youKnowTheThreePillars: false,
                whiteBoardPainted: false,
                scrumGuideUsed: false,
                ticketsOnBoard: false,
                pillarsFulfilled: 0,
                toiletUsesPayed: 0,
                toiletEverUsed: 0,
                inventory: [] // Das Inventar ist initial ein leeres Array
            },
            interactions: []
        };
    }

    getEmptyGameState() {
        this.resetGameState();
        return this.loadGameState();
    }

    // Eine sehr einfache Version der Diff-Logik
    // Eine verbesserte Version mit Mengenänderungen im Inventar
    saveGameState(gameState) {
        try {
            // Zuerst den alten Spielstand lesen, um das Diff zu erstellen
            const oldStateJson = localStorage.getItem('sophieAdventureState');
            let jsonDiff = null;

            if (oldStateJson) {
                const oldState = JSON.parse(oldStateJson);

                // Diff manuell erstellen - nur die Eigenschaften, die uns interessieren
                jsonDiff = {};

                // Progress-Änderungen erfassen
                if (oldState.progress && gameState.progress) {
                    const progressDiff = {};

                    // Inventory-Änderungen
                    if (oldState.progress.inventory && gameState.progress.inventory) {
                        // Prüfen, ob ein neues Element hinzugefügt wurde
                        const newItems = gameState.progress.inventory.filter(newItem =>
                            !oldState.progress.inventory.some(oldItem =>
                                oldItem.objectKey === newItem.objectKey
                            )
                        );

                        if (newItems.length > 0) {
                            progressDiff.inventoryAdded = newItems;
                        }

                        // Prüfen, ob Elemente entfernt wurden
                        const removedItems = oldState.progress.inventory.filter(oldItem =>
                            !gameState.progress.inventory.some(newItem =>
                                newItem.objectKey === oldItem.objectKey
                            )
                        );

                        if (removedItems.length > 0) {
                            progressDiff.inventoryRemoved = removedItems;
                        }

                        // Prüfen, ob sich Mengen geändert haben
                        const quantityChanges = [];

                        oldState.progress.inventory.forEach(oldItem => {
                            const newItem = gameState.progress.inventory.find(item =>
                                item.objectKey === oldItem.objectKey
                            );

                            if (newItem && newItem.quantity !== oldItem.quantity) {
                                quantityChanges.push({
                                    objectKey: oldItem.objectKey,
                                    oldQuantity: oldItem.quantity,
                                    newQuantity: newItem.quantity
                                });
                            }
                        });

                        if (quantityChanges.length > 0) {
                            progressDiff.inventoryQuantityChanged = quantityChanges;
                        }
                    }

                    // Andere Progress-Eigenschaften
                    for (const key in gameState.progress) {
                        if (key !== 'inventory' &&
                            JSON.stringify(oldState.progress[key]) !== JSON.stringify(gameState.progress[key])) {

                            progressDiff[key] = {
                                old: oldState.progress[key],
                                new: gameState.progress[key]
                            };
                        }
                    }

                    if (Object.keys(progressDiff).length > 0) {
                        jsonDiff.progress = progressDiff;
                    }
                }

                // Interactions-Änderungen erfassen
                if (oldState.interactions && gameState.interactions) {
                    if (gameState.interactions.length > oldState.interactions.length) {
                        // Neue Interaktion
                        jsonDiff.newInteraction = gameState.interactions[gameState.interactions.length - 1];
                    } else if (gameState.interactions.length === oldState.interactions.length) {
                        // Prüfen, ob sich Zähler geändert haben
                        const countChanges = [];

                        for (let i = 0; i < gameState.interactions.length; i++) {
                            if (gameState.interactions[i].count !== oldState.interactions[i].count) {
                                countChanges.push({
                                    functionKey: gameState.interactions[i].functionKey,
                                    oldCount: oldState.interactions[i].count,
                                    newCount: gameState.interactions[i].count
                                });
                            }
                        }

                        if (countChanges.length > 0) {
                            jsonDiff.interactionCountChanged = countChanges;
                        }
                    }
                }

                // Scene-Änderungen
                if (oldState.currentScene !== gameState.currentScene) {
                    jsonDiff.sceneChanged = {
                        old: oldState.currentScene,
                        new: gameState.currentScene
                    };
                }
            }

            // Neuen Spielstand in localStorage speichern
            localStorage.setItem('sophieAdventureState', JSON.stringify(gameState));

            if (GameData.debug) {
                console.log(gameState);
            }

            // Zum Loggen sowohl den neuen Spielstand als auch das Diff übergeben
            this.logGameState(gameState, jsonDiff).then();

            return true;
        } catch (error) {
            console.error("Fehler beim Speichern des Spielstands:", error);
            return false;
        }
    }

    async logGameState(gameState, jsonDiff = null) {
        try {
            // Sicherstellen, dass ein gameState vorhanden ist
            if (!gameState) {
                gameState = this.loadGameState();
            }

            // Erstellen des JSON-Strings
            const gameStateJson = JSON.stringify(gameState);

            // Daten für die API vorbereiten
            const data = {
                json_id: gameState.id,
                json: gameStateJson
            };

            // Diff hinzufügen, wenn vorhanden
            if (jsonDiff && Object.keys(jsonDiff).length > 0) {
                data.json_diff = JSON.stringify(jsonDiff);
            }

            // Asynchroner API-Aufruf
            const response = await fetch('api/game_state_logger.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            // Optional: Antwort verarbeiten
            if (response.ok) {
                const result = await response.json();
                console.log("Spielstand erfolgreich geloggt", result);
                return true;
            } else {
                console.warn("Spielstand konnte nicht geloggt werden", response.status);
                return false;
            }
        } catch (error) {
            // Fehler abfangen, aber keinen Error auslösen, da der Spielfluss nicht unterbrochen werden soll
            console.warn("Fehler beim Loggen des Spielstands:", error);
            return false;
        }
    }

    updateGameState(gameState, updates) {
        // Prüfen, ob gameState existiert
        if (!gameState) {
            gameState = this.loadGameState();
        }

        // Prüfen, ob progress existiert
        if (!gameState.progress) {
            gameState.progress = {
                hasSeenIntro: false,
                busHasMoved: false,
                inventory: []
            };
        }

        // Spezialfall für verschachtelte Objekte wie 'progress'
        if (updates.progress) {
            gameState.progress = {
                ...gameState.progress,
                ...updates.progress
            };

            // Entferne progress aus updates, da wir es separat behandelt haben
            const { progress, ...otherUpdates } = updates;
            updates = otherUpdates;
        }

        // Aktualisiere den Rest des Spielstands mit neuen Daten
        const updatedState = { ...gameState, ...updates };
        this.saveGameState(updatedState);

        return updatedState;
    }

    checkForExistingGameState() {
        try {
            const savedState = localStorage.getItem('sophieAdventureState');

            // Prüfen, ob ein Eintrag existiert und ob er ein gültiges JSON ist
            if (savedState) {
                const parsed = JSON.parse(savedState);
                // Prüfen, ob der Spielstand grundlegende Daten enthält
                return (
                    parsed &&
                    parsed.currentScene &&
                    parsed.progress
                );
            }
        } catch (error) {
            console.error("Fehler beim Überprüfen des Spielstands:", error);
        }

        return false; // Kein gültiger Spielstand gefunden
    }

    resetGameState() {
        localStorage.removeItem('sophieAdventureState');
    }

    // Fügt ein Asset zum Inventar hinzu
    addAsset(gameState, objectKey, quantity = 1) {
        if (!gameState) {
            gameState = this.loadGameState();
        }

        // Sicherstellen, dass inventory existiert
        if (!gameState.progress.inventory) {
            gameState.progress.inventory = [];
        }

        // Prüfen, ob das Item bereits im Inventar ist
        const existingItemIndex = gameState.progress.inventory.findIndex(
            item => item.objectKey === objectKey
        );

        if (existingItemIndex >= 0) {
            // Item existiert bereits, erhöhe die Menge
            gameState.progress.inventory[existingItemIndex].quantity += quantity;
        } else {
            // Item ist neu, füge es hinzu
            gameState.progress.inventory.push({
                objectKey: objectKey,
                quantity: quantity
            });
        }

        // Spiel speichern
        this.saveGameState(gameState);
        return gameState;
    }

    removeInventoryAsset(assetKey, quantityToRemove = 1) {
        if (!assetKey) {
            console.warn('No asset key provided to removeInventoryAsset');
            return;
        }

        // Wenn kein Inventar vorhanden ist oder das Asset nicht im Inventar
        if (!this.gameState || !this.gameState.inventory || !this.gameState.inventory[assetKey]) {
            console.warn(`Asset '${assetKey}' nicht im Inventar vorhanden`);
            return;
        }

        // Aktuelle Anzahl abrufen
        const currentQuantity = this.gameState.inventory[assetKey];

        // Überprüfe, ob die Menge positiv ist
        if (quantityToRemove <= 0) {
            console.warn(`Ungültige Menge zum Entfernen: ${quantityToRemove}`);
            return;
        }

        // Bestimme die neue Menge
        let newQuantity = currentQuantity - quantityToRemove;

        // Wenn die neue Menge <= 0, entferne das Asset vollständig
        if (newQuantity <= 0) {
            // Asset komplett aus dem Inventar entfernen
            const updates = { inventory: { ...this.gameState.inventory } };
            delete updates.inventory[assetKey];
            this.updateGameState(updates);
            console.log(`Asset '${assetKey}' vollständig aus dem Inventar entfernt`);
        } else {
            // Asset-Menge reduzieren
            const updates = {
                inventory: {
                    ...this.gameState.inventory,
                    [assetKey]: newQuantity
                }
            };
            this.updateGameState(updates);
            console.log(`Menge von Asset '${assetKey}' im Inventar auf ${newQuantity} reduziert`);
        }

    }

    // Entfernt ein Asset aus dem Inventar
    removeAsset(gameState, objectKey, quantity = 1) {
        if (!gameState) {
            gameState = this.loadGameState();
        }

        // Sicherstellen, dass inventory existiert
        if (!gameState.progress.inventory) {
            gameState.progress.inventory = [];
            this.saveGameState(gameState);
            return gameState;
        }

        // Prüfen, ob das Item im Inventar ist
        const existingItemIndex = gameState.progress.inventory.findIndex(
            item => item.objectKey === objectKey
        );

        if (existingItemIndex >= 0) {
            // Item existiert, reduziere die Menge
            gameState.progress.inventory[existingItemIndex].quantity -= quantity;

            // Wenn die Menge 0 oder weniger ist, entferne das Item
            if (gameState.progress.inventory[existingItemIndex].quantity <= 0) {
                gameState.progress.inventory.splice(existingItemIndex, 1);
            }
        }

        // Spiel speichern
        this.saveGameState(gameState);
        return gameState;
    }

    // Hilfsmethode um zu prüfen, ob ein bestimmtes Asset mit einer Mindestmenge im Inventar ist
    hasAsset(gameState, objectKey, minQuantity = 1) {
        if (!gameState) {
            gameState = this.loadGameState();
        }

        // Wenn kein Inventar existiert, gib false zurück
        if (!gameState.progress.inventory) {
            return false;
        }

        // Suche das Item im Inventar
        const item = gameState.progress.inventory.find(item => item.objectKey === objectKey);

        // Prüfe, ob das Item existiert und die Mindestmenge erfüllt ist
        return item && item.quantity >= minQuantity;
    }

    getAssetQuantity(gameState, objectKey) {
        if (!gameState) {
            gameState = this.loadGameState();
        }

        if (!gameState.progress.inventory) {
            return null;
        }

        // Suche das Item im Inventar
        const item = gameState.progress.inventory.find(item => item.objectKey === objectKey);

        if (!item) {
            return null;
        }

        return item.quantity;
    }


    getAssetCount(gameState) {
        if (!gameState) {
            gameState = this.loadGameState();
        }

        // Wenn kein Inventar existiert, gib 0 zurück
        if (!gameState.progress.inventory) {
            return 0;
        }

        return gameState.progress.inventory.length;
    }

    registerInteraction(gameState, functionKey) {
        if (!gameState) {
            gameState = this.loadGameState();
        }

        // Sicherstellen, dass interactions existiert
        if (!gameState.interactions) {
            gameState.interactions = [];
        }

        // Prüfen, ob es für den functionKey bereits einen Eintrag gibt
        const existingInteractionIndex = gameState.interactions.findIndex(
            interaction => interaction.functionKey === functionKey
        );

        if (existingInteractionIndex >= 0) {
            // Eintrag existiert bereits, erhöhe den Zähler
            gameState.interactions[existingInteractionIndex].count++;
        } else {
            // Eintrag ist neu, füge ihn mit count 1 hinzu
            gameState.interactions.push({
                functionKey: functionKey,
                count: 1,
                firstTime: Date.now()
            });
        }

        // Spiel speichern
        this.saveGameState(gameState);
        return gameState;
    }

}