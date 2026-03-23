export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();

    const turnstileToken = formData.get("cf-turnstile-response");
    if (!turnstileToken) {
      return json({ ok: false, message: "Missing Turnstile token." }, 400);
    }

    const ip =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("x-forwarded-for") ||
      "";

    const verifyBody = new URLSearchParams();
    verifyBody.append("secret", env.TURNSTILE_SECRET_KEY);
    verifyBody.append("response", turnstileToken);
    if (ip) verifyBody.append("remoteip", ip);

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: verifyBody.toString()
    });

    const verifyJson = await verifyRes.json();

    if (!verifyJson.success) {
      return json({
        ok: false,
        message: "Turnstile verification failed.",
        errors: verifyJson["error-codes"] || []
      }, 403);
    }

    formData.set("cf_secret", env.CF_SHARED_SECRET);

    if (ip) {
      formData.set("ip_best_effort", ip);
    }

    const sourcePage = formData.get("source_page");
    if (!sourcePage) {
      formData.set("source_page", request.headers.get("Referer") || "");
    }

    const ua = request.headers.get("User-Agent") || "";
    if (!formData.get("user_agent") && ua) {
      formData.set("user_agent", ua);
    }

    formData.delete("cf-turnstile-response");

    const upstreamRes = await fetch(env.BOOK_TOUR_APPS_SCRIPT_URL, {
      method: "POST",
      body: formData
    });

    const text = await upstreamRes.text();

    let upstreamJson;
    try {
      upstreamJson = JSON.parse(text);
    } catch (e) {
      return json({
        ok: false,
        message: "Apps Script returned a non-JSON response.",
        raw: text
      }, 502);
    }

    if (!upstreamRes.ok || upstreamJson.ok === false) {
      return json({
        ok: false,
        message: upstreamJson.message || "Upstream booking handler failed.",
        warning: upstreamJson.warning || ""
      }, 502);
    }

    return json({
      ok: true,
      warning: upstreamJson.warning || ""
    });
  } catch (err) {
    return json({
      ok: false,
      message: "Server error while processing booking request."
    }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
