import { Core } from './lib/data.js';

class ScCard extends Core {
  static get observedAttributes() {
    return ['mod', 'unit', 'card'];
  }

  constructor() {
    super();
    this.cards = {};
    this.activeCard = 'Root';
  }

  update(field, value, old) {
    this.load();
  }

  load() {
    this.textContent = '';
    if (!this.mod || !this.unit) return;
    this.loadData("unit", this.mod, this.unit).then(data => {
      this.data = data;
      this.updateCard();
      this.render();
    });
  }
  updateCard(){
    let cards = {}
    if(this.data.CardLayouts){
      let notEmpty = false
      for(let cardID in this.data.CardLayouts){
        let layoutButtons = this.data.CardLayouts[cardID]

        let layout = [
          [[],[],[],[],[]],
          [[],[],[],[],[]],
          [[],[],[],[],[]]
        ]
        for(let layoutButton of layoutButtons) {
          let row = layoutButton.Row || 0
          let column = layoutButton.Column || 0
          if(row < 3 && column < 5){
            // @ts-ignore
            layout[row][column].push(layoutButton)
            notEmpty = true
          }
        }
        if(notEmpty){
          cards[cardID] = layout
        }
      }
    }

    this.cards = cards
  }
  targetFilters(filter) {
    return filter.replace(/,(Dead|Hidden|Invulnerable)/g, '');
  }

  isInteractive(slot) {
    const btn = slot[0];
    return !!btn && (btn.Type === 'CancelSubmenu' || btn.Type === 'Submenu' || slot.length > 1);
  }

  switchIcon(slot) {
    const btn = slot[0];
    if (!btn) return;
    if (btn.Type === 'CancelSubmenu') this.activeCard = 'Root';
    else if (btn.Type === 'Submenu') this.activeCard = btn.SubmenuCardId;
    else if (slot.length > 1) slot.unshift(slot.pop());
    this.render();
  }

  render() {
    this.innerHTML = '';
    const layout = this.cards[this.activeCard];
    if (!layout) return;

    const container = document.createElement('div');
    container.classList.add('cards-container');

    const table = document.createElement('table');
    table.classList.add('cards');

    for (const row of layout) {
      const tr = document.createElement('tr');
      for (const cell of row) {
        const td = document.createElement('td');
        td.classList.add('card-slot');
        if (!cell[0]) td.classList.add('disabled');
        if (this.isInteractive(cell)) td.classList.add('interactive');

        const btn = cell.at(-1);
        if (btn) {
          const icon = document.createElement('sc-icon');
          icon.setAttribute('icon', btn.Icon);
          icon.classList.add('card');

          const hotkey = document.createElement('span');
          hotkey.className = 'card-hotkey';
          hotkey.textContent = this.i18n(btn.Hotkey);

          const wrapper = document.createElement('div');
          wrapper.append(hotkey, icon);
          wrapper.addEventListener('click', () => this.switchIcon(cell));

          td.appendChild(wrapper);

          if (cell.length > 1) {
            const alt = document.createElement('span');
            alt.className = 'card-more';
            alt.textContent = '↺';
            td.appendChild(alt);
          }

          if (btn.Type === 'Submenu') {
            const arrow = document.createElement('span');
            arrow.className = 'card-more';
            arrow.textContent = '↪';
            td.appendChild(arrow);
          } else if (btn.Type === 'CancelSubmenu') {
            const arrow = document.createElement('span');
            arrow.className = 'card-more';
            arrow.textContent = '↩';
            td.appendChild(arrow);
          }
        }

        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    container.appendChild(table);
    this.appendChild(container);
  }
}

customElements.define('sc-card', ScCard);
