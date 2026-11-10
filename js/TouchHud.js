// TouchHud.js - bag and "show hotspots" as HTML buttons for touch devices (B-19).
// They sit in the side margin next to the game (phones in landscape are wider than 1792:1024) or, if the
// margin is too narrow, on the left edge of the game. Fixed size in CSS pixels, independent of the scaling.
// Look: #touch-hud in index.html. Only used when GameData.isTouch is true.
const TouchHud = {
    root: null,
    bagButton: null,
    bagImage: null,
    hotspotButton: null,
    controls: null,
    isEnabled: false,

    // Eye with a sparkle, drawn like the bag (dark outline, beige/brown, amber like the highlight)
    hotspotIcon: '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">'
        + '<path d="M3 19C8 11 22 11 27 19C22 27 8 27 3 19Z" fill="#f4e6cc" stroke="#201818" '
        + 'stroke-width="2.5" stroke-linejoin="round"/>'
        + '<circle cx="15" cy="19" r="5" fill="#b07850" stroke="#201818" stroke-width="2"/>'
        + '<circle cx="15" cy="19" r="2.1" fill="#201818"/>'
        + '<circle cx="13.4" cy="17.4" r="1.1" fill="#ffffff"/>'
        + '<path d="M26 1.5L27.4 4.6L30.5 6L27.4 7.4L26 10.5L24.6 7.4L21.5 6L24.6 4.6Z" fill="#ffc94a" '
        + 'stroke="#201818" stroke-width="1.3" stroke-linejoin="round"/>'
        + '</svg>',

    init() {
        if (this.root) {
            return;
        }
        this.root = document.createElement('div');
        this.root.id = 'touch-hud';
        this.root.style.setProperty('--hud-size', GameData.touch.hudSizeCssPx + 'px');

        this.hotspotButton = document.createElement('button');
        this.hotspotButton.type = 'button';
        this.hotspotButton.className = 'touch-hud-button touch-hud-hotspots';
        this.hotspotButton.setAttribute('aria-label', t('Hotspots zeigen', 'Show hotspots'));
        this.hotspotButton.title = t('Hotspots zeigen', 'Show hotspots');
        this.hotspotButton.innerHTML = this.hotspotIcon;
        this.hotspotButton.addEventListener('click', () => {
            if (this.controls && this.isEnabled) {
                this.controls.scene.showHotspots();
            }
        });

        this.bagButton = document.createElement('button');
        this.bagButton.type = 'button';
        this.bagButton.className = 'touch-hud-button touch-hud-bag';
        this.bagButton.setAttribute('aria-label', t('Tasche', 'Bag'));
        this.bagImage = document.createElement('img');
        this.bagImage.src = 'assets/images/controls_bag_closed.png';
        this.bagImage.alt = '';
        this.bagButton.appendChild(this.bagImage);
        this.bagButton.addEventListener('click', () => {
            if (this.controls && this.isEnabled) {
                this.controls.toggleBag();
            }
        });

        this.root.appendChild(this.hotspotButton);
        this.root.appendChild(this.bagButton);
        document.body.appendChild(this.root);

        // Measures the notch area (safe-area-inset-left, needs viewport-fit=cover)
        this.safeAreaProbe = document.createElement('div');
        this.safeAreaProbe.style.cssText = 'position:fixed;top:0;left:0;height:0;visibility:hidden;'
            + 'width:env(safe-area-inset-left, 0px);';
        document.body.appendChild(this.safeAreaProbe);

        window.addEventListener('resize', () => setTimeout(() => this.position(), 100));
    },

    show(controls) {
        this.init();
        this.controls = controls;
        const bag = controls.inventoryBag;
        this.setEnabled(controls, !!(bag && bag.input && bag.input.enabled));
        this.setBagOpen(false);
        this.root.classList.add('visible');
        this.position();
    },

    hide() {
        if (this.root) {
            this.root.classList.remove('visible');
        }
    },

    setEnabled(controls, enabled) {
        if (!this.root || controls !== this.controls) {
            return;
        }
        this.isEnabled = enabled;
        this.root.classList.toggle('disabled', !enabled);
    },

    setBagOpen(open) {
        if (this.bagImage) {
            this.bagImage.src = open ? 'assets/images/controls_bag_open.png' : 'assets/images/controls_bag_closed.png';
        }
    },

    // Short bounce when something was put into the bag
    pulseBag() {
        if (!this.bagButton) {
            return;
        }
        this.bagButton.classList.remove('pulse');
        void this.bagButton.offsetWidth; // restart the CSS animation
        this.bagButton.classList.add('pulse');
    },

    // Left margin next to the canvas if it is wide enough, otherwise on the left edge of the game
    position() {
        const canvas = document.querySelector('canvas');
        if (!this.root || !canvas) {
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const size = GameData.touch.hudSizeCssPx;
        const gap = 8;
        const safeLeft = this.safeAreaProbe.offsetWidth || 0;
        const margin = rect.left - safeLeft;

        let left;
        if (margin >= size + 2 * gap) {
            left = safeLeft + (margin - size) / 2;
            this.root.classList.add('in-margin');
        } else {
            left = Math.max(rect.left, safeLeft) + gap;
            this.root.classList.remove('in-margin');
        }
        this.root.style.left = Math.round(left) + 'px';
        // Bag roughly where it is on the desktop (60 % of the height), hotspot button above it
        this.root.style.top = Math.round(rect.top + rect.height * 0.6 - size * 1.5 - gap / 2) + 'px';
    }
};
