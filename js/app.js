// App controller
import { ITEMS, RECIPES, BELT_CAPS, SORTER_SPEEDS, CHAIN_RAW_RESOURCES, PREFERRED_RECIPES, TECH_REQUIREMENTS, BuildState } from './data.js';
import { State } from './state.js';
import { calcMultiInputMachine, NODE_DEFS } from './calc.js';
import { fmtRate, fmtNum, rateClass, statRow, statRow2, escHtml, itemName, itemOptions, recipeOptions, sorterOptions } from './helpers.js';
import { parseBlueprintString, DSP_ITEM_TO_NODE, DSP_ASSEMBLER_TIER, DSP_RECIPE_TO_KEY } from './blueprint.js';

var EXAMPLE_FACTORIES = [
  {
    name: 'Magnetic Coil Line',
    icon: '&#x2697;&#xFE0F;',
    desc: '5 nodes — Iron ore + Copper ore → Magnets + Copper Ingots → Magnetic Coils',
    nodes: {
      '1':{id:'1',type:'mining',x:80,y:160,props:{resource:'iron_ore',miners:[{veins:6}],vu_level:0},computed:{}},
      '2':{id:'2',type:'mining',x:80,y:380,props:{resource:'copper_ore',miners:[{veins:4}],vu_level:0},computed:{}},
      '3':{id:'3',type:'arc_smelter',x:320,y:160,props:{count:3,recipe:'magnet',input_sorter_tier:'mk1',input_sorter_reach:1,output_sorter_tier:'mk1',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},computed:{}},
      '4':{id:'4',type:'arc_smelter',x:320,y:380,props:{count:1,recipe:'copper_ingot',input_sorter_tier:'mk1',input_sorter_reach:1,output_sorter_tier:'mk1',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},computed:{}},
      '5':{id:'5',type:'assembler',x:560,y:270,props:{count:1,recipe:'magnetic_coil',tier:'mk2',input_sorter_tier:'mk2',input_sorter_reach:1,output_sorter_tier:'mk2',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},computed:{}}
    },
    edges:[
      {id:'e1',from_node:'1',from_port:'out',to_node:'3',to_port:'in_0'},
      {id:'e2',from_node:'2',from_port:'out',to_node:'4',to_port:'in_0'},
      {id:'e3',from_node:'3',from_port:'out',to_node:'5',to_port:'in_0'},
      {id:'e4',from_node:'4',from_port:'out',to_node:'5',to_port:'in_1'}
    ],
    nextId:10,planets:[]
  },
  {
    name: 'Circuit Board Line',
    icon: '&#x1F4BB;',
    desc: '5 nodes — Iron ore + Copper ore → Iron Ingots + Copper Ingots → Circuit Boards',
    nodes: {
      '1':{id:'1',type:'mining',x:80,y:160,props:{resource:'iron_ore',miners:[{veins:6}],vu_level:0},computed:{}},
      '2':{id:'2',type:'mining',x:80,y:380,props:{resource:'copper_ore',miners:[{veins:4}],vu_level:0},computed:{}},
      '3':{id:'3',type:'arc_smelter',x:320,y:160,props:{count:2,recipe:'iron_ingot',input_sorter_tier:'mk1',input_sorter_reach:1,output_sorter_tier:'mk1',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},computed:{}},
      '4':{id:'4',type:'arc_smelter',x:320,y:380,props:{count:1,recipe:'copper_ingot',input_sorter_tier:'mk1',input_sorter_reach:1,output_sorter_tier:'mk1',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},computed:{}},
      '5':{id:'5',type:'assembler',x:560,y:270,props:{count:1,recipe:'circuit_board',tier:'mk2',input_sorter_tier:'mk2',input_sorter_reach:1,output_sorter_tier:'mk2',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},computed:{}}
    },
    edges:[
      {id:'e1',from_node:'1',from_port:'out',to_node:'3',to_port:'in_0'},
      {id:'e2',from_node:'2',from_port:'out',to_node:'4',to_port:'in_0'},
      {id:'e3',from_node:'3',from_port:'out',to_node:'5',to_port:'in_0'},
      {id:'e4',from_node:'4',from_port:'out',to_node:'5',to_port:'in_1'}
    ],
    nextId:10,planets:[]
  },
  {
    name: 'EM Matrix Line',
    icon: '&#x1F52C;',
    desc: '8 nodes — Full chain from raw ores to Electromagnetic Matrix (blue science)',
    nodes: {
      '1':{id:'1',type:'mining',x:60,y:180,props:{resource:'iron_ore',miners:[{veins:8}],vu_level:0},computed:{}},
      '2':{id:'2',type:'mining',x:60,y:440,props:{resource:'copper_ore',miners:[{veins:6}],vu_level:0},computed:{}},
      '3':{id:'3',type:'arc_smelter',x:300,y:80,props:{count:2,recipe:'magnet',input_sorter_tier:'mk1',input_sorter_reach:1,output_sorter_tier:'mk1',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},computed:{}},
      '4':{id:'4',type:'arc_smelter',x:300,y:240,props:{count:2,recipe:'iron_ingot',input_sorter_tier:'mk1',input_sorter_reach:1,output_sorter_tier:'mk1',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},computed:{}},
      '5':{id:'5',type:'arc_smelter',x:300,y:440,props:{count:2,recipe:'copper_ingot',input_sorter_tier:'mk1',input_sorter_reach:1,output_sorter_tier:'mk1',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},computed:{}},
      '6':{id:'6',type:'assembler',x:560,y:160,props:{count:1,recipe:'magnetic_coil',tier:'mk2',input_sorter_tier:'mk2',input_sorter_reach:1,output_sorter_tier:'mk2',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},computed:{}},
      '7':{id:'7',type:'assembler',x:560,y:360,props:{count:1,recipe:'circuit_board',tier:'mk2',input_sorter_tier:'mk2',input_sorter_reach:1,output_sorter_tier:'mk2',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},computed:{}},
      '8':{id:'8',type:'matrix_lab',x:820,y:260,props:{count:4,recipe:'em_matrix',input_sorter_tier:'mk2',input_sorter_reach:1,output_sorter_tier:'mk2',output_sorter_reach:1,proliferator_tier:'none',proliferator_mode:'extra_products'},computed:{}}
    },
    edges:[
      {id:'e1',from_node:'1',from_port:'out',to_node:'3',to_port:'in_0'},
      {id:'e2',from_node:'1',from_port:'out',to_node:'4',to_port:'in_0'},
      {id:'e3',from_node:'2',from_port:'out',to_node:'5',to_port:'in_0'},
      {id:'e4',from_node:'3',from_port:'out',to_node:'6',to_port:'in_0'},
      {id:'e5',from_node:'5',from_port:'out',to_node:'6',to_port:'in_1'},
      {id:'e6',from_node:'4',from_port:'out',to_node:'7',to_port:'in_0'},
      {id:'e7',from_node:'5',from_port:'out',to_node:'7',to_port:'in_1'},
      {id:'e8',from_node:'6',from_port:'out',to_node:'8',to_port:'in_0'},
      {id:'e9',from_node:'7',from_port:'out',to_node:'8',to_port:'in_1'}
    ],
    nextId:20,planets:[]
  }
];

var App = {

  init: function() {
    this.bindCanvas();
    this.renderSidebar();
    this.scheduleRender();
    this.renderPlanetBar();
    if (!this.loadFromURL()) {
      this.addNode('mining', {x:180, y:180});
    }
  },

  genId: function() {
    return 'node_' + (State.nextId++);
  },

  addNode: function(type, pos) {
    var def = NODE_DEFS[type];
    if (!def) {
      return null;
    }
    var id = this.genId();
    var props = JSON.parse(JSON.stringify(def.defaults));
    if (State.currentPlanet !== 'all' && !props.planet) {
      props.planet = State.currentPlanet;
    }
    var node = {
      id: id,
      type: type,
      x: pos.x,
      y: pos.y,
      props: props,
      computed: {},
      upstream_item: null
    };
    State.nodes[id] = node;
    this.renderNode(node);
    this.recalcAll();
    this.selectNode(id);
    return id;
  },

  addNodeRaw: function(type, pos, propsOverride) {
    var def = NODE_DEFS[type];
    if (!def) { return null; }
    var id = this.genId();
    var props = JSON.parse(JSON.stringify(def.defaults));
    if (propsOverride) {
      var keys = Object.keys(propsOverride);
      for (var k = 0; k < keys.length; k++) {
        props[keys[k]] = propsOverride[keys[k]];
      }
    }
    if (State.currentPlanet !== 'all' && !props.planet) {
      props.planet = State.currentPlanet;
    }
    var node = {id:id, type:type, x:pos.x, y:pos.y, props:props, computed:{}, upstream_item:null};
    State.nodes[id] = node;
    this.renderNode(node);
    return id;
  },

  addEdgeRaw: function(fromId, fromPort, toId, toPort) {
    State.edges.push({
      id: 'edge_' + (State.nextId++),
      from_node: fromId,
      from_port: fromPort,
      to_node: toId,
      to_port: toPort
    });
  },

  deleteNode: function(id) {
    State.edges = State.edges.filter(function(e) {
      return e.from_node !== id && e.to_node !== id;
    });
    var el = document.getElementById('node_' + id);
    if (el) {
      el.remove();
    }
    delete State.nodes[id];
    delete State.multiSelected[id];
    if (State.selected === id) {
      State.selected = null;
    }
    this.recalcAll();
    this.renderEdges();
    this.renderSidebar();
  },

  deleteMultiSelected: function() {
    var ids = Object.keys(State.multiSelected);
    for (var i = 0; i < ids.length; i++) {
      this.deleteNode(ids[i]);
    }
    State.multiSelected = {};
    this.renderSidebar();
  },

  showConnectionError: function(nodeId, message) {
    var el = document.getElementById('node_' + nodeId);
    if (!el) {
      return;
    }
    // Shake animation
    el.classList.add('conn-error');
    setTimeout(function() {
      el.classList.remove('conn-error');
    }, 400);
    // Toast above the node
    var existing = el.querySelector('.conn-error-toast');
    if (existing) {
      existing.remove();
    }
    var toast = document.createElement('div');
    toast.className = 'conn-error-toast';
    toast.textContent = message;
    el.style.position = 'absolute';
    el.appendChild(toast);
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  },

  validateConnection: function(fromNodeId, toNodeId, toPort) {
    // Returns null if connection is valid, or an error string if not.
    var fromNode = State.nodes[fromNodeId];
    var toNode = State.nodes[toNodeId];
    if (!fromNode || !toNode) {
      return null;
    }

    // What item is the source carrying?
    var sourceItem = null;
    if (fromNode.computed) {
      sourceItem = fromNode.computed.item_out || fromNode.computed.item || null;
    }
    // If source has no computed item yet (newly placed, no upstream), allow it
    if (!sourceItem || sourceItem === 'unknown' || sourceItem === 'custom') {
      return null;
    }

    var toType = toNode.type;

    // Belts accept anything
    if (toType === 'belt') {
      return null;
    }

    // Storage depots and tanks: accept anything if no item set yet;
    // reject if the incoming item doesn't match the stored item
    if (toType === 'storage_depot' || toType === 'storage_tank') {
      var storedItem = toNode.props.item;
      if (!storedItem || storedItem === 'unknown') {
        return null; // not yet typed, accept anything
      }
      if (sourceItem !== storedItem) {
        var srcNm = ITEMS[sourceItem] ? ITEMS[sourceItem].name : sourceItem;
        var stoNm = ITEMS[storedItem] ? ITEMS[storedItem].name : storedItem;
        return 'Storage contains ' + stoNm + ', not ' + srcNm;
      }
      return null;
    }

    // generic consumer: accepts anything
    if (toType === 'generic_consumer') {
      return null;
    }

    // water pump / oil extractor: no inputs, can't be a connection target
    if (toType === 'water_pump' || toType === 'oil_extractor') {
      return 'This node has no inputs';
    }

    // mining: no inputs
    if (toType === 'mining') {
      return 'Mining nodes have no inputs';
    }

    // thermal plant: accepts fuel items
    if (toType === 'thermal_plant') {
      var validFuels = ['coal','energetic_graphite','hydrogen','refined_oil','fire_ice','plant_fuel','wood','b_conveyor_mk1'];
      // Actually any item can physically be fed, the plant just burns it.
      // Just check it's not power or a building item.
      if (sourceItem === 'power_generic') {
        return 'Cannot feed power into a power plant input';
      }
      return null;
    }

    // mini fusion: only deuteron fuel rods
    if (toType === 'mini_fusion') {
      if (sourceItem !== 'deuteron_fuel_rod') {
        var srcName = (State.nodes[fromNodeId] && ITEMS[sourceItem]) ? ITEMS[sourceItem].name : sourceItem;
        return 'Needs Deuteron Fuel Rod, not ' + srcName;
      }
      return null;
    }

    // fractionator: only hydrogen
    if (toType === 'fractionator') {
      if (sourceItem !== 'hydrogen') {
        var srcName2 = ITEMS[sourceItem] ? ITEMS[sourceItem].name : sourceItem;
        return 'Fractionator needs Hydrogen, not ' + srcName2;
      }
      return null;
    }

    if (toType === 'pls_station' || toType === 'ils_station') {
      return null;
    }

    // arc smelter, assembler, oil refinery, particle collider, matrix lab, chemical plant
    // check against recipe inputs
    var recipeNodeTypes = ['arc_smelter','assembler','oil_refinery','particle_collider','matrix_lab'];
    if (recipeNodeTypes.indexOf(toType) !== -1) {
      var rec = RECIPES[toNode.props.recipe];
      if (!rec) {
        return null; // No recipe set yet, allow connection
      }

      // for multi-input nodes, toPort is 'in_N': check that specific slot
      var portIndex = -1;
      var portMatch = toPort.match(/^in_(\d+)$/);
      if (portMatch) {
        portIndex = parseInt(portMatch[1]);
      }

      if (portIndex >= 0 && portIndex < rec.inputs.length) {
        // Connecting to a specific recipe input slot
        var expectedItem = rec.inputs[portIndex].item;
        if (sourceItem !== expectedItem) {
          var srcItemName = ITEMS[sourceItem] ? ITEMS[sourceItem].name : sourceItem;
          var expItemName = ITEMS[expectedItem] ? ITEMS[expectedItem].name : expectedItem;
          return 'Slot expects ' + expItemName + ', not ' + srcItemName;
        }
        return null;
      }

      // Port is beyond recipe inputs (e.g. connecting to 'in' on a non-indexed port)
      // Check if sourceItem appears anywhere in the recipe
      var anyMatch = false;
      for (var ri = 0; ri < rec.inputs.length; ri++) {
        if (rec.inputs[ri].item === sourceItem) {
          anyMatch = true;
          break;
        }
      }
      if (!anyMatch) {
        var srcName3 = ITEMS[sourceItem] ? ITEMS[sourceItem].name : sourceItem;
        var recLabel = rec.label || toNode.props.recipe;
        return '' + srcName3 + ' is not used in ' + recLabel;
      }
      return null;
    }

    // chemical plant: if item_in is set, validate against it
    if (toType === 'chemical_plant') {
      var expectedIn = toNode.props.item_in;
      if (expectedIn && expectedIn !== 'custom' && sourceItem !== expectedIn) {
        var srcN = ITEMS[sourceItem] ? ITEMS[sourceItem].name : sourceItem;
        var expN = ITEMS[expectedIn] ? ITEMS[expectedIn].name : expectedIn;
        return 'Plant expects ' + expN + ', not ' + srcN;
      }
      return null;
    }

    // Oil refinery validation handled above via recipeNodeTypes
    return null;
  },

  addEdge: function(fromNode, fromPort, toNode, toPort) {
    var toNodeObj   = State.nodes[toNode];
    var fromNodeObj = State.nodes[fromNode];
    var toType   = toNodeObj   ? toNodeObj.type   : null;
    var fromType = fromNodeObj ? fromNodeObj.type  : null;

    var isStorageTypes = ['storage_depot','storage_tank'];
    var isStorageTo   = isStorageTypes.indexOf(toType)   !== -1;
    var isStorageFrom = isStorageTypes.indexOf(fromType) !== -1;
    var isBeltTo      = toType === 'belt';

    if (isBeltTo || isStorageTo) {
      // Assign a unique in_N slot so multiple inputs can coexist
      var usedInPorts = {};
      State.edges.forEach(function(e) {
        if (e.to_node === toNode) { usedInPorts[e.to_port] = true; }
      });
      var slotIdx = 0;
      while (usedInPorts['in_' + slotIdx]) { slotIdx++; }
      toPort = 'in_' + slotIdx;
    }

    State.edges.push({id:'edge_'+(State.nextId++),from_node:fromNode,from_port:fromPort,to_node:toNode,to_port:toPort});

    // Auto-set storage item from connected source when item is null
    if (isStorageTo && toNodeObj && !toNodeObj.props.item) {
      if (fromNodeObj && fromNodeObj.computed) {
        var srcItem = fromNodeObj.computed.item_out || fromNodeObj.computed.item || null;
        if (srcItem && srcItem !== 'unknown') {
          toNodeObj.props.item = srcItem;
        }
      }
    }

    // Rebuild node cards that have dynamic port layouts
    var self = this;
    function rebuildNode(nid) {
      var nodeObj = State.nodes[nid];
      var nodeEl  = document.getElementById('node_' + nid);
      if (nodeObj && nodeEl) {
        nodeEl.innerHTML = self.buildNodeHTML(nodeObj);
        self.bindNodeEvents(nodeEl, nodeObj);
      }
    }
    if (isBeltTo || isStorageTo)   { rebuildNode(toNode); }
    if (isStorageFrom)              { rebuildNode(fromNode); }

    this.recalcAll();
    this.renderEdges();
    if (State.selected === toNode && (State.tab === 'props' || State.tab === 'stats')) {
      this.renderSidebar();
    }
  },

  deleteEdge: function(edgeId) {
    // Find the edge before removing it so we know if a belt needs rebuilding
    var edgeToRemove = null;
    for (var ei = 0; ei < State.edges.length; ei++) {
      if (State.edges[ei].id === edgeId) {
        edgeToRemove = State.edges[ei];
        break;
      }
    }
    State.edges = State.edges.filter(function(e) {
      return e.id !== edgeId;
    });
    State.selectedEdge = null;
    // Rebuild any dynamic-port node cards affected by this edge removal
    if (edgeToRemove) {
      var dynTypes = ['belt','storage_depot','storage_tank'];
      var toNodeDel   = State.nodes[edgeToRemove.to_node];
      var fromNodeDel = State.nodes[edgeToRemove.from_node];
      if (toNodeDel && dynTypes.indexOf(toNodeDel.type) !== -1) {
        var toElDel = document.getElementById('node_' + toNodeDel.id);
        if (toElDel) {
          toElDel.innerHTML = this.buildNodeHTML(toNodeDel);
          this.bindNodeEvents(toElDel, toNodeDel);
        }
      }
      if (fromNodeDel && dynTypes.indexOf(fromNodeDel.type) !== -1) {
        var fromElDel = document.getElementById('node_' + fromNodeDel.id);
        if (fromElDel) {
          fromElDel.innerHTML = this.buildNodeHTML(fromNodeDel);
          this.bindNodeEvents(fromElDel, fromNodeDel);
        }
      }
    }
    this.recalcAll();
    this.renderEdges();
    this.renderSidebar();
  },

  // estimate how much of a given item a node demands per minute.
  // used for proportional belt-splitting when multiple consumers share one source.
  // reads props and recipe directly, does not use node.computed.
  estimateDemand: function(node, itemKey) {
    if (!node) {
      return 0;
    }
    var type = node.type;

    // belts: demand equals belt capacity
    if (type === 'belt') {
      return BELT_CAPS[node.props.tier] || 360;
    }

    // Storage nodes: demand per connection = sorter cap per slot
    // Each input connection has its own sorter, so demand = one slot's sorter throughput
    if (type === 'storage_depot' || type === 'storage_tank') {
      var stSorterCap = SORTER_SPEEDS[node.props.sorter_tier || 'mk1'] * 60 / (node.props.sorter_reach || 1);
      return stSorterCap;
    }

    // assembler and arc smelter: demand from recipe + sorter + count
    if (type === 'assembler' || type === 'arc_smelter') {
      var rec = RECIPES[node.props.recipe];
      if (!rec) {
        return 0;
      }
      var cnt = node.props.count || 1;
      var speedMult = 1.0;
      if (type === 'assembler') {
        var tiers = {mk1: 0.75, mk2: 1.0, mk3: 1.5};
        speedMult = tiers[node.props.tier] || 1.0;
      }
      var pTierD = node.props.proliferator_tier || 'none';
      var pModeD = node.props.proliferator_mode || 'extra_products';
      var prolifSpeedBoostD = (pTierD !== 'none' && pModeD === 'speed') ? ({mk1:1.25,mk2:1.5,mk3:2.0}[pTierD]||1.0) : 1.0;
      var effectiveTime = rec.time / (speedMult * prolifSpeedBoostD);
      var inSorterCap = SORTER_SPEEDS[node.props.input_sorter_tier] * 60 / (node.props.input_sorter_reach || 1) * cnt;
      // Find this item in the recipe inputs
      for (var ii = 0; ii < rec.inputs.length; ii++) {
        if (rec.inputs[ii].item === itemKey) {
          var needPerMin = rec.inputs[ii].qty / effectiveTime * 60 * cnt;
          return Math.min(needPerMin, inSorterCap);
        }
      }
      return 0;
    }

    // oil refinery, particle collider, matrix lab: same recipe-based demand
    if (type === 'oil_refinery' || type === 'particle_collider' || type === 'matrix_lab') {
      var rec2 = RECIPES[node.props.recipe];
      if (!rec2) {
        return 0;
      }
      var cnt2 = node.props.count || 1;
      var inSorterCap2 = SORTER_SPEEDS[node.props.input_sorter_tier] * 60 / (node.props.input_sorter_reach || 1) * cnt2;
      for (var jj = 0; jj < rec2.inputs.length; jj++) {
        if (rec2.inputs[jj].item === itemKey) {
          var needPerMin2 = rec2.inputs[jj].qty / rec2.time * 60 * cnt2;
          return Math.min(needPerMin2, inSorterCap2);
        }
      }
      return 0;
    }

    // Chemical plant
    if (type === 'chemical_plant') {
      if (node.props.item_in !== itemKey) {
        return 0;
      }
      var cnt3 = node.props.count || 1;
      var t3 = node.props.recipe_time || 4;
      var iq3 = node.props.input_qty || 1;
      var inSorterCap3 = SORTER_SPEEDS[node.props.input_sorter_tier] * 60 / (node.props.input_sorter_reach || 1) * cnt3;
      var needPerMin3 = iq3 / t3 * 60 * cnt3;
      return Math.min(needPerMin3, inSorterCap3);
    }

    // thermal plant: demand by fuel type and count
    if (type === 'thermal_plant') {
      if (node.props.fuel !== itemKey) {
        return 0;
      }
      var cnt4 = node.props.count || 1;
      var fuelRates = {coal: 60, energetic_graphite: 24, hydrogen: 18, refined_oil: 25.71, fire_ice: 33.75};
      var fuelRate = fuelRates[node.props.fuel] || 30;
      var inSorterCap4 = SORTER_SPEEDS[node.props.input_sorter_tier] * 60 / (node.props.input_sorter_reach || 1) * cnt4;
      return Math.min(fuelRate * cnt4, inSorterCap4);
    }

    // mini fusion: only deuteron fuel rods
    if (type === 'mini_fusion') {
      if (itemKey !== 'deuteron_fuel_rod') {
        return 0;
      }
      var cnt5 = node.props.count || 1;
      var inSorterCap5 = SORTER_SPEEDS[node.props.input_sorter_tier] * 60 / (node.props.input_sorter_reach || 1) * cnt5;
      // ~2.7 rods/min per plant at 24MW
      return Math.min(2.7 * cnt5, inSorterCap5);
    }

    // fractionator: hydrogen only, sorter-limited
    if (type === 'fractionator') {
      if (itemKey !== 'hydrogen') {
        return 0;
      }
      var cnt6 = node.props.count || 1;
      var inSorterCap6 = SORTER_SPEEDS[node.props.input_sorter_tier] * 60 / (node.props.input_sorter_reach || 1) * cnt6;
      return inSorterCap6;
    }

    // Generic consumer
    if (type === 'generic_consumer') {
      if (node.props.item !== itemKey) {
        return 0;
      }
      var cnt7 = node.props.count || 1;
      var inSorterCap7 = SORTER_SPEEDS[node.props.input_sorter_tier] * 60 / (node.props.input_sorter_reach || 1) * cnt7;
      var need7 = (node.props.consumption_per_min || 0) * cnt7;
      return Math.min(need7, inSorterCap7);
    }

    // Default: unknown node type, claim nothing
    return 0;
  },

  recalcAll: function() {
    var self = this;
    // topological sort
    var visited = {};
    var order = [];

    function visit(id) {
      if (visited[id]) {
        return;
      }
      visited[id] = true;
      // visit all nodes that feed into this one
      State.edges.forEach(function(e) {
        if (e.to_node === id) {
          visit(e.from_node);
        }
      });
      order.push(id);
    }

    Object.keys(State.nodes).forEach(function(id) {
      visit(id);
    });

    order.forEach(function(id) {
      var node = State.nodes[id];
      if (!node) {
        return;
      }
      var def = NODE_DEFS[node.type];
      if (!def) {
        return;
      }

      // Build per-item inflow map with demand-weighted belt splitting.
      //
      // Problem: a belt feeding N assemblers has a fixed output_per_min.
      // If we naively give each assembler the full belt rate, calculations
      // are wrong. Instead we split the belt proportionally by each
      // consumer's demand for that item.
      //
      // For each upstream source node connected to this node:
      //   1. Find ALL downstream consumers of that source (including this node)
      //   2. Compute each consumer's demand for the source's item
      //   3. Split the source's output proportionally by demand
      //   4. This node receives only its proportional share

      var inflowMap = {};
      State.edges.forEach(function(e) {
        if (e.to_node !== id) {
          return;
        }
        var srcNode = State.nodes[e.from_node];
        if (!srcNode || !srcNode.computed) {
          return;
        }
        var ikey, srcOutput;
        if (srcNode.computed.portOutputs && srcNode.computed.portOutputs[e.from_port]) {
          var po2 = srcNode.computed.portOutputs[e.from_port];
          ikey = po2.item;
          srcOutput = po2.rate || 0;
        } else {
          ikey = srcNode.computed.item_out || srcNode.computed.item || null;
          srcOutput = srcNode.computed.output_per_min || 0;
        }
        if (!ikey || srcOutput <= 0) {
          return;
        }

        // For per-port output nodes (ILS import), only split among consumers of the same port
        var consumerEdges = State.edges.filter(function(ce) {
          if (srcNode.computed.portOutputs) {
            return ce.from_node === e.from_node && ce.from_port === e.from_port;
          }
          return ce.from_node === e.from_node;
        });

        // If only one consumer (this node), it gets everything
        if (consumerEdges.length <= 1) {
          if (!inflowMap[ikey]) {
            inflowMap[ikey] = 0;
          }
          inflowMap[ikey] += srcOutput;
          e.flow = srcOutput;  // store actual per-edge flow for pill display
          return;
        }

        var myShare;
        var srcNodeObj = State.nodes[e.from_node];

        if (srcNodeObj && srcNodeObj.type === 'storage_tank') {
          // storage tank: first consumer gets full sorter cap before remainder
          // goes to the next. consumers are allocated in insertion order.
          var sortedEdges = consumerEdges.slice().sort(function(a, b) {
            // Sort by numeric part of edge id to preserve creation order
            var aNum = parseInt(a.id.replace('edge_', '')) || 0;
            var bNum = parseInt(b.id.replace('edge_', '')) || 0;
            return aNum - bNum;
          });
          var remaining = srcOutput;
          var myEdgeIdx = -1;
          for (var pei = 0; pei < sortedEdges.length; pei++) {
            if (sortedEdges[pei].id === e.id) {
              myEdgeIdx = pei;
              break;
            }
          }
          // Allocate to each prior consumer first
          for (var pri = 0; pri < myEdgeIdx; pri++) {
            var priNode = State.nodes[sortedEdges[pri].to_node];
            var priDem = priNode ? self.estimateDemand(priNode, ikey) : 0;
            var priAlloc = Math.min(priDem, remaining);
            remaining -= priAlloc;
            sortedEdges[pri].flow = priAlloc;
          }
          // This consumer gets whatever is left, up to its own demand
          var myDemandTank = State.nodes[id] ? self.estimateDemand(State.nodes[id], ikey) : 0;
          myShare = Math.min(myDemandTank, remaining);
          // remaining after this consumer; subsequent ones compute their own share
        } else {
          // Standard proportional split (belts, storage_depot, and all other nodes)
          var totalDemand = 0;
          var myDemand = 0;

          consumerEdges.forEach(function(ce) {
            var consumerNode = State.nodes[ce.to_node];
            if (!consumerNode) {
              return;
            }
            var demand = self.estimateDemand(consumerNode, ikey);
            totalDemand += demand;
            if (ce.to_node === id) {
              myDemand += demand;
            }
          });

          // Compute this node's share
          if (totalDemand <= 0) {
            // no consumer has a computable demand, split evenly
            myShare = srcOutput / consumerEdges.length;
          } else if (totalDemand <= srcOutput) {
            // enough supply for everyone, each gets what they need
            myShare = Math.min(myDemand, srcOutput);
          } else {
            // contention: split proportionally by demand
            myShare = (myDemand / totalDemand) * srcOutput;
          }
        }

        if (!inflowMap[ikey]) {
          inflowMap[ikey] = 0;
        }
        inflowMap[ikey] += myShare;
        e.flow = myShare;  // store actual per-edge flow for pill display
      });
      // upstream_item: array of all connected item types (for filtering)
      var upstream_items = Object.keys(inflowMap);
      node.upstream_item = upstream_items.length === 1 ? upstream_items[0] : (upstream_items.length > 1 ? upstream_items[0] : null);
      node.upstream_items = upstream_items;
      // Legacy scalar inflow (sum of all inputs) kept for simple nodes
      var inflow = 0;
      var allItemKeys = Object.keys(inflowMap);
      for (var fk = 0; fk < allItemKeys.length; fk++) {
        inflow += inflowMap[allItemKeys[fk]];
      }

      // auto-fix recipe if the single connected item doesn't match the current recipe
      // only triggers on single-input connections, won't override a deliberate multi-input setup
      var recipeNodeTypes = ['arc_smelter','assembler','oil_refinery','particle_collider','matrix_lab'];
      var isRecipeNode = recipeNodeTypes.indexOf(node.type) !== -1;
      if (isRecipeNode && upstream_items.length === 1) {
        var singleItem = upstream_items[0];
        if (singleItem && singleItem !== 'unknown' && singleItem !== 'custom' && singleItem !== 'power') {
          var machineMap = {arc_smelter:'arc_smelter',assembler:'assembler',oil_refinery:'oil_refinery',particle_collider:'particle_collider',matrix_lab:'matrix_lab'};
          var mtype = machineMap[node.type];
          var curRecipe = RECIPES[node.props.recipe];
          var curValid = false;
          if (curRecipe && curRecipe.machine === mtype) {
            for (var ci = 0; ci < curRecipe.inputs.length; ci++) {
              if (curRecipe.inputs[ci].item === singleItem) {
                curValid = true;
                break;
              }
            }
          }
          if (!curValid) {
            var allKeys = Object.keys(RECIPES);
            for (var ri = 0; ri < allKeys.length; ri++) {
              var rk = allKeys[ri];
              var r = RECIPES[rk];
              if (r.machine !== mtype) {
                continue;
              }
              var match = false;
              for (var rij = 0; rij < r.inputs.length; rij++) {
                if (r.inputs[rij].item === singleItem) {
                  match = true;
                  break;
                }
              }
              if (match) {
                node.props.recipe = rk;
                // Rebuild node card so input ports update to new recipe
                var autoEl = document.getElementById('node_' + id);
                if (autoEl && (node.type === 'arc_smelter' || node.type === 'assembler' || node.type === 'matrix_lab' || node.type === 'oil_refinery' || node.type === 'particle_collider')) {
                  autoEl.innerHTML = App.buildNodeHTML(node);
                  App.bindNodeEvents(autoEl, node);
                }
                break;
              }
            }
          }
        }
      }

      def.calc(node, inflow, inflowMap);
      self.updateNodeDisplay(node);
    });

    // Post-processing: storage nodes need actual outflow which is only
    // known after all downstream nodes have been calculated.
    // e.flow on each output edge is now correctly set, so sum those.
    order.forEach(function(id) {
      var node = State.nodes[id];
      if (!node || (node.type !== 'storage_depot' && node.type !== 'storage_tank')) {
        return;
      }
      var actualOut = 0;
      State.edges.forEach(function(e) {
        if (e.from_node === id) {
          actualOut += (e.flow !== undefined) ? e.flow : 0;
        }
      });
      if (node.computed) {
        node.computed.actual_outflow = actualOut;
        node.computed.net_flow = (node.computed.input_per_min || 0) - actualOut;
      }
      self.updateNodeDisplay(node);
    });

    // ILS inter-planet auto-matching: run a second pass when ILS/PLS stations exist.
    // First pass above gives export nodes their effective_input. Now build the supply
    // map and re-run so import nodes (and their downstream) see the correct inflow.
    if (!State._ilsPassActive) {
      var hasILS = false;
      var ilsKeys = Object.keys(State.nodes);
      for (var ilsi = 0; ilsi < ilsKeys.length; ilsi++) {
        var ilsNd = State.nodes[ilsKeys[ilsi]];
        if (ilsNd.type === 'ils_station' || ilsNd.type === 'pls_station') { hasILS = true; break; }
      }
      if (hasILS) {
        var ilsExportMap = {};
        for (var ei = 0; ei < ilsKeys.length; ei++) {
          var en = State.nodes[ilsKeys[ei]];
          if ((en.type === 'ils_station' || en.type === 'pls_station') && en.computed && en.computed.exports) {
            var enExps = en.computed.exports;
            var enExpKeys = Object.keys(enExps);
            for (var eki = 0; eki < enExpKeys.length; eki++) {
              var eitem = enExpKeys[eki];
              if (!ilsExportMap[eitem]) { ilsExportMap[eitem] = 0; }
              ilsExportMap[eitem] += enExps[eitem] || 0;
            }
          }
        }
        State._ilsSupply = ilsExportMap;
        State._ilsPassActive = true;
        self.recalcAll();
        State._ilsPassActive = false;
        State._ilsSupply = null;
      }
    }
  },

  // rendering

  renderNode: function(node) {
    var def = NODE_DEFS[node.type];
    var el = document.createElement('div');
    el.className = 'node-el';
    el.id = 'node_' + node.id;
    el.style.left = node.x + 'px';
    el.style.top = node.y + 'px';
    el.style.borderColor = def.color + '88';

    el.innerHTML = this.buildNodeHTML(node);
    document.getElementById('canvas').appendChild(el);
    this.bindNodeEvents(el, node);
    var _cur = State.currentPlanet;
    if (_cur !== 'all') {
      var _onCur = !(node.props.planet) || node.props.planet === _cur;
      if (!_onCur) { el.style.display = 'none'; }
    }
  },

  buildNodeHTML: function(node) {
    var def = NODE_DEFS[node.type];
    var label = node.props.label || def.label;
    var html = '<div class="node-header" style="background:'+def.color+'22;border-color:'+def.color+'44">';
    if (def.icon) {
      html += '<img class="nh-icon" src="img/nodes/'+def.icon+'" width="20" height="20" onerror="this.style.display=\'none\'">';
    } else {
      html += '<span class="nh-icon-fallback" style="background:'+def.color+'44;color:'+def.color+'">'+def.label.slice(0,2).toUpperCase()+'</span>';
    }
    html += '<span class="nh-title">'+escHtml(label)+'</span>';
    if (node.props.label && node.props.label !== def.label) {
      html += '<span class="nh-type">'+def.label+'</span>';
    }
    if (node.props.count !== undefined && node.props.count > 0) {
      html += '<span class="node-count-badge">x'+node.props.count+'</span>';
    }
    if (node.type === 'mining' && node.props.miners && node.props.miners.length > 0) {
      html += '<span class="node-count-badge">x'+node.props.miners.length+'</span>';
    }
    html += '<span class="nh-del" onclick="App.deleteNode(\''+node.id+'\')"></span>';
    html += '</div>';
    html += '<div class="node-body">';
    // Port generation strategy:
    // - arc_smelter / assembler: one port per recipe ingredient
    // - belt: one port per connected upstream edge + one spare "open" port
    // - all others: ports from def.ports.inputs as defined
    var multiInputTypes = ['arc_smelter', 'assembler', 'matrix_lab', 'oil_refinery', 'particle_collider'];
    var isMultiInput = multiInputTypes.indexOf(node.type) !== -1;
    if (isMultiInput) {
      var rec = RECIPES[node.props.recipe];
      var recPorts = rec ? rec.inputs : [{item:'input',qty:1}];
      for (var pi = 0; pi < recPorts.length; pi++) {
        var idefRec = ITEMS[recPorts[pi].item] ? ITEMS[recPorts[pi].item] : null;
        var inamRec = idefRec ? idefRec.icon + ' ' + idefRec.name : recPorts[pi].item;
        var pidRec = 'in_' + pi;
        html += '<div class="port-row">';
        html += '<div class="port input" id="port_'+node.id+'_'+pidRec+'" data-node="'+node.id+'" data-port="'+pidRec+'" data-dir="in"></div>';
        html += '<span class="port-label port-label-sm">'+inamRec+'</span>';
        html += '</div>';
      }
    } else if (node.type === 'belt') {
      // Count existing connected input edges for this node
      var connectedInputEdges = State.edges.filter(function(e) {
        return e.to_node === node.id;
      });
      var usedSlots = {};
      connectedInputEdges.forEach(function(e) { usedSlots[e.to_port] = true; });
      // Render a port for each connected slot
      var slotKeys = Object.keys(usedSlots).sort();
      for (var si = 0; si < slotKeys.length; si++) {
        var skey = slotKeys[si];
        html += '<div class="port-row">';
        html += '<div class="port input connected" id="port_'+node.id+'_'+skey+'" data-node="'+node.id+'" data-port="'+skey+'" data-dir="in" title="Input '+(si+1)+'"></div>';
        html += '<span class="port-label port-label-sm">In '+(si+1)+'</span>';
        html += '</div>';
      }
      // Always render one spare open port for new connections
      var nextSlotIdx = 0;
      while (usedSlots['in_' + nextSlotIdx]) { nextSlotIdx++; }
      var nextSlot = 'in_' + nextSlotIdx;
      html += '<div class="port-row">';
      html += '<div class="port input" id="port_'+node.id+'_'+nextSlot+'" data-node="'+node.id+'" data-port="'+nextSlot+'" data-dir="in" title="Connect input"></div>';
      if (slotKeys.length === 0) {
        html += '<span class="port-label port-label-sm">In</span>';
      } else {
        html += '<span class="port-label port-label-dim">+ in</span>';
      }
      html += '</div>';
    } else if (node.type === 'storage_depot' || node.type === 'storage_tank') {
      var maxPorts = node.type === 'storage_depot' ? 12 : 4;
      // Gather occupied input and output edges for this node
      var usedIn = {}, usedOut = {};
      State.edges.forEach(function(e) {
        if (e.to_node === node.id) { usedIn[e.to_port] = true; }
        if (e.from_node === node.id) { usedOut[e.from_port] = true; }
      });
      var inKeys  = Object.keys(usedIn).sort();
      var outKeys = Object.keys(usedOut).sort();
      var totalUsed = inKeys.length + outKeys.length;
      // Render occupied input ports
      for (var si2 = 0; si2 < inKeys.length; si2++) {
        html += '<div class="port-row">';
        html += '<div class="port input connected" id="port_'+node.id+'_'+inKeys[si2]+'" data-node="'+node.id+'" data-port="'+inKeys[si2]+'" data-dir="in"></div>';
        html += '<span class="port-label port-label-sm">In '+(si2+1)+'</span>';
        html += '</div>';
      }
      // Spare input port (if under max total)
      if (totalUsed < maxPorts) {
        var nextIn = 0;
        while (usedIn['in_' + nextIn]) { nextIn++; }
        html += '<div class="port-row">';
        html += '<div class="port input" id="port_'+node.id+'_in_'+nextIn+'" data-node="'+node.id+'" data-port="in_'+nextIn+'" data-dir="in"></div>';
        html += '<span class="port-label port-label-dim">'+(inKeys.length===0?'In':'+ in')+'</span>';
        html += '</div>';
      }
      html += '<div id="node_stats_'+node.id+'"></div>';
      // Render occupied output ports
      for (var so2 = 0; so2 < outKeys.length; so2++) {
        html += '<div class="port-row port-row-out">';
        html += '<span class="port-label port-label-right">Out '+(so2+1)+'</span>';
        html += '<div class="port output connected port-no-shrink" id="port_'+node.id+'_'+outKeys[so2]+'" data-node="'+node.id+'" data-port="'+outKeys[so2]+'" data-dir="out"></div>';
        html += '</div>';
      }
      // Spare output port (if under max total)
      if (totalUsed < maxPorts) {
        var nextOut = 0;
        while (usedOut['out_' + nextOut]) { nextOut++; }
        html += '<div class="port-row port-row-out">';
        html += '<span class="port-label port-label-right-dim">'+(outKeys.length===0?'Out':'+ out')+'</span>';
        html += '<div class="port output port-no-shrink" id="port_'+node.id+'_out_'+nextOut+'" data-node="'+node.id+'" data-port="out_'+nextOut+'" data-dir="out"></div>';
        html += '</div>';
      }
      // skip normal stats and output port rendering, already done above
      html += '</div>';
      return html;
    } else if (node.type === 'ils_station' || node.type === 'pls_station') {
      var ilsSlots = node.props.slots || [];
      for (var ilsHsi = 0; ilsHsi < ilsSlots.length; ilsHsi++) {
        var ilsHsl = ilsSlots[ilsHsi];
        var ilsHlabel = ilsHsl.item ? itemName(ilsHsl.item) : (ilsHsl.mode === 'export' ? 'Export' : 'Import');
        if (ilsHsl.mode === 'export') {
          var ilsHpid = 'in_' + ilsHsi;
          var ilsHconn = State.edges.some(function(e) { return e.to_node === node.id && e.to_port === ilsHpid; });
          html += '<div class="port-row">';
          html += '<div class="port input'+(ilsHconn?' connected':'')+'" id="port_'+node.id+'_'+ilsHpid+'" data-node="'+node.id+'" data-port="'+ilsHpid+'" data-dir="in"></div>';
          html += '<span class="port-label port-label-sm">'+escHtml(ilsHlabel)+'</span>';
          html += '</div>';
        }
      }
      html += '<div id="node_stats_'+node.id+'"></div>';
      for (var ilsHsi2 = 0; ilsHsi2 < ilsSlots.length; ilsHsi2++) {
        var ilsHsl2 = ilsSlots[ilsHsi2];
        if (ilsHsl2.mode !== 'import') { continue; }
        var ilsHlabel2 = ilsHsl2.item ? itemName(ilsHsl2.item) : 'Import';
        var ilsHpid2 = 'out_' + ilsHsi2;
        var ilsHconn2 = State.edges.some(function(e) { return e.from_node === node.id && e.from_port === ilsHpid2; });
        html += '<div class="port-row port-row-out">';
        html += '<span class="port-label port-label-right">'+escHtml(ilsHlabel2)+'</span>';
        html += '<div class="port output'+(ilsHconn2?' connected':'')+' port-no-shrink" id="port_'+node.id+'_'+ilsHpid2+'" data-node="'+node.id+'" data-port="'+ilsHpid2+'" data-dir="out"></div>';
        html += '</div>';
      }
      html += '</div>';
      return html;
    } else if (def.ports.inputs.length > 0) {
      def.ports.inputs.forEach(function(port) {
        html += '<div class="port-row">';
        html += '<div class="port input" id="port_'+node.id+'_'+port.id+'" data-node="'+node.id+'" data-port="'+port.id+'" data-dir="in"></div>';
        html += '<span class="port-label">'+port.label+'</span>';
        html += '</div>';
      });
    }
    html += '<div id="node_stats_'+node.id+'"></div>';
    // output ports
    if (def.ports.outputs.length > 0) {
      def.ports.outputs.forEach(function(port) {
        html += '<div class="port-row port-row-out">';
        html += '<span class="port-label port-label-right">'+port.label+'</span>';
        html += '<div class="port output port-no-shrink" id="port_'+node.id+'_'+port.id+'" data-node="'+node.id+'" data-port="'+port.id+'" data-dir="out"></div>';
        html += '</div>';
      });
    }
    html += '</div>';
    return html;
  },

  updateNodeDisplay: function(node) {
    var el = document.getElementById('node_stats_' + node.id);
    if (!el) {
      return;
    }
    var c = node.computed;
    if (!c) {
      return;
    }
    var html = '';

    if (node.type === 'mining') {
      var idef = ITEMS[c.item] || null;
      var icolor = idef ? idef.color : '#888';
      var iicon = idef ? idef.icon : '';
      html += '<div class="item-chip-lg" style="background:'+icolor+'22;border-color:'+icolor+'55">';
      html += '<span class="chip-icon-lg">'+iicon+'</span>';
      html += '<span class="chip-name">'+itemName(c.item)+'</span>';
      html += '<span class="chip-rate">'+fmtRate(c.output_per_min)+'/min</span>';
      html += '</div>';
    } else if (node.type === 'belt') {
      var bitem = c.item || c.upstream_item || node.upstream_item;
      var bidef = (bitem && ITEMS[bitem]) ? ITEMS[bitem] : null;
      var bcolor = bidef ? bidef.color : '#3d4a6a';
      var bicon = bidef ? bidef.icon : '';
      var bpct = c.load_pct || 0;
      var bclass = bpct <= 80 ? '#22c55e' : bpct <= 100 ? '#f59e0b' : '#ef4444';
      if (bidef) {
        html += '<div class="item-chip-sm" style="background:'+bcolor+'22;border-color:'+bcolor+'55">';
        html += '<span class="chip-icon-md">'+bicon+'</span>';
        html += '<span class="chip-name-sm">'+bidef.name+'</span>';
        if (c.source_count > 1) {
          html += '<span class="chip-sources">'+c.source_count+' sources</span>';
        }
        html += '</div>';
      }
      html += '<div class="load-bar-track">';
      var fillPct = Math.min(bpct, 100);
      html += '<div class="eff-bar-fill" style="width:'+fillPct+'%;background:'+bclass+'"></div>';
      html += '</div>';
      html += '<div class="stat-jb-10">';
      html += '<span class="stat-val-w">'+bpct+'%</span>';
      html += '<span class="stat-val-w">'+fmtRate(c.output_per_min)+' / '+c.capacity+'/min</span>';
      html += '</div>';
      if (c.input_per_min > c.capacity) {
        html += '<div class="ns-overflow">Overflow: '+fmtRate(c.input_per_min - c.capacity)+'/min lost</div>';
      }
    } else if (node.type === 'storage_depot' || node.type === 'storage_tank') {
      var sitem = c.item || node.props.item;
      var sidef = sitem && ITEMS[sitem] ? ITEMS[sitem] : null;
      var scolor = sidef ? sidef.color : '#6b7280';
      if (sidef) {
        html += '<div class="item-chip-sm" style="background:'+scolor+'22;border-color:'+scolor+'55">';
        html += '<span class="chip-name-sm">'+sidef.name+'</span>';
        html += '</div>';
      } else {
        html += '<div class="ns-empty">No item set yet</div>';
      }
      var actualOut = (c.actual_outflow !== undefined) ? c.actual_outflow : c.output_per_min;
      var netFlow2 = (c.net_flow !== undefined) ? c.net_flow : (c.input_per_min - actualOut);
      html += '<div class="ns-io-row">';
      html += '<span>In: '+fmtRate(c.input_per_min)+'/min</span>';
      html += '<span>Out: '+fmtRate(actualOut)+'/min</span>';
      html += '</div>';
      var capacityDrain = c.sorter_cap_out !== undefined && c.sorter_cap_out > c.input_per_min + 0.01;
      if (Math.abs(netFlow2) < 0.5) {
        html += '<div class="ns-balanced">Balanced</div>';
      } else if (netFlow2 > 0.5) {
        html += '<div class="ns-filling">Filling: +'+fmtRate(netFlow2)+'/min</div>';
      } else {
        html += '<div class="ns-draining">Draining: '+fmtRate(Math.abs(netFlow2))+'/min</div>';
      }
      if (capacityDrain && Math.abs(netFlow2) < 0.5) {
        html += '<div class="ns-warn-amber">Output sorter cap ('+fmtRate(c.sorter_cap_out)+'/min) exceeds input</div>';
      }
      html += '<div class="ns-note">Capacity: '+c.capacity.toLocaleString()+' items | Sorter: '+fmtRate(SORTER_SPEEDS[node.props.sorter_tier||"mk1"]*60/(node.props.sorter_reach||1))+'/min/slot</div>';
    } else if (node.type === 'thermal_plant' || node.type === 'mini_fusion') {
      var ec = (c.efficiency || 0) >= 90 ? '#22c55e' : (c.efficiency || 0) >= 50 ? '#f59e0b' : '#ef4444';
      var fuelItem = ITEMS[c.item_in] || null;
      if (fuelItem) {
        html += '<div class="item-chip-xs" style="background:'+fuelItem.color+'22;border-color:'+fuelItem.color+'44">';
        html += '<span>'+fuelItem.icon+'</span><span class="stat-val-w">'+fuelItem.name+'</span>';
        html += '<span class="chip-suffix">→ Power</span>';
        html += '</div>';
      }
      html += '<div class="stat-jb-11">';
      html += '<span class="stat-val-w">Power</span><span class="stat-val-w">'+fmtNum(c.output_per_min,2)+' MW</span>';
      html += '</div>';
      html += '<div class="eff-bar-track ns-eff-margin">';
      html += '<div class="eff-bar-fill" style="width:'+Math.min(c.efficiency||0,100)+'%;background:'+ec+'"></div>';
      html += '</div>';
    } else if (node.type === 'wind_turbine' || node.type === 'solar_panel' ||
               node.type === 'geothermal' || node.type === 'artificial_star' ||
               node.type === 'ray_receiver') {
      html += '<div class="stat-jb-11">';
      html += '<span class="stat-text3">Power</span>';
      html += '<span class="stat-val-ok">'+fmtNum(c.output_per_min,2)+' MW</span>';
      html += '</div>';
      if (c.max_output !== undefined && c.max_output !== c.output_per_min) {
        html += '<div class="ns-maxnote">Max: '+fmtNum(c.max_output,2)+' MW</div>';
      }
    } else if (node.type === 'water_pump' || node.type === 'oil_extractor') {
      var witem = c.item_out || c.item;
      var widef = (witem && ITEMS[witem]) ? ITEMS[witem] : null;
      var wcolor = widef ? widef.color : '#38bdf8';
      var wicon = widef ? widef.icon : '';
      html += '<div class="item-chip-lg" style="background:'+wcolor+'22;border-color:'+wcolor+'55">';
      html += '<span class="chip-icon-lg">'+wicon+'</span>';
      html += '<span class="chip-name">'+(widef ? widef.name : witem)+'</span>';
      html += '<span class="chip-rate">'+fmtRate(c.output_per_min)+'/min</span>';
      html += '</div>';
    } else if (node.type === 'pls_station' || node.type === 'ils_station') {
      var lsExports = c.exports || {};
      var lsPortOut = c.portOutputs || {};
      var lsExpKeys = Object.keys(lsExports);
      var lsImpKeys = Object.keys(lsPortOut);
      if (lsExpKeys.length === 0 && lsImpKeys.length === 0) {
        html += '<div class="ls-item-none">Connect export or import slots</div>';
      }
      for (var lsei = 0; lsei < lsExpKeys.length; lsei++) {
        var lsEK = lsExpKeys[lsei];
        var lsEDef = ITEMS[lsEK] || null;
        html += '<div class="ls-slot-row ls-export">';
        html += '<span class="ls-badge-sm ls-badge-exp">EXP</span>';
        html += '<span class="ls-slot-name">'+(lsEDef ? lsEDef.name : lsEK)+'</span>';
        html += '<span class="ls-slot-rate">'+fmtRate(lsExports[lsEK])+'/min</span>';
        html += '</div>';
      }
      for (var lsii = 0; lsii < lsImpKeys.length; lsii++) {
        var lsPO = lsPortOut[lsImpKeys[lsii]];
        var lsIDef = ITEMS[lsPO.item] || null;
        html += '<div class="ls-slot-row ls-import">';
        html += '<span class="ls-badge-sm ls-badge-imp">IMP</span>';
        html += '<span class="ls-slot-name">'+(lsIDef ? lsIDef.name : lsPO.item)+'</span>';
        html += '<span class="ls-slot-rate">'+fmtRate(lsPO.rate)+'/min</span>';
        html += '</div>';
      }
      if (node.props.planet) {
        html += '<div class="ns-planet">'+escHtml(node.props.planet)+'</div>';
      }
    } else {
      if (c.input_details && c.input_details.length > 0) {
        for (var id2 = 0; id2 < c.input_details.length; id2++) {
          var inp2 = c.input_details[id2];
          var idef2 = ITEMS[inp2.item] ? ITEMS[inp2.item] : null;
          var icolor2 = idef2 ? idef2.color : '#6b7280';
          var iicon2 = idef2 ? idef2.icon : '';
          var iname2 = idef2 ? idef2.name : inp2.item;
          var iRatio = inp2.ratio || 0;
          var iStatus = iRatio >= 0.95 ? '#22c55e' : iRatio >= 0.5 ? '#f59e0b' : '#ef4444';
          html += '<div class="ingr-row" style="background:'+icolor2+'15;border-color:'+icolor2+'33">';
          html += '<span class="ingr-icon">'+iicon2+'</span>';
          html += '<span class="ingr-name">'+iname2+'</span>';
          html += '<span class="ingr-qty">'+fmtRate(inp2.arriving)+'/'+fmtRate(inp2.need)+'</span>';
          html += '</div>';
        }
        var outDef2 = (c.item_out && ITEMS[c.item_out]) ? ITEMS[c.item_out] : null;
        var outColor2 = outDef2 ? outDef2.color : '#6b7280';
        if (outDef2) {
          html += '<div class="out-row" style="background:'+outColor2+'22;border-color:'+outColor2+'44">';
          html += '<span class="out-arrow">→</span>';
          html += '<span class="ingr-icon">'+outDef2.icon+'</span>';
          html += '<span class="out-name">'+outDef2.name+'</span>';
          html += '<span class="out-qty">'+fmtRate(c.output_per_min)+'/min</span>';
          html += '</div>';
        }
      } else if (c.item_in !== undefined || c.item_out !== undefined) {
        var inDef = (c.item_in && ITEMS[c.item_in]) ? ITEMS[c.item_in] : null;
        var outDef = (c.item_out && ITEMS[c.item_out]) ? ITEMS[c.item_out] : null;
        var inColor = inDef ? inDef.color : '#6b7280';
        var outColor = outDef ? outDef.color : '#6b7280';
        html += '<div class="chem-flow-row">';
        if (inDef) {
          html += '<span class="chem-chip" style="background:'+inColor+'22;border-color:'+inColor+'44">'+inDef.icon+' '+inDef.name+'</span>';
        }
        html += '<span class="out-arrow">→</span>';
        if (outDef) {
          html += '<span class="chem-chip" style="background:'+outColor+'22;border-color:'+outColor+'44">'+outDef.icon+' '+outDef.name+'</span>';
        }
        html += '</div>';
      }
      if (c.efficiency !== undefined) {
        var eff = c.efficiency || 0;
        var ec3 = eff >= 90 ? '#22c55e' : eff >= 50 ? '#f59e0b' : '#ef4444';
        if (!c.input_details || c.input_details.length === 0) {
          html += '<div class="ns-eff-row">';
          html += '<span class="stat-val-w">'+fmtRate(c.output_per_min)+'/min</span>';
          html += '<span class="stat-val-w">'+eff+'%</span>';
          html += '</div>';
        }
        html += '<div class="ns-eff-detail">';
        html += '<span>Efficiency</span>';
        html += '<span>'+fmtRate(c.output_per_min)+' / '+fmtRate(c.max_output||c.output_per_min)+' /min</span>';
        html += '</div>';
        html += '<div class="eff-bar-track">';
        html += '<div class="eff-bar-fill" style="width:'+Math.min(eff,100)+'%;background:'+ec3+'"></div>';
        html += '</div>';
      }
    }
    el.innerHTML = html;
    // Update node left-border accent to output item color
    var nodeEl = document.getElementById('node_' + node.id);
    if (nodeEl) {
      var outItemKey = c.item_out || c.item || null;
      var outItemDef = (outItemKey && ITEMS[outItemKey]) ? ITEMS[outItemKey] : null;
      if (outItemDef) {
        nodeEl.style.borderColor = outItemDef.color + 'bb';
        nodeEl.style.borderLeftWidth = '3px';
        nodeEl.style.borderLeftColor = outItemDef.color;
      }
    }
  },

  renderEdges: function() {
    var svg = document.getElementById('edge-svg');
    svg.innerHTML = '';

    var self = this;
    State.edges.forEach(function(edge) {
      var fromNode = State.nodes[edge.from_node];
      var toNode = State.nodes[edge.to_node];
      if (!fromNode || !toNode) {
        return;
      }

      var fromEl = document.getElementById('port_' + edge.from_node + '_' + edge.from_port);
      var toEl = document.getElementById('port_' + edge.to_node + '_' + edge.to_port);
      if (!fromEl || !toEl) {
        return;
      }

      var fromRect = fromEl.getBoundingClientRect();
      var toRect = toEl.getBoundingClientRect();
      // Skip edges whose endpoints are hidden (display:none nodes return zero rects)
      if (fromRect.width === 0 && fromRect.height === 0) { return; }
      if (toRect.width === 0 && toRect.height === 0) { return; }
      var wrapRect = document.getElementById('canvas-wrap').getBoundingClientRect();

      var x1 = fromRect.left + fromRect.width / 2 - wrapRect.left;
      var y1 = fromRect.top + fromRect.height / 2 - wrapRect.top;
      var x2 = toRect.left + toRect.width / 2 - wrapRect.left;
      var y2 = toRect.top + toRect.height / 2 - wrapRect.top;

      var dx = Math.abs(x2 - x1) * 0.6;
      var d = 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + dx) + ' ' + y1 + ', ' + (x2 - dx) + ' ' + y2 + ', ' + x2 + ' ' + y2;

      var srcNode = State.nodes[edge.from_node];

      // Resolve item key carried on this edge
      var edgeItemKey = null;
      if (srcNode && srcNode.computed) {
        edgeItemKey = srcNode.computed.item_out || srcNode.computed.item || null;
      }
      var itemDef = (edgeItemKey && ITEMS[edgeItemKey]) ? ITEMS[edgeItemKey] : null;

      // Base stroke color: item color if known, else neutral
      var baseColor = itemDef ? itemDef.color : '#3d4a6a';

      // Health tint: overlay a desaturated warning/error tint at low efficiency
      var health = 100;
      if (srcNode && srcNode.computed) {
        var sc = srcNode.computed;
        if (sc.efficiency !== undefined) {
          health = sc.efficiency;
        } else if (srcNode.type === 'belt' && sc.load_pct !== undefined) {
          health = sc.load_pct <= 100 ? 100 : 50;
        } else if (srcNode.type === 'mining' || srcNode.type === 'water_pump' || srcNode.type === 'oil_extractor') {
          health = 100;
        }
      }
      var strokeColor = baseColor;
      var strokeWidth = '2.5';
      if (health < 50) {
        strokeColor = '#ef4444';
      } else if (health < 90) {
        strokeColor = '#f59e0b';
      }

      var isSelected = State.selectedEdge === edge.id;
      if (isSelected) {
        strokeColor = '#60a5fa';
        strokeWidth = '3.5';
      }

      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'edge-pill-group');
      g.setAttribute('data-edge-id', edge.id);

      // Glow layer behind main path (same color, wider, more transparent)
      var glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      glowPath.setAttribute('d', d);
      glowPath.setAttribute('fill', 'none');
      glowPath.setAttribute('stroke', strokeColor);
      glowPath.setAttribute('stroke-width', isSelected ? '10' : '7');
      glowPath.setAttribute('stroke-opacity', '0.15');
      g.appendChild(glowPath);

      // Main path
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', strokeColor);
      path.setAttribute('stroke-width', strokeWidth);
      path.setAttribute('stroke-linecap', 'round');
      g.appendChild(path);

      // Clickable hit area
      var clickPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      clickPath.setAttribute('d', d);
      clickPath.setAttribute('fill', 'none');
      clickPath.setAttribute('stroke', 'transparent');
      clickPath.setAttribute('stroke-width', '18');
      clickPath.style.cursor = 'pointer';
      clickPath.style.pointerEvents = 'stroke';
      var eid = edge.id;
      clickPath.addEventListener('click', function(ev) {
        ev.stopPropagation();
        State.selectedEdge = eid;
        self.renderEdges();
      });
      clickPath.addEventListener('contextmenu', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        self.showContextMenu(ev, [{label:'Delete connection',danger:true,action:function(){self.deleteEdge(eid);}}]);
      });
      g.appendChild(clickPath);

      // Midpoint pill label: icon + item name + rate
      var mx = (x1 + x2) / 2;
      var my = (y1 + y2) / 2;

      if (srcNode && srcNode.computed) {
        var outVal = srcNode.computed.output_per_min;
        var pillIcon = '';
        var pillName = itemDef ? itemDef.name : (edgeItemKey || '');
        var pillRate = '';

        // Use per-edge actual flow if stored; fall back to source total output
        var edgeFlow = (edge.flow !== undefined) ? edge.flow : outVal;
        if (edgeFlow !== undefined && edgeFlow > 0) {
          if (edgeItemKey === 'power') {
            pillRate = fmtNum(edgeFlow, 2) + ' MW';
            pillIcon = '';
            pillName = 'Power';
          } else {
            pillRate = fmtRate(edgeFlow) + '/min';
          }
        }

        if (pillName || pillRate) {
          var pillText = (pillIcon ? pillIcon + ' ' : '') + (pillName ? pillName : '') + (pillRate ? '  ' + pillRate : '');
          // Pill background
          var pillW = pillText.length * 6.5 + 20;
          var pillH = 20;
          var pillX = mx - pillW / 2;
          var pillY = my - pillH / 2;

          var pillBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          pillBg.setAttribute('x', pillX);
          pillBg.setAttribute('y', pillY);
          pillBg.setAttribute('width', pillW);
          pillBg.setAttribute('height', pillH);
          pillBg.setAttribute('rx', '10');
          pillBg.setAttribute('fill', '#0f1117');
          pillBg.setAttribute('stroke', strokeColor);
          pillBg.setAttribute('stroke-width', '1.5');
          pillBg.setAttribute('fill-opacity', '0.92');
          pillBg.setAttribute('class', 'pill-bg');
          g.appendChild(pillBg);

          // Rate in a separate smaller pill offset slightly above
          var ratePill = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          ratePill.setAttribute('x', mx);
          ratePill.setAttribute('y', my + 4);
          ratePill.setAttribute('text-anchor', 'middle');
          ratePill.setAttribute('fill', '#ffffff');
          ratePill.setAttribute('font-size', '10');
          ratePill.setAttribute('font-family', "'Segoe UI', system-ui, sans-serif");
          ratePill.setAttribute('font-weight', '500');
          ratePill.setAttribute('class', 'pill-text');
          ratePill.textContent = pillText;
          g.appendChild(ratePill);
        }
      }

      svg.appendChild(g);
      // Restore visible state after DOM rebuild
      if (State.hoveredEdge === edge.id || State.selectedEdge === edge.id) {
        g.classList.add('visible');
      }
    });

    // draw marquee selection rectangle
    // State.marquee coords are in world/canvas space; convert to screen space for SVG
    if (State.marquee) {
      var m = State.marquee;
      var mz = State.camera.zoom;
      var mcx = State.camera.x;
      var mcy = State.camera.y;
      // Convert world corners to screen coords
      var sx1 = m.startX * mz + mcx;
      var sy1 = m.startY * mz + mcy;
      var sx2 = m.curX   * mz + mcx;
      var sy2 = m.curY   * mz + mcy;
      var rx = Math.min(sx1, sx2);
      var ry = Math.min(sy1, sy2);
      var rw = Math.abs(sx2 - sx1);
      var rh = Math.abs(sy2 - sy1);
      if (rw > 2 || rh > 2) {
        var marqRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        marqRect.setAttribute('x', rx);
        marqRect.setAttribute('y', ry);
        marqRect.setAttribute('width', rw);
        marqRect.setAttribute('height', rh);
        marqRect.setAttribute('fill', 'rgba(59,130,246,0.08)');
        marqRect.setAttribute('stroke', '#3b82f6');
        marqRect.setAttribute('stroke-width', '1.5');
        marqRect.setAttribute('stroke-dasharray', '6 3');
        marqRect.setAttribute('rx', '4');
        svg.appendChild(marqRect);
      }
    }

    // ILS inter-planet dashed lines (shown in "All" view only)
    if (State.currentPlanet === 'all' && State.planets.length > 0) {
      var wrapRectILS = document.getElementById('canvas-wrap').getBoundingClientRect();
      var nodeKeysILS = Object.keys(State.nodes);
      // Collect all (exportNode, item) pairs
      var ilsExpEntries = [];
      for (var ilsEi = 0; ilsEi < nodeKeysILS.length; ilsEi++) {
        var ilsEn = State.nodes[nodeKeysILS[ilsEi]];
        if ((ilsEn.type !== 'ils_station' && ilsEn.type !== 'pls_station') || !ilsEn.computed || !ilsEn.computed.exports) { continue; }
        var enExpsD = ilsEn.computed.exports;
        var enExpKeysD = Object.keys(enExpsD);
        for (var ilsEki = 0; ilsEki < enExpKeysD.length; ilsEki++) {
          if (enExpsD[enExpKeysD[ilsEki]] > 0.001) {
            ilsExpEntries.push({node: ilsEn, item: enExpKeysD[ilsEki]});
          }
        }
      }
      var drawnPairsILS = {};
      for (var ilsExi = 0; ilsExi < ilsExpEntries.length; ilsExi++) {
        var ilsEntry = ilsExpEntries[ilsExi];
        var ilsExpEl = document.getElementById('node_' + ilsEntry.node.id);
        if (!ilsExpEl || ilsExpEl.style.display === 'none') { continue; }
        var ilsExpRect = ilsExpEl.getBoundingClientRect();
        var ilsEx = ilsExpRect.left + ilsExpRect.width / 2 - wrapRectILS.left;
        var ilsEy = ilsExpRect.top + ilsExpRect.height / 2 - wrapRectILS.top;
        for (var ilsIi = 0; ilsIi < nodeKeysILS.length; ilsIi++) {
          var ilsImp = State.nodes[nodeKeysILS[ilsIi]];
          if (ilsImp.id === ilsEntry.node.id) { continue; }
          if (ilsImp.type !== 'ils_station' && ilsImp.type !== 'pls_station') { continue; }
          var ilsImpSlotVals = (ilsImp.props.slots || []).filter(function(s) { return s.mode === 'import'; }).map(function(s) { return s.item; });
          if (ilsImpSlotVals.indexOf(ilsEntry.item) === -1) { continue; }
          var pairKey = [ilsEntry.node.id, ilsImp.id].sort().join('_');
          if (drawnPairsILS[pairKey]) { continue; }
          drawnPairsILS[pairKey] = true;
          var ilsImpEl = document.getElementById('node_' + ilsImp.id);
          if (!ilsImpEl || ilsImpEl.style.display === 'none') { continue; }
          var ilsImpRect = ilsImpEl.getBoundingClientRect();
          var ilsIx = ilsImpRect.left + ilsImpRect.width / 2 - wrapRectILS.left;
          var ilsIy = ilsImpRect.top + ilsImpRect.height / 2 - wrapRectILS.top;
          var ilsDx = Math.abs(ilsIx - ilsEx) * 0.5;
          var ilsD = 'M ' + ilsEx + ' ' + ilsEy + ' C ' + (ilsEx + ilsDx) + ' ' + ilsEy + ', ' + (ilsIx - ilsDx) + ' ' + ilsIy + ', ' + ilsIx + ' ' + ilsIy;
          var ilsPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          ilsPath.setAttribute('d', ilsD);
          ilsPath.setAttribute('fill', 'none');
          ilsPath.setAttribute('stroke', '#a78bfa');
          ilsPath.setAttribute('stroke-width', '1.5');
          ilsPath.setAttribute('stroke-dasharray', '6 4');
          ilsPath.setAttribute('stroke-opacity', '0.55');
          svg.appendChild(ilsPath);
        }
      }
    }

    // draw in-progress connection line
    if (State.connecting) {
      var fc = State.connecting;
      var path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      var dx2 = Math.abs(fc.cx - fc.x1) * 0.6;
      var dd = 'M ' + fc.x1 + ' ' + fc.y1 + ' C ' + (fc.x1 + dx2) + ' ' + fc.y1 + ', ' + (fc.cx - dx2) + ' ' + fc.cy + ', ' + fc.cx + ' ' + fc.cy;
      path2.setAttribute('d', dd);
      path2.setAttribute('stroke', '#60a5fa');
      path2.setAttribute('stroke-width', '2');
      path2.setAttribute('stroke-dasharray', '6 3');
      path2.setAttribute('fill', 'none');
      svg.appendChild(path2);
    }
  },

  // sidebar

  switchTab: function(tab) {
    State.tab = tab;
    document.getElementById('tab-nodes').className = 'sidebar-tab' + (tab === 'nodes' ? ' active' : '');
    document.getElementById('tab-props').className = 'sidebar-tab' + (tab === 'props' ? ' active' : '');
    document.getElementById('tab-stats').className = 'sidebar-tab' + (tab === 'stats' ? ' active' : '');
    document.getElementById('tab-build').className = 'sidebar-tab' + (tab === 'build' ? ' active' : '');
    this.renderSidebar();
  },

  renderSidebar: function() {
    var el = document.getElementById('sidebar-content');
    if (State.tab === 'nodes') {
      el.innerHTML = this.buildPaletteHTML();
    } else if (State.tab === 'props') {
      el.innerHTML = this.buildPropsHTML();
    } else if (State.tab === 'stats') {
      el.innerHTML = this.buildStatsHTML();
    } else if (State.tab === 'build') {
      el.innerHTML = this.buildBuildPanelHTML();
      this.bindBuildEvents();
    }
    this.bindSidebarEvents();
  },

  buildPaletteHTML: function() {
    var html = '<div class="prop-label">Drag to canvas or click to add</div>';
    html += '<div class="node-palette">';
    var types = Object.keys(NODE_DEFS);
    for (var i = 0; i < types.length; i++) {
      var t = types[i];
      var def = NODE_DEFS[t];
      html += '<div class="palette-item" draggable="true" data-type="'+t+'" onclick="App.addNode(this.dataset.type,App.getAddPos())">';
      if (def.icon) {
        html += '<div class="pi-icon"><img src="img/nodes/'+def.icon+'" width="24" height="24" onerror="this.style.display=\'none\'"></div>';
      } else {
        html += '<div class="pi-icon pi-icon-fallback" style="background:'+def.color+'44;color:'+def.color+'">'+def.label.slice(0,2).toUpperCase()+'</div>';
      }
      html += '<div class="pi-name">'+def.label+'</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div class="section-wrap"><div class="prop-label">&#x1F4E6; Examples</div>';
    html += '<div class="hint-text-mb">Load a starter factory to explore the tool.</div>';
    html += '<div class="flex-col-gap6">';
    for (var ei = 0; ei < EXAMPLE_FACTORIES.length; ei++) {
      var ex = EXAMPLE_FACTORIES[ei];
      html += '<button class="btn btn-left" onclick="App.loadExample('+ei+')">';
      html += '<span class="example-icon">'+ex.icon+'</span>';
      html += '<span><strong>'+escHtml(ex.name)+'</strong><br><span class="example-desc">'+escHtml(ex.desc)+'</span></span>';
      html += '</button>';
    }
    html += '</div></div>';
    html += '<div class="section-wrap"><div class="prop-label">Tips</div>';
    html += '<div class="hint-text">';
    html += '• Drag node to move<br>';
    html += '• Click output port (gold), drag to input port (teal) to connect<br>';
    html += '• Right-click node or edge for options<br>';
    html += '• Click edge to select, then delete key<br>';
    html += '• Scroll to zoom, middle-click drag to pan<br>';
    html += '</div></div>';
    return html;
  },

  buildPropsHTML: function() {
    var multiIds = Object.keys(State.multiSelected);
    if (multiIds.length > 0) {
      var html = '<div class="prop-label">'+multiIds.length+' nodes selected</div>';
      html += '<div class="prop-hint-text">Drag any selected node to move all together. Press Delete to remove all.</div>';
      html += '<div class="flex-col-gap6">';
      for (var mi = 0; mi < multiIds.length; mi++) {
        var mn = State.nodes[multiIds[mi]];
        if (!mn) { continue; }
        var mdef = NODE_DEFS[mn.type];
        html += '<div class="node-list-item" data-nid="'+mn.id+'" onclick="App.selectNode(this.dataset.nid)">';
        html += '<span>'+mdef.icon+'</span>';
        html += '<span class="node-list-name">'+(mn.props.label || mdef.label)+'</span>';
        html += '<span class="node-list-hint">click to edit</span>';
        html += '</div>';
      }
      html += '</div>';
      html += '<button class="btn danger btn-full mt-12" onclick="App.deleteMultiSelected()"> Delete all selected</button>';
      return html;
    }
    if (!State.selected) {
      return '<div class="no-select">Select a node to edit its properties<br><br><span class="tip-text">Tip: drag on empty canvas to box-select multiple nodes. Shift+click to add to selection.</span></div>';
    }
    var node = State.nodes[State.selected];
    if (!node) {
      return '<div class="no-select">Node not found</div>';
    }
    return this.buildNodePropsHTML(node);
  },

  buildNodePropsHTML: function(node) {
    var def = NODE_DEFS[node.type];
    var html = '<div class="prop-label">'+def.icon+' '+def.label+'</div>';

    if (State.planets.length > 0) {
      var nodePlanet = node.props.planet || '';
      html += '<div class="prop-row"><label class="label-60">Planet</label>';
      html += '<select class="select-ctrl" onchange="App.setProp(\''+node.id+'\',\'planet\',this.value)">';
      html += '<option value=""'+(nodePlanet===''?' selected':'')+'>&#8212; unassigned &#8212;</option>';
      for (var _pi = 0; _pi < State.planets.length; _pi++) {
        var _pn = State.planets[_pi];
        html += '<option value="'+escHtml(_pn)+'"'+(nodePlanet===_pn?' selected':'')+'>'+escHtml(_pn)+'</option>';
      }
      html += '</select></div>';
    }

    if (node.type === 'mining') {
      html += this.propText(node, 'label', 'Name');
      html += this.propRecipeSearch(node, 'resource', 'Resource', itemOptions());
      html += this.propRange(node, 'vu_level', 'VU Level', 0, 20, 1);
      html += '<div class="prop-label mt-12">Miners</div>';
      for (var i = 0; i < node.props.miners.length; i++) {
        var idx = i;
        html += '<div class="prop-group prop-group-bordered">';
        html += '<div class="prop-group-hint">Miner '+(i+1)+'</div>';
        html += '<div class="prop-row"><label>Veins covered</label><input type="number" min="1" max="12" value="'+node.props.miners[i].veins+'" onchange="App.updateMinerVein(\''+node.id+'\','+idx+',this.value)"></div>';
        if (node.props.miners.length > 1) {
          html += '<div class="text-right"><span class="miner-remove-btn" onclick="App.removeMiner(\''+node.id+'\','+idx+')"> Remove</span></div>';
        }
        html += '</div>';
      }
      html += '<button class="btn btn-full mt-4" onclick="App.addMiner(\''+node.id+'\')">+ Add miner</button>';
    } else if (node.type === 'belt') {
      html += this.propText(node, 'label', 'Name');
      html += this.propSelect(node, 'tier', 'Belt tier', [{v:'mk1',l:'Mk.I (360/min)'},{v:'mk2',l:'Mk.II (720/min)'},{v:'mk3',l:'Mk.III (1800/min)'}]);
    } else if (node.type === 'arc_smelter' || node.type === 'assembler') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 200);
      if (node.type === 'assembler') {
        html += this.propSelect(node, 'tier', 'Assembler tier', [{v:'mk1',l:'Mk.I (×0.75)'},{v:'mk2',l:'Mk.II (×1.0)'},{v:'mk3',l:'Mk.III (×1.5)'}]);
      }
      var mtype = node.type === 'arc_smelter' ? 'arc_smelter' : 'assembler';
      var filterItems = node.upstream_items && node.upstream_items.length > 0 ? node.upstream_items : (node.upstream_item ? [node.upstream_item] : []);
      var cleanFilterItems = filterItems.filter(function(fi){ return fi && fi !== 'unknown' && fi !== 'custom' && fi !== 'power'; });
      if (cleanFilterItems.length > 0) {
        var filteredCount = recipeOptions(mtype, cleanFilterItems).length;
        var totalCount = recipeOptions(mtype).length;
        if (filteredCount < totalCount && filteredCount > 0) {
          var itemLabels = cleanFilterItems.map(function(fi){ return itemName(fi); }).join(' + ');
          html += '<div class="filter-banner-teal">Filtered to '+filteredCount+' of '+totalCount+' recipes matching: <strong>'+itemLabels+'</strong></div>';
        } else if (filteredCount === 0) {
          html += '<div class="filter-banner-red">No recipes match all connected inputs. Showing all recipes.</div>';
          cleanFilterItems = [];
        }
      }
      html += this.propRecipeSearch(node, 'recipe', 'Recipe', recipeOptions(mtype, cleanFilterItems));
      html += '<div class="prop-label mt-10">Input Sorter</div>';
      html += this.propSelect(node, 'input_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'input_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square (full speed)'},{v:2,l:'2 squares (half speed)'},{v:3,l:'3 squares (1/3 speed)'}]);
      html += '<div class="prop-label mt-10">Output Sorter</div>';
      html += this.propSelect(node, 'output_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'output_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square (full speed)'},{v:2,l:'2 squares (half speed)'},{v:3,l:'3 squares (1/3 speed)'}]);
      html += this.propProliferator(node);
    } else if (node.type === 'chemical_plant') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 200);
      html += this.propRecipeSearch(node, 'item_in', 'Input item', itemOptions());
      html += this.propRecipeSearch(node, 'item_out', 'Output item', itemOptions());
      html += this.propNum(node, 'recipe_time', 'Recipe time (sec)', 0.1, 60);
      html += this.propNum(node, 'input_qty', 'Input qty/cycle', 1, 20);
      html += this.propNum(node, 'output_qty', 'Output qty/cycle', 1, 20);
      html += '<div class="prop-label mt-10">Input Sorter</div>';
      html += this.propSelect(node, 'input_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'input_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
      html += '<div class="prop-label mt-10">Output Sorter</div>';
      html += this.propSelect(node, 'output_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'output_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
    } else if (node.type === 'thermal_plant') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 200);
      html += this.propSelect(node, 'fuel', 'Fuel type', [
        {v:'coal',l:'Coal (60/min)'},{v:'energetic_graphite',l:'Energized Graphite (24/min)'},
        {v:'hydrogen',l:'Hydrogen (18/min)'},{v:'refined_oil',l:'Refined Oil (~25.7/min)'},{v:'fire_ice',l:'Fire Ice (~33.8/min)'}
      ]);
      html += '<div class="prop-label mt-10">Input Sorter</div>';
      html += this.propSelect(node, 'input_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'input_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
    } else if (node.type === 'storage_depot' || node.type === 'storage_tank') {
      html += this.propText(node, 'label', 'Name');
      if (node.type === 'storage_depot') {
        html += this.propSelect(node, 'tier', 'Tier', [
          {v:'mk1', l:'Mk.I (600 capacity)'},
          {v:'mk2', l:'Mk.II (1,200 capacity)'}
        ]);
      }
      var stItem = node.props.item;
      var stItemName = stItem && ITEMS[stItem] ? ITEMS[stItem].name : (stItem || 'Not set yet');
      html += '<div class="prop-row"><label>Item</label><span class="prop-val-text">'+stItemName+'</span>';
      if (stItem) {
        html += ' <button onclick="App.clearStorageItem(\''+node.id+'\')" class="btn-inline-sm">Clear</button>';
      }
      html += '</div>';
      html += '<div class="prop-label mt-8">Sorter (all slots)</div>';
      html += this.propSelect(node, 'sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
      if (node.computed && !node.computed.error) {
        var sc2 = node.computed;
        html += '<div class="prop-label mt-8">Storage Stats</div>';
        html += '<div class="prop-stat"><span>Input rate</span><strong>'+fmtRate(sc2.input_per_min)+'/min</strong></div>';
        html += '<div class="prop-stat"><span>Output rate</span><strong>'+fmtRate(sc2.output_per_min)+'/min</strong></div>';
        if (sc2.sorter_cap_in !== undefined) {
          html += '<div class="prop-stat"><span>Sorter in cap</span><strong>'+fmtRate(sc2.sorter_cap_in)+'/min</strong></div>';
          html += '<div class="prop-stat"><span>Sorter out cap</span><strong>'+fmtRate(sc2.sorter_cap_out)+'/min</strong></div>';
        }
        html += '<div class="prop-stat"><span>Capacity</span><strong>'+sc2.capacity.toLocaleString()+' items</strong></div>';
      }
    } else if (node.type === 'generic_consumer') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 200);
      html += this.propRecipeSearch(node, 'item', 'Item consumed', itemOptions());
      html += this.propNum(node, 'consumption_per_min', 'Consume/min (each)', 1, 10000);
      html += '<div class="prop-label mt-10">Input Sorter</div>';
      html += this.propSelect(node, 'input_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'input_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
    } else if (node.type === 'oil_refinery') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 200);
      html += this.propRecipeSearch(node, 'recipe', 'Recipe', recipeOptions('oil_refinery', node.upstream_items || node.upstream_item));
      html += '<div class="prop-label mt-10">Input Sorter</div>';
      html += this.propSelect(node, 'input_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'input_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
      html += '<div class="prop-label mt-10">Output Sorter</div>';
      html += this.propSelect(node, 'output_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'output_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
      html += this.propProliferator(node);
    } else if (node.type === 'particle_collider') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 200);
      html += this.propRecipeSearch(node, 'recipe', 'Recipe', recipeOptions('particle_collider', node.upstream_items || node.upstream_item));
      html += '<div class="prop-label mt-10">Input Sorter</div>';
      html += this.propSelect(node, 'input_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'input_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
      html += '<div class="prop-label mt-10">Output Sorter</div>';
      html += this.propSelect(node, 'output_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'output_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
      html += this.propProliferator(node);
    } else if (node.type === 'fractionator') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 200);
      html += '<div class="prop-label mt-10">Input Sorter (Hydrogen in)</div>';
      html += this.propSelect(node, 'input_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'input_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
      html += '<div class="prop-label mt-10">Output Sorter (Deuterium out)</div>';
      html += this.propSelect(node, 'output_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'output_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
    } else if (node.type === 'matrix_lab') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 200);
      html += this.propRecipeSearch(node, 'recipe', 'Recipe', recipeOptions('matrix_lab', node.upstream_items || node.upstream_item));
      html += '<div class="prop-label mt-10">Input Sorter</div>';
      html += this.propSelect(node, 'input_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'input_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
      html += '<div class="prop-label mt-10">Output Sorter</div>';
      html += this.propSelect(node, 'output_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'output_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
      html += this.propProliferator(node);
    } else if (node.type === 'mini_fusion') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 200);
      html += '<div class="prop-label mt-10">Input Sorter (Deuteron Rods)</div>';
      html += this.propSelect(node, 'input_sorter_tier', 'Tier', sorterOptions());
      html += this.propSelect(node, 'input_sorter_reach', 'Reach (squares)', [{v:1,l:'1 square'},{v:2,l:'2 squares'},{v:3,l:'3 squares'}]);
    } else if (node.type === 'water_pump') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 50);
      html += this.propRange(node, 'vu_level', 'VU Level', 0, 20, 1);
    } else if (node.type === 'oil_extractor') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 50);
      html += this.propNum(node, 'rate_per_extractor', 'Rate/extractor (base /min)', 1, 200);
      html += this.propRange(node, 'vu_level', 'VU Level', 0, 20, 1);
    } else if (node.type === 'wind_turbine') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 2000);
    } else if (node.type === 'solar_panel') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 2000);
      html += this.propRange(node, 'coverage_pct', 'Day coverage %', 0, 100, 1);
    } else if (node.type === 'geothermal') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 100);
      html += this.propNum(node, 'power_per_vent_kw', 'kW per vent', 100, 10000);
    } else if (node.type === 'artificial_star') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 10);
    } else if (node.type === 'ray_receiver') {
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 100);
      html += this.propRange(node, 'sphere_pct', 'Dyson sphere %', 0, 100, 1);
    } else if (node.type === 'pls_station' || node.type === 'ils_station') {
      var ilsMaxSlots = node.type === 'ils_station' ? 5 : 3;
      html += this.propText(node, 'label', 'Name');
      html += this.propNum(node, 'count', 'Count', 1, 10);
      var ilsPSlots = node.props.slots || [];
      var ilsPComp = node.computed || {};
      html += '<div class="prop-label mt-10">Slots ('+ilsPSlots.length+'/'+ilsMaxSlots+')</div>';
      var ilsItemOpts = itemOptions();
      for (var ilsPi = 0; ilsPi < ilsPSlots.length; ilsPi++) {
        var ilsPSl = ilsPSlots[ilsPi];
        html += '<div class="ils-slot-cfg">';
        html += '<div class="ils-mode-row">';
        html += '<span class="ils-slot-num">'+(ilsPi+1)+'</span>';
        html += '<button class="ils-mode-btn'+(ilsPSl.mode==='export'?' ils-mode-active-exp':'')+'" onclick="App.setILSSlotMode(\''+node.id+'\','+ilsPi+',\'export\')">Export</button>';
        html += '<button class="ils-mode-btn'+(ilsPSl.mode==='import'?' ils-mode-active-imp':'')+'" onclick="App.setILSSlotMode(\''+node.id+'\','+ilsPi+',\'import\')">Import</button>';
        html += '<button class="ils-slot-remove" onclick="App.removeILSSlot(\''+node.id+'\','+ilsPi+')" title="Remove slot">&#x2715;</button>';
        html += '</div>';
        html += '<select class="select-ctrl" onchange="App.setILSSlotItem(\''+node.id+'\','+ilsPi+',this.value)">';
        html += '<option value="">&#8212; select item &#8212;</option>';
        for (var ilsIO = 0; ilsIO < ilsItemOpts.length; ilsIO++) {
          var ilsIOpt = ilsItemOpts[ilsIO];
          html += '<option value="'+ilsIOpt.v+'"'+(ilsPSl.item===ilsIOpt.v?' selected':'')+'>'+ilsIOpt.l+'</option>';
        }
        html += '</select>';
        if (ilsPSl.item) {
          if (ilsPSl.mode === 'export') {
            var ilsPExpRate = (ilsPComp.exports && ilsPComp.exports[ilsPSl.item]) ? ilsPComp.exports[ilsPSl.item] : 0;
            html += '<div class="ils-rate-ro"><span class="ils-rate-label">Rate (auto):</span> '+fmtRate(ilsPExpRate)+'/min</div>';
          } else {
            var ilsPPO = ilsPComp.portOutputs && ilsPComp.portOutputs['out_'+ilsPi];
            var ilsPImpRate = ilsPPO ? ilsPPO.rate : 0;
            html += '<div class="ils-rate-ro"><span class="ils-rate-label">Rate (inter-planet):</span> '+fmtRate(ilsPImpRate)+'/min</div>';
          }
        }
        html += '</div>';
      }
      if (ilsPSlots.length < ilsMaxSlots) {
        html += '<button class="btn btn-full mt-6" onclick="App.addILSSlot(\''+node.id+'\')">+ Add slot</button>';
      }
    }

    // computed panel
    if (node.computed && Object.keys(node.computed).length > 0) {
      html += '<div class="prop-label mt-16">Live stats</div>';
      html += '<div class="stat-card">';
      var c = node.computed;
      var isPwrGen = (c.item_out === 'power');
      if (c.output_per_min !== undefined && !isPwrGen) {
        html += statRow2('Output', fmtRate(c.output_per_min) + '/min');
      }
      if (c.output_per_min !== undefined && isPwrGen) {
        html += statRow2('Power output', fmtNum(c.output_per_min, 2) + ' MW');
        if (c.max_output !== undefined && c.max_output !== c.output_per_min) {
          html += statRow2('Max power', fmtNum(c.max_output, 2) + ' MW');
        }
        if (c.plants_fed !== undefined) {
          html += statRow2('Plants fed', c.plants_fed + ' / ' + node.props.count);
        }
      }
      if (c.input_per_min !== undefined) {
        html += statRow2('Input arriving', fmtRate(c.input_per_min) + '/min');
      }
      if (c.effective_input !== undefined) {
        html += statRow2('Effective input', fmtRate(c.effective_input) + '/min');
      }
      if (c.input_need !== undefined) {
        html += statRow2('Input needed', fmtRate(c.input_need) + '/min');
      }
      if (c.fuel_need !== undefined) {
        html += statRow2('Fuel needed', fmtRate(c.fuel_need) + '/min');
      }
      if (c.input_sorter_cap !== undefined) {
        html += statRow2('Input sorter cap', fmtRate(c.input_sorter_cap) + '/min');
      }
      if (c.output_sorter_cap !== undefined) {
        html += statRow2('Output sorter cap', fmtRate(c.output_sorter_cap) + '/min');
      }
      if (c.max_output !== undefined && !isPwrGen) {
        html += statRow2('Max possible', fmtRate(c.max_output) + '/min');
      }
      if (c.power_draw_mw !== undefined && c.power_draw_mw > 0) {
        html += statRow2('Power draw', fmtNum(c.power_draw_mw, 2) + ' MW');
      }
      if (c.efficiency !== undefined) {
        var ec = c.efficiency >= 90 ? 'ok' : c.efficiency >= 50 ? 'warn' : 'bad';
        html += '<div class="stat-divider"><span class="tip-text">Efficiency</span> <span class="badge '+ec+'">'+c.efficiency+'%</span></div>';
      }
      var pTierDisp = node.props.proliferator_tier;
      if (pTierDisp && pTierDisp !== 'none') {
        var pModeDisp = node.props.proliferator_mode || 'extra_products';
        var pLabel = pTierDisp.toUpperCase() + ' — ' + (pModeDisp === 'speed' ? 'Speed boost' : 'Extra products');
        html += '<div class="prolif-banner">'+escHtml(pLabel)+'</div>';
      }
      html += '</div>';
    }

    html += '<button class="btn btn-full mt-12" onclick="App.switchTab(\'stats\')">&#x1F4CA; View in Analysis</button>';

    return html;
  },

  buildStatsHTML: function() {
    var html = '';
    var alerts = [];
    var totalPower = 0;
    var totalConsumption = 0;
    var nodeCount = Object.keys(State.nodes).length;

    Object.values(State.nodes).forEach(function(node) {
      var c = node.computed;
      if (!c) {
        return;
      }
      var def = NODE_DEFS[node.type];
      var label = node.props.label || def.label;

      if (c.item_out === 'power') {
        totalPower += c.output_per_min || 0;
      }
      totalConsumption += c.power_draw_mw || 0;

      if (c.efficiency !== undefined) {
        if (c.efficiency < 50) {
          alerts.push({type:'bad',nodeId:node.id,msg:label+': severely starved ('+c.efficiency+'% efficient)'});
        } else if (c.efficiency < 90) {
          alerts.push({type:'warn',nodeId:node.id,msg:label+': partially starved ('+c.efficiency+'% efficient)'});
        }
      }

      if (node.type === 'belt' && c.load_pct > 100) {
        alerts.push({type:'bad',nodeId:node.id,msg:label+': belt SATURATED ('+c.load_pct+'% loaded — items backing up!)'});
      } else if (node.type === 'belt' && c.load_pct > 85) {
        alerts.push({type:'warn',nodeId:node.id,msg:label+': belt near capacity ('+c.load_pct+'%)'});
      }

      if (node.type === 'storage_depot' || node.type === 'storage_tank') {
        // Use actual_outflow which is correctly set by the post-processing pass
        var actualStOut = (c.actual_outflow !== undefined) ? c.actual_outflow : c.output_per_min;
        if (actualStOut > c.input_per_min + 0.5) {
          var drainRateSt = fmtRate(actualStOut - c.input_per_min);
          alerts.push({type:'bad',nodeId:node.id,msg:label+': draining '+drainRateSt+'/min faster than filling'});
        }
        // Warn if output sorter capacity exceeds input (could drain a pre-filled depot)
        if (c.sorter_cap_out !== undefined && c.sorter_cap_out > c.input_per_min + 0.5 && Math.abs(actualStOut - c.input_per_min) < 0.5) {
          alerts.push({type:'warn',nodeId:node.id,msg:label+': output sorter capacity ('+fmtRate(c.sorter_cap_out)+'/min) exceeds input rate — will drain if pre-filled'});
        }
      }

      if (c.input_sorter_cap !== undefined && c.input_per_min > c.input_sorter_cap * 1.05) {
        alerts.push({type:'bad',nodeId:node.id,msg:label+': input sorter is the bottleneck ('+fmtRate(c.input_sorter_cap)+'/min cap vs '+fmtRate(c.input_per_min)+'/min arriving)'});
      }

      if (c.output_sorter_cap !== undefined && c.max_output > c.output_sorter_cap * 1.05) {
        alerts.push({type:'warn',nodeId:node.id,msg:label+': output sorter may limit throughput ('+fmtRate(c.output_sorter_cap)+'/min cap vs '+fmtRate(c.max_output)+'/min possible)'});
      }
    });

    var pwrBal = totalPower - totalConsumption;
    var pwrBalColor = pwrBal >= 0 ? 'var(--ok)' : 'var(--bad)';
    var pwrBalStr = (pwrBal >= 0 ? '+' : '') + fmtNum(pwrBal, 2) + ' MW';
    html += '<div class="flex-export-row">';
    html += '<button class="btn btn-flex1" onclick="App.exportFactory(\'copy\')">Copy summary</button>';
    html += '<button class="btn btn-flex1" onclick="App.exportFactory(\'download\')">Download .txt</button>';
    html += '</div>';
    html += '<div class="stat-grid">';
    html += '<div class="stat-card"><div class="sc-title">Generation</div><div class="sc-val sc-val-ok">'+fmtNum(totalPower,2)+' MW</div></div>';
    html += '<div class="stat-card"><div class="sc-title">Consumption</div><div class="sc-val sc-val-bad">'+fmtNum(totalConsumption,2)+' MW</div></div>';
    html += '<div class="stat-card"><div class="sc-title">Power balance</div><div class="sc-val '+(pwrBal >= 0 ? 'sc-val-ok' : 'sc-val-bad')+'">'+pwrBalStr+'</div></div>';
    html += '<div class="stat-card"><div class="sc-title">Total nodes</div><div class="sc-val">'+nodeCount+'</div></div>';
    html += '</div>';

    if (alerts.length === 0) {
      html += '<div class="alert-item ok"><span class="ai-icon"></span><span>All nodes are balanced and running at capacity.</span></div>';
    } else {
      for (var i = 0; i < alerts.length; i++) {
        var nid = alerts[i].nodeId ? alerts[i].nodeId : '';
        var clickAttr = nid ? ' class="alert-click" onclick="App.focusNode(\'' + nid + '\')"' : '';
        html += '<div class="alert-item '+alerts[i].type+'"'+clickAttr+'>';
        html += '<span>'+escHtml(alerts[i].msg)+'</span>';
        if (nid) {
          html += '<span class="alert-locate-hint">click to locate</span>';
        }
        html += '</div>';
      }
    }

    // per-item flow summary
    var itemFlows = {};
    Object.values(State.nodes).forEach(function(node) {
      var c = node.computed;
      if (!c) return;
      var t = node.type;
      if (t === 'belt' || t === 'storage_depot' || t === 'storage_tank') return;
      var outItem = c.item_out || c.item;
      if (outItem && outItem !== 'power' && c.output_per_min !== undefined && c.output_per_min > 0) {
        if (!itemFlows[outItem]) itemFlows[outItem] = {prod:0, cons:0};
        itemFlows[outItem].prod += c.output_per_min;
      }
      if (c.input_details && c.input_details.length) {
        for (var fi = 0; fi < c.input_details.length; fi++) {
          var inItem = c.input_details[fi].item;
          var inEff = c.input_details[fi].effective || 0;
          if (inItem && inItem !== 'power' && inEff > 0) {
            if (!itemFlows[inItem]) itemFlows[inItem] = {prod:0, cons:0};
            itemFlows[inItem].cons += inEff;
          }
        }
      } else if (c.item_in && c.item_in !== 'power' && c.effective_input !== undefined && c.effective_input > 0) {
        if (!itemFlows[c.item_in]) itemFlows[c.item_in] = {prod:0, cons:0};
        itemFlows[c.item_in].cons += c.effective_input;
      }
    });
    var flowKeys = Object.keys(itemFlows);
    if (flowKeys.length > 0) {
      flowKeys.sort(function(a, b) {
        var netA = itemFlows[a].prod - itemFlows[a].cons;
        var netB = itemFlows[b].prod - itemFlows[b].cons;
        return netA - netB;
      });
      html += '<div class="prop-label mt-16">Item flow summary</div>';
      html += '<table class="summary-table">';
      html += '<thead><tr class="thead-dim">';
      html += '<th class="th-l">Item</th>';
      html += '<th class="th-r">Prod/min</th>';
      html += '<th class="th-r">Cons/min</th>';
      html += '<th class="th-r">Net</th>';
      html += '</tr></thead><tbody>';
      for (var fk = 0; fk < flowKeys.length; fk++) {
        var fkey = flowKeys[fk];
        var fp = itemFlows[fkey];
        var net = fp.prod - fp.cons;
        var netAbsStr = fmtRate(Math.abs(net));
        var netStr = net < -0.05 ? ('-' + netAbsStr) : (net > 0.05 ? ('+' + netAbsStr) : ('~' + netAbsStr));
        var netClass = net < -0.05 ? 'sc-val-bad' : (net > 0.05 ? 'sc-val-ok' : 'stat-text3');
        html += '<tr class="tr-border' + (net < -0.05 ? ' ils-row-bad' : '') + '">';
        html += '<td class="td-item">' + escHtml(itemName(fkey)) + '</td>';
        html += '<td class="td-prod">' + (fp.prod > 0 ? fmtRate(fp.prod) : '—') + '</td>';
        html += '<td class="td-cons">' + (fp.cons > 0 ? fmtRate(fp.cons) : '—') + '</td>';
        html += '<td class="td-right ' + netClass + '">' + netStr + '</td>';
        html += '</tr>';
      }
      html += '</tbody></table>';
    }

    // research goal calculator
    var MATRIX_KEYS = ['em_matrix','energy_matrix','structure_matrix','information_matrix','gravity_matrix','universe_matrix'];
    var MATRIX_NAMES_R = {em_matrix:'EM Matrix',energy_matrix:'Energy Matrix',structure_matrix:'Structure Matrix',information_matrix:'Info Matrix',gravity_matrix:'Gravity Matrix',universe_matrix:'Universe Matrix'};
    var MATRIX_COLORS_R = {em_matrix:'#3b82f6',energy_matrix:'#ef4444',structure_matrix:'#ca8a04',information_matrix:'#22c55e',gravity_matrix:'#a78bfa',universe_matrix:'#e2e8f0'};
    html += '<div class="prop-label mt-16">Research Goal Calculator</div>';
    html += '<div class="prop-row"><label class="label-90">Technology</label>';
    html += '<select class="select-ctrl" onchange="App.setResearchGoal(this.value)">';
    html += '<option value="">— pick a tech —</option>';
    for (var ti = 0; ti < TECH_REQUIREMENTS.length; ti++) {
      var tr = TECH_REQUIREMENTS[ti];
      html += '<option value="'+escHtml(tr.key)+'"'+(State.researchGoal===tr.key?' selected':'')+'>'+escHtml(tr.name)+'</option>';
    }
    html += '</select></div>';
    html += '<div class="prop-row"><label class="label-90">Target time</label>';
    html += '<input type="number" min="0.1" step="0.5" value="'+(State.researchTargetHours||2)+'" class="input-ctrl" onchange="App.setResearchTargetHours(this.value)">';
    html += '<span class="unit-label-6">hours</span></div>';
    State.researchDeficits = [];
    if (State.researchGoal) {
      var selTech = null;
      for (var tj = 0; tj < TECH_REQUIREMENTS.length; tj++) {
        if (TECH_REQUIREMENTS[tj].key === State.researchGoal) { selTech = TECH_REQUIREMENTS[tj]; break; }
      }
      if (selTech) {
        var matOut = {};
        for (var mki = 0; mki < MATRIX_KEYS.length; mki++) { matOut[MATRIX_KEYS[mki]] = 0; }
        Object.values(State.nodes).forEach(function(nd) {
          var nc = nd.computed;
          if (!nc) return;
          var oi = nc.item_out;
          if (oi && matOut[oi] !== undefined && nc.output_per_min > 0) { matOut[oi] += nc.output_per_min; }
        });
        var tgtHours = State.researchTargetHours || 2;
        var tgtMins = tgtHours * 60;
        var costKeys = Object.keys(selTech.costs);
        html += '<table class="summary-table mt-8 mb-0">';
        html += '<thead><tr class="thead-dim">';
        html += '<th class="th-l">Matrix</th>';
        html += '<th class="th-r">Total need</th>';
        html += '<th class="th-r">Need/min</th>';
        html += '<th class="th-r">Have/min</th>';
        html += '</tr></thead><tbody>';
        var maxShortfall = 0;
        var bottleneckMat = '';
        for (var ck = 0; ck < costKeys.length; ck++) {
          var mk = costKeys[ck];
          var need = selTech.costs[mk];
          var reqRate = need / tgtMins;
          var haveRate = matOut[mk] || 0;
          var deficit = reqRate - haveRate;
          var matColor = MATRIX_COLORS_R[mk] || 'var(--text)';
          var haveClass = haveRate >= reqRate ? 'sc-val-ok' : (haveRate > 0 ? 'sc-val-warn' : 'sc-val-bad');
          if (deficit > maxShortfall) { maxShortfall = deficit; bottleneckMat = mk; }
          html += '<tr class="tr-border' + (deficit > 0.01 ? ' ils-row-bad' : '') + '">';
          html += '<td class="td-item" style="color:'+matColor+'">'+escHtml(MATRIX_NAMES_R[mk]||mk)+'</td>';
          html += '<td class="td-right">'+need.toLocaleString()+'</td>';
          html += '<td class="td-text2">'+fmtNum(reqRate,1)+'/min</td>';
          html += '<td class="td-right '+haveClass+'">'+(haveRate>0?fmtNum(haveRate,1)+'/min':'—')+'</td>';
          html += '</tr>';
          if (deficit > 0.01) {
            var labRec = RECIPES[mk];
            var labsNeeded = 0;
            if (labRec) {
              var ratePerLab = labRec.outputs[0].qty / labRec.time * 60;
              labsNeeded = Math.ceil(deficit / ratePerLab);
            }
            State.researchDeficits.push({item: mk, rate: deficit});
            html += '<tr><td colspan="4" class="td-warn">';
            html += '↳ +'+labsNeeded+' Lab'+(labsNeeded!==1?'s':'')+' needed (+'+fmtNum(deficit,1)+'/min)';
            html += '</td></tr>';
          }
        }
        html += '</tbody></table>';
        // Summary card
        var estTimeMin = 0;
        var anyZero = false;
        for (var ek = 0; ek < costKeys.length; ek++) {
          var emk = costKeys[ek];
          var er = matOut[emk] || 0;
          if (er <= 0) { anyZero = true; break; }
          var t = selTech.costs[emk] / er;
          if (t > estTimeMin) estTimeMin = t;
        }
        var estStr;
        if (anyZero || costKeys.length === 0) {
          estStr = '∞ — missing matrix production';
        } else if (estTimeMin < 60) {
          estStr = fmtNum(estTimeMin, 1) + ' min';
        } else if (estTimeMin < 1440) {
          estStr = fmtNum(estTimeMin/60, 2) + ' hr';
        } else {
          estStr = fmtNum(estTimeMin/1440, 1) + ' days';
        }
        html += '<div class="research-summary-card">';
        html += '<div class="research-summary-col"><div class="research-summary-label">At current output</div>';
        html += '<div class="research-summary-val">'+escHtml(estStr)+'</div>';
        if (bottleneckMat && !anyZero) {
          html += '<div class="research-summary-note">Bottleneck: '+escHtml(MATRIX_NAMES_R[bottleneckMat]||bottleneckMat)+'</div>';
        }
        html += '</div>';
        if (maxShortfall > 0.01) {
          html += '<div class="research-summary-col"><div class="research-summary-label">For '+fmtNum(tgtHours,1)+'hr goal</div>';
          html += '<div class="research-summary-warn">+'+fmtNum(maxShortfall,1)+'/min needed</div>';
          html += '<div class="research-summary-note">of '+escHtml(MATRIX_NAMES_R[bottleneckMat]||bottleneckMat)+'</div>';
          html += '</div>';
        }
        html += '</div>';
        if (State.researchDeficits.length > 0) {
          var nd = State.researchDeficits.length;
          html += '<button class="btn primary btn-full mt-6" onclick="App.buildResearchChains()">Build '+nd+' missing chain'+(nd!==1?'s':'')+'</button>';
        }
      }
    }

    // dyson sphere estimator
    var dysonLum = State.dysonLuminosity || 1.0;
    var dysonSwarmPct = State.dysonSwarmPct || 0;
    var dysonShellPct = State.dysonShellPct || 0;
    var dysonSailRate = State.dysonSailRate || 0;
    var dysonOrbitCap = State.dysonOrbitCap || 10000;
    var swarmPow = (dysonSwarmPct / 100) * dysonLum * 360;
    var shellPow = (dysonShellPct / 100) * dysonLum * 1500;
    var totalDysonPow = swarmPow + shellPow;
    var fmtDysonMW = function(mw) {
      if (mw >= 1000) { return fmtNum(mw / 1000, 2) + ' GW'; }
      return fmtNum(mw, 0) + ' MW';
    };
    html += '<div class="prop-label mt-16">Dyson Sphere Estimator</div>';
    html += '<div class="dyson-panel">';
    html += '<div class="prop-row"><label class="label-90">Luminosity</label>';
    html += '<input type="number" min="0.1" max="25" step="0.1" value="'+fmtNum(dysonLum,1)+'" class="input-ctrl" onchange="App.setDysonCalc(\'dysonLuminosity\',this.value)">';
    html += '</div>';
    html += '<div class="dyson-hint">M≈0.3 · K≈0.6 · G≈1.0 · F≈1.5 · A≈2.5 · B≈4 · O≈8 · Neutron≈9</div>';
    html += '<div class="prop-row"><label class="label-90">Swarm %</label>';
    html += '<input type="range" min="0" max="100" step="1" value="'+dysonSwarmPct+'" oninput="this.nextElementSibling.textContent=this.value+\'%\'" onchange="App.setDysonCalc(\'dysonSwarmPct\',this.value)">';
    html += '<span class="range-val">'+dysonSwarmPct+'%</span></div>';
    html += '<div class="prop-row"><label class="label-90">Shell %</label>';
    html += '<input type="range" min="0" max="100" step="1" value="'+dysonShellPct+'" oninput="this.nextElementSibling.textContent=this.value+\'%\'" onchange="App.setDysonCalc(\'dysonShellPct\',this.value)">';
    html += '<span class="range-val">'+dysonShellPct+'%</span></div>';
    html += '<div class="prop-row"><label class="label-90">Sails/min</label>';
    html += '<input type="number" min="0" step="1" value="'+dysonSailRate+'" class="input-ctrl" onchange="App.setDysonCalc(\'dysonSailRate\',this.value)">';
    html += '</div>';
    html += '<div class="prop-row"><label class="label-90">Orbit cap</label>';
    html += '<input type="number" min="1000" step="1000" value="'+dysonOrbitCap+'" class="input-ctrl" onchange="App.setDysonCalc(\'dysonOrbitCap\',this.value)">';
    html += '<span class="unit-label">sails</span></div>';
    html += '<div class="dyson-grid">';
    html += '<div class="dyson-cell">';
    html += '<div class="dyson-label">Swarm</div>';
    html += '<div class="dyson-val-gold">'+fmtDysonMW(swarmPow)+'</div></div>';
    html += '<div class="dyson-cell">';
    html += '<div class="dyson-label">Shell</div>';
    html += '<div class="dyson-val-purple">'+fmtDysonMW(shellPow)+'</div></div>';
    html += '<div class="dyson-cell-total">';
    html += '<div class="dyson-label">Total</div>';
    html += '<div class="dyson-val-ok">'+fmtDysonMW(totalDysonPow)+'</div></div>';
    html += '</div>';
    if (dysonSailRate > 0) {
      var sailsLeft = Math.max(0, Math.ceil((1 - dysonSwarmPct / 100) * dysonOrbitCap));
      var minsToFull = sailsLeft / dysonSailRate;
      var timeStr;
      if (sailsLeft === 0) {
        timeStr = 'Swarm already complete.';
      } else if (minsToFull < 60) {
        timeStr = 'Full swarm in ~' + fmtNum(minsToFull, 0) + ' min';
      } else if (minsToFull < 1440) {
        timeStr = 'Full swarm in ~' + fmtNum(minsToFull / 60, 1) + ' hr';
      } else {
        timeStr = 'Full swarm in ~' + fmtNum(minsToFull / 1440, 1) + ' days';
      }
      html += '<div class="dyson-time-note">'+escHtml(timeStr)+' ('+sailsLeft.toLocaleString()+' sails remaining)</div>';
    }
    html += '<div class="dyson-footnote">Estimates: Swarm ~360 MW/L at 100%, Shell ~1,500 MW/L at 100%</div>';
    html += '</div>';

    // bottleneck summary
    var bktCrit = [], bktWarn = [], bktOk = [];
    var bnIds = Object.keys(State.nodes);
    for (var bni = 0; bni < bnIds.length; bni++) {
      var bn = State.nodes[bnIds[bni]];
      var beff = bn.computed ? bn.computed.efficiency : undefined;
      if (beff === undefined || beff === null) { continue; }
      if (beff < 50) { bktCrit.push(bn.id); }
      else if (beff < 90) { bktWarn.push(bn.id); }
      else { bktOk.push(bn.id); }
    }
    State.nodeBuckets = {crit: bktCrit, warn: bktWarn, ok: bktOk};
    html += '<div class="prop-label mt-16">Bottleneck Summary</div>';
    html += '<div class="stat-grid">';
    html += '<div class="stat-card stat-card-sm" onclick="App.highlightBucket(\'crit\')">';
    html += '<div class="sc-val-lg sc-val-bad">'+bktCrit.length+'</div>';
    html += '<div class="sc-sub-mt"><span class="badge bad">&lt;50%</span></div>';
    html += '</div>';
    html += '<div class="stat-card stat-card-sm" onclick="App.highlightBucket(\'warn\')">';
    html += '<div class="sc-val-lg sc-val-warn">'+bktWarn.length+'</div>';
    html += '<div class="sc-sub-mt"><span class="badge warn">50–89%</span></div>';
    html += '</div>';
    html += '<div class="stat-card stat-card-sm" onclick="App.highlightBucket(\'ok\')">';
    html += '<div class="sc-val-lg sc-val-ok">'+bktOk.length+'</div>';
    html += '<div class="sc-sub-mt"><span class="badge ok">≥90%</span></div>';
    html += '</div>';
    html += '</div>';

    // per-node breakdown
    var _bnLabel = 'Node breakdown';
    if (State.planets.length > 0 && State.currentPlanet !== 'all') {
      _bnLabel += ' — ' + State.currentPlanet;
    }
    html += '<div class="prop-label mt-16">'+escHtml(_bnLabel)+'</div>';
    var _bnNodes = Object.values(State.nodes);
    if (State.planets.length > 0 && State.currentPlanet !== 'all') {
      _bnNodes = _bnNodes.filter(function(n) {
        return !(n.props.planet) || n.props.planet === State.currentPlanet;
      });
    }
    _bnNodes.forEach(function(node) {
      var c = node.computed;
      var def = NODE_DEFS[node.type];
      var label = node.props.label || def.label;
      var eff = c.efficiency !== undefined ? c.efficiency : null;
      var effClass = eff !== null ? (eff >= 90 ? 'ok' : eff >= 50 ? 'warn' : 'bad') : '';
      html += '<div class="stat-card stat-card-click" onclick="App.selectNode(\''+node.id+'\');App.switchTab(\'props\')">';
      html += '<div class="sc-title">'+def.icon+' '+escHtml(label);
      if (eff !== null) {
        html += ' <span class="badge '+effClass+'">'+eff+'%</span>';
      }
      if (State.planets.length > 0 && State.currentPlanet === 'all' && node.props.planet) {
        html += ' <span class="planet-note">'+escHtml(node.props.planet)+'</span>';
      }
      html += '</div>';
      if (c.output_per_min !== undefined && c.item_out !== 'power') {
        html += '<div class="sc-val sc-val-md">'+fmtRate(c.output_per_min)+'/min</div>';
      } else if (c.output_per_min !== undefined && c.item_out === 'power') {
        html += '<div class="sc-val sc-val-md">'+fmtNum(c.output_per_min,2)+' MW</div>';
      }
      html += '</div>';
    });

    // Interstellar logistics summary (only when planets are set up and ILS nodes exist)
    if (State.planets.length > 0) {
      var ilsRows = {};
      Object.values(State.nodes).forEach(function(nd) {
        if (nd.type !== 'ils_station' && nd.type !== 'pls_station') { return; }
        var ndPlanet = nd.props.planet || '';
        // Export side — from computed.exports
        if (nd.computed && nd.computed.exports) {
          var exps = nd.computed.exports;
          var expKeys = Object.keys(exps);
          for (var exki = 0; exki < expKeys.length; exki++) {
            var exItem = expKeys[exki];
            var exRate = exps[exItem] || 0;
            if (!ilsRows[exItem]) { ilsRows[exItem] = {supply:0, demand:0, exportPlanets:[], importPlanets:[]}; }
            ilsRows[exItem].supply += exRate;
            if (ndPlanet && ilsRows[exItem].exportPlanets.indexOf(ndPlanet) === -1) {
              ilsRows[exItem].exportPlanets.push(ndPlanet);
            }
          }
        }
        // Import side — from computed.portOutputs
        if (nd.computed && nd.computed.portOutputs) {
          var po = nd.computed.portOutputs;
          var poKeys = Object.keys(po);
          for (var poki = 0; poki < poKeys.length; poki++) {
            var poEntry = po[poKeys[poki]];
            if (!poEntry || !poEntry.item) { continue; }
            var impItem = poEntry.item;
            var impRate = poEntry.rate || 0;
            if (!ilsRows[impItem]) { ilsRows[impItem] = {supply:0, demand:0, exportPlanets:[], importPlanets:[]}; }
            ilsRows[impItem].demand += impRate;
            if (ndPlanet && ilsRows[impItem].importPlanets.indexOf(ndPlanet) === -1) {
              ilsRows[impItem].importPlanets.push(ndPlanet);
            }
          }
        }
      });
      var ilsItemKeys = Object.keys(ilsRows);
      if (ilsItemKeys.length > 0) {
        html += '<div class="prop-label mt-16">Interstellar Logistics</div>';
        html += '<table class="summary-table">';
        html += '<thead><tr class="thead-dim">';
        html += '<th class="th-l">Item</th>';
        html += '<th class="th-r">Supply</th>';
        html += '<th class="th-r">Demand</th>';
        html += '<th class="th-r">Balance</th>';
        html += '</tr></thead><tbody>';
        for (var ilsRi = 0; ilsRi < ilsItemKeys.length; ilsRi++) {
          var ilsKey = ilsItemKeys[ilsRi];
          var ilsRow = ilsRows[ilsKey];
          var ilsNet = ilsRow.supply - ilsRow.demand;
          var ilsNetStr = ilsNet >= -0.05 ? ('+' + fmtRate(ilsNet)) : ('-' + fmtRate(Math.abs(ilsNet)));
          html += '<tr class="tr-border' + (ilsNet < -0.05 ? ' ils-row-bad' : '') + '">';
          html += '<td class="td-item">' + escHtml(itemName(ilsKey)) + '</td>';
          html += '<td class="td-prod">' + (ilsRow.supply > 0 ? fmtRate(ilsRow.supply) + '/min' : '—') + '</td>';
          html += '<td class="td-cons">' + (ilsRow.demand > 0 ? fmtRate(ilsRow.demand) + '/min' : '—') + '</td>';
          html += '<td class="td-text2 ' + (ilsNet >= -0.05 ? 'sc-val-ok' : 'sc-val-bad') + '">' + ilsNetStr + '/min</td>';
          html += '</tr>';
        }
        html += '</tbody></table>';
      }
    }

    return html;
  },

  // build tab

  buildBuildPanelHTML: function() {
    // Collect unique craftable output items from RECIPES (exclude raw resources)
    var seen = {};
    var items = [];
    var rkeys = Object.keys(RECIPES);
    for (var ri = 0; ri < rkeys.length; ri++) {
      var rec = RECIPES[rkeys[ri]];
      var outItem = rec.outputs[0].item;
      if (!seen[outItem] && !CHAIN_RAW_RESOURCES[outItem]) {
        seen[outItem] = true;
        var itm = ITEMS[outItem];
        if (itm) {
          items.push({key: outItem, name: itm.name, icon: itm.icon || ''});
        }
      }
    }
    items.sort(function(a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });

    var selName = BuildState.product && ITEMS[BuildState.product] ? (ITEMS[BuildState.product].icon || '') + ' ' + ITEMS[BuildState.product].name : '';
    var html = '<div class="prop-group"><strong>Auto Chain Builder</strong><div class="build-hint">Pick an end product and target rate — the chain builder places all required machines and connects them automatically.</div></div>';
    html += '<div class="prop-label">End product</div>';
    html += '<div class="search-select-wrap">';
    html += '<input type="text" id="build-search" placeholder="Search items..." autocomplete="off" value="' + escHtml(selName) + '">';
    html += '<div class="search-dropdown" id="build-dropdown">';
    for (var ii = 0; ii < items.length; ii++) {
      var itm2 = items[ii];
      var selCls = itm2.key === BuildState.product ? ' selected' : '';
      html += '<div class="search-option' + selCls + '" data-key="' + escHtml(itm2.key) + '">' + escHtml(itm2.icon + ' ' + itm2.name) + '</div>';
    }
    html += '</div>';
    html += '<input type="hidden" id="build-product" value="' + escHtml(BuildState.product) + '">';
    html += '</div>';

    html += '<div class="prop-label">Target /min</div>';
    html += '<div class="prop-row"><input type="number" id="build-rate" min="0.01" step="1" value="' + BuildState.targetRate + '"></div>';

    html += '<div class="prop-label">Belt tier</div>';
    html += '<div class="prop-row"><select id="build-belt">';
    var beltOpts = [{v:'mk1',l:'Mk.I — 360/min'},{v:'mk2',l:'Mk.II — 720/min'},{v:'mk3',l:'Mk.III — 1800/min'}];
    for (var bi = 0; bi < beltOpts.length; bi++) {
      html += '<option value="' + beltOpts[bi].v + '"' + (BuildState.beltTier === beltOpts[bi].v ? ' selected' : '') + '>' + beltOpts[bi].l + '</option>';
    }
    html += '</select></div>';

    html += '<div class="prop-label">Sorter tier</div>';
    html += '<div class="prop-row"><select id="build-sorter">';
    var sorterOpts = [{v:'mk1',l:'Mk.I'},{v:'mk2',l:'Mk.II'},{v:'mk3',l:'Mk.III'}];
    for (var si = 0; si < sorterOpts.length; si++) {
      html += '<option value="' + sorterOpts[si].v + '"' + (BuildState.sorterTier === sorterOpts[si].v ? ' selected' : '') + '>' + sorterOpts[si].l + '</option>';
    }
    html += '</select></div>';

    html += '<div class="prop-label">Assembler tier</div>';
    html += '<div class="prop-row"><select id="build-assembler">';
    var asmOpts = [{v:'mk1',l:'Mk.I (0.75×)'},{v:'mk2',l:'Mk.II (1.0×)'},{v:'mk3',l:'Mk.III (1.5×)'}];
    for (var ai = 0; ai < asmOpts.length; ai++) {
      html += '<option value="' + asmOpts[ai].v + '"' + (BuildState.assemblerTier === asmOpts[ai].v ? ' selected' : '') + '>' + asmOpts[ai].l + '</option>';
    }
    html += '</select></div>';

    html += '<div class="prop-row mt-10"><button class="btn w-full" onclick="App.submitAutoChain()">Build Chain</button></div>';
    html += '<div id="build-result"></div>';
    return html;
  },

  bindBuildEvents: function() {
    var searchEl = document.getElementById('build-search');
    var dropdownEl = document.getElementById('build-dropdown');
    var productEl = document.getElementById('build-product');
    if (!searchEl || !dropdownEl || !productEl) { return; }

    searchEl.addEventListener('input', function() {
      var val = this.value.toLowerCase();
      var opts = dropdownEl.querySelectorAll('.search-option');
      var any = false;
      for (var i = 0; i < opts.length; i++) {
        var match = opts[i].textContent.toLowerCase().indexOf(val) !== -1;
        opts[i].style.display = match ? '' : 'none';
        if (match) { any = true; }
      }
      dropdownEl.classList.toggle('open', any || val === '');
    });

    searchEl.addEventListener('focus', function() {
      dropdownEl.classList.add('open');
    });

    var opts = dropdownEl.querySelectorAll('.search-option');
    for (var i = 0; i < opts.length; i++) {
      (function(opt) {
        opt.addEventListener('mousedown', function(e) {
          e.preventDefault();
          var key = opt.getAttribute('data-key');
          productEl.value = key;
          BuildState.product = key;
          searchEl.value = opt.textContent.trim();
          dropdownEl.classList.remove('open');
          // highlight selected
          var all = dropdownEl.querySelectorAll('.search-option');
          for (var j = 0; j < all.length; j++) { all[j].classList.remove('selected'); }
          opt.classList.add('selected');
        });
      })(opts[i]);
    }

    document.addEventListener('click', function onOutsideClick(e) {
      var wrap = searchEl && searchEl.closest ? searchEl.closest('.search-select-wrap') : null;
      if (!wrap || !wrap.contains(e.target)) {
        dropdownEl.classList.remove('open');
        document.removeEventListener('click', onOutsideClick);
      }
    });

    var beltEl = document.getElementById('build-belt');
    var sorterEl = document.getElementById('build-sorter');
    var asmEl = document.getElementById('build-assembler');
    var rateEl = document.getElementById('build-rate');
    if (beltEl) { beltEl.addEventListener('change', function() { BuildState.beltTier = this.value; }); }
    if (sorterEl) { sorterEl.addEventListener('change', function() { BuildState.sorterTier = this.value; }); }
    if (asmEl) { asmEl.addEventListener('change', function() { BuildState.assemblerTier = this.value; }); }
    if (rateEl) { rateEl.addEventListener('change', function() { BuildState.targetRate = parseFloat(this.value) || 60; }); }
  },

  submitAutoChain: function() {
    var product = document.getElementById('build-product').value;
    var rate = parseFloat(document.getElementById('build-rate').value) || 60;
    BuildState.targetRate    = rate;
    BuildState.beltTier      = document.getElementById('build-belt').value;
    BuildState.sorterTier    = document.getElementById('build-sorter').value;
    BuildState.assemblerTier = document.getElementById('build-assembler').value;
    BuildState.product       = product;

    if (!product || !findRecipeByOutput(product)) {
      document.getElementById('build-result').innerHTML =
        '<div class="chain-summary"><div class="warn-box">Select a valid end product first.</div></div>';
      return;
    }

    var tree = buildChainTree(product, rate, BuildState.assemblerTier, BuildState.sorterTier);
    this.placeChainTree(tree, BuildState.beltTier);
  },

  placeChainTree: function(tree, beltTier) {
    // Find rightmost X of existing nodes so the new chain doesn't overlap
    var rightmostX = 0;
    var existingIds = Object.keys(State.nodes);
    for (var i = 0; i < existingIds.length; i++) {
      var nx = State.nodes[existingIds[i]].x;
      if (nx > rightmostX) { rightmostX = nx; }
    }
    var startX = existingIds.length > 0 ? rightmostX + 320 : 200;

    var COL_WIDTH = 280;
    var ROW_HEIGHT = 190;

    function assignPos(node, x, cy) {
      node.canvasX = x;
      node.canvasY = cy;
      var cursor = cy - ((countLeaves(node) - 1) * ROW_HEIGHT) / 2;
      for (var i = 0; i < node.inputs.length; i++) {
        var inp = node.inputs[i];
        var leaves = countLeaves(inp);
        var inpCY = cursor + ((leaves - 1) * ROW_HEIGHT) / 2;
        assignPos(inp, x - COL_WIDTH, inpCY);
        cursor += leaves * ROW_HEIGHT;
      }
    }
    assignPos(tree, startX + getDepth(tree) * COL_WIDTH, 300);

    var self = this;
    var leafNodeMap = {};
    function createAll(node) {
      var id;
      if (node.inputs.length === 0 && node.item) {
        if (leafNodeMap[node.item] !== undefined) {
          var existId = leafNodeMap[node.item];
          var existNode = State.nodes[existId];
          if (node.nodeType === 'mining' && node.props.miners && node.props.miners.length > 0 &&
              existNode.props.miners && existNode.props.miners.length > 0) {
            existNode.props.miners[0].veins += node.props.miners[0].veins;
          } else if (existNode.props.count !== undefined) {
            existNode.props.count += node.props.count || 1;
          }
          node.createdId = existId;
          return;
        }
        id = self.addNodeRaw(node.nodeType, {x: node.canvasX, y: node.canvasY}, node.props);
        node.createdId = id;
        leafNodeMap[node.item] = id;
      } else {
        id = self.addNodeRaw(node.nodeType, {x: node.canvasX, y: node.canvasY}, node.props);
        node.createdId = id;
      }
      for (var i = 0; i < node.inputs.length; i++) {
        createAll(node.inputs[i]);
        var toPort = (node.nodeType === 'chemical_plant') ? 'in' : ('in_' + i);
        self.addEdgeRaw(node.inputs[i].createdId, 'out', id, toPort);
      }
    }
    createAll(tree);

    this.recalcAll();
    this.renderEdges();
    this.resetView();

    // Belt overload check across newly-built nodes only
    var overloaded = 0;
    var beltCap = BELT_CAPS[beltTier];
    function checkOverloads(node) {
      if (node.createdId) {
        var nd = State.nodes[node.createdId];
        var c = nd && nd.computed;
        if (c && c.output_per_min > beltCap) { overloaded++; }
      }
      for (var i = 0; i < node.inputs.length; i++) { checkOverloads(node.inputs[i]); }
    }
    checkOverloads(tree);

    var itemLabel = (ITEMS[tree.item] || {name: tree.item}).name;
    var summaryHtml = '<div class="chain-summary">'
      + 'Built chain for <strong>' + escHtml(itemLabel) + '</strong><br>'
      + 'Target: <strong>' + fmtNum(BuildState.targetRate, 1) + '/min</strong>'
      + ' &nbsp;|&nbsp; Actual: <strong>' + fmtNum(tree.actualOutput, 1) + '/min</strong>';
    if (overloaded > 0) {
      summaryHtml += '<div class="warn-box">&#9888; ' + overloaded
        + ' node(s) exceed Mk.' + beltTier.replace('mk', '')
        + ' belt capacity (' + beltCap + '/min). Consider upgrading belts or splitting output.</div>';
    }
    if (tree.chemExtraInputs && tree.chemExtraInputs.length) {
      summaryHtml += '<div class="warn-box">Chemical Plant extra inputs ('
        + escHtml(tree.chemExtraInputs.join(', '))
        + ') need to be connected manually.</div>';
    }
    summaryHtml += '</div>';
    var resultEl = document.getElementById('build-result');
    if (resultEl) { resultEl.innerHTML = summaryHtml; }
  },

  // prop helpers

  propText: function(node, key, label) {
    var val = node.props[key] || '';
    return '<div class="prop-row"><label>'+label+'</label><input type="text" value="'+escHtml(String(val))+'" onchange="App.setProp(\''+node.id+'\',\''+key+'\',this.value)"></div>';
  },

  propNum: function(node, key, label, min, max) {
    var val = node.props[key] !== undefined ? node.props[key] : 1;
    return '<div class="prop-row"><label>'+label+'</label><input type="number" min="'+min+'" max="'+max+'" value="'+val+'" onchange="App.setProp(\''+node.id+'\',\''+key+'\',+this.value)"></div>';
  },

  propRange: function(node, key, label, min, max, step) {
    var val = node.props[key] !== undefined ? node.props[key] : 0;
    return '<div class="prop-row"><label>'+label+'</label><input type="range" min="'+min+'" max="'+max+'" step="'+(step||1)+'" value="'+val+'" oninput="App.setProp(\''+node.id+'\',\''+key+'\',+this.value);this.nextSibling.textContent=this.value"><span class="range-val">'+val+'</span></div>';
  },

  propSelect: function(node, key, label, options) {
    var val = node.props[key];
    var html = '<div class="prop-row"><label>'+label+'</label><select onchange="App.setProp(\''+node.id+'\',\''+key+'\',this.value)">';
    html += '<option value="">-- select --</option>';
    for (var i = 0; i < options.length; i++) {
      var opt = options[i];
      var v = opt.v !== undefined ? opt.v : opt;
      var l = opt.l !== undefined ? opt.l : opt;
      var sel = (val !== null && val !== undefined && val !== '' && String(v) === String(val)) ? ' selected' : '';
      html += '<option value="'+v+'"'+sel+'>'+l+'</option>';
    }
    html += '</select></div>';
    return html;
  },

  propProliferator: function(node) {
    var t = node.props.proliferator_tier || 'none';
    var html = '<div class="prop-label mt-10">Proliferator</div>';
    html += this.propSelect(node, 'proliferator_tier', 'Tier', [
      {v:'none',l:'None'},{v:'mk1',l:'Mk.I'},{v:'mk2',l:'Mk.II'},{v:'mk3',l:'Mk.III'}
    ]);
    if (t !== 'none') {
      html += this.propSelect(node, 'proliferator_mode', 'Mode', [
        {v:'extra_products',l:'Extra Products (+12.5/25/50%)'},
        {v:'speed',l:'Production Speed (+25/50/100%)'}
      ]);
    }
    // Proliferator ROI: machines removable vs running no proliferators
    var cnt = node.props.count || 1;
    if (cnt > 0) {
      var extraMults = {mk1:1.125, mk2:1.25, mk3:1.5};
      var speedMults = {mk1:1.25, mk2:1.5, mk3:2.0};
      var pMode = node.props.proliferator_mode || 'extra_products';
      var roiTiers = ['mk1','mk2','mk3'];
      var roiLabels = {mk1:'Mk.I', mk2:'Mk.II', mk3:'Mk.III'};
      html += '<div class="roi-wrap">';
      html += '<div class="stat-section-hdr">ROI vs no proliferators ('+cnt+' machines)</div>';
      html += '<table class="roi-table">';
      html += '<tr class="text3-row"><th class="th-lw">Tier</th>';
      html += '<th class="th-cw">Extra Prod.</th>';
      html += '<th class="th-cw">Speed</th></tr>';
      for (var roi = 0; roi < roiTiers.length; roi++) {
        var rt = roiTiers[roi];
        var saveExt = cnt - Math.ceil(cnt / extraMults[rt]);
        var saveSpd = cnt - Math.ceil(cnt / speedMults[rt]);
        var hilExt = (t === rt && pMode === 'extra_products');
        var hilSpd = (t === rt && pMode === 'speed');
        html += '<tr class="tr-border">';
        html += '<td class="td-label">'+roiLabels[rt]+'</td>';
        html += '<td class="td-center '+(hilExt?'td-hi-ok':'td-hi-dim')+'">−'+saveExt+'</td>';
        html += '<td class="td-center '+(hilSpd?'td-hi-ok':'td-hi-dim')+'">−'+saveSpd+'</td>';
        html += '</tr>';
      }
      html += '</table>';
      html += '<div class="ns-note-4">Machines removable while maintaining current output</div>';
      html += '</div>';
    }
    return html;
  },

  propRecipeSearch: function(node, key, label, options) {
    var val = node.props[key];
    var currentLabel = '';
    for (var ci = 0; ci < options.length; ci++) {
      if (String(options[ci].v) === String(val)) {
        currentLabel = options[ci].l;
        break;
      }
    }
    // Include key in element IDs so multiple search fields on the same node don't collide
    var inputId = 'recipe-search-' + node.id + '-' + key;
    var listId  = 'recipe-list-'  + node.id + '-' + key;
    // Store the key name inside the JSON so filterRecipeList calls setProp with the right key
    var optJson = JSON.stringify({key: key, opts: options.map(function(o){ return {v:String(o.v), l:o.l, name:o.name||''}; })});
    var html = '<div class="prop-row prop-row-col">';
    html += '<label class="mb-2">'+label+'</label>';
    html += '<div class="pos-rel">';
    html += '<input type="text" id="'+inputId+'" placeholder="Search..." autocomplete="off"';
    html += ' value="'+escHtml(currentLabel)+'"';
    html += ' class="w-full"';
    html += ' oninput="App.filterRecipeList(\''+inputId+'\',\''+listId+'\',this.value)"';
    html += ' onfocus="App.filterRecipeList(\''+inputId+'\',\''+listId+'\',\'\')"';
    html += ' onblur="setTimeout(function(){var l=document.getElementById(\''+listId+'\');if(l)l.style.display=\'none\';},200)">';
    html += '<div id="'+listId+'" class="recipe-dropdown" style="display:none"></div>';
    html += '</div>';
    html += '<script type="application/json" id="recipe-opts-'+node.id+'-'+key+'">'+optJson+'<' + '/script>';
    html += '</div>';
    return html;
  },

  filterRecipeList: function(inputId, listId, searchVal) {
    var input = document.getElementById(inputId);
    var list = document.getElementById(listId);
    if (!input || !list) {
      return;
    }
    // inputId format: 'recipe-search-{nodeId}-{key}'
    var withoutPrefix = inputId.replace('recipe-search-', '');
    // Split on last '-' to get nodeId and key
    var lastDash = withoutPrefix.lastIndexOf('-');
    var nodeId = withoutPrefix.substring(0, lastDash);
    var propKey = withoutPrefix.substring(lastDash + 1);
    var optsEl = document.getElementById('recipe-opts-' + nodeId + '-' + propKey);
    if (!optsEl) {
      return;
    }
    var parsed;
    try {
      parsed = JSON.parse(optsEl.textContent);
    } catch(e) {
      return;
    }
    // Support both old format (array) and new format ({key, opts})
    var opts = Array.isArray(parsed) ? parsed : parsed.opts;
    var storedKey = Array.isArray(parsed) ? propKey : (parsed.key || propKey);
    var q = (searchVal || '').toLowerCase().trim();
    var filtered = opts.filter(function(o) {
      // Search on the recipe name only (not the ingredient list shown in the full label)
      var searchTarget = (o.name || o.l.split('(')[0]).toLowerCase().trim();
      return !q || searchTarget.indexOf(q) !== -1;
    });
    if (filtered.length === 0) {
      list.style.display = 'none';
      return;
    }
    list.innerHTML = '';
    for (var i = 0; i < filtered.length; i++) {
      (function(v, l) {
        var item = document.createElement('div');
        item.className = 'recipe-list-item';
        item.textContent = l;
        item.addEventListener('mousedown', function(e) {
          e.preventDefault();
          var inp = document.getElementById(inputId);
          if (inp) {
            inp.value = l;
          }
          list.style.display = 'none';
          App.setProp(nodeId, storedKey, v);
        });
        item.addEventListener('mouseover', function() { this.style.background = 'var(--bg4)'; });
        item.addEventListener('mouseout', function() { this.style.background = ''; });
        list.appendChild(item);
      })(filtered[i].v, filtered[i].l);
    }
    list.style.display = 'block';
  },

  setProp: function(nodeId, key, val) {
    var node = State.nodes[nodeId];
    if (!node) {
      return;
    }
    node.props[key] = val;

    // All node card rebuilds must happen BEFORE recalcAll so that the fresh
    // node_stats div exists when updateNodeDisplay tries to write into it.

    // Recipe changed on a multi-input machine: rebuild ports
    var multiInputTypes = ['arc_smelter', 'assembler', 'matrix_lab', 'oil_refinery', 'particle_collider'];
    if (key === 'recipe' && multiInputTypes.indexOf(node.type) !== -1) {
      var el = document.getElementById('node_' + nodeId);
      if (el) {
        el.innerHTML = this.buildNodeHTML(node);
        this.bindNodeEvents(el, node);
      }
    }
    // Resource changed on a mining node: rebuild so border color updates
    if (key === 'resource' && node.type === 'mining') {
      var miningEl = document.getElementById('node_' + nodeId);
      if (miningEl) {
        miningEl.innerHTML = this.buildNodeHTML(node);
        this.bindNodeEvents(miningEl, node);
      }
    }
    // Count changed: rebuild header so badge updates
    if (key === 'count') {
      var nodeEl2 = document.getElementById('node_' + nodeId);
      if (nodeEl2) {
        nodeEl2.innerHTML = this.buildNodeHTML(node);
        this.bindNodeEvents(nodeEl2, node);
      }
    }

    // recalcAll must run after any innerHTML rebuilds so updateNodeDisplay
    // can find and populate the freshly-created node_stats div
    this.recalcAll();
    this.renderEdges();
    if (key === 'planet') { this.applyPlanetFilter(); }
    if (State.tab === 'props' || State.tab === 'stats') {
      this.renderSidebar();
    }
    // Update node header text if label changed (no full rebuild needed for this)
    var headerEl = document.querySelector('#node_' + nodeId + ' .nh-title');
    if (headerEl && key === 'label') {
      headerEl.textContent = val || NODE_DEFS[node.type].label;
    }
  },

  addILSSlot: function(nodeId) {
    var node = State.nodes[nodeId];
    if (!node) { return; }
    if (!node.props.slots) { node.props.slots = []; }
    var max = node.type === 'ils_station' ? 5 : 3;
    if (node.props.slots.length >= max) { return; }
    node.props.slots.push({item: '', mode: 'export'});
    var el = document.getElementById('node_' + nodeId);
    if (el) { el.innerHTML = this.buildNodeHTML(node); this.bindNodeEvents(el, node); }
    this.recalcAll();
    this.renderEdges();
    this.renderSidebar();
  },

  removeILSSlot: function(nodeId, slotIdx) {
    var node = State.nodes[nodeId];
    if (!node || !node.props.slots) { return; }
    var portIn = 'in_' + slotIdx;
    var portOut = 'out_' + slotIdx;
    State.edges = State.edges.filter(function(e) {
      return !((e.to_node === nodeId && e.to_port === portIn) ||
               (e.from_node === nodeId && e.from_port === portOut));
    });
    node.props.slots.splice(slotIdx, 1);
    // Remap port IDs for slots that shifted down
    State.edges.forEach(function(e) {
      if (e.to_node === nodeId) {
        var m = e.to_port.match(/^in_(\d+)$/);
        if (m && parseInt(m[1], 10) > slotIdx) { e.to_port = 'in_' + (parseInt(m[1], 10) - 1); }
      }
      if (e.from_node === nodeId) {
        var m2 = e.from_port.match(/^out_(\d+)$/);
        if (m2 && parseInt(m2[1], 10) > slotIdx) { e.from_port = 'out_' + (parseInt(m2[1], 10) - 1); }
      }
    });
    var el = document.getElementById('node_' + nodeId);
    if (el) { el.innerHTML = this.buildNodeHTML(node); this.bindNodeEvents(el, node); }
    this.recalcAll();
    this.renderEdges();
    this.renderSidebar();
  },

  setILSSlotItem: function(nodeId, slotIdx, itemKey) {
    var node = State.nodes[nodeId];
    if (!node || !node.props.slots) { return; }
    node.props.slots[slotIdx].item = itemKey;
    var el = document.getElementById('node_' + nodeId);
    if (el) { el.innerHTML = this.buildNodeHTML(node); this.bindNodeEvents(el, node); }
    this.recalcAll();
    this.renderEdges();
    this.renderSidebar();
  },

  setILSSlotMode: function(nodeId, slotIdx, mode) {
    var node = State.nodes[nodeId];
    if (!node || !node.props.slots) { return; }
    var slot = node.props.slots[slotIdx];
    if (!slot || slot.mode === mode) { return; }
    // Remove edges connected to either port direction for this slot
    var portIn = 'in_' + slotIdx;
    var portOut = 'out_' + slotIdx;
    State.edges = State.edges.filter(function(e) {
      return !((e.to_node === nodeId && e.to_port === portIn) ||
               (e.from_node === nodeId && e.from_port === portOut));
    });
    slot.mode = mode;
    var el = document.getElementById('node_' + nodeId);
    if (el) { el.innerHTML = this.buildNodeHTML(node); this.bindNodeEvents(el, node); }
    this.recalcAll();
    this.renderEdges();
    this.renderSidebar();
  },

  updateMinerVein: function(nodeId, idx, val) {
    var node = State.nodes[nodeId];
    if (!node) {
      return;
    }
    node.props.miners[idx].veins = +val;
    this.recalcAll();
    this.renderEdges();
    this.renderSidebar();
  },

  addMiner: function(nodeId) {
    var node = State.nodes[nodeId];
    if (!node) {
      return;
    }
    node.props.miners.push({veins:6});
    var el = document.getElementById('node_' + nodeId);
    if (el) {
      el.innerHTML = this.buildNodeHTML(node);
      this.bindNodeEvents(el, node);
    }
    this.recalcAll();
    this.renderEdges();
    this.renderSidebar();
  },

  removeMiner: function(nodeId, idx) {
    var node = State.nodes[nodeId];
    if (!node || node.props.miners.length <= 1) {
      return;
    }
    node.props.miners.splice(idx, 1);
    var el = document.getElementById('node_' + nodeId);
    if (el) {
      el.innerHTML = this.buildNodeHTML(node);
      this.bindNodeEvents(el, node);
    }
    this.recalcAll();
    this.renderEdges();
    this.renderSidebar();
  },

  // selection

  clearStorageItem: function(nodeId) {
    var node = State.nodes[nodeId];
    if (!node) {
      return;
    }
    node.props.item = null;
    var nodeEl = document.getElementById('node_' + nodeId);
    if (nodeEl) {
      nodeEl.innerHTML = this.buildNodeHTML(node);
      this.bindNodeEvents(nodeEl, node);
    }
    this.recalcAll();
    this.renderEdges();
    this.renderSidebar();
  },

  focusNode: function(id) {
    var node = State.nodes[id];
    if (!node) {
      return;
    }

    // Pan and zoom to center this node in the viewport
    var wrap = document.getElementById('canvas-wrap');
    var ww = wrap.clientWidth;
    var wh = wrap.clientHeight;
    var targetZoom = Math.max(State.camera.zoom, 1.0);
    // Node center in world space (approximate 180x150 node size)
    var nx = node.x + 90;
    var ny = node.y + 75;
    State.camera.x = ww / 2 - nx * targetZoom;
    State.camera.y = wh / 2 - ny * targetZoom;
    State.camera.zoom = targetZoom;
    this.applyCamera();
    this.renderEdges();
    document.getElementById('zoom-label').textContent = Math.round(targetZoom * 100) + '%';

    // Update selection state directly without triggering a sidebar re-render mid-click.
    // The sidebar re-render is deferred to after the current event handler completes,
    // which prevents the Analysis tab DOM from being destroyed while the click is still
    // being processed (which caused focusNode to fire unreliably).
    if (State.selected && State.selected !== id) {
      var prevEl = document.getElementById('node_' + State.selected);
      if (prevEl) {
        prevEl.classList.remove('selected');
      }
    }
    var oldMultiIds = Object.keys(State.multiSelected);
    for (var mi = 0; mi < oldMultiIds.length; mi++) {
      var mel = document.getElementById('node_' + oldMultiIds[mi]);
      if (mel) {
        mel.classList.remove('selected');
        mel.classList.remove('multi-selected');
      }
    }
    State.multiSelected = {};
    State.selected = id;
    State.selectedEdge = null;
    State.tab = 'props';

    // apply the glow highlight immediately; the element lives in the canvas DOM
    // and is not affected by sidebar re-renders
    var el = document.getElementById('node_' + id);
    if (el) {
      el.classList.add('selected');
      el.classList.remove('analysis-highlight');
      void el.offsetWidth;
      el.classList.add('analysis-highlight');
      setTimeout(function() {
        el.classList.remove('analysis-highlight');
      }, 2100);
    }

    // Defer sidebar rebuild to after the current click event fully completes.
    // This avoids destroying the Analysis tab HTML mid-click.
    var self = this;
    setTimeout(function() {
      document.getElementById('tab-nodes').className = 'sidebar-tab';
      document.getElementById('tab-props').className = 'sidebar-tab active';
      document.getElementById('tab-stats').className = 'sidebar-tab';
      self.renderSidebar();
    }, 0);
  },

  highlightBucket: function(bucket) {
    var ids = (State.nodeBuckets && State.nodeBuckets[bucket]) || [];
    if (!ids.length) { return; }
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById('node_' + ids[i]);
      if (!el) { continue; }
      el.classList.remove('analysis-highlight');
      void el.offsetWidth;
      el.classList.add('analysis-highlight');
      (function(e) {
        setTimeout(function() { e.classList.remove('analysis-highlight'); }, 2100);
      })(el);
    }
  },

  selectNode: function(id, keepMulti) {
    // Clear previous single selection highlight
    if (State.selected) {
      var prev = document.getElementById('node_' + State.selected);
      if (prev) {
        prev.classList.remove('selected');
      }
    }
    // Clear multi selection highlights unless keepMulti is true
    if (!keepMulti) {
      var oldMulti = Object.keys(State.multiSelected);
      for (var mi = 0; mi < oldMulti.length; mi++) {
        var mel = document.getElementById('node_' + oldMulti[mi]);
        if (mel) {
          mel.classList.remove('selected');
          mel.classList.remove('multi-selected');
        }
      }
      State.multiSelected = {};
    }
    State.selected = id;
    State.selectedEdge = null;
    if (id) {
      var el = document.getElementById('node_' + id);
      if (el) {
        el.classList.add('selected');
      }
    }
    if (State.tab === 'props' || State.tab === 'stats') {
      this.renderSidebar();
    }
  },

  addToMultiSelection: function(id) {
    if (State.multiSelected[id]) {
      // Toggle off
      delete State.multiSelected[id];
      var el = document.getElementById('node_' + id);
      if (el) {
        el.classList.remove('multi-selected');
        el.classList.remove('selected');
      }
    } else {
      State.multiSelected[id] = true;
      var el2 = document.getElementById('node_' + id);
      if (el2) {
        el2.classList.add('multi-selected');
      }
    }
    // Clear single selection when going multi
    if (State.selected) {
      var prev = document.getElementById('node_' + State.selected);
      if (prev) {
        prev.classList.remove('selected');
      }
      State.selected = null;
    }
    if (State.tab === 'props') {
      // Show multi-selection info in props
      this.renderSidebar();
    }
  },

  applyMarqueeSelection: function() {
    if (!State.marquee) {
      return;
    }
    var m = State.marquee;
    var selX1 = Math.min(m.startX, m.curX);
    var selY1 = Math.min(m.startY, m.curY);
    var selX2 = Math.max(m.startX, m.curX);
    var selY2 = Math.max(m.startY, m.curY);
    // Only commit if the box was actually dragged a meaningful amount
    var w = selX2 - selX1;
    var h = selY2 - selY1;
    if (w < 4 && h < 4) {
      return;
    }
    // Clear old selection
    var self = this;
    Object.keys(State.multiSelected).forEach(function(mid) {
      var mel = document.getElementById('node_' + mid);
      if (mel) {
        mel.classList.remove('multi-selected');
        mel.classList.remove('selected');
      }
    });
    State.multiSelected = {};
    if (State.selected) {
      var prev = document.getElementById('node_' + State.selected);
      if (prev) {
        prev.classList.remove('selected');
      }
      State.selected = null;
    }
    // Find nodes whose center falls inside the marquee (in canvas coords)
    Object.values(State.nodes).forEach(function(node) {
      var el = document.getElementById('node_' + node.id);
      if (!el) {
        return;
      }
      // Estimate node center in canvas space
      var nw = el.offsetWidth || 180;
      var nh = el.offsetHeight || 100;
      var nx = node.x + nw / 2;
      var ny = node.y + nh / 2;
      if (nx >= selX1 && nx <= selX2 && ny >= selY1 && ny <= selY2) {
        State.multiSelected[node.id] = true;
        el.classList.add('multi-selected');
      }
    });
    if (Object.keys(State.multiSelected).length === 1) {
      // only one node caught, convert to single selection
      var onlyId = Object.keys(State.multiSelected)[0];
      State.multiSelected = {};
      var onlyEl = document.getElementById('node_' + onlyId);
      if (onlyEl) {
        onlyEl.classList.remove('multi-selected');
      }
      self.selectNode(onlyId);
    } else if (Object.keys(State.multiSelected).length > 1) {
      self.renderSidebar();
    }
  },

  // canvas events

  bindCanvas: function() {
    var self = this;
    var wrap = document.getElementById('canvas-wrap');
    var isPanning = false;
    var panStart = null;

    // show edge pill label on hover; write to State.hoveredEdge so renderEdges can restore it
    var edgeSvg = document.getElementById('edge-svg');
    edgeSvg.style.pointerEvents = 'all';
    edgeSvg.addEventListener('mousemove', function(e) {
      var target = e.target;
      var g = target;
      while (g && g !== edgeSvg) {
        if (g.classList && g.classList.contains('edge-pill-group')) {
          break;
        }
        g = g.parentNode;
      }
      var hoveredId = (g && g !== edgeSvg) ? g.getAttribute('data-edge-id') : null;
      if (hoveredId === State.hoveredEdge) {
        return;
      }
      State.hoveredEdge = hoveredId;
      // Update pill visibility in the live DOM (renderEdges will re-apply on next rebuild)
      var allGroups = edgeSvg.querySelectorAll('.edge-pill-group');
      allGroups.forEach(function(pg) {
        var eid = pg.getAttribute('data-edge-id');
        var show = (State.selectedEdge && eid === State.selectedEdge) || eid === hoveredId;
        if (show) {
          pg.classList.add('visible');
        } else {
          pg.classList.remove('visible');
        }
      });
    });
    edgeSvg.addEventListener('mouseleave', function() {
      State.hoveredEdge = null;
      var allGroups = edgeSvg.querySelectorAll('.edge-pill-group');
      allGroups.forEach(function(pg) {
        var eid = pg.getAttribute('data-edge-id');
        if (State.selectedEdge && eid === State.selectedEdge) {
          pg.classList.add('visible');
        } else {
          pg.classList.remove('visible');
        }
      });
    });

    wrap.addEventListener('wheel', function(e) {
      e.preventDefault();
      var delta = e.deltaY;
      // line-mode devices (most mice) report ~3 lines; pixel-mode trackpads report raw pixels
      var normalizedDelta = e.deltaMode === 1 ? delta * 20 : delta;
      var factor = Math.pow(0.999, normalizedDelta);
      var rect = wrap.getBoundingClientRect();
      var mouseX = e.clientX - rect.left;
      var mouseY = e.clientY - rect.top;
      self.zoomAt(factor, mouseX, mouseY);
    }, {passive: false});

    wrap.addEventListener('mousedown', function(e) {
      // Middle mouse or alt+left = pan
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanning = true;
        panStart = {x: e.clientX - State.camera.x, y: e.clientY - State.camera.y};
        wrap.style.cursor = 'grabbing';
        e.preventDefault();
        return;
      }
      // Left click on canvas background
      var onBackground = (e.target === wrap || e.target.classList.contains('grid-bg') || e.target === document.getElementById('edge-svg'));
      if (e.button === 0 && onBackground) {
        // Start marquee selection
        var rect = wrap.getBoundingClientRect();
        var cx = (e.clientX - rect.left - State.camera.x) / State.camera.zoom;
        var cy = (e.clientY - rect.top - State.camera.y) / State.camera.zoom;
        State.marquee = {startX: cx, startY: cy, curX: cx, curY: cy};
        // Clear selection on plain click (not shift)
        if (!e.shiftKey) {
          self.selectNode(null);
          State.selectedEdge = null;
          self.renderEdges();
          self.renderSidebar();
        }
      }
    });

    wrap.addEventListener('mousemove', function(e) {
      if (isPanning && panStart) {
        State.camera.x = e.clientX - panStart.x;
        State.camera.y = e.clientY - panStart.y;
        self.applyCamera();
        self.renderEdges();
        return;
      }
      if (State.connecting) {
        var rect2 = wrap.getBoundingClientRect();
        State.connecting.cx = e.clientX - rect2.left;
        State.connecting.cy = e.clientY - rect2.top;
        self.renderEdges();
      }
      // Update marquee
      if (State.marquee) {
        var rect3 = wrap.getBoundingClientRect();
        State.marquee.curX = (e.clientX - rect3.left - State.camera.x) / State.camera.zoom;
        State.marquee.curY = (e.clientY - rect3.top - State.camera.y) / State.camera.zoom;
        self.renderEdges(); // redraws marquee too
        return;
      }
      // Single-node drag
      if (State.dragging) {
        var node = State.nodes[State.dragging.id];
        if (!node) {
          return;
        }
        var ddx = (e.clientX - State.dragging.startMouseX) / State.camera.zoom;
        var ddy = (e.clientY - State.dragging.startMouseY) / State.camera.zoom;
        node.x = State.dragging.startNodeX + ddx;
        node.y = State.dragging.startNodeY + ddy;
        var el = document.getElementById('node_' + node.id);
        if (el) {
          el.style.left = node.x + 'px';
          el.style.top = node.y + 'px';
        }
        self.renderEdges();
      }
      // Multi-node drag
      if (State.multiDragging) {
        var mdx = (e.clientX - State.multiDragging.startMouseX) / State.camera.zoom;
        var mdy = (e.clientY - State.multiDragging.startMouseY) / State.camera.zoom;
        var starts = State.multiDragging.starts;
        Object.keys(starts).forEach(function(nid) {
          var mn = State.nodes[nid];
          if (!mn) {
            return;
          }
          mn.x = starts[nid].x + mdx;
          mn.y = starts[nid].y + mdy;
          var mel = document.getElementById('node_' + nid);
          if (mel) {
            mel.style.left = mn.x + 'px';
            mel.style.top = mn.y + 'px';
          }
        });
        self.renderEdges();
      }
    });

    wrap.addEventListener('mouseup', function(e) {
      if (isPanning) {
        isPanning = false;
        wrap.style.cursor = 'default';
        panStart = null;
      }
      if (State.marquee) {
        self.applyMarqueeSelection();
        State.marquee = null;
        self.renderEdges();
      }
      if (State.dragging) {
        var el = document.getElementById('node_' + State.dragging.id);
        if (el) {
          el.classList.remove('dragging');
        }
        State.dragging = null;
      }
      if (State.multiDragging) {
        // Remove dragging class from all
        Object.keys(State.multiDragging.starts).forEach(function(nid) {
          var mel = document.getElementById('node_' + nid);
          if (mel) {
            mel.classList.remove('dragging');
          }
        });
        State.multiDragging = null;
      }
      if (State.connecting) {
        State.connecting = null;
        self.renderEdges();
      }
    });

    wrap.addEventListener('contextmenu', function(e) {
      var edgeSvgEl = document.getElementById('edge-svg');
      var isCanvasBackground = (
        e.target === wrap ||
        e.target.classList.contains('grid-bg') ||
        e.target === edgeSvgEl ||
        e.target.tagName === 'svg'
      );
      if (isCanvasBackground) {
        e.preventDefault();
        var rect = wrap.getBoundingClientRect();
        var cx = (e.clientX - rect.left - State.camera.x) / State.camera.zoom;
        var cy = (e.clientY - rect.top - State.camera.y) / State.camera.zoom;
        var items = Object.keys(NODE_DEFS).map(function(t) {
          return {label: 'Add ' + NODE_DEFS[t].label, action: (function(tt, px, py){return function(){self.addNode(tt, {x:px, y:py});}})(t, cx, cy)};
        });
        self.showContextMenu(e, items);
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'TEXTAREA')) {
          return;
        }
        var multiIds = Object.keys(State.multiSelected);
        if (multiIds.length > 0) {
          // Delete all multi-selected nodes
          for (var di = 0; di < multiIds.length; di++) {
            self.deleteNode(multiIds[di]);
          }
          State.multiSelected = {};
        } else if (State.selectedEdge) {
          self.deleteEdge(State.selectedEdge);
        } else if (State.selected) {
          self.deleteNode(State.selected);
        }
      }
      // Escape clears selection
      if (e.key === 'Escape') {
        self.selectNode(null);
        self.renderEdges();
        self.renderSidebar();
      }
    });

    // drag from palette
    wrap.addEventListener('dragover', function(e) {
      e.preventDefault();
    });
    wrap.addEventListener('drop', function(e) {
      e.preventDefault();
      var type = e.dataTransfer.getData('node-type');
      if (type) {
        var rect = wrap.getBoundingClientRect();
        var x = (e.clientX - rect.left - State.camera.x) / State.camera.zoom;
        var y = (e.clientY - rect.top - State.camera.y) / State.camera.zoom;
        self.addNode(type, {x: x, y: y});
      }
    });
  },

  bindNodeEvents: function(el, node) {
    var self = this;

    el.addEventListener('mousedown', function(e) {
      if (e.target.classList.contains('port') || e.target.classList.contains('nh-del')) {
        return;
      }
      if (e.button !== 0) {
        return;
      }
      e.stopPropagation();
      // Cancel any marquee that started
      State.marquee = null;

      if (e.shiftKey) {
        // Shift+click: toggle this node in/out of multi-selection
        self.addToMultiSelection(node.id);
        return;
      }

      var multiIds = Object.keys(State.multiSelected);
      if (multiIds.length > 0 && State.multiSelected[node.id]) {
        // clicked a node already in the multi-selection: start multi-drag
        // record start positions for all selected nodes
        var starts = {};
        for (var si = 0; si < multiIds.length; si++) {
          var sn = State.nodes[multiIds[si]];
          if (sn) {
            starts[multiIds[si]] = {x: sn.x, y: sn.y};
          }
        }
        State.multiDragging = {
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          starts: starts
        };
        // Add dragging class to all
        for (var di = 0; di < multiIds.length; di++) {
          var del = document.getElementById('node_' + multiIds[di]);
          if (del) {
            del.classList.add('dragging');
          }
        }
        return;
      }

      // Normal single-node select + drag
      self.selectNode(node.id);
      if (State.tab !== 'props') {
        self.switchTab('props');
      } else {
        self.renderSidebar();
      }
      State.dragging = {
        id: node.id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startNodeX: node.x,
        startNodeY: node.y
      };
      el.classList.add('dragging');
    });

    el.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.showContextMenu(e, [
        {label:'Edit properties', action: function(){self.selectNode(node.id);self.switchTab('props');}},
        {label:'Delete node', danger: true, action: function(){self.deleteNode(node.id);}}
      ]);
    });

    // port events
    var ports = el.querySelectorAll('.port');
    ports.forEach(function(portEl) {
      portEl.addEventListener('mousedown', function(e) {
        e.stopPropagation();
        var dir = portEl.dataset.dir;
        var wrap = document.getElementById('canvas-wrap');
        var wrapRect = wrap.getBoundingClientRect();
        var pRect = portEl.getBoundingClientRect();
        var x = pRect.left + pRect.width / 2 - wrapRect.left;
        var y = pRect.top + pRect.height / 2 - wrapRect.top;

        if (dir === 'out') {
          State.connecting = {
            from_node: portEl.dataset.node,
            from_port: portEl.dataset.port,
            x1: x, y1: y, cx: x, cy: y
          };
        }
        e.preventDefault();
      });

      portEl.addEventListener('mouseup', function(e) {
        if (State.connecting && portEl.dataset.dir === 'in') {
          var fromN = State.connecting.from_node;
          var fromP = State.connecting.from_port;
          var toN = portEl.dataset.node;
          var toP = portEl.dataset.port;
          if (fromN !== toN) {
            // Validate before connecting
            var validationError = self.validateConnection(fromN, toN, toP);
            if (validationError) {
              self.showConnectionError(toN, validationError);
            } else {
              self.addEdge(fromN, fromP, toN, toP);
            }
          }
          State.connecting = null;
          self.renderEdges();
        }
        e.stopPropagation();
      });
    });
  },

  bindSidebarEvents: function() {
    var items = document.querySelectorAll('.palette-item[draggable]');
    items.forEach(function(item) {
      item.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('node-type', item.dataset.type);
      });
    });
  },

  // camera

  zoom: function(factor) {
    // Zoom from center of viewport (used by +/- buttons)
    var wrap = document.getElementById('canvas-wrap');
    var cx = wrap.clientWidth / 2;
    var cy = wrap.clientHeight / 2;
    this.zoomAt(factor, cx, cy);
  },

  zoomAt: function(factor, screenX, screenY) {
    // Zoom so the canvas point under (screenX, screenY) stays fixed
    var oldZoom = State.camera.zoom;
    var newZoom = Math.max(0.2, Math.min(3, oldZoom * factor));
    // World-space point under the cursor
    var worldX = (screenX - State.camera.x) / oldZoom;
    var worldY = (screenY - State.camera.y) / oldZoom;
    // Adjust camera so worldX/Y maps back to screenX/Y at the new zoom
    State.camera.zoom = newZoom;
    State.camera.x = screenX - worldX * newZoom;
    State.camera.y = screenY - worldY * newZoom;
    this.applyCamera();
    this.renderEdges();
    document.getElementById('zoom-label').textContent = Math.round(newZoom * 100) + '%';
  },

  applyCamera: function() {
    var canvas = document.getElementById('canvas');
    canvas.style.transform = 'translate(' + State.camera.x + 'px,' + State.camera.y + 'px) scale(' + State.camera.zoom + ')';
    canvas.style.transformOrigin = '0 0';
  },

  getAddPos: function() {
    var wrap = document.getElementById('canvas-wrap');
    var rect = wrap.getBoundingClientRect();
    var cx = rect.width / 2;
    var cy = rect.height / 2;
    var x = (cx - State.camera.x) / State.camera.zoom + (Math.random() * 60 - 30);
    var y = (cy - State.camera.y) / State.camera.zoom + (Math.random() * 60 - 30);
    return {x: x, y: y};
  },

  resetView: function() {
    if (Object.keys(State.nodes).length === 0) {
      State.camera = {x: 0, y: 0, zoom: 1};
      this.applyCamera();
      return;
    }
    var xs = [];
    var ys = [];
    Object.values(State.nodes).forEach(function(n) {
      xs.push(n.x);
      ys.push(n.y);
    });
    var minX = Math.min.apply(null, xs) - 80;
    var minY = Math.min.apply(null, ys) - 80;
    var maxX = Math.max.apply(null, xs) + 240;
    var maxY = Math.max.apply(null, ys) + 200;
    var wrap = document.getElementById('canvas-wrap');
    var ww = wrap.clientWidth;
    var wh = wrap.clientHeight;
    var scaleX = ww / (maxX - minX);
    var scaleY = wh / (maxY - minY);
    var zoom = Math.min(scaleX, scaleY, 1.5);
    zoom = Math.max(0.2, zoom);
    State.camera.zoom = zoom;
    State.camera.x = (ww - (maxX + minX) * zoom) / 2;
    State.camera.y = (wh - (maxY + minY) * zoom) / 2;
    this.applyCamera();
    this.renderEdges();
    document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
  },

  // context menu

  showContextMenu: function(e, items) {
    var menu = document.getElementById('context-menu');
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.sep) {
        html += '<div class="cm-sep"></div>';
      } else {
        html += '<div class="cm-item'+(item.danger?' danger':'')+'" data-idx="'+i+'">'+item.label+'</div>';
      }
    }
    menu.innerHTML = html;
    menu.style.display = 'block';
    // keep menu inside viewport
    var menuW = 180;
    var menuH = items.length * 32;
    var left = e.clientX;
    var top = e.clientY;
    if (left + menuW > window.innerWidth) {
      left = window.innerWidth - menuW - 8;
    }
    if (top + menuH > window.innerHeight) {
      top = window.innerHeight - menuH - 8;
    }
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';

    var actions = items;
    // use mousedown on items: fires before the document mousedown close handler
    menu.querySelectorAll('.cm-item').forEach(function(itemEl) {
      itemEl.addEventListener('mousedown', function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        var idx = +itemEl.dataset.idx;
        menu.style.display = 'none';
        if (actions[idx] && actions[idx].action) {
          actions[idx].action();
        }
      });
    });

    var closeMenu = function(ev) {
      // Don't close if clicking inside the menu
      if (menu.contains(ev.target)) {
        return;
      }
      menu.style.display = 'none';
      document.removeEventListener('mousedown', closeMenu);
    };
    setTimeout(function() {
      document.addEventListener('mousedown', closeMenu);
    }, 0);
  },

  // render loop

  scheduleRender: function() {
    var self = this;
    setInterval(function() {
      self.renderEdges();
    }, 100);
  },

  // research goal

  setResearchGoal: function(key) {
    State.researchGoal = key || null;
    this.renderSidebar();
  },

  setResearchTargetHours: function(val) {
    var n = parseFloat(val);
    State.researchTargetHours = (isNaN(n) || n <= 0) ? 2 : n;
    this.renderSidebar();
  },

  buildResearchChains: function() {
    var deficits = State.researchDeficits;
    if (!deficits || deficits.length === 0) { return; }
    var self = this;
    for (var i = 0; i < deficits.length; i++) {
      var d = deficits[i];
      var tree = buildChainTree(d.item, d.rate, BuildState.assemblerTier || 'mk2', BuildState.sorterTier || 'mk1');
      self.placeChainTree(tree, BuildState.beltTier || 'mk1');
    }
    self.recalcAll();
    var cnt = deficits.length;
    self.renderSidebar();
    self.showToast('Added ' + cnt + ' matrix chain' + (cnt !== 1 ? 's' : '') + '!');
  },

  setDysonCalc: function(key, rawVal) {
    var n = parseFloat(rawVal);
    if (!isNaN(n) && n >= 0) { State[key] = n; }
    this.renderSidebar();
  },

  // save / load

  saveToFile: function() {
    var data = {nodes: State.nodes, edges: State.edges, nextId: State.nextId, planets: State.planets};
    var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dsp-factory.json';
    a.click();
  },

  buildExportText: function() {
    var lines = [];
    var padL = function(s, n) { s = String(s); while (s.length < n) { s = ' ' + s; } return s; };
    lines.push('=== DSP Factory Plan ===');
    lines.push('');

    var itemFlows = {};
    var totalPower = 0;
    var totalConsumption = 0;
    var machineGroups = {};

    Object.values(State.nodes).forEach(function(node) {
      var c = node.computed;
      var def = NODE_DEFS[node.type];
      var typeLabel = def.label;
      if (node.type === 'assembler' && node.props.tier) {
        var tMap = {mk1:'Mk.I', mk2:'Mk.II', mk3:'Mk.III'};
        typeLabel += ' ' + (tMap[node.props.tier] || '');
      }
      var cnt = (node.type === 'mining') ? 1 : (node.props.count || 1);
      if (!machineGroups[typeLabel]) { machineGroups[typeLabel] = 0; }
      machineGroups[typeLabel] += cnt;

      if (!c) { return; }
      if (c.item_out === 'power') { totalPower += c.output_per_min || 0; }
      totalConsumption += c.power_draw_mw || 0;

      var t = node.type;
      if (t === 'belt' || t === 'storage_depot' || t === 'storage_tank') { return; }
      var outItem = c.item_out || c.item;
      if (outItem && outItem !== 'power' && c.output_per_min > 0) {
        if (!itemFlows[outItem]) { itemFlows[outItem] = {prod:0, cons:0}; }
        itemFlows[outItem].prod += c.output_per_min;
      }
      if (c.input_details && c.input_details.length) {
        for (var fi = 0; fi < c.input_details.length; fi++) {
          var inItem = c.input_details[fi].item;
          var inEff = c.input_details[fi].effective || 0;
          if (inItem && inItem !== 'power' && inEff > 0) {
            if (!itemFlows[inItem]) { itemFlows[inItem] = {prod:0, cons:0}; }
            itemFlows[inItem].cons += inEff;
          }
        }
      } else if (c.item_in && c.item_in !== 'power' && c.effective_input > 0) {
        if (!itemFlows[c.item_in]) { itemFlows[c.item_in] = {prod:0, cons:0}; }
        itemFlows[c.item_in].cons += c.effective_input;
      }
    });

    var outputItems = [];
    var inputItems = [];
    var flowKeys = Object.keys(itemFlows);
    for (var i = 0; i < flowKeys.length; i++) {
      var fk = flowKeys[i];
      var fp = itemFlows[fk];
      var net = fp.prod - fp.cons;
      if (fp.prod > 0.05 && fp.cons < 0.05) {
        outputItems.push({name: itemName(fk), rate: fp.prod});
      } else if (net > 0.05) {
        outputItems.push({name: itemName(fk), rate: net});
      }
      if (fp.prod < 0.05 && fp.cons > 0.05) {
        inputItems.push({name: itemName(fk), rate: fp.cons});
      }
    }
    outputItems.sort(function(a, b) { return b.rate - a.rate; });
    inputItems.sort(function(a, b) { return b.rate - a.rate; });

    if (outputItems.length > 0) {
      lines.push('OUTPUTS');
      for (var oi = 0; oi < outputItems.length; oi++) {
        var o = outputItems[oi];
        lines.push('  ' + padL(fmtRate(o.rate) + '/min', 12) + '  ' + o.name);
      }
      lines.push('');
    }

    if (inputItems.length > 0) {
      lines.push('RAW INPUTS');
      for (var ii = 0; ii < inputItems.length; ii++) {
        var inp = inputItems[ii];
        lines.push('  ' + padL(fmtRate(inp.rate) + '/min', 12) + '  ' + inp.name);
      }
      lines.push('');
    }

    var mgKeys = Object.keys(machineGroups);
    if (mgKeys.length > 0) {
      lines.push('MACHINES');
      mgKeys.sort();
      for (var mi = 0; mi < mgKeys.length; mi++) {
        lines.push('  ' + machineGroups[mgKeys[mi]] + 'x  ' + mgKeys[mi]);
      }
      lines.push('');
    }

    lines.push('POWER');
    lines.push('  Generation:   ' + fmtNum(totalPower, 2) + ' MW');
    lines.push('  Consumption:  ' + fmtNum(totalConsumption, 2) + ' MW');
    var pwrBal = totalPower - totalConsumption;
    lines.push('  Balance:      ' + (pwrBal >= 0 ? '+' : '') + fmtNum(pwrBal, 2) + ' MW');

    return lines.join('\n');
  },

  exportFactory: function(action) {
    var text = this.buildExportText();
    if (action === 'copy') {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        var self = this;
        navigator.clipboard.writeText(text).then(function() {
          self.showToast('Copied to clipboard!');
        }, function() {
          self.downloadTextFile(text);
        });
      } else {
        this.downloadTextFile(text);
      }
    } else {
      this.downloadTextFile(text);
    }
  },

  downloadTextFile: function(text) {
    var blob = new Blob([text], {type: 'text/plain'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dsp-factory-plan.txt';
    a.click();
  },

  showToast: function(msg) {
    var toast = document.createElement('div');
    toast.textContent = msg;
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) { toast.parentNode.removeChild(toast); } }, 2000);
  },

  shareURL: function() {
    var data = {nodes: State.nodes, edges: State.edges, nextId: State.nextId, planets: State.planets};
    var json = JSON.stringify(data);
    var b64 = btoa(unescape(encodeURIComponent(json)));
    var url = location.href.split('?')[0] + '?plan=' + encodeURIComponent(b64);
    var self = this;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function() {
        self.showToast('Share link copied!');
      }, function() {
        prompt('Copy this share link:', url);
      });
    } else {
      prompt('Copy this share link:', url);
    }
  },

  loadFromURL: function() {
    var search = location.search;
    if (!search || search.indexOf('plan=') === -1) { return false; }
    var raw = '';
    var pairs = search.substring(1).split('&');
    for (var i = 0; i < pairs.length; i++) {
      if (pairs[i].indexOf('plan=') === 0) {
        raw = pairs[i].substring(5);
        break;
      }
    }
    if (!raw) { return false; }
    try {
      var b64 = decodeURIComponent(raw);
      var json = decodeURIComponent(escape(atob(b64)));
      var data = JSON.parse(json);
      var self = this;
      self.clearAll(true);
      State.nodes = data.nodes || {};
      State.edges = data.edges || [];
      State.nextId = data.nextId || 100;
      State.planets = data.planets || [];
      State.currentPlanet = 'all';
      Object.values(State.nodes).forEach(function(node) {
        self.renderNode(node);
      });
      self.recalcAll();
      self.renderEdges();
      self.renderSidebar();
      self.renderPlanetBar();
      self.applyPlanetFilter();
      self.resetView();
      if (history.replaceState) {
        history.replaceState(null, '', location.href.split('?')[0]);
      }
      self.showToast('Shared plan loaded!');
      return true;
    } catch (err) {
      console.warn('Failed to load shared plan:', err);
      return false;
    }
  },

  loadFromFile: function() {
    document.getElementById('file-input').click();
  },

  loadExample: function(idx) {
    var ex = EXAMPLE_FACTORIES[idx];
    if (!ex) { return; }
    if (!confirm('Load "' + ex.name + '"? This will clear the current canvas.')) { return; }
    var self = this;
    this.clearAll(true);
    State.nodes = JSON.parse(JSON.stringify(ex.nodes));
    State.edges = JSON.parse(JSON.stringify(ex.edges));
    State.nextId = ex.nextId || 100;
    State.planets = (ex.planets || []).slice();
    State.currentPlanet = 'all';
    Object.values(State.nodes).forEach(function(node) { self.renderNode(node); });
    this.recalcAll();
    this.renderEdges();
    this.renderSidebar();
    this.renderPlanetBar();
    this.applyPlanetFilter();
    this.resetView();
  },

  onFileLoad: function(e) {
    var self = this;
    var file = e.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        self.clearAll(true);
        State.nodes = data.nodes || {};
        State.edges = data.edges || [];
        State.nextId = data.nextId || 100;
        State.planets = data.planets || [];
        State.currentPlanet = 'all';
        Object.values(State.nodes).forEach(function(node) {
          self.renderNode(node);
        });
        self.recalcAll();
        self.renderEdges();
        self.renderSidebar();
        self.renderPlanetBar();
        self.applyPlanetFilter();
        self.resetView();
      } catch (err) {
        alert('Failed to load file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  },

  renderPlanetBar: function() {
    var bar = document.getElementById('planet-bar');
    if (!bar) { return; }
    bar.style.display = 'flex';
    var cur = State.currentPlanet;
    var allNodes = Object.values(State.nodes);
    var html = '<span class="planet-bar-label">Planets:</span>';
    if (State.planetNaming) {
      var ph = State.planetNaming === 'first' ? 'Name this planet...' : 'New planet name...';
      html += '<input id="planet-name-input" type="text" class="planet-name-input" placeholder="'+escHtml(ph)+'" onkeydown="if(event.key===\'Enter\')App.confirmAddPlanet();else if(event.key===\'Escape\')App.cancelAddPlanet()">';
      html += '<button class="btn planet-add-btn" onclick="App.confirmAddPlanet()">OK</button>';
      html += '<button class="btn planet-add-btn" onclick="App.cancelAddPlanet()">Cancel</button>';
      bar.innerHTML = html;
      var inp = document.getElementById('planet-name-input');
      if (inp) { inp.focus(); }
      return;
    }
    if (State.planets.length > 0) {
      var allCount = allNodes.length;
      html += '<span class="planet-chip'+(cur==='all'?' active':'')+'" onclick="App.setPlanet(\'all\')">All <span class="planet-count">('+allCount+')</span></span>';
      for (var i = 0; i < State.planets.length; i++) {
        var name = State.planets[i];
        var nodeCount = allNodes.filter(function(n) { return n.props.planet === name; }).length;
        html += '<span class="planet-chip'+(cur===name?' active':'')+'" onclick="App.setPlanetByIndex('+i+')">';
        html += escHtml(name) + ' <span class="planet-count">('+nodeCount+')</span>';
        html += ' <span class="planet-del" onclick="event.stopPropagation();App.deletePlanetByIndex('+i+')">&times;</span>';
        html += '</span>';
      }
    }
    html += '<button class="btn planet-add-btn" onclick="App.addPlanet()">+ Planet</button>';
    bar.innerHTML = html;
  },

  addPlanet: function() {
    State.planetNaming = (State.planets.length === 0) ? 'first' : 'new';
    this.renderPlanetBar();
  },

  confirmAddPlanet: function() {
    var inp = document.getElementById('planet-name-input');
    if (!inp) { return; }
    var name = inp.value.trim();
    if (!name) { this.cancelAddPlanet(); return; }
    if (State.planetNaming === 'first') {
      Object.values(State.nodes).forEach(function(n) {
        if (!n.props.planet) { n.props.planet = name; }
      });
      State.planets.push(name);
      State.currentPlanet = name;
      State.planetNaming = 'new';
      this.renderPlanetBar();
      this.applyPlanetFilter();
      return;
    }
    if (State.planets.indexOf(name) !== -1) {
      inp.style.borderColor = 'var(--bad)';
      inp.title = 'A planet named "' + name + '" already exists.';
      inp.focus();
      return;
    }
    State.planets.push(name);
    State.planetNaming = null;
    this.renderPlanetBar();
    this.setPlanet(name);
  },

  cancelAddPlanet: function() {
    State.planetNaming = null;
    this.renderPlanetBar();
  },

  setPlanetByIndex: function(idx) {
    var name = State.planets[idx];
    if (name !== undefined) { this.setPlanet(name); }
  },

  deletePlanetByIndex: function(idx) {
    var name = State.planets[idx];
    if (name === undefined) { return; }
    if (!confirm('Remove planet "' + name + '"? Nodes assigned to it become unassigned.')) { return; }
    Object.values(State.nodes).forEach(function(n) {
      if (n.props.planet === name) { n.props.planet = ''; }
    });
    State.planets.splice(idx, 1);
    if (State.currentPlanet === name) { State.currentPlanet = 'all'; }
    this.renderPlanetBar();
    this.applyPlanetFilter();
    this.renderSidebar();
  },

  setPlanet: function(name) {
    State.currentPlanet = name;
    this.renderPlanetBar();
    this.applyPlanetFilter();
    this.renderSidebar();
  },

  applyPlanetFilter: function() {
    var cur = State.currentPlanet;
    Object.values(State.nodes).forEach(function(n) {
      var el = document.getElementById('node_' + n.id);
      if (!el) { return; }
      var onCur = (cur === 'all' || !n.props.planet || n.props.planet === cur);
      el.style.display = onCur ? '' : 'none';
      el.style.opacity = '';
      el.style.pointerEvents = '';
    });
  },

  clearAll: function(silent) {
    if (!silent && !confirm('Clear all nodes and connections?')) {
      return;
    }
    Object.keys(State.nodes).forEach(function(id) {
      var el = document.getElementById('node_' + id);
      if (el) {
        el.remove();
      }
    });
    State.nodes = {};
    State.edges = [];
    State.selected = null;
    State.selectedEdge = null;
    State.multiSelected = {};
    State.planets = [];
    State.currentPlanet = 'all';
    State.planetNaming = null;
    this.renderPlanetBar();
    this.renderEdges();
    this.renderSidebar();
  },

  importBlueprint: function() {
    var modal = document.getElementById('blueprint-modal');
    document.getElementById('blueprint-textarea').value = '';
    document.getElementById('blueprint-error').style.display = 'none';
    modal.style.display = 'flex';
    document.getElementById('blueprint-textarea').focus();
  },

  closeBlueprintModal: function() {
    document.getElementById('blueprint-modal').style.display = 'none';
  },

  submitBlueprint: function(str) {
    var self = this;
    var errorEl = document.getElementById('blueprint-error');
    errorEl.style.display = 'none';
    str = (str || '').trim();
    if (!str) {
      errorEl.textContent = 'Please paste a blueprint string.';
      errorEl.style.display = 'block';
      return;
    }
    parseBlueprintString(str).then(function(buildings) {
      self.closeBlueprintModal();
      self.applyBlueprintData(buildings);
    }, function(err) {
      errorEl.textContent = 'Error: ' + err.message;
      errorEl.style.display = 'block';
    });
  },

  applyBlueprintData: function(buildings) {
    var self = this;

    // Aggregate buildings into groups by (nodeType, recipeKey, assemblerTier)
    var groups = {};
    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i];
      var nodeType = DSP_ITEM_TO_NODE[b.itemId];
      if (!nodeType || nodeType === 'belt') { continue; }

      var recipeKey = (b.recipeId > 0) ? (DSP_RECIPE_TO_KEY[b.recipeId] || null) : null;
      var tier = DSP_ASSEMBLER_TIER[b.itemId] || null;
      var groupKey = nodeType + '|' + (recipeKey || '') + '|' + (tier || '');

      if (!groups[groupKey]) {
        groups[groupKey] = {nodeType: nodeType, recipeKey: recipeKey, tier: tier, count: 0, sumX: 0, sumY: 0};
      }
      groups[groupKey].count++;
      groups[groupKey].sumX += (b.localOffX || 0);
      groups[groupKey].sumY += (b.localOffZ || 0);
    }

    var keys = Object.keys(groups);
    if (keys.length === 0) {
      self.showToast('No supported production buildings found in blueprint.');
      return;
    }

    // Compute per-group centroid positions
    var centroids = [];
    for (var gi = 0; gi < keys.length; gi++) {
      var g = groups[keys[gi]];
      centroids.push({x: g.sumX / g.count, y: g.sumY / g.count, group: g});
    }

    // Find bounding box of DSP centroids
    var minX = centroids[0].x, maxX = centroids[0].x;
    var minY = centroids[0].y, maxY = centroids[0].y;
    for (var ci = 1; ci < centroids.length; ci++) {
      if (centroids[ci].x < minX) { minX = centroids[ci].x; }
      if (centroids[ci].x > maxX) { maxX = centroids[ci].x; }
      if (centroids[ci].y < minY) { minY = centroids[ci].y; }
      if (centroids[ci].y > maxY) { maxY = centroids[ci].y; }
    }

    // Scale DSP coords to canvas coords
    var dsRange = Math.max(maxX - minX, maxY - minY, 1);
    var targetSpread = Math.min(keys.length * 180, 1400);
    var scale = targetSpread / dsRange;
    scale = Math.max(120, Math.min(scale, 500));
    var midX = (minX + maxX) / 2;
    var midY = (minY + maxY) / 2;
    var originX = 300;
    var originY = 300;

    for (var qi = 0; qi < centroids.length; qi++) {
      var c = centroids[qi];
      var nx = originX + (c.x - midX) * scale;
      var ny = originY + (c.y - midY) * scale;
      var grp = c.group;
      var propsOverride = {};

      if (grp.nodeType === 'mining') {
        var miners = [];
        for (var mi = 0; mi < grp.count; mi++) { miners.push({veins: 1}); }
        propsOverride.miners = miners;

      } else if (grp.nodeType === 'assembler') {
        propsOverride.count = grp.count;
        if (grp.tier) { propsOverride.tier = grp.tier; }
        if (grp.recipeKey && RECIPES[grp.recipeKey] && RECIPES[grp.recipeKey].machine === 'assembler') {
          propsOverride.recipe = grp.recipeKey;
        }

      } else if (grp.nodeType === 'chemical_plant') {
        propsOverride.count = grp.count;
        if (grp.recipeKey) {
          var cRec = RECIPES[grp.recipeKey];
          if (cRec && cRec.machine === 'chemical_plant') {
            propsOverride.item_in      = cRec.inputs[0].item;
            propsOverride.item_out     = cRec.outputs[0].item;
            propsOverride.recipe_time  = cRec.time;
            propsOverride.input_qty    = cRec.inputs[0].qty;
            propsOverride.output_qty   = cRec.outputs[0].qty;
          }
        }

      } else {
        propsOverride.count = grp.count;
        // For recipe-driven machines validate that the recipe machine type matches
        if (grp.recipeKey) {
          var rec = RECIPES[grp.recipeKey];
          if (rec && rec.machine === grp.nodeType) {
            propsOverride.recipe = grp.recipeKey;
          }
        }
      }

      self.addNodeRaw(grp.nodeType, {x: nx, y: ny}, propsOverride);
    }

    self.recalcAll();
    self.renderEdges();
    self.renderSidebar();
    self.resetView();
    self.showToast('Imported ' + keys.length + ' node group' + (keys.length !== 1 ? 's' : '') + ' from blueprint (' + buildings.length + ' buildings)');
  }
};

// chain builder helpers

function findRecipeByOutput(itemKey) {
  if (PREFERRED_RECIPES[itemKey] && RECIPES[PREFERRED_RECIPES[itemKey]]) {
    return {key: PREFERRED_RECIPES[itemKey], recipe: RECIPES[PREFERRED_RECIPES[itemKey]]};
  }
  var keys = Object.keys(RECIPES);
  for (var i = 0; i < keys.length; i++) {
    if (RECIPES[keys[i]].outputs[0].item === itemKey) {
      return {key: keys[i], recipe: RECIPES[keys[i]]};
    }
  }
  return null;
}

function countLeaves(node) {
  if (!node.inputs || !node.inputs.length) { return 1; }
  var s = 0;
  for (var i = 0; i < node.inputs.length; i++) { s += countLeaves(node.inputs[i]); }
  return s;
}

function getDepth(node) {
  if (!node.inputs || !node.inputs.length) { return 0; }
  var d = 0;
  for (var i = 0; i < node.inputs.length; i++) {
    var x = getDepth(node.inputs[i]);
    if (x > d) { d = x; }
  }
  return 1 + d;
}

function buildChainTree(itemKey, targetRate, assemblerTier, sorterTier) {
  // water goes to a water_pump (50/min per pump at VU0)
  if (itemKey === 'water') {
    var count = Math.ceil(targetRate / 50);
    return {nodeType:'water_pump', props:{count:count, vu_level:0},
            inputs:[], actualOutput:count*50, item:'water', chemExtraInputs:null};
  }
  // crude oil goes to an oil_extractor (40/min per extractor at VU0)
  if (itemKey === 'crude_oil') {
    var count = Math.ceil(targetRate / 40);
    return {nodeType:'oil_extractor', props:{count:count, rate_per_extractor:40, vu_level:0},
            inputs:[], actualOutput:count*40, item:'crude_oil', chemExtraInputs:null};
  }
  // raw resources go to a mining node (30/min per vein at VU0)
  if (CHAIN_RAW_RESOURCES[itemKey]) {
    var veins = Math.ceil(targetRate / 30);
    return {nodeType:'mining', props:{resource:itemKey, miners:[{veins:veins}], vu_level:0},
            inputs:[], actualOutput:veins*30, item:itemKey, chemExtraInputs:null};
  }
  // Recipe lookup
  var found = findRecipeByOutput(itemKey);
  if (!found) {
    var unknownVeins = Math.ceil(targetRate / 30);
    return {nodeType:'mining', props:{resource:itemKey, miners:[{veins:unknownVeins}], vu_level:0},
            inputs:[], actualOutput:unknownVeins*30, item:itemKey, chemExtraInputs:null};
  }

  var rec = found.recipe;
  var tiers = {mk1:0.75, mk2:1.0, mk3:1.5};
  var speedMult = (rec.machine === 'assembler') ? (tiers[assemblerTier] || 1.0) : 1.0;
  var primaryOut = rec.outputs[0];
  var ratePerMachine = (primaryOut.qty / rec.time) * 60 * speedMult;
  var machinesNeeded = Math.ceil(targetRate / ratePerMachine);
  var actualOutput = machinesNeeded * ratePerMachine;

  var props = {
    count: machinesNeeded,
    recipe: found.key,
    input_sorter_tier: sorterTier, input_sorter_reach: 1,
    output_sorter_tier: sorterTier, output_sorter_reach: 1
  };
  if (rec.machine === 'assembler') { props.tier = assemblerTier; }

  var inputNodes = [];
  var chemExtraInputs = null;

  if (rec.machine === 'chemical_plant') {
    // chemical_plant has one input port 'in'; only wire the first ingredient
    props.recipe = 'custom';
    props.item_in = rec.inputs[0].item;
    props.item_out = primaryOut.item;
    props.recipe_time = rec.time;
    props.input_qty = rec.inputs[0].qty;
    props.output_qty = primaryOut.qty;
    var ratio0 = rec.inputs[0].qty / primaryOut.qty;
    inputNodes.push(buildChainTree(rec.inputs[0].item, ratio0 * actualOutput, assemblerTier, sorterTier));
    if (rec.inputs.length > 1) {
      chemExtraInputs = [];
      for (var ei = 1; ei < rec.inputs.length; ei++) {
        chemExtraInputs.push(itemName(rec.inputs[ei].item));
      }
    }
  } else {
    for (var i = 0; i < rec.inputs.length; i++) {
      var ratio = rec.inputs[i].qty / primaryOut.qty;
      inputNodes.push(buildChainTree(rec.inputs[i].item, ratio * actualOutput, assemblerTier, sorterTier));
    }
  }

  return {
    nodeType: rec.machine,
    recipeKey: found.key,
    props: props,
    inputs: inputNodes,
    actualOutput: actualOutput,
    item: itemKey,
    chemExtraInputs: chemExtraInputs
  };
}

export default App;
