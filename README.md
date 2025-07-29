# 🌐 cloudflare-proxy

Inspired by **[tuanpb99/cf-worker-telegram](https://github.com/tuanpb99/cf-worker-telegram)**, this Cloudflare Worker script has been adapted to act as a **transparent proxy for any HTTP or HTTPS URL**, powered by Cloudflare’s global edge network.

---

## 1️⃣ Overview

Originally designed as a proxy for the Telegram Bot API, this Worker now lets you forward requests to **any HTTP(S) endpoint** while:

- Maintaining original status codes, headers, and body content  
- Supporting all HTTP methods (`GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`, etc.)  
- Enabling **CORS** for browser-based environments  
- Serving a built-in documentation page at the root path (`/`)  

---

## 2️⃣ Features

- ✅ Proxy to *any* HTTP or HTTPS URL using the `?url=...` query param  
- ✅ Full support for **CORS**, great for browser usage  
- ✅ Handles all HTTP methods  
- ✅ Supports `application/json` and UTF‑8 encoded bodies  
- ✅ Streams large responses efficiently  
- ✅ Stateless: no logging or storage  
- ✅ Lightweight and fast (runs at Cloudflare’s edge)

---

## 3️⃣ Limitations

- ⚠️ This proxy is **public** by default — it does **not** enforce authentication or domain restrictions
- ⚠️ Although `http://` destinations are supported, they are **not secure** and should be avoided for sensitive data
- ❌ Does **not** support WebSockets or raw TCP/UDP

---

## 4️⃣ Built-in Documentation

Accessing the root path (`https://your-worker.workers.dev/`) returns a user-friendly HTML page that explains how to use the proxy, with example requests and usage notes.

---

## 5️⃣ Security Recommendations

If you plan to expose this worker publicly, consider implementing some or all of the following:

- 🛡 **Allowlist trusted domains**  
- 🔐 **Require an access token** via query param or header  
- 🚫 **Rate-limit** or filter based on IP/User-Agent  
- 🔎 **Audit usage logs** via external reverse proxy or edge analytics

---

## 6️⃣ Installation

1. **Download the Script**  
   Get [`worker.js`](./worker.js) from this repo (or modify as needed)

2. **Create a Cloudflare Worker**  
   You can follow this guide to create one with a custom domain:  
   👉 https://dev.to/andyjessop/setting-up-a-new-cloudflare-worker-with-a-custom-domain-fl9

3. **Deploy the Worker**  
   - Go to [Cloudflare dashboard](https://dash.cloudflare.com/)  
   - Navigate to **Workers & Pages**  
   - Create a new Worker  
   - Paste in your code (from `worker.js`)  
   - Click **Deploy**

---

## 7️⃣ Usage

Send HTTP requests to your Worker with a query parameter like `?url=https://example.com/...`.

### 🔗 Original Request

https://example.com/api/data?query=param

### 💡 Example Code (JavaScript)

```js
fetch('https://<YOUR_WORKER_URL>/?url=https://example.com/api/data?query=param', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'X-Custom-Header': 'CustomValue'
  },
  body: JSON.stringify({
    name: 'John Doe',
    age: 30,
    message: 'Hello from Cloudflare Worker proxy!'
  })
})
  .then(response => response.json())
  .then(data => console.log('Response:', data))
  .catch(err => console.error('Error:', err));
```

### ✅ Supported HTTP Methods
- GET
- POST
- PUT
- DELETE
- OPTIONS
- HEAD

The Worker automatically forwards request headers and body (for non-GET/HEAD requests), and includes permissive CORS headers in the response.

ℹ️ This method supports any website that allows being accessed through a proxy. It is especially useful for client-side apps restricted by CORS.

### 📄 License
Based on an open-source MIT-licensed project from tuanpb99/cf-worker-telegram. This fork or adaptation retains the MIT License.
