import './language.js';
import './sc-mods.js';
import './sc-factions.js';
import './sc-list.js';
import './sc-unit.js';
import './sc-upgrade.js';
import './sc-icon.js';
import './sc-race.js';
import './sc-model.js';
import './sc-card.js';
import {Core} from "./lib/data.js";



class ScWiki extends Core {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
      <header>
          <sc-mods></sc-mods>
          <div class="separator"></div>
        <sc-factions></sc-factions>
      </header>
      <section>
        <article>
          <sc-race></sc-race>
        </article>
        <article>
          <sc-unit></sc-unit>
          <sc-upgrade></sc-upgrade>
        </article>
      </section>
      <sc-language></sc-language>
      <a title="Join All Races Discord Server" target="_blank" class="btn-discord" href="https://discord.gg/8T4MUA3xXr"><span></span></a>

    `
  }
  update() {
  }
}

customElements.define('app-root', ScWiki);
