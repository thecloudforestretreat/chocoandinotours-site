const SITE_CONTEXT = "chocoandinotours";
const LEAD_SOURCE = "site_book_tour_choco_andino";
const LEAD_BRAND = "Chocó Andino Tours";
const SOURCE_DOMAIN = "chocoandinotours.com";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.TURNSTILE_SECRET_KEY || !env.BOOK_TOUR_APPS_SCRIPT_URL || !env.CF_SHARED_SECRET) {
      console.error("Booking endpoint is missing required environment variables.");
      return json({ ok: false, message: "The booking service is temporarily unavailable.", error_code: "missing-server-config" }, 503);
    }
    const contentType = request.headers.get("content-type") || "";
    if (!/multipart\/form-data|application\/x-www-form-urlencoded/i.test(contentType)) {
      return json({ ok: false, message: "Unsupported form submission.", error_code: "unsupported-content-type" }, 400);
    }
    const formData = await request.formData();
    if (String(formData.get("website") || "").trim()) return json({ ok: false, message: "Spam protection triggered.", error_code: "honeypot" }, 400);
    const token = String(formData.get("cf-turnstile-response") || "").trim();
    if (!token) return json({ ok: false, message: "Missing security verification.", error_code: "missing-turnstile" }, 400);
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "";
    const verifyBody = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
    if (ip) verifyBody.set("remoteip", ip);
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: verifyBody.toString()
    });
    let verifyJson = {};
    try { verifyJson = await verifyRes.json(); }
    catch (error) { return json({ ok: false, message: "Security verification is temporarily unavailable.", error_code: "turnstile-non-json" }, 502); }
    if (!verifyRes.ok || !verifyJson.success) return json({ ok: false, message: "Security verification failed. Please try again.", error_code: "turnstile-rejected" }, 403);
    if (!isAllowedHostname(verifyJson.hostname, env.TURNSTILE_ALLOWED_HOSTNAMES)) return json({ ok: false, message: "Security verification failed. Please try again.", error_code: "turnstile-hostname" }, 403);
    if (verifyJson.action && verifyJson.action !== "book_tour") return json({ ok: false, message: "Security verification failed. Please try again.", error_code: "turnstile-action" }, 403);

    /* Server-owned routing fields distinguish CAT from MBW and Mindo Tours. */
    formData.set("site_context", SITE_CONTEXT);
    formData.set("source_site", SITE_CONTEXT);
    formData.set("source_domain", SOURCE_DOMAIN);
    formData.set("lead_brand", LEAD_BRAND);
    formData.set("lead_source", LEAD_SOURCE);
    /* These existing CRM columns make the brand visible before the shared
       Apps Script is expanded with dedicated source_site columns. */
    formData.set("tour_category", "choco_andino");
    formData.set("interest_category", LEAD_BRAND);
    formData.set("service_type", "Chocó Andino Tour");
    formData.set("product_selected", "CAT-CUSTOM-ROUTE");
    formData.set("cf_secret", env.CF_SHARED_SECRET);
    if (ip) formData.set("ip_best_effort", ip);
    if (!String(formData.get("source_page") || "").trim()) formData.set("source_page", request.headers.get("Referer") || "");
    if (!String(formData.get("user_agent") || "").trim()) formData.set("user_agent", request.headers.get("User-Agent") || "");
    formData.delete("cf-turnstile-response");
    formData.delete("website");

    const upstreamBody = new URLSearchParams();
    for (const [key, value] of formData.entries()) upstreamBody.append(key, String(value));
    const upstreamPromise = fetchAppsScript(env.BOOK_TOUR_APPS_SCRIPT_URL, upstreamBody);
    const outcome = await Promise.race([
      upstreamPromise.then((result) => ({ settled: true, result }), (error) => ({ settled: true, error })),
      delay(7000).then(() => ({ settled: false }))
    ]);
    if (!outcome.settled) {
      const background = upstreamPromise.then(logBackground).catch((error) => console.error("Queued booking failed.", error));
      if (typeof context.waitUntil === "function") context.waitUntil(background);
      return json({ ok: true, accepted: true, processing: true }, 202);
    }
    if (outcome.error) return json({ ok: false, message: "The booking service could not process your request.", error_code: "upstream-unreachable" }, 502);
    const { response, text } = outcome.result;
    let data = {};
    try { data = JSON.parse(text); }
    catch (error) { return json({ ok: false, message: "The booking service could not process your request.", error_code: "upstream-non-json" }, 502); }
    if (!response.ok || data.ok === false) return json({ ok: false, message: "The booking service could not process your request.", error_code: "upstream-rejected" }, 502);
    return json({ ok: true, warning: data.warning || "" });
  } catch (error) {
    console.error("Server error while processing booking request.", error);
    return json({ ok: false, message: "Server error while processing booking request.", error_code: "server-error" }, 500);
  }
}

function delay(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }
async function fetchAppsScript(url, body) {
  let currentUrl = url;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(currentUrl, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: body.toString() });
    if (response.status >= 200 && response.status < 300) return { response, text: await response.text() };
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("Location");
      if (!location) return { response, text: await response.text() };
      if ([301, 302, 303].includes(response.status)) {
        const redirected = await fetch(location, { method: "GET", redirect: "follow" });
        return { response: redirected, text: await redirected.text() };
      }
      currentUrl = location;
      continue;
    }
    return { response, text: await response.text() };
  }
  return { response: new Response("Too many redirects", { status: 508 }), text: "Too many redirects" };
}
function logBackground(result) {
  if (!result.response.ok) return console.error("Queued booking destination failed.", result.response.status);
  try { if (JSON.parse(result.text).ok === false) console.error("Queued booking destination rejected the request."); }
  catch (error) { console.error("Queued booking destination returned non-JSON."); }
}
function isAllowedHostname(hostname, configured) {
  const normalized = String(hostname || "").trim().toLowerCase();
  const allowed = new Set(["chocoandinotours.com", "www.chocoandinotours.com", "staging.chocoandinotours.com"]);
  String(configured || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean).forEach((value) => allowed.add(value));
  return allowed.has(normalized) || /^[a-f0-9]{8}\.chocoandinotours-site\.pages\.dev$/.test(normalized);
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
