# Benchmark 2 — Clinic scheduling and operations

**Fixed brief.**

Design the scheduling screen for a multi-provider outpatient clinic (6 clinicians, 3
rooms). Reception staff book and reschedule daily; clinicians confirm; managers
reconcile. Most bookings are made on a phone, by someone standing at a counter while a
patient waits.

Must support: a day/week schedule; finding a free slot; locating or creating a patient;
booking; rescheduling; contacting the patient; cancelling; and seeing the day's state
without opening anything else.

## Why this brief
Tests the reference-library coverage gap (no clinical brand system exists in the
vendored library) and tests whether the system admits the gap instead of borrowing a
fashionable answer. Also tests high error-cost + multi-role + mixed device.

## Rubric
| Dimension | What to look for |
|---|---|
| Product reasoning | Does it respect that reception is interrupted and on a phone? |
| IA | Provider vs room vs patient — is the entity model right? |
| Colour | Warm, human, calm — but not childish. Trust expressed through clarity? |
| Typography | Legible at arm's length on a counter? |
| Density | Does it adapt by device, or just shrink? |
| Geometry | Soft but not playful? |
| States | Double-booking, no-show, cancellation, permission-denied — all present? |
| Flow | Book → confirm → contact → cancel → schedule reflects it? |
