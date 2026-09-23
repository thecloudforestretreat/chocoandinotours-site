/* Choco Andino Tours — first-party browser attribution.
 * Persists first/last touch and adds it to contact and booking forms.
 * Server-side D1 session storage can be added later without changing field names.
 */
(function () {
  "use strict";

  if (window.CATAttribution) return;

  var STORAGE_KEY = "cat_attribution_v1";
  var SESSION_MS = 30 * 60 * 1000;
  var MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
  var TRACKING_KEYS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "gclid", "gbraid", "wbraid", "fbclid",
    "meta_campaign_id", "meta_adset_id", "meta_ad_id"
  ];

  function now() { return new Date().toISOString(); }

  function id(prefix) {
    var value = window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
    return prefix + "_" + value;
  }

  function clean(value, max) {
    if (value == null) return null;
    value = String(value).trim();
    return value ? value.slice(0, max || 255) : null;
  }

  function params() {
    var query = new URLSearchParams(window.location.search || "");
    var result = {};
    TRACKING_KEYS.forEach(function (key) { result[key] = clean(query.get(key), 512); });
    return result;
  }

  function externalReferrer() {
    if (!document.referrer) return null;
    try {
      var referrer = new URL(document.referrer);
      if (referrer.origin === window.location.origin) return null;
      return (referrer.origin + referrer.pathname).slice(0, 2048);
    } catch (error) { return null; }
  }

  function landingPage() {
    var url = new URL(window.location.origin + window.location.pathname);
    var query = new URLSearchParams(window.location.search || "");
    TRACKING_KEYS.forEach(function (key) {
      var value = clean(query.get(key), 512);
      if (value) url.searchParams.set(key, value);
    });
    return url.toString().slice(0, 2048);
  }

  function touch(values) {
    var referrer = externalReferrer();
    var host = referrer ? new URL(referrer).hostname.toLowerCase() : "";
    var source = values.utm_source;
    var medium = values.utm_medium;

    if (!source && (values.gclid || values.gbraid || values.wbraid)) {
      source = "google"; medium = "paid_search";
    } else if (!source && values.fbclid) {
      source = "meta"; medium = "paid_social";
    } else if (!source && host) {
      source = host.replace(/^www\./, "").split(".")[0];
      medium = /google\.|bing\.|yahoo\.|duckduckgo\./i.test(host) ? "organic" : "referral";
    } else if (!source) {
      source = "direct"; medium = "none";
    }

    return {
      source: clean(source), medium: clean(medium || "unknown"),
      campaign: values.utm_campaign, content: values.utm_content, term: values.utm_term,
      landing_page: landingPage(), referrer: referrer, date: now()
    };
  }

  function load() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!value || Date.parse(value.updated_at || "") < Date.now() - MAX_AGE_MS) return null;
      return value;
    } catch (error) { return null; }
  }

  function save(value) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch (error) {}
  }

  var values = params();
  var state = load();
  var timestamp = now();
  var inbound = TRACKING_KEYS.some(function (key) { return Boolean(values[key]); }) || Boolean(externalReferrer());

  if (!state) {
    var firstTouch = touch(values);
    state = {
      visitor_id: id("v"), session_id: id("s"),
      first_seen_at: timestamp, session_started_at: timestamp,
      first_touch: firstTouch, last_touch: firstTouch,
      click_ids: {}, meta: {}
    };
  } else if (!state.session_id || Date.parse(state.last_activity_at || "") < Date.now() - SESSION_MS) {
    state.session_id = id("s");
    state.session_started_at = timestamp;
    state.last_touch = touch(values);
  } else if (inbound) {
    state.last_touch = touch(values);
  }

  ["gclid", "gbraid", "wbraid", "fbclid"].forEach(function (key) {
    if (values[key]) state.click_ids[key] = values[key];
  });
  ["meta_campaign_id", "meta_adset_id", "meta_ad_id"].forEach(function (key) {
    if (values[key]) state.meta[key] = values[key];
  });
  state.last_seen_at = timestamp;
  state.last_activity_at = timestamp;
  state.updated_at = timestamp;
  save(state);

  function status() {
    return state.last_touch && state.last_touch.source === "direct" ? "direct" : "captured";
  }

  function flatFields() {
    var last = state.last_touch || {};
    var result = {
      contact_intent_id: id("ci"),
      website_visitor_id: state.visitor_id,
      website_session_id: state.session_id,
      attribution_status: status(),
      attribution_quality: status() === "captured" ? "verified" : "partial",
      utm_source: last.source,
      utm_medium: last.medium,
      utm_campaign: last.campaign,
      utm_content: last.content,
      utm_term: last.term,
      gclid: state.click_ids.gclid,
      gbraid: state.click_ids.gbraid,
      wbraid: state.click_ids.wbraid,
      fbclid: state.click_ids.fbclid,
      meta_campaign_id: state.meta.meta_campaign_id,
      meta_adset_id: state.meta.meta_adset_id,
      meta_ad_id: state.meta.meta_ad_id
    };
    ["first_touch", "last_touch"].forEach(function (prefix) {
      var value = state[prefix] || {};
      ["source", "medium", "campaign", "content", "term", "landing_page", "referrer", "date"].forEach(function (key) {
        result[prefix + "_" + key] = value[key];
      });
    });
    return result;
  }

  function addToForm(form) {
    var fields = flatFields();
    Object.keys(fields).forEach(function (name) {
      var input = form.querySelector('input[type="hidden"][name="' + name + '"]');
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        form.appendChild(input);
      }
      input.value = fields[name] == null ? "" : String(fields[name]);
    });
  }

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || form.tagName !== "FORM") return;
    var action = form.getAttribute("action") || "";
    if (action.indexOf("/api/book-tour") !== -1 || action.indexOf("/api/contact") !== -1) addToForm(form);
  }, true);

  window.CATAttribution = {
    getAttribution: function () { return JSON.parse(JSON.stringify(state)); },
    addToForm: addToForm
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "attribution_ready",
    attribution_source: (state.last_touch || {}).source || "direct",
    attribution_medium: (state.last_touch || {}).medium || "none",
    visitor_id: state.visitor_id,
    session_id: state.session_id
  });
})();
