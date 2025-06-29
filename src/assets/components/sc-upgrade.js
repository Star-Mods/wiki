import {Core} from "./lib/data.js";

class ScUpgrade extends Core {
  static get observedAttributes() {
    return ['mod', 'upgrade'];
  }

  load() {
    this.textContent = '';
    if (!this.mod || !this.upgrade) {
      return;
    }
    this.loadData("upgrade", this.mod, this.upgrade).then(data => {
      this.data = data
      this.render();
    })
  }
  render() {
    this.innerHTML = this.interpolate(`
      <h4>{{Name}}</h4>
      <p>{{Description}}</p>
    `)

  }
  update(field, value,old) {
    this.load();
  }
}

customElements.define('sc-upgrade', ScUpgrade);
