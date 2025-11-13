# **App Name**: WiFly

## Core Features:

- Captive Portal UI: Display a responsive captive portal page with options for buying access via Stripe, redeeming voucher codes, and displaying session time remaining after login.
- Voucher Validation API: Expose an API endpoint (/api/validate-voucher) to check the validity of voucher codes against a PostgreSQL database or FreeRADIUS.
- Token Issuance API: Implement an API endpoint (/api/issue-token) to issue a signed JWT upon successful Stripe payment or voucher validation, including MAC address, expiry time, and plan information.
- Stripe Webhook Handler: Create a Stripe webhook handler (/api/webhook) to verify payments, generate vouchers/tokens, and store relevant information in the PostgreSQL database.
- FreeRADIUS Integration: Enable dynamic addition and revocation of vouchers in FreeRADIUS via the backend API, supporting JWT or voucher code integration for login authentication and session management with accounting.
- Grafana/Prometheus Monitoring: Offer monitoring endpoints for Grafana and Prometheus to track voucher issuance, login success/failure, session expiry, and other key metrics. LLM will act as a tool to identify these key metrics.

## Style Guidelines:

- Primary color: Cool blue (#4681f4) for trust and connectivity.
- Background color: Light blue (#eaf0fa), a desaturated version of the primary color.
- Accent color: Soft green (#8ad951) for calls to action.
- Body and headline font: 'Inter' for a clean, modern look. Its neutral appearance makes it versatile and easy to read.
- Use simple, intuitive icons for navigation and payment options.
- Design a clean, responsive layout that is easy to navigate on both desktop and mobile devices.
- Subtle animations for loading states and form submissions to improve user experience.