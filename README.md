# DSP Factory Planner

A node-based, visual production chain calculator for **Dyson Sphere Program**. Plan, balance, and debug your entire factory from raw ore to finished product — including every belt, sorter, smelter, assembler, and power plant — all in your browser with no install required.

**Live App: [https://dkoszenski.github.io/DSP-Factory-Planner/](https://dkoszenski.github.io/DSP-Factory-Planner/)**

---

## What is this?

Dyson Sphere Program is a factory-building game where efficient production chains are everything. Keeping track of how many miners feed how many smelters, whether your belt is saturated, which recipe a machine can actually run given what's arriving — all of this is hard to reason about on paper or in a spreadsheet.

This planner gives you a **live, visual graph** of your production chain. Each building in your factory becomes a **node**. Nodes are connected by drawing lines between their output and input ports. Every connection carries a specific item, and the planner calculates in real time:

- How much of each item is produced and consumed per minute at every stage
- Whether any node is being **starved** (not enough input) or **oversupplied**
- Whether any **belt is saturated** and items are backing up
- Whether any **sorter is the bottleneck**, not the belt
- Which **recipe** a machine can run given what's connected to it
- Exact **power output** for thermal plants and fusion plants

All math uses the actual in-game numbers: verified mining rates, sorter trip speeds, belt capacities, recipe times, assembler tier multipliers, and fuel burn rates.

---

## Getting Started

1. Open the app at [https://dkoszenski.github.io/DSP-Factory-Planner/](https://dkoszenski.github.io/DSP-Factory-Planner/)
2. Right-click the canvas to add your first node, or use the Nodes tab in the right sidebar
3. Click an output port (gold dot, right side of a node) and drag to an input port (teal dot, left side) to connect two nodes
4. Select a node to edit its properties in the **Properties tab**
5. Watch the **Analysis tab** for bottlenecks and warnings across your whole chain

No install. No server. No build step. Just open the HTML file in any modern browser.

---

## The Interface

### Canvas

The main workspace where your factory graph lives. Nodes are positioned freely and connected with curved lines.

- Dot grid background for spatial reference
- Curved Bezier connections color-coded by the item they carry and health status
- Midpoint pills on every connection showing item name and flow rate — visible on hover
- Zoom controls in the bottom-left corner (+ / - buttons or scroll wheel, zooms toward cursor)
- Right-click empty canvas to open a context menu with all addable node types

### Right Sidebar

Three tabs:

| Tab | Purpose |
|-----|---------|
| **Nodes** | Palette of all available node types. Click any to add it at the center of the current view. |
| **Properties** | Edit every setting for the selected node — count, recipe, sorter tiers, sorter reach, VU level, fuel type, etc. Shows a live stats panel at the bottom. |
| **Analysis** | Global summary: warnings, bottlenecks, and a per-node breakdown. Click any entry to pan to that node and highlight it. |

### Header Bar

| Button | Action |
|--------|--------|
| Save | Downloads your current factory as a `.json` file |
| Load | Opens a file picker to load a previously saved `.json` |
| Fit view | Automatically zooms and pans to fit all nodes in the viewport |
| Clear all | Removes all nodes and connections (asks for confirmation) |

---

## Node Types

There are **14 node types**, each representing a category of building in Dyson Sphere Program. All nodes start with no recipe or resource selected — a blank slate. This lets the connection system and recipe filtering work together without conflict.

### Mining Node

Represents one or more Mining Machines on a resource patch.

- **Resource** — searchable dropdown to select what is being mined
- **Miners** — add as many miners as you have, each with its own vein count
- **VU Level** — Veins Utilization research level (0–20). Each level adds +10% mining speed per vein.

Output rate = (veins x 30 x (1 + VU_level x 0.1)) summed across all miners.

The count badge in the header shows how many miners are in the node at a glance.

### Water Pump

Represents Water Pump buildings on a water body.

- **Count** — number of pumps
- **VU Level** — affects pump output rate (+10% per level)

Base rate: 50 water/min per pump.

### Oil Extractor

Represents Oil Extractor buildings on a crude oil seep.

- **Count** — number of extractors
- **Rate per extractor** — base extraction rate (varies by seep, visible in-game)
- **VU Level** — resource utilization research multiplier

### Belt

Represents a section of Conveyor Belt.

- **Tier** — Mk.I (360/min), Mk.II (720/min), or Mk.III (1,800/min)

Belts accept **multiple inputs**. Each new connection gets its own input port automatically. The belt sums all incoming flow, caps it at capacity, and shows the dominant item, load percentage, and an overflow warning if inputs exceed capacity. When multiple downstream nodes pull from the same belt, the belt's output is split proportionally based on each consumer's demand.

### Arc Smelter

Represents Arc Smelter, Plane Smelter, or Negentropy Smelter buildings.

- **Count** — number of smelters
- **Recipe** — searchable dropdown for any smelter recipe
- **Input Sorter / Output Sorter** — tier (Mk.I/II/III) and reach (1–3 squares)

One input port is generated per recipe ingredient. Each port validates that the correct item is being connected before allowing the connection.

### Assembler

Represents Assembling Machine buildings (Mk.I, Mk.II, or Mk.III).

- **Count** — number of assemblers
- **Tier** — Mk.I (x0.75 speed), Mk.II (x1.0 speed), Mk.III (x1.5 speed)
- **Recipe** — searchable dropdown for any assembler recipe (91 recipes including all building recipes)
- **Input Sorter / Output Sorter** — tier and reach

Same dynamic port system as the Arc Smelter.

### Chemical Plant

Represents Chemical Plant buildings with a configurable custom recipe.

- **Count** — number of plants
- **Input item / Output item** — searchable dropdowns
- **Recipe time** — seconds per cycle
- **Input qty / Output qty** — items per cycle
- **Input Sorter / Output Sorter** — tier and reach

### Oil Refinery

Represents Oil Refinery buildings.

- **Count** — number of refineries
- **Recipe** — Plasma Refining (single input), X-Ray Cracking (two inputs), or Reformed Refining (three inputs)
- **Input Sorter / Output Sorter** — tier and reach

Multi-input recipes show one port per ingredient and use the bottleneck calculation model.

### Fractionator

Represents Fractionator buildings for Deuterium production.

- **Count** — number of fractionators
- Accepts Hydrogen only
- Produces Deuterium at 1% of hydrogen throughput per pass

### Particle Collider

Represents Miniature Particle Collider buildings.

- **Count** — number of colliders
- **Recipe** — Deuterium (single input), Antimatter (single input), or Strange Matter (three inputs)
- **Input Sorter / Output Sorter** — tier and reach

### Matrix Lab

Represents Matrix Lab buildings in production mode.

- **Count** — number of labs
- **Recipe** — any of the 6 science matrices
- **Input Sorter / Output Sorter** — tier and reach

All matrix recipes are multi-input. Universe Matrix takes 6 simultaneous inputs. One port is shown per ingredient and throughput is limited by the worst-supplied ingredient.

### Thermal Power Plant

Represents Thermal Power Plant buildings.

- **Count** — number of plants
- **Fuel type** — Coal (60/min), Energized Graphite (24/min), Hydrogen (18/min), Refined Oil (~25.7/min), Fire Ice (~33.8/min)
- **Input Sorter** — tier and reach

Output: 2.16 MW per fully-fed plant.

### Mini Fusion Power Plant

Represents Mini Fusion Power Plant buildings.

- **Count** — number of plants
- Accepts only Deuteron Fuel Rods
- Output: 24 MW per fully-fed plant

### Consumer

A generic sink node for anything that consumes items without producing an output.

- **Count** — number of buildings
- **Item** — searchable dropdown for what is consumed
- **Consumption per minute** — per building

---

## Connections

### Drawing a Connection

1. Click and hold on an output port (gold dot, right side of a node)
2. Drag to an input port (teal dot, left side of a node)
3. Release to complete the connection

A dashed line follows the cursor while dragging.

### Connection Validation

Every connection is validated before being allowed. If the item being carried does not match what the destination port expects, the connection is rejected:

- The target node shakes briefly
- A red error message appears above the node for 3 seconds explaining the mismatch

Because all nodes start with no recipe selected, connections are always accepted on a fresh node. The recipe filter then narrows based on what you connect. Once a recipe is selected, subsequent connections to remaining ports are validated against the specific ingredient expected at each slot.

### Hover Labels

Connection lines show a midpoint label (item name and flow rate) when hovered. Selected connections always show their label. All other labels are hidden until hovered.

### Deleting Connections

- Click a connection line to select it, then press Delete or Backspace
- Right-click a connection line and choose Delete connection

---

## Smart Recipe Filtering

When a node has items connected to its inputs, the recipe dropdown automatically filters to only show recipes that use those items.

- Connect an Iron Ingot belt to an assembler — only recipes requiring Iron Ingot are shown
- Connect both Iron Ingot and Copper Ingot belts — only recipes requiring both are shown
- A teal banner shows how many recipes are being filtered and which items are matched
- If no recipes match all connected inputs, the filter clears and all recipes are shown with a warning

The search input inside the recipe dropdown matches on recipe name only, not on the ingredient list shown in the full label.

---

## Throughput Calculations

### Multi-Input Bottleneck Model

Arc Smelters, Assemblers, Oil Refineries, Particle Colliders, and Matrix Labs all use a bottleneck model across every ingredient:

For each recipe input:
- `need_per_min = (qty / recipe_time) x 60 x count x speed_multiplier`
- `effective = min(arriving, sorter_cap, need_per_min)`
- `fill_ratio = effective / need_per_min`

Output scales by the lowest fill ratio across all inputs. The node card shows each ingredient's arriving vs. needed rate so you can see at a glance which input is limiting production.

### Demand-Weighted Belt Splitting

When multiple downstream nodes pull from the same belt, the belt's output is divided proportionally by demand. If two assemblers each need 60/min from a 60/min gear belt, each receives 30/min — not 60/min each. This makes the calculations accurate for real factory layouts where resources are shared.

### Sorter Throughput

| Tier | 1 square | 2 squares | 3 squares |
|------|----------|-----------|-----------|
| Mk.I | 90/min | 45/min | 30/min |
| Mk.II | 180/min | 90/min | 60/min |
| Mk.III | 360/min | 180/min | 120/min |

These caps are applied per ingredient per machine and multiplied by count.

### Belt Capacities

| Tier | Capacity |
|------|---------|
| Mk.I | 360/min |
| Mk.II | 720/min |
| Mk.III | 1,800/min |

### Assembler Speed Multipliers

| Tier | Multiplier |
|------|-----------|
| Mk.I | x0.75 |
| Mk.II | x1.0 |
| Mk.III | x1.5 |

### Mining Rate

`output = veins x 30 x (1 + VU_level x 0.1)` per miner, summed across all miners.

---

## Visual Language

### Node Cards

Each node displays:

- **Header** — node name and a count badge (e.g. x6) showing the building count at a glance. If you rename a node, the original type name appears as a subtitle.
- **Input ports** (teal dots, left side) — one per recipe ingredient for multi-input machines; one per connected source for belts, plus one spare
- **Output port** (gold dot, right side)
- **Stats area** — live per-ingredient supply bars, output rate, and efficiency bar
- **Left border accent** — color-coded to the item the node is outputting

### Connection Lines

- Colored by item carried
- Health-tinted: amber if efficiency 50–89%, red if below 50%
- Glow layer for visual depth
- Thicker and blue when selected

### Midpoint Labels

Shown on hover (or always for the selected connection). Displays item name and current flow rate.

### Efficiency and Load Bars

- Green — healthy (0–80% load, 90–100% efficiency)
- Amber — approaching limit or partially starved
- Red — saturated belt or severely starved node

### Analysis Tab Highlights

Clicking any warning or node entry in the Analysis tab pans the canvas to center that node, selects it, and plays a 2-second amber glow animation so it's easy to locate in a complex layout.

### Selected Node Glow

The currently selected node has a three-layer blue glow: a tight ring, a soft mid bloom, and a wider outer halo.

---

## Controls Reference

### Canvas Navigation

| Action | Control |
|--------|---------|
| Pan | Middle mouse button + drag, or Alt + left-click drag |
| Zoom in/out | Scroll wheel (zooms toward cursor position) |
| Zoom in | Click + button (bottom-left) |
| Zoom out | Click - button (bottom-left) |
| Fit all nodes | Click Fit view (header) |
| Add node | Right-click empty canvas, or click node type in Nodes tab |

### Node Interactions

| Action | Control |
|--------|---------|
| Move node | Left-click drag on node header or body |
| Select node | Left-click node |
| Edit properties | Select node, then Properties tab — or right-click, Edit properties |
| Delete node | Click X on node header, or select + Delete, or right-click, Delete node |
| Rename node | Select node, Properties tab, Name field |

### Multi-Selection

| Action | Control |
|--------|---------|
| Box select | Left-click drag on empty canvas |
| Add to selection | Shift + left-click |
| Move all selected | Left-click drag any node in the selection |
| Delete all selected | Delete or Backspace |
| Clear selection | Click empty canvas or press Escape |

### Connection Controls

| Action | Control |
|--------|---------|
| Draw connection | Left-click drag from output port to input port |
| Select connection | Left-click on the line |
| Delete connection | Select + Delete or Backspace; or right-click, Delete connection |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Delete / Backspace | Delete selected node(s) or connection |
| Escape | Clear all selections |

---

## Recipes Reference

### Arc Smelter (15 recipes)

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Iron Ingot | 1x Iron Ore | 1x Iron Ingot | 1s |
| Copper Ingot | 1x Copper Ore | 1x Copper Ingot | 1s |
| Stone Brick | 1x Stone Ore | 1x Stone Brick | 1s |
| Energized Graphite | 2x Coal | 1x Energized Graphite | 2s |
| Glass | 2x Stone Ore | 1x Glass | 2s |
| Magnet | 1x Iron Ore | 1x Magnet | 1.5s |
| Steel | 3x Iron Ingot | 1x Steel | 3s |
| High-Purity Silicon | 2x Silicon Ore | 1x High-Purity Silicon | 2s |
| Crystal Silicon | 1x High-Purity Silicon | 1x Crystal Silicon | 2s |
| Crystal Silicon (Fractal) | 1x Fractal Silicon | 2x Crystal Silicon | 1.5s |
| Diamond | 1x Energized Graphite | 1x Diamond | 2s |
| Diamond (Kimberlite) | 1x Kimberlite Ore | 2x Diamond | 1.5s |
| Titanium Ingot | 2x Titanium Ore | 1x Titanium Ingot | 2s |
| Titanium Alloy | 4x Ti Ingot + 4x Steel + 8x Sulfuric Acid | 4x Titanium Alloy | 12s |
| Silicon Ore (from Stone) | 10x Stone Ore | 1x Silicon Ore | 10s |

### Assembler (91 recipes)

**Core Components**

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Gear | 1x Iron Ingot | 1x Gear | 1s |
| Magnetic Coil | 2x Magnet + 1x Copper Ingot | 2x Magnetic Coil | 1s |
| Circuit Board | 2x Iron Ingot + 1x Copper Ingot | 2x Circuit Board | 1s |
| Electric Motor | 2x Iron Ingot + 1x Gear + 1x Magnetic Coil | 1x Electric Motor | 2s |
| EM Turbine | 2x Electric Motor + 2x Magnetic Coil | 1x EM Turbine | 2s |
| Super-Magnetic Ring | 2x EM Turbine + 3x Magnet + 1x E. Graphite | 2x Super-Magnetic Ring | 3s |
| Processor | 2x Circuit Board + 2x Microcrystalline | 1x Processor | 3s |
| Quantum Chip | 2x Processor + 2x Plane Filter | 1x Quantum Chip | 6s |

**Advanced Components**

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Casimir Crystal | 1x Ti Crystal + 2x Graphene + 12x Hydrogen | 1x Casimir Crystal | 4s |
| Plane Filter | 1x Casimir Crystal + 2x Titanium Glass | 1x Plane Filter | 12s |
| Graviton Lens | 4x Diamond + 1x Strange Matter | 1x Graviton Lens | 6s |
| Particle Container | 2x EM Turbine + 2x Copper Ingot + 2x Graphene | 1x Particle Container | 4s |
| Annihilation Constraint Sphere | 1x Particle Container + 1x Processor | 1x A.C. Sphere | 20s |

**Dyson Sphere Chain**

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Solar Sail | 1x Graphene + 1x Photon Combiner | 2x Solar Sail | 4s |
| Frame Material | 4x Carbon Nanotube + 1x Ti Alloy + 1x H-P Silicon | 1x Frame Material | 6s |
| Dyson Sphere Component | 3x Frame Material + 3x Solar Sail + 3x Processor | 1x DSP Component | 8s |
| Small Carrier Rocket | 2x DSP Component + 2x Quantum Chip + 2x D. Fuel Rod | 1x Rocket | 6s |

**Fuel Rods**

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Hydrogen Fuel Rod | 1x Ti Ingot + 10x Hydrogen | 2x H. Fuel Rod | 6s |
| Deuteron Fuel Rod | 1x Ti Alloy + 10x Deuterium + 1x Super-Mag Ring | 2x D. Fuel Rod | 12s |
| Antimatter Fuel Rod | 10x Antimatter + 10x Hydrogen + 1x A.C. Sphere + 1x Ti Alloy | 2x AM Fuel Rod | 24s |

**Proliferators**

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Proliferator Mk.I | 1x Coal | 1x Proliferator Mk.I | 0.5s |
| Proliferator Mk.II | 2x Mk.I + 1x Diamond | 1x Proliferator Mk.II | 1s |
| Proliferator Mk.III | 2x Mk.II + 1x Carbon Nanotube | 1x Proliferator Mk.III | 2s |

**Building Recipes (selected)**

| Building | Key Ingredients |
|----------|----------------|
| Conveyor Belt Mk.I | 2x Iron Ingot + 1x Gear — 3 belts |
| Conveyor Belt Mk.II | 3x Belt Mk.I + 1x EM Turbine — 3 belts |
| Conveyor Belt Mk.III | 3x Belt Mk.II + 1x Super-Mag Ring + 1x Graphene — 3 belts |
| Sorter Mk.I | 1x Gear + 1x Circuit Board — 1 sorter |
| Sorter Mk.II | 2x Sorter Mk.I + 1x Electric Motor — 2 sorters |
| Sorter Mk.III | 2x Sorter Mk.II + 1x EM Turbine — 2 sorters |
| Arc Smelter | 4x Iron Ingot + 2x Stone Brick + 4x Circuit Board + 4x Magnetic Coil |
| Assembler Mk.I | 4x Iron Ingot + 8x Gear + 4x Circuit Board |
| Assembler Mk.II | 1x Assembler Mk.I + 4x Graphene + 1x Processor |
| Assembler Mk.III | 1x Assembler Mk.II + 2x Particle Broadband + 2x Processor |
| Matrix Lab | 8x Iron Ingot + 4x Glass + 4x Circuit Board + 4x Magnetic Coil |
| Planetary Logistics Station | 40x Steel + 40x Ti Ingot + 40x Processor + 20x Particle Container |
| Interstellar Logistics Station | 40x Ti Alloy + 40x Ti Glass + 40x Processor + 20x Particle Container |
| Vertical Launching Silo | 80x Ti Alloy + 30x Frame Material + 10x Quantum Chip |

### Oil Refinery (3 recipes)

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Plasma Refining | 2x Crude Oil | 2x Refined Oil + 1x Hydrogen | 4s |
| X-Ray Cracking | 1x Refined Oil + 2x Hydrogen | 3x Hydrogen + 1x E. Graphite | 4s |
| Reformed Refining | 2x Refined Oil + 1x Hydrogen + 2x Coal | 3x Refined Oil | 4s |

### Chemical Plant (8 recipes)

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Plastic | 2x Refined Oil + 1x E. Graphite | 1x Plastic | 3s |
| Graphene | 3x E. Graphite + 1x Sulfuric Acid | 2x Graphene | 3s |
| Graphene (Fire Ice) | 2x Fire Ice | 2x Graphene + 1x Hydrogen | 2s |
| Carbon Nanotube | 3x Graphene + 1x Ti Ingot | 2x Carbon Nanotube | 4s |
| Carbon Nanotube (Spiniform) | 6x Spiniform Stalagmite Crystal | 2x Carbon Nanotube | 4s |
| Organic Crystal | 2x Plastic + 1x Refined Oil + 1x Water | 1x Organic Crystal | 6s |
| Sulfuric Acid | 6x Stone Ore + 4x Refined Oil + 4x Water | 4x Sulfuric Acid | 6s |

### Miniature Particle Collider (3 recipes)

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Deuterium | 10x Hydrogen | 5x Deuterium | 2.5s |
| Antimatter | 2x Critical Photon | 2x Antimatter + 2x Hydrogen | 2s |
| Strange Matter | 2x Iron Ingot + 10x Deuterium + 2x Particle Container | 1x Strange Matter | 8s |

### Matrix Lab (6 recipes)

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Electromagnetic Matrix | 1x Magnetic Coil + 1x Circuit Board | 1x EM Matrix | 3s |
| Energy Matrix | 2x E. Graphite + 2x Hydrogen | 1x Energy Matrix | 6s |
| Structure Matrix | 1x Diamond + 1x Titanium Crystal | 1x Structure Matrix | 8s |
| Information Matrix | 2x Processor + 1x Particle Broadband | 1x Information Matrix | 10s |
| Gravity Matrix | 1x Graviton Lens + 1x Quantum Chip | 1x Gravity Matrix | 24s |
| Universe Matrix | 1x each of all 5 matrices + 1x Antimatter | 1x Universe Matrix | 15s |

---

## Saving and Loading

Your factory layout can be saved as a `.json` file and reloaded at any time.

**To save:** Click **Save** in the header. Your browser will download `dsp-factory.json`.

**To load:** Click **Load** in the header. Select a previously saved `.json` file. The canvas clears and the saved layout is restored, including all node positions, connections, and settings.

**What is saved:**
- All nodes (type, position, all property values, custom labels)
- All connections (which nodes are connected and which ports)
- The internal ID counter (ensures new nodes get unique IDs after loading)

---

## Tips and Patterns

### Planning a Production Line

Build your chain left to right: miners — belts — smelters — belts — assemblers — output. Connect nodes in order. The planner propagates flow calculations downstream automatically as you connect.

### Null-Start Workflow

All nodes start with no recipe or resource selected. The intended workflow is:

1. Place a miner and select its resource
2. Connect it to a belt
3. Connect the belt to a smelter — the recipe dropdown narrows to recipes that use your ore
4. Select the recipe — input ports appear for each ingredient
5. Continue building downstream — each connection further narrows available recipes

This way, recipe filtering and connection validation work together rather than against each other.

### Checking Bottlenecks

Open the **Analysis tab** at any time. Warnings appear for:
- Any node below 90% efficiency (amber)
- Any node below 50% efficiency (red)
- Any belt above 85% saturation (amber)
- Any belt above 100% (red — items are being lost)
- Any sorter capping throughput

Click any warning to jump directly to that node in the canvas.

### Finding the Limiting Factor

Select a production node and look at the Properties tab live stats panel. Each ingredient shows its arrival rate vs. needed rate. The one with the lowest ratio is your bottleneck — upgrade its sorter tier or reduce reach first.

### Multi-Source Belts

Connect multiple upstream nodes to the same belt. The belt sums all inputs and correctly splits its output among all downstream consumers proportionally by demand.

### Veins Utilization Research

VU Level is one of the most impactful early techs. Updating it on your mining nodes immediately shows the output change, helping you decide how many additional smelters you can support.

---

## Technical Notes

- **Single file** — the entire application is one `.html` file with no external dependencies, no framework, and no build step
- **Vanilla JavaScript** — no React, no Vue, no jQuery
- **Topological sort** — recalculation walks nodes in dependency order so downstream nodes always calculate after upstream nodes settle
- **Demand-weighted splitting** — belt output is divided among consumers by demand ratio, not given to each consumer in full
- **Coordinate systems** — the canvas uses a CSS `transform: translate() scale()` camera; node positions are in world space; SVG edges are drawn in screen space
- **Save format** — plain JSON, human-readable, easy to back up or version-control

---

## Game Data Accuracy

All numbers are sourced from the Dyson Sphere Program wiki, in-game measurements, and community-verified guides.

Key verified values:
- Mining rate: 30 ore/min per vein base, +10% per VU level
- Energized Graphite burn rate: 24/min per thermal plant at full load
- Arc Smelter recipe times match in-game tooltip values
- Assembler tier multipliers: 0.75 / 1.0 / 1.5
- Belt capacities: 360 / 720 / 1800 per minute
- Sorter speeds: 1.5 / 3 / 6 trips/sec at 1 square, halving per additional square
- Fractionator: 1% of hydrogen throughput converts to deuterium per pass
- Thermal Plant: 2.16 MW per plant at full fuel supply
- Mini Fusion: 24 MW per plant at full deuteron rod supply

---

## Acknowledgements

Built for players of [Dyson Sphere Program](https://store.steampowered.com/app/1366540/Dyson_Sphere_Program/) by Youthcat Studio.

Recipe data sourced from the [DSP Wiki](https://dsp-wiki.com), the [Fandom Wiki](https://dyson-sphere-program.fandom.com), and community guides on the [Steam Workshop](https://steamcommunity.com/app/1366540/guides/).
