// Global Head Loader
// Loads Google Analytics

(function () {

  const GA_ID = "G-1ZYLW22XWP";

  const gaScript = document.createElement("script");
  gaScript.async = true;
  gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(gaScript);

  const gaConfig = document.createElement("script");
  gaConfig.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}');
  `;

  document.head.appendChild(gaConfig);

})();
