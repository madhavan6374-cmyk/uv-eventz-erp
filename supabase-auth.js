import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://ikibojgryldcxijtpqwm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_6bICs6L1GQE-tuVt5E2rMA_ltvRdNOP";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
window.uvSupabase = supabase;

const $ = (selector) => document.querySelector(selector);
const authScreen = $("#authScreen");
const authForm = $("#loginForm");
const authMessage = $("#authMessage");
const shell = document.querySelector(".app-shell");
let activeBusinessId = null;
let activeUser = null;

function setMessage(message, success = false) {
  authMessage.textContent = message;
  authMessage.classList.toggle("success", success);
}
function showApp(show) {
  document.body.classList.toggle("auth-locked", !show);
  authScreen.style.display = show ? "none" : "grid";
  shell.style.display = show ? "flex" : "none";
}
function toast(message) {
  const node = document.querySelector("#toast");
  node.textContent = message; node.classList.add("show");
  window.clearTimeout(toast.timer); toast.timer = window.setTimeout(() => node.classList.remove("show"), 3500);
}

async function loadWorkspace(user) {
  const { data: membership, error: memberError } = await supabase
    .from("business_members").select("business_id, role").eq("user_id", user.id).limit(1).maybeSingle();
  if (memberError) throw new Error("Could not load workspace membership: " + memberError.message);
  if (!membership) throw new Error("This account is not linked to a UV Eventz workspace. Ask the workspace owner to check membership.");
  const { data: business, error: businessError } = await supabase.from("businesses").select("id, name").eq("id", membership.business_id).single();
  if (businessError) throw new Error("Could not load workspace: " + businessError.message);
  activeBusinessId = business.id; activeUser = user;
  $("#signedInName").textContent = user.email || "UV Eventz user";
  $("#signedInRole").textContent = `${business.name} · ${membership.role}`;
  $("#userAvatar").textContent = (user.email || "UV").slice(0, 2).toUpperCase();
  const notice = $("#prototypeNotice");
  if (notice) { notice.querySelector("strong").textContent = "Cloud workspace connected"; notice.querySelector("p").textContent = "Your session is active. New enquiries and customer details are saved to Supabase. Dashboard figures are still sample values."; }
  showApp(true);
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = authForm.querySelector("button[type=submit]"); button.disabled = true; button.textContent = "Signing in…";
  setMessage("");
  const form = new FormData(authForm);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: String(form.get("email")).trim(), password: String(form.get("password")) });
    if (error) throw error;
    await loadWorkspace(data.user);
  } catch (error) { setMessage(error.message || "Sign-in failed. Check your email and password."); }
  finally { button.disabled = false; button.textContent = "Sign in securely"; }
});

$("#logoutButton").addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  activeBusinessId = null; activeUser = null; showApp(false);
  if (error) setMessage("Signed out locally. " + error.message);
});

window.saveUvEnquiry = async (formData) => {
  if (!activeBusinessId || !activeUser) throw new Error("Your session has expired. Please sign in again.");
  const customerName = String(formData.get("customer") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!customerName || !phone) throw new Error("Customer name and mobile number are required.");
  const customerPayload = { business_id: activeBusinessId, full_name: customerName, phone, email: null, address: null, notes: String(formData.get("notes") || "").trim() || null };
  const { data: customer, error: customerError } = await supabase.from("customers").insert(customerPayload).select("id").single();
  if (customerError) throw new Error("Customer could not be saved: " + customerError.message);
  const budgetValue = String(formData.get("budget") || "").trim();
  const guestValue = String(formData.get("guestCount") || "").trim();
  const enquiryPayload = {
    business_id: activeBusinessId, customer_id: customer.id,
    event_type: String(formData.get("eventType") || "Other family function"),
    event_date: String(formData.get("eventDate") || "") || null,
    venue: String(formData.get("venue") || "").trim() || null,
    guest_count: guestValue ? Number(guestValue) : null,
    budget: budgetValue ? Number(budgetValue) : null,
    source: String(formData.get("source") || "Other"), status: "new",
    notes: String(formData.get("notes") || "").trim() || null
  };
  const { error: enquiryError } = await supabase.from("enquiries").insert(enquiryPayload);
  if (enquiryError) throw new Error("Customer saved, but enquiry failed: " + enquiryError.message + " — please tell us before retrying to avoid duplicate customers.");
  toast(`Enquiry saved for ${customerName}.`);
};

async function restoreSession() {
  showApp(false);
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (session?.user) await loadWorkspace(session.user);
  } catch (error) { setMessage("Connection issue: " + error.message); }
}
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") { activeBusinessId = null; activeUser = null; showApp(false); }
});
restoreSession();
