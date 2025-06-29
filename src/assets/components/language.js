import {getLang, setLang, i18n} from './lib/lang.js';

class Language extends HTMLElement {
  constructor() {
    super();
    this._onLanguageChange = this._onLanguageChange.bind(this);
  }

  connectedCallback() {
    this.innerHTML = `
      <img src="http://localhost:63342/web-wiki/src/assets/lang/lang.svg" alt="Language" title="Language">
      <ul class="language-dropdown-menu" role="menu">
        <li data-lang="en"><img src="http://localhost:63342/web-wiki/src/assets/lang/en.svg" alt="English" title="English"></li>
        <li data-lang="ru"><img src="http://localhost:63342/web-wiki/src/assets/lang/ru.svg" alt="Русский" title="Русский"></li>
        <li data-lang="uk"><img src="http://localhost:63342/web-wiki/src/assets/lang/kr.svg" alt="한국어" title="한국어"></li>
        <li data-lang="cn"><img src="http://localhost:63342/web-wiki/src/assets/lang/cn.svg" alt="简体中文" title="简体中文"></li>
      </ul>`

    // Attach event listeners to prevent default and change language
    this.querySelectorAll('li[data-lang]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const lang = link.getAttribute('data-lang');
        setLang(lang);
      });
    });
  }

  disconnectedCallback() {
    window.removeEventListener('languagechange', this._onLanguageChange);
  }

  _onLanguageChange() {
    this._updateUI();
  }

  _updateUI() {
    const currentLang = getLang();
    this.select.value = currentLang;
    this.labelText.textContent = i18n('language-label') + ': ';
  }
}

customElements.define('sc-language', Language);
