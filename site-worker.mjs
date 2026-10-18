// Domain-level redirects require a handler; static _redirects rules match paths only.
export default {
  fetch(request, env) {
    const url = new URL(request.url);
    const isWww = url.hostname === "www.aismallbizguru.com";
    const hasGuideTrailingSlash = url.pathname === "/getting-started/";
    if (isWww || hasGuideTrailingSlash) {
      if (isWww) {
        url.protocol = "https:";
        url.hostname = "aismallbizguru.com";
        url.port = "";
      }
      if (hasGuideTrailingSlash) url.pathname = "/getting-started";
      return Response.redirect(url.toString(), 308);
    }
    return env.ASSETS.fetch(request);
  },
};
