import {AfterContentInit, Component, Input} from '@angular/core';
import * as modelPlayer from "./Player";
import {SCDataService} from "../../sc-data.service";

@Component({
  selector: 'sc-unit-stats',
  templateUrl: './unit-stats.component.html',
  styleUrls: ['./unit-stats.component.less']
})
export class UnitStatsComponent implements AfterContentInit {
  _unit: any;
  get unit(): any {

    return this._unit }
  @Input() set unit(value: any) {
    this._unit = value
    setTimeout(()=>{
      this.loadModel()
    },500)
  }

  constructor(public scdata: SCDataService ) {}



  scene: any
  viewerElement: any
  ngAfterContentInit(): void {
    setTimeout(()=>{
      var nameElement = document.getElementById('name')
      var loadingElement = document.getElementById('loading')
      this.viewerElement = document.getElementById('viewer-inner')
      this.scene = modelPlayer.prepareScene(this.viewerElement, {width: 200, height: 250, background: '#3a4d63'})
    },50)
  }

  fullscreen(){
    modelPlayer.goFullScreen(this.viewerElement)
  }
  loadModel(){
    this.viewerElement.addEventListener('loading', function (event) {
      console.log(event)
      // if (event.detail.loaded === 0) {
      //   nameElement.innerHTML = 'Loading...'
      // }
      // var progress = Math.floor(100 * event.detail.loaded / event.detail.total)
      // loadingElement.innerHTML = progress + '%'
    })

    // export declare function loadObject(scene: Scene, url: string, materialUrl?: string, callback?: (err: ErrorEvent) => void): Scene;
    // modelPlayer.loadObject(scene, './assets/sample.obj', function () {
    //   console.log("loaded")
    // })

    // var fullScreenButton = document.getElementById('fullscreen-button')
    // fullScreenButton.addEventListener('click', function () {
    //   modelPlayer.goFullScreen(viewerElement)
    // })


    modelPlayer.clearScene(this.scene)
    modelPlayer.resetCamera(this.scene)
    // modelPlayer.showGrid(this.scene)
    //nameElement.innerHTML = el
    if(this._unit.Model){
      document.getElementById("viewer").style.display =  "block"
      modelPlayer.loadGlb(this.scene,this.scdata.modelsRoot + this._unit.Model + '.glb', function () {
        //console.log("loaded")
        // loadingElement.innerHTML = ''
      })
    }
    else{
      document.getElementById("viewer").style.display =  "none"
    }

  }
  fields = [
    // {title: "ObjectFamily", get: (entity: any) => entity.EditorCategories?.ObjectFamily},
    // {title: "ObjectType", get: (entity: any) => entity.EditorCategories?.ObjectType},
    // {title: "Race", field: "Race"},
    // {title: "LifeMax", field: "LifeMax"},
    // {title: "LifeRegenRate", field: "LifeRegenRate"},
    {title: "Radius", field: "Radius"},
    {title: "LifeRegenDelay", field: "LifeRegenDelay"},

    // {title: "ShieldsMax", field: "ShieldsMax"},
    // {title: "ShieldRegenRate", field: "ShieldRegenRate"},
    {title: "ShieldRegenDelay", field: "ShieldRegenDelay"},
    // {title: "EnergyStart", field: "EnergyStart"},
    // {title: "EnergyMax", field: "EnergyMax"},
    // {title: "EnergyRegenRate", field: "EnergyRegenRate"},
    {title: "Speed", field: "Speed"},
    {title: "Acceleration", field: "Acceleration"},
    {title: "SpeedMultiplierCreep", field: "SpeedMultiplierCreep"},
    {title: "CargoSize", field: "CargoSize"},
    {title: "Sight", field: "Sight"},
    {title: "Plane", get: (entity: any) => entity.PlaneArray.join(",")},
    // {title: "Footprint", field: "Footprint"},
    {title: "Footprint", field: "PlacementFootprint"},
    // {title: "Attributes", get: (entity: any)=> entity.Attributes?.join(' - ')},
  ]

}
