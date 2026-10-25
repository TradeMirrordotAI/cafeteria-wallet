# CampusBite × Anchor University Portal — SSO Integration Proposal

**Portal supplied for integration planning:**
- Login: https://portal-prod.aul.edu.ng/login
- Dashboard: https://portal-prod.aul.edu.ng/dashboard

## What was verified

The public dashboard URL redirects an unauthenticated visitor to the portal login page. The public pages do not disclose the portal framework, identity provider, API, SSO protocol, or any integration documentation. No attempt has been made to bypass login or inspect private student data.

## Recommended student journey

1. Student signs in to the existing university portal.
2. The portal displays a `Cafeteria` link or tile.
3. The portal's backend creates a short-lived, single-use authorization code for that student and redirects the browser to CampusBite's registered callback URL.
4. CampusBite's backend exchanges that code directly with the portal backend over HTTPS.
5. The portal returns a verified identity assertion containing a stable internal student identifier, display name, student number, and active/inactive status.
6. CampusBite maps that identity to its own profile and creates a CampusBite session.

Students should not be asked to create a second password. CampusBite must not accept a student number or role sent only in browser query parameters as proof of identity.

## Preferred integration options (in order)

1. **OpenID Connect (OIDC):** Authorization Code flow, server-side token exchange, signed ID token, validated issuer/audience/signature/expiry/nonce/state. Use the university's identity provider if available.
2. **Signed one-time handoff:** Portal backend issues a cryptographically random, short-lived, one-use code. CampusBite backend exchanges it server-to-server. The code must be bound to the intended redirect/client and expire quickly (e.g. 60–120 seconds).
3. **SAML 2.0:** Acceptable if this is the university's existing supported SSO standard; validate signatures, audience, recipient, timestamps, and replay protection.

Do not implement a home-made unsigned JWT, a static student ID URL, shared browser secret, or long-lived token in localStorage.

## Information requested from University ICT

- Who administers the portal and can approve a pilot integration?
- What technology / identity provider does the portal use?
- Does it support OIDC, SAML, or a signed server-to-server handoff?
- Can ICT provision a test student and test staff identity?
- Which immutable student identifier should CampusBite store? Can ICT provide verified name, matric/student number, and current student status?
- Can the portal add a Cafeteria tile/link and register a CampusBite callback URL?
- What is the approved process for staff identities and cafeteria/admin role assignment?
- Is there an existing approved payment provider or merchant account, or should the pilot use test mode first?

## Security requirements

- All identity assertions are validated server-side; never trust browser-supplied profile fields.
- Use HTTPS, exact redirect URI allowlists, state/nonce validation, short expiry, one-time code redemption, and replay protection.
- Provision cafeteria/admin roles only through an ICT-approved process; students cannot self-assign roles.
- Store only the minimum student data needed for orders and receipts.
- Log sign-in and staff collection actions; restrict access by role and keep an audit trail.
- Obtain school approval for student data processing, payment collection, retention, refunds, and support procedures.

## CampusBite callback placeholders

After deployment, ICT will need these values from the project owner:

- CampusBite base URL: `https://<approved-campusbite-domain>`
- Callback URL: `https://<approved-campusbite-domain>/auth/portal/callback`
- Logout/return URL: `https://<approved-campusbite-domain>/`
- Requested scopes/claims: stable student ID, verified name, student number, active status; staff role only if ICT authorizes it.

These are proposed paths, not active endpoints. They must be registered and implemented after ICT confirms the portal's supported protocol.

## Current implementation status

The supplied CampusBite build contains the student/staff demo, Supabase schema and secure database-operation foundations. It does **not** yet authenticate against Anchor University's portal, and the supplied public pages do not provide enough information to implement a real SSO exchange. The SSO callback and portal credentials must not be fabricated. Keep the demo role switch and sample student data out of production.
