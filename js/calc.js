// node definitions and calc functions
import { ITEMS, RECIPES, BELT_CAPS, SORTER_SPEEDS } from './data.js';
import { State } from './state.js';
// multi-input machine calc (arc smelter + assembler)
// the input with the worst supply/demand ratio caps the output
// inflowMap: {itemKey: rate_per_min}, speedMult: assembler tier multiplier
function calcMultiInputMachine(n, inflowMap, speedMult) {
  var rec = RECIPES[n.props.recipe];
  if (!rec) {
    n.computed = {error: 'No recipe selected'};
    return n.computed;
  }
  var cnt = n.props.count || 1;
  if (!speedMult) {
    speedMult = 1.0;
  }
  var pTier = n.props.proliferator_tier || 'none';
  var pMode = n.props.proliferator_mode || 'extra_products';
  var prolifSpeedBoost = (pTier !== 'none' && pMode === 'speed') ? ({mk1:1.25,mk2:1.5,mk3:2.0}[pTier]||1.0) : 1.0;
  var prolifOutputMult = (pTier !== 'none' && pMode === 'extra_products') ? ({mk1:1.125,mk2:1.25,mk3:1.5}[pTier]||1.0) : 1.0;
  var prolifPwrMult = 1.0;
  if (pTier !== 'none') {
    prolifPwrMult = ({extra_products:{mk1:1.125,mk2:1.25,mk3:1.5},speed:{mk1:2.0,mk2:2.5,mk3:3.0}}[pMode]||{})[pTier] || 1.0;
  }
  var effectiveTime = rec.time / (speedMult * prolifSpeedBoost);
  var outSorterCap = SORTER_SPEEDS[n.props.output_sorter_tier] * 60 / (n.props.output_sorter_reach || 1) * cnt;
  var outputQty = rec.outputs[0].qty;
  var maxOutputByMachines = outputQty / effectiveTime * 60 * cnt * prolifOutputMult;

  var inSorterCapPerItem = SORTER_SPEEDS[n.props.input_sorter_tier] * 60 / (n.props.input_sorter_reach || 1) * cnt;

  // find the fill ratio for each input; the lowest one is the bottleneck
  var inputDetails = [];
  var bottleneckRatio = 1.0; // 1.0 means fully fed

  for (var ii = 0; ii < rec.inputs.length; ii++) {
    var inp = rec.inputs[ii];
    var needPerMin = inp.qty / effectiveTime * 60 * cnt;
    var available = (inflowMap && inflowMap[inp.item]) ? inflowMap[inp.item] : 0;
    var capped = Math.min(available, inSorterCapPerItem, needPerMin);
    var ratio = needPerMin > 0 ? capped / needPerMin : 0;
    inputDetails.push({
      item: inp.item,
      qty: inp.qty,
      need: needPerMin,
      arriving: available,
      effective: capped,
      ratio: ratio
    });
    if (ratio < bottleneckRatio) {
      bottleneckRatio = ratio;
    }
  }

  // output scales with the bottleneck
  var rawOutput = maxOutputByMachines * bottleneckRatio;
  var outputAfterSorter = Math.min(rawOutput, outSorterCap);
  var efficiency = maxOutputByMachines > 0 ? Math.round(outputAfterSorter / maxOutputByMachines * 100) : 0;

  // total inflow for display
  var totalInflow = 0;
  if (inflowMap) {
    var ikeys = Object.keys(inflowMap);
    for (var ik = 0; ik < ikeys.length; ik++) {
      totalInflow += inflowMap[ikeys[ik]];
    }
  }

  n.computed = {
    input_per_min: totalInflow,
    output_per_min: outputAfterSorter,
    max_output: maxOutputByMachines,
    output_sorter_cap: outSorterCap,
    input_sorter_cap: inSorterCapPerItem,
    item_in: rec.inputs[0].item,
    item_out: rec.outputs[0].item,
    efficiency: efficiency,
    bottleneck_ratio: bottleneckRatio,
    input_details: inputDetails,
    input_count: rec.inputs.length,
    prolif_power_mult: prolifPwrMult
  };
  return n.computed;
}

var NODE_DEFS = {
  mining:{
    label:'Mining Node',icon:'',color:'#92400e',
    defaults:{resource:null,miners:[{veins:6}],vu_level:0},
    ports:{inputs:[],outputs:[{id:'out',label:'Output',item:'resource'}]},
    calc:function(n){
      var mc=n.props.miners.length;
      if(!n.props.resource){n.computed={output_per_min:0,item:null,power_draw_mw:0.420*mc};return n.computed;}
      var vuMult=1+n.props.vu_level*0.1;
      var total=0;
      for(var i=0;i<mc;i++){
        total+=n.props.miners[i].veins*30*vuMult;
      }
      n.computed={output_per_min:total,item:n.props.resource,power_draw_mw:0.420*mc};
      return n.computed;
    }
  },
  belt:{
    label:'Belt',icon:'',color:'#1e40af',
    defaults:{tier:'mk1'},
    ports:{inputs:[],outputs:[{id:'out',label:'Out',item:'any'}]},
    calc:function(n,inflow,inflowMap){
      var cap=BELT_CAPS[n.props.tier]||360;
      var totalIn = inflow || 0;
      var actual = Math.min(totalIn, cap);
      var pct = cap > 0 ? actual / cap : 0;
      // if multiple items feed in, use the one with the highest rate
      var dominantItem = n.upstream_item || 'unknown';
      if (inflowMap) {
        var ikeys = Object.keys(inflowMap);
        if (ikeys.length === 1) {
          dominantItem = ikeys[0];
        } else if (ikeys.length > 1) {
          // pick the item with the highest rate
          var maxRate = -1;
          for (var ik = 0; ik < ikeys.length; ik++) {
            if (inflowMap[ikeys[ik]] > maxRate) {
              maxRate = inflowMap[ikeys[ik]];
              dominantItem = ikeys[ik];
            }
          }
        }
      }
      n.computed={
        input_per_min:totalIn,
        output_per_min:actual,
        capacity:cap,
        load_pct:Math.round(pct*100),
        item:dominantItem,
        item_out:dominantItem,
        source_count:inflowMap ? Object.keys(inflowMap).length : 0
      };
      return n.computed;
    }
  },
  arc_smelter:{
    label:'Arc Smelter',icon:'',color:'#9a3412',
    defaults:{count:1,recipe:null,input_sorter_tier:'mk1',input_sorter_reach:1,output_sorter_tier:'mk1',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},
    ports:{inputs:[{id:'in_0',label:'Input',item:'recipe_input'}],outputs:[{id:'out',label:'Output',item:'recipe_output'}]},
    calc:function(n,inflow,inflowMap){
      calcMultiInputMachine(n, inflowMap, 1.0);
      n.computed.power_draw_mw = 0.360 * (n.props.count||1) * (n.computed.prolif_power_mult||1);
      return n.computed;
    }
  },
  assembler:{
    label:'Assembler',icon:'',color:'#1e3a5f',
    defaults:{count:1,recipe:null,tier:'mk2',input_sorter_tier:'mk1',input_sorter_reach:1,output_sorter_tier:'mk1',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},
    ports:{inputs:[{id:'in_0',label:'Input',item:'recipe_input'}],outputs:[{id:'out',label:'Output',item:'recipe_output'}]},
    calc:function(n,inflow,inflowMap){
      var tiers={mk1:0.75,mk2:1.0,mk3:1.5};
      var speedMult=tiers[n.props.tier]||1;
      calcMultiInputMachine(n, inflowMap, speedMult);
      var aPow={mk1:270,mk2:540,mk3:1080};
      n.computed.power_draw_mw = (aPow[n.props.tier]||540) * (n.props.count||1) / 1000 * (n.computed.prolif_power_mult||1);
      return n.computed;
    }
  },
  chemical_plant:{
    label:'Chemical Plant',icon:'',color:'#065f46',
    defaults:{count:1,recipe:'custom',item_in:null,item_out:null,recipe_time:4,input_qty:1,output_qty:1,input_sorter_tier:'mk1',input_sorter_reach:1,output_sorter_tier:'mk1',output_sorter_reach:1},
    ports:{inputs:[{id:'in',label:'Input',item:'any'}],outputs:[{id:'out',label:'Output',item:'any'}]},
    calc:function(n,inflow){
      var cnt=n.props.count||1;
      var inSorterCap=SORTER_SPEEDS[n.props.input_sorter_tier]*60/n.props.input_sorter_reach*cnt;
      var outSorterCap=SORTER_SPEEDS[n.props.output_sorter_tier]*60/n.props.output_sorter_reach*cnt;
      var t=n.props.recipe_time||4;
      var iq=n.props.input_qty||1;
      var oq=n.props.output_qty||1;
      var maxOut=oq/t*60*cnt;
      var inputNeed=iq/t*60*cnt;
      var effectiveInput=Math.min(inflow||0,inSorterCap,inputNeed);
      var rawOut=(effectiveInput/iq)*oq;
      var outputAfterSorter=Math.min(rawOut,outSorterCap);
      n.computed={
        input_per_min:inflow||0,
        effective_input:effectiveInput,
        output_per_min:outputAfterSorter,
        max_output:maxOut,
        input_need:inputNeed,
        item_in:n.props.item_in,
        item_out:n.props.item_out,
        efficiency:maxOut>0?Math.round(outputAfterSorter/maxOut*100):0,
        power_draw_mw:0.720*cnt
      };
      return n.computed;
    }
  },
  thermal_plant:{
    label:'Thermal Power Plant',icon:'',color:'#4c1d95',
    defaults:{count:1,fuel:'energetic_graphite',input_sorter_tier:'mk1',input_sorter_reach:1},
    ports:{inputs:[{id:'in',label:'Fuel',item:'fuel'}],outputs:[{id:'out',label:'Power',item:'power'}]},
    calc:function(n,inflow){
      var cnt=n.props.count||1;
      var inSorterCap=SORTER_SPEEDS[n.props.input_sorter_tier]*60/n.props.input_sorter_reach*cnt;
      var fuelRates={coal:60,energetic_graphite:24,hydrogen:18,refined_oil:25.71,fire_ice:33.75};
      var fuelRate=fuelRates[n.props.fuel]||30;
      var totalNeed=fuelRate*cnt;
      var effectiveInput=Math.min(inflow||0,inSorterCap,totalNeed);
      var plantsFed=fuelRate>0?effectiveInput/fuelRate:0;
      var powerMW=plantsFed*2.16;
      n.computed={
        input_per_min:inflow||0,
        effective_input:effectiveInput,
        output_per_min:powerMW,
        max_output:cnt*2.16,
        fuel_need:totalNeed,
        input_sorter_cap:inSorterCap,
        plants_fed:parseFloat(plantsFed.toFixed(2)),
        item_in:n.props.fuel,
        item_out:'power',
        efficiency:cnt>0?Math.round(plantsFed/cnt*100):0,
        power_draw_mw:0
      };
      return n.computed;
    }
  },
  storage_depot:{
    label:'Storage Depot',icon:'',color:'#78716c',
    defaults:{tier:'mk1',item:null,sorter_tier:'mk1',sorter_reach:1},
    ports:{inputs:[],outputs:[]},
    calc:function(n,inflow,inflowMap){
      var item = n.props.item || null;
      if(!item){
        if(inflowMap){
          var ks=Object.keys(inflowMap);
          if(ks.length>0){item=ks[0];n.props.item=item;}
        }
      }
      if(!item){n.computed={output_per_min:0,input_per_min:0,item:null,error:'No item set'};return n.computed;}
      var caps={mk1:600,mk2:1200};
      var capacity=caps[n.props.tier]||600;
      var sorterCap=SORTER_SPEEDS[n.props.sorter_tier||'mk1']*60/(n.props.sorter_reach||1);
      var inputSlots=State.edges.filter(function(e){return e.to_node===n.id;}).length||1;
      var outputSlots=State.edges.filter(function(e){return e.from_node===n.id;}).length||1;
      var maxIn=sorterCap*inputSlots;
      var maxOut=sorterCap*outputSlots;
      var totalIn=Math.min(inflow||0, maxIn);
      var sustainableOut=Math.min(totalIn, maxOut);
      n.computed={
        input_per_min:totalIn,
        output_per_min:sustainableOut,
        max_input:maxIn,
        max_output:maxOut,
        capacity:capacity,
        item:item,
        item_out:item,
        tier:n.props.tier,
        sorter_cap_in:maxIn,
        sorter_cap_out:maxOut
      };
      return n.computed;
    }
  },
  storage_tank:{
    label:'Storage Tank',icon:'',color:'#44403c',
    defaults:{tier:'mk1',item:null,sorter_tier:'mk1',sorter_reach:1},
    ports:{inputs:[],outputs:[]},
    calc:function(n,inflow,inflowMap){
      var item = n.props.item || null;
      if(!item){
        if(inflowMap){
          var ks2=Object.keys(inflowMap);
          if(ks2.length>0){item=ks2[0];n.props.item=item;}
        }
      }
      if(!item){n.computed={output_per_min:0,input_per_min:0,item:null,error:'No item set'};return n.computed;}
      var sorterCap2=SORTER_SPEEDS[n.props.sorter_tier||'mk1']*60/(n.props.sorter_reach||1);
      var inputSlots2=State.edges.filter(function(e){return e.to_node===n.id;}).length||1;
      var outputSlots2=State.edges.filter(function(e){return e.from_node===n.id;}).length||1;
      var maxIn2=sorterCap2*inputSlots2;
      var maxOut2=sorterCap2*outputSlots2;
      var totalIn2=Math.min(inflow||0, maxIn2);
      var sustainableOut2=Math.min(totalIn2, maxOut2);
      n.computed={
        input_per_min:totalIn2,
        output_per_min:sustainableOut2,
        max_input:maxIn2,
        max_output:maxOut2,
        capacity:10000,
        item:item,
        item_out:item,
        tier:'mk1',
        sorter_cap_in:maxIn2,
        sorter_cap_out:maxOut2
      };
      return n.computed;
    }
  },
  generic_consumer:{
    label:'Consumer',icon:'',color:'#1f2937',
    defaults:{count:1,label:'Consumer',consumption_per_min:30,item:null,input_sorter_tier:'mk1',input_sorter_reach:1},
    ports:{inputs:[{id:'in',label:'Input',item:'any'}],outputs:[]},
    calc:function(n,inflow){
      var cnt=n.props.count||1;
      var inSorterCap=SORTER_SPEEDS[n.props.input_sorter_tier]*60/n.props.input_sorter_reach*cnt;
      var need=n.props.consumption_per_min*cnt;
      var effective=Math.min(inflow||0,inSorterCap,need);
      n.computed={input_per_min:inflow||0,effective_input:effective,output_per_min:0,need:need,item_in:n.props.item,efficiency:need>0?Math.round(effective/need*100):0,power_draw_mw:0};
      return n.computed;
    }
  },
  oil_refinery:{
    label:'Oil Refinery',icon:'',color:'#78350f',
    defaults:{count:1,recipe:null,input_sorter_tier:'mk1',input_sorter_reach:1,output_sorter_tier:'mk1',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},
    ports:{inputs:[{id:'in_0',label:'Input',item:'any'}],outputs:[{id:'out',label:'Output',item:'any'}]},
    calc:function(n,inflow,inflowMap){
      calcMultiInputMachine(n, inflowMap, 1.0);
      n.computed.power_draw_mw = 0.960 * (n.props.count||1) * (n.computed.prolif_power_mult||1);
      return n.computed;
    }
  },
  particle_collider:{
    label:'Particle Collider',icon:'',color:'#4c1d95',
    defaults:{count:1,recipe:null,input_sorter_tier:'mk2',input_sorter_reach:1,output_sorter_tier:'mk2',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},
    ports:{inputs:[{id:'in_0',label:'Input',item:'any'}],outputs:[{id:'out',label:'Output',item:'any'}]},
    calc:function(n,inflow,inflowMap){
      calcMultiInputMachine(n, inflowMap, 1.0);
      n.computed.power_draw_mw = 18.0 * (n.props.count||1) * (n.computed.prolif_power_mult||1);
      return n.computed;
    }
  },
  fractionator:{
    label:'Fractionator',icon:'',color:'#0f766e',
    defaults:{count:1,input_sorter_tier:'mk3',input_sorter_reach:1,output_sorter_tier:'mk3',output_sorter_reach:1},
    ports:{inputs:[{id:'in',label:'Hydrogen in',item:'hydrogen'}],outputs:[{id:'out',label:'Deuterium out',item:'deuterium'}]},
    calc:function(n,inflow){
      var cnt=n.props.count||1;
      var inSorterCap=SORTER_SPEEDS[n.props.input_sorter_tier]*60/n.props.input_sorter_reach*cnt;
      var outSorterCap=SORTER_SPEEDS[n.props.output_sorter_tier]*60/n.props.output_sorter_reach*cnt;
      var fractionRate=0.01;
      var effectiveInput=Math.min(inflow||0,inSorterCap);
      var rawOut=effectiveInput*fractionRate; // cnt is baked into inSorterCap above
      var outputAfterSorter=Math.min(rawOut,outSorterCap);
      n.computed={
        input_per_min:inflow||0,effective_input:effectiveInput,
        output_per_min:outputAfterSorter,item_in:'hydrogen',item_out:'deuterium',
        note:'1% of hydrogen becomes deuterium per pass',
        power_draw_mw:0.720*cnt
      };
      return n.computed;
    }
  },
  matrix_lab:{
    label:'Matrix Lab',icon:'',color:'#1e3a5f',
    defaults:{count:1,recipe:null,input_sorter_tier:'mk2',input_sorter_reach:1,output_sorter_tier:'mk2',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},
    ports:{inputs:[{id:'in_0',label:'Input',item:'any'}],outputs:[{id:'out',label:'Matrix',item:'any'}]},
    calc:function(n,inflow,inflowMap){
      calcMultiInputMachine(n, inflowMap, 1.0);
      n.computed.power_draw_mw = 0.480 * (n.props.count||1) * (n.computed.prolif_power_mult||1);
      return n.computed;
    }
  },
  mini_fusion:{
    label:'Mini Fusion Power Plant',icon:'',color:'#3730a3',
    defaults:{count:1,input_sorter_tier:'mk2',input_sorter_reach:1},
    ports:{inputs:[{id:'in',label:'Deuteron Rods',item:'deuteron_fuel_rod'}],outputs:[{id:'out',label:'Power',item:'power'}]},
    calc:function(n,inflow){
      var cnt=n.props.count||1;
      var inSorterCap=SORTER_SPEEDS[n.props.input_sorter_tier]*60/n.props.input_sorter_reach*cnt;
      var fuelRatePerPlant=60/22.2;
      var totalNeed=fuelRatePerPlant*cnt;
      var effectiveInput=Math.min(inflow||0,inSorterCap,totalNeed);
      var plantsFed=fuelRatePerPlant>0?effectiveInput/fuelRatePerPlant:0;
      var powerMW=plantsFed*24;
      n.computed={
        input_per_min:inflow||0,effective_input:effectiveInput,
        output_per_min:powerMW,max_output:cnt*24,
        fuel_need:totalNeed,input_sorter_cap:inSorterCap,
        plants_fed:parseFloat(plantsFed.toFixed(2)),
        item_in:'deuteron_fuel_rod',item_out:'power',
        efficiency:cnt>0?Math.round(plantsFed/cnt*100):0,
        power_draw_mw:0
      };
      return n.computed;
    }
  },
  water_pump:{
    label:'Water Pump',icon:'',color:'#0369a1',
    defaults:{count:1,vu_level:0},
    ports:{inputs:[],outputs:[{id:'out',label:'Water',item:'water'}]},
    calc:function(n){
      var cnt=n.props.count||1;
      var vuMult=1+n.props.vu_level*0.1;
      var rate=50*vuMult*cnt;
      n.computed={output_per_min:rate,item:'water',item_out:'water',power_draw_mw:0.400*cnt};
      return n.computed;
    }
  },
  oil_extractor:{
    label:'Oil Extractor',icon:'',color:'#92400e',
    defaults:{count:1,rate_per_extractor:40,vu_level:0},
    ports:{inputs:[],outputs:[{id:'out',label:'Crude Oil',item:'crude_oil'}]},
    calc:function(n){
      var cnt=n.props.count||1;
      var vuMult=1+n.props.vu_level*0.1;
      var rate=n.props.rate_per_extractor*vuMult*cnt;
      n.computed={output_per_min:rate,item:'crude_oil',item_out:'crude_oil',power_draw_mw:0.400*cnt};
      return n.computed;
    }
  },
  wind_turbine:{
    label:'Wind Turbine',icon:'',color:'#059669',
    defaults:{count:1},
    ports:{inputs:[],outputs:[{id:'out',label:'Power',item:'power'}]},
    calc:function(n){
      var cnt=n.props.count||1;
      var powerMW=0.300*cnt;
      n.computed={output_per_min:powerMW,max_output:powerMW,item_out:'power',power_draw_mw:0};
      return n.computed;
    }
  },
  solar_panel:{
    label:'Solar Panel',icon:'',color:'#d97706',
    defaults:{count:1,coverage_pct:50},
    ports:{inputs:[],outputs:[{id:'out',label:'Power',item:'power'}]},
    calc:function(n){
      var cnt=n.props.count||1;
      var cov=(n.props.coverage_pct||50)/100;
      var powerMW=0.360*cnt*cov;
      n.computed={output_per_min:powerMW,max_output:0.360*cnt,item_out:'power',power_draw_mw:0};
      return n.computed;
    }
  },
  geothermal:{
    label:'Geothermal Station',icon:'',color:'#7c3aed',
    defaults:{count:1,power_per_vent_kw:4000},
    ports:{inputs:[],outputs:[{id:'out',label:'Power',item:'power'}]},
    calc:function(n){
      var cnt=n.props.count||1;
      var kw=n.props.power_per_vent_kw||4000;
      var powerMW=kw/1000*cnt;
      n.computed={output_per_min:powerMW,max_output:powerMW,item_out:'power',power_draw_mw:0};
      return n.computed;
    }
  },
  artificial_star:{
    label:'Artificial Star',icon:'',color:'#b45309',
    defaults:{count:1},
    ports:{inputs:[],outputs:[{id:'out',label:'Power',item:'power'}]},
    calc:function(n){
      var cnt=n.props.count||1;
      var powerMW=1500*cnt;
      n.computed={output_per_min:powerMW,max_output:powerMW,item_out:'power',power_draw_mw:0};
      return n.computed;
    }
  },
  ray_receiver:{
    label:'Ray Receiver',icon:'',color:'#0ea5e9',
    defaults:{count:1,sphere_pct:100},
    ports:{inputs:[],outputs:[{id:'out',label:'Power',item:'power'}]},
    calc:function(n){
      var cnt=n.props.count||1;
      var pct=(n.props.sphere_pct||100)/100;
      var powerMW=25*cnt*pct;
      n.computed={output_per_min:powerMW,max_output:25*cnt,item_out:'power',power_draw_mw:0};
      return n.computed;
    }
  },
  pls_station:{
    label:'PLS Station',icon:'',color:'#1d4ed8',
    defaults:{mode:'import',item:'',rate:60,planet:'',count:1},
    ports:{inputs:[{id:'in',label:'Export In',item:'any'}],outputs:[{id:'out',label:'Import Out',item:'any'}]},
    calc:function(n,inflow){
      var mode=n.props.mode||'import';
      var cnt=n.props.count||1;
      var rate=(n.props.rate||0)*cnt;
      var item=n.props.item||null;
      if(mode==='import'){
        n.computed={item_out:item,output_per_min:rate,power_draw_mw:0.600*cnt};
      } else {
        var demand=rate;
        var actual=Math.min(inflow||0,demand);
        var eff=demand>0?Math.round(actual/demand*100):100;
        n.computed={item_in:item,input_per_min:inflow||0,effective_input:actual,output_per_min:0,demand_per_min:demand,efficiency:eff,power_draw_mw:0.600*cnt};
      }
      return n.computed;
    }
  },
  ils_station:{
    label:'ILS Station',icon:'',color:'#1e3a8a',
    defaults:{mode:'import',item:'',rate:60,planet:'',count:1},
    ports:{inputs:[{id:'in',label:'Export In',item:'any'}],outputs:[{id:'out',label:'Import Out',item:'any'}]},
    calc:function(n,inflow){
      var mode=n.props.mode||'import';
      var cnt=n.props.count||1;
      var rate=(n.props.rate||0)*cnt;
      var item=n.props.item||null;
      if(mode==='import'){
        n.computed={item_out:item,output_per_min:rate,power_draw_mw:1.000*cnt};
      } else {
        var demand=rate;
        var actual=Math.min(inflow||0,demand);
        var eff=demand>0?Math.round(actual/demand*100):100;
        n.computed={item_in:item,input_per_min:inflow||0,effective_input:actual,output_per_min:0,demand_per_min:demand,efficiency:eff,power_draw_mw:1.000*cnt};
      }
      return n.computed;
    }
  }
};

export { calcMultiInputMachine, NODE_DEFS };
