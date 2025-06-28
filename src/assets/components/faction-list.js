// /components/faction-list.js
import { DATA_BASE, ICON_BASE } from './data-base.js';
import { i18n } from './lang.js';

class FactionList extends HTMLElement {
  static get observedAttributes() { return ['mod', 'selected']; }

  attributeChangedCallback() { this.load(); }

  connectedCallback() {
    this.load();
  }

  load() {
    const mod = this.getAttribute('mod');
    const selected = this.getAttribute('selected');
    if (!mod) return;

    fetch(`${DATA_BASE}/${mod.toLowerCase()}/index.json`)
      .then(res => res.json())
      .then(data => {
        this.innerHTML = '<h3>Factions</h3><ul>' +
          data.races.map(f => `
            <li>
              <a href="?mod=${mod}&faction=${f.id}" ${f.id === selected ? 'style="font-weight:bold"' : ''}>
                <img src="${ICON_BASE}/lobby-${f.id.toLowerCase()}.png" style="width:20px; vertical-align:middle; margin-right:6px;">
                ${i18n(f.Name)}
              </a>
            </li>
          `).join('') +
          '</ul>';
      });
  }
}
customElements.define('faction-list', FactionList);

