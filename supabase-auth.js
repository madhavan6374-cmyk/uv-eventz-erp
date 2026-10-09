
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const modal = $("#enquiryModal");
  const toast = $("#toast");

  if (window.lucide) {
    window.lucide.createIcons();
  }

  function showToast(message) {
    if (toast) {
      toast.textContent = message;
      toast.classList.add("show");

      window.clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(() => {
        toast.classList.remove("show");
      }, 3200);
    } else {
      console.log(message);
    }
  }

  // Dashboard date.
  const todayLabel = $("#todayLabel");

  if (todayLabel) {
    todayLabel.textContent = new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date());
  }

  const pageCopy = {
    Dashboard: [
      "Good morning, UV Eventz",
      "Here’s what’s happening across your events today."
    ],
    Enquiries: [
      "Enquiries",
      "Capture leads, plan follow-ups and move opportunities forward."
    ],
    Customers: [
      "Customers",
      "Keep customer contact details and event history in one place."
    ],
    Quotations: [
      "Quotations",
      "Prepare, revise and track customer quotations."
    ],
    Events: [
      "Events",
      "Coordinate event dates, checklists, vendors and delivery."
    ],
    Invoices: [
      "Invoices",
      "Track invoices, customer receipts and outstanding balances."
    ],
    Finance: [
      "Income & Expenses",
      "Monitor receipts, vendor payments and event profitability."
    ],
    Reports: [
      "Reports",
      "Review business performance and event-wise results."
    ],
    Integrations: [
      "Integrations",
      "Configure email, WhatsApp Business and SMS connections."
    ],
    Settings: [
      "Settings",
      "Manage business profile, users, numbering and tax preferences."
    ]
  };

  function navigate(view) {
    const copy = pageCopy[view] || pageCopy.Dashboard;

    const pageName = $("#pageName");
    const pageTitle = $("#pageTitle");
    const pageSubtitle = $("#pageSubtitle");

    if (pageName) pageName.textContent = view;
    if (pageTitle) pageTitle.textContent = copy[0];
    if (pageSubtitle) pageSubtitle.textContent = copy[1];

    $$(".nav-item[data-view]").forEach(button => {
      const active = button.dataset.view === view;

      button.classList.toggle("active", active);

      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    if (view !== "Dashboard") {
      showToast(
        view === "Enquiries"
          ? "Enquiry workspace selected."
          : `${view} will be connected in a later milestone.`
      );
    }

    setDrawerOpen(false);
  }

  $$(".nav-item[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      navigate(button.dataset.view);
    });
  });

  $$("[data-view-link]").forEach(button => {
    button.addEventListener("click", () => {
      navigate(button.dataset.viewLink);
    });
  });

  // Enquiry modal controls.
  const newEnquiryButton = $("#newEnquiryButton");
  const cancelEnquiryButton = $("#cancelEnquiry");

  if (newEnquiryButton && modal) {
    newEnquiryButton.addEventListener("click", () => {
      modal.showModal();
    });
  }

  if (cancelEnquiryButton && modal) {
    cancelEnquiryButton.addEventListener("click", () => {
      modal.close();
    });
  }

  $("#dismissNotice")?.addEventListener("click", () => {
    $("#prototypeNotice")?.remove();
  });

  // Mobile drawer.
  const sidebar = $("#sidebar");
  const drawerBackdrop = $("#drawerBackdrop");
  const mobileMenu = $("#mobileMenu");

  function setDrawerOpen(open) {
    sidebar?.classList.toggle("open", open);
    drawerBackdrop?.classList.toggle("visible", open);

    if (mobileMenu) {
      mobileMenu.setAttribute("aria-expanded", String(open));
    }

    document.body.style.overflow = open ? "hidden" : "";
  }

  if (mobileMenu) {
    mobileMenu.setAttribute("aria-expanded", "false");

    mobileMenu.addEventListener("click", () => {
      setDrawerOpen(!sidebar?.classList.contains("open"));
    });
  }

  drawerBackdrop?.addEventListener("click", () => {
    setDrawerOpen(false);
  });

  window.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      setDrawerOpen(false);
    }
  });

  $("#helpButton")?.addEventListener("click", () => {
    showToast("Help centre will be added in a later phase.");
  });

  $("#periodButton")?.addEventListener("click", () => {
    showToast("Date filters will be connected to live reports in a later phase.");
  });

  $("#exportButton")?.addEventListener("click", () => {
    window.print();
  });

  // Enquiry submission.
  const enquiryForm = $("#enquiryForm");

  if (!enquiryForm) {
    console.error("UV Eventz: enquiry form was not found.");
  } else {
    enquiryForm.addEventListener("submit", async event => {
      event.preventDefault();

      // Capture these references before any asynchronous operation.
      const form = event.currentTarget;
      const button = $("#saveEnquiryButton");

      if (!(form instanceof HTMLFormElement)) {
        showToast("The enquiry form could not be identified. Please refresh.");
        return;
      }

      if (typeof window.saveUvEnquiry !== "function") {
        showToast(
          "Secure connection is not ready. Refresh the page and sign in again."
        );
        return;
      }

      if (!button) {
        showToast("Save button not found. Please refresh the page.");
        return;
      }

      // Preserve the values before starting the save.
      const formData = new FormData(form);

      button.disabled = true;
      button.textContent = "Saving…";

      try {
        // The existing helper handles the actual Supabase save.
        await window.saveUvEnquiry(formData);

        // Reset only the captured form, and only after success.
        if (form.isConnected) {
          HTMLFormElement.prototype.reset.call(form);
        }

        if (modal?.open) {
          modal.close();
        }

        showToast("Enquiry saved successfully.");

        window.dispatchEvent(
          new CustomEvent("uv-eventz:enquiry-saved")
        );
      } catch (error) {
        console.error("UV Eventz enquiry save failed:", error);

        showToast(
          error?.message ||
          "The enquiry could not be confirmed as saved. Please check Supabase."
        );
      } finally {
        if (button.isConnected) {
          button.disabled = false;
          button.textContent = "Save enquiry";
        }
      }
    });
  }

  // Business data is stored in Supabase, not browser localStorage.
})();
