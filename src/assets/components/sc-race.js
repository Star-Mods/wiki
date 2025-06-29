import {Core} from "./lib/data.js";

class ScRace extends Core {
  static get observedAttributes() {
    return ['mod', 'faction'];
  }

  load() {
    this.textContent = '';
    if (!this.mod || !this.faction) {
      return;
    }
    this.loadData("faction", this.mod, this.faction).then(data => {
      this.data = data
      this.render();
    })
  }
  render() {
    const u = this.data;
    if (!u) return;

    this.innerHTML = this.interpolate(`
      <h5>{{Name}} ({{id}})</h5>
      <sc-list category="army"></sc-list>
      <sc-list category="structures"></sc-list>
      <sc-list category="upgrades"></sc-list>
    `, u);
    }

  update(field, value, old) {
    if (["faction","mod"].includes(field) ) {
      this.load()
    }
  }
}

customElements.define('sc-race', ScRace);
