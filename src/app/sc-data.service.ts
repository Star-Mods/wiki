import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {BehaviorSubject, catchError, filter, Observable, of, retry, Subject, throwError} from "rxjs";
import {ActivatedRoute, NavigationEnd, Router, UrlSegment} from "@angular/router";
import {Inject, Injectable, InjectionToken, Optional} from '@angular/core';
export const ENVIRONMENT = new InjectionToken<{ [key: string]: any }>('environment');
import {Title} from "@angular/platform-browser";
import { Meta } from '@angular/platform-browser';



@Injectable({
  providedIn: 'root'
})
export class SCDataService {

  private readonly environment: any;

  dataRoot: string
  imagesRoot: string
  modelsRoot: string
  modID: string
  raceID: string
  entityCatalog: string
  entityID: string


  modsData: any | null
  modData: SC2Data  | null
  unitData: SCUnit | null
  upgradeData: SCUpgrade  | null
  raceData: any | null
  modLoading: boolean
  developer: boolean = false
  locales: any = [
    {locale: "enUS", title: "EN"},
    {locale: "ruRU", title: "RU"}
  ]
  locale: any

  setLocale(locale){
    this.locale = locale
    localStorage.setItem("locale", locale.locale)
  }
  filteredWeapons(weapons){
    return weapons?.filter(Boolean).filter(item => item.id) || []
  }
  filteredUnits(units){
    return units?.map(u => u && this.raceData?.cache?.units?.[u]).filter(Boolean) || []
  }
  text(textValue){
    if(!textValue){
      return ""
    }
    if(textValue.constructor === String){
      return textValue
    }
    return textValue[this.locale.locale] || textValue["enUS"] || Object.values(textValue)[0]
  }
  filteredUpgrades(upgrades){
    return upgrades?.map(u => u && this.raceData?.cache?.upgrades?.[u.id]).filter(Boolean) || []
  }
  constructor(private http: HttpClient,
              private router: Router,
              private title: Title,
              private meta: Meta,
              private route: ActivatedRoute,
              @Optional() @Inject(ENVIRONMENT) environment: any
  ) {
    this.environment = environment !== null ? environment : {};
    this.dataRoot = this.environment.dataRoot
    this.imagesRoot = this.environment.imagesRoot
    this.modelsRoot = this.environment.modelsRoot


    this.locale = this.locales[0]
    let storedLocale = localStorage.getItem("locale")
    if(storedLocale){
      this.locale = this.locales.find(l => l.locale ===storedLocale)
    }

    this.http.get(`${this.dataRoot}melee.json`).subscribe(data => this.modsData = data)


    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(e => {
      let mod,race,unit,upgrade,catalog,entity
      // [mod,race,catalog,entity] = this.router.url.substring(1).split("/")

    })


    this.route.queryParamMap.subscribe(params => {
      let mod,race,unit,upgrade,catalog,entity
      mod = params.get('mod');
      race = params.get('race');
      unit = params.get('unit');
      upgrade = params.get('upgrade');


      if(upgrade){catalog = "upgrade";entity = upgrade}
      if(unit){catalog = "unit";entity = unit}
      let switchRace;
      mod = mod?.toLowerCase()
      race = race?.toLowerCase()
      entity = entity?.toLowerCase()
      catalog = catalog?.toLowerCase()

      if((entity || race) && !mod){
        mod = "arc";
      }

      let forceEntityUpdate= false;

      if(this.modID !== mod){
        forceEntityUpdate = true;
        this.modID = mod
        if(mod){
          this.modLoading = true
          this.http.get(`${this.dataRoot}${mod}/index.json`).subscribe((data: SC2Data) => {
            this.modData = data
            this.modLoading = false
          },()=>{
            this.modData = null
            this.modLoading = false
          })
        }
        else{
          this.modData = null
        }
      }


      if(entity && catalog && (forceEntityUpdate || this.entityID !== entity || this.entityCatalog !== catalog)) {
        this.entityID = entity
        this.entityCatalog = catalog

         this.http.get(`${this.dataRoot}${this.modID}/${catalog}/${entity}.json`).subscribe(data => {

          switch(catalog){
            case "unit":
              let unitData = data as SCUnit
              this.unitData = unitData
              this.upgradeData = null
              this.updateTitle()
              break;
            case "upgrade":
              this.unitData = null
              this.upgradeData = data as SCUpgrade
              break;
            default:
              this.unitData = null
              this.upgradeData = null
          }

           if(!race){
             race = this.unitData?.Race || this.upgradeData?.Race
             this.http.get(`${this.dataRoot}${this.modID}/race/${race.toLowerCase()}.json`).subscribe(data => {
               this.raceData = data
               this.updateTitle()
             },()=>{
               this.raceData = null
               this.updateTitle()
             })
           }

        },()=>{
          this.unitData = null
          this.upgradeData = null
          this.updateTitle()
        })
      }
      else{
        switchRace = this.raceID !== race
        if(!entity){
          this.unitData = null
          this.upgradeData = null
          this.updateTitle()
        }

        if(switchRace){
          this.raceID = race
          if(race){
            this.http.get(`${this.dataRoot}${this.modID}/race/${race}.json`).subscribe(data => {
              this.raceData = data
              this.updateTitle()
            },()=>{
              this.raceData = null
              this.updateTitle()
            })
          }
          else{
            this.raceData = null
            this.updateTitle()
          }
        }
      }


    });


  }
  getModQueryParam(options : any){
    if(this.modData.id !== "arc"){
      options.mod = this.modData.id;
    }
    return options
  }
  updateTitle(){

    let favIcon: HTMLLinkElement = document.querySelector('#favicon');
    let title = 'All Races Wiki'
    let icon = 'favicon.ico'
    if(this.unitData){
      title = this.text(this.unitData.Name)
      icon = `${this.imagesRoot}${this.unitData.Icon}` + '.png'
    }
    else if(this.raceData){
      title =this.text(this.raceData.Name)
      icon = `${this.imagesRoot}${this.raceData.Icon}` + '.png'
    }

    favIcon.href = icon;
    this.title.setTitle(title);
    this.meta.updateTag({property: 'og:title', content: title});
    this.meta.updateTag({property: 'og:image', content: icon});
    this.meta.updateTag({property: 'og:type', content: 'website'});
    this.meta.updateTag({property: 'og:url', content: window.location.href})
  }
  modRoute( mod: any){
    // return ['/', mod.id.toLowerCase()]
    return `/mod=${mod.id.toLowerCase()}`
  }
  raceRoute( entity: any){
    return ['/', this.modID.toLowerCase(), entity.id.toLowerCase()]
  }
  upgradeRoute( entity: any){
    // return ['/', this.modID.toLowerCase(), this.raceID.toLowerCase(), 'upgrade' , entity.id.toLowerCase()]
    return `/mod=${this.modID.toLowerCase()}&race=${this.raceID.toLowerCase()}&upgrade=${entity.id.toLowerCase()}`
  }
  unitRoute( entity: any){
    // return ['/', this.modID.toLowerCase(), this.raceID.toLowerCase(), 'unit' , entity.id.toLowerCase()]
    return `/mod=${this.modID.toLowerCase()}&race=${this.raceID.toLowerCase()}&unit=${entity.id.toLowerCase()}`
  }
  isSelected(catalog: string, entity : string){
    return  this.entityID === entity && this.entityCatalog === catalog
  }
  unitURL(unit: any){
    return this.environment.dataRoot + this.modID.toLowerCase()  + '/unit/' + unit.id.toLowerCase() + '.json'
  }
  upgradeURL(upgrade: any){
    return this.environment.dataRoot + this.modID.toLowerCase()  + '/upgrade/' + upgrade.id.toLowerCase() + '.json'
  }
  getValue(key: string, defaultValue?: any): any {
    return this.environment[key] || defaultValue;
  }
}
