# CampusBite Pilot Readiness & Handover

## Purpose

A student-proposed digital cafeteria ordering and wallet service intended to reduce queues, simplify payment, and make meal collection traceable.

## Roles

### Student
- Enters through the existing university portal after ICT-approved SSO is connected.
- Views the live menu, availability, prices, and wallet balance.
- Funds wallet through an approved payment method.
- Places an order and receives a unique collection code and itemized receipt.
- Views order history and receipt status.

### Cafeteria staff
- Uses an ICT-provisioned staff account and role.
- Views paid orders and filters by status.
- Searches a collection code or receipt number.
- Moves orders through Paid → Preparing → Ready → Collected.
- Prints kitchen ticket / student receipt.
- Cannot collect an order twice; printing does not mark an order collected.

### Administrator
- Manages menu items, prices, availability, authorized staff, and operational reports.
- Reviews transactions and exceptions; does not edit historical receipt totals.

## Before a supervised pilot

- [ ] University management / ICT approves the pilot and student-data processing.
- [ ] ICT confirms SSO protocol and provides test identities and integration documentation.
- [ ] Production domain and HTTPS are configured.
- [ ] Supabase project is configured; migrations are reviewed and applied in order.
- [ ] Portal identity exchange is implemented server-side and tested.
- [ ] Staff accounts and roles are provisioned by an authorized administrator.
- [ ] Payment provider merchant account, webhook verification, refunds, and reconciliation are approved and tested.
- [ ] Menu, prices, operating hours, and refund/cancellation rules are confirmed by cafeteria management.
- [ ] Printer model, paper width, connection, and print layout are tested at the counter.
- [ ] Backups, monitoring, support owner, and incident process are agreed.

## Pilot test cases

1. Student signs in through portal and sees only their own profile, wallet, and orders.
2. Student A cannot access Student B's receipt or order by changing a URL.
3. Student cannot change their student ID or elevate their role in browser tools.
4. Unavailable meal cannot be purchased; checkout uses current database prices.
5. Failed, cancelled, and duplicate payment notifications do not credit wallet incorrectly.
6. Two devices see the same order and status updates.
7. Staff can locate an order by code and receipt number.
8. Paid → Preparing → Ready → Collected works; invalid transitions and repeat collection are rejected.
9. Printing a receipt or kitchen ticket does not change order status.
10. Receipt includes receipt number, student reference, itemized lines, quantities, prices, total, timestamp, payment reference, and collection code.
11. End-of-day totals reconcile with payment provider and wallet ledger.
12. Staff can follow agreed procedures for wrong orders, refunds, network outage, and printer failure.

## Demonstration limitations

Until the checklist is complete, use fictional student records and test payments only. The current project archive is a development/demo foundation, not a production-ready school deployment. In particular, the supplied public portal URLs do not establish the portal's SSO protocol or grant access to student records.
