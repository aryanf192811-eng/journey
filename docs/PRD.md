# PRD — India Journey Intelligence (working name)

## Problem
Indian travelers searching for train tickets on a busy route (e.g.
Vadodara → Muzaffarpur) routinely hit "no direct train available" or a
high waitlist, and are left to manually guess at alternate stations,
split journeys, or different dates. Existing tools (ConfirmTkt/ixigo)
help at a shallow level: same-train boarding-point shifts and a single
intermediate-station split, ranked mostly by one WL-confirmation
probability number, for one fixed date.

## Product thesis
Don't search for a train. Search for a **viable journey** — across a
date window, across multiple legs, across nearby origin/destination
stations — and rank candidates on two separate, explained axes
(journey quality, booking viability) instead of one opaque score.

## V1 users
Individual travelers booking long-distance IRCTC journeys who are
willing to consider break journeys when the direct route is full or
overpriced. Primary persona: budget-conscious student/family traveler,
books 30–60 days ahead, flexible by a few days.

## V1 scope (in)
- Single query: origin, destination, date **range** (not single date),
  budget ceiling, class(es), max transfers, passenger count.
- Search across all dates in the range, across direct + multi-leg
  (up to 3 legs / 2 transfers) journeys, using a static timetable graph
  (schedule data, not live seat availability, in V1 — see Non-goals).
- Temporal connection validation: reject/flag journeys where a
  transfer is impossibly tight or merely risky (green/yellow/red).
- Deterministic ranking: Pareto-filter dominated journeys, then rank
  survivors by fare/time/transfers/connection-safety. No ML in V1.
- Every result includes a plain-language "why this route" explanation.
- Destination/origin expansion shown as a labeled alternative, never
  silently substituted.
- Results page + detail page. No accounts required to search.

## V1 scope (out / explicitly deferred)
- Any booking automation, form-filling, or CAPTCHA interaction.
- Live seat availability / real-time fare data (needs an authorized
  data source or manual/periodic snapshot import — V1 ships with
  static schedule data + a `booking_viability` field the user can
  leave null/unknown rather than fabricate).
- ML-based viability prediction (needs historical outcome data first).
- Bus/flight legs (architecture supports it via `TransportProvider`,
  V1 ships railway-only).
- User accounts, saved trips, notifications (V1.1+).

## Non-goals (permanent)
- This is never a "book faster than other bots" tool. See CLAUDE.md
  hard boundaries.

## Success criteria for V1
- For a route/date-window with no direct train, the tool surfaces at
  least one genuinely viable 1–2 transfer journey a naive IRCTC search
  would not surface, with a correct connection-safety label.
- Every returned journey has a non-empty, accurate `whyThisRoute` list.
- Search over a 5-day window with a real timetable dataset (a few
  hundred trains) returns in under ~3s without a worker/queue (V1 can
  be synchronous; move to BullMQ background jobs only if this fails).

## Open questions to resolve before V1.1
- ~~What data source backs schedules/fares~~ — resolved 2026-09-25:
  schedules/fares stay static seed data; live seat availability comes
  from RailRadar's free-tier API (see CLAUDE.md), so `booking_viability`
  can now be real when a `RAILRADAR_API_KEY` is configured, and honestly
  falls back to `"unknown"` when it isn't.
