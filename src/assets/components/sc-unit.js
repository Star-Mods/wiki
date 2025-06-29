import {Core} from "./lib/data.js";

class ScUnit extends Core {
  static get observedAttributes() {
    return ['mod', 'unit'];
  }

  load() {
    this.textContent = '';
    if (!this.mod || !this.unit) {
      return;
    }
    this.loadData("unit", this.mod, this.unit).then(data => {
      this.data = data
      this.render();
    })
  }

  fields(){
    return Object.keys(this.data).sort((a,b)=> a> b? 1: -1).filter(f => {
      if (["Name","Description",
          "id",
          "CostResource",
          "Food",
          "CardLayouts",
          "Attributes",
          "Weapons",
          "Behaviors",
          "Abilities",
          "Icon",
          "Model",
          "FogVisibility",
          "ResourceState",
          "ResourceType",
          "Response",
          "ReviveInfoBase",
          "ReviveType",
          "DamageDealtXP",
          "DamageTakenXP",
          "DeathRevealDuration",
          "DeathRevealFilters",
          "DeathRevealRadius",
          "DeathRevealType",
          "DefaultAcquireLevel",
          "LeaderAlias",
          "Fidget",
          "Mass",
          "Mob",
          "TauntDuration",
          "HotkeyCategory",
          "EditorCategories",
          "ScoreResult",
          "GlossaryCategory",
          "CostCategory",
          "Race",
          "ArmorType",
          "PawnItemReduction",
          "AIEvalFactor",
          "EditorFlags",
          "InnerRadiusSafetyMultiplier",
          "TacticalAIFilters",
          "TacticalAI",
          "KillDisplay",
          "AIEvaluateAlias",
          "PawnItemReduction",
          "class",
        ].includes(f) ||
        f.startsWith("$") ||
        f.startsWith("Life") ||
        f.startsWith("Shield") ||
        f.startsWith("Energy")) {
        return false
      }
      return true
    })
  }
  getValue( field){
    let value  = JSON.stringify(this.data[field])
    if(field === "FlagArray"){
      value = JSON.stringify(this.data[field].filter(f =>  ![
        "Movable","Unclickable","Unhighlightable","Untooltipable","KillCredit","ShowResources","ClearRallyOnTargetLost",
        "PlayerRevivable","CameraFollow","PreventDestroy","UseLineOfSight",
        "TownAlert","NoPortraitTalk","TownCamera","ArmorDisabledWhileConstructing",
        "AIThreatGround","AIThreatAir","AISupport"
      ].includes(f)))
    }
    value = value.replace(/"/g,'')


    if(['"',"["].includes(value[0])){
      value=value.substring(1,value.length - 1)
    }
    return  value
  }
  render() {
    const u = this.data;
    if (!u) return;

    const upgrades = (u.$Upgrades || []).filter(Boolean).map(upg =>
      `<sc-icon class="frame link" icon="${upg.Icon}" title="${upg.Name || upg.id}" data-upgrade-id="${upg.id}"></sc-icon>`
    ).join('');

    const weapons = u.Weapons && u.Weapons.length ? `
      <details open>
        <summary><p class="sc-unit-category">Weapons:</p></summary>
        <sc-unit-weapons></sc-unit-weapons>
      </details>` : '';

    const cards = u.CardLayouts?.Root ? `
      <details open>
        <summary><p class="sc-unit-category">Card:</p></summary>
        <sc-card></sc-card>
      </details>` : '';

    const production = (u.$Production || []).filter(Boolean).map(p =>
      `<sc-icon class="frame link" icon="${p.Icon}" title="${p.Name || p.id}" data-unit-id="${p.id}"></sc-icon>`
    ).join('');

    const producers = (u.$Producers || []).filter(Boolean).map(p =>
      `<sc-icon class="frame link" icon="${p.Icon}" title="${p.Name || p.id}" data-unit-id="${p.id}"></sc-icon>`
    ).join('');

    const morph = (u.$Morph || []).filter(Boolean).map(m =>
      `<sc-icon class="frame link" icon="${m.Icon}" title="${m.Name || m.id}" data-unit-id="${m.id}"></sc-icon>`
    ).join('');

    function lifeTemplate(field){
      let max = u[field + 'Max']
      if(!max){
        return ``;
      }
      let title = u[field + 'ArmorName']
      let icon = u[field + 'ArmorIcon']
      let armor = u[field + 'Armor']
      let start = u[field + 'Start']
      let regenRate = Math.round(u[field + 'RegenRate'],2)
      return `
        <div class="unit-stat" title="${title}">
          <sc-icon icon="${icon}" class="short-icon unit-armor">${armor && `<span>${armor}</span>`}</sc-icon>
          <span class="unit-stat-value">
            ${start !== undefined && start !== max ? `${start}<span class="smaller"> / </span>`: ''}${max}
            ${regenRate ? `<sub class="smaller">+${regenRate}/s</sub>` : ''}
          </span>
        </div>`
    }

    const lifeSection =  lifeTemplate("Life")
    const shieldsSection =  lifeTemplate("Shields")
    const energySection =  lifeTemplate("Energy")

    const modelSection = u.Model ? `
    <details>
      <summary><p class="sc-unit-category">Model:</p></summary>
      <sc-model></sc-model>
    </details>` : '';

    const upgradesSection = `
  <details open>
    <summary><p class="sc-unit-category">Upgrades:</p></summary>
    <div>${upgrades}</div>
  </details>`;

      const productionSection = production ? `
  <details open>
    <summary><p class="sc-unit-category">Production:</p></summary>
    <div>${production}</div>
  </details>` : '';

      const producersSection = producers ? `
  <details open>
    <summary><p class="sc-unit-category">Producers:</p></summary>
    <div>${producers}</div>
  </details>` : '';

      const morphSection = morph ? `
  <details open>
    <summary><p class="sc-unit-category">Morph:</p></summary>
    <div>${morph}</div>
  </details>` : '';


      const infoSection = `
    <div class="unit-main-info-container">
      <div class="unit-main-info">
        <sc-icon class="frame" icon="{{Icon}}" title="{{Name}}"></sc-icon>
        <div class="unit-short-stats unit-costs">
          ${u.CostResource?.Minerals ? `
                <div class="unit-stat"><span class="resources-minerals"></span><span class="unit-stat-value">${u.CostResource.Minerals}</span></div>` : ''}
          ${u.CostResource?.Vespene ? `
                <div class="unit-stat"><span class="resources-vespene"></span><span class="unit-stat-value">${u.CostResource.Vespene}</span></div>` : ''}
          ${u.Food ? `
                <div class="unit-stat"><span class="resources-supply"></span><span class="unit-stat-value">${u.Food}</span></div>` : ''}
        </div>
      </div>
      <div class="unit-stats-info">
        <p class="unit-description">${this.i18n(u.Description)}</p>
        <div class="unit-stats">
          <p>${(u.Attributes || []).map(attr => `<span class="sc-attribute">${attr}</span>`).join(' ')}</p>
        </div>
        <div class="unit-short-stats unit-stats">
          ${lifeSection}
          ${shieldsSection}
          ${energySection}
        </div>
      </div>
    </div>`


    let fields = this.fields().map(field => ({field,value: this.getValue(field)})).filter(o => o.value !== undefined);
    const statsSection = `
      <details open>
        <summary> <p class="sc-unit-category">Stats:</p></summary>
        <div class="table-container">
          <table>
            ${fields.map(({field,value}) => `<tr><td>${field}: </td><td>${value}</td></tr>`).join('')}
          </table>
        </div>
      </details>`




    this.innerHTML = this.interpolate(`
      <h5>{{Name}} ({{id}})</h5>
      <div class="sc-unit-details-content">
        ${infoSection}
        ${modelSection}
        ${statsSection}
        ${weapons}
        ${cards}
        ${upgradesSection}
        ${productionSection}
        ${producersSection}
        ${morphSection}
      </div>
    `, u);
    }

  update(field, value, old) {
    this.load();
  }
}

customElements.define('sc-unit', ScUnit);
