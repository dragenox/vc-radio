let SERVER_START_TIME = 0;
let GLOBAL_LOOP_SECONDS = 0;
let stations = [];
let currentStation = 1;
const audio = document.getElementById("audio");

async function loadConfig() {
  const res = await fetch("/api/config");
  const config = await res.json();

  SERVER_START_TIME = config.server_start_time * 1000;
  GLOBAL_LOOP_SECONDS = config.shortest_duration;
  stations = config.stations;

  initFromURL();
}

function getGlobalOffset() {
  const now = Date.now();
  const elapsed = (now - SERVER_START_TIME) / 1000;
  return elapsed % GLOBAL_LOOP_SECONDS;
}

function playStation(id) {
  const station = stations.find(s => s.id === id);
  if (!station) return;

  currentStation = id;
  audio.src = station.file;
  document.getElementById("station-name").innerText = station.name;

  audio.addEventListener("loadedmetadata", () => {
    const offset = getGlobalOffset();
    const safeOffset = Math.min(offset, audio.duration - 1);
    audio.currentTime = safeOffset;
    audio.play();
  }, { once: true });
}

function nextStation() {
  let next = currentStation + 1;
  if (next > stations.length) next = 1;
  playStation(next);
  history.pushState(null, "", "/" + next);
}

function prevStation() {
  let prev = currentStation - 1;
  if (prev < 1) prev = stations.length;
  playStation(prev);
  history.pushState(null, "", "/" + prev);
}

function initFromURL() {
  const path = window.location.pathname.replace("/", "");

  if (!path) {
    const random = Math.floor(Math.random() * stations.length) + 1;
    playStation(random);
  } else {
    const stationNum = parseInt(path);
    if (stationNum >= 1 && stationNum <= stations.length) {
      playStation(stationNum);
    } else {
      playStation(1);
    }
  }
}

loadConfig();