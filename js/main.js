/* ==================================================================
   HeirloomOps.com — interactions
   - Sticky header state
   - Mobile menu
   - Scroll reveal
   - Contact form validation + success state
   ================================================================== */
(function () {
  "use strict";

  /* ---------- Sticky header shadow/opacity on scroll ---------- */
  var header = document.getElementById("site-header");
  var onScroll = function () {
    if (!header) return;
    if (window.scrollY > 20) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById("nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  var closeMenu = function () {
    if (!toggle || !mobileNav) return;
    toggle.classList.remove("open");
    mobileNav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    mobileNav.setAttribute("aria-hidden", "true");
  };
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      mobileNav.setAttribute("aria-hidden", String(!open));
    });
    // Close after tapping any mobile link
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }

  /* ---------- Scroll reveal via IntersectionObserver ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ==================================================================
     SMOOTH IN-PAGE ANCHOR SCROLLING (header nav, hero buttons,
     footer links, mobile menu). Offsets for the sticky header so a
     section title is never hidden, and closes the mobile menu.
     Deterministic across browsers regardless of the scroll container.
     ================================================================== */
  var anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      var hash = link.getAttribute("href");
      if (!hash || hash === "#" || hash.length < 2) return;
      var target = document.querySelector(hash);
      if (!target) return; // let unknown anchors behave normally
      e.preventDefault();
      closeMenu();
      var headerH = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 12;
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
      if (history.pushState) history.pushState(null, "", hash);
    });
  });

  /* ==================================================================
     OVERVIEW TABS — Strategy / Operations / Development
     ================================================================== */
  var ovTabs = document.querySelectorAll(".ov-tab");
  if (ovTabs.length) {
    ovTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-tab");
        ovTabs.forEach(function (t) {
          var active = t === tab;
          t.classList.toggle("is-active", active);
          t.setAttribute("aria-selected", String(active));
        });
        document.querySelectorAll(".ov-panel").forEach(function (panel) {
          var match = panel.getAttribute("data-panel") === name;
          panel.classList.toggle("is-active", match);
          panel.hidden = !match;
        });
      });
    });
  }

  /* ==================================================================
     CONTACT FORM
     ------------------------------------------------------------------
     Front-end validation + simulated success state.
     BACKEND INTEGRATION:
       Replace the block marked "SIMULATED SUBMIT" with a real request, e.g.:
         fetch("/api/contact", { method: "POST", body: new FormData(form) })
           .then(function (r) { if (!r.ok) throw new Error(); showSuccess(); })
           .catch(showError);
     ================================================================== */
  var form = document.getElementById("contact-form");
  if (!form) return;

  var successBox = document.getElementById("form-success");

  var setError = function (name, message) {
    var field = form.querySelector('[name="' + name + '"]');
    if (!field) return;
    var wrap = field.closest(".field");
    var errorEl = form.querySelector('.field-error[data-for="' + name + '"]');
    if (message) {
      wrap.classList.add("invalid");
      if (errorEl) errorEl.textContent = message;
    } else {
      wrap.classList.remove("invalid");
      if (errorEl) errorEl.textContent = "";
    }
  };

  var isEmail = function (v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  };

  var validate = function () {
    var ok = true;
    var data = {
      fullName: form.fullName.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      interest: form.interest.value,
      message: form.message.value.trim()
    };

    // Full name
    if (!data.fullName) { setError("fullName", "Please enter your full name."); ok = false; }
    else setError("fullName", "");

    // Email
    if (!data.email) { setError("email", "Please enter your email address."); ok = false; }
    else if (!isEmail(data.email)) { setError("email", "Please enter a valid email address."); ok = false; }
    else setError("email", "");

    // Phone (optional, but validate format if provided)
    if (data.phone && !/^[\d\s()+.-]{7,}$/.test(data.phone)) {
      setError("phone", "Please enter a valid phone number."); ok = false;
    } else setError("phone", "");

    // Interest
    if (!data.interest) { setError("interest", "Please select an interest type."); ok = false; }
    else setError("interest", "");

    // Message
    if (!data.message) { setError("message", "Please include a short message."); ok = false; }
    else setError("message", "");

    return ok;
  };

  // Clear a field's error as the user corrects it
  form.querySelectorAll("input, select, textarea").forEach(function (el) {
    el.addEventListener("input", function () {
      if (el.closest(".field").classList.contains("invalid")) {
        setError(el.name, "");
      }
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) {
      // focus first invalid field
      var firstInvalid = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');

    /* ----- SIMULATED SUBMIT (replace with real backend call) ----- */
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }
    window.setTimeout(function () {
      form.querySelectorAll(".form-row, .field, button[type='submit']").forEach(function (el) {
        if (el.id !== "form-success") el.style.display = "none";
      });
      if (successBox) {
        successBox.hidden = false;
        successBox.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 700);
    /* ----- END SIMULATED SUBMIT ----- */
  });
})();
