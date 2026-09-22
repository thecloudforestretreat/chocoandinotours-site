async function loadIncludes() {
  const header = document.getElementById("siteHeader");
  const footer = document.getElementById("siteFooter");

  await Promise.all([
    loadInclude(header, "/assets/includes/header.html"),
    loadInclude(footer, "/assets/includes/footer.html")
  ]);

  localizeIncludes();
  initMenu();
}

async function loadInclude(target, url) {
  if (!target) return;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load ${url}`);
    target.innerHTML = await response.text();
  } catch (error) {
    target.hidden = true;
    console.error(error);
  }
}

function localizeIncludes() {
  const isSpanish = document.documentElement.lang.toLowerCase().startsWith("es")
    || window.location.pathname === "/es/"
    || window.location.pathname.startsWith("/es/");

  const routes = {
    en: {
      home: ["/", "Home"],
      tours: ["/tours/", "Tours"],
      experiences: ["/experiences/", "Experiences"],
      guide: ["/choco-andino-travel-guide/", "Travel Guide"],
      about: ["/about/", "About"],
      contact: ["/contact/", "Contact"],
      book: ["/book-tour/", "Book a Tour"]
    },
    es: {
      home: ["/es/", "Inicio"],
      tours: ["/es/tours/", "Tours"],
      experiences: ["/es/experiencias/", "Experiencias"],
      guide: ["/es/guia-de-viaje-choco-andino/", "Guía de Viaje"],
      about: ["/es/sobre-nosotros/", "Nosotros"],
      contact: ["/es/contacto/", "Contacto"],
      book: ["/es/reservar-tour/", "Reservar Tour"]
    }
  };

  const locale = isSpanish ? "es" : "en";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const route = routes[locale][link.dataset.nav];
    if (!route) return;
    link.href = route[0];
    if (!link.classList.contains("brand")) link.textContent = route[1];
    if (normalizePath(link.pathname) === normalizePath(window.location.pathname)) {
      link.setAttribute("aria-current", "page");
    }
  });

  const alternateEn = document.querySelector('link[rel="alternate"][hreflang="en"]')?.href || "/";
  const alternateEs = document.querySelector('link[rel="alternate"][hreflang="es"]')?.href || "/es/";

  document.querySelectorAll('a[lang="en"]').forEach((link) => {
    link.href = alternateEn;
    link.classList.toggle("is-active", !isSpanish);
    if (!isSpanish) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.querySelectorAll('a[lang="es"]').forEach((link) => {
    link.href = alternateEs;
    link.classList.toggle("is-active", isSpanish);
    if (isSpanish) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const footerIntro = document.querySelector('[data-copy="footer-intro"]');
  const footerLegal = document.querySelector('[data-copy="footer-legal"]');
  if (isSpanish && footerIntro) {
    footerIntro.textContent = "Explora la cultura local, el cacao, el café, los paisajes de bosque nublado y las experiencias comunitarias del Chocó Andino ecuatoriano.";
  }
  if (isSpanish && footerLegal) {
    footerLegal.textContent = "© 2026 Chocó Andino Tours. Todos los derechos reservados.";
  }
}

function normalizePath(path) {
  const normalized = path.replace(/\/+$/, "");
  return normalized || "/";
}

function initMenu() {
  const toggle = document.querySelector(".menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (!toggle || !mobileMenu) return;

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    mobileMenu.hidden = expanded;
    mobileMenu.classList.toggle("is-open", !expanded);
    document.body.classList.toggle("menuOpen", !expanded);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    mobileMenu.hidden = true;
    mobileMenu.classList.remove("is-open");
    document.body.classList.remove("menuOpen");
  }
}

document.addEventListener("DOMContentLoaded", loadIncludes);
