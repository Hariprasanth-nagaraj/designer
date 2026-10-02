# Benchmark 6 — SMB service-business operations

**Fixed brief.**

Design the day view for a small field-services business (18 staff: plumbers and
electricians) run by an owner who is also the dispatcher. Jobs come in by phone, get
scheduled to a technician and a vehicle, and must be invoiced.

Must support: see today's jobs; assign a technician; reschedule when someone calls in
sick; record work done and materials used; capture a signature; and issue the invoice.

## Why this brief
Tests the messiest real-world case: offline, phone-first, many roles, partial data,
money, and physical reality. Tests whether the system produces an honest design
("unknown is shown as unknown") rather than a clean demo.

## Rubric
| Dimension | What to look for |
|---|---|
| Product reasoning | Does it model the owner as dispatcher, not as an admin? |
| IA | Job as the primary entity; technician, vehicle, customer as its context? |
| Colour | Utilitarian, high legibility, outdoors? |
| Typography | Large enough to read on a phone in a van? |
| Density | Phone-first, not desktop-shrunk? |
| States | Sick cover, partial job, no signature, offline, unpaid — all modelled? |
| Flow | New job → assign → complete → mat
