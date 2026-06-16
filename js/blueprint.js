// Blueprint import: parse DSP blueprint strings into a list of building objects
// ES5-style: var, no arrow functions, no template literals

var DSP_ITEM_TO_NODE = {
  2001: 'belt', 2002: 'belt', 2003: 'belt',
  2101: 'storage_depot', 2102: 'storage_depot',
  2103: 'pls_station', 2104: 'ils_station',
  2106: 'storage_tank',
  2203: 'wind_turbine', 2204: 'thermal_plant', 2205: 'solar_panel',
  2208: 'ray_receiver', 2210: 'artificial_star', 2211: 'mini_fusion',
  2213: 'geothermal',
  2301: 'mining', 2316: 'mining',
  2302: 'arc_smelter', 2315: 'arc_smelter', 2319: 'arc_smelter',
  2303: 'assembler', 2304: 'assembler', 2305: 'assembler', 2318: 'assembler',
  2306: 'water_pump', 2307: 'oil_extractor',
  2308: 'oil_refinery',
  2309: 'chemical_plant', 2317: 'chemical_plant',
  2310: 'particle_collider',
  2314: 'fractionator',
  2901: 'matrix_lab', 2902: 'matrix_lab'
};

// Maps DSP item IDs for assemblers to the assembler tier prop value
var DSP_ASSEMBLER_TIER = {
  2303: 'mk1',
  2304: 'mk2',
  2305: 'mk3',
  2318: 'mk3'
};

var DSP_RECIPE_TO_KEY = {
  1:   'iron_ingot',
  2:   'magnet',
  3:   'copper_ingot',
  4:   'stone_brick',
  5:   'gear',
  6:   'magnetic_coil',
  9:   'em_matrix',
  11:  'prism',
  12:  'plasma_exciter',
  16:  'plasma_refining',
  17:  'energetic_graphite',
  18:  'energy_matrix',
  19:  'hydrogen_fuel_rod',
  20:  'thruster',
  21:  'reinforced_thruster',
  23:  'plastic',
  24:  'sulfuric_acid',
  25:  'organic_crystal',
  26:  'titanium_crystal',
  27:  'structure_matrix',
  28:  'casimir_crystal',
  30:  'titanium_glass',
  31:  'graphene',
  33:  'carbon_nanotube',
  36:  'particle_broadband',
  37:  'crystal_silicon',
  38:  'plane_filter',
  40:  'deuterium',
  41:  'deuteron_fuel_rod',
  42:  'annihilation_sphere',
  44:  'antimatter_fuel_rod',
  50:  'circuit_board',
  51:  'processor',
  52:  'quantum_chip',
  53:  'microcrystalline',
  55:  'information_matrix',
  57:  'glass',
  59:  'high_purity_silicon',
  60:  'diamond',
  63:  'steel',
  65:  'titanium_ingot',
  66:  'titanium_alloy',
  68:  'photon_combiner',
  70:  'solar_sail',
  75:  'universe_matrix',
  78:  'space_warper',
  79:  'space_warper_adv',
  80:  'frame_material',
  81:  'dyson_component',
  83:  'small_carrier_rocket',
  94:  'logistics_drone',
  96:  'logistics_vessel',
  97:  'electric_motor',
  98:  'em_turbine',
  99:  'particle_container',
  101: 'graviton_lens',
  102: 'gravity_matrix',
  103: 'super_mag_ring',
  104: 'strange_matter',
  106: 'proliferator_mk1',
  107: 'proliferator_mk2',
  108: 'proliferator_mk3',
  112: 'foundation',
  115: 'deuterium',
  121: 'reformed_refining',
  133: 'combustible_unit'
};

// Finds the gzip base64 block and strips the trailing 8-char MD5F hash
function extractBase64(str) {
  str = str.replace(/\s+$/, '');
  var tail = str.slice(-8);
  if (/^[0-9A-Fa-f]{8}$/.test(tail)) {
    str = str.slice(0, -8);
  }
  // H4sI is the base64 encoding of the gzip magic bytes \x1f\x8b\x08
  var idx = str.indexOf('H4sI');
  if (idx === -1) {
    throw new Error('Could not find gzip data in blueprint string. Make sure you copied the full blueprint.');
  }
  return str.slice(idx);
}

function parseBinary(buffer) {
  var view = new DataView(buffer);
  var off = 0;

  // Header: version(4) cursorOffX(4) cursorOffY(4) cursorTargetArea(4)
  //         dragBoxSizeX(4) dragBoxSizeY(4) primaryAreaIdx(4) areaCount(1)
  off += 4 + 4 + 4 + 4 + 4 + 4 + 4; // 28 bytes
  var areaCount = view.getInt8(off); off += 1;

  // Each area is 14 bytes
  off += areaCount * 14;

  var buildingCount = view.getInt32(off, true); off += 4;

  var buildings = [];
  for (var i = 0; i < buildingCount; i++) {
    off += 4; // index (int32)
    off += 1; // areaIndex (int8)

    var localOffX = view.getFloat32(off, true); off += 4;
    off += 4; // localOffY (height, skip)
    var localOffZ = view.getFloat32(off, true); off += 4;
    off += 4 + 4 + 4; // localOff2 XYZ
    off += 4 + 4;     // yaw, yaw2

    var itemId   = view.getInt16(off, true); off += 2;
    off += 2; // modelIndex
    off += 4; // outputObjIdx
    off += 4; // inputObjIdx
    off += 1 + 1 + 1 + 1; // outputToSlot, inputFromSlot, outputFromSlot, inputToSlot
    off += 1 + 1; // outputOffset, inputOffset

    var recipeId = view.getInt16(off, true); off += 2;
    off += 2; // filterId
    var paramCount = view.getInt16(off, true); off += 2;
    off += paramCount * 2; // parameters

    buildings.push({
      itemId:    itemId,
      recipeId:  recipeId,
      localOffX: localOffX,
      localOffZ: localOffZ
    });
  }

  return buildings;
}

function parseBlueprintString(str) {
  return new Promise(function(resolve, reject) {
    str = str.trim();
    if (str.indexOf('BLUEPRINT:') !== 0) {
      return reject(new Error('Not a valid DSP blueprint (must start with BLUEPRINT:)'));
    }
    if (typeof DecompressionStream === 'undefined') {
      return reject(new Error('Your browser does not support DecompressionStream. Please use Chrome 80+, Firefox 113+, or Safari 16.4+.'));
    }

    var b64;
    try {
      b64 = extractBase64(str);
    } catch (e) {
      return reject(e);
    }

    var binary;
    try {
      binary = atob(b64);
    } catch (e) {
      return reject(new Error('Failed to decode base64 data: ' + e.message));
    }

    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    var ds = new DecompressionStream('gzip');
    var writer = ds.writable.getWriter();
    var reader = ds.readable.getReader();
    var chunks = [];

    function readAll() {
      return reader.read().then(function(result) {
        if (result.done) { return; }
        chunks.push(result.value);
        return readAll();
      });
    }

    var writePromise = writer.write(bytes).then(function() {
      return writer.close();
    });

    Promise.all([writePromise, readAll()]).then(function() {
      var totalLen = 0;
      for (var ci = 0; ci < chunks.length; ci++) { totalLen += chunks[ci].length; }
      var buf = new Uint8Array(totalLen);
      var pos = 0;
      for (var cj = 0; cj < chunks.length; cj++) {
        buf.set(chunks[cj], pos);
        pos += chunks[cj].length;
      }

      try {
        var buildings = parseBinary(buf.buffer);
        resolve(buildings);
      } catch (e) {
        reject(new Error('Failed to parse binary data: ' + e.message));
      }
    }).catch(function(err) {
      reject(new Error('Decompression failed: ' + (err && err.message ? err.message : String(err))));
    });
  });
}

export { parseBlueprintString, DSP_ITEM_TO_NODE, DSP_ASSEMBLER_TIER, DSP_RECIPE_TO_KEY };
