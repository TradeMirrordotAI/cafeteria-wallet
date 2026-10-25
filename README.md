# CampusBite — School Cafeteria Ordering & Wallet

CampusBite is a focused cafeteria ordering system designed to reduce queues by letting students order and pay before reaching the cafeteria. Staff use a separate counter workflow to find, prepare, print and hand over orders.

## Current build

- Student experience: browse available meals, add items to a cart, place a sample order, view order history, and print an itemized receipt with a collection code.
- Cafeteria experience: search orders by collection code or receipt number, inspect student and item details, print a receipt/kitchen ticket, and move an order through Paid → Preparing → Ready → Collected.
- Duplicate collection guard in the demo: a collected order cannot be collected again; collection is only allowed after the order is marked Ready.
- Admin preview: toggle menu availability.
- Demo data is saved in this browser using localStorage, so refreshing the page does not immediately erase the demo's orders, menu availability or sample wallet balance.
- Supabase schema plus a second migration for receipt metadata and order-event history.

## Important: demo versus live operation

This build is a functional front-end demonstration, not yet a live cafeteria payment service. The role selector is a demonstration switch, not access control. Demo wallet funding does not move money. Orders created in demo mode are stored only in the current browser and are not visible to another computer or staff counter.

Do not deploy this demo as a live payment or collection system until the backend and school identity integration below are complete.

## Run locally

1. Install Node.js 20 or newer.
2. Extract the ZIP and open a terminal in this project folder.
3. Run `npm install`.
4. Run `npm run dev` and open the local URL shown by Vite.
5. Use the Preview as selector to demonstrate Student, Cafeteria staff and Admin views.

## School portal integration — no second student password

The intended student experience is to open CampusBite from the existing school portal. CampusBite should not ask students to create another password or type an identity that the browser simply trusts.

Recommended integration:

1. The student signs in to the school's existing portal as usual.
2. The portal backend creates a short-lived, signed, one-time handoff token containing the verified student identifier and permitted claims.
3. CampusBite's backend validates that token, checks expiry and replay, maps the student to a CampusBite profile, and issues a scoped application session.
4. Staff and administrators receive their own portal-verified staff roles. A student must never be able to switch their role to staff/admin from the browser.

This is single sign-on, not a second student login. A trusted session is still required so the backend can enforce permissions and protect student records.

## Before a real school pilot

- Connect Supabase and apply migrations in order: `001_initial_schema.sql`, then `002_receipts_staff_workflow.sql`.
- Implement the portal SSO handoff and role provisioning on a trusted server/Edge Function. Migration 003 provides transactional wallet checkout, staff-only order transitions, and a service-role-only wallet credit function, but does not itself implement the school portal handoff or Paystack webhook verification.
- Replace all localStorage demo state with Supabase reads and server-side operations. Browser-local data is not shared between student and cafeteria devices. Wire the UI to `place_cafeteria_order` and `advance_cafeteria_order`; never enable the demo role selector in a live build.
- Use Paystack test mode for card and bank-transfer funding. Initialize payments on the server and credit wallet balances only after a verified, idempotent webhook.
- Store money as integer kobo. Debit wallet and create the order plus item snapshots in one database transaction.
- Generate unique collection codes and receipt numbers on the server, with database uniqueness constraints.
- Record every important status change in `order_events`.
- Redeem collection codes through an atomic server-side function. The function must reject already-collected, unpaid, cancelled or invalid orders and record the staff actor and collection timestamp.
- Staff screens must read from the shared database and use role-checked server functions. Never trust the role selector or a student ID sent from the browser.
- Configure the school's printer (80mm thermal printer recommended). The current print flow uses the browser print dialog; silent auto-print requires a managed kiosk/desktop setup and should be added only after the school confirms its printer environment.
- Add backups, monitoring, refund handling, staff training and a clear support contact before launch.

## Suggested pilot rollout

1. Demonstrate the student and cafeteria workflows with sample data.
2. Confirm menu, prices, opening hours, collection counter and printer with cafeteria management.
3. Test portal SSO with a small group of students and staff.
4. Run payment tests and duplicate-collection tests using Paystack test mode.
5. Run a supervised pilot before opening it to the whole school.

## Security notes

Never place Supabase service-role keys or Paystack secret keys in `VITE_` variables or browser code. Keep payment verification, wallet credit/debit, role checks, receipt/code generation and collection redemption on trusted server-side functions. Obtain school approval before importing student data or enabling real payments.


## What migration 003 adds

- `place_cafeteria_order(jsonb)`: authenticated student's wallet is locked, live menu prices are loaded server-side, order and item snapshots are created, and the wallet debit plus ledger entry happen in one transaction.
- `advance_cafeteria_order(uuid, order_status)`: cafeteria/admin-only, row-locked status transitions; collection is allowed only from Ready and cannot happen twice.
- `credit_wallet_from_verified_payment(uuid,bigint,text)`: service-role-only idempotent credit entry point for a webhook handler after Paystack signature and transaction verification. Do not call this directly from a browser.
- Staff order visibility and event-history read policies; profile self-updates are removed so users cannot promote their own role.

## Remaining before a real launch

This is a backend foundation, not a finished live deployment. The app UI still contains demo/localStorage flows. A real launch still requires the school's portal SSO contract and staff identity source, Supabase project credentials, Paystack account and verified webhook endpoint, production UI wiring, menu/student data approval, printer testing, and supervised acceptance testing. Do not collect real student funds or student records until the school authorizes the pilot.
