import fs from "fs-extra";
// import * as SCParser from "sc-parser"
import * as SCParser from "./../tool-parser/index.js"


async function wiki (config) {
  fs.mkdirSync(config.output + 'ww/ww'.replace('\\','/').substring('ww/ww'.toLowerCase(), 'ww/ww'.lastIndexOf("/")), {recursive: true})

  let mod = await SCParser.createMod({
    mods: config.mods
  })

  function textValue(id){
    if(!id){
      return null
    }
    if(!mod.text[id]){
      return "-"
    }
    return mod.text[id].Value
  }
  function getNestedCardLayouts(unitID,cardLayouts,cardLayout, result) {
    if(!cardLayouts){
      return []
    }
    if(!cardLayout){
      cardLayout = cardLayouts[0]?.LayoutButtons

      if(!cardLayout){
        return []
      }
    }

    if(!result) result = [cardLayout]

    let nested = cardLayout
        .filter(cl => cl.Type === 'Submenu')
        .map(cl => {
            let submenu = cardLayouts.find(cls => cls.CardId === cl.SubmenuCardId)
            if(!submenu){
                console.log("invalid submenu " + unitID + " " + cl.SubmenuCardId)
                return null;
            }
            return submenu;
        })
        .map(cl => cl?.LayoutButtons)
    for(let ncl of nested){
      if(!result.includes(ncl)){
        result.push(ncl)
        getNestedCardLayouts(unitID,cardLayouts,ncl,result)
      }
    }
    return result;
  }
  function flagArray(property){
    return property && Object.entries(property).filter(([key,value]) => value).map(([key,value]) => key)
  }
  function weaponInfo (entity){
    let data = entity.getResolvedData()
    let effect = data.DisplayEffect && mod.cache.effect[data.DisplayEffect]?.getResolvedData()
    return {
      ...entity,
      ...shortInfo(entity),
      Amount: effect?.Amount?.value,
      AttributeBonus: effect?.AttributeBonus,
      Kind: effect?.Kind,
      DisplayAttackCount: data.DisplayAttackCount,
      TargetFilters: data.TargetFilters?.split(";")[0].replace(",Visible","").replace("Visible",""),
      Range: data.Range || data.MinScanRange,
      Period: data.Period,
    }
  }
  function shortInfo(entity){

    // let strings = entity.$mod.locales.enUS.GameStrings
    // let strings = entity.$mod.text

    let data = entity.getResolvedData()
    let result = {
      id: entity.id,
      Icon: mod.checkImage(data.Icon || data.InfoIcon,[entity.class,entity.id]),
      Name:  textValue(data.Name)
    }

    if(data.Tooltip){
      result.Tooltip = textValue(data.Tooltip)
    }
    if(data.Description){
      result.Description = textValue(data.Description)
    }
    return result
  }
  function getCardData(entity) {
    // if(entity.id === "SCV"){
    //     entity
    // }
    let commands = []
    let layouts = {}
    let data = entity.getResolvedData()
    if (!data.CardLayouts) {
      return {layouts,commands}
    }
    for (let cl of data.CardLayouts) {
      let LayoutButtons = []
      if (cl.LayoutButtons) {
        cl.LayoutButtons = cl.LayoutButtons.filter(lb => lb.Face && lb.Type && lb.Type !== 'Undefined' && (!lb.Row || lb.Row < 3) && (!lb.Column || lb.Column < 5))
        for (let lb of cl.LayoutButtons) {

          let btn = mod.cache.button[lb.Face]

          if (!btn) {
            console.warn(`Entity not found: button.${lb.Face}`)
            continue;
          }

          if(lb.AbilCmd){
            commands.push({
              ...pick(lb,["AbilCmd"]),
              ...shortInfo(btn)
            })
          }

          let buttonData = btn.getResolvedData()

          //todo ignore restricted
          // if(buttonData.State === "Restricted"){
          //   continue;
          // }

          let hotkey = mod.locales.enUS.GameHotkeys[buttonData.Hotkey];

          if (SCParser.SCGame.specialHotkeys[hotkey]) {
            hotkey = SCParser.SCGame.specialHotkeys[hotkey]
          }

          let cost = {
            Minerals: 0,
            Vespene: 0,
            Terazine: 0,
            Custom: 0,
            Energy: 0,
            Life: 0,
            Shields: 0,
            Food: 0
          }


          let info;
          let abilData;
          if(lb.Type === 'AbilCmd'){
            if(!lb.AbilCmd){
              continue;
            }
            let [abilID,cmd]= lb.AbilCmd.split(",")
            let abil = mod.cache.abil[abilID]
            if(!abil){
              continue;
            }

            abilData = abil.data()
            info = abilData.InfoArray?.[cmd] || abilData.InfoArray?.[0] || abilData.Info || abilData;

            let costData = abilData.InfoArray?.[cmd] || abilData.InfoArray?.[0] || abilData.Info ||  abilData.Cost?.[0] || abilData.Cost || abilData;

            if(costData.Vital) {
              for (let property in costData.Vital) {
                cost[property] += costData.Vital[property]
              }
            }
            if(costData.Resource){
              for(let property in costData.Resource){
                cost[property] += costData.Resource[property]
              }
            }
            // if(abilData.Cost?.Vital){
            //     for(let property in abilData.Cost.Vital){
            //         cost[property] += abilData.Cost.Vital[property]
            //     }
            // }
            // if(abilData.Cost?.Resource){
            //     for(let property in abilData.Cost.Resource){
            //         cost[property] += abilData.Cost.Resource[property]
            //     }
            // }
            if(info?.Unit){
              let units = info.Unit
              if(units.constructor === String){
                units = [units]
              }
              for(let unit of units){
                if(mod.cache.unit[unit]){
                  let unitData = mod.cache.unit[unit].data()
                  for(let property in unitData.CostResource){
                    cost[property] += unitData.CostResource[property]
                  }
                  if(unitData.Food)cost.Food = unitData.Food
                }
              }
            }
          }
          // <Vital index="Energy" value="50"/>
          // <Charge>
          //     <CountMax value="1"/>
          //     <CountStart value="1"/>
          //     <CountUse value="1"/>
          //     <Location value="Player"/>
          //     <TimeUse value="0.0625"/>
          //     <Flags index="RestoreAllChargesOnCooldown" value="1"/>
          // </Charge>
          // <Cooldown TimeUse="15"/>



          LayoutButtons.push({
            Upgrade: info?.Upgrade,
            // Ability: abilData,
            Info: info,
            Unit: info?.Unit,
            Time: info?.Time,
            Cost: cost,
            ...pick(lb,["Row","Column","Type","AbilCmd","SubmenuCardId"]),
            // ...buttonData,
            ...shortInfo(btn),
            Hotkey: hotkey
          })

        }
      }

      layouts[cl.CardId || "Root"] = LayoutButtons
    }
    return {layouts,commands}
  }
  // function getProduction (commands){
  //   let units =[], upgrades = []
  //
  //   for(let abilcmd of commands){
  //     let [abilId, cmdIndex] = abilcmd.split(",");
  //     let abil = mod.cache.abil[abilId]?.getResolvedData();
  //     if(!abil)continue;
  //     if(cmdIndex === 'Execute') cmdIndex = 0;
  //     let unitinfo = abil.InfoArray?.[cmdIndex]?.Unit;
  //     if(unitinfo){
  //       if(unitinfo?.constructor === Array ){
  //         for(let unit of unitinfo) if(!units.includes(unit))units.push(unitinfo)
  //       }
  //       else{
  //         if(!units.includes(unitinfo)) units.push(unitinfo)
  //       }
  //     }
  //     let upgradeinfo = abil.InfoArray?.[cmdIndex]?.Upgrade;
  //     if(upgradeinfo){
  //       if(upgradeinfo?.constructor === Array ){
  //         for(let upgrade of upgradeinfo) iff(!upgrades.includes(upgrade))upgrades.push(upgradeinfo)
  //       }
  //       else{
  //         if(!upgrades.includes(upgradeinfo)) upgrades.push(upgradeinfo)
  //       }
  //     }
  //   }
  //   return {
  //     producedUnits: units,
  //     producedUpgrades: upgrades
  //   }
  // }
  function filterLinks(unitID,array,type){
    return array?.filter(w => {
      if(!w.Link){
        return false
      }
      if(!mod.cache[type][w.Link]){
        console.warn(`${type}#${w.Link} not found (${unitID})`)
        return false
      }
      return true
    }) || []
  }
  function pick(val,fields){
    let result = {}
    for (let field of fields){
      if( val[field] !== undefined){
        result[field] = val[field]
      }
    }
    return result
  }
  function getUnitBehaviors(unitID){
    let unitData = mod.cache.unit[unitID].getResolvedData()
    return unitData.BehaviorArray?.map(bh => mod.cache.behavior[bh.Link]).filter(e => e) || []
  }
  function getUnitCardCommands(unitID){
    if(!mod.cache.unit[unitID]){
      console.log(`unit ${unitID} not exists`)
      return null
    }

    let unitData = mod.cache.unit[unitID].getResolvedData()

    let layouts = getNestedCardLayouts(unitID,unitData.CardLayouts)

    // CmdButtonArray = Object {Execute: Object}
    // Execute = Object {DefaultButtonFace: "HunterSeekerMissile",
    //     Requirements: "",
    //     State: "Restricted"}
    // State = "Restricted"


    let commands =  layouts.flat()
        .filter(btn => btn && (btn.Type === "AbilCmd") && btn.AbilCmd)
        // .filter(btn => btn.State !== "Restricted") todo filter restricted abilities
        .map(btn => btn.AbilCmd)
        .map(abilcmd => abilcmd.split(","))
        .map(abilcmd => ({abil: mod.cache.abil[abilcmd[0]] , cmd: abilcmd[1]}))
        .filter(abilcmd => abilcmd.abil)

    return commands.filter(({abil,cmd}) => {
      let a = abil.data();
      let btn = a.CmdButtonArray && a.CmdButtonArray?.[cmd] || a.InfoArray && a.InfoArray[cmd]?.Button;
      return btn
      //todo ignore restricted
      // return btn && btn.State !== "Restricted"
    } )
  }
  function filterCommands(abilcmds,...classes){

    let classesfull = classes.map(c => "CAbil" + c)
    return abilcmds.filter(ac => [...classesfull].includes(ac.abil.class) && ac.cmd !== 'Cancel')
  }
  function getCommandInfoEntities(abilcmds){
    let es = abilcmds.map(ac => {
      let acd = ac.abil.data()
      if(acd.InfoArray){
        if(acd.InfoArray[ac.cmd] ){
          return acd.InfoArray[ac.cmd].Unit || acd.InfoArray[ac.cmd].Upgrade
        }
        else{
          return acd.InfoArray.map(ia => ia.Unit)
        }

      }
      else{
        return acd.Info?.Unit
      }

      // let ia = acd.InfoArray && (acd.InfoArray[ac.cmd] || acd.InfoArray[0]) || acd.Info
      // return ia.Unit || ia.Upgrade
    }).flat()

    return [...new Set(es)]
  }
  function relsEffectsDeep(entity,effects = []){
    let rels = entity.rels().filter(r => r.type === 'effect').map(r => mod.cache.effect[r.link])
    for(let rel of rels){
      if(rel && !effects.includes(rel)){
        effects.push(rel)
        relsEffectsDeep(rel,effects)
      }
    }
    return effects
  }
  function getUnitProduction(unitID){
      let abils = mod.cache.unit[unitID].AbilArray?.map(a => a.Link) || []
    let abilcmds = getUnitCardCommands(unitID).filter(ac => abils.includes(ac.abil.id) )
    let abilBehavior = filterCommands(abilcmds,'Behavior')
    let abilResearch = filterCommands(abilcmds,'Research')
    let abilProduction = filterCommands(abilcmds,'Train','WarpTrain','Build','ArmMagazine')
    let abilMorph = filterCommands(abilcmds,'Morph','MorphPlacement','Merge')
    let abilEffect = filterCommands(abilcmds,'EffectInstant','EffectTarget')

    let behaviors = getUnitBehaviors(unitID)
    for(let beh of abilBehavior){
      let abilBehaviors = [...new Set(abilBehavior.map(ab => ab.abil.data().BehaviorArray).flat())]
      for(let abilBehavior of abilBehaviors){
        if(mod.cache.behavior[abilBehavior] && !behaviors.includes(mod.cache.behavior[abilBehavior])){
          behaviors.push(mod.cache.behavior[abilBehavior])
        }
      }
    }

    let researchUpgrades = getCommandInfoEntities(abilResearch)
    let productionUnits = getCommandInfoEntities(abilProduction)
    let morphUnits = getCommandInfoEntities(abilMorph)

    for(let ac of abilProduction){
      let acd = ac.abil.data()
      if(acd.MorphUnit){
        morphUnits.push(acd.MorphUnit)
      }
    }

    for(let abil of abils){
        let abilObject = mod.cache.abil[abil]
        if(!abilObject){
            console.log("undefined ability " + abil)
        }
        else{
            if(abilObject.class.startsWith("CAbilEffect") && !abilEffect.map(a => a.abil).includes(abilObject)){
                abilEffect.push({abil: abilObject, cmd: "execute"})
            }
            if(abilObject.class.startsWith("CAbilMorph") && !abilMorph.map(a => a.abil).includes(abilObject)){
                abilMorph.push({abil: abilObject, cmd: "execute"})
            }
        }
    }

    for(let abilcmd of abilEffect){
      let abilRels = relsEffectsDeep(abilcmd.abil).map(e => e.data())

      let abilcmdSpawnUnits = abilRels.filter(e => e.class === "CEffectCreateUnit" && !e.CreateFlags?.Precursor).map(e => e.SpawnUnit).flat()
      let abilcmdBehaviors = abilRels.filter(e => e.class === "CEffectApplyBehavior").map(e => e.Behavior).flat()
      let abilcmdMorph = abilRels.filter(e => e.class === "CEffectMorph").map(e => e.MorphUnit).flat()


      for(let abilcmdBehavior of abilcmdBehaviors){
        if(mod.cache.behavior[abilcmdBehavior] && !behaviors.includes(mod.cache.behavior[abilcmdBehavior])){
          behaviors.push(mod.cache.behavior[abilcmdBehavior])
        }
      }
      for(let abilcmdSpawnUnit of abilcmdSpawnUnits){
        if(abilcmdSpawnUnit && !productionUnits.includes(abilcmdSpawnUnit)){
          productionUnits.push(abilcmdSpawnUnit)
        }
      }
      for(let abilcmdMorphUnit of abilcmdMorph){
        if(abilcmdMorphUnit && !morphUnits.includes(abilcmdMorphUnit)){
          morphUnits.push(abilcmdMorphUnit)
        }
      }
    }

    let behaviorUnits = behaviors.filter(bh => bh.data().class === "CBehaviorSpawn").map(bh => bh.data().InfoArray.map(ia => ia.Unit) ).flat()

    let behaviorBuffs = behaviors.filter(bh => bh.data().class === "CBehaviorBuff")

    let relatedEffects = []
    function addRelatedEffects(entity){
      let rels = entity.$$relations.filter(r => r.type === "effect").map(r => r.link)
      for(let rel of rels){
        if(!relatedEffects.includes(rel)){
          if(mod.cache.effect[rel]){
            relatedEffects.push(rel)
            addRelatedEffects(mod.cache.effect[rel])
          }
          else{
            console.log(`entity not exist ` + rel)
          }
        }
      }
    }
    for(let behaviorBuff of behaviorBuffs){
      addRelatedEffects(behaviorBuff)
    }

    for(let behaviorUnit of behaviorUnits){
      if(!productionUnits.includes(behaviorUnit)){
        productionUnits.push(behaviorUnit)
      }
    }

    let effectSpawnUnits = [...new Set(relatedEffects.map(relID => mod.cache.effect[relID]).filter(relEntity => relEntity?.data().SpawnUnit).map(rel => rel.data().SpawnUnit).flat())]
    productionUnits.push(...effectSpawnUnits)


    return {
      morphUnits:  [...new Set(morphUnits)],
      researchUpgrades,
      productionUnits
    }
  }
  function analyzeUpgrades(upgrades,raceData,raceUnits = [],raceUpgrades = [],path = []) {
    for (let upgradeID of upgrades) {
      if (!upgradeID || raceUpgrades.includes(upgradeID)) {
        continue;
      }
      raceUpgrades.push(upgradeID)
    }
  }
  function analyzeUnits(units, raceData, raceUnits = [],raceUpgrades = [],path = []){

    if(units) {
      for (let unitID of units) {
        if(!unitID){
          console.warn(`undefined reference ${path.join(".")}`)
          continue;
        }
        if (raceData?.exclude?.unit?.includes(unitID)) {
          continue;
        }
        if (raceUnits.includes(unitID)) {
          continue;
        }

        let unit = mod.cache.unit[unitID]
        if(!unit){
          console.warn(`invalid reference: unit ${unitID} not exists ${path.join(".")}`)
          continue;
        }

        let unitData = unit.data()

          if(unitData.Race !== raceData.id){
              console.log(raceData.id + " not suppoed to be here")
              continue;
          }

        if(!raceData?.include?.unit?.includes(unitID)){
          //skip units from dependency mods and ignored units, without required fields
          if (unitData.ignore || /* || !unitData.GlossaryPriority ||  */ unitData.FlagArray.Unselectable || unitData.EditorFlags?.NoPalettes || unitData.EditorFlags?.NoPlacement) {
            continue;
          }
        }
        raceUnits.push(unitID)

        let prod = getUnitProduction(unitID)
        unit._production = prod.productionUnits
        unit._research = prod.researchUpgrades
        unit._morph = prod.morphUnits
        unit._upgrades = unit.getReferences(ref => ref.class === 'CUpgrade').map(entity => entity.id)
        unit._requirements = unit.getRequirements()
        unit._actor = unit.getActor()
        let {layouts, commands} = getCardData(unit)
        unit._layouts = layouts
        unit._commands = commands
        unit._phase = []
        // let {producedUnits, producedUpgrades} = getProduction(commands.map(cmd => cmd.AbilCmd))

        let categories = unitData.EditorCategories?.split(",").map(cat => cat.split(':')).reduce((acc, [category, value]) => ({
          ...acc,
          [category]: value
        }), {})

        unit._category = categories?.ObjectType === 'Structure' ? 'structure' : 'army'
        unit._icon = unit._actor?.UnitIcon || unit._actor?.Wireframe?.Image?.[0]

        let model = mod.cache.model[unit._actor?.Model];
        if(model) {

          let modelData = model.$$resolved

          let modelPath = modelData.Model

          if(!modelPath){
            modelPath = modelData.id
          }

          unit._model = modelPath.split("\\").pop().replace(".m3","")

          let srcModelsDir = SC2FOLDER + "TOOLS\\web-wiki\\src\\assets\\models\\"
          let targetModelsDir = SC2FOLDER + "TOOLS\\web-assets\\public\\models2\\"

          let srcFile = srcModelsDir + unit._model + ".glb"
          let targetFile = targetModelsDir + unit._model + ".glb"
          if (fs.existsSync(srcFile)) {
            // if(!fs.existsSync(targetFile)){
            //   fs.copyFileSync( srcFile, targetFile )
            // }
          } else {
            console.log(`Model ${srcFile} does not exist.`);
            delete unit._model
          }
        }else{
          console.log(`${unit.id} No Model.`);
        }





        analyzeUnits(unit._morph, raceData, raceUnits, raceUpgrades,[...path,unit.id])
        analyzeUnits(unit._production, raceData, raceUnits, raceUpgrades,[...path,unit.id])
        analyzeUpgrades(unit._research, raceData, raceUnits, raceUpgrades,[...path,unit.id])

      }
    }

    return {units: raceUnits,upgrades: raceUpgrades}
  }

  // mod.cache.unit.ProbeSCBW.resolveButtons()
  // mod.cache.unit.CommandCenterSCBW.resolveButtons()
  // mod.resolveDataTextValues()
  mod.resolveButtons()

  mod.makeAbilCmds()
//do not add the following entities and its children to the output data
  mod.ignoreEntities({
    unit: [
      "DESTRUCTIBLE",
      "POWERUP",
      "STARMAP",
      "SS_Plane",
      "SS_BackgroundSpace",
      "Shape",
      "MISSILE_INVULNERABLE",
      "MISSILE",
      "MISSILE_HALFLIFE",
      "PLACEHOLDER",
      "PLACEHOLDER_AIR",
      "PATHINGBLOCKER",
      "BEACON",
      "SMCHARACTER",
      "SMCAMERA",
      "SMSET",
      "ITEM",
    ]
  })
//pick specific races
// mod.pick({race: ["Terr","Zerg","Prot"]})
  mod.index()

  let locales = mod.components?.filter(entity => entity.Type.toLowerCase() === "text").map(entity => entity.Locale)
  for(let textKey in mod.text){
    let textEntity = mod.text[textKey]

    let uniqueTargets = []
    let relationsPerLocale = {}
    for(let locale of locales){
      relationsPerLocale[locale] = textEntity.$$relations.filter(rel => rel.path.endsWith("." + locale))
      if(!textEntity.Value[locale]){
        if(textEntity.$category === "GameStrings"){
          // console.log(`Text Value ${textEntity.$category} ${textKey}  is not defined in locale ${locale}`)
        }
      }

      for(let relation of relationsPerLocale[locale] ){
        if(!uniqueTargets.includes(relation.target)){
          uniqueTargets.push(relation.target)
        }
      }
    }
    for(let target of uniqueTargets){
      let count = {}
      for(let locale of locales){
        if(textEntity.Value[locale]){
          count[locale] = relationsPerLocale[locale].filter(rel => rel.target === target).length
        }
      }
      // let uniqueValues = [...new Set(Object.values(count))].length;
      if(Object.values(count).includes(0)){
        if(textEntity.$category === "GameStrings") {
          console.log(`GameString ${textKey} might be not relevant. Reference ${target.id} usages: ${Object.entries(count).map(el => el.join(":")).join(",")}`)
        }
      }

      // if(uniqueValues > 1){
      //   console.log(`Relations are different ${Object.entries({"enUS": 2, "ruRU": 2}).map(el => el.join(":")).join(",")}`)
      // }
    }
  }
//replace text strings expressions with data values
  mod.resolveTextValues()
//load the list of available icons
  mod.readImages('./../web-wiki/src/assets/icons')
//check entities icons and use the available ones
  mod.checkImages()

//add actor data to units
  mod.resolveUnitActors()

 // let strings = mod.locales.enUS.GameStrings

  let output = {}

  Object.assign(mod.cache.race.Terr || {}, {
    include: {unit: ["Reactor"]},
    exclude: {unit: ["BarracksReactor", "FactoryReactor", "StarportReactor"]}
  })
  Object.assign(mod.cache.race.Zerg || {}, {
    include: {unit: ["LocustMPFlying", "Broodling"]},
    exclude: {unit: [
        "ChangelingZealotSCBW",
        "ChangelingZerglingSCBW",
        "ChangelingMarineSCBW",
        "ChangelingFlamespitter",
        "ZHBRWarrior@Changeling",
        "ChangelingSpitfire",
        "ChangelingXayidling",
        "ChangelingVolt",
        "ChangelingServitor",
        "ZerDarimChangelingSupplicant",
        "ChangelingStrikeTrooper",
        "UmojanChangelingMarine",
        "UmojanChangelingMarineShield",
        "ChangelingInfantryRifle",
        "ChangelingMarineShield",
        "ChangelingMarine",
        "ChangelingZergling",
        "ChangelingZerglingWings",
        "ChangelingZealot"
    ]}
  })
  Object.assign(mod.cache.race.BWZe || {}, {
    include: {unit: ["SporeColonySCBW", "CreepColonySCBW","SunkenColonySCBW"]},
    exclude: {unit: []}
  })
Object.assign(mod.cache.race.Prot || {}, {
  include: {unit: ["Interceptor"]},
  exclude: {unit: []},
})
  Object.assign(mod.cache.race.Dragon || {}, {
      include: {unit: ["DenizenoftheDeep","Plodder"]},
      exclude: {unit: []}
  })
  Object.assign(mod.cache.race.Gen || {}, {
      include: {unit: ["Repulsor","Interdictor"]},
      exclude: {unit: ["GenetronPowerSupplyDummy"]}
  })
  Object.assign(mod.cache.race.Keir || {}, {
      include: {unit: []},
      exclude: {unit: ["OculusCharged"]}
  })
  Object.assign(mod.cache.race.Keir || {}, {
      include: {unit: ["InterceptorSCBW","ScarabSCBW"]},
      exclude: {unit: []}
  })
  Object.assign(mod.cache.race.TerU || {}, {
        include: {unit: ["UmojanRaptor","UmojanNightwish"]},
        exclude: {unit: ["UmojanWarpingSignatureAcademy","UmojanWarpingSignatureWorkshop","UmojanWarpingSignatureBunker","UmojanWarpingSignatureShipyard","UmojanWarpingSignatureCommandHub"]}
    })
// Object.assign(mod.cache.race.Xayi,{
//     include: {unit: []},
//     exclude: {unit: ["AcidNest"]},
// })

  let racesData = mod.catalogs.race
    .map(race => ({
      ...race.getResolvedData(),
      ...pick(race, ["include", "exclude"])
    }))
    for(let race of racesData){
        racesData.Icon = "lobby-" +  race.id
    }
  // if(!config.allunits){
    racesData = racesData//.filter(race => race.Flags?.Selectable === 1)
      .filter(race => !["Neut"].includes(race.id) )
      .filter(race => !["Terr","Prot","Zerg"].includes(race.id) )
  // }

  output["index"] = {
    discord: config.discord,
    id: config.id,
    races: racesData.map(race => ({
      id: race.id,
      Name: textValue(race.Name),
      Icon: race.Icon?.toLowerCase().replace(/\\/g, '/').replace(/.*\//, '').replace('.dds', ''),
    }))
  }

  for (let raceData of racesData) {

    let outputRaceData = output[`race/${raceData.id}`] = {
      id: raceData.id,
      Name: textValue(raceData.Name),
      Icon: raceData.Icon?.toLowerCase().replace(/\\/g, '/').replace(/.*\//, '').replace('.dds', ''),
      cache: {
        upgrades: {},
        units: {},
      },
      StartingUnitArray: raceData.StartingUnitArray?.map(su => pick(su, ["Unit", "Count"])) || []
    }

    let startUnits
    if(config.allunits || raceData.id === "Dragon") {
      startUnits = mod.catalogs.unit.filter(u => (u.data().Race === raceData.id) && !u.default).map((a) => a.id)//raceData.StartingUnitArray.filter(su => su.Unit && su.Count !== 0 && su.Flags?.ResourceSetRally).map(su => su.Unit)
    } else {
      startUnits = raceData.StartingUnitArray.filter(su => su.Unit ).map(su => su.Unit)
    }
    let {units, upgrades} = analyzeUnits(startUnits, raceData)

    if (raceData.include?.unit) {
      analyzeUnits(raceData.include.unit, raceData, units, upgrades)
    }

    for (let unitID of units) {
      let unit = mod.cache.unit[unitID]

      if (unit._morph) {
        for (let i = unit._morph.length; i--;) {
          let morphID = unit._morph[i]
          let morph = mod.cache.unit[morphID]
          if (!morph) {
            continue;
          }
          if (morph._morph?.includes(unit.id)) {
            morph._phased = unit.id
            unit._phase.push(morphID)
            unit._morph.splice(i, 1)
            if (unit._phased) {
              let phased = mod.cache.unit[unit._phased]
              phased._phase.push(morphID)
            }
          }
        }
      }
    }

    let sortedUnits = units.sort((a, b) => {
      return mod.cache.unit[a].data().GlossaryPriority || 9999 > mod.cache.unit[b].data().GlossaryPriority || 9999 ? 1 : -1
    })


    outputRaceData.army = sortedUnits.filter((a) => mod.cache.unit[a]._category === 'army')

    outputRaceData.structures = sortedUnits.filter((a) => mod.cache.unit[a]._category === 'structure')

    for (let upgradeID of upgrades) {
      let upgrade = mod.cache.upgrade[upgradeID]
      if(!upgrade){
        console.warn(`invalid upgrade reference ${upgradeID}`)
        continue;
      }
      let num = /([@_\w]+?)([0-9]+)$/.exec(upgradeID)
      if (num) {
        if (num[2] !== "1") {
          upgrade._phased = num[1] + "1"
          let phasedUpgrade = mod.cache.upgrade[upgrade._phased]
          if (!phasedUpgrade) {
            continue;
          }
          if (!phasedUpgrade._phase) {
            phasedUpgrade._phase = []
          }
          phasedUpgrade._phase.push(upgradeID)
        }
      }
    }
    for (let upgradeID of upgrades) {
      let upgrade = mod.cache.upgrade[upgradeID]
      if(!upgrade){
        console.warn(`invalid upgrade reference ${upgradeID}`)
        continue;
      }
      let upgradeData = upgrade.data()
      let shortUpgradeData = shortInfo(upgrade)

      output[`upgrade/${upgradeID}`] = {
        ...upgradeData,
        ...shortUpgradeData,
        Icon: upgradeData.Icon,
      }

      outputRaceData.cache.upgrades[upgradeID] = {
        ...upgradeData,
        ...shortUpgradeData,
        Icon: upgradeData.Icon,
        $Phase: upgrade._phase && [...upgrade._phase],
        $Phased: upgrade._phased
      }
    }
    outputRaceData.upgrades = upgrades

    for (let unitID of sortedUnits) {
      let unit = mod.cache.unit[unitID]
      let unitData = unit.data()
      let shortUnitData = shortInfo(unit)

      output[`unit/${unit.id}`] = {
        ...unitData,
        ...shortUnitData,
        Icon: unit._icon,
        Model: unit._model,
        LifeArmorIcon: unit._actor?.LifeArmorIcon,
        ShieldArmorIcon: unit._actor?.ShieldArmorIcon,
        LifeArmorName: textValue(unitData.LifeArmorName),
        ShieldArmorName: textValue(unitData.ShieldArmorName),
        // class: null,
        BehaviorArray: unitData.BehaviorArray?.map(b => b.Link),
        AbilArray:  unitData.AbilArray?.map(b => b.Link),
          // WeaponArray: null,
        CardLayouts: unit._layouts,
        Weapons: filterLinks(unit.id, unitData.WeaponArray, "weapon").map(w => ({Turret: w.Turret, ...weaponInfo(mod.cache.weapon[w.Link])})),
        Behaviors: filterLinks(unit.id, unitData.BehaviorArray, "behavior").map(b => shortInfo(mod.cache.behavior[b.Link])),
        Abilities: filterLinks(unit.id, unitData.AbilArray, "abil").map(a => shortInfo(mod.cache.abil[a.Link])),
        $Upgrades: unit._upgrades,
        $Requirements: [...unit._requirements.units, ...unit._requirements.upgrades],
        $Production: [...unit._production],
        $Research: [...unit._research],
        $Morph: [...unit._morph],
        $Phase: [...unit._phase],
        $Phased: unit._phased,
        $Producers: unit._requirements.producers,
        $Commands: unit._commands,
        EditorFlags: flagArray(unitData.EditorFlags),
        FlagArray: flagArray(unitData.FlagArray),
        PlaneArray: flagArray(unitData.PlaneArray),
        Collide: flagArray(unitData.Collide),
        Attributes: flagArray(unitData.Attributes),
      }

      outputRaceData.cache.units[unitData.id] = {
        ...shortUnitData,
        ...pick(unitData, ['LifeMax', 'LifeArmor', 'ShieldsMax', 'ShieldArmor', 'Food', 'CostResource']),
        Production: [...unit._production],
        Research: [...unit._research],
        Morph: [...unit._morph],
        Icon: unit._icon,
        $Phase: unit._phase && [...unit._phase],
        $Phased: unit._phased,
        LifeArmorIcon: unit._actor?.LifeArmorIcon,
        ShieldArmorIcon: unit._actor?.ShieldArmorIcon,
        LifeArmorName: textValue(unitData.LifeArmorName),
        ShieldArmorName: textValue(unitData.ShieldArmorName),
        priority: unitData.GlossaryPriority
      }
    }
  }


    fs.removeSync(config.output)

  function put(race,parent,child){
      let rf = output['race/' + race];
      if(!rf)return;
      if(parent === null){
          delete rf.cache.units[child].$Phased
          for(let unit in rf.cache.units){
              if(rf.cache.units[unit].$Phase.includes(child)){
                  rf.cache.units[unit].$Phase.splice(rf.cache.units[unit].$Phase.indexOf(child,1))
              }
          }
      }
      if(rf.cache.units[parent] && rf.cache.units[child]){
          if(!rf.cache.units[parent].$Phase){
              rf.cache.units[parent].$Phase = []
          }
          rf.cache.units[parent].$Phase.push(child);
          rf.cache.units[child].$Phased = parent
      }
      else{
          console.log(`no replace found ${rf} ${parent} ${child}`)
      }
  }

    put("Terr","Barracks","BarracksTechLab")
    put("Terr","Factory","FactoryTechLab")
    put("Terr","Starport","StarportTechLab")
    put("Terr","Raven","AutoTurret")
    put("Prot","Disruptor","DisruptorPhased")
    put("Prot","Adept","AdeptPhaseShift")
    put("Prot","Carrier","Interceptor")
    put("Prot","Oracle","OracleStasisTrap")
    put("Zerg","LocustMPFlying","LocustMP")
    put("Zerg","NydusCanal","NydusNetwork")
    put("Zerg","Larva","Egg")
    put("Zerg","LurkerMP","LurkerMPEgg")
    put("Zerg","OverlordTransport","TransportOverlordCocoon")
    put("Zerg","Overseer","OverlordCocoon")
    put("Zerg","BroodLord","BroodLordCocoon")
    put("Zerg","Baneling","BanelingCocoon")
    put("Zerg","Ravager","RavagerCocoon")
    put("Zerg","Spire","GreaterSpire")
    put("Zerg","Hatchery","Lair")
    put("Zerg","Hatchery","Hive")
    // put("Zerg","Overseer","Changeling")
    put("BWPr","ReaverSCBW","ScarabSCBW")
    put("BWPr","CarrierSCBW","InterceptorSCBW")
    put("BWZe","InfestedCommandCenterSCBW","InfestedCommandCenterSCBW@Flying")
    put("BWZe","InfestedCommandCenterSC2","InfestedCommandCenterSC2@Flying")
    put("BWZe","InfestedOrbitalCommandSCBW","InfestedOrbitalCommandSCBW@Flying")
    put("BWZe","CreepColonySCBW","SunkenColonySCBW")
    put("BWZe","CreepColonySCBW","SporeColonySCBW")
    put("BWZe","QueenSCBW","BroodlingSCBW")
    put("BWZe","GuardianSCBW","EggSCBW")
    put("BWZe","GuardianSCBW","GuardianSCBWEgg")
    put("BWZe","LarvaSCBW","LurkerSCBWEgg")
    put("BWZe","LurkerSCBW","DevourerSCBWEgg")
    put("BWZe","HatcherySCBW","LairSCBW")
    put("BWZe","HatcherySCBW","HiveSCBW")
    put("BWTe","ScienceFacilitySCBW","ScienceFacilitySCBW@Flying")
    put("BWTe","StarportSCBW","StarportSCBW@Flying")
    put("BWTe","RefinerySCBW","RefinerySCBW@Rich")
    put("BWTe","VultureSCBW","SpiderMineSCBW")
    put("BWTe","SiegeTankSCBW","SiegeTankSCBWSieged")
    put("Dragon","DragonHunter","AscendedDragonHunter")
    put("Dragon","UnseenBeast","AscendedUnseenBeast")
    put("Dragon","Fleshrender","AscendedFleshrender")
    put("Dragon","AuroraConduit","AscendedAuroraConduit")
    put("Dragon","BrimstoneDemolisher","AscendedBrimstoneDemolisher")
    put("Dragon","Skyrazer","AscendedSkyrazer")
    put("Dragon","Berserker","AscendedBerserker")
    put("Dragon","HandofPower","AscendedHandofPower")
    put("Dragon","Plodder","AscendedPlodder")
    put("Dragon","HornedMagus","AscendedHornedMagus")
    put("Dragon","VolcanicHarbinger","AscendedVolcanicHarbinger")
    put("Dragon","Flamespitter","AscendedFlamespitter")
    put("Dragon","Arkwyrm","AscendedArkwyrm")
    put("Dragon","Razorback","AscendedRazorback")
    put("Dragon","VolcanicHarbinger","VolcanicHarbingerOverload")
    put("Dragon","GrimGlider","AscendedGrimGlider")
    put("Dragon","FrontierDeepOne","AugmentationPitFrontier")
    put("Dragon","GreaterDeepOne","AugmentationPitGreater")
    put("Dragon","LesserDeepOne","AugmentationPitLesser")
    put("Dragon","ToweringDeepOne","AugmentationPitTowering")
    put("Dragon","Coagulator","CoagulatorRich")
    put("Dragon","GreaterDeepOne","GenesisPitGreater")
    put("Dragon","LesserDeepOne","GenesisPitLesser")
    put("Dragon","ToweringDeepOne","GenesisPitTowering")
    put("Gen","Tesla","CloakCharge")
    put("Gen","Tesla","ShockCharge")
    put("Gen","Torrent","LunaMine")
    put("Keir","Aurora","Emanator")
    put("Keir","Myriad","Elytron")
    put("Keir","Citadel","CitadelCharged")
    put("Xayi","Kraken","VolatileDischarge")
    put("Xayi","Xayithoan","Scion_Watcher")
    put("Xayi","Prowler","AcidNest")
    put("Xayi","Mendling","SacrificialMutation")
    put("UPLL","UPLScout","UPLDestructibleDebris4x4")
    put("ZHBR","ZHBRStrider","ZHBRStriderCrawler")
    put("Synd","MycoProcessor","GreaterProcessor")
    put("Synd","Garrison","SuperGarrison")
    put("Synd","Assembly","SuperAssembly")
    put("Synd","Hangar","SuperHangar")
    put("Synd","Bloodletter","ZerglingHolo")
    put("Synd","UmpireCraft","BomberBot")
    put("TerU","UmojanMarine","UmojanBattlecatSpahi")
    put("TerU","UmojanPlasmabat","UmojanBattlecatCuirassier")
    put("TerU","UmojanShadowguard","UmojanBattlecatLancer")
    put("TerU","UmojanPathfinder","UmojanStasisMine")
    put("TerU","UmojanPathfinder","UmojanGroundSensor")
    put("TerU","UmojanSupplyCache","UmojanEnergyGenerator")
    put("TerU","UmojanHexareme","UmojanRaptor")
    put("TerU","UmojanWhirlwind","UmojanNightwish")
    put("Xayi","XayidDen","Worm")
    put("Xayi","BiomassHatchery","Grub")
    put("Xayi","AvianNest","Wasp")
    put("Nod","NodSaboteur","NodBoobyTrap")
    put("Nod","NodReckoner","NodReckonerUnpack")
    put("Nod","NodTurretsHub","NodShredderTurret")
    put("Nod","NodTurretsHub","NodLaserTurret")
    put("Nod","NodTurretsHub","NodMissileTurret")
    put("Nod","NodPowerPlant","NodPowerPlantUpgraded")
    put("Nod","NodEmissary","NodEmissaryDeployed")
    put("Nod","NodShadow","NodArtilleryBeacon")
    put("Nod",null,"NodConstructionYard")
    put("Nod","NodConstructionYard","NodMCV")

    put("GDI",null,"GDIConstructionYard")
    put("GDI","GDIConstructionYard","GDIMCV")
    put("GDI","GDIPowerPlant","GDIPowerPlantUpgraded")
    put("GDI","GDIRig","GDIBattleBase")
    put("GDI","GDISurveyor","GDIOutpost")




  for (let file in output) {
    fs.mkdirSync(config.output + file.replace('\\','/').substring(file.toLowerCase(), file.lastIndexOf("/")), {recursive: true});

    fs.writeFileSync(config.output + file.toLowerCase() + '.json', SCParser.formatData(output[file], 'json'), 'utf-8')
  }

}


const SC2FOLDER = `C:\\Games\\StarCraft II\\`

SCParser.SCGame.directories.sc2  = SC2FOLDER
SCParser.SCGame.directories.versions  = SC2FOLDER + `Mods\\all-races-factions-versions`
SCParser.SCGame.directories.builtin   = SC2FOLDER + 'Mods\\all-races-native'
SCParser.SCGame.directories.factions  = SC2FOLDER + 'Mods\\all-races-factions-data'
SCParser.SCGame.directories.exo  = SC2FOLDER + 'Mods\\all-races-crossover-data'
SCParser.SCGame.directories.cnc       = SC2FOLDER + 'Mods\\command-and-conquer'
SCParser.SCGame.directories.htxl       = SC2FOLDER + 'Mods\\all-races-factions-htxl'

// let localPath = './../../../mods/all-races-mods/factions/'
// let arcGitPath = 'github:hometlt/starcraft-all-races-mods/'
// let scionGitPath = 'github:Solstice245/scion-keiron-dev/'

// await wiki( {
//   discord:"https://discord.gg/Xx9xurbb4u",
//   id:"voidMulti",
//   mods: [
//     '$builtin/Core.SC2Mod',
//     '$builtin/Liberty.sc2mod',
//     '$builtin/Swarm.sc2mod',
//     '$builtin/Void.sc2mod',
//     '$builtin/VoidMulti5011.sc2mod',
//     // '$dependencies/Base.SC2Mod',
//     // '$dependencies/VoidMulti.SC2Mod',
//     // '$factions/Scion.SC2Mod',
//     // '$factions/Dragons.SC2Mod',
//     // '$factions/UED.SC2Mod',
//     // '$factions/UPL.SC2Mod',
//     // '$factions/Hybrids.SC2Mod',
//     // '$factions/Synoid.SC2Mod',
//     // '$factions/Umojan.SC2Mod'
//   ],
//   output: './../src/data/lotv5011/'
// })

await wiki( {
  discord:"https://discord.gg/8T4MUA3xXr",
  id: "test",
  allunits: true,
  mods: [
    '$builtin/Core.SC2Mod',
    '$versions/Base.SC2Mod',
    '$versions/VoidMulti5014.SC2Mod',
    // '$factions/BroodWar.SC2Mod',
    // '$factions/Scion.SC2Mod',
    // '$exo/WarCraft.SC2Mod'
    // '$exo/WarHammer.SC2Mod'
    '$exo/Warzone.SC2Mod'
    //==All Races==
    // '$factions/Dragons.SC2Mod',
    // '$factions/UED.SC2Mod',
    // '$factions/UPL.SC2Mod',
    // '$factions/Hybrids.SC2Mod',
    // '$factions/Synoid.SC2Mod',
    // '$factions/Umojan.SC2Mod',
    // '$factions/TalDarim.SC2Mod',
    //==CnC==
    // '$cnc/cnc-data.SC2Mod',
    // '$cnc/tib-data.SC2Mod',
    // '$cnc/red-data.SC2Mod',
    //==HTXL==
    // '$htxl/HTXLCommon.SC2Mod',
    // '$htxl/CovertOps.SC2Mod',
    // '$htxl/Golden.SC2Mod',
    // '$htxl/HTXL.SC2Mod',
    // '$htxl/Ihanrii.SC2Mod',
    // '$htxl/Moebius.SC2Mod',
    // '$htxl/Purifier.SC2Mod',
    // '$htxl/Taldarim.SC2Mod',
    // '$htxl/Umoya.SC2Mod',
    // '$htxl/Webby.SC2Mod'
  ],
  output: './../web-wiki/src/assets/data/test/'
})

// await wiki( {
//   discord:"https://discord.gg/Xx9xurbb4u",
//   id:"scion",
//   mods: [
//     './input/legacy.json',
//     // './input/scion.json',
//     // localPath + 'ScionMod.SC2Mod',
//     // localPath + 'Dragons.SC2Mod',
//     // localPath + 'UED.SC2Mod',
//     // localPath + 'UPL.SC2Mod',
//     // localPath + 'Hybrids.SC2Mod',
//     // localPath + 'Synoid.SC2Mod',
//     // localPath + 'Umojan.SC2Mod',
//   ],
//   output: './../data/scion2/'
// })

//
// await wiki( {
//   discord:"https://discord.gg/Xx9xurbb4u",
//   id:"scion",
//   allunits: true,
//   mods: [
//     './input/nexus.json',
//     // './input/talon.json',
//     // './input/scion.json',
//     // localPath + 'ScionMod.SC2Mod',
//     // localPath + 'Dragons.SC2Mod',
//     // localPath + 'UED.SC2Mod',
//     // localPath + 'UPL.SC2Mod',
//     // localPath + 'Hybrids.SC2Mod',
//     // localPath + 'Synoid.SC2Mod',
//     // localPath + 'Umojan.SC2Mod',
//   ],
//   output: './../data/nexus/'
// })


/**
 *
 (<br/>)*<span style=\\"color:\s*\#?ffff8a*\\">([\w ]+)\.?</span>
 **$2**
 *
 *
 <span style=\\"color:\s*\#?FFFF80*\\">([\w ]+)</span>
 **$2**

 <span style="color: #FFFF80">Acid Nests</span><br/><br/><span style="color: #FFE303">Detector</span><br
 *#$2#*



 *
 */
