# DSP Factory Planner

A node-based, visual production chain calculator for **Dyson Sphere Program**. Plan, balance, and debug your entire factory from raw ore to finished product — including every belt, sorter, smelter, assembler, and power plant — all in your browser with no install required.

**🔗 Live App: [https://dkoszenski.github.io/DSP-Factory-Planner/](https://dkoszenski.github.io/DSP-Factory-Planner/)**

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
2. A **Mining Node** is placed for you automatically to get started
3. Click any node in the **Nodes tab** on the right panel to add more nodes, or right-click anywhere on the canvas for a context menu
4. Click an output port (gold dot) and drag to an input port (teal dot) to connect two nodes
5. Select a node to edit its properties in the **Properties tab**
6. Watch the **Analysis tab** for bottlenecks and warnings across your whole chain

No install. No server. No build step. Just open the HTML file in any modern browser.

---

## The Interface

### Canvas

The main workspace where your factory graph lives. Nodes are positioned freely and connected with curved lines.

- **Dot grid background** for spatial reference
- **Curved Bezier connections** color-coded by the item they carry and their health status
- **Midpoint pills** on every connection showing the item icon, item name, and current flow rate
- **Zoom controls** in the bottom-left corner (`+` / `−` buttons or scroll wheel)
- **Zoom percentage** displayed between the zoom buttons

### Right Sidebar

Three tabs:

| Tab | Purpose |
|-----|---------|
| **Nodes** | Palette of all available node types. Click to add to center of view, or drag to a specific position on the canvas. Also shows quick-reference tips. |
| **Properties** | Edit every setting for the selected node — count, recipe, sorter tiers, sorter reach, VU level, fuel type, etc. Shows a live stats panel at the bottom. |
| **Analysis** | Global summary: total power generated, total node count, a list of all warnings and bottlenecks, and a per-node breakdown you can click to jump straight to any node's properties. |

### Header Bar

| Button | Action |
|--------|--------|
| 💾 Save | Downloads your current factory as a `.json` file |
| 📂 Load | Opens a file picker to load a previously saved `.json` |
| ⊞ Fit view | Automatically zooms and pans to fit all nodes in the viewport |
| 🗑 Clear all | Removes all nodes and connections (asks for confirmation) |

---

## Node Types

There are **14 node types**, each representing a category of building in Dyson Sphere Program.

### ⛏️ Mining Node

Represents one or more Mining Machines on a resource patch.

- **Resource** — select which item is being mined (iron ore, coal, silicon ore, titanium ore, etc.)
- **Miners** — add as many miners as you have, each with its own vein count (since different miners may cover different numbers of veins in-game)
- **VU Level** — Veins Utilization research level (0–20). Each level adds +10% mining speed per vein. Level 0 = 30 ore/min per vein, Level 5 = 45/min, Level 10 = 60/min.

Output rate = (veins × 30 × (1 + VU_level × 0.1)) summed across all miners.

The count badge in the header shows how many miners are in the node at a glance.

### 💧 Water Pump

Represents Water Pump buildings on a water body.

- **Count** — number of pumps
- **VU Level** — Veins Utilization level (affects pump output, +10% per level)

Base rate: 50 water/min per pump.

### 🛢️ Oil Extractor

Represents Oil Extractor buildings on a crude oil seep.

- **Count** — number of extractors
- **Rate per extractor** — base extraction rate (varies by oil seep, visible in-game)
- **VU Level** — resource utilization research multiplier

### ➡️ Belt

Represents a section of Conveyor Belt.

- **Tier** — Mk.I (360/min), Mk.II (720/min), or Mk.III (1,800/min)

Belts accept **multiple inputs** — you can connect two or more upstream nodes to the same belt. Each new connection gets its own input port automatically. The belt sums all incoming flow, caps it at belt capacity, and shows:

- The item being carried (determined by the dominant source)
- A color-coded load bar with percentage and rate
- "X sources" if multiple inputs are connected
- An overflow warning if total input exceeds capacity

### 🔥 Arc Smelter

Represents one or more Arc Smelter buildings (also covers Plane Smelter and Negentropy Smelter).

- **Count** — number of smelters
- **Recipe** — any smelter recipe (see [Recipes](#recipes) below)
- **Input Sorter** — tier (Mk.I/II/III) and reach (1–3 squares). Reach affects speed: a Mk.I sorter at 2 squares is half speed.
- **Output Sorter** — same options

One input port is generated **per recipe ingredient**. The recipe for Titanium Alloy needs Titanium Ingot, Steel, and Sulfuric Acid, so the node will show three teal input ports. Each port validates that the correct item is connected before allowing the connection.

### 🏭 Assembler

Represents one or more Assembling Machine buildings (Mk.I, Mk.II, or Mk.III).

- **Count** — number of assemblers
- **Tier** — Mk.I (×0.75 speed), Mk.II (×1.0 speed), Mk.III (×1.5 speed)
- **Recipe** — any assembler recipe (91 recipes total, including all building recipes)
- **Input Sorter / Output Sorter** — tier and reach

Same dynamic port system as the Arc Smelter — one input port per recipe ingredient.

### ⚗️ Chemical Plant

Represents Chemical Plant buildings. Uses a custom recipe format since chemical plants can handle both standard and fully custom setups.

- **Count** — number of plants
- **Input item / Output item** — selectable from the full item list
- **Recipe time** — seconds per cycle
- **Input qty / Output qty** — items per cycle
- **Input Sorter / Output Sorter** — tier and reach

### 🛢️ Oil Refinery

Represents Oil Refinery buildings.

- **Count** — number of refineries
- **Recipe** — Plasma Refining, X-Ray Cracking, or Reformed Refining
- **Input Sorter / Output Sorter** — tier and reach

### 🧫 Fractionator

Represents Fractionator buildings for Deuterium production.

- **Count** — number of fractionators
- Accepts Hydrogen input only
- Produces Deuterium at 1% per pass (hydrogen loops through; only 1% converts per transit)

### ⚛️ Particle Collider

Represents Miniature Particle Collider buildings.

- **Count** — number of colliders
- **Recipe** — Deuterium (from Hydrogen), Antimatter (from Critical Photon), or Strange Matter

### 🔬 Matrix Lab

Represents Matrix Lab buildings in production mode.

- **Count** — number of labs
- **Recipe** — any of the 6 science matrices (Electromagnetic, Energy, Structure, Information, Gravity, Universe)

### 🔋 Thermal Power Plant

Represents Thermal Power Plant buildings.

- **Count** — number of plants
- **Fuel type** — Coal (60/min), Energized Graphite (24/min), Hydrogen (18/min), Refined Oil (~25.7/min), Fire Ice (~33.8/min)
- **Input Sorter** — tier and reach

Output is 2.16 MW per fully-fed plant. The efficiency bar shows what percentage of plants are actually receiving fuel.

### ☢️ Mini Fusion Power Plant

Represents Mini Fusion Power Plant buildings.

- **Count** — number of plants
- Accepts only Deuteron Fuel Rods
- Output is 24 MW per fully-fed plant

### 📥 Consumer

A generic sink node for anything that consumes items without producing an output (research labs in research mode, Dyson sphere launchers, turrets, etc.).

- **Count** — number of buildings
- **Item** — what item it consumes
- **Consumption per minute per building** — manual entry

---

## Connections

### Drawing a Connection

1. Click and hold on an **output port** (gold dot, right side of a node)
2. Drag to an **input port** (teal dot, left side of a node)
3. Release on the input port to complete the connection

A dashed blue line follows your cursor while dragging to show the in-progress connection.

### Connection Validation

The planner validates every connection before allowing it. If you try to connect an incompatible item to a node input, the connection is **rejected** and:

- The target node **shakes** with a brief animation
- A red error toast appears above the node for **3 seconds** explaining exactly why — e.g. "⚠ Slot expects Iron Ingot, not Copper Ingot"

Validation rules:
- **Arc Smelter / Assembler** — each input port is tied to a specific recipe ingredient. Port 1 might expect Iron Ingot, Port 2 expects Copper Ingot. Connecting the wrong item to either slot is blocked.
- **Fractionator** — only accepts Hydrogen
- **Mini Fusion** — only accepts Deuteron Fuel Rods
- **Chemical Plant** — validates against the configured input item
- **Belts** — accept any item (they're just transport)
- **Mining / Water Pump / Oil Extractor** — no inputs, cannot be connected to

### Multiple Inputs on a Belt

Belts support multiple upstream connections. Each time you connect something new to a belt's input area, a new port slot is created. The belt correctly sums all inputs and enforces its capacity limit, showing overflow warnings if the total exceeds the belt's rated capacity.

### Selecting and Deleting Connections

- **Click** on a connection line to select it (turns blue)
- Press **Delete** or **Backspace** to remove the selected connection
- **Right-click** a connection and choose "🗑 Delete connection"

---

## Smart Recipe Filtering

When a node has items connected to its inputs, the recipe dropdown is automatically filtered to only show recipes that use those items.

- Connect an **Iron Ingot belt** to an assembler → only recipes that require Iron Ingot are shown
- Connect both an **Iron Ingot belt** and a **Copper Ingot belt** → only recipes requiring both are shown
- A teal info banner shows how many recipes are being filtered and which items are being matched
- If no recipes match all connected items, the filter is cleared and all recipes are shown with a warning
- With only a single input connected, the recipe auto-switches if the current recipe doesn't use that item

---

## Throughput Calculations

### Multi-Input Bottleneck Model

For any production node with multiple inputs (Arc Smelter, Assembler, etc.), the planner calculates throughput for **each ingredient independently**, then uses the **worst-supplied ingredient** to determine actual output.

For each recipe input:
- `need_per_min = (qty / recipe_time) × 60 × count × speed_multiplier`
- `effective = min(arriving, sorter_cap, need_per_min)`
- `fill_ratio = effective / need_per_min`

The output rate scales by the lowest `fill_ratio` across all inputs. If Iron Ingot is at 100% but Copper Ingot is at 40%, the assembler runs at 40% and the node card shows the per-ingredient supply breakdown.

### Sorter Throughput

Sorters are often the hidden bottleneck. Their effective speed depends on both tier and reach:

| Tier | Speed at 1 square | Speed at 2 squares | Speed at 3 squares |
|------|------------------|--------------------|--------------------|
| Mk.I | 90/min | 45/min | 30/min |
| Mk.II | 180/min | 90/min | 60/min |
| Mk.III | 360/min | 180/min | 120/min |

These caps are applied per-machine and multiplied by count, so 6 assemblers with Mk.I sorters at 1 square = 540/min total sorter capacity per ingredient.

### Belt Capacities

| Tier | Capacity |
|------|---------|
| Mk.I | 360 items/min |
| Mk.II | 720 items/min |
| Mk.III | 1,800 items/min |

### Mining Rate

`output = veins × 30 × (1 + VU_level × 0.1)` per miner, summed across all miners in the node.

### Assembler Speed Multipliers

| Tier | Multiplier |
|------|-----------|
| Mk.I | ×0.75 |
| Mk.II | ×1.0 |
| Mk.III | ×1.5 |

### Thermal Plant Fuel Burn Rates

Rates derived from `burn_time = (energy_MJ × 0.8) / 2.16 MW`:

| Fuel | Rate at 100% load |
|------|-----------------|
| Coal | 60/min |
| Energized Graphite | 24/min |
| Hydrogen | 18/min |
| Refined Oil | ~25.7/min |
| Fire Ice | ~33.8/min |

---

## Visual Language

### Node Cards

Each node displays:
- **Header** — icon, name, count badge (e.g. `x6`) showing building count at a glance
- **Input ports** (teal dots) — one per recipe ingredient for multi-input machines
- **Output port** (gold dot) — what the node produces
- **Stats area** — live calculation results with colored item chips, load bars, and efficiency bars
- **Left border accent** — color-coded to the item the node is outputting

### Connection Lines

Lines between nodes are:
- **Colored by item** — each item has a unique color (iron ore is red, coal is gray, copper ingot is orange, energized graphite is dark gray, etc.)
- **Width changes** with selection (selected connections turn blue and thicken)
- **Glow layer** gives depth without using gradients
- **Health-tinted** — amber if efficiency 50–89%, red if below 50%

### Connection Midpoint Pills

Every connection shows a pill at its midpoint containing:
- The item's emoji icon
- The item name
- The current flow rate in `/min` (or MW for power)

### Load and Efficiency Bars

- **Green** — 0–80% load (healthy)
- **Amber** — 81–100% load (approaching limit)
- **Red** — over 100% / below 50% efficiency (problem)

Belts show "Load" with percentage and rate. Production nodes show "Efficiency" with current output vs. maximum output.

---

## Controls Reference

### Canvas Navigation

| Action | Control |
|--------|---------|
| Pan | Middle mouse button + drag, or Alt + left-click drag |
| Zoom in/out | Scroll wheel (zooms toward cursor position) |
| Zoom in | Click `+` button (bottom-left) |
| Zoom out | Click `−` button (bottom-left) |
| Fit all nodes in view | Click `⊞ Fit view` button (header) |

### Node Interactions

| Action | Control |
|--------|---------|
| Add node | Click palette item in Nodes tab, or right-click empty canvas |
| Move node | Left-click drag on node header or body |
| Select node | Left-click node (opens Properties tab) |
| Edit properties | Select node → Properties tab, or right-click → Edit properties |
| Delete node | Click `✕` on node header, or select + press Delete, or right-click → Delete node |
| Rename node | Select node → Properties tab → Name field |

### Multi-Selection

| Action | Control |
|--------|---------|
| Box select | Left-click drag on empty canvas area — a dashed blue rectangle appears |
| Add to selection | Shift + left-click on a node |
| Remove from selection | Shift + left-click on an already-selected node |
| Move all selected | Left-click drag on any node in the selection — all move together |
| Delete all selected | Press Delete or Backspace with multiple nodes selected |
| Clear selection | Click empty canvas, or press Escape |

### Connection Controls

| Action | Control |
|--------|---------|
| Draw connection | Left-click drag from output port (gold) to input port (teal) |
| Select connection | Left-click on the connection line |
| Delete selected connection | Press Delete or Backspace |
| Delete connection (context menu) | Right-click connection → Delete connection |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Delete / Backspace | Delete selected node(s) or connection |
| Escape | Clear all selections |

---

## Recipes Reference

### Arc Smelter (15 recipes)

Covers Arc Smelter, Plane Smelter, and Negentropy Smelter.

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Iron Ingot | 1× Iron Ore | 1× Iron Ingot | 1s |
| Copper Ingot | 1× Copper Ore | 1× Copper Ingot | 1s |
| Stone Brick | 1× Stone Ore | 1× Stone Brick | 1s |
| Energized Graphite | 2× Coal | 1× Energized Graphite | 2s |
| Glass | 2× Stone Ore | 1× Glass | 2s |
| Magnet | 1× Iron Ore | 1× Magnet | 1.5s |
| Steel | 3× Iron Ingot | 1× Steel | 3s |
| High-Purity Silicon | 2× Silicon Ore | 1× High-Purity Silicon | 2s |
| Crystal Silicon | 1× High-Purity Silicon | 1× Crystal Silicon | 2s |
| Crystal Silicon (Fractal) | 1× Fractal Silicon | 2× Crystal Silicon | 1.5s |
| Diamond | 1× Energized Graphite | 1× Diamond | 2s |
| Diamond (Kimberlite) | 1× Kimberlite Ore | 2× Diamond | 1.5s |
| Titanium Ingot | 2× Titanium Ore | 1× Titanium Ingot | 2s |
| Titanium Alloy | 4× Ti Ingot + 4× Steel + 8× Sulfuric Acid | 4× Titanium Alloy | 12s |
| Silicon Ore (from Stone) | 10× Stone Ore | 1× Silicon Ore | 10s |

### Assembler (91 recipes)

Includes all component recipes and all building recipes. A selection of key ones:

**Core Components**

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Gear | 1× Iron Ingot | 1× Gear | 1s |
| Magnetic Coil | 2× Magnet + 1× Copper Ingot | 2× Magnetic Coil | 1s |
| Circuit Board | 2× Iron Ingot + 1× Copper Ingot | 2× Circuit Board | 1s |
| Electric Motor | 2× Iron Ingot + 1× Gear + 1× Magnetic Coil | 1× Electric Motor | 2s |
| EM Turbine | 2× Electric Motor + 2× Magnetic Coil | 1× EM Turbine | 2s |
| Super-Magnetic Ring | 2× EM Turbine + 3× Magnet + 1× E. Graphite | 2× Super-Magnetic Ring | 3s |
| Processor | 2× Circuit Board + 2× Microcrystalline | 1× Processor | 3s |
| Quantum Chip | 2× Processor + 2× Plane Filter | 1× Quantum Chip | 6s |

**Advanced Components**

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Casimir Crystal | 1× Ti Crystal + 2× Graphene + 12× Hydrogen | 1× Casimir Crystal | 4s |
| Plane Filter | 1× Casimir Crystal + 2× Titanium Glass | 1× Plane Filter | 12s |
| Graviton Lens | 4× Diamond + 1× Strange Matter | 1× Graviton Lens | 6s |
| Particle Container | 2× EM Turbine + 2× Copper Ingot + 2× Graphene | 1× Particle Container | 4s |
| Annihilation Constraint Sphere | 1× Particle Container + 1× Processor | 1× A.C. Sphere | 20s |

**Dyson Sphere Chain**

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Solar Sail | 1× Graphene + 1× Photon Combiner | 2× Solar Sail | 4s |
| Frame Material | 4× Carbon Nanotube + 1× Ti Alloy + 1× H-P Silicon | 1× Frame Material | 6s |
| Dyson Sphere Component | 3× Frame Material + 3× Solar Sail + 3× Processor | 1× DSP Component | 8s |
| Small Carrier Rocket | 2× DSP Component + 2× Quantum Chip + 2× D. Fuel Rod | 1× Rocket | 6s |

**Fuel Rods**

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Hydrogen Fuel Rod | 1× Ti Ingot + 10× Hydrogen | 2× H. Fuel Rod | 6s |
| Deuteron Fuel Rod | 1× Ti Alloy + 10× Deuterium + 1× Super-Mag Ring | 2× D. Fuel Rod | 12s |
| Antimatter Fuel Rod | 10× Antimatter + 10× Hydrogen + 1× A.C. Sphere + 1× Ti Alloy | 2× AM Fuel Rod | 24s |

**Proliferators**

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Proliferator Mk.I | 1× Coal | 1× Proliferator Mk.I | 0.5s |
| Proliferator Mk.II | 2× Mk.I + 1× Diamond | 1× Proliferator Mk.II | 1s |
| Proliferator Mk.III | 2× Mk.II + 1× Carbon Nanotube | 1× Proliferator Mk.III | 2s |

**Building Recipes (selected)**

| Building | Key Ingredients |
|----------|----------------|
| Conveyor Belt Mk.I | 2× Iron Ingot + 1× Gear → 3 belts |
| Conveyor Belt Mk.II | 3× Belt Mk.I + 1× EM Turbine → 3 belts |
| Conveyor Belt Mk.III | 3× Belt Mk.II + 1× Super-Mag Ring + 1× Graphene → 3 belts |
| Sorter Mk.I | 1× Gear + 1× Circuit Board → 1 sorter |
| Sorter Mk.II | 2× Sorter Mk.I + 1× Electric Motor → 2 sorters |
| Sorter Mk.III | 2× Sorter Mk.II + 1× EM Turbine → 2 sorters |
| Arc Smelter | 4× Iron Ingot + 2× Stone Brick + 4× Circuit Board + 4× Magnetic Coil |
| Assembler Mk.I | 4× Iron Ingot + 8× Gear + 4× Circuit Board |
| Assembler Mk.II | 1× Assembler Mk.I + 4× Graphene + 1× Processor |
| Assembler Mk.III | 1× Assembler Mk.II + 2× Particle Broadband + 2× Processor |
| Matrix Lab | 8× Iron Ingot + 4× Glass + 4× Circuit Board + 4× Magnetic Coil |
| Planetary Logistics Station | 40× Steel + 40× Ti Ingot + 40× Processor + 20× Particle Container |
| Interstellar Logistics Station | 40× Ti Alloy + 40× Ti Glass + 40× Processor + 20× Particle Container |
| Vertical Launching Silo | 80× Ti Alloy + 30× Frame Material + 10× Quantum Chip |

### Oil Refinery (3 recipes)

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Plasma Refining | 2× Crude Oil | 2× Refined Oil + 1× Hydrogen | 4s |
| X-Ray Cracking | 1× Refined Oil + 2× Hydrogen | 3× Hydrogen + 1× E. Graphite | 4s |
| Reformed Refining | 2× Refined Oil + 1× Hydrogen + 2× Coal | 3× Refined Oil | 4s |

### Chemical Plant (8 recipes)

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Plastic | 2× Refined Oil + 1× E. Graphite | 1× Plastic | 3s |
| Graphene | 3× E. Graphite + 1× Sulfuric Acid | 2× Graphene | 3s |
| Graphene (Fire Ice) | 2× Fire Ice | 2× Graphene + 1× Hydrogen | 2s |
| Carbon Nanotube | 3× Graphene + 1× Ti Ingot | 2× Carbon Nanotube | 4s |
| Carbon Nanotube (Spiniform) | 6× Spiniform Stalagmite Crystal | 2× Carbon Nanotube | 4s |
| Organic Crystal | 2× Plastic + 1× Refined Oil + 1× Water | 1× Organic Crystal | 6s |
| Sulfuric Acid | 6× Stone Ore + 4× Refined Oil + 4× Water | 4× Sulfuric Acid | 6s |

### Miniature Particle Collider (3 recipes)

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Deuterium | 10× Hydrogen | 5× Deuterium | 2.5s |
| Antimatter | 2× Critical Photon | 2× Antimatter + 2× Hydrogen | 2s |
| Strange Matter | 2× Iron Ingot + 10× Deuterium + 2× Particle Container | 1× Strange Matter | 8s |

### Matrix Lab (6 recipes)

| Recipe | Inputs | Output | Time |
|--------|--------|--------|------|
| Electromagnetic Matrix (Blue) | 1× Magnetic Coil + 1× Circuit Board | 1× EM Matrix | 3s |
| Energy Matrix (Red) | 2× E. Graphite + 2× Hydrogen | 1× Energy Matrix | 6s |
| Structure Matrix (Yellow) | 1× Diamond + 1× Titanium Crystal | 1× Structure Matrix | 8s |
| Information Matrix (Green) | 2× Processor + 1× Particle Broadband | 1× Information Matrix | 10s |
| Gravity Matrix (Purple) | 1× Graviton Lens + 1× Quantum Chip | 1× Gravity Matrix | 24s |
| Universe Matrix (White) | 1 each of all 5 matrices + 1× Antimatter | 1× Universe Matrix | 15s |

---

## Saving and Loading

Your factory layout can be saved as a `.json` file and reloaded at any time.

**To save:** Click **💾 Save** in the header. Your browser will download `dsp-factory.json`.

**To load:** Click **📂 Load** in the header. Select a previously saved `.json` file. The canvas clears and the saved layout is restored, including all node positions, connections, settings, and the camera position.

**What is saved:**
- All nodes (type, position, all property values, custom labels)
- All connections (which nodes are connected and which ports)
- The internal ID counter (ensures new nodes get unique IDs after loading)

**What is not saved:** The camera zoom/pan position is reset to fit the loaded content.

---

## Tips and Patterns

### Planning a Production Line

Build your chain left to right: miners → belts → smelters → belts → assemblers → output. Connect nodes in order. The planner propagates flow calculations downstream automatically as you connect.

### Checking Bottlenecks

Open the **Analysis tab** at any time for a complete list of warnings. Green means all nodes are balanced. Warnings appear for:
- Any node below 90% efficiency (amber warning)
- Any node below 50% efficiency (red error)
- Any belt above 85% saturation (amber warning)
- Any belt above 100% (red error — items are being lost)
- Any sorter that is capping throughput before the belt or machine can

### Finding the Limiting Factor

For a production node, the Properties tab shows a live stats panel at the bottom with per-ingredient supply: how much is arriving vs. how much is needed. The ingredient with the lowest arrival/need ratio is your bottleneck. Upgrade its sorter tier or reach first.

### Multi-Smelter into One Belt

Use a belt node with multiple inputs. Connect Smelter 1 → Belt, then connect Smelter 2 → the same Belt node. The belt will show "2 sources" and correctly sum both flows, then clamp to its capacity.

### Veins Utilization Research

VU Level is one of the most impactful early techs. Setting VU Level 5 on your mining nodes immediately shows the output increase, helping you decide how many extra smelters you can add before running out of ore throughput.

### Recipe Filtering

When you're not sure which recipe to use for an assembler, connect the belts you have first. The recipe dropdown will automatically narrow to only show recipes that use the items you're supplying. Recipes requiring items you haven't connected yet won't appear.

---

## Technical Notes

- **Single file** — the entire application is one `.html` file with no external dependencies, no framework, and no build step
- **Vanilla JavaScript** — no React, no Vue, no jQuery
- **Topological sort** — recalculation walks nodes in dependency order so downstream nodes always calculate after upstream nodes settle
- **Coordinate systems** — the canvas uses a CSS `transform: translate() scale()` camera; node positions are in world space; SVG edges are drawn in screen space using `getBoundingClientRect()`
- **Save format** — plain JSON, human-readable, easy to back up or version-control alongside a save file

---

## Game Data Accuracy

All numbers in this planner are sourced from the Dyson Sphere Program wiki, in-game measurements, and community-verified guides.

Key verified values:
- Mining rate: **30 ore/min per vein** base, **+10% per VU level**
- Energized Graphite burn rate: **24/min per thermal plant** at 100% load (6.75 MJ × 80% efficiency ÷ 2.16 MW)
- Arc Smelter recipe times match in-game tooltip values
- Assembler tier multipliers: 0.75 / 1.0 / 1.5
- Belt capacities: 360 / 720 / 1800 per minute
- Sorter speeds: 1.5 / 3 / 6 trips/sec at 1 square, halving per additional square

---

## Acknowledgements

Built for players of [Dyson Sphere Program](https://store.steampowered.com/app/1366540/Dyson_Sphere_Program/) by Youthcat Studio.

Recipe data sourced from the [DSP Wiki](https://dsp-wiki.com), the [Fandom Wiki](https://dyson-sphere-program.fandom.com), and community guides on the [Steam Workshop](https://steamcommunity.com/app/1366540/guides/).
