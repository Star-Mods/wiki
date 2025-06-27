import {Component, ElementRef, OnInit} from '@angular/core';
import {SCDataService} from "../sc-data.service";

@Component({
  templateUrl: './race-data.component.html',
  styleUrls: ['./race-data.component.less']
})
export class RaceDataComponent implements OnInit{
  title = 'app-sc';
  unitsListStyle: string = 'grid'
  structuresListStyle: string = 'grid'
  constructor(public scdata: SCDataService ) {}

  setUnitsListStyle(style: string){
    this.unitsListStyle = style
  }
  setStructuresListStyle(style: string){
    this.structuresListStyle = style
  }
  ngOnInit() {
  }
  techTree: any = {}
  hasProduction(unit : SCUnit){
    return unit.$Production?.filter((u) => this.scdata.raceData.cache?.units[u])?.length
  }
  showUnitDetails(unit : SCUnit,el: any){
    if(!this.techTree[unit.id]){
      this.techTree[unit.id] = el
    }
    return this.techTree[unit.id] === el
  }

  code(){
    let code: any = {}
    for(let i in this.scdata.unitData){
      if(i[0] !== "$"){
        code[i] = this.scdata.unitData[i]
      }
    }

    return JSON.stringify(code, undefined, 4).replace(/"(\w+)":/g,(a,b) => {return b + ":"})
  }

  getAdditionalFields(unit : SCUnit){
    return Object.keys(unit).sort((a,b)=> a> b? 1: -1).filter(f => {
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
  getField(unit : SCUnit, field: string){
    let value  = JSON.stringify(unit[field])
    if(field === "FlagArray"){
      value = JSON.stringify(unit[field].filter(f =>  ![
        "Movable","Unclickable","Unhighlightable","Untooltipable","KillCredit","ShowResources","ClearRallyOnTargetLost","PlayerRevivable","CameraFollow","PreventDestroy","UseLineOfSight","TownAlert","NoPortraitTalk","TownCamera","ArmorDisabledWhileConstructing"
      ].includes(f)))
    }
    value = value.replace(/"/g,'')


    if(['"',"["].includes(value[0])){
      value=value.substring(1,value.length - 1)
    }
    return  value
  }
  fields = [
    // {title: "Speed", field: "Speed"},
    // {title: "CargoSize", field: "CargoSize"},
    // {title: "Sight", field: "Sight"},
    // {title: "Plane", get: (entity: any) => entity.PlaneArray.join(",")},
    // {title: "Footprint", field: "PlacementFootprint"},
    // {title: "ObjectFamily", get: (entity: any) => entity.EditorCategories?.ObjectFamily},
    // {title: "ObjectType", get: (entity: any) => entity.EditorCategories?.ObjectType},
    // {title: "Race", field: "Race"},
    // {title: "LifeMax", field: "LifeMax"},
    // {title: "LifeRegenRate", field: "LifeRegenRate"},
    // {title: "Radius", field: "Radius"},
    // {title: "LifeRegenDelay", field: "LifeRegenDelay"},

    // {title: "ShieldsMax", field: "ShieldsMax"},
    // {title: "ShieldRegenRate", field: "ShieldRegenRate"},
    // {title: "ShieldRegenDelay", field: "ShieldRegenDelay"},
    // {title: "EnergyStart", field: "EnergyStart"},
    // {title: "EnergyMax", field: "EnergyMax"},
    // {title: "EnergyRegenRate", field: "EnergyRegenRate"},
    // {title: "Acceleration", field: "Acceleration"},
    // {title: "SpeedMultiplierCreep", field: "SpeedMultiplierCreep"},
    // {title: "Footprint", field: "Footprint"},
    // {title: "Attributes", get: (entity: any)=> entity.Attributes?.join(' - ')},
  ]
}
