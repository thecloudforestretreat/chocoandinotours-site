// Google Analytics 4 Loader

(function () {

  const GA_ID = "G-1ZYLW22XWP";

  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(script1);

  const script2 = document.createElement("script");
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}');
  `;

  document.head.appendChild(script2);

})();
