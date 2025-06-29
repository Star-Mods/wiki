import {Core} from './lib/data.js';

class ScList extends Core {
  static get observedAttributes() {
    return ['mod', 'unit','upgrade','faction', 'category'];
  }

  constructor() {
    super();
    this._unitLinks = new Map();
  }

  load() {
    if (!this.mod || !this.faction) {
      this._unitLinks.clear();
      this.textContent = '';
      return;
    }

    this.loadData("faction", this.mod, this.faction).then(data => {
      this.list = data[this.category];
      this.selectedparamName = this.category === "upgrades" ? "upgrade" : "unit";
      this.datasource = data.cache[this.category === "upgrades" ? "upgrades" : "units"];
      this._buildList();
    })
    .catch(() => {
      this.textContent = '';
    });
  }

  _buildList() {
    this._unitLinks.clear();
    this.textContent = '';

    this.titleEl = document.createElement('h4');
    this.titleEl.textContent = this.i18n(this.category + '-title');
    this.appendChild(this.titleEl);

    const ul = document.createElement('ul');
    ul.classList.add('units-list');
    this.appendChild(ul);

    const paramName = this.category === "upgrades" ? "upgrade" : "unit";

    this.list.forEach(uid => {
      const unit = this.datasource[uid];
      if (!unit) return;

      const li = document.createElement('li');
      const a = document.createElement('a');

      a.href = `?mod=${this.mod}&faction=${this.faction}&${paramName}=${unit.id}`;
      if (unit.id === this[this.selectedparamName]) {
        a.classList.add('selected');
      }

      const icon = document.createElement('sc-icon');
      icon.setAttribute('icon', unit.Icon);
      icon.setAttribute('alt', this.i18n(unit.Name));
      a.appendChild(icon);

      li.appendChild(a);
      ul.appendChild(li);

      this._unitLinks.set(unit.id, a);
    });
  }

  updateSelected(newSelected, oldSelected) {
    if (oldSelected && this._unitLinks.has(oldSelected)) {
      this._unitLinks.get(oldSelected).classList.remove('selected');
    }
    if (newSelected && this._unitLinks.has(newSelected)) {
      this._unitLinks.get(newSelected).classList.add('selected');
    }
  }

  update(field, value,old) {
    if (field === 'lang') {
      // Translate title
      if (this.titleEl) {
        this.titleEl.textContent = this.i18n(this.category + '-title');
      }

      // Update icons' alt texts
      for (const [uid, a] of this._unitLinks.entries()) {
        const unit = this.datasource[uid];
        if (!unit) continue;
        const icon = a.querySelector('sc-icon');
        if (icon) {
          icon.setAttribute('alt', this.i18n(unit.Name));
        }
      }
    }

    if (["faction","mod"].includes(field) ) {
      this.load()
    }
    if (field === this.selectedparamName) {
      this.updateSelected(value, old);
    }
  }
}

customElements.define('sc-list', ScList);
