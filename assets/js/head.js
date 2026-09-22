// Sitewide Google Tag Manager loader and first-party interaction events.
(function () {
  const config = window.CHOCOTOURS_CONFIG || {};
  const GTM_ID = config.googleTagManagerId;

  if (!GTM_ID || !/^GTM-[A-Z0-9]+$/.test(GTM_ID)) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js"
  });

  const gtmScript = document.createElement("script");
  gtmScript.async = true;
  gtmScript.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(GTM_ID);
  document.head.appendChild(gtmScript);

  window.addEventListener("DOMContentLoaded", function () {

    function trackClick(selector, eventName) {
      document.querySelectorAll(selector).forEach(function (el) {
        el.addEventListener("click", function () {
          window.dataLayer.push({
            event: eventName,
            page_location: window.location.href,
            link_url: el.href || ""
          });
        });
      });
    }

    trackClick(".btn-book", "book_tour_click");
    trackClick(".btn-tour", "view_tours_click");
    trackClick(".btn-contact", "contact_click");

    document.querySelectorAll("a[href*='mindobirdwatching.com']").forEach(function (link) {
      link.addEventListener("click", function () {
        window.dataLayer.push({
          event: "funnel_to_mbw",
          page_location: window.location.href,
          destination: link.href
        });
      });
    });

  });

})();
