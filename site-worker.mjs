// Domain-level redirects require a handler; static _redirects rules match paths only.
export default {
  fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.aismallbizguru.com") {
      url.protocol = "https:";
      url.hostname = "aismallbizguru.com";
      url.port = "";
      return Response.redirect(url.toString(), 308);
    }
    return env.ASSETS.fetch(request);
  },
};
