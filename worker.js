async function handleRequest(request) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return new Response("Missing `url` parameter", { status: 400 });
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

    const proxyReq = new Request(target, init);
    const proxiedRes = await fetch(proxyReq);

    const res = new Response(proxiedRes.body, proxiedRes); // Stream lại y chang
    const reqAllowHeaders = request.headers.get('Access-Control-Request-Headers');
    const allowHeaders = reqAllowHeaders ? reqAllowHeaders : 'Content-Type';

    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
    res.headers.set("Access-Control-Allow-Headers", allowHeaders);

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
