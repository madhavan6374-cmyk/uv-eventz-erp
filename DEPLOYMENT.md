# Deployment

1. Back up the existing Supabase database first.
2. Review `schema.sql` carefully. Your existing database already has tables and policies, so do not blindly execute schema changes without checking compatibility.
3. In Supabase Table Editor, confirm `businesses` contains UV Eventz and `business_members` contains each authorized user's Auth UUID and correct business_id.
4. Upload `index.html`, `styles.css`, and `app.js` to the GitHub repository root. Keep SQL/docs as project files. Do not wrap source code in Markdown fences.
5. Trigger a new Cloudflare deployment from the correct repository/branch. Test the live HTTPS URL, then hard refresh with Ctrl+Shift+R.
6. Test with the owner account: create customer, enquiry, edit, refresh, delete. Repeat with member account. Confirm only the business's records are visible.
7. Do not disable RLS to solve errors. Never expose a service_role key. The browser publishable key is visible by design; RLS is the security boundary.
