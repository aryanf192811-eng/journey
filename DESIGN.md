---
name: Journey Intelligence Command Engine
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0d1c2e'
  on-tertiary-container: '#77859a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#d5e3fc'
  tertiary-fixed-dim: '#b9c7df'
  on-tertiary-fixed: '#0d1c2e'
  on-tertiary-fixed-variant: '#3a485b'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  tabular-data-lg:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  tabular-data-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-caps:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-regular:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers an operational command center for multimodal railway journey logistics. Moving decisively away from the consumer travel agency aestheticâ€”defined by commercial clutter, artificial urgency banners, and saturated promotional gradientsâ€”this system establishes an ethos of quiet precision, deep transit intelligence, and infrastructural authority akin to institutional financial terminals and mission-critical logistics software.

The visual style is **Precision Analytic Functionalism**:
- **Utilitarian Elegance**: Information density balanced with rhythmic breathing space, crisp structural lines, and exact metadata alignment.
- **Cognitive Deceleration**: High-stress multi-leg transit transitions are rendered with clear probabilities, tabular timeline alignments, and unambiguous connection risk modeling.
- **Sovereign Reliability**: Grounded in deep slate and neutral whites, avoiding whimsical decoration, blur filters, or artificial neon accents. The UI recedes into the background so the operational status of trains, platforms, buffer margins, and contingency routes remains immediately legible.

## Colors

The palette is strictly calibrated for maximum optical clarity, low visual fatigue over extended analytical sessions, and deterministic status evaluation.

### Canvas & Structural Surfaces
- **Canvas Base**: `#F8FAFC` (Slate-50) â€“ Clean, soft slate surface providing calm contrast against primary data containers.
- **Card / Surface Container**: `#FFFFFF` (Pure White) â€“ The primary data container elevation, crisp and grounded.
- **Subsurface / Inset Table Row**: `#F1F5F9` (Slate-100) â€“ For sub-headers, timeline bars, and segmented filters.
- **Borders & Dividers**: `#E2E8F0` (Slate-200) for standard layout grids; `#CBD5E1` (Slate-300) for interactive control boundaries and focus rings.

### Typography & Content
- **Primary Text**: `#0F172A` (Slate-900) â€“ High-contrast neutral for key identifiers, train codes, departure times, and destination headings.
- **Secondary Text**: `#475569` (Slate-600) â€“ Subtext, platform metadata, operator handles, and leg summaries.
- **Muted / Tertiary Text**: `#64748B` (Slate-500) â€“ Field labels, table column headers, and tabular unit indicators.
- **Disabled Text**: `#94A3B8` (Slate-400) â€“ Inactive routes and terminal historical segments.

### Operational Semantic Badges & Signals
Never use gradients or high-saturation fills for operational alerts. All badges adhere to a restrained three-layer tint model (50 tint background, 200 outline border, 800 high-contrast text):
- **Viability / Low Risk (Optimal)**:
  - Background: `#ECFDF5` (Emerald-50)
  - Border: `#A7F3D0` (Emerald-200)
  - Text / Glyph: `#065F46` (Emerald-800)
- **Moderate Risk / Transfer Alert (Cautionary)**:
  - Background: `#FFFBEB` (Amber-50)
  - Border: `#FDE68A` (Amber-200)
  - Text / Glyph: `#92400E` (Amber-800)
- **High Risk / Unviable Leg (Critical)**:
  - Background: `#FFF1F2` (Rose-50)
  - Border: `#FECDD3` (Rose-200)
  - Text / Glyph: `#9F1239` (Rose-800)
- **Uncertain / Historical Heuristic (Neutral)**:
  - Background: `#F1F5F9` (Slate-100)
  - Border: `#CBD5E1` (Slate-300)
  - Text / Glyph: `#334155` (Slate-700)
- **Active Navigation / Operational Node (Informational)**:
  - Background: `#F0F9FF` (Sky-50)
  - Border: `#BAE6FD` (Sky-200)
  - Text / Glyph: `#0369A1` (Sky-700)

## Typography

The design system specifies **Geist** across all roles to achieve consistent geometric legibility and technical rigor. 

### Tabular Formatting
To prevent layout jitter and align transit metrics across comparison matrices:
- All numerical outputs (PNR numbers, train IDs, delay deltas, platform indexes, transit times, buffer minutes, and arrival/departure timestamps) must enforce font feature settings: `font-feature-settings: "tnum" 1, "cv05" 1, "zero" 1`.
- The `label-caps` style is used exclusively for functional subheadings, station codes (e.g., `NDLS`, `CSMT`, `SBC`), data column keys, and state indicators. It renders in uppercase with positive letter spacing (`0.06em`).

## Layout & Spacing

The layout is structured around an analytical 12-column responsive fluid grid designed to display concurrent data streams (e.g., journey itinerary, route topology, live delay telemetry, and connection matrices).

### Layout Rules
- **Desktop (â‰¥ 1280px)**: 12-column grid with a strict maximum container width of `1600px`. Spacing leverages `margin-desktop` (40px) and `gutter-desktop` (24px). It supports a persistent split-pane model: 4 columns for multimodal parameters and filters, 8 columns for interactive route contingency maps and live itinerary runs.
- **Tablet (768px â€“ 1279px)**: 8-column layout with `margin-tablet` (24px) and 16px gutters. Analytical sidebars collapse into a persistent horizontal command bar.
- **Mobile (< 768px)**: Single-column vertical stream with `margin` (16px) and 12px gutters. High-density data tables transform into horizontal segmented cards with fixed tabular alignment.

### Spacing Principles
Component internals prioritize functional breathing room over compactness:
- Form field and card padding enforce `space-md` (14px) vertically and `space-lg` (20px) horizontally.
- Sub-element spacing (such as icon-to-label offsets or time-to-station associations) adheres strictly to `space-xs` (4px) or `space-sm` (8px) for direct semantic binding.

## Elevation & Depth

Visual hierarchy is maintained through **crisp low-contrast outlines and micro-tier surface contrast**, avoiding heavy drop shadows and blurry atmospheric glass effects.

### Structural Depth Tiers
- **Tier 0 (Base Canvas)**: Background rendered in `#F8FAFC`. Zero elevation.
- **Tier 1 (Surface Cards & Core Modules)**: Background `#FFFFFF`, encased in a razor-sharp 1px border of `#E2E8F0`. Shadow is strictly optical: `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Tier 2 (Interactive Flyouts, Platform Switch Overlays, Menus)**: `#FFFFFF` surface container, 1px border `#CBD5E1`, with elevation `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Tier 3 (Active Critical Interventions & Disruption Modals)**: `#FFFFFF` container with `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`.

### Border Discipline
Dividers inside cards and between connection legs utilize 1px solid `#F1F5F9`. Border lines provide the primary mechanism for spatial orientation and data clustering across route segments.

## Shapes

The design system enforces a **Soft Structural (Level 1)** geometric standard. This balance ensures UI elements feel engineered and architectural without the visual severity of brutalism or the consumer softness of pill-shaped interfaces.

- **Standard Elements (Buttons, Inputs, Badges, Metrics Tiles)**: `rounded` = `0.25rem` (4px).
- **Surface Containers (Cards, Modals, Analytical Panes)**: `rounded-lg` = `0.5rem` (8px).
- **Large Contextual Canvas Containers**: `rounded-xl` = `0.75rem` (12px).
- **Indicators / Status Dots**: Circular (`rounded-full`). Badges never use fully rounded pill curves; they maintain the structured 4px radius to preserve the professional dashboard tone.

## Components

All components are rendered using clean outline iconography (1.5px stroke width Lucide/Heroicon SVGs) paired with crisp typography.

### Buttons & Interactive Triggers
- **Primary Operational Action**: Solid `#0F172A` background, pure white text, 4px border-radius, `height: 38px`, padding `0 14px`. Hover state: `#1E293B`. Active: `#020617`. Focus ring: 2px offset with 1px solid `#0F172A`.
- **Secondary / Utility**: Surface `#FFFFFF`, border 1px solid `#CBD5E1`, text `#334155`. Hover state: background `#F8FAFC`, border `#94A3B8`.
- **Destructive / Cancellation**: Surface `#FFFFFF`, border 1px solid `#FECDD3`, text `#9F1239`. Hover state: `#FFF1F2`.

### Status Badges (Viability & Connection Risk)
Badges convey real-time route viability, buffer probability, and terminal transfer risk.
- **Form Factor**: Non-pill structure (4px radius), `height: 22px`, internal padding `2px 8px`. Font: `label-caps` (11px, weight 600).
- **Icon Integration**: Include a 12px leading SVG outline glyph indicating directional confidence (e.g., check-circle for optimal, alert-triangle for risk).
- **Color Logic**: Always pair an emerald, amber, or rose 50-tint surface with its corresponding 800-tint text and 200-tint border.

### Multi-Modal Journey Cards
- **Construction**: Surface pure white, 1px border `#E2E8F0`, 8px radius, `space-lg` (20px) internal padding.
- **Top Row**: Primary train identity (e.g., `12951 RAJDHANI EXP`), departure/arrival station codes in `headline-sm`, tabular operational departure times, and viability status badge anchored to the top-right.
- **Middle Section (Transit Graph)**: Vertical or horizontal route trace with step-down transfers (Metro link, station concourse walking buffer, second rail leg). Transfer buffers under 25 minutes automatically flag a `Moderate Risk` or `High Risk` badge.
- **Bottom Shelf**: Tabular breakdown of historical punctuality, platform change frequency, and dynamic buffer duration, delineated with a top border of 1px solid `#F1F5F9`.

### Data Inputs & Search Fields
- **Container**: Crisp `#FFFFFF` fill, 1px solid `#CBD5E1` border, 4px radius, `height: 40px`, padding horizontal 12px.
- **Typography**: Text rendered in `body-md` (`#0F172A`), placeholder in `#94A3B8`.
- **Station / Node Selector**: Includes dedicated station code tag prefix (e.g., `[NDLS]`) formatted in `label-caps` with `#F1F5F9` background and `#475569` text.

### Connection Risk Timeline Matrix
- A specialized component displaying transfer risk at junctions. 
- Features a dual-segment timeline bar: green segment indicating scheduled transit buffer, followed by a shaded amber or red band indicating historical route delay variance.
- Accompanied by micro-labels rendering exact tabular delta metrics (e.g., `+18m Hist. Delay`, `22m Buffer Remain`).

### Checkboxes & Segmented Controls
- **Checkboxes**: 16px square, 3px corner radius, 1.5px border `#94A3B8`. Checked state: `#0F172A` fill with a sharp white checkmark.
- **Segmented Route Filter**: Slate-100 container (`#F1F5F9`) with 4px inner items. Selected segment utilizes `#FFFFFF` surface with 1px border `#CBD5E1` and subtle micro-shadow, maintaining immediate state contrast.