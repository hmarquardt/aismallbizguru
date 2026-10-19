import test from "node:test";
import assert from "node:assert/strict";
import worker from "../site-worker.mjs";

test("www redirects every path to HTTPS apex without losing encoded or repeated query values", async () => {
  for (const path of [
    "/",
    "/getting-started?from=www",
    "/contact?from=www",
    "/a%20b?q=a%2Fb&q=&flag",
  ]) {
    const response = await worker.fetch(new Request(`https://www.aismallbizguru.com${path}`), {
      ASSETS: { fetch() { throw new Error("www must redirect before serving assets"); } },
    });
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), `https://aismallbizguru.com${path}`);
  }
});

test("www and the guide trailing slash normalize in one canonical redirect", async () => {
  const response = await worker.fetch(
    new Request("https://www.aismallbizguru.com/getting-started/?utm=a%2Fb&utm="),
    { ASSETS: { fetch() { throw new Error("redirect must not reach assets"); } } },
  );
  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("location"),
    "https://aismallbizguru.com/getting-started?utm=a%2Fb&utm=",
  );
  const slash = await worker.fetch(
    new Request("https://aismallbizguru-site.hmarquardt.workers.dev/getting-started/"),
    { ASSETS: { fetch() { throw new Error("redirect must not reach assets"); } } },
  );
  assert.equal(slash.status, 308);
  assert.equal(
    slash.headers.get("location"),
    "https://aismallbizguru-site.hmarquardt.workers.dev/getting-started",
  );
});

test("apex and workers.dev serve the guide directly and preserve real 404s", async () => {
  for (const host of ["aismallbizguru.com", "aismallbizguru-site.hmarquardt.workers.dev"]) {
    for (const path of ["/getting-started", "/getting-started?from=home"]) {
      const request = new Request(`https://${host}${path}`);
      const found = new Response("Getting started", { status: 200 });
      const response = await worker.fetch(request, {
        ASSETS: {
          fetch(received) {
            assert.equal(received, request);
            return found;
          },
        },
      });
      assert.equal(response, found);
    }
    const request = new Request(`https://${host}/not-a-real-page`);
    const notFound = new Response("Page not found", { status: 404 });
    const response = await worker.fetch(request, {
      ASSETS: { fetch(received) { assert.equal(received, request); return notFound; } },
    });
    assert.equal(response, notFound);
  }
});
