# UV Eventz ERP — Connected Starter v0.6

A maintainable front-end starter for an event management ERP focused on weddings and family functions.

## Current status
- Responsive black-and-gold dashboard prototype
- Supabase email/password sign-in and sign-out using the project publishable key
- Workspace membership lookup for the signed-in user
- New enquiry form saves a customer and enquiry to Supabase
- Sample metrics, upcoming events, enquiry follow-ups, pipeline and financial snapshot
- Navigation placeholders for future modules
- New-enquiry modal connected to cloud saving
- Print/export summary action (`window.print()`)
- Initial Supabase PostgreSQL schema draft
- Dashboard metrics and non-enquiry modules still use prototype/sample content

All dashboard numbers and customer/event names are illustrative. Do not treat them as real UV Eventz records.

## Structure
```text
uv-eventz-erp/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   └── supabase-auth.js
├── supabase/
│   └── schema.sql
└── README.md
```

## Run locally
Open `index.html` in a browser. For local development, use VS Code Live Server or another static HTTP server.

## Deployment plan
1. Serve the folder through a local web server (for example VS Code Live Server); ES modules generally will not work from file://.
2. Create a private GitHub repository.
3. Upload the starter files and use version control for all changes.
4. Import the repository into Cloudflare Pages and configure automatic deployments from the main branch.
5. Supabase project and two Auth users are already configured for this workspace.
6. Review and test row-level security before storing real customer data.
7. Frontend uses the project URL and publishable key in js/supabase-auth.js. These are browser-facing values; never place a secret/service_role key in frontend code.
8. Add secure server-side functions for email and messaging integrations.
9. Configure backups/export procedures and test recovery.

## Recommended first production milestones
1. Login/logout and business membership access control
2. Customers and enquiries CRUD
3. Event creation and status workflow
4. Quotation items, revisions and PDF print layout
5. Booking confirmation and payment schedule
6. Invoices, receipts, expenses and reconciliation
7. Dashboard metrics derived from live database records
8. Gmail/WhatsApp/SMS integrations and audit logs

## Integration direction
- Gmail: start with an email-compose link or a user-approved Gmail workflow; move to OAuth/API or Apps Script when needed.
- WhatsApp Business: begin with click-to-chat links and prefilled messages. Official automated outbound messaging requires an approved WhatsApp Business Platform setup and can incur charges.
- SMS: design a provider adapter. Use a free test/sandbox if available; real SMS delivery in India should be budgeted as a paid service unless a provider offers a current free allowance.
- Never collect Gmail passwords or place provider API tokens in frontend JavaScript.

## Important limitations
- The dashboard is a UI prototype, not an operational ERP.
- New enquiry creates a customer then an enquiry; if the second insert fails, the customer may remain and should be checked before retrying.
- Enquiry saving has not yet been tested with your live accounts. Run a small test record, then verify it appears in Supabase before entering real client data.
- GST settings are placeholders. Tax calculation and invoice compliance must be configured after the business's registration status and invoicing requirements are confirmed.
- Database schema is a starting point. Add and test RLS policies before storing real data.


## Brand palette (v0.5)
The interface now follows the supplied UV Eventz logo: Obsidian Black `#080808`, Metallic Gold `#D9A52E`, Gold Highlight `#F4D46A`, White `#FFFFFF`, and Soft Ivory `#F5F5F2`. The workspace remains light for comfortable day-to-day data entry, while the sidebar and selected navigation use black/charcoal. Gold is reserved for primary actions and brand emphasis.


## v0.6 connection note
Project URL is configured as `https://ikibojgryldcxijtpqwm.supabase.co` (do not include `/rest/v1/` when using the Supabase JavaScript client). The publishable key is configured in the client script. Do not add secrets to this project.
