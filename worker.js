async function handleRequest(request) {
  const originalUrl = new URL(request.url);
  const baseUrlParam = originalUrl.searchParams.get("url");

  let targetUrl;

  if (baseUrlParam) {
    targetUrl = new URL(baseUrlParam);
    for (const [key, value] of originalUrl.searchParams.entries()) {
      if (key !== "url") {
        targetUrl.searchParams.append(key, value);
      }
    }
    if (new URL(baseUrlParam).pathname === "/" || new URL(baseUrlParam).pathname === "") {
      targetUrl.pathname = originalUrl.pathname;
    }
  } else {
    const referer = request.headers.get("referer");
    if (!referer) {
      return new Response("Missing `url` parameter and referer", { status: 400 });
    }

    const refUrl = new URL(referer);
    const refBase = refUrl.searchParams.get("url");
    if (!refBase) {
      return new Response("Missing base `url` in referer", { status: 400 });
    }

    targetUrl = new URL(refBase);
    if (new URL(refBase).pathname === "/" || new URL(refBase).pathname === "") {
      targetUrl.pathname = originalUrl.pathname;
    }
    targetUrl.search = originalUrl.search;
  }

  try {
    const method = request.method;
    const headers = new Headers(request.headers);
    const contentType = headers.get("Content-Type");
    if (contentType && contentType.startsWith("application/json") && !contentType.includes("charset")) {
      headers.set("Content-Type", "application/json; charset=UTF-8");
    }

    const init = {
      method,
      headers,
      redirect: "follow",
    };

    if (method !== "GET" && method !== "HEAD") {
      init.body = request.body;
    }

    const proxyReq = new Request(targetUrl.toString(), init);
    const proxiedRes = await fetch(proxyReq);

    const resContentType = proxiedRes.headers.get("Content-Type") || "";

    // Nếu là HTML, xử lý lại nội dung để rewrite URL
    if (resContentType.includes("text/html")) {
      let html = await proxiedRes.text();
      const baseProxy = `https://proxy.kimtin-tr.workers.dev/?url=`;

      // Chuyển các href/src/action thành proxy link
      html = html.replace(
        /(?:href|src|action)=["']([^"']+)["']/gi,
        (match, p1) => {
          if (p1.startsWith("javascript:") || p1.startsWith("#")) return match;
          const newUrl = new URL(p1, targetUrl).toString();
          return match.replace(p1, `${baseProxy}${encodeURIComponent(newUrl)}`);
        }
      );

      const response = new Response(html, {
        status: proxiedRes.status,
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Content-Type",
          "Cache-Control": "no-store",
        },
      });

      return response;
    }

    // Nếu không phải HTML, trả lại nguyên văn
    const res = new Response(proxiedRes.body, proxiedRes);
    const reqAllowHeaders = request.headers.get("Access-Control-Request-Headers");
    const allowHeaders = reqAllowHeaders ? reqAllowHeaders : "Content-Type";

    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
    res.headers.set("Access-Control-Allow-Headers", allowHeaders);
    res.headers.set("Cache-Control", "no-store");

    return res;
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { status: 500 });
  }
}

function handleOptions(request) {
  const reqAllowHeaders = request.headers.get("Access-Control-Request-Headers");
  const allowHeaders = reqAllowHeaders ? reqAllowHeaders : "Content-Type";

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": allowHeaders,
    "Access-Control-Max-Age": "86400",
  };

  return new Response(null, { status: 204, headers });
}

addEventListener("fetch", event => {
  if (event.request.method === "OPTIONS") {
    event.respondWith(handleOptions(event.request));
  } else {
    event.respondWith(handleRequest(event.request));
  }
});
