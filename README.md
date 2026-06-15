# DSP Factory Planner

A visual, node-based production chain calculator for Dyson Sphere Program. Plan and balance your entire factory directly in your browser, from a single iron smelter on your starting planet to a multi-planet empire producing Universe Matrices.

**Live App: [https://dkoszenski.github.io/DSP-Factory-Planner/](https://dkoszenski.github.io/DSP-Factory-Planner/)**

No install. No account. No server. Open the link and start building.

---

## What This Does

Dyson Sphere Program requires you to chain together hundreds of machines, each consuming specific inputs and producing specific outputs at precise rates. Figuring out how many smelters feed an assembler, whether your belt is saturated, which ingredient is starving your production, or how many machines you can remove after adding proliferators is genuinely difficult to reason about manually.

This planner gives you a live, visual graph of your production chain. Each building becomes a node. Nodes connect through ports that represent belt lines. Every connection carries a specific item, and the planner calculates in real time how much is produced and consumed at each stage, where the bottlenecks are, what your power balance looks like, and how long until your Dyson Swarm is complete.

The math uses verified in-game numbers throughout: mining rates, sorter trip speeds, belt capacities, recipe times, assembler tier multipliers, fuel burn rates, and proliferator effects.

---

## Getting Started

1. Open the app at [https://dkoszenski.github.io/DSP-Factory-Planner/](https://dkoszenski.github.io/DSP-Factory-Planner/)
2. Open the **Build tab** in the right sidebar, search for any end product, and click **Build Chain** to generate your entire production tree automatically
3. Or place nodes manually: right-click the canvas, or use the Nodes tab to drag any building type onto the canvas
4. Click an output port (gold dot on the right side of a node) and drag to an input port (teal dot on the left side) to connect two buildings
5. Select any node to edit its properties in the **Properties tab**
6. Open the **Analysis tab** to see warnings, bottlenecks, and your factory-wide power and item flow

---

## Auto Chain Builder

The fastest way to plan any production line. Available in the **Build tab**.

**How it works:**
1. Search for any craftable item (Quantum Chip, Dyson Sphere Component, Universe Matrix, etc.)
2. Set your target output rate in items per minute
3. Choose your belt tier, sorter tier, and assembler tier
4. Click **Build Chain**

The planner calculates the full production tree from raw ore to finished product, places every node on the canvas, draws all connections, and positions everything in a readable layout. Mining nodes for the same resource are automatically merged into one node rather than creating duplicates.

After building, a summary tells you the actual output rate achieved and warns you if any node exceeds the belt tier you selected.

**When chemical plants appear in the chain**, they are connected automatically for their primary input. A warning message lists any additional inputs that need to be wired manually, since chemical plant layouts vary.

This feature covers all recipe types: smelting, assembly, refining, chemistry, matrix science, and more. You can run it multiple times to add parallel production lines to an existing canvas.

---

## Building Your Factory Manually

### The Canvas

The main workspace. Nodes sit freely in 2D space and connect with curved bezier lines.

- Scroll to zoom (zooms toward your cursor position)
- Middle mouse or Alt plus left-click to pan
- Right-click empty canvas to add any node type at that position
- Drag nodes to reposition them
- Box-select by dragging on empty canvas; Shift-click to add individual nodes to a selection
- Bottom-left corner has zoom buttons and a current zoom percentage

### The Sidebar

Four tabs:

| Tab | What it does |
|-----|-------------|
| Nodes | Palette of all building types. Click to add at screen center, or drag to place anywhere. |
| Properties | All settings for the selected node: count, recipe, sorter tiers, sorter reach, proliferators, planet assignment, and more. Shows a live stats panel below. |
| Analysis | Factory-wide summary: item flow, power balance, research progress, Dyson Sphere estimate, bottleneck overview, and a per-node breakdown. |
| Build | Auto Chain Builder. |

### The Header

| Button | Action |
|--------|--------|
| Save | Downloads your factory as a `.json` file |
| Load | Opens a file picker to restore a saved `.json` |
| Fit view | Zooms and pans to fit all nodes in the viewport |
| Share link | Encodes your entire factory into a URL you can copy and send to anyone |
| Clear all | Removes everything (asks for confirmation) |

---

## Node Types

### Mining Node

Represents Mining Machines on a resource patch.

- **Resource:** searchable dropdown for any mineable ore
- **Miners:** add one entry per mining machine, each with its own vein count
- **VU Level:** Veins Utilization research level (0 to 20). Each level adds 10% mining speed.

Output rate = sum across all miners of (veins x 30 x (1 + VU level x 0.1)) per minute.

### Water Pump

- **Count:** number of pumps
- **VU Level:** applies the same +10% per level multiplier

Base rate: 50 water per minute per pump.

### Oil Extractor

- **Count:** number of extractors
- **Rate per extractor:** visible in-game on the seep (varies by location)
- **VU Level:** resource utilization research multiplier

### Belt

Represents a conveyor belt line.

- **Tier:** Mk.I (360/min), Mk.II (720/min), Mk.III (1,800/min)

Belts accept multiple inputs. Each new connection gets its own input port. The belt sums incoming flow, caps it at capacity, and shows the dominant item, load percentage, and an overflow warning if inputs exceed capacity. When multiple downstream nodes share a belt, the output is split in proportion to each consumer's actual demand.

### Arc Smelter

Represents Arc Smelter, Plane Smelter, or Negentropy Smelter buildings.

- **Count:** number of smelters
- **Recipe:** searchable dropdown
- **Input Sorter / Output Sorter:** tier (Mk.I, II, III) and reach (1 to 3 squares)
- **Proliferator:** optional tier and mode (see Proliferators section)

One input port is generated per recipe ingredient.

### Assembler

Represents Assembling Machine Mk.I, Mk.II, or Mk.III.

- **Count:** number of assemblers
- **Tier:** Mk.I (x0.75 speed), Mk.II (x1.0 speed), Mk.III (x1.5 speed)
- **Recipe:** searchable dropdown (91 recipes including all building recipes)
- **Input Sorter / Output Sorter:** tier and reach
- **Proliferator:** optional tier and mode

### Chemical Plant

- **Count:** number of plants
- **Input item / Output item:** searchable dropdowns
- **Recipe time, Input qty, Output qty:** set to match the in-game recipe
- **Input Sorter / Output Sorter:** tier and reach

### Oil Refinery

- **Count:** number of refineries
- **Recipe:** Plasma Refining, X-Ray Cracking, or Reformed Refining
- **Input Sorter / Output Sorter:** tier and reach
- **Proliferator:** optional tier and mode

Multi-input recipes show one port per ingredient.

### Fractionator

- **Count:** number of fractionators
- Accepts Hydrogen only
- Produces Deuterium at 1% of hydrogen throughput per pass

### Particle Collider

- **Count:** number of colliders
- **Recipe:** Deuterium, Antimatter, or Strange Matter
- **Input Sorter / Output Sorter:** tier and reach
- **Proliferator:** optional tier and mode

### Matrix Lab

- **Count:** number of labs
- **Recipe:** any of the 6 science matrices
- **Input Sorter / Output Sorter:** tier and reach
- **Proliferator:** optional tier and mode

Universe Matrix requires 6 simultaneous inputs. Output is limited by the worst-supplied ingredient.

### Thermal Power Plant

- **Count:** number of plants
- **Fuel type:** Coal (60/min), Energized Graphite (24/min), Hydrogen (18/min), Refined Oil (~25.7/min), Fire Ice (~33.8/min)
- **Input Sorter:** tier and reach

Output: 2.16 MW per fully-fed plant.

### Mini Fusion Power Plant

- **Count:** number of plants
- Accepts Deuteron Fuel Rods only
- Output: 24 MW per fully-fed plant

### Planetary Logistics Station and Interstellar Logistics Station

Source and sink nodes for multi-planet logistics. Set the station to Supply or Demand mode, select the item, and set the rate per minute.

Use these as inter-planet handoff points: an ILS on planet A exporting copper ingots connects downstream to an ILS on planet B importing them, making the flow visible across your whole plan even when the actual transport runs through logistics vessels.

### Consumer

A generic sink for any building that consumes items without producing output (rocket silos, launch platforms, etc.).

- **Count:** number of buildings
- **Item:** what is consumed
- **Consumption per minute:** per building

---

## Connections

### Drawing a Connection

1. Click and hold an output port (gold dot, right side of a node)
2. Drag to an input port (teal dot, left side)
3. Release to connect

A dashed blue line follows your cursor while dragging.

### Validation

Every connection is validated before being accepted. If the item being carried does not match what the destination port expects, the connection is rejected. The target node shakes briefly and a red error message appears above it for 3 seconds explaining the mismatch.

Nodes start with no recipe selected, so connections are always accepted on a fresh node. Once a recipe is set, subsequent connections to remaining ports are validated against the specific ingredient expected at each slot.

### Hover Labels

Connection lines show a midpoint label (item name and flow rate) on hover. Selected connections always show their label.

### Deleting Connections

- Click a connection to select it, then press Delete or Backspace
- Right-click a connection and choose Delete connection

---

## Smart Recipe Filtering

When items are connected to a node's inputs, the recipe dropdown filters automatically to show only recipes that use those items.

- Connect an Iron Ingot belt to an assembler: only recipes requiring Iron Ingot appear
- Connect both Iron Ingot and Copper Ingot: only recipes requiring both appear
- A banner shows how many recipes match and which items are filtering
- If no recipes match all connected inputs, filtering clears and all recipes show with a warning

The search input inside the recipe dropdown matches on recipe name, not the full ingredient label.

---

## Throughput Calculations

### Multi-Input Bottleneck Model

Arc Smelters, Assemblers, Oil Refineries, Particle Colliders, and Matrix Labs use a bottleneck model across every ingredient:

For each recipe input:
- `need_per_min = (qty / recipe_time) x 60 x count x speed_multiplier`
- `effective = min(arriving, sorter_cap, need_per_min)`
- `fill_ratio = effective / need_per_min`

Output scales by the lowest fill ratio across all inputs. The node card shows each ingredient's arriving rate versus needed rate so you can see at a glance which input is limiting production.

### Demand-Weighted Belt Splitting

When multiple downstream nodes pull from the same belt, output is divided in proportion to each consumer's actual demand, not split evenly. This matches how real factory layouts behave when resources are shared upstream.

### Sorter Throughput

| Tier | 1 square | 2 squares | 3 squares |
|------|----------|-----------|-----------|
| Mk.I | 90/min | 45/min | 30/min |
| Mk.II | 180/min | 90/min | 60/min |
| Mk.III | 360/min | 180/min | 120/min |

These caps apply per ingredient per machine, multiplied by count.

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

---

## Proliferators

Proliferators are mid-to-end game items that significantly change the economics of any production line. The planner supports them on Arc Smelters, Assemblers, Oil Refineries, Particle Colliders, and Matrix Labs.

### Setting Proliferators

In any supported node's Properties panel, choose a proliferator tier and mode:

**Extra Products mode** -- produces bonus output items from the same inputs:

| Tier | Bonus output |
|------|-------------|
| Mk.I | +12.5% |
| Mk.II | +25% |
| Mk.III | +50% |

**Production Speed mode** -- machines cycle faster, consuming more power:

| Tier | Speed boost |
|------|------------|
| Mk.I | +25% |
| Mk.II | +50% |
| Mk.III | +100% (2x) |

All output rates, input demand rates, and efficiency calculations update immediately when you change proliferator settings.

### Proliferator ROI Calculator

Below the tier and mode selectors, the planner shows a table for how many machines you could remove from this node while maintaining current output, for every tier and mode combination.

For example: if you have 12 Assemblers Mk.II and add Mk.III proliferators in Extra Products mode, the table shows you could remove 4 of those assemblers (reducing to 8) and still produce the same output. This helps you decide whether the proliferator cost is worth the machine savings.

---

## Research Planner

Available in the **Analysis tab** under the Research Goal section.

Select any tech from the dropdown to see:
- Total matrices required of each type
- How many of each matrix your current factory produces per minute
- Net surplus or deficit per matrix type at your current production rate
- Estimated time to complete research based on your surplus rates

If you are short on any matrix type, a **Build Matrix Chains** button appears. Clicking it uses the Auto Chain Builder to generate the full production tree for each matrix type you are deficient in, placed directly on the canvas.

The research goal list covers all major techs from early EM Matrix research through end-game Universe Matrix upgrades.

---

## Analysis Tab

The Analysis tab gives a complete picture of your factory's health and progress without having to inspect nodes one by one.

### Per-Item Flow Summary

A table of every item moving through your factory: total production per minute across all sources, total consumption per minute across all consumers, and the net surplus or deficit. Items with a deficit appear in red so the biggest problems are immediately visible.

### Power Balance

Shows total power generation (MW) from all thermal and fusion plants, total power consumption from all production machines, and the net surplus or deficit. A red deficit means your factory will brown out. A green surplus tells you how much headroom you have.

Power draw per machine type:

| Building | Power draw |
|---------|-----------|
| Mining Machine | 420 kW each |
| Water Pump | 400 kW each |
| Oil Extractor | 400 kW each |
| Arc Smelter | 360 kW each |
| Assembler Mk.I | 270 kW each |
| Assembler Mk.II | 540 kW each |
| Assembler Mk.III | 1,080 kW each |
| Chemical Plant | 720 kW each |
| Oil Refinery | 960 kW each |
| Particle Collider | 18,000 kW each |
| Matrix Lab | 480 kW each |
| Fractionator | 720 kW each |

Proliferators in speed mode increase power draw: Mk.I at 2x, Mk.II at 2.5x, Mk.III at 3x.

### Bottleneck Summary

Three cards show how many nodes are at critical efficiency (below 50%), warning efficiency (50 to 89%), and healthy efficiency (90% and above). Clicking any card plays an amber glow animation on every node in that group simultaneously, so you can see at a glance where your factory is struggling.

### Dyson Sphere Estimator

Enter your current Dyson Swarm coverage percentage, the orbit capacity you have unlocked, your solar sail launch rate per minute, and the shell coverage percentage. The estimator shows:

- Estimated power generation from the swarm and shell at current coverage
- Time remaining to fill the orbit at your current sail rate (displayed in minutes, hours, or days depending on scale)
- Combined power output at full completion

---

## Multi-Planet Planning

When your factory spans multiple planets, use the planet system to organize nodes by location and filter the canvas view.

### Creating Planets

Click **+ Planet** in the planet bar (which appears below the header once you add your first planet). Enter a name for the planet. You can create as many as you need.

### Assigning Nodes to Planets

Select any node and find the Planet dropdown at the top of its Properties panel. Nodes with no planet assigned remain visible in all views and are treated as "unassigned."

### Filtering the View

Click any planet chip in the planet bar to focus the canvas on that planet. Nodes assigned to other planets fade out and become unselectable, so you can work on one planet at a time without clutter.

Click **All** to return to the full view.

### Analysis with Planets Active

When a planet filter is active, the per-node breakdown in the Analysis tab shows only nodes on that planet. When viewing all planets, each node in the breakdown shows a small badge with its planet name.

### Saving and Sharing

Planet names and node assignments are included in both the Save file and the Share link, so your multi-planet layout is fully preserved.

---

## Saving, Loading, and Sharing

### Save File

Click **Save** to download `dsp-factory.json`. This file contains all nodes, connections, positions, settings, labels, and planet assignments. Load it back at any time with the **Load** button.

### Share Link

Click **Share link** to encode your entire factory into a URL. The link is copied to your clipboard automatically. Anyone who opens it sees your exact canvas layout, including all nodes, connections, and planet assignments.

Share links work without any server or account. The factory data lives entirely in the URL.

### Text Export

In the Analysis tab, the **Copy to clipboard** and **Download .txt** buttons produce a plain-text summary of your factory:

- All output items and their rates per minute
- All raw material inputs and their rates per minute
- Machine counts grouped by type
- Power generation, consumption, and balance

This is useful for posting your factory plan in the DSP Discord, Steam discussions, or Reddit without needing to share a link.

---

## Visual Language

### Connection Colors

Connection lines are colored by item carried. Their health tint changes based on the upstream node's efficiency:

- Green: efficiency at 90% or above
- Amber: efficiency between 50% and 89%
- Red: efficiency below 50%

Belt connections use load percentage instead of efficiency for their health tint.

### Node Cards

Each node shows:
- Header with the node name (or your custom label) and a count badge
- Input ports (teal, left side) and output port (gold, right side)
- Live stats: per-ingredient supply bars, output rate, and an efficiency bar
- A left border accent colored to the item being output

### Highlights

Selecting a node applies a three-layer blue glow. Clicking a warning or node entry in the Analysis tab pans to that node and plays a 2-second amber pulse animation. Clicking a Bottleneck Summary card highlights all nodes in that efficiency group at once.

---

## Controls Reference

### Canvas Navigation

| Action | Control |
|--------|---------|
| Pan | Middle mouse button drag, or Alt plus left-click drag |
| Zoom | Scroll wheel (toward cursor), or + / - buttons in bottom-left |
| Fit all nodes | Click Fit view in the header |
| Add node | Right-click empty canvas, or click/drag from Nodes tab |

### Node Interactions

| Action | Control |
|--------|---------|
| Move node | Left-click drag on the node body or header |
| Select node | Left-click |
| Edit properties | Select node, then open Properties tab |
| Delete node | Click X on node header, or select and press Delete |
| Rename node | Properties tab, Name field at the top |

### Multi-Selection

| Action | Control |
|--------|---------|
| Box select | Left-click drag on empty canvas |
| Add to selection | Shift plus left-click |
| Move all selected | Left-click drag any node in the group |
| Delete all selected | Delete or Backspace |
| Clear selection | Click empty canvas, or press Escape |

### Connections

| Action | Control |
|--------|---------|
| Draw connection | Left-click drag from output port to input port |
| Select connection | Left-click the line |
| Delete connection | Select and press Delete; or right-click and choose Delete connection |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Delete or Backspace | Delete selected node(s) or connection |
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
| Conveyor Belt Mk.I | 2x Iron Ingot + 1x Gear, outputs 3 |
| Conveyor Belt Mk.II | 3x Belt Mk.I + 1x EM Turbine, outputs 3 |
| Conveyor Belt Mk.III | 3x Belt Mk.II + 1x Super-Mag Ring + 1x Graphene, outputs 3 |
| Sorter Mk.I | 1x Gear + 1x Circuit Board |
| Sorter Mk.II | 2x Sorter Mk.I + 1x Electric Motor, outputs 2 |
| Sorter Mk.III | 2x Sorter Mk.II + 1x EM Turbine, outputs 2 |
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

## Technical Notes

- **No dependencies:** vanilla JavaScript with no frameworks, no npm packages, and no build step required to open and use
- **Module structure:** the application is split into focused ES module files (data, state, calculation, rendering, events, persistence) loaded natively by the browser
- **Topological sort:** recalculation walks nodes in dependency order so downstream nodes always calculate after their upstream sources settle
- **Demand-weighted splitting:** belt output is divided among consumers by demand ratio, not split evenly
- **Coordinate systems:** the canvas uses a CSS transform camera; node positions are in world space; SVG edges are drawn in screen space
- **Save format:** plain JSON, human-readable, easy to back up or version-control
- **URL sharing:** factory data is base64-encoded directly into the URL with no server involvement

---

## Acknowledgements

Built for players of [Dyson Sphere Program](https://store.steampowered.com/app/1366540/Dyson_Sphere_Program/) by Youthcat Studio.

Recipe data sourced from the [DSP Wiki](https://dsp-wiki.com), the [Fandom Wiki](https://dyson-sphere-program.fandom.com), and community guides on the [Steam Workshop](https://steamcommunity.com/app/1366540/guides/).
