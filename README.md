# UV Eventz ERP

Static Supabase-backed workspace. No seed data or demo records are included. Files: `index.html`, `styles.css`, `app.js`, `schema.sql`, `DEPLOYMENT.md`.

## Included
- Supabase email/password login and business membership check
- Live dashboard metrics from database
- Create/read/update/delete screens for customers, enquiries, events, quotations, invoices, transactions and follow-ups
- Business ID scoping in requests; RLS remains required for security
- Responsive black / metallic gold / ivory design

## Honest scope
This is a functional production-oriented starter, not an independently security-audited application. It does not yet include quotation line-item editing, PDF/email/WhatsApp delivery, automated GST calculations, supplier management, calendar sync or bank reconciliation. Test schema compatibility and RLS with both owner and member accounts before entering real sensitive data. Never put a Supabase service-role key in browser code.
