async function handleRequest(request) {
  const originalUrl = new URL(request.url);
  const baseUrlParam = originalUrl.searchParams.get("url");

  let targetUrl;

  if (baseUrlParam) {
    // Nếu là request chính, dùng `url` param để xác định target
    targetUrl = new URL(baseUrlParam);

    // Ghép thêm toàn bộ query params trừ `url`
    for (const [key, value] of originalUrl.searchParams.entries()) {
      if (key !== "url") {
        targetUrl.searchParams.append(key, value);
      }
    }

    // Chỉ ghi đè pathname nếu url gốc không có path
    if (new URL(baseUrlParam).pathname === "/" || new URL(baseUrlParam).pathname === "") {
      targetUrl.pathname = originalUrl.pathname;
    }
  } else {
    // Nếu không có `url` param → xử lý như request phụ (JS/CSS từ SPA)
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

    // Chỉ ghi đè nếu url base là `/`
    if (new URL(refBase).pathname === "/" || new URL(refBase).pathname === "") {
      targetUrl.pathname = originalUrl.pathname;
    }

    // Giữ nguyên query string nếu có
    targetUrl.search = originalUrl.search;
  }

  try {
    const method = request.method;
    const headers = new Headers(request.headers);

    // Nếu là JSON mà thiếu charset thì thêm vào để tránh lỗi emoji
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
