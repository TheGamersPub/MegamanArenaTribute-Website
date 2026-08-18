const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(process.argv[2] || ".");
const PORT = Number(process.argv[3] || 8000);

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".data": "application/octet-stream",
  ".bundle": "application/octet-stream",
  ".mem": "application/octet-stream",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
    let filePath = path.join(ROOT, safePath);

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Not found: " + urlPath);
      }

      const ext = path.extname(filePath);
      const headers = { "Content-Type": MIME[ext] || "application/octet-stream" };

      if (ext === ".br") {
        headers["Content-Encoding"] = "br";
        headers["Content-Type"] = MIME[path.extname(filePath.slice(0, -3))] || "application/octet-stream";
      } else if (ext === ".gz") {
        headers["Content-Encoding"] = "gzip";
        headers["Content-Type"] = MIME[path.extname(filePath.slice(0, -3))] || "application/octet-stream";
      }

      res.writeHead(200, headers);
      res.end(data);
    });
  })
  .listen(PORT, () => {
    console.log(`Serving "${ROOT}" at http://localhost:${PORT}`);
  });
