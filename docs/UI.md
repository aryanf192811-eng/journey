# UI.md — frontend spec (V1)

Stack: Next.js 14 App Router + TypeScript + Tailwind. No shadcn/ui
dependency required for V1 (adds setup weight); plain Tailwind
components are enough — revisit if the UI grows complex enough to
want a component library.

## Screens (V1)
```
/                  Search
/results/[id]      Journey Results (list, from a completed search)
/results/[id]/[journeyRank]   Journey Details ("why this route")
```
Deferred to later: `/compare`, `/saved-trips`, `/live-journey`, `/profile`
— all require accounts or state the PRD puts out of V1 scope.

## Screen: Search (`/`)
Single form, no multi-step wizard:
- Origin (autocomplete, hits `GET /api/stations/search`)
- Destination (autocomplete)
- Date range: two date pickers (from/to), not a single date
- Budget max (optional number input, ₹)
- Class checkboxes: SL, 3A, 2A, 1A, CC
- Max transfers: segmented control, 0/1/2
- Passengers: number input, default 1
- Submit → `POST /api/journeys/search` → redirect to `/results/[searchId]`

While waiting for the response (V1 is synchronous, so this is a single
loading state, not a progressive SSE checklist — that's a V1.1
upgrade once the backend actually streams): a loading skeleton with
one line of text, not a fake progress bar implying steps it isn't
actually doing yet.

## Screen: Journey Results (`/results/[id]`)
- Header: echoed query ("Vadodara → Muzaffarpur, 16–20 Nov, ≤₹2500")
- If `expandedOrigins`/`expandedDestinations` present: a dismissible
  banner — "No strong 0–2 transfer option found; showing N alternatives
  arriving within X km" — never silently mixed into the main list
  without this label.
- List of journey cards, each showing:
  - Route as station codes with arrows: `BRC → NDLS → MFP`
  - Total fare estimate, total duration, transfer count
  - Booking viability badge (High/Medium/Low/Unknown — grey for
    Unknown, never fabricate a color implying data that doesn't exist)
  - Connection risk badge (worst leg's color: green/yellow/red)
  - "View journey" → detail page
- Empty state (`journeys: []`): plain message, not an error — explain
  it's a genuinely constrained result (budget/date/transfer limits),
  with a one-line suggestion to loosen one constraint, and a button
  back to the search form with values pre-filled.

## Screen: Journey Details (`/results/[id]/[journeyRank]`)
- Full leg-by-leg breakdown: train number/name, departure/arrival
  station + time, class, fare
- Connection breakdown per transfer: buffer time + risk label +
  one-line reason (e.g. "1h05m at NDLS — moderate platform distance")
- **"Why this route"** section: render `whyThisRoute` as a checklist
  (✓ items) and `cautions` as a separate list (⚠ items) — this is the
  single most important trust-building element per the PRD; never
  collapse it into the card view, always keep it explicit here.
- No "Book now" button. If a booking CTA is ever added later, it
  should link out to the official IRCTC/booking portal, not attempt
  in-app automation (see CLAUDE.md boundaries).

## Component structure
```
apps/web/app/
├── page.tsx                          Search screen
├── results/[id]/page.tsx             Results list
├── results/[id]/[rank]/page.tsx      Journey detail
├── components/
│   ├── SearchForm.tsx
│   ├── StationAutocomplete.tsx
│   ├── JourneyCard.tsx
│   ├── ViabilityBadge.tsx
│   ├── ConnectionRiskBadge.tsx
│   └── WhyThisRoute.tsx
└── lib/
    ├── api.ts        fetch wrappers for apps/api
    └── types.ts       shared with apps/api's response shapes (keep in sync manually in V1; a shared package is a V1.1 nicety)
```

## Visual tone
"Travel command center," not an IRCTC clone — clean typographic
hierarchy, generous spacing, badges over raw numbers where a label is
clearer (High/Medium/Low beats "73.2%"). No dark patterns, no fake
urgency ("only 2 seats left!" style copy) — the whole point of this
product is being more honest than the incumbents about what it does
and doesn't know.
