// Sitewide Google Tag Manager loader and first-party interaction events.
(function () {
  const config = window.CHOCOTOURS_CONFIG || {};
  const GTM_ID = config.googleTagManagerId;

  const attributionScript = document.createElement("script");
  attributionScript.src = "/assets/js/attribution.js?v=20260922-2";
  attributionScript.defer = true;
  document.head.appendChild(attributionScript);

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

    const pageType = document.body.dataset.pageType || "standard";
    window.dataLayer.push({
      event: "content_view",
      page_type: pageType,
      page_language: document.documentElement.lang || "en",
      page_location: window.location.href
    });

    let passedHalfway = false;
    window.addEventListener("scroll", function () {
      if (passedHalfway) return;
      const available = document.documentElement.scrollHeight - window.innerHeight;
      if (available > 0 && window.scrollY / available >= 0.5) {
        passedHalfway = true;
        window.dataLayer.push({ event: "scroll_50", page_type: pageType, page_location: window.location.href });
      }
    }, { passive: true });

    document.addEventListener("click", function (event) {
      const link = event.target.closest("a[href]");
      if (!link) return;
      let url;
      try { url = new URL(link.href, window.location.href); } catch (error) { return; }
      const eventName = link.dataset.analyticsEvent
        || (/^(?:wa\.me|api\.whatsapp\.com)$/i.test(url.hostname) ? "whatsapp_click" : null)
        || (url.protocol === "mailto:" ? "email_click" : null)
        || (url.origin === window.location.origin ? "internal_link_click" : "outbound_link_click");
      if (!eventName) return;
      const eventDetails = {
        event: eventName,
        page_type: pageType,
        link_text: (link.textContent || "").trim().slice(0, 120),
        link_url: url.href,
        page_location: window.location.href
      };
      window.dataLayer.push(eventDetails);
      if (link.classList.contains("btn")) {
        window.dataLayer.push({
          event: "cta_click",
          page_type: pageType,
          cta_text: eventDetails.link_text,
          link_url: url.href,
          page_location: window.location.href
        });
      }
      if (/(^|\.)mindobirdwatching\.com$/i.test(url.hostname)) {
        window.dataLayer.push({
          event: "funnel_to_mbw",
          page_location: window.location.href,
          destination: url.href
        });
      } else if (/(^|\.)mindotours\.com$/i.test(url.hostname)) {
        window.dataLayer.push({
          event: "funnel_to_mindotours",
          page_location: window.location.href,
          destination: url.href
        });
      }
    });

  });

})();
