/* AI Small Business Guru analytics client.
   Collector: CFLab Analytics (`cflab-analytics` Worker). This client follows the
   Worker's canonical payload and privacy model, but is self-hosted so the site
   keeps its "scripts must be self-hosted" rule and the page never loads a
   third-party origin. The public tracking ID is safe in a browser; the collector
   checks the source origin against the domains registered for this site.

   Events sent: `pageview` automatically, once per load; `contact_cta_click` for
   clicks on contact links (`method` is `form` or `email`); `live_app_click` for
   clicks from a case study or portfolio card to a live product; and
   `contact_submit` from contact.js only after the endpoint confirms success.

   Privacy: no cookies, no persistent visitor identifier, no fingerprint, no raw
   User-Agent, no page content or form data. The anonymous session ID lives in
   sessionStorage only and rotates after 30 minutes of inactivity. Do Not Track
   and Global Privacy Control suppress every request. Only the pathname (no query
   string) and UTM parameters are read from the URL; the referrer is reduced to a
   hostname by the collector. Analytics failures are silent. */
(function () {
  "use strict";

  var SITE_ID = "as_4YsDnNOcpAQq4l1ARNY2pl";
  var ENDPOINT = "https://analytics.aismallbizguru.com/collect";
  var SESSION_KEY = "aismallbizguru.analytics.session";
  var SESSION_IDLE_MS = 30 * 60 * 1000;
  var pageviewSent = false;

  function privacyOptOut() {
    try {
      if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return true;
      if (navigator.globalPrivacyControl === true) return true;
    } catch (error) {}
    return false;
  }

  function randomToken(prefix) {
    try {
      var bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      var out = "";
      for (var i = 0; i < bytes.length; i += 1) out += bytes[i].toString(16).padStart(2, "0");
      return prefix + out;
    } catch (error) {
      return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
  }

  function sessionId() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.id && typeof parsed.at === "number" && Date.now() - parsed.at < SESSION_IDLE_MS) {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: parsed.id, at: Date.now() }));
          return parsed.id;
        }
      }
      var next = randomToken("s_");
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: next, at: Date.now() }));
      return next;
    } catch (error) {
      return null;
    }
  }

  // Only UTM parameters are read from the query string. No other query value is
  // sent, and the collector stores the pathname without the query.
  function utm() {
    var out = {};
    try {
      var params = new URLSearchParams(window.location.search || "");
      var keys = ["source", "medium", "campaign", "content", "term"];
      for (var i = 0; i < keys.length; i += 1) {
        var value = params.get("utm_" + keys[i]);
        if (value) out[keys[i]] = value.slice(0, 200);
      }
    } catch (error) {}
    return out;
  }

  function send(kind, name, props) {
    try {
      if (privacyOptOut()) return false;
      var session = sessionId();
      if (!session) return false;
      var payload = {
        site: SITE_ID,
        kind: kind,
        name: name,
        path: window.location.pathname,
        session: session,
        event_uid: randomToken("e_"),
        referrer: document.referrer || undefined,
        utm: utm(),
        props: props || undefined
      };
      if (!window.fetch) return false;
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        mode: "cors",
        credentials: "omit"
      }).catch(function () {});
      return true;
    } catch (error) {
      return false;
    }
  }

  function track(name, props) {
    try {
      if (typeof name !== "string" || !name) return false;
      return send("event", name, props && typeof props === "object" ? props : undefined);
    } catch (error) {
      return false;
    }
  }

  function pageview() {
    if (pageviewSent) return;
    pageviewSent = true;
    send("pageview", "pageview");
  }

  function contactPlacement(anchor) {
    if (anchor.closest("nav")) return "nav";
    if (anchor.closest("footer")) return "footer";
    var section = anchor.closest("section");
    if (section) {
      if (section.id) return section.id;
      if (section.classList.contains("work-cta")) return "work-cta";
    }
    return "page";
  }

  // One delegated listener covers every contact link, mailto link and marked
  // live-product link without adding inline handlers to the pages.
  document.addEventListener("click", function (event) {
    try {
      var target = event.target;
      var anchor = target && target.closest ? target.closest("a") : null;
      if (!anchor) return;

      var project = anchor.getAttribute("data-live-project");
      if (project) {
        track("live_app_click", {
          project: project,
          placement: anchor.closest(".work-card") ? "portfolio" : "case-study"
        });
        return;
      }

      var href = anchor.getAttribute("href") || "";
      if (href.indexOf("mailto:") === 0) {
        track("contact_cta_click", { method: "email", placement: contactPlacement(anchor) });
        return;
      }

      var url;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch (error) {
        return;
      }
      if (url.origin === window.location.origin && (url.pathname === "/contact" || url.pathname === "/contact/")) {
        track("contact_cta_click", { method: "form", placement: contactPlacement(anchor) });
      }
    } catch (error) {}
  }, true);

  window.aismallbizguruAnalytics = { track: track };

  if (document.readyState === "complete") window.setTimeout(pageview, 0);
  else window.addEventListener("load", pageview, { once: true });
}());

