# CampusBite — Cafeteria Wallet & Ordering MVP

A small React + TypeScript + Vite starter for a school cafeteria ordering flow.

## What is included

- Student preview: wallet balance, menu, cart, order creation and collection code.
- Cafeteria preview: collection-code lookup and printable ticket.
- Admin preview: menu availability management.
- Supabase client setup and starter SQL schema.
- Responsive layout for laptop and desktop, with basic mobile responsiveness.

## Important: current state

This starter runs in **demo mode** until Supabase credentials are added. Demo wallet funding and checkout only change temporary browser state. They do not move real money, create secure database orders, or persist data.

The role switch is only for previewing the three interfaces. It is not authentication or access control.

## Run locally

1. Install Node.js 20 or newer.
2. Extract this project.
3. Open a terminal in the project folder.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite.

## Connect Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env`.
3. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or publishable key).
4. In Supabase SQL Editor, run `supabase/migrations/001_initial_schema.sql`.
5. Restart the Vite dev server.

The SQL is a starting schema, not a complete production security model. The next implementation step is authentication, profile provisioning, and server-side transactional functions.

## Before real payments

- Create a Paystack account and configure test keys on a trusted server/Edge Function.
- Initialize card or bank-transfer funding on the server.
- Credit the wallet only after verifying a successful Paystack webhook.
- Use idempotency/payment references so a webhook cannot credit the same deposit twice.
- Store wallet amounts as integer kobo, never floating-point naira.
- Debit wallet and create order + order items in one database transaction.
- Generate collection codes server-side with collision protection.
- Redeem codes through a trusted server function that atomically marks the order collected.
- Keep secret keys and Supabase service-role keys out of frontend environment variables.

## Suggested next build step

Implement Supabase authentication and real profile/wallet loading, then add the trusted wallet/order functions. After that, integrate Paystack test-mode funding and the cafeteria printer workflow.

## Receipt and portal integration notes

The demo now prints an itemized receipt suitable for an 80mm thermal printer or standard browser printing. It includes receipt number, date/time, student name/ID, payment reference, collection code, line items, total paid, and collection status. Printing is deliberately separate from marking an order collected.

**Important:** receipt/payment references and student IDs shown in demo mode are sample values only. Before a live pilot, integrate the school portal using a trusted server-verified SSO/session handoff. The app must not accept a student ID or role merely because the browser sends it. Issue receipt numbers and collection codes server-side, persist them in Supabase, verify Paystack payments using server-side webhooks, and use an atomic server-side operation to redeem collection codes exactly once. Never expose Supabase service-role keys or payment secrets in the frontend.
