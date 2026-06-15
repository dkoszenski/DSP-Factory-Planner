// ES Module: application state

var State = {
  nodes: {},
  edges: [],
  selected: null,
  selectedEdge: null,
  hoveredEdge: null,     // edge id currently under the mouse cursor (for pill visibility)
  multiSelected: {},     // {id: true} for multi-selection
  marquee: null,         // {startX,startY,curX,curY} canvas-space
  multiDragging: null,   // {startMouseX,startMouseY, starts:{id:{x,y}}}
  tab: 'nodes',
  camera: {x:0,y:0,zoom:1},
  dragging: null,
  connecting: null,
  nextId: 1,
  researchGoal: null,
  researchTargetHours: 2,
  researchDeficits: [],
  nodeBuckets: {},
  dysonLuminosity: 1.0,
  dysonSwarmPct: 0,
  dysonShellPct: 0,
  dysonSailRate: 0,
  dysonOrbitCap: 10000,
  planets: [],
  currentPlanet: 'all'
};

export { State };
