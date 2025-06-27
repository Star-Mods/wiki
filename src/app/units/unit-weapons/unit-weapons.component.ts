import {Component, Input, OnInit} from '@angular/core';
import {environment} from "../../../environments/environment";
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import {SCDataService} from "../../sc-data.service";
import {Observable} from "rxjs";


@Component({
  selector: 'sc-unit-weapons',
  templateUrl: './unit-weapons.component.html',
  styleUrls: ['./unit-weapons.component.less']
})
export class UnitWeaponsComponent  {
  _unit: any;
  get unit(): any { return this._unit }
  @Input() set unit(value: any) { this._unit = value }


  constructor(public scdata: SCDataService) {
  }

  getAdditionalFields(unit : SCUnit){
    return Object.keys(unit).sort((a,b)=> a> b? 1: -1).filter(f => {
      if (["Name","Description",
          "id",
          "Icon",
          "TargetFilters",
          "Range",
          "Period",
          "DisplayAttackCount",
          "Amount",
          "EditorCategories",
          "DisplayEffect",
          "Effect",
          "Race",
          "Tip",
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
    let value = JSON.stringify(unit[field])
    value = value.replace(/"/g,'')
    if(['"',"["].includes(value[0])){
      value=value.substring(1,value.length - 1)
    }
    return  value
  }
  weaponFields = [
    // {title: 'Id', field: 'Id'},
    // {title: 'Name', field: 'Name'},
    {title: 'Targets', field: 'TargetFilters'},
    {title: 'Range', field: 'Range'},
    {title: 'Period', field: 'Period'},
    {title: 'Count', field: 'DisplayAttackCount'},
    {title: 'Damage', field: 'Amount'},
    {title: 'Backswing', field: 'Backswing'},
    {title: 'DamagePoint', field: 'DamagePoint'},
    {title: 'Kind', field: 'Kind'},
    {
      title: 'Bonus',
      get: (entity: any) => entity.AttributeBonus && Object.entries(entity.AttributeBonus)
        .map(([key,value]) => `+${value} vs ${key}`)
        .join(',')
    }
  ]
}
