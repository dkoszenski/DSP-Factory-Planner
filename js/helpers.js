// helper functions
import { ITEMS, RECIPES } from './data.js';

function fmtRate(v) {
  if (v === undefined || v === null) {
    return '—';
  }
  if (v >= 1000) {
    return (Math.round(v / 10) / 100) + 'k';
  }
  return Math.round(v * 10) / 10 + '';
}

function fmtNum(v, dec) {
  if (v === undefined || v === null) {
    return '—';
  }
  return parseFloat(v.toFixed(dec));
}

function rateClass(v) {
  if (!v || v === 0) {
    return 'bad';
  }
  return 'ok';
}

function statRow(label, val, cls) {
  var c = cls || '';
  return '<div class="node-stat"><span class="ns-label">'+label+'</span><span class="ns-val '+c+'">'+val+'</span></div>';
}

function statRow2(label, val) {
  return '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span style="color:var(--text3)">'+escHtml(label)+'</span><span style="font-weight:500">'+escHtml(String(val))+'</span></div>';
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function itemName(key) {
  return (ITEMS[key] && ITEMS[key].name) || key || '—';
}

function itemOptions() {
  return Object.keys(ITEMS).map(function(k) {
    return {v: k, l: ITEMS[k].icon + ' ' + ITEMS[k].name};
  });
}

// if upstreamItems is given, only show recipes that use all of those items as inputs
function recipeOptions(machineType, upstreamItems) {
  var filterItems = [];
  if (upstreamItems) {
    if (Array.isArray(upstreamItems)) {
      filterItems = upstreamItems;
    } else if (typeof upstreamItems === 'string' && upstreamItems !== 'unknown' && upstreamItems !== 'custom') {
      filterItems = [upstreamItems];
    }
  }
  // strip out non-item values
  filterItems = filterItems.filter(function(fi) {
    return fi && fi !== 'unknown' && fi !== 'custom' && fi !== 'power';
  });

  return Object.keys(RECIPES).filter(function(k) {
    var r = RECIPES[k];
    if (machineType && r.machine !== machineType) {
      return false;
    }
    if (filterItems.length === 0) {
      return true;
    }
    // Each filter item must appear in at least one recipe input
    for (var fi = 0; fi < filterItems.length; fi++) {
      var found = false;
      for (var ii = 0; ii < r.inputs.length; ii++) {
        if (r.inputs[ii].item === filterItems[fi]) {
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  }).map(function(k) {
    var r = RECIPES[k];
    // name is used for search, l is the full dropdown string
    return {
      v: k,
      name: r.label,
      l: r.label + ' (' + r.inputs.map(function(i){return i.qty+'x '+itemName(i.item);}).join(' + ') + ' → ' + r.outputs.map(function(o){return o.qty+'x '+itemName(o.item);}).join(', ') + ')'
    };
  });
}

function sorterOptions() {
  return [
    {v:'mk1',l:'Mk.I (1.5 trips/s)'},
    {v:'mk2',l:'Mk.II (3 trips/s)'},
    {v:'mk3',l:'Mk.III (6 trips/s)'}
  ];
}

export { fmtRate, fmtNum, rateClass, statRow, statRow2, escHtml, itemName, itemOptions, recipeOptions, sorterOptions };
