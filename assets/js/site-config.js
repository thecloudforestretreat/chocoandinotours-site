(function () {
  "use strict";

  var whatsappNumberDigits = "13054585402";
  var config = {
    siteName: "Chocó Andino Tours",
    sourceSite: "chocoandinotours",
    sourceDomain: "chocoandinotours.com",
    canonicalOrigin: "https://chocoandinotours.com",
    stagingOrigin: "https://staging.chocoandinotours.com",
    googleTagManagerId: "GTM-NSBP2KS8",
    googleAnalyticsId: "G-737ZDQNTDX",
    turnstileSiteKey: "0x4AAAAAAFAK3qCPK3mSSEPX",
    contactEmail: "mindobirdwatching@gmail.com",
    whatsappNumberDigits: whatsappNumberDigits,
    whatsappMessages: {
      book_tour_en: "Hi Chocó Andino Tours, I would like to request a private tour or experience in the Chocó Andino. Can you help with availability and next steps?\n\nPage: {url}",
      book_tour_es: "Hola Chocó Andino Tours, quisiera solicitar un tour privado o una experiencia en el Chocó Andino. ¿Pueden ayudarme con disponibilidad y los próximos pasos?\n\nPágina: {url}"
    }
  };

  function pageLanguage() {
    return String(document.documentElement.lang || "en").toLowerCase().indexOf("es") === 0 ? "es" : "en";
  }

  function messageKey(requested) {
    if (requested && config.whatsappMessages[requested]) return requested;
    return pageLanguage() === "es" ? "book_tour_es" : "book_tour_en";
  }

  function updateContactLinks(root) {
    var scope = root && root.querySelectorAll ? root : document;
    Array.prototype.forEach.call(scope.querySelectorAll("[data-whatsapp-message-key]"), function (link) {
      var message = config.whatsappMessages[messageKey(link.getAttribute("data-whatsapp-message-key"))]
        .replace("{url}", window.location.href);
      link.href = "https://wa.me/" + whatsappNumberDigits + "?text=" + encodeURIComponent(message);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
    Array.prototype.forEach.call(scope.querySelectorAll("[data-contact-email-link]"), function (link) {
      var subject = link.getAttribute("data-email-subject") || "Chocó Andino tour request";
      link.href = "mailto:" + config.contactEmail + "?subject=" + encodeURIComponent(subject);
    });
    Array.prototype.forEach.call(scope.querySelectorAll("[data-contact-email-text]"), function (node) {
      node.textContent = config.contactEmail;
    });
  }

  window.CHOCOTOURS_CONFIG = Object.freeze(config);
  window.CAT_CONTACTS = { update: updateContactLinks };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { updateContactLinks(); });
  else updateContactLinks();
})();
