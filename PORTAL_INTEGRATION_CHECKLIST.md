# CampusBite — school integration checklist

This project is being prepared as a student-led proposal and pilot demonstration. The school must approve access to student identity data, payment collection, and cafeteria operations before live use.

## Information needed from the school's IT team

1. Portal technology and the team/contact responsible for it.
2. Whether the portal can issue a short-lived signed SSO handoff token (recommended) or provide an approved OIDC/SAML integration.
3. Stable student identifier, verified student name, and whether student status can be checked on every session.
4. How cafeteria staff and administrators are identified and assigned roles.
5. Whether the school already has a payment provider or approved Paystack merchant account.
6. Menu, prices, service hours, refund rules, and collection counter workflow.
7. Thermal printer model, connection type, paper width (58mm/80mm), and the computer used at the counter.

## Pilot acceptance tests

- Student opens CampusBite from an authenticated school portal without another password.
- Student cannot change their identity or grant themselves staff/admin access.
- Two different devices see the same menu and orders.
- A payment is credited only after the payment provider confirms it server-to-server.
- Duplicate payment webhooks do not credit a wallet twice.
- Checkout uses current database prices and creates one debit and one order atomically.
- A student can see only their own wallet and orders.
- Staff can find an order by collection code/receipt number and see item details.
- Only Ready orders can be collected; a collected order cannot be collected again.
- Receipt and kitchen ticket print correctly on the school's actual printer.
- Refund, failed payment, network interruption, and end-of-day reconciliation procedures are agreed.

## Demo safety

Use fictional student records and test payments only. Do not add real student data, production credentials, or live payment keys to the repository or browser environment. The preview role switch and local browser data are demonstration-only.
