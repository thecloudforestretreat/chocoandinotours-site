(function () {
  "use strict";
  var widgetId = null;

  function statusElement(target) {
    var status = target.parentNode.querySelector("[data-turnstile-status]");
    if (status) return status;
    status = document.createElement("p");
    status.className = "formHelp";
    status.setAttribute("data-turnstile-status", "");
    status.setAttribute("aria-live", "polite");
    status.hidden = true;
    target.insertAdjacentElement("afterend", status);
    return status;
  }

  function message(type) {
    var spanish = String(document.documentElement.lang || "").toLowerCase().indexOf("es") === 0;
    if (type === "expired") return spanish
      ? "La verificación expiró. Se está cargando una nueva verificación."
      : "The security check expired. A new check is loading.";
    return spanish
      ? "La verificación de seguridad no pudo completarse. Se intentará nuevamente."
      : "The security check could not complete. It will retry automatically.";
  }

  function render() {
    if (widgetId !== null || !window.turnstile) return;
    var target = document.querySelector("[data-turnstile-widget]");
    var config = window.CHOCOTOURS_CONFIG || {};
    if (!target || !config.turnstileSiteKey) return;
    var status = statusElement(target);
    widgetId = window.turnstile.render(target, {
      sitekey: config.turnstileSiteKey,
      theme: target.getAttribute("data-theme") || "light",
      action: "book_tour",
      retry: "auto",
      "retry-interval": 8000,
      callback: function () {
        status.hidden = true;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "turnstile_success", page_language: document.documentElement.lang || "en" });
      },
      "expired-callback": function () { status.textContent = message("expired"); status.hidden = false; },
      "error-callback": function () { status.textContent = message("error"); status.hidden = false; }
    });
  }

  window.catTurnstileReady = render;
  document.addEventListener("DOMContentLoaded", render);
  window.CAT_TURNSTILE = {
    render: render,
    reset: function () { if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId); }
  };
})();
