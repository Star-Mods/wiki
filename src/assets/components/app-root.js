import './mod-selector.js';
import './faction-list.js';
import './unit-list.js';
import './unit-detail.js';
import { setLang } from './lang.js';

class AppRoot extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    window.addEventListener('popstate', () => this.render());
  }

  connectedCallback() {
    this.render();
  }

  getParams() {
    const url = new URL(window.location.href);
    return {
      mod: url.searchParams.get('mod'),
      faction: url.searchParams.get('faction'),
      unit: url.searchParams.get('unit'),
      lang: url.searchParams.get('lang') || 'enUS',
    };
  }

  render() {
    const { mod, faction, unit, lang } = this.getParams();
    setLang(lang);

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: sans-serif; padding: 1rem; }
        h2, h3 { margin: 0.5rem 0; }
        ul { list-style: none; padding: 0; }
        li { margin: 0.25rem 0; }
        select { margin-bottom: 1rem; }
      </style>
      <div>
        <label>Language:
          <select id="lang">
            <option value="enUS" ${lang === 'enUS' ? 'selected' : ''}>English</option>
            <option value="ruRU" ${lang === 'ruRU' ? 'selected' : ''}>Русский</option>
          </select>
        </label>

        ${mod ? `
          <faction-list mod="${mod}" selected="${faction || ''}"></faction-list>
          ${faction ? `<unit-list mod="${mod}" faction="${faction}" selected="${unit || ''}"></unit-list>` : ''}
          ${unit ? `<unit-detail mod="${mod}" unit="${unit}"></unit-detail>` : ''}
        ` : `
          <mod-selector></mod-selector>
        `}
      </div>
    `;

    this.shadowRoot.querySelector('#lang').addEventListener('change', e => {
      const newLang = e.target.value;
      const url = new URL(window.location.href);
      url.searchParams.set('lang', newLang);
      window.location.href = url.toString();
    });
  }
}

customElements.define('app-root', AppRoot);
