export const MODELS_BASE = 'http://localhost:63342/web-wiki/src/assets/models/';

import { Core } from "./lib/data.js";
import * as modelPlayer from "./lib/three/Player.js";
// import * as modelPlayer from "./lib/three/js-3d-model-viewer.js";

class ScModel extends Core {
  static get observedAttributes() {
    return ['mod', 'unit'];
  }

  constructor() {
    super();
    this.data = null;
    this.scene = null;
    this.viewerElement = null;
  }

  async load() {
    this.textContent = '';
    if (!this.mod || !this.unit) return;
    const data = await this.loadData('unit', this.mod, this.unit);
    this.data = data;
    this.render();
    this.initScene();
    this.loadModel();
  }

  render() {
    this.innerHTML = `
      <div id="viewer" class="viewer-small">
        <div class="viewer-inner" id="viewer-inner"></div>
        <div title="Fullscreen Preview" class="fullscreen-button" id="fullscreen">⛶</div>
      </div>
    `;
  }

  initScene() {
    // Даем DOM время на отрисовку
    setTimeout(() => {
      this.viewerElement = this.querySelector('#viewer-inner');
      const viewer = this.querySelector('#viewer');
      const fullscreenBtn = this.querySelector('#fullscreen');
      if (!this.viewerElement || !fullscreenBtn) return;

      this.scene = modelPlayer.prepareScene(this.viewerElement, {
        width: 400,
        height: 250,
        background: '#3a4d63'
      });

      fullscreenBtn.addEventListener('click', () => {
        modelPlayer.goFullScreen(this.viewerElement);
      });
      this.loadModel()
    }, 50);
  }

  loadModel() {
    if (!this.data || !this.viewerElement || !this.scene) return;

    modelPlayer.clearScene(this.scene);
    modelPlayer.resetCamera(this.scene);

    const viewer = this.querySelector('#viewer');
    if (this.data.Model) {
      viewer.style.display = 'block';
      modelPlayer.loadGlb(this.scene, MODELS_BASE + this.data.Model + '.glb', () => {});
    } else {
      viewer.style.display = 'none';
    }
  }

  update(field, value, old) {
    this.load();
  }
}

customElements.define('sc-model', ScModel);
