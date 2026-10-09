```javascript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

(() => {
  "use strict";

  // --------------------------------------------------
  // 1. SUPABASE CONFIGURATION
  // --------------------------------------------------

  const SUPABASE_URL =
    "https://ikibojgryldcxijtpqwm.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_6bICs6L1GQE-tuVt5E2rMA_ltvRdNOP";

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  window.uvEventzSupabase = supabase;

  // --------------------------------------------------
  // 2. HTML ELEMENTS
  // --------------------------------------------------

  const $ = (selector) =>
    document.querySelector(selector);

  const authScreen = $("#authScreen");
  const authForm = $("#loginForm");
  const authMessage = $("#authMessage");
  const logoutButton = $("#logoutButton");
  const toast = $("#toast");

  let currentUser = null;
  let currentBusinessId = null;
  let authRequestInProgress = false;
  let sessionCheckInProgress = false;

  window.uvEventzBusinessId = null;
  window.uvEventzCurrentUser = null;

  // --------------------------------------------------
  // 3. MESSAGE AND TOAST HELPERS
  // --------------------------------------------------

  function showMessage(message, isError = false) {
    if (!authMessage) {
      console.log(message);
      return;
    }

    authMessage.textContent = message;
    authMessage.style.color = isError
      ? "#c0392b"
      : "";
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

  // --------------------------------------------------
  // 4. TIMEOUT HELPER
  // Prevents the UI from waiting forever.
  // --------------------------------------------------

  function withTimeout(
    promise,
    milliseconds,
    label
  ) {
    let timer;

    const timeout = new Promise((_, reject) => {
      timer = window.setTimeout(() => {
        reject(
          new Error(
            label +
              " timed out. Check your internet connection and try again."
          )
        );
      }, milliseconds);
    });

    return Promise.race([
      promise,
      timeout
    ]).finally(() => {
      window.clearTimeout(timer);
    });
  }

  // --------------------------------------------------
  // 5. LOGIN SCREEN
  // --------------------------------------------------

  function showLogin(message = "") {
    currentUser = null;
    currentBusinessId = null;

    window.uvEventzBusinessId = null;
    window.uvEventzCurrentUser = null;

    document.body.classList.add("auth-locked");

    if (authScreen) {
      authScreen.style.display = "";
    }

    if (message) {
      showMessage(message, true);
    }
  }

  // --------------------------------------------------
  // 6. WORKSPACE SCREEN
  // --------------------------------------------------

  function showWorkspace(user, membership) {
    currentUser = user;
    currentBusinessId = membership.business_id;

    window.uvEventzBusinessId =
      currentBusinessId;

    window.uvEventzCurrentUser = user;

    document.body.classList.remove("auth-locked");

    if (authScreen) {
      authScreen.style.display = "none";
    }

    const name = $("#signedInName");
    const role = $("#signedInRole");
    const avatar = $("#userAvatar");

    const displayName =
      user.user_metadata?.full_name ||
      user.email ||
      "UV Eventz member";

    if (name) {
      name.textContent = displayName;
    }

    if (role) {
      role.textContent =
        membership.role ||
        "Workspace member";
    }

    if (avatar) {
      avatar.textContent = displayName
        .split(/[\s@.]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
    }
  }

  // --------------------------------------------------
  // 7. FIND THE USER'S BUSINESS MEMBERSHIP
  // --------------------------------------------------

  async function getMembership(user) {
    const { data, error } = await withTimeout(
      supabase
        .from("business_members")
        .select("business_id, role")
        .eq("user_id", user.id)
        .limit(1),
      12000,
      "Workspace membership check"
    );

    if (error) {
      throw new Error(
        "Your account was authenticated, but the workspace membership check failed: " +
          error.message
      );
    }

    if (!data || data.length === 0) {
      throw new Error(
        "Your login succeeded, but no business membership was found for this account. Check business_members in Supabase."
      );
    }

    return data[0];
  }

  // --------------------------------------------------
  // 8. LOAD THE WORKSPACE
  // --------------------------------------------------

  async function establishSession(user) {
    if (!user) {
      showLogin();
      return;
    }

    showMessage(
      "Signed in. Loading your workspace…"
    );

    try {
      const membership =
        await getMembership(user);

      showWorkspace(user, membership);
      showMessage("");
    } catch (error) {
      console.error(
        "UV Eventz workspace access error:",
        error
      );

      showLogin(
        error.message ||
          "Could not load workspace access."
      );
    }
  }

  // --------------------------------------------------
  // 9. SIGN IN
  // --------------------------------------------------

  if (authForm) {
    authForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        if (authRequestInProgress) {
          return;
        }

        authRequestInProgress = true;

        const button = authForm.querySelector(
          'button[type="submit"]'
        );

        const originalText =
          button?.textContent;

        if (button) {
          button.disabled = true;
          button.textContent = "Signing in…";
        }

        try {
          const formData =
            new FormData(authForm);

          const email = String(
            formData.get("email") || ""
          ).trim();

          const password = String(
            formData.get("password") || ""
          );

          if (!email || !password) {
            throw new Error(
              "Enter your email address and password."
            );
          }

          showMessage(
            "Checking your account…"
          );

          const { data, error } =
            await withTimeout(
              supabase.auth.signInWithPassword({
                email,
                password
              }),
              15000,
              "Sign-in request"
            );

          if (error) {
            throw error;
          }

          if (!data?.user) {
            throw new Error(
              "Supabase did not return a user after sign-in."
            );
          }

          showMessage(
            "Sign-in successful. Loading your workspace…"
          );

          await establishSession(data.user);
        } catch (error) {
          console.error(
            "UV Eventz sign-in error:",
            error
          );

          showLogin(
            error.message ||
              "Sign-in failed. Please try again."
          );
        } finally {
          authRequestInProgress = false;

          if (button) {
            button.disabled = false;
            button.textContent =
              originalText ||
              "Sign in securely";
          }
        }
      }
    );
  } else {
    console.error(
      "Login form #loginForm was not found in index.html."
    );
  }

  // --------------------------------------------------
  // 10. SIGN OUT
  // --------------------------------------------------

  if (logoutButton) {
    logoutButton.addEventListener(
      "click",
      async () => {
        logoutButton.disabled = true;

        try {
          const { error } =
            await supabase.auth.signOut();

          if (error) {
            throw error;
          }

          showLogin("You have signed out.");
        } catch (error) {
          console.error(
            "UV Eventz sign-out error:",
            error
          );

          showToast(
            error.message ||
              "Could not sign out."
          );
        } finally {
          logoutButton.disabled = false;
        }
      }
    );
  }

  // --------------------------------------------------
  // 11. SAVE CUSTOMER AND ENQUIRY
  // --------------------------------------------------

  window.saveUvEnquiry = async function (
    formData
  ) {
    if (!currentUser || !currentBusinessId) {
      throw new Error(
        "Please sign in before saving an enquiry."
      );
    }

    const customerName = String(
      formData.get("customer") || ""
    ).trim();

    const phone = String(
      formData.get("phone") || ""
    ).trim();

    if (!customerName || !phone) {
      throw new Error(
        "Customer name and phone are required."
      );
    }

    const venue = String(
      formData.get("venue") || ""
    ).trim();

    const notes = String(
      formData.get("notes") || ""
    ).trim();

    // Save customer first.
    const customerRecord = {
      business_id: currentBusinessId,
      full_name: customerName,
      phone: phone,
      email: null,
      address: venue || null,
      notes: notes || null
    };

    const {
      data: customer,
      error: customerError
    } = await supabase
      .from("customers")
      .insert(customerRecord)
      .select("id")
      .single();

    if (customerError) {
      throw new Error(
        "Customer save failed: " +
          customerError.message
      );
    }

    const rawBudget = String(
      formData.get("budget") || ""
    ).trim();

    const rawDate = String(
      formData.get("eventDate") || ""
    ).trim();

    const budget = rawBudget
      ? Number(rawBudget)
      : null;

    if (
      budget !== null &&
      (!Number.isFinite(budget) || budget < 0)
    ) {
      throw new Error(
        "Enter a valid event budget."
      );
    }

    const enquiryRecord = {
      business_id: currentBusinessId,
      customer_id: customer.id,
      event_type: String(
        formData.get("eventType") || "Other"
      ),
      event_date: rawDate || null,
      venue: venue || null,
      budget: budget,
      source: String(
        formData.get("source") || "Other"
      ),
      status: "new",
      notes: notes || null
    };

    const {
      data: enquiry,
      error: enquiryError
    } = await supabase
      .from("enquiries")
      .insert(enquiryRecord)
      .select("id")
      .single();

    if (enquiryError) {
      console.error(
        "Enquiry insert failed. Customer was saved:",
        customer.id,
        enquiryError
      );

      throw new Error(
        "Customer was saved, but enquiry creation failed: " +
          enquiryError.message
      );
    }

    window.dispatchEvent(
      new CustomEvent(
        "uv-eventz:enquiry-saved",
        {
          detail: {
            enquiryId: enquiry.id
          }
        }
      )
    );

    return enquiry;
  };

  // --------------------------------------------------
  // 12. RESTORE EXISTING SESSION ON PAGE LOAD
  // --------------------------------------------------

  async function initialize() {
    if (sessionCheckInProgress) {
      return;
    }

    sessionCheckInProgress = true;

    try {
      showMessage(
        "Checking your existing session…"
      );

      const { data, error } =
        await withTimeout(
          supabase.auth.getSession(),
          12000,
          "Session check"
        );

      if (error) {
        throw error;
      }

      if (data?.session?.user) {
        await establishSession(
          data.session.user
        );
      } else {
        showLogin();
      }
    } catch (error) {
      console.error(
        "UV Eventz initialization error:",
        error
      );

      showLogin(
        "Could not initialize your session: " +
          error.message
      );
    } finally {
      sessionCheckInProgress = false;
    }
  }

  // --------------------------------------------------
  // 13. AUTH STATE CHANGES
  // Do not run a second membership check on SIGNED_IN.
  // The login form handles that check.
  // --------------------------------------------------

  supabase.auth.onAuthStateChange(
    (event) => {
      if (event === "SIGNED_OUT") {
        showLogin();
      }
    }
  );

  // Start the application.
  initialize();
})();
```
