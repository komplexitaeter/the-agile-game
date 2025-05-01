/**
 * Klasse für die Darstellung von Sound-Effekten als Text-Animation
 */
class SoundEffect {
    /**
     * Konstruktor für die SoundEffect Klasse
     * @param {object} scene - Die Szene, in der der Sound-Effekt dargestellt werden soll
     */
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = []; // Speichert alle aktiven Effekte
    }

    /**
     * Spielt einen Sound-Effekt ab (als Text-Animation)
     * @param {string} soundText - Der darzustellende Text für den Sound-Effekt
     * @param {number} x - X-Position des Textes
     * @param {number} y - Y-Position des Textes
     * @param {object} options - Optionale Parameter
     * @param {number} options.delay - Verzögerung bis zum Start der Animation (in ms, Standard: 0)
     * @param {number} options.duration - Dauer der Animation (in ms, Standard: 1000)
     * @param {object} options.style - Textstil (Standard: { fontSize: '48px', fill: '#ff6f61', fontFamily: 'Courier New, monospace', stroke: '#000000', strokeThickness: 7 })
     * @param {number} options.depth - Z-Index des Textes (Standard: 100)
     * @param {number} options.yMove - Wie weit sich der Text nach oben bewegt (Standard: 20)
     * @param {Function} options.onComplete - Callback-Funktion, die nach Abschluss der Animation aufgerufen wird
     * @returns {object} - Ein Objekt mit einer destroy-Methode, um den Effekt vorzeitig zu beenden
     */
    play(soundText, x, y, options = {}) {
        // Standard-Optionen setzen - angelehnt an den bestehenden IntroScene-Code
        const config = {
            delay: options.delay || 0,
            duration: options.duration || 2200,
            style: options.style || {
                fontSize: '48px',
                fill: '#ff6f61',
                fontFamily: 'Courier New, monospace',
                stroke: '#000000',
                strokeThickness: 7
            },
            depth: options.depth || 100,
            yMove: options.yMove || 20,
            onComplete: options.onComplete || function() {}
        };

        // Erstelle ein Effekt-Objekt, das alle Informationen enthält
        const effect = {
            text: null,
            tweens: [],
            isDestroyed: false,
            destroy: () => this.destroyEffect(effect)
        };

        // Füge den Effekt zur Liste der aktiven Effekte hinzu
        this.activeEffects.push(effect);

        // Timer für die Verzögerung erstellen
        if (config.delay > 0) {
            this.scene.time.delayedCall(config.delay, () => {
                if (!effect.isDestroyed) {
                    this.createTextAnimation(effect, soundText, x, y, config);
                }
            });
        } else {
            // Sofort starten, wenn keine Verzögerung
            this.createTextAnimation(effect, soundText, x, y, config);
        }

        // Gibt ein Objekt zurück, mit dem der Effekt vorzeitig beendet werden kann
        return effect;
    }

    /**
     * Erstellt die eigentliche Text-Animation
     * @private
     */
    createTextAnimation(effect, soundText, x, y, config) {
        // Text-Objekt erstellen
        effect.text = this.scene.add.text(x, y, soundText, config.style);
        effect.text.setOrigin(0.5); // Zentrieren des Textes an der angegebenen Position
        effect.text.setDepth(config.depth);

        effect.text.setMask(this.scene.sophie.mask);

        // Animation ähnlich der in IntroScene
        const tween = this.scene.tweens.add({
            targets: effect.text,
            y: y - config.yMove,
            alpha: 0,
            duration: config.duration,
            ease: 'Linear',
            onComplete: () => {
                this.destroyEffect(effect);
                config.onComplete();
            }
        });

        effect.tweens.push(tween);
    }

    /**
     * Zerstört einen einzelnen Effekt und entfernt ihn aus der Liste
     * @private
     */
    destroyEffect(effect) {
        if (effect.isDestroyed) return;

        effect.isDestroyed = true;

        // Tweens stoppen, falls vorhanden
        effect.tweens.forEach(tween => {
            if (tween && tween.isPlaying) {
                tween.stop();
            }
        });
        effect.tweens = [];

        // Text-Objekt zerstören, falls vorhanden
        if (effect.text && effect.text.active) {
            effect.text.destroy();
            effect.text = null;
        }

        // Aus der Liste der aktiven Effekte entfernen
        const index = this.activeEffects.indexOf(effect);
        if (index !== -1) {
            this.activeEffects.splice(index, 1);
        }
    }

    /**
     * Zerstört alle aktiven Sound-Effekte
     */
    destroyAll() {
        // Kopie des Arrays erstellen, da wir es während der Iteration verändern
        const effects = [...this.activeEffects];
        effects.forEach(effect => this.destroyEffect(effect));
    }
}