import { DATA_BASE ,ICON_BASE} from './data-base.js';
import { i18n } from './lang.js';

class UnitList extends HTMLElement {
  static get observedAttributes() { return ['mod', 'faction', 'selected']; }

  attributeChangedCallback() { this.load(); }

  connectedCallback() {
    this.load();
  }

  load() {
    const mod = this.getAttribute('mod');
    const faction = this.getAttribute('faction');
    const selected = this.getAttribute('selected');
    if (!mod || !faction) return;

    fetch(`${DATA_BASE}/${mod}/race/${faction.toLowerCase()}.json`)
      .then(res => res.json())
      .then(data => {
        this.innerHTML = '<h3>Units</h3><ul>' +
          data.army.map(uid => {
            const u = data.cache.units[uid];
            return `
                <li>
                    <img src="${ICON_BASE}/${u.Icon}.png" alt="${i18n(u.Name)}"/>
                    <a href="?mod=${mod}&faction=${faction}&unit=${u.id}" ${u.id === selected ? 'style="font-weight:bold"' : ''}>${i18n(u.Name)}</a>
                </li>`
          }).join('') +
          '</ul>';
      });
  }
}
customElements.define('unit-list', UnitList);
