# Tactical Simulation Engine — Scene & Object Feature Analysis

> **Analysis Date:** 2026-09-16  
> **Source Frame:** `image.png` (North Atlantic Operational Theater)  
> **Viewport Coordinates:** ~35°N to 48°N Latitude, -78°W to -50°W Longitude  
> **Visual Archetype:** High-Contrast Cyberpunk Retro-Vector Holographic Earth  
> **Underlying Stack:** Three.js (WebGL), React 18, TypeScript, Tailwind CSS  

---

## 1. Executive Scene Overview

The analyzed frame captures a close-up, high-angle **isometric perspective** over the **North Atlantic / Canadian Maritime Littoral Theater**, positioned between the United States Eastern Seaboard and Eastern Canada. 

The environment combines a curved procedural planetary vector globe, geodesic tactical gridlines, strategic naval base stencil overlays, active shipping lane corridors, and an ensemble of 3D wireframe combatants representing diverse multi-domain factions (USA, Russia, China, UK, Canada, and NATO).

```
                      [ATMOSPHERIC LUMINOUS RIM]
                  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ◎ CFB HALIFAX ATLANTIC (Canadian Base Marker)
       [Small Amber]  [Purple GBR]   /\  /\  /\ [Amber Squad]
              \          |          /  \/  \/  \
   ---[Dashed Shipping Lane]---+----------------+---------\
                              /                  \         \
             [Cyan USA Delta]/  [Blue NATO Box]   [Red OPFOR] \   [Cyan US Carrier]
             (Active Vectors)                                  \  (With Bearing Ring)
                                                                \
  [NORFOLK NAVAL] BASE
     [Emerald CAN & Amber Sub]
```

---

## 2. Comprehensive Object-by-Object Breakdown

| Object ID / Label | Geometric 3D Shape | Hex Color & Faction | Selection Mode | Overlays & Indicators | Tactical Capabilities & System Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **USS Gerald R. Ford Class Combatant** *(Far Right)* | Elongated rectangular box hull (`4.8 x 0.6 x 1.6`) with elevated starboard island structure (`0.8 x 1.2 x 0.4`) and vector deck line | `#06b6d4` (Cyan)<br>**USA / US Navy** | • Raycast 2.4-unit sphere<br>• Click to select<br>• Shift-Click multi-select<br>• Auto-Iso lock target | • Concentric bearing marker ring (`RingGeometry` r: 1.4-1.6)<br>• Proximity to dashed maritime lane | • Surface Naval Dominance<br>• AN/SPY-6(V)1 AESA radar (550 km range)<br>• EMALS catapult launch system<br>• AI Mode: Fleet Air Defense / Patrol |
| **Hostile Subsurface / Strike Unit** *(Right-Center)* | Compact faceted wireframe box / cross-braced cube with internal structural diagonals | `#ef4444` (Crimson)<br>**RUS / OPFOR** | • Raycast click target<br>• Highlight on hover<br>• Inspect in Command Mode | • Extended red heading/velocity vector line (tail needle)<br>• Proximity to waypoint node | • Fast Attack ASW / Reconnaissance<br>• Low-acoustic signature stealth<br>• Passive sonar listening array<br>• AI Mode: Acoustic shadowing / Standoff |
| **Amber Combat Strike Formation** *(Center Cluster)* | Triple pyramidal / coned wireframe hulls with elevated masts and triangular wireframe trusses | `#f97316` / `#f59e0b` (Amber)<br>**CHN / PLA Navy / Alert** | • Individual unit click<br>• Multi-unit box selection<br>• Roster card selection | • Trajectory waypoint path (green-cyan great-circle line intersecting cluster)<br>• Multi-track formation | • Multi-mission surface combatants<br>• Universal VLS cells (hypersonic anti-ship missiles)<br>• Phased array surveillance (480 km)<br>• AI Mode: Coordinated Area-Denial |
| **Royal Air / Maritime Unit** *(Upper-Left of Center)* | Faceted polyhedron / octahedron with diagonal structural cross-ribs | `#a855f7` (Violet / Magenta)<br>**GBR / Royal Forces** | • Raycast hit-sphere<br>• Direct globe click<br>• Tactical Inspector target | • Elevated altitude offset<br>• Directly above dashed maritime airway corridor | • Airborne early warning / air superiority<br>• Meteor BVRAAM long-range intercept<br>• Link-16 secure allied tactical data exchange<br>• AI Mode: QRA North Intercept |
| **NATO / Allied Tactical Node** *(Center-Left, behind Delta)* | Compact cubic wireframe box with internal isometric cross-braces | `#3b82f6` (Royal Blue)<br>**NATO / Joint Force** | • Interactive click selector<br>• Command panel bind | • In-line with green tactical waypoint line<br>• Escort spacing | • Command, Control & Communications (C3)<br>• Distributed sensor fusion relay<br>• Allied tactical datalink node<br>• AI Mode: Secure Network Escort |
| **US Tactical Delta-Wing / Cruiser** *(Center-Left)* | Triangular swept delta-wing / sharp coned bow with tall vertical mast and cross-frame lines | `#06b6d4` (Bright Cyan)<br>**USA / 5th Fleet** | • Direct click<br>• Auto-Iso view toggle<br>• Waypoint queue target | • Green-cyan trajectory route passing through center<br>• Internal vertical vector indicator tick (`#a855f7`) | • Aegis multi-target engagement<br>• SPY radar tracking grid<br>• Cruise missile strike & ASW patrol<br>• AI Mode: Autonomous Carrier Escort |
| **High-Latitude Amber Asset** *(Upper-Left)* | Faceted wireframe octahedron / reconnaissance platform | `#f59e0b` (Warm Amber)<br>**Surface / Coastal Patrol** | • Raycast hit-sphere<br>• Tactical Roster selection | • Hovering on maritime transit corridor | • Coastal reconnaissance / maritime picket<br>• Optical and SIGINT tracking<br>• AI Mode: Transit surveillance |
| **Canadian Patrol & Escort Pair** *(Lower-Left)* | Dual composite: Emerald green box hull paired with amber pyramidal wireframe mast | `#10b981` (Emerald)<br>& `#f97316` (Amber)<br>**CAN / Canadian Armed Forces** | • Direct click<br>• Inspector vitals display | • Located directly above "NAVAL BASE" label<br>• Shoreline littoral standoff | • Arctic / North Atlantic sovereignty patrol<br>• Magnetic Anomaly Detection (MAD)<br>• Sonobuoy barrier laying<br>• AI Mode: Littoral harbor defense |

---

## 3. Environmental Overlays & Geospatial Geometry

### A. Strategic Base Markers & Stencils
1. **`◎ CFB HALIFAX ATLANTIC` (Top Center)**:
   - **Position**: 44.6°N, -63.5°W (Canadian Forces Base Halifax, Nova Scotia).
   - **Visual Styling**: Glowing cyan (`#38bdf8`) monospace military stencil lettering with an outer circular bullseye target marker (`◎`) consisting of an outer 6px stroke ring and a solid 2.5px center pip.
   - **Function**: Anchors tactical Allied operations in the North Atlantic; designates primary deep-water naval anchorage and maritime patrol aircraft airbase.

2. **`[NORFOLK NAVA]L BASE` (Lower-Left)**:
   - **Position**: 36.9°N, -76.3°W (Naval Station Norfolk, Virginia).
   - **Visual Styling**: Large, perspective-blurred glowing cyan stencil typography rendered on the surface plane, demonstrating dynamic camera depth-of-field and focus attenuation.
   - **Function**: Identifies the primary Atlantic Fleet homeport and headquarters for US Fleet Forces Command.

### B. Trajectory & Navigation Overlays
1. **Great-Circle Mission Trajectory (Luminous Green-Cyan Line)**:
   - Connects the central combatants along an active waypoint flight/patrol path.
   - Dynamically calculated via spherical interpolation (Slerp / lat-lon great circle math).
   - Serves as the route spine for multi-waypoint patrol doctrine.

2. **Velocity & Heading Vector Needles**:
   - **Red Vector Line**: Emanates from the red OPFOR unit, indicating directional travel speed and projected bearing.
   - **Vertical/Lateral Vector Pointers**: Show roll, pitch, and altitude climb/descent rate relative to the spherical geoid.

3. **Commercial Maritime Shipping Corridor (Dashed White Lines)**:
   - Segmented great-circle arcs (`dashSize: 3`, `gapSize: 2`) representing the high-density North Atlantic trade lane (Rotterdam/London to New York/Halifax).
   - Highlights civilian vessel density versus military exclusion zones.

4. **Tactical Bearing Reticle (Under US Carrier)**:
   - Flat double-sided circular ring (`RingGeometry(1.4, 1.6, 16)`) rendered at ocean elevation.
   - Provides immediate visual bearing orientation (000° to 360°) and footprint scale.

5. **Geodesic Tactical Wireframe Sphere**:
   - Semi-transparent icosahedron wireframe grid (`R * 1.002`, frequency 3, opacity 0.18) layered above the ocean texture.
   - Gives the planet its signature cyberpunk retro-CRT holographic appearance.

6. **Atmospheric Horizon Glow Arc (Top Rim)**:
   - Elevated wireframe spherical shell (`R * 1.035`) projecting a vibrant turquoise rim gradient along the planetary horizon.
   - Delineates near-Earth sub-orbital airspace from orbital low-Earth satellite space.

---

## 4. Interaction & Selection Architecture

### 1. High-Precision Raycasting
- Each entity group encapsulates an invisible `SphereGeometry(2.4, 8, 8)` hit-mesh with minimal opacity (`opacity: 0.001`, `depthWrite: false`).
- Prevents clicking frustration on slender wireframe lines and allows instantaneous cursor ray intersection.

### 2. Auto-Iso Camera Zoom (`AUTO-ISO`)
- When enabled in the simulation toolbar, clicking any unit in this scene automatically swings the camera orbit to:
  - **Elevation (RotX)**: `0.615 rad` (~35.26°)
  - **Azimuth (RotY)**: `0.785 rad` (~45.00°)
  - **Camera Distance**: `55 units` (Surface/Air) or `85 units` (Space)
- Smoothly tracks the unit's spherical coordinate transform as it maneuvers along its trajectory.

### 3. Multi-Select & Command Queueing
- **Shift + Click**: Toggles additional units into the active selection set without dropping previous targets.
- **Sequential Mission Dispatch**: When units are selected, the right-hand panel exposes:
  - Vitals monitoring (Hull integrity, reactor power, fuel reserves, magazine loadout).
  - Subsystem status toggles (Engines, Radar, Comms, Weapons, Electronic Warfare).
  - Mission instruction queueing (`PATROL_WAYPOINTS`, `SHADOW_TARGET`, `EMCON_ALPHA`, `INTERCEPT`).

### 4. Solo Asset Isolation Mode (`SOLO VIEW`)
- **Action**: Toggled via the top action ribbon, asset roster headers, asset card buttons, or the bottom simulation HUD.
- **Behavior**:
  - Hides all other units, vessels, and non-selected assets from the 3D globe in real-time.
  - By default, automatically suppresses mission vector lines, waypoints, decision branch markers, and range rings so that **only the selected asset** is visible without visual clutter.
  - Dedicated sub-toggles on the Solo HUD banner (`VECTORS: ON/OFF` and `RANGE: ON/OFF`) let operators selectively re-enable or hide mission trajectories or the tactical range ring while remaining in Solo mode.
  - Keeps the entire roster list searchable and selectable in the right-hand panel, allowing instant switching between individual isolated units.
  - Can be paired with **`AUTO-ISO`** for focused, clutter-free tactical inspection of individual vessel geometries, heading vectors, and vitals.
  - Provides a floating overlay banner with one-click **`RESTORE ALL ASSETS`** to immediately bring all theater forces back onto the globe.

### 5. Interactive 3D Mission Waypoints & Decision Branches
- **Identification of Scene Elements Around Selected Asset**:
  - **Amber Diamonds / Waypoint Markers**: 3D Mission Plan Waypoints projected onto the globe surface and altitude layers, connected by cyan/amber dashed trajectory lines.
  - **Color-Coded Branch Cubes (Red / Blue / Purple)**: Tactical Decision Rule branches (e.g. `RETALIATE`, `EMCON_SILENT`, `EVADE`, `SCRAMBLE_INTERCEPTORS`) that trigger under operational criteria (e.g. `SURVEILLANCE_RADAR_LOCK`, `CRITICAL_DAMAGE`, `RADAR_EMISSION_SPIKE`).
  - **Concentric Bearing / Range Ring**: Tactical radar detection and weapon engagement perimeter around the selected combatant.
- **Full 3D Interactivity & Raycasting**:
  - All waypoints and decision branch boxes are equipped with high-precision raycast hit-targets.
  - **Hover Tooltips**: Dynamically identify each waypoint (`WP 1: INFILTRATE CHOKEPOINT PASSAGE`) or decision branch (`BRANCH: CONFOUND (RADAR LOCK DETECTED)`).
  - **Click-to-Inspect**: Clicking any waypoint or branch marker in 3D opens a dedicated Tactical Inspector Popover right on the canvas with operational details and status.
  - **One-Click Removal / Hiding**: Operators can delete individual waypoints, remove decision branches, toggle off all vectors (`HIDE ALL VECTORS` / `VECTORS: OFF`), or jump straight into `COMMAND MODE` to re-author objectives.

---

*Document compiled for interactive code inspection in AI Studio Build.*
