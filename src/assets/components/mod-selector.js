// /components/mod-selector.js
import { DATA_BASE, ICON_BASE } from './data-base.js';
import { i18n } from './lang.js';

class ModSelector extends HTMLElement {
  connectedCallback() {
    fetch(`${DATA_BASE}/index.json`)
      .then(res => res.json())
      .then(json => {
        const mods = json.mods || [];

        this.innerHTML = '<h2>Select a Mod</h2><ul>' +
          mods.map(mod => {
            const icon = mod.Icon || `lobby-${mod.id}`;
            return `
              <li>
                <a href="?mod=${mod.id}">
                  <img src="\${ICON_BASE}/\${icon}.png" style="width:20px; vertical-align:middle; margin-right:6px;">
                  ${i18n(mod.name)}
                </a>
              </li>`;
          }).join('') +
          '</ul>';
      });
  }
}
customElements.define('mod-selector', ModSelector);
