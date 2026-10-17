import test from "node:test";
import assert from "node:assert/strict";
import worker from "../site-worker.mjs";

test("www redirects every path to HTTPS apex without losing encoded or repeated query values", async () => {
  for (const path of ["/", "/getting-started?from=www", "/a%20b?q=a%2Fb&q=&flag"]) {
    const response = await worker.fetch(new Request(`https://www.aismallbizguru.com${path}`), {
      ASSETS: { fetch() { throw new Error("www must redirect before serving assets"); } },
    });
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), `https://aismallbizguru.com${path}`);
  }
});

test("apex and workers.dev preserve static asset responses, including real 404s", async () => {
  for (const host of ["aismallbizguru.com", "aismallbizguru-site.hmarquardt.workers.dev"]) {
    const request = new Request(`https://${host}/getting-started`);
    const notFound = new Response("Guide forthcoming", { status: 404 });
    const response = await worker.fetch(request, {
      ASSETS: { fetch(received) { assert.equal(received, request); return notFound; } },
    });
    assert.equal(response, notFound);
  }
});
