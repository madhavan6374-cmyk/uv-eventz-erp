(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const modal = $("#enquiryModal");
  const toast = $("#toast");
  if (window.lucide) window.lucide.createIcons();

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3200);
  }

  // Date is generated dynamically; all business metrics above are illustrative prototype data.
  const now = new Date();
  $("#todayLabel").textContent = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  }).format(now);

  const pageCopy = {
    Dashboard: ["Good morning, UV Eventz", "Here’s what’s happening across your events today."],
    Enquiries: ["Enquiries", "Capture leads, plan follow-ups and move opportunities forward."],
    Customers: ["Customers", "Keep customer contact details and event history in one place."],
    Quotations: ["Quotations", "Prepare, revise and track customer quotations."],
    Events: ["Events", "Coordinate event dates, checklists, vendors and delivery."],
    Invoices: ["Invoices", "Track invoices, customer receipts and outstanding balances."],
    Finance: ["Income & Expenses", "Monitor receipts, vendor payments and event profitability."],
    Reports: ["Reports", "Review business performance and event-wise results."],
    Integrations: ["Integrations", "Configure email, WhatsApp Business and SMS connections."],
    Settings: ["Settings", "Manage business profile, users, numbering and tax preferences."]
  };

  function navigate(view) {
    const copy = pageCopy[view] || pageCopy.Dashboard;
    $("#pageName").textContent = view;
    $("#pageTitle").textContent = copy[0];
    $("#pageSubtitle").textContent = copy[1];
    $$(".nav-item[data-view]").forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (view !== "Dashboard") showToast(view === "Enquiries" ? "Use New enquiry to create a cloud-saved enquiry." : `${view} will be connected in a later milestone.`);
    setDrawerOpen(false);
  }

  $$(".nav-item[data-view]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.view));
  });
  $$("[data-view-link]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.viewLink));
  });

  $("#newEnquiryButton").addEventListener("click", () => modal.showModal());
  $("#cancelEnquiry").addEventListener("click", () => modal.close());
  $("#dismissNotice").addEventListener("click", () => $("#prototypeNotice").remove());
  const sidebar = $("#sidebar");
  const drawerBackdrop = $("#drawerBackdrop");
  function setDrawerOpen(open) {
    sidebar.classList.toggle("open", open);
    drawerBackdrop.classList.toggle("visible", open);
    $("#mobileMenu").setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  $("#mobileMenu").setAttribute("aria-expanded", "false");
  $("#mobileMenu").addEventListener("click", () => setDrawerOpen(!sidebar.classList.contains("open")));
  drawerBackdrop.addEventListener("click", () => setDrawerOpen(false));
  window.addEventListener("keydown", event => {
    if (event.key === "Escape") setDrawerOpen(false);
  });
  $("#helpButton").addEventListener("click", () => showToast("Help centre will be added in a later phase."));
  $("#periodButton").addEventListener("click", () => showToast("Date filters will be connected to live reports in a later phase."));
  $("#exportButton").addEventListener("click", () => window.print());

  $("#enquiryForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (typeof window.saveUvEnquiry !== "function") {
      showToast("Please sign in and wait for the secure connection to finish.");
      return;
    }
    const button = $("#saveEnquiryButton");
    button.disabled = true;
    button.textContent = "Saving…";
    try {
      await window.saveUvEnquiry(new FormData(event.currentTarget));
      modal.close();
      event.currentTarget.reset();
    } catch (error) {
      showToast(error.message || "Could not save the enquiry.");
    } finally {
      button.disabled = false;
      button.textContent = "Save enquiry";
    }
  });

  // Intentionally no localStorage persistence: real business records must be stored
  // in the authenticated cloud database, not in a browser-only prototype.
})();