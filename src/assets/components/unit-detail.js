import { DATA_BASE } from './data-base.js';
import { i18n } from './lang.js';

class UnitDetail extends HTMLElement {
  static get observedAttributes() { return ['mod', 'unit']; }

  attributeChangedCallback() { this.load(); }

  connectedCallback() {
    this.load();
  }

  load() {
    const mod = this.getAttribute('mod');
    const unit = this.getAttribute('unit');
    if (!mod || !unit) return;

    fetch(`${DATA_BASE}/${mod}/units/${unit}.json`)
      .then(res => res.json())
      .then(data => {
        this.innerHTML = `<h2>${i18n(data.name)}</h2><p>${i18n(data.description)}</p>`;
      });
  }
}
customElements.define('unit-detail', UnitDetail);
