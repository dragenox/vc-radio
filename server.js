const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 22318;
const SERVER_START_TIME = Date.now() / 1000;

// ---- Parse INI manually ----
function parseConfig(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  let section = null;
  const config = { general: {}, stations: {} };

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("[") && line.endsWith("]")) {
      section = line.slice(1, -1);
      continue;
    }

    const [key, ...rest] = line.split("=");
    if (!key || !section) continue;

    config[section][key.trim()] = rest.join("=").trim();
  }

  return config;
}

const config = parseConfig("./vc-radio.conf");

const MUSIC_FOLDER = config.general.music_folder;
const SHORTEST_DURATION = parseFloat(config.general.shortest_duration);

const STATIONS = Object.entries(config.stations).map(([id, value]) => {
  const [name, file] = value.split("|").map(v => v.trim());
  return {
    id: parseInt(id),
    name,
    file: `/music/${file}`
  };
});

// ---- Server ----
const server = http.createServer((req, res) => {

  if (req.url === "/api/config") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      server_start_time: SERVER_START_TIME,
      shortest_duration: SHORTEST_DURATION,
      stations: STATIONS
    }));
    return;
  }

  if (req.url.startsWith("/music/")) {
    const filePath = path.join(__dirname, MUSIC_FOLDER, req.url.replace("/music/", ""));
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { "Content-Type": "audio/mpeg" });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
    return;
  }

  // Handle SPA routes (/, /1, /2, etc)
  if (/^\/\d*$/.test(req.url)) {
    const spaPath = path.join(__dirname, "index.html");
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream(spaPath).pipe(res);
    return;
  }
  let filePath = req.url === "/" ? "index.html" : req.url.slice(1);
  filePath = path.join(__dirname, filePath);

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const contentType = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript"
    }[ext] || "text/plain";

    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end("Not found");
  }

});

server.listen(PORT, () => {
  console.log(`Vice City Radio running on port ${PORT}`);
  console.log(`http://localhost:${PORT}/`);
});