
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

(() => {
  "use strict";

  const SUPABASE_URL = "https://ikibojgryldcxijtpqwm.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_6bICs6L1GQE-tuVt5E2rMA_ltvRdNOP";

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  window.uvEventzSupabase = supabase;

  const $ = (selector) => document.querySelector(selector);

  const authScreen = $("#authScreen");
  const authForm = $("#loginForm");
  const authMessage = $("#authMessage");
  const logoutButton = $("#logoutButton");
  const enquiryForm = $("#enquiryForm");
  const toast = $("#toast");

  let currentBusinessId = null;
  let currentUser = null;
  let authRequestInProgress = false;

  function showMessage(message, isError = false) {
    if (authMessage) {
      authMessage.textContent = message;
      authMessage.style.color = isError ? "#c0392b" : "";
    } else {
      console.log(message);
    }
  }

  function showToast(message) {
    if (!toast) {
      console.log(message);
      return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
  }

  function showLogin(message = "") {
    currentUser = null;
    currentBusinessId = null;
    window.uvEventzBusinessId = null;

    document.body.classList.add("auth-locked");

    if (authScreen) {
      authScreen.style.display = "";
    }

    if (message) showMessage(message);
  }

  function showWorkspace(user, membership) {
    currentUser = user;
    currentBusinessId = membership.business_id;

    window.uvEventzBusinessId = currentBusinessId;

    document.body.classList.remove("auth-locked");

    if (authScreen) {
      authScreen.style.display = "none";
    }

    const name = $("#signedInName");
    const role = $("#signedInRole");
    const avatar = $("#userAvatar");

    if (name) {
      name.textContent =
        user.user_metadata?.full_name ||
        user.email ||
        "UV Eventz member";
    }

    if (role) {
      role.textContent = membership.role || "Workspace member";
    }

    if (avatar) {
      const label =
        user.user_metadata?.full_name ||
        user.email ||
        "UV";

      avatar.textContent = label
        .split(/[\s@.]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join("");
    }
  }

  async function getMembership(user) {
    const { data, error } = await supabase
      .from("business_members")
      .select("business_id, role")
      .eq("user_id", user.id)
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error(
        "Your account has no business membership. Ask the workspace owner to check business_members."
      );
    }

    return data[0];
  }

  async function establishSession(user) {
    if (!user) {
      showLogin();
      return;
    }

    try {
      const membership = await getMembership(user);
      showWorkspace(user, membership);
    } catch (error) {
      console.error("Workspace access error:", error);
      showLogin(error.message || "Could not load workspace access.");
    }
  }

  // Sign in.
  if (authForm) {
    authForm.addEventListener("submit", async event => {
      event.preventDefault();

      if (authRequestInProgress) return;
      authRequestInProgress = true;

      const button = authForm.querySelector(
        'button[type="submit"]'
      );
      const originalText = button?.textContent;

      if (button) {
        button.disabled = true;
        button.textContent = "Signing in…";
      }

      try {
        const formData = new FormData(authForm);
        const email = String(formData.get("email") || "")
          .trim();
        const password = String(formData.get("password") || "");

        showMessage("Checking your account…");

        const { data, error } = await supabase.auth
          .signInWithPassword({ email, password });

        if (error) throw error;

        await establishSession(data.user);
      } catch (error) {
        console.error("UV Eventz sign-in error:", error);
        showLogin(error.message || "Sign-in failed.");
      } finally {
        authRequestInProgress = false;

        if (button) {
          button.disabled = false;
          button.textContent = originalText || "Sign in securely";
        }
      }
    });
  }

  // Sign out.
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;

      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        showLogin("You have signed out.");
      } catch (error) {
        console.error("UV Eventz sign-out error:", error);
        showToast(error.message || "Could not sign out.");
      } finally {
        logoutButton.disabled = false;
      }
    });
  }

  // Save an enquiry using the authenticated business.
  window.saveUvEnquiry = async function (formData) {
    if (!currentUser || !currentBusinessId) {
      throw new Error("Please sign in before saving an enquiry.");
    }

    const customerName = String(
      formData.get("customer") || ""
    ).trim();

    const phone = String(
      formData.get("phone") || ""
    ).trim();

    if (!customerName || !phone) {
      throw new Error("Customer name and phone are required.");
    }

    const customerRecord = {
      business_id: currentBusinessId,
      full_name: customerName,
      phone,
      email: null,
      address: String(formData.get("venue") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null
    };

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert(customerRecord)
      .select("id")
      .single();

    if (customerError) {
      throw new Error(
        "Customer save failed: " + customerError.message
      );
    }

    const rawBudget = String(
      formData.get("budget") || ""
    ).trim();

    const rawDate = String(
      formData.get("eventDate") || ""
    ).trim();

    const enquiryRecord = {
      business_id: currentBusinessId,
      customer_id: customer.id,
      event_type: String(formData.get("eventType") || "Other"),
      event_date: rawDate || null,
      venue: String(formData.get("venue") || "").trim() || null,
      budget: rawBudget ? Number(rawBudget) : null,
      source: String(formData.get("source") || "Other"),
      status: "new",
      notes: String(formData.get("notes") || "").trim() || null
    };

    const { data: enquiry, error: enquiryError } = await supabase
      .from("enquiries")
      .insert(enquiryRecord)
      .select("id")
      .single();

    if (enquiryError) {
      console.error(
        "Enquiry insert failed. Customer ID:",
        customer.id,
        enquiryError
      );

      throw new Error(
        "Customer was saved, but enquiry creation failed: " +
        enquiryError.message
      );
    }

    window.dispatchEvent(
      new CustomEvent("uv-eventz:enquiry-saved", {
        detail: { enquiryId: enquiry.id }
      })
    );

    return enquiry;
  };

  // Restore an existing login when the page is refreshed.
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      showLogin();
      return;
    }

    if (event === "SIGNED_IN" && session?.user) {
      // Defer membership lookup outside the auth callback.
      setTimeout(() => {
        establishSession(session.user);
      }, 0);
    }
  });

  async function initialize() {
    try {
      showMessage("Checking secure connection…");

      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (data.session?.user) {
        await establishSession(data.session.user);
      } else {
        showLogin();
      }
    } catch (error) {
      console.error("UV Eventz initialization error:", error);
      showLogin(
        "Could not connect to your workspace: " + error.message
      );
    }
  }

  initialize();
})();
