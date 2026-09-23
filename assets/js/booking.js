(function () {
  "use strict";

  function titleCase(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function pushEvent(name, details) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name, page_location: window.location.href }, details || {}));
  }

  function initForm(form) {
    var startDate = document.getElementById("startDate");
    var endDate = document.getElementById("endDate");
    var datesCombined = document.getElementById("datesCombined");
    var submit = document.getElementById("submitBtn");
    var success = document.getElementById("formSuccessMsg");
    var error = document.getElementById("formErrorMsg");
    var started = false;
    var labels = {
      submit: form.dataset.submitLabel,
      sending: form.dataset.sendingLabel,
      date: form.dataset.dateError,
      security: form.dataset.securityError,
      generic: form.dataset.genericError,
      joiner: form.dataset.dateJoiner || " to "
    };

    function today() {
      var d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
    function applyMinimums() {
      startDate.min = today();
      endDate.min = startDate.value || today();
    }
    function syncDates() {
      var start = startDate.value;
      var end = endDate.value;
      endDate.min = start || today();
      if (start && end && end < start) { endDate.value = start; end = start; }
      datesCombined.value = start && end && start !== end ? start + labels.joiner + end : start || end || "";
    }
    function showError(message) {
      success.hidden = true;
      error.textContent = message || labels.generic;
      error.hidden = false;
    }
    function setSubmitting(active) {
      submit.disabled = active;
      submit.textContent = active ? labels.sending : labels.submit;
    }

    form.addEventListener("focusin", function () {
      if (started) return;
      started = true;
      pushEvent("form_start", { form_name: "book_tour", site_context: "chocoandinotours" });
    });
    ["firstName", "lastName"].forEach(function (id) {
      var field = document.getElementById(id);
      field.addEventListener("blur", function () { field.value = titleCase(field.value.trim()); });
    });
    startDate.addEventListener("change", syncDates);
    endDate.addEventListener("change", syncDates);
    applyMinimums();

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      success.hidden = true;
      error.hidden = true;
      syncDates();
      document.getElementById("sourcePage").value = window.location.href;
      document.getElementById("uaField").value = navigator.userAgent || "";
      document.getElementById("tsStart").value = String(Date.now());
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (!datesCombined.value) { showError(labels.date); return; }
      if (window.CATAttribution) window.CATAttribution.addToForm(form);
      var formData = new FormData(form);
      if (!formData.get("cf-turnstile-response")) { showError(labels.security); return; }
      setSubmitting(true);
      pushEvent("booking_submit", { form_name: "book_tour", site_context: "chocoandinotours" });
      try {
        var response = await fetch("/api/book-tour", { method: "POST", body: formData });
        var data = {};
        try { data = await response.json(); } catch (parseError) {}
        if (!response.ok || !data.ok) {
          var diagnostic = "";
          if (/^staging\./.test(window.location.hostname) && data.error_code) diagnostic = " [" + data.error_code + "]";
          throw new Error((data.message || labels.generic) + diagnostic);
        }
        success.hidden = false;
        pushEvent("booking_success", { form_name: "book_tour", site_context: "chocoandinotours", processing: Boolean(data.processing) });
        form.reset();
        datesCombined.value = "";
        applyMinimums();
        if (window.CAT_TURNSTILE) window.CAT_TURNSTILE.reset();
      } catch (submissionError) {
        pushEvent("booking_error", { form_name: "book_tour", site_context: "chocoandinotours" });
        showError(submissionError.message || labels.generic);
      } finally { setSubmitting(false); }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("bookTourForm");
    if (form) initForm(form);
  });
})();
