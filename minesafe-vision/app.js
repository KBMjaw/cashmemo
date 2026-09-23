/* =====================================================================
   MineSafe-Vision — browser prototype
   Live webcam + in-browser object detection (TensorFlow.js COCO-SSD)
   + simulated radar/LiDAR fusion + safe-distance risk engine
   + driver alerts (Web Audio + speech) + simulated control room.

   Plain JavaScript, no build step. Open via http://localhost or https://
   (browsers only allow webcam access in a secure context).
   ===================================================================== */
'use strict';
(() => {

/* ------------------------------------------------------------------ */
/* 1. Constants                                                        */
/* ------------------------------------------------------------------ */
// AI libraries and model weights are bundled in /vendor and /models so detection also works offline.
// CDN copies are only used as a fallback if the local files are missing.
const TFJS_SRC = ['vendor/tf.min.js', 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js'];
const COCO_SRC = ['vendor/coco-ssd.min.js', 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js'];
const MODEL_SRC = ['models/ssdlite_mobilenet_v2/model.json', null]; // null → library's default hosted model

const LEVELS = ['SAFE', 'CAUTION', 'CRITICAL'];
const LEVEL_CLS = ['safe', 'caution', 'critical'];
const LEVEL_COL = ['#3fb950', '#f0a53a', '#e5484d'];

// COCO-SSD classes relevant to a haul road. H/W = typical real height/width (m) for the pinhole estimate.
const CLASSES = {
  person:     { type: 'person',  label: 'PERSON',     H: 1.70, W: 0.50 },
  car:        { type: 'vehicle', label: 'CAR',        H: 1.50, W: 1.80 },
  truck:      { type: 'vehicle', label: 'TRUCK',      H: 3.00, W: 2.50 },
  bus:        { type: 'vehicle', label: 'BUS',        H: 3.20, W: 2.55 },
  motorcycle: { type: 'vehicle', label: 'MOTORCYCLE', H: 1.20, W: 0.80 },
  bicycle:    { type: 'vehicle', label: 'BICYCLE',    H: 1.10, W: 0.60 },
};
const CAM_FOV_DEG = 60; // assumed horizontal field of view of a typical laptop webcam

// Simulation scenarios (distances/speeds chosen to match the demo script)
const SCN = {
  clear:   { label: 'CLEAR ROAD' },
  vehicle: { type: 'vehicle', label: 'VEHICLE', name: 'Haul truck ahead', dist: 18, objSpeed: 22, conf: 0.91, X: 0.4,  H: 4.4, W: 5.6 },
  person:  { type: 'person',  label: 'PERSON',  name: 'Worker on road',   dist: 25, objSpeed: 0,  conf: 0.88, X: -3.0, H: 1.75, W: 0.62 },
  rock:    { type: 'rock',    label: 'ROCK',    name: 'Rock obstacle',    dist: 18, objSpeed: 0,  conf: 0.74, X: 1.2,  H: 0.95, W: 1.7 },
};

const SENSOR_DEF = [
  ['rgb', 'RGB CAMERA'], ['thermal', 'THERMAL CAMERA'], ['radar', 'mmWAVE RADAR'], ['lidar', 'LiDAR'],
  ['gps', 'GPS'], ['imu', 'IMU'], ['vis', 'VISIBILITY'],
];
const SENSOR_NAME = Object.fromEntries(SENSOR_DEF);

const DEFAULTS = {
  mode: 'sim',
  speed: 28, loaded: true,
  fog: false, dust: false,
  scenario: 'clear', simDist: 18, motion: false,
  p: { react: 1.5, decel: 3.0, margin: 5, load: 1.25, band: 1.5, fogVis: 320, dustVis: 60 },
  ranging: 'auto', manual: { radar: 18.2, lidar: 18.6 },
  sensors: { rgb: true, thermal: true, radar: true, lidar: true, gps: true, imu: true, vis: true },
  ai: true, minConf: 0.5, scale: 10, net: true,
};

/* ------------------------------------------------------------------ */
/* 2. State                                                            */
/* ------------------------------------------------------------------ */
let S = clone(DEFAULTS);
const R = {
  cam: { stream: null, state: 'off', deviceId: null },
  ai: { model: null, state: 'idle', busy: false, lastRun: 0, inferMs: 0, err: '' },
  tracks: [], tid: 0,
  noise: { radar: 0, lidar: 0, cam: 0, conf: 0, t: 0 },
  objects: [], prim: null, assess: null, vis: null, safe: null,
  level: 0, lowerSince: 0,
  cover: { s: 1, ox: 0, oy: 0, vw: 1280, vh: 720 },
  calib: readCalib(),
  log: [], queue: [], lastLinkT: Date.now(), frozen: null,
  gps: { lat: 19.8765, lon: 75.3412, heading: 47 },
  series: [], phase: 0,
  fpsFrames: 0, fpsT: 0, fps: 0,
  uiT: 0, thT: 0, mapT: 0, dataT: 0,
  particles: [],
};

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function readCalib() { try { const v = parseFloat(localStorage.getItem('msv-calib')); return v > 0.1 && v < 10 ? v : 1; } catch { return 1; } }
function saveCalib(v) { try { localStorage.setItem('msv-calib', String(v)); } catch { /* storage unavailable */ } }

/* ------------------------------------------------------------------ */
/* 3. Helpers                                                          */
/* ------------------------------------------------------------------ */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const f0 = (n) => (n == null || !isFinite(n) ? '—' : Math.round(n).toString());
const f1 = (n) => (n == null || !isFinite(n) ? '—' : n.toFixed(1));
const f2 = (n) => (n == null || !isFinite(n) ? '—' : n.toFixed(2));
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function hhmmss(d = new Date()) { return d.toTimeString().slice(0, 8); }
function setText(el, v) { if (el && el.textContent !== String(v)) el.textContent = v; }
function setClass(el, v) { if (el && el.className !== v) el.className = v; }
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function iou(a, b) {
  const x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[0] + a[2], b[0] + b[2]), y2 = Math.min(a[1] + a[3], b[1] + b[3]);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return inter / (a[2] * a[3] + b[2] * b[3] - inter || 1);
}

/* ------------------------------------------------------------------ */
/* 4. DOM                                                              */
/* ------------------------------------------------------------------ */
const view = $('#view'), ctx = view.getContext('2d');
const W = view.width, H = view.height;
const video = $('#video');
const thermal = $('#thermal'), tctx = thermal.getContext('2d');
const chart = $('#chart'), cctx = chart.getContext('2d');
const el = {};
['camStatus', 'sceneTag', 'camSelect', 'btnCamStart', 'btnCamStop', 'camMsg', 'camMsgTitle', 'camMsgText', 'btnAI', 'aiStatus',
 'inConf', 'outConf', 'inScale', 'fps', 'riskCard', 'riskText', 'riskSub', 'stSpeed', 'stVis', 'stObj', 'stDist', 'stDistSrc',
 'stSafe', 'stRel', 'stTtc', 'reasons', 'sensorStrip', 'alertBar', 'alertText', 'alertMeta', 'dSpeed', 'dVis', 'dObj', 'dDist',
 'dDistU', 'dSafe', 'dRisk', 'dRiskTile', 'dAlert', 'drvLocal', 'crCard', 'crLink', 'crGps', 'crSpeed', 'crVis', 'crDist', 'crRisk',
 'fleet', 'log', 'dataGrid', 'rangeSeg', 'fusionNote', 'fRadar', 'fLidar', 'fCam', 'fFused', 'manualBox', 'inRadar', 'inLidar',
 'inCalDist', 'calNote', 'formula', 'inSpeed', 'outSpeed', 'inDist', 'outDist', 'inMotion', 'btnFog', 'btnDust', 'btnFault',
 'btnSound', 'btnMute', 'btnNet', 'clock', 'hdrLink', 'hdrLinkDot', 'tabLive', 'tabSim', 'mapDyn', 'mapZones', 'safeSeg',
 'pReact', 'pDecel', 'pMargin', 'pLoad', 'pLoaded', 'pBand', 'pFogVis', 'pDustVis'].forEach((id) => { el[id] = document.getElementById(id); });
const road = document.getElementById('road');
const ROAD_LEN = road.getTotalLength();

/* ------------------------------------------------------------------ */
/* 5. Camera                                                           */
/* ------------------------------------------------------------------ */
async function startCamera(deviceId) {
  hideCamMsg();
  if (!window.isSecureContext) {
    R.cam.state = 'error';
    showCamMsg('CAMERA OFFLINE', 'Browsers only allow the webcam on a <b>secure page</b>. Open the app at <b>http://localhost:8000</b> (see README) or on the <b>https://</b> Vercel link, not from a plain http:// network address.');
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    R.cam.state = 'error';
    showCamMsg('CAMERA OFFLINE', 'This browser does not support camera access. Please use a current version of <b>Chrome, Edge, Firefox or Safari</b>.');
    return;
  }
  stopCamera(true);
  S.mode = 'live';
  R.cam.state = 'starting';
  syncControls();
  const video_c = deviceId
    ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
    : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: video_c });
    R.cam.stream = stream;
    video.srcObject = stream;
    await video.play();
    R.cam.state = 'on';
    const tr = stream.getVideoTracks()[0];
    R.cam.deviceId = tr && tr.getSettings ? tr.getSettings().deviceId : null;
    tr && tr.addEventListener('ended', () => { stopCamera(); logEvent('Camera disconnected', 'l1'); });
    logEvent(`Front camera ONLINE (${video.videoWidth}×${video.videoHeight})`, 'li');
    listCameras();
    if (S.ai) loadModel();
  } catch (e) {
    R.cam.state = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'denied' : 'error';
    R.cam.stream = null;
    const n = e && e.name;
    let msg;
    if (n === 'NotAllowedError' || n === 'SecurityError') {
      msg = 'Camera permission was <b>denied</b>. To enable it: click the <b>camera / padlock icon</b> in the browser address bar → set <b>Camera</b> to <b>Allow</b> → press <b>TRY AGAIN</b>. On Windows check <i>Settings → Privacy → Camera</i>; on macOS check <i>System Settings → Privacy &amp; Security → Camera</i> for your browser.';
    } else if (n === 'NotFoundError' || n === 'OverconstrainedError') {
      msg = 'No camera was found. Connect a webcam and press <b>TRY AGAIN</b>, or continue with <b>SIMULATION MODE</b>.';
    } else if (n === 'NotReadableError' || n === 'AbortError') {
      msg = 'The camera is <b>busy</b>. Another app (Zoom, Teams, Meet, OBS…) may be using it. Close that app and press <b>TRY AGAIN</b>.';
    } else {
      msg = 'Could not start the camera: ' + esc((e && e.message) || String(e));
    }
    showCamMsg('CAMERA OFFLINE', msg);
    logEvent('Camera start failed: ' + (n || 'error'), 'l1');
  }
  syncControls();
}

function stopCamera(silent) {
  if (R.cam.stream) R.cam.stream.getTracks().forEach((t) => t.stop());
  const wasOn = R.cam.state === 'on';
  R.cam.stream = null;
  video.srcObject = null;
  R.cam.state = 'off';
  R.tracks = [];
  if (wasOn && !silent) logEvent('Front camera stopped', 'li');
  syncControls();
}

async function listCameras() {
  try {
    const devs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
    if (devs.length < 2) { el.camSelect.hidden = true; return; }
    el.camSelect.innerHTML = devs.map((d, i) => `<option value="${esc(d.deviceId)}">${esc(d.label || 'Camera ' + (i + 1))}</option>`).join('');
    if (R.cam.deviceId) el.camSelect.value = R.cam.deviceId;
    el.camSelect.hidden = false;
  } catch { el.camSelect.hidden = true; }
}

function showCamMsg(title, html) { el.camMsgTitle.textContent = title; el.camMsgText.innerHTML = html; el.camMsg.hidden = false; }
function hideCamMsg() { el.camMsg.hidden = true; }

/* ------------------------------------------------------------------ */
/* 6. AI object detection (TensorFlow.js + COCO-SSD)                   */
/* ------------------------------------------------------------------ */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some((s) => s.getAttribute('src') === src)) return resolve();
    const s = document.createElement('script');
    s.src = src; s.async = true; s.crossOrigin = 'anonymous';
    const to = setTimeout(() => reject(new Error('timeout loading ' + src)), 45000);
    s.onload = () => { clearTimeout(to); resolve(); };
    s.onerror = () => { clearTimeout(to); reject(new Error('could not load ' + src)); };
    document.head.appendChild(s);
  });
}

async function loadFirst(srcs, ok) {
  let lastErr;
  for (const src of srcs) {
    try { await loadScript(src); if (ok()) return; } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('library not available');
}

async function loadModel() {
  if (R.ai.model || R.ai.state === 'loading') return;
  R.ai.state = 'loading';
  try {
    await loadFirst(TFJS_SRC, () => window.tf);
    await loadFirst(COCO_SRC, () => window.cocoSsd);
    let lastErr;
    for (const url of MODEL_SRC) {
      try { R.ai.model = await window.cocoSsd.load(url ? { base: 'lite_mobilenet_v2', modelUrl: url } : { base: 'lite_mobilenet_v2' }); break; }
      catch (e) { lastErr = e; }
    }
    if (!R.ai.model) throw lastErr || new Error('model not loaded');
    R.ai.state = 'ready';
    logEvent('AI object detection ready (COCO-SSD, in-browser)', 'li');
  } catch (e) {
    R.ai.state = 'error';
    R.ai.err = (e && e.message) || String(e);
    logEvent('AI model could not load — simulation still available', 'l1');
  }
}

async function runDetection(now) {
  if (R.ai.busy || !R.ai.model || video.readyState < 2) return;
  R.ai.busy = true; R.ai.lastRun = now;
  const t0 = performance.now();
  try {
    const preds = await R.ai.model.detect(video, 20, 0.3);
    R.ai.inferMs = performance.now() - t0;
    updateTracks(preds, performance.now());
  } catch (e) {
    R.ai.err = (e && e.message) || String(e);
  } finally {
    R.ai.busy = false;
  }
}

// Pinhole-camera distance estimate: d = f · H_real / h_px   (f in px from assumed FOV × calibration)
function camEstimateRaw(bbox, info) {
  const vw = video.videoWidth || 1280, vh = video.videoHeight || 720;
  const [x, y, w, h] = bbox;
  const f = (vw / 2) / Math.tan((CAM_FOV_DEG / 2) * Math.PI / 180) * R.calib;
  const dh = f * info.H / Math.max(h, 1);
  const dw = f * info.W / Math.max(w, 1);
  const clipped = y < 4 || y + h > vh - 4;          // object cut off by frame edge → height unreliable
  return clipped ? Math.min(dh, dw) : dh;
}

// Tiny IoU tracker so we can measure how each object's distance changes over time (closing speed).
function updateTracks(preds, now) {
  const used = new Set();
  for (const p of preds) {
    if (p.score < S.minConf) continue;
    const info = CLASSES[p.class];
    const raw = info ? camEstimateRaw(p.bbox, info) : null;
    let best = null, bestIou = 0.25;
    for (const t of R.tracks) {
      if (used.has(t.id) || t.cls !== p.class) continue;
      const v = iou(t.box, p.bbox);
      if (v > bestIou) { bestIou = v; best = t; }
    }
    if (best) {
      best.box = p.bbox; best.conf = p.score; best.seen = now; used.add(best.id);
      if (raw != null) {
        best.raw = best.raw == null ? raw : best.raw * 0.6 + raw * 0.4;
        best.hist.push({ t: now, d: best.raw });
        while (best.hist.length > 3 && now - best.hist[0].t > histWindow()) best.hist.shift();
      }
    } else {
      const t = { id: ++R.tid, cls: p.class, relevant: !!info, type: info ? info.type : 'object',
        label: info ? info.label : p.class.toUpperCase(), box: p.bbox, conf: p.score, raw, hist: raw != null ? [{ t: now, d: raw }] : [], seen: now };
      R.tracks.push(t); used.add(t.id);
    }
  }
  R.tracks = R.tracks.filter((t) => now - t.seen < trackTimeout());
}
// Slow machines run detection less often, so keep tracks and history proportionally longer.
function trackTimeout() { return Math.max(700, R.ai.inferMs * 2.5); }
function histWindow() { return Math.max(1600, R.ai.inferMs * 5); }

// Least-squares slope of distance over time → closing speed (km/h, positive = approaching)
function closingFromHist(hist, scale) {
  if (hist.length < 3 || hist[hist.length - 1].t - hist[0].t < 600) return null;
  const n = hist.length, t0 = hist[0].t;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const h of hist) { const x = (h.t - t0) / 1000, y = h.d * scale; sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
  const kmh = -slope * 3.6;
  return Math.abs(kmh) < 1 ? 0 : kmh;
}

/* ------------------------------------------------------------------ */
/* 7. Simulated sensors, ranging & fusion                              */
/* ------------------------------------------------------------------ */
function updateNoise(now) {
  if (now - R.noise.t < 200) return;
  R.noise = { radar: gauss(), lidar: gauss(), cam: gauss(), conf: gauss(), t: now };
}

// 1-sigma noise of each ranging layer (m). Radar is steady in fog/dust; LiDAR suffers in dust; camera is worst.
function sigmas(d) {
  return {
    radar: 0.25 + 0.005 * d,
    lidar: S.dust ? 1.2 + 0.03 * d : S.fog ? 0.35 + 0.01 * d : 0.08 + 0.003 * d,
    cam: d * (S.dust ? 0.30 : S.fog ? 0.15 : 0.08),
  };
}

// Inverse-variance weighted fusion: x = Σ(x_i/σ_i²) / Σ(1/σ_i²)
function fuse(parts) {
  if (!parts.length) return { value: null, weights: {} };
  let num = 0, den = 0;
  for (const p of parts) { const w = 1 / (p.s * p.s); num += p.v * w; den += w; }
  const weights = {};
  for (const p of parts) weights[p.k] = (1 / (p.s * p.s)) / den;
  return { value: num / den, weights };
}

function manualFusion() {
  const parts = [];
  if (S.sensors.radar && S.manual.radar > 0) parts.push({ k: 'radar', v: S.manual.radar, s: 0.25 });
  if (S.sensors.lidar && S.manual.lidar > 0) parts.push({ k: 'lidar', v: S.manual.lidar, s: 0.10 });
  return fuse(parts);
}

function rangeSimObject(trueDist) {
  const sg = sigmas(trueDist);
  const rd = S.sensors.radar ? Math.max(0.5, trueDist + R.noise.radar * sg.radar) : null;
  const ld = S.sensors.lidar ? Math.max(0.5, trueDist + R.noise.lidar * sg.lidar) : null;
  const cd = S.sensors.rgb ? Math.max(0.5, trueDist + R.noise.cam * sg.cam) : null;
  let fu, src;
  if (S.ranging === 'manual') {
    fu = manualFusion(); src = 'MANUAL FUSED';
    return { dist: fu.value, srcName: src, estimated: false, readings: { radar: S.sensors.radar ? S.manual.radar : null, lidar: S.sensors.lidar ? S.manual.lidar : null, cam: cd }, weights: fu.weights, sg };
  }
  if (S.ranging === 'camera') {
    fu = fuse(cd != null ? [{ k: 'cam', v: cd, s: sg.cam }] : []);
    return { dist: fu.value, srcName: 'CAMERA EST.', estimated: true, readings: { radar: rd, lidar: ld, cam: cd }, weights: fu.weights, sg };
  }
  const parts = [];
  if (rd != null) parts.push({ k: 'radar', v: rd, s: sg.radar });
  if (ld != null) parts.push({ k: 'lidar', v: ld, s: sg.lidar });
  if (cd != null) parts.push({ k: 'cam', v: cd, s: sg.cam });
  fu = fuse(parts);
  const sensorsUsed = parts.filter((p) => p.k !== 'cam').length;
  src = parts.length === 0 ? 'NO RANGE' : sensorsUsed === 0 ? 'CAMERA EST.' : parts.length >= 2 ? 'FUSED' : (rd != null ? 'RADAR' : 'LiDAR');
  return { dist: fu.value, srcName: src, estimated: sensorsUsed === 0, readings: { radar: rd, lidar: ld, cam: cd }, weights: fu.weights, sg };
}

/* ------------------------------------------------------------------ */
/* 8. Visibility, safe distance, risk engine                           */
/* ------------------------------------------------------------------ */
function actualVisibility() {
  let m = 1500;
  if (S.fog) m = Math.min(m, S.p.fogVis);
  if (S.dust) m = Math.min(m, S.p.dustVis);
  return m;
}
function getVis() {
  const actual = actualVisibility();
  const assumed = !S.sensors.vis;
  const m = assumed ? 250 : actual;             // sensor offline → conservative assumption
  const band = m >= 1000 ? 'GOOD' : m >= 500 ? 'MODERATE' : m >= 150 ? 'LOW' : 'VERY LOW';
  const factor = { GOOD: 1.0, MODERATE: 1.1, LOW: 1.2, 'VERY LOW': 1.4 }[band];
  const cls = { GOOD: 'v-good', MODERATE: 'v-mod', LOW: 'v-low', 'VERY LOW': 'v-vlow' }[band];
  return { m, actual, band, factor, cls, assumed };
}

// Prototype safety-distance model (NOT a certified braking calculation)
function safeDistance(vis) {
  const p = S.p, v = S.speed / 3.6;
  const reaction = v * p.react;
  const lf = S.loaded ? p.load : 1;
  const braking = (v * v) / (2 * p.decel) * lf;
  const base = reaction + braking + p.margin;
  return { v, reaction, braking, lf, margin: p.margin, base, factor: vis.factor, total: base * vis.factor };
}

function objLevel(o, safe) {
  if (o.dist == null) return 1;
  const r = o.dist / safe.total;
  let l = r < 1 ? 2 : r < S.p.band ? 1 : 0;
  if (o.type === 'person') l = Math.max(l, r < 1.25 ? 2 : r < 2 ? 1 : 0);
  if (o.dist < 5) l = 2;
  return l;
}

function buildObjects(now, safe) {
  const out = [];
  if (S.scenario !== 'clear') {
    const sc = SCN[S.scenario];
    const o = { src: 'sim', type: sc.type, trueDist: S.simDist, closing: S.speed - sc.objSpeed, relevant: true };
    // Who can classify it? RGB camera first, thermal for warm objects, otherwise radar/LiDAR only sees "an object"
    if (S.sensors.rgb) { o.label = sc.label; o.by = 'RGB'; o.conf = clamp(sc.conf * (S.dust ? 0.62 : S.fog ? 0.86 : 1) + R.noise.conf * 0.008, 0.3, 0.99); }
    else if (S.sensors.thermal && sc.type !== 'rock') { o.label = sc.label; o.by = 'THERMAL'; o.conf = clamp(sc.conf * 0.8, 0.3, 0.99); }
    else { o.label = 'OBJECT'; o.by = (S.sensors.radar || S.sensors.lidar) ? 'RADAR/LiDAR' : '—'; o.conf = null; o.unclassified = true; }
    Object.assign(o, rangeSimObject(S.simDist));
    o.box = simGeom(sc, S.simDist);
    if (o.dist == null && o.conf == null) o.undetected = true;
    if (!o.undetected) out.push(o);
  }
  if (S.mode === 'live' && R.cam.state === 'on' && S.ai && S.sensors.rgb) {
    const c = R.cover;
    for (const t of R.tracks) {
      if (now - t.seen > trackTimeout()) continue;
      const [x, y, w, h] = t.box;
      const o = { src: 'cam', type: t.type, label: t.label, conf: t.conf, relevant: t.relevant, cls: t.cls,
        box: { x: x * c.s + c.ox, y: y * c.s + c.oy, w: w * c.s, h: h * c.s },
        dist: t.raw != null ? t.raw * S.scale : null, estimated: true, srcName: 'CAMERA EST.',
        closing: closingFromHist(t.hist, S.scale), track: t };
      o.readings = { radar: null, lidar: null, cam: o.dist };
      out.push(o);
    }
    if (S.ranging === 'manual') {
      const cams = out.filter((o) => o.src === 'cam' && o.relevant && o.dist != null).sort((a, b) => a.dist - b.dist);
      if (cams[0]) {
        const fu = manualFusion();
        if (fu.value != null) Object.assign(cams[0], { dist: fu.value, srcName: 'MANUAL FUSED', estimated: false, weights: fu.weights, readings: { radar: S.manual.radar, lidar: S.manual.lidar, cam: cams[0].dist } });
      }
    }
  }
  for (const o of out) {
    if (!o.relevant) continue;
    o.ratio = o.dist != null ? o.dist / safe.total : null;
    o.lvl = objLevel(o, safe);
  }
  return out;
}

function pickPrimary(objs) {
  let best = null, bestScore = Infinity;
  for (const o of objs) {
    if (!o.relevant) continue;
    const score = (o.ratio == null ? 0.99 : o.ratio) * (o.type === 'person' ? 0.8 : 1) - o.lvl * 10;
    if (score < bestScore) { bestScore = score; best = o; }
  }
  return best;
}

function assess(objs, vis, safe) {
  const why = [];
  let lvl = 0;
  const add = (l, t) => { why.push({ l, t }); if (l > lvl) lvl = l; };
  const prim = pickPrimary(objs);
  if (prim) {
    const d = prim.dist, L = prim.label;
    if (d == null) add(1, `${L} detected but no range data available`);
    else {
      const r = d / safe.total;
      if (r < 1) add(2, `${L} at ${f1(d)} m is inside the ${f1(safe.total)} m safe distance`);
      else if (r < S.p.band) add(1, `${L} within ${S.p.band}× safe distance (${f2(r)}×)`);
      else add(0, `${L} at ${f1(d)} m is beyond the safe distance (${f1(r)}×)`);
      if (prim.type === 'person') {
        if (r < 1.25) add(2, 'Person close to the safe-distance limit');
        else if (r < 2) add(1, 'Person detected: extra safety margin applied');
      }
      if (prim.closing != null && prim.closing > 2) {
        const ttc = d / (prim.closing / 3.6);
        prim.ttc = ttc;
        if (ttc < 4) add(2, `Time to contact only ${f1(ttc)} s`);
        else if (r < 2) add(1, `Object approaching at ${f0(prim.closing)} km/h`);
      }
      if (d < 5) add(2, 'Object very close (< 5 m)');
    }
  }
  const objLvl = lvl;
  if (vis.band === 'LOW' || vis.band === 'VERY LOW') {
    add(1, `Visibility ${vis.band}${vis.assumed ? ' (assumed: sensor offline)' : ` (${f0(vis.m)} m)`}: safe distance ×${vis.factor}`);
    if (vis.band === 'VERY LOW' && prim && objLvl >= 1) add(2, 'Very low visibility and an object close ahead');
  } else if (vis.band === 'MODERATE') add(0, `Visibility moderate (${f0(vis.m)} m)`);
  if (S.speed > 40) add(1, `High speed (${S.speed} km/h > 40 km/h)`);
  const faults = ['rgb', 'thermal', 'radar', 'lidar'].filter((k) => !S.sensors[k]);
  if (faults.length) add(1, `Sensor fault: ${faults.map((k) => SENSOR_NAME[k]).join(', ')}. Operating with the remaining sensors`);
  if (!S.sensors.gps || !S.sensors.imu) add(0, `${!S.sensors.gps ? 'GPS' : 'IMU'} offline: position/motion data reduced`);
  if (S.mode === 'live' && R.cam.state !== 'on' && R.cam.state !== 'starting') add(1, 'Live camera feed is offline');
  if (!prim && why.every((w) => w.l === 0)) why.unshift({ l: 0, t: 'No obstacle detected in the monitored zone' });
  return { lvl, why, prim };
}

function alertFor(level, a, vis) {
  const p = a.prim;
  const unclassified = p && (p.unclassified || p.label === 'OBJECT');
  if (level === 2) {
    if (!p || p.dist == null) return { text: '⚠ CRITICAL CONDITIONS — SLOW DOWN', drv: '⚠ SLOW DOWN', speech: 'Warning. Critical conditions.' };
    const d = f0(p.dist);
    if (unclassified) return { text: `⚠ OBSTACLE INSIDE SAFE DISTANCE — ${d} m AHEAD`, drv: `⚠ OBSTACLE AHEAD — ${d} m`, speech: 'Warning. Obstacle ahead.' };
    if (p.type === 'rock') return { text: `⚠ ROCK OBSTACLE — ${d} m AHEAD · INSIDE SAFE DISTANCE`, drv: `⚠ ROCK OBSTACLE — ${d} m`, speech: 'Warning. Obstacle ahead.' };
    if (p.type === 'person') return { text: `⚠ PERSON INSIDE SAFE DISTANCE — ${d} m AHEAD`, drv: `⚠ PERSON AHEAD — ${d} m`, speech: 'Warning. Person ahead.' };
    return { text: `⚠ VEHICLE INSIDE SAFE DISTANCE — ${d} m AHEAD`, drv: `⚠ VEHICLE AHEAD — ${d} m`, speech: 'Warning. Vehicle ahead.' };
  }
  if (level === 1) {
    if (p && p.dist != null && p.ratio != null && p.ratio < 2.5) return { text: `CAUTION — ${p.label} DETECTED · ${f0(p.dist)} m AHEAD`, drv: `CAUTION — ${p.label} ${f0(p.dist)} m`, speech: 'Caution. Object detected.' };
    if (vis.band === 'LOW' || vis.band === 'VERY LOW') return { text: `CAUTION — VISIBILITY ${vis.band} · REDUCE SPEED`, drv: `CAUTION — VISIBILITY ${vis.band}`, speech: 'Caution. Low visibility.' };
    const faults = ['rgb', 'thermal', 'radar', 'lidar'].filter((k) => !S.sensors[k]);
    if (faults.length) return { text: `SENSOR FAULT — ${faults.map((k) => SENSOR_NAME[k]).join(', ')} OFFLINE · USING REMAINING SENSORS`, drv: 'CAUTION — SENSOR FAULT', speech: 'Caution. Sensor fault.' };
    if (p) return { text: `CAUTION — ${p.label} DETECTED`, drv: `CAUTION — ${p.label}`, speech: 'Caution. Object detected.' };
    if (S.mode === 'live' && R.cam.state !== 'on') return { text: 'CAUTION — CAMERA FEED OFFLINE', drv: 'CAUTION — NO CAMERA', speech: 'Caution. Camera offline.' };
    if (S.speed > 40) return { text: 'CAUTION — HIGH SPEED', drv: 'CAUTION — SLOW DOWN', speech: 'Caution. High speed.' };
    return { text: 'CAUTION — DRIVE WITH CARE', drv: 'CAUTION', speech: 'Caution.' };
  }
  return { text: p ? `SAFE — ${p.label} BEYOND SAFE DISTANCE` : 'ALL CLEAR — NO HAZARD INSIDE SAFE DISTANCE', drv: p ? 'KEEP DISTANCE' : 'ROAD CLEAR', speech: '' };
}

/* ------------------------------------------------------------------ */
/* 9. Scene rendering (camera panel)                                   */
/* ------------------------------------------------------------------ */
const HOR = 300, FOCAL = 1000, CAMH = 3.0, CX = W / 2;
function project(X, Z) { return [CX + FOCAL * X / Z, HOR + FOCAL * CAMH / Z]; }
function simGeom(sc, dist) {
  const Z = Math.max(dist, 1.5);
  const [x, yb] = project(sc.X, Z);
  const h = FOCAL * sc.H / Z, w = FOCAL * sc.W / Z;
  return { x: x - w / 2, y: yb - h, w, h, Z };
}

// Pre-rendered soft noise textures for fog and dust
function makeHaze(rgb, count, seed) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 360;
  const g = c.getContext('2d');
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const x = rnd() * 640, y = rnd() * 360, r = 30 + rnd() * 120;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${0.10 + rnd() * 0.18})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return c;
}
const FOG_TEX = makeHaze('214,219,222', 110, 7);
const DUST_TEX = makeHaze('170,132,96', 130, 13);
for (let i = 0; i < 260; i++) R.particles.push({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 2.2, a: 0.15 + Math.random() * 0.45, v: 0.6 + Math.random() * 1.6 });

function drawSynthetic(t) {
  // sky / pit-rim haze
  let g = ctx.createLinearGradient(0, 0, 0, HOR);
  g.addColorStop(0, '#4d5963'); g.addColorStop(1, '#8e969b');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, HOR + 2);
  // far pit wall with benches
  const bands = [['#5a4234', 150], ['#6b4e3b', 118], ['#5d4435', 88], ['#72533f', 60], ['#634938', 32]];
  for (const [col, top] of bands) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, HOR);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, HOR - top + Math.sin(x * 0.013 + top) * 6 + Math.sin(x * 0.041) * 3);
    ctx.lineTo(W, HOR); ctx.closePath(); ctx.fill();
  }
  // ground outside road
  ctx.fillStyle = '#463528'; ctx.fillRect(0, HOR, W, H - HOR);
  // road surface
  const Zf = 400, Zn = 3.2, RW = 11;
  const poly = (pts, fill) => { ctx.fillStyle = fill; ctx.beginPath(); pts.forEach(([X, Z], i) => { const [x, y] = project(X, Z); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill(); };
  g = ctx.createLinearGradient(0, HOR, 0, H);
  g.addColorStop(0, '#8a7564'); g.addColorStop(1, '#6f5747');
  poly([[-RW, Zf], [RW, Zf], [RW, Zn], [-RW, Zn]], g);
  // tyre tracks
  poly([[-3.2, Zf], [-2.2, Zf], [-2.2, Zn], [-3.2, Zn]], 'rgba(60,44,34,.28)');
  poly([[2.2, Zf], [3.2, Zf], [3.2, Zn], [2.2, Zn]], 'rgba(60,44,34,.28)');
  // safety berms
  const berm = (X0, X1) => {
    ctx.fillStyle = '#4f3c2f'; ctx.beginPath();
    const pts = [[X0, Zf, 0], [X1, Zf, 1.4], [X1, Zn, 1.4], [X0, Zn, 0]];
    pts.forEach(([X, Z, hgt], i) => { const x = CX + FOCAL * X / Z, y = HOR + FOCAL * (CAMH - hgt) / Z; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath(); ctx.fill();
  };
  berm(-RW, -RW - 2.2); berm(RW, RW + 2.2);
  // moving centre dashes (speed feedback)
  ctx.fillStyle = 'rgba(214,200,178,.55)';
  const period = 15, off = R.phase % period;
  for (let k = 0; k < 30; k++) {
    const z0 = k * period - off, z1 = z0 + 6;
    if (z1 < 3.4) continue;
    const a = Math.max(z0, 3.4);
    const [x1, y1] = project(-5.6, a), [x2] = project(-5.35, a), [x3, y3] = project(-5.35, z1), [x4] = project(-5.6, z1);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y1); ctx.lineTo(x3, y3); ctx.lineTo(x4, y3); ctx.closePath(); ctx.fill();
  }
  // horizon haze
  g = ctx.createLinearGradient(0, HOR - 60, 0, HOR + 60);
  g.addColorStop(0, 'rgba(150,158,162,0)'); g.addColorStop(0.5, 'rgba(150,158,162,.35)'); g.addColorStop(1, 'rgba(150,158,162,0)');
  ctx.fillStyle = g; ctx.fillRect(0, HOR - 60, W, 120);
}

function drawHood() {
  ctx.fillStyle = '#5e4a10';
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W * 0.1, H - 52); ctx.lineTo(W * 0.9, H - 52); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8f7219'; ctx.fillRect(W * 0.1, H - 54, W * 0.8, 4);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(W * 0.46, H - 50, W * 0.08, 50);
}

function drawVideo() {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) { ctx.fillStyle = '#05080c'; ctx.fillRect(0, 0, W, H); return; }
  const s = Math.max(W / vw, H / vh), ox = (W - vw * s) / 2, oy = (H - vh * s) / 2;
  R.cover = { s, ox, oy, vw, vh };
  const f = [];
  if (S.fog) f.push('contrast(0.6) brightness(1.12) saturate(0.55) blur(1.2px)');
  if (S.dust) f.push('contrast(0.55) sepia(0.65) brightness(0.92) blur(2.2px)');
  if (!S.sensors.rgb) f.push('grayscale(1) brightness(0.25)');
  ctx.filter = f.length ? f.join(' ') : 'none';
  ctx.drawImage(video, ox, oy, vw * s, vh * s);
  ctx.filter = 'none';
}

function drawOffline() {
  ctx.fillStyle = '#05080c'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#101a24'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  if (!el.camMsg.hidden) return;   // the HTML message overlay explains the problem
  ctx.textAlign = 'center';
  const starting = R.cam.state === 'starting';
  ctx.fillStyle = starting ? '#f0a53a' : '#e5484d';
  ctx.font = '600 44px "IBM Plex Mono", monospace';
  ctx.fillText(starting ? 'REQUESTING CAMERA…' : 'CAMERA OFFLINE', W / 2, H / 2 - 10);
  ctx.fillStyle = '#93a4b8'; ctx.font = '500 22px "IBM Plex Sans", sans-serif';
  ctx.fillText(starting ? 'Please allow camera access in the browser prompt' : 'Press START CAMERA, or switch to SIMULATION MODE', W / 2, H / 2 + 34);
  ctx.textAlign = 'left';
}

function poly(pts, x, y, w, h) { ctx.beginPath(); pts.forEach(([a, b], i) => { const px = x + a * w, py = y + b * h; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath(); }
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

function drawSimObject(o, visM) {
  const { x, y, w, h, Z } = o.box;
  const contrast = Math.exp(-3.912 * Z / Math.max(visM, 5));      // Koschmieder: contrast vs distance/visibility
  ctx.save();
  ctx.globalAlpha = clamp(0.1 + 0.9 * contrast, 0.1, 1);
  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(x + w / 2, y + h, w * 0.55, Math.max(3, h * 0.05), 0, 0, Math.PI * 2); ctx.fill();
  if (o.type === 'vehicle') {
    ctx.fillStyle = '#a8841c'; poly([[0, 0], [1, 0], [0.93, 0.52], [0.07, 0.52]], x, y, w, h); ctx.fill();
    ctx.fillStyle = '#c9a227'; poly([[0, 0], [1, 0], [0.99, 0.07], [0.01, 0.07]], x, y, w, h); ctx.fill();
    ctx.strokeStyle = '#7d6212'; ctx.lineWidth = Math.max(1, w * 0.012);
    for (const fy of [0.2, 0.34]) { ctx.beginPath(); ctx.moveTo(x + w * 0.05, y + h * fy); ctx.lineTo(x + w * 0.95, y + h * fy); ctx.stroke(); }
    ctx.fillStyle = '#2a2f35'; ctx.fillRect(x + w * 0.2, y + h * 0.5, w * 0.6, h * 0.2);
    ctx.fillStyle = '#121416';
    for (const fx of [0, 0.15, 0.71, 0.86]) { rrect(x + w * fx, y + h * 0.5, w * 0.14, h * 0.5, Math.max(1, w * 0.02)); ctx.fill(); }
    ctx.fillStyle = '#3a4048'; ctx.fillRect(x + w * 0.3, y + h * 0.72, w * 0.4, h * 0.05);
    for (const fx of [0.31, 0.62]) {
      if (S.fog || S.dust) {
        const cx = x + w * (fx + 0.035), cy = y + h * 0.585, r = w * 0.12;
        const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); gl.addColorStop(0, 'rgba(255,70,60,.55)'); gl.addColorStop(1, 'rgba(255,70,60,0)');
        ctx.fillStyle = gl; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      ctx.fillStyle = '#ff3b3b'; ctx.fillRect(x + w * fx, y + h * 0.56, w * 0.07, h * 0.05);
    }
  } else if (o.type === 'person') {
    ctx.fillStyle = '#2b3440';
    ctx.fillRect(x + w * 0.28, y + h * 0.55, w * 0.19, h * 0.45); ctx.fillRect(x + w * 0.53, y + h * 0.55, w * 0.19, h * 0.45);
    ctx.fillStyle = '#f07a1a';
    ctx.fillRect(x + w * 0.16, y + h * 0.2, w * 0.68, h * 0.37);
    ctx.fillRect(x, y + h * 0.22, w * 0.16, h * 0.3); ctx.fillRect(x + w * 0.84, y + h * 0.22, w * 0.16, h * 0.3);
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(x + w * 0.16, y + h * 0.33, w * 0.68, h * 0.03); ctx.fillRect(x + w * 0.16, y + h * 0.45, w * 0.68, h * 0.03);
    ctx.fillStyle = '#c99a78'; ctx.beginPath(); ctx.arc(x + w * 0.5, y + h * 0.12, h * 0.075, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.arc(x + w * 0.5, y + h * 0.1, h * 0.08, Math.PI, 0); ctx.fill();
  } else {
    const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#7d624d'); g.addColorStop(1, '#3b2d24');
    ctx.fillStyle = g; poly([[0, 1], [0.05, 0.55], [0.22, 0.2], [0.45, 0.04], [0.72, 0.12], [0.92, 0.42], [1, 1]], x, y, w, h); ctx.fill();
    ctx.fillStyle = '#8f735c'; poly([[0.22, 0.2], [0.45, 0.04], [0.56, 0.36], [0.3, 0.46]], x, y, w, h); ctx.fill();
    ctx.fillStyle = '#4a382c'; poly([[0.56, 0.36], [0.72, 0.12], [0.92, 0.42], [0.8, 0.7]], x, y, w, h); ctx.fill();
  }
  ctx.restore();
}

function drawFogDust(t) {
  const vis = actualVisibility();
  if (S.fog) {
    const k = clamp(1.25 - S.p.fogVis / 800, 0.35, 1);
    ctx.fillStyle = `rgba(196,202,206,${0.42 * k})`; ctx.fillRect(0, 0, W, H);
    const off = (t * 0.012) % W;
    ctx.globalAlpha = 0.75 * k;
    ctx.drawImage(FOG_TEX, -off, 0, W, H); ctx.drawImage(FOG_TEX, W - off, 0, W, H);
    ctx.globalAlpha = 0.5 * k;
    ctx.drawImage(FOG_TEX, (t * 0.02) % W - W, -40, W, H + 80); ctx.drawImage(FOG_TEX, (t * 0.02) % W, -40, W, H + 80);
    ctx.globalAlpha = 1;
    const g = ctx.createLinearGradient(0, HOR - 140, 0, HOR + 160);
    g.addColorStop(0, 'rgba(205,210,213,0)'); g.addColorStop(0.5, `rgba(205,210,213,${0.55 * k})`); g.addColorStop(1, 'rgba(205,210,213,0)');
    ctx.fillStyle = g; ctx.fillRect(0, HOR - 140, W, 300);
  }
  if (S.dust) {
    const k = clamp(1.3 - S.p.dustVis / 200, 0.4, 1);
    ctx.fillStyle = `rgba(140,106,76,${0.4 * k})`; ctx.fillRect(0, 0, W, H);
    const off = (t * 0.05) % W;
    ctx.globalAlpha = 0.9 * k;
    ctx.drawImage(DUST_TEX, off - W, 0, W, H); ctx.drawImage(DUST_TEX, off, 0, W, H);
    ctx.globalAlpha = 1;
    for (const p of R.particles) {
      p.x += p.v * 2.2; p.y += p.v * 0.35;
      if (p.x > W) { p.x = -5; p.y = Math.random() * H; }
      if (p.y > H) p.y = 0;
      ctx.fillStyle = `rgba(214,184,146,${p.a * k})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
  }
  return vis;
}

const placed = [];
function overlaps(a) { return placed.some((b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y); }
function drawBox(o, isPrim) {
  const { x, y, w, h } = o.box;
  if (!o.relevant) {
    ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(147,164,184,.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h); ctx.restore();
    ctx.font = '500 14px "IBM Plex Mono", monospace'; ctx.fillStyle = 'rgba(8,12,18,.75)';
    const t = `${o.label.toLowerCase()} · not a haul-road class`; const tw = ctx.measureText(t).width + 12;
    ctx.fillRect(x, Math.max(0, y - 22), tw, 22); ctx.fillStyle = '#93a4b8'; ctx.fillText(t, x + 6, Math.max(15, y - 6));
    return;
  }
  const col = LEVEL_COL[o.lvl];
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
  // corner ticks
  const c = Math.min(22, w * 0.25, h * 0.25); ctx.lineWidth = 6;
  for (const [px, py, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(px + dx * c, py); ctx.lineTo(px, py); ctx.lineTo(px, py + dy * c); ctx.stroke();
  }
  const lines = [];
  const distTxt = o.dist == null ? 'NO RANGE DATA' : o.estimated ? `EST. ${f1(o.dist)} m (camera)` : `${f1(o.dist)} m · ${o.srcName}`;
  if (isPrim) {
    lines.push([`${o.label}${o.conf != null ? '  ' + Math.round(o.conf * 100) + '%' : ''}`, col, '600 19px']);
    lines.push([distTxt, '#e6edf3', '600 17px']);
    const cl = o.closing;
    lines.push([cl == null ? 'MOVEMENT: MEASURING…' : cl > 1 ? `▲ APPROACHING +${f0(cl)} km/h` : cl < -1 ? `▼ MOVING AWAY ${f0(cl)} km/h` : '■ STEADY', '#93a4b8', '500 15px']);
    lines.push([`${LEVELS[o.lvl]} · ${o.src === 'sim' ? 'SIM OBJECT' : 'LIVE AI'}${o.by && o.by !== 'RGB' ? ' · ' + o.by : ''}`, col, '600 14px']);
  } else {
    lines.push([`${o.label}${o.conf != null ? ' ' + Math.round(o.conf * 100) + '%' : ''} · ${o.dist != null ? (o.estimated ? 'est. ' : '') + f0(o.dist) + ' m' : 'no range'}`, col, '600 15px']);
  }
  let bw = 0;
  for (const [t, , f] of lines) { ctx.font = `${f} "IBM Plex Mono", monospace`; bw = Math.max(bw, ctx.measureText(t).width); }
  bw += 22; const bh = lines.length * 23 + 10;
  const cands = [[x + w + 10, y], [x - bw - 10, y], [x, y - bh - 8], [x, y + h + 8], [x + 6, y + 6], [x + w + 10, y + h - bh], [x - bw - 10, y + h - bh]];
  let bx, by;
  for (const [cx, cy] of cands) {
    const r2 = { x: clamp(cx, 8, W - bw - 8), y: clamp(cy, 8, H - bh - 8), w: bw, h: bh };
    if (!overlaps(r2)) { bx = r2.x; by = r2.y; break; }
  }
  if (bx == null) { bx = clamp(x + w + 10, 8, W - bw - 8); by = clamp(y, 8, H - bh - 8); }
  placed.push({ x: bx, y: by, w: bw, h: bh });
  ctx.fillStyle = 'rgba(8,12,18,.86)'; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = col; ctx.fillRect(bx, by, 4, bh);
  lines.forEach(([t, c2, f], i) => { ctx.font = `${f} "IBM Plex Mono", monospace`; ctx.fillStyle = c2; ctx.fillText(t, bx + 14, by + 25 + i * 23); });
}

function drawHud(now) {
  ctx.font = '600 16px "IBM Plex Mono", monospace';
  const live = S.mode === 'live' && R.cam.state === 'on';
  const tl = live ? 'CAM-F1 · FRONT · LIVE WEBCAM' : 'CAM-F1 · FRONT · SIMULATED SCENE';
  ctx.fillStyle = 'rgba(8,12,18,.72)'; ctx.fillRect(12, 12, ctx.measureText(tl).width + 44, 30);
  ctx.fillStyle = live ? '#e5484d' : '#38c3dd';
  ctx.beginPath(); ctx.arc(28, 27, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e6edf3'; ctx.fillText(tl, 42, 33);
  const tr = hhmmss();
  const trw = ctx.measureText(tr).width + 20;
  ctx.fillStyle = 'rgba(8,12,18,.72)'; ctx.fillRect(W - trw - 12, 12, trw, 30);
  ctx.fillStyle = '#e6edf3'; ctx.fillText(tr, W - trw - 2, 33);
  const env = [];
  if (S.fog) env.push('HEAVY FOG'); if (S.dust) env.push('DENSE DUST');
  if (live && S.scenario !== 'clear') env.push('SIM OBJECT INJECTED');
  if (!S.sensors.rgb) env.push('RGB CAMERA OFFLINE');
  if (env.length) {
    const s = env.join(' · ');
    ctx.fillStyle = 'rgba(8,12,18,.72)'; ctx.fillRect(12, 48, ctx.measureText(s).width + 20, 28);
    ctx.fillStyle = '#f0a53a'; ctx.fillText(s, 22, 68);
  }
  if (!live && S.mode === 'sim') {
    const s = 'SIMULATION — NOT A REAL CAMERA IMAGE';
    ctx.font = '500 13px "IBM Plex Mono", monospace';
    const sw = ctx.measureText(s).width + 16;
    ctx.fillStyle = 'rgba(8,12,18,.6)'; ctx.fillRect(W - sw - 12, H - 38, sw, 24);
    ctx.fillStyle = '#93a4b8'; ctx.fillText(s, W - sw - 4, H - 21);
  }
  if (R.level === 2) { ctx.strokeStyle = 'rgba(229,72,77,.9)'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, W - 8, H - 8); }
  else if (R.level === 1) { ctx.strokeStyle = 'rgba(240,165,58,.7)'; ctx.lineWidth = 5; ctx.strokeRect(3, 3, W - 6, H - 6); }
}

function drawView(now) {
  const live = S.mode === 'live';
  if (live && R.cam.state === 'on') drawVideo();
  else if (live) { drawOffline(); return; }
  else { drawSynthetic(now); }
  const visM = actualVisibility();
  for (const o of R.objects) if (o.src === 'sim') drawSimObject(o, visM);
  if (!live) drawHood();
  drawFogDust(now);
  placed.length = 0;
  if (R.prim && R.prim.box) drawBox(R.prim, true);
  for (const o of R.objects) if (o !== R.prim) drawBox(o, false);
  drawHud(now);
}

/* ------------------------------------------------------------------ */
/* 10. Thermal view (SIMULATED false-colour render)                    */
/* ------------------------------------------------------------------ */
const TW = 160, TH = 90;
const tcan = document.createElement('canvas'); tcan.width = TW; tcan.height = TH;
const tc = tcan.getContext('2d', { willReadFrequently: true });
const IRON = (() => {
  const stops = [[0, [0, 0, 10]], [0.2, [40, 0, 90]], [0.4, [140, 10, 120]], [0.6, [220, 60, 40]], [0.8, [250, 170, 20]], [1, [255, 255, 230]]];
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const v = i / 255; let j = 0; while (j < stops.length - 2 && v > stops[j + 1][0]) j++;
    const [a, ca] = stops[j], [b, cb] = stops[j + 1], k = (v - a) / (b - a);
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = ca[c] + (cb[c] - ca[c]) * k;
  }
  return lut;
})();

function renderThermal() {
  const out = tctx; const OW = thermal.width, OH = thermal.height;
  if (!S.sensors.thermal) {
    out.fillStyle = '#0c0a14'; out.fillRect(0, 0, OW, OH);
    out.fillStyle = '#e5484d'; out.font = '600 16px "IBM Plex Mono", monospace'; out.textAlign = 'center';
    out.fillText('THERMAL OFFLINE', OW / 2, OH / 2 - 4); out.fillStyle = '#62748a'; out.font = '500 11px "IBM Plex Mono", monospace';
    out.fillText('NO SIGNAL', OW / 2, OH / 2 + 16); out.textAlign = 'left';
    return;
  }
  const sx = TW / W, sy = TH / H, hz = HOR * sy;
  const vis = actualVisibility();
  const amb = 0.2;
  tc.globalCompositeOperation = 'source-over';
  let g = tc.createLinearGradient(0, 0, 0, TH);
  g.addColorStop(0, 'rgb(28,28,28)'); g.addColorStop(hz / TH, 'rgb(52,52,52)'); g.addColorStop(1, 'rgb(78,78,78)');
  tc.fillStyle = g; tc.fillRect(0, 0, TW, TH);
  tc.fillStyle = 'rgb(88,88,88)';
  tc.beginPath(); tc.moveTo(TW * 0.47, hz); tc.lineTo(TW * 0.53, hz); tc.lineTo(TW * 1.1, TH); tc.lineTo(-TW * 0.1, TH); tc.closePath(); tc.fill();
  tc.globalCompositeOperation = 'lighten';
  const blob = (x, y, rx, ry, v) => {
    const c = Math.round(clamp(v, 0, 1) * 255);
    const gr = tc.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    gr.addColorStop(0, `rgb(${c},${c},${c})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    tc.save(); tc.translate(x, y); tc.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry)); tc.translate(-x, -y);
    tc.fillStyle = gr; tc.beginPath(); tc.arc(x, y, Math.max(rx, ry), 0, Math.PI * 2); tc.fill(); tc.restore();
  };
  for (const o of R.objects) {
    if (!o.box) continue;
    const x = o.box.x * sx, y = o.box.y * sy, w = o.box.w * sx, h = o.box.h * sy;
    const Z = o.dist || (o.box.Z || 10);
    const att = Math.exp(-Z / Math.max(vis * 2.5, 20));   // LWIR copes with haze better than visible light, but not perfectly
    const k = (v) => amb + (v - amb) * att;
    if (o.type === 'person') { blob(x + w / 2, y + h * 0.5, w * 0.55, h * 0.5, k(0.78)); blob(x + w / 2, y + h * 0.12, w * 0.3, h * 0.12, k(0.92)); }
    else if (o.type === 'vehicle') { blob(x + w / 2, y + h * 0.35, w * 0.5, h * 0.35, k(0.5)); blob(x + w / 2, y + h * 0.66, w * 0.28, h * 0.18, k(0.97)); blob(x + w * 0.15, y + h * 0.78, w * 0.14, h * 0.22, k(0.72)); blob(x + w * 0.85, y + h * 0.78, w * 0.14, h * 0.22, k(0.72)); }
    else if (o.type === 'rock') blob(x + w / 2, y + h * 0.6, w * 0.5, h * 0.45, k(0.42));
    else blob(x + w / 2, y + h / 2, w * 0.5, h * 0.5, k(0.5));
  }
  tc.globalCompositeOperation = 'source-over';
  const img = tc.getImageData(0, 0, TW, TH), d = img.data;
  const noise = S.dust ? 22 : S.fog ? 10 : 5;
  for (let i = 0; i < d.length; i += 4) {
    const v = clamp(d[i] + (Math.random() - 0.5) * noise, 0, 255) | 0;
    d[i] = IRON[v * 3]; d[i + 1] = IRON[v * 3 + 1]; d[i + 2] = IRON[v * 3 + 2];
  }
  tc.putImageData(img, 0, 0);
  out.imageSmoothingEnabled = true;
  out.drawImage(tcan, 0, 0, OW, OH);
  out.font = '600 11px "IBM Plex Mono", monospace';
  out.fillStyle = 'rgba(0,0,0,.55)'; out.fillRect(6, 6, 124, 18);
  out.fillStyle = '#f0a53a'; out.fillText('LWIR · SIMULATION', 12, 19);
}

/* ------------------------------------------------------------------ */
/* 11. Audio alerts (Web Audio API + speech synthesis)                 */
/* ------------------------------------------------------------------ */
const AU = {
  ctx: null, on: false, muted: false, lastBeep: 0, lastSpeak: 0,
  active() { return this.on && !this.muted && this.ctx; },
  enable() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { alert('This browser does not support the Web Audio API.'); return; }
    if (!this.ctx) this.ctx = new AC();
    this.ctx.resume();
    this.on = true; this.muted = false;
    this.tone(880, 0, 0.08, 0.12, 'sine'); this.tone(1320, 0.1, 0.1, 0.12, 'sine');
    logEvent('Driver alert sound enabled', 'li');
  },
  tone(freq, at, dur, vol, type) {
    const c = this.ctx, t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.03);
  },
  critical() { for (let i = 0; i < 3; i++) this.tone(1046, i * 0.16, 0.11, 0.22, 'square'); },
  caution() { this.tone(740, 0, 0.16, 0.16, 'triangle'); this.tone(740, 0.24, 0.16, 0.16, 'triangle'); },
  speak(text) {
    if (!text || !('speechSynthesis' in window)) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1.02; u.lang = 'en-US'; speechSynthesis.speak(u); } catch { /* speech unavailable */ }
  },
  onLevel(lvl, msg, now) {
    if (!this.active()) return;
    if (lvl === 2) { this.critical(); this.lastBeep = now; setTimeout(() => this.active() && this.speak(msg.speech), 520); this.lastSpeak = now; }
    else if (lvl === 1) { this.caution(); setTimeout(() => this.active() && this.speak(msg.speech), 480); }
    else if ('speechSynthesis' in window) speechSynthesis.cancel();
  },
  tick(now, lvl, msg) {
    if (!this.active() || lvl !== 2) return;
    if (now - this.lastBeep > 1500) { this.critical(); this.lastBeep = now; }
    if (now - this.lastSpeak > 9000) { this.lastSpeak = now; setTimeout(() => this.active() && this.speak(msg.speech), 520); }
  },
};

/* ------------------------------------------------------------------ */
/* 12. Control room: fleet, map, log                                   */
/* ------------------------------------------------------------------ */
const FLEET = [
  { id: 'M-101', lvl: 0, spd: 31, note: 'haul road · vis GOOD', s: 0.62, dir: 1, v: 0.012, lx: 10, ly: -8 },
  { id: 'M-102', me: true },
  { id: 'M-103', lvl: 1, spd: 18, note: 'dust at loader · vis LOW', s: 0.84, dir: -1, v: 0.006, lx: 10, ly: 16 },
  { id: 'M-104', lvl: 0, spd: 0, note: 'loading at shovel', s: 0.985, dir: 0, v: 0, lx: 10, ly: -8 },
];
const ME_S = 0.30;             // position of M-102 along the road path (fraction)
const MAP_PX_PER_M = 2.0;

function logEvent(text, cls) {
  const e = { t: new Date(), text, cls: cls || 'li' };
  if (!S.net) { R.queue.push(e); return; }
  pushLog(e);
}
function pushLog(e) {
  R.log.unshift(e);
  if (R.log.length > 80) R.log.length = 80;
  el.log.innerHTML = R.log.map((x) => `<li class="${x.cls}"><time>${hhmmss(x.t)}</time><span>${esc(x.text)}</span></li>`).join('');
}

function roadPoint(frac) { const p = road.getPointAtLength(clamp(frac, 0, 1) * ROAD_LEN); return [p.x, p.y]; }

function updateMap() {
  const lvl = S.net ? R.level : null;
  const meCol = lvl == null ? '#56657a' : LEVEL_COL[lvl];
  const [mx, my] = roadPoint(ME_S);
  let html = '';
  // safe-distance zone along the road ahead of M-102
  const safeLen = (R.safe ? R.safe.total : 0) * MAP_PX_PER_M;
  const s0 = ME_S * ROAD_LEN, s1 = Math.min(ROAD_LEN, s0 + safeLen);
  let dpath = '';
  for (let s = s0; s <= s1; s += 4) { const p = road.getPointAtLength(s); dpath += (dpath ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }
  el.safeSeg.setAttribute('d', dpath);
  el.safeSeg.setAttribute('stroke', lvl == null ? '#56657a' : lvl === 2 ? '#e5484d' : lvl === 1 ? '#f0a53a' : '#3fb950');
  // other trucks
  for (const f of FLEET) {
    if (f.me) continue;
    const [x, y] = roadPoint(f.s);
    html += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="7" fill="${LEVEL_COL[f.lvl]}" stroke="#0c1520" stroke-width="2"/><text x="${f.lx}" y="${f.ly}" fill="${LEVEL_COL[f.lvl]}" font-weight="600">${f.id}</text></g>`;
  }
  // object ahead
  const p = R.prim;
  if (p && p.dist != null && S.net) {
    const sObj = Math.min(ROAD_LEN, s0 + p.dist * MAP_PX_PER_M);
    const q = road.getPointAtLength(sObj);
    const col = LEVEL_COL[p.lvl];
    const shape = p.type === 'person' ? `<circle r="6" fill="#f07a1a" stroke="${col}" stroke-width="2"/>`
      : p.type === 'vehicle' ? `<rect x="-6" y="-6" width="12" height="12" fill="#c9a227" stroke="${col}" stroke-width="2"/>`
      : `<rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill="#b58c6a" stroke="${col}" stroke-width="2"/>`;
    html += `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${lvl === 2 ? 20 : 15}" fill="${col}" opacity=".16"/>`;
    html += `<g transform="translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})">${shape}<text x="11" y="15" fill="${col}" font-weight="600">${esc(p.label)} ${f0(p.dist)} m</text></g>`;
  }
  // M-102
  html += `<g transform="translate(${mx.toFixed(1)} ${my.toFixed(1)})">`;
  if (lvl === 2) html += `<circle r="16" fill="none" stroke="#e5484d" stroke-width="2" opacity=".7"><animate attributeName="r" values="10;20;10" dur="1.2s" repeatCount="indefinite"/></circle>`;
  html += lvl == null
    ? `<circle r="9" fill="#0c1520" stroke="#93a4b8" stroke-width="2" stroke-dasharray="3 2"/><text x="-12" y="-14" fill="#93a4b8" font-weight="600">M-102 · NO LINK</text>`
    : `<circle r="9" fill="${meCol}" stroke="#e6edf3" stroke-width="2"/><text x="-12" y="-14" fill="${meCol}" font-weight="600">M-102 (THIS TRUCK)</text>`;
  html += '</g>';
  el.mapDyn.innerHTML = html;
  // weather zones
  let z = '';
  if (S.fog) z += '<ellipse cx="170" cy="120" rx="170" ry="100" fill="url(#fogZone)"/><text x="40" y="44" fill="#b9c1c6" font-family="IBM Plex Mono, monospace" font-size="10">FOG ZONE</text>';
  if (S.dust) z += `<ellipse cx="${mx}" cy="${my}" rx="110" ry="70" fill="url(#dustZone)"/><text x="${mx + 40}" y="${my + 50}" fill="#c49a6c" font-family="IBM Plex Mono, monospace" font-size="10">DUST ZONE</text>`;
  if (el.mapZones.innerHTML !== z) el.mapZones.innerHTML = z;
}

function renderFleet() {
  const rows = FLEET.map((f) => {
    if (f.me) {
      if (!S.net) return `<div class="frowf lx me"><div><b>TRUCK M-102</b><small>LINK LOST · last update ${hhmmss(new Date(R.lastLinkT))}</small></div><span class="st">NO DATA</span></div>`;
      const p = R.prim;
      const note = `${S.speed} km/h · ${p && p.dist != null ? p.label + ' ' + f0(p.dist) + ' m' : 'road clear'} · vis ${R.vis ? R.vis.band : ''}`;
      return `<div class="frowf l${R.level} me"><div><b>TRUCK M-102</b><small>${esc(note)}</small></div><span class="st">${LEVELS[R.level]}</span></div>`;
    }
    return `<div class="frowf l${f.lvl}"><div><b>TRUCK ${f.id}</b><small>${f.spd} km/h · ${f.note}</small></div><span class="st">${LEVELS[f.lvl]}</span></div>`;
  }).join('');
  if (el.fleet.innerHTML !== rows) el.fleet.innerHTML = rows;
}

/* ------------------------------------------------------------------ */
/* 13. UI updates                                                      */
/* ------------------------------------------------------------------ */
function sensorInfo(k) {
  if (!S.sensors[k]) {
    const why = { rgb: 'No image: using thermal + radar', thermal: 'No heat image', radar: 'No radar ranging', lidar: 'No 3D point cloud', gps: 'Position unknown', imu: 'Motion data lost', vis: 'Visibility assumed LOW' }[k];
    return { cls: 'offline', txt: 'OFFLINE', d: why, tag: k === 'rgb' && S.mode === 'live' ? 'LIVE' : 'SIM' };
  }
  const liveCam = S.mode === 'live' && R.cam.state === 'on';
  switch (k) {
    case 'rgb':
      if (S.mode === 'live' && !liveCam) return { cls: 'idle', txt: 'NO FEED', d: 'Press START CAMERA', tag: 'LIVE' };
      if (S.dust) return { cls: 'degraded', txt: 'DEGRADED', d: 'Dust hides the image', tag: liveCam ? 'LIVE' : 'SIM' };
      if (S.fog) return { cls: 'degraded', txt: 'REDUCED', d: 'Low contrast in fog', tag: liveCam ? 'LIVE' : 'SIM' };
      return { cls: 'online', txt: 'ONLINE', d: liveCam ? `Webcam ${video.videoWidth}×${video.videoHeight}` : 'Simulated feed', tag: liveCam ? 'LIVE' : 'SIM' };
    case 'thermal':
      return S.dust ? { cls: 'online', txt: 'AVAILABLE', d: 'Shorter range in dust', tag: 'SIM' } : { cls: 'online', txt: 'ONLINE', d: S.fog ? 'Heat contrast at short range' : 'LWIR 8–14 µm', tag: 'SIM' };
    case 'radar':
      return { cls: 'online', txt: 'ONLINE', d: S.fog || S.dust ? 'Ranging through fog/dust' : '77 GHz · ranging', tag: 'SIM' };
    case 'lidar':
      if (S.dust) return { cls: 'degraded', txt: 'DEGRADED', d: 'Dust scatters laser', tag: 'SIM' };
      if (S.fog) return { cls: 'degraded', txt: 'REDUCED', d: 'Fog adds noise', tag: 'SIM' };
      return { cls: 'online', txt: 'ONLINE', d: '3D point cloud', tag: 'SIM' };
    case 'gps': return { cls: 'online', txt: 'ONLINE', d: '3D fix · 12 sats', tag: 'SIM' };
    case 'imu': return { cls: 'online', txt: 'ONLINE', d: `Heading ${f0(R.gps.heading)}°`, tag: 'SIM' };
    case 'vis': {
      const v = R.vis || getVis();
      return { cls: v.band === 'GOOD' ? 'online' : 'degraded', txt: v.band, d: `${f0(v.m)} m visibility`, tag: 'SIM' };
    }
  }
  return { cls: 'idle', txt: '—', d: '', tag: 'SIM' };
}

let lastSensorSig = '';
function renderSensors() {
  const parts = SENSOR_DEF.map(([k, name]) => { const i = sensorInfo(k); return { k, name, ...i }; });
  const sig = JSON.stringify(parts);
  if (sig === lastSensorSig) return;
  lastSensorSig = sig;
  el.sensorStrip.innerHTML = parts.map((p) => `
    <button class="sensor ${p.cls}" data-sensor="${p.k}" title="${S.sensors[p.k] ? 'Click to simulate a failure' : 'Click to restore'}">
      <div class="sn"><span>${p.name}</span><i class="${p.tag === 'LIVE' ? 'live' : ''}">${p.tag}</i></div>
      <div class="ss"><span class="dot"></span>${p.txt}</div>
      <div class="sd">${esc(p.d)}</div>
    </button>`).join('');
}

let lastReasons = '';
function updateUI() {
  const a = R.assess, vis = R.vis, safe = R.safe, lvl = R.level, p = a.prim;
  const msg = alertFor(lvl, a, vis);
  R.msg = msg;
  // risk card
  setClass(el.riskCard, 'riskcard ' + LEVEL_CLS[lvl]);
  setText(el.riskText, LEVELS[lvl]);
  setText(el.riskSub, lvl === 2 ? 'Object inside safe distance' : lvl === 1 ? 'Reduced safety margin' : 'No hazard inside safe distance');
  setText(el.stSpeed, S.speed);
  setText(el.stVis, `${vis.band}${vis.assumed ? '*' : ''} · ${f0(vis.m)} m`); setClass(el.stVis, vis.cls);
  setText(el.stObj, p ? `${p.label}${p.src === 'cam' ? ' (AI)' : ' (SIM)'}` : 'NONE');
  setText(el.stDist, p && p.dist != null ? `${f1(p.dist)} m` : '—');
  setText(el.stDistSrc, p && p.dist != null ? (p.estimated ? 'ESTIMATED' : p.srcName) : '—');
  setClass(el.stDistSrc, 'src ' + (p && p.dist != null ? (p.estimated ? 'est' : 'fused') : ''));
  setText(el.stSafe, f1(safe.total));
  setText(el.stRel, p && p.closing != null ? (p.closing > 1 ? `+${f0(p.closing)} km/h closing` : p.closing < -1 ? `${f0(p.closing)} km/h opening` : 'steady') : '—');
  setText(el.stTtc, p && p.ttc != null && isFinite(p.ttc) && p.closing > 2 ? `${f1(p.ttc)} s` : '—');
  const rs = a.why.map((w) => `<li class="l${w.l}">${esc(w.t)}</li>`).join('');
  if (rs !== lastReasons) { el.reasons.innerHTML = rs; lastReasons = rs; }
  // alert bar
  setClass(el.alertBar, 'alertbar ' + LEVEL_CLS[lvl]);
  setText(el.alertText, msg.text.replace(/^⚠ /, ''));
  setText(el.alertMeta, p && p.dist != null ? `DIST ${f1(p.dist)} m · SAFE ${f1(safe.total)} m · ${S.speed} km/h` : `SAFE DIST ${f1(safe.total)} m · ${S.speed} km/h`);
  // driver view
  setText(el.dSpeed, S.speed);
  setText(el.dVis, vis.band); setClass(el.dVis, vis.cls);
  setText(el.dObj, p ? p.label : 'NONE');
  setText(el.dDist, p && p.dist != null ? f0(p.dist) : '—');
  setText(el.dDistU, p && p.dist != null ? (p.estimated ? 'm est.' : 'm') : '');
  setText(el.dSafe, f0(safe.total));
  setText(el.dRisk, LEVELS[lvl]);
  setClass(el.dRiskTile, 'dtile risk ' + LEVEL_CLS[lvl]);
  setText(el.dAlert, msg.drv);
  setClass(el.dAlert, 'dalert ' + LEVEL_CLS[lvl]);
  setText(el.drvLocal, S.net ? 'LOCAL ALERTS ACTIVE' : 'NO NETWORK · LOCAL ALERTS STILL ACTIVE');
  // control room (only while the link is up)
  if (S.net) {
    R.lastLinkT = Date.now();
    setText(el.crGps, `${R.gps.lat.toFixed(4)}° N, ${R.gps.lon.toFixed(4)}° E`);
    setText(el.crSpeed, `${S.speed} km/h`);
    setText(el.crVis, `${vis.band} (${f0(vis.m)} m)`);
    setText(el.crDist, p && p.dist != null ? `${f1(p.dist)} m${p.estimated ? ' (est.)' : ''} · ${p.label}` : '—');
    setText(el.crRisk, LEVELS[lvl]);
    el.crRisk.style.color = LEVEL_COL[lvl];
    setClass(el.crCard, 'ccard ' + LEVEL_CLS[lvl]);
    el.crLink.innerHTML = '<i class="dot g"></i>ONLINE';
  } else {
    setClass(el.crCard, 'ccard lost');
    el.crLink.innerHTML = `<i class="dot r"></i>LINK LOST · ${hhmmss(new Date(R.lastLinkT))}`;
  }
  renderFleet();
  renderSensors();
  updateFusionPanel();
  updateFormula();
  updateCamStatus();
}

function updateCamStatus() {
  const st = el.camStatus, span = st.querySelector('span');
  const live = S.mode === 'live';
  let cls = 'status off', text = 'CAMERA OFFLINE';
  if (live && R.cam.state === 'on') { cls = 'status on'; text = 'ONLINE'; }
  else if (R.cam.state === 'starting') { cls = 'status wait'; text = 'REQUESTING PERMISSION…'; }
  else if (!live) { cls = 'status sim'; text = 'SIMULATION'; }
  setClass(st, cls); setText(span, text);
  setText(el.sceneTag, live ? (R.cam.state === 'on' ? (S.scenario !== 'clear' ? 'LIVE WEBCAM + SIM OBJECT' : 'LIVE WEBCAM') : 'NO FEED') : 'SIMULATED SCENE');
  setClass(el.sceneTag, 'tag' + (live && R.cam.state === 'on' ? ' live' : ''));
  el.btnCamStart.disabled = R.cam.state === 'on' || R.cam.state === 'starting';
  el.btnCamStop.disabled = R.cam.state !== 'on';
  const ai = el.aiStatus, as = ai.querySelector('span');
  let acls = 'aistat idle', atext = 'AI MODEL: NOT LOADED (starts with camera)';
  if (!S.ai) { acls = 'aistat off'; atext = 'AI DETECTION: OFF'; }
  else if (R.ai.state === 'loading') { acls = 'aistat loading'; atext = 'AI MODEL: LOADING COCO-SSD… (first time 5–20 s)'; }
  else if (R.ai.state === 'ready') { acls = 'aistat ready'; atext = `AI: COCO-SSD READY${S.mode === 'live' && R.cam.state === 'on' ? ` · ${f0(R.ai.inferMs)} ms/frame · ${R.tracks.filter((t) => t.relevant).length} obj` : ''}`; }
  else if (R.ai.state === 'error') { acls = 'aistat error'; atext = 'AI UNAVAILABLE (needs internet on first load). Simulation still works'; }
  setClass(ai, acls); setText(as, atext);
  setText(el.btnAI, `AI DETECTION: ${S.ai ? 'ON' : 'OFF'}`);
  el.btnAI.classList.toggle('on', S.ai);
  setText(el.fps, `${R.fps} FPS`);
}

function setRow(row, value, weight, state, sigma) {
  const fv = row.querySelector('.fv'), fw = row.querySelector('.fw i'), fp = row.querySelector('.fp');
  setClass(row, 'frow' + (state === 'off' ? ' off' : state === 'deg' ? ' deg' : '') + (row.id === 'fFused' ? ' fused' : ''));
  setText(fv, state === 'off' ? 'OFFLINE' : state === 'na' ? 'N/A' : value == null ? '—' : `${f1(value)} m`);
  if (fw) fw.style.width = weight != null ? `${Math.round(weight * 100)}%` : '0%';
  if (fp) setText(fp, weight != null ? `${Math.round(weight * 100)}%` : sigma || '—');
}

function updateFusionPanel() {
  const p = R.prim;
  const notes = {
    auto: 'Inverse-variance fusion: each sensor is weighted by 1/σ². Radar stays steady in fog and dust, LiDAR is precise in clear air, and the camera estimate is the least precise.',
    camera: 'Camera-only ranging: distance is an ESTIMATE from object size. This is the fallback the system would use if radar and LiDAR failed.',
    manual: 'Type radar and LiDAR readings to test fusion by hand (radar σ 0.25 m, LiDAR σ 0.10 m). In live mode they apply to the nearest detected object.',
  };
  let note = notes[S.ranging];
  if (p && p.src === 'cam' && S.ranging === 'auto') note = 'Live AI detection: no real radar/LiDAR is attached to this laptop, so the distance is a CAMERA ESTIMATE (pinhole model × demo scale). Use MANUAL to enter radar/LiDAR values.';
  if (!p) note += ' No object in the monitored zone: choose a scenario or point the camera at a person/vehicle.';
  setText(el.fusionNote, note);
  el.manualBox.classList.toggle('show', S.ranging === 'manual');
  const rd = p && p.readings, wt = (p && p.weights) || {};
  const liveOnly = p && p.src === 'cam' && S.ranging !== 'manual';
  const lidarDeg = S.dust || S.fog;
  setRow(el.fRadar, rd ? rd.radar : null, wt.radar, !S.sensors.radar ? 'off' : liveOnly ? 'na' : '', 'σ 0.25');
  setRow(el.fLidar, rd ? rd.lidar : null, wt.lidar, !S.sensors.lidar ? 'off' : liveOnly ? 'na' : lidarDeg ? 'deg' : '', lidarDeg ? 'noisy' : 'σ 0.10');
  setRow(el.fCam, rd ? rd.cam : null, p && p.src === 'cam' && S.ranging !== 'manual' ? 1 : wt.cam, !S.sensors.rgb ? 'off' : '', 'est.');
  setRow(el.fFused, p ? p.dist : null, null, '', '');
  setText(el.fFused.querySelector('.fp'), p && p.dist != null ? p.srcName : '');
}

function updateFormula() {
  const s = R.safe, v = R.vis, p = R.prim;
  const rows = [
    ['Speed', `${S.speed} km/h ÷ 3.6 = ${f2(s.v)} m/s`],
    ['Reaction distance', `${f2(s.v)} × ${S.p.react} s = ${f1(s.reaction)} m`],
    ['Braking distance', `${f2(s.v)}² ÷ (2×${S.p.decel})${S.loaded ? ` × ${S.p.load}` : ''} = ${f1(s.braking)} m`],
    ['Safety margin', `${f1(s.margin)} m`],
    ['Subtotal', `${f1(s.base)} m`],
    [`Visibility factor (${v.band})`, `× ${v.factor}`],
  ];
  let html = '<div class="eq">Safe = (v·t<sub>r</sub> + v²/2a · k<sub>load</sub> + margin) × k<sub>vis</sub></div>';
  html += rows.map(([a, b]) => `<div class="r"><span>${a}</span><span>${b}</span></div>`).join('');
  html += `<div class="r tot"><span>SAFE DISTANCE</span><span>${f1(s.total)} m</span></div>`;
  if (p && p.dist != null) html += `<div class="r"><span>Actual ÷ safe</span><span style="color:${LEVEL_COL[p.lvl]}">${f1(p.dist)} ÷ ${f1(s.total)} = ${f2(p.dist / s.total)}× → ${LEVELS[p.lvl]}</span></div>`;
  if (el.formula.innerHTML !== html) el.formula.innerHTML = html;
}

/* ------------------------------------------------------------------ */
/* 14. 1-second data tick, chart                                       */
/* ------------------------------------------------------------------ */
function dataTick() {
  setText(el.clock, hhmmss());
  // simulated GPS/IMU drift
  if (S.sensors.gps) {
    R.gps.heading = (R.gps.heading + (Math.random() - 0.5) * 3 + 360) % 360;
    const m = S.speed / 3.6, h = R.gps.heading * Math.PI / 180;
    R.gps.lat += (m * Math.cos(h)) / 111320;
    R.gps.lon += (m * Math.sin(h)) / (111320 * Math.cos(R.gps.lat * Math.PI / 180));
  }
  // other trucks drift
  for (const f of FLEET) {
    if (f.me) continue;
    if (f.dir) { f.s += f.dir * f.v; if (f.s > 0.95 || f.s < 0.5) f.dir *= -1; f.spd = clamp(f.spd + Math.round((Math.random() - 0.5) * 3), 12, 38); }
  }
  const p = R.prim, s = R.safe, v = R.vis;
  R.series.push({ d: p && p.dist != null ? p.dist : null, s: s.total });
  if (R.series.length > 60) R.series.shift();
  const cells = [
    ['TIME', hhmmss(), ''],
    ['SPEED', `${S.speed} km/h`, ''],
    ['VISIBILITY', `${f0(v.m)} m · ${v.band}`, v.band === 'GOOD' ? 'l0' : v.band === 'VERY LOW' ? 'l2' : 'l1'],
    ['OBJECT DISTANCE', p && p.dist != null ? `${f1(p.dist)} m${p.estimated ? ' est.' : ''}` : '—', ''],
    ['SAFE DISTANCE', `${f1(s.total)} m`, ''],
    ['RELATIVE SPEED', p && p.closing != null ? `${p.closing > 0 ? '+' : ''}${f0(p.closing)} km/h` : '—', ''],
    ['TIME TO CONTACT', p && p.ttc && p.closing > 2 ? `${f1(p.ttc)} s` : '—', p && p.ttc < 4 && p.closing > 2 ? 'l2' : ''],
    ['RISK', LEVELS[R.level], 'l' + R.level],
    ['OBJECT', p ? `${p.label} (${p.src === 'cam' ? 'AI' : 'SIM'})` : 'NONE', ''],
    ['LOCATION', S.sensors.gps ? `${R.gps.lat.toFixed(4)}°N ${R.gps.lon.toFixed(4)}°E` : 'GPS OFFLINE', S.sensors.gps ? 'sm' : 'l1'],
    ['HEADING / IMU', S.sensors.imu ? `${f0(R.gps.heading)}° · ${f1(S.speed ? 0.2 + Math.random() * 0.2 : 0)} m/s²` : 'IMU OFFLINE', S.sensors.imu ? '' : 'l1'],
    ['RANGING', p && p.dist != null ? p.srcName : '—', ''],
  ];
  el.dataGrid.innerHTML = cells.map(([k, val, c]) => `<div class="dcell"><small>${k}</small><b class="${c}">${esc(val)}</b></div>`).join('');
  drawChart();
}

function drawChart() {
  const dpr = window.devicePixelRatio || 1;
  const cw = chart.clientWidth, ch = chart.clientHeight;
  if (!cw) return;
  if (chart.width !== Math.round(cw * dpr)) { chart.width = Math.round(cw * dpr); chart.height = Math.round(ch * dpr); }
  const c = cctx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, cw, ch);
  const data = R.series, n = 60;
  const maxV = Math.max(40, ...data.map((d) => Math.max(d.d || 0, d.s || 0))) * 1.15;
  const pl = 34, pr = 8, pt = 8, pb = 18;
  const X = (i) => pl + (cw - pl - pr) * (i + (n - data.length)) / (n - 1);
  const Y = (v) => pt + (ch - pt - pb) * (1 - v / maxV);
  c.font = '10px "IBM Plex Mono", monospace'; c.fillStyle = '#62748a'; c.strokeStyle = '#1b2a3a'; c.lineWidth = 1;
  const step = maxV > 120 ? 50 : maxV > 60 ? 20 : 10;
  for (let v = 0; v <= maxV; v += step) { c.beginPath(); c.moveTo(pl, Y(v)); c.lineTo(cw - pr, Y(v)); c.stroke(); c.fillText(String(v), 4, Y(v) + 3); }
  c.fillText('m', 4, ch - 4);
  if (data.length < 2) return;
  // danger zone under safe line
  c.beginPath(); data.forEach((d, i) => { const x = X(i), y = Y(d.s); i ? c.lineTo(x, y) : c.moveTo(x, y); });
  c.lineTo(X(data.length - 1), Y(0)); c.lineTo(X(0), Y(0)); c.closePath(); c.fillStyle = 'rgba(229,72,77,.08)'; c.fill();
  c.lineWidth = 2; c.strokeStyle = '#f0a53a'; c.beginPath(); data.forEach((d, i) => { const x = X(i), y = Y(d.s); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
  c.strokeStyle = '#38c3dd'; c.beginPath(); let pen = false;
  data.forEach((d, i) => { if (d.d == null) { pen = false; return; } const x = X(i), y = Y(d.d); pen ? c.lineTo(x, y) : c.moveTo(x, y); pen = true; });
  c.stroke();
}

/* ------------------------------------------------------------------ */
/* 15. Controls                                                        */
/* ------------------------------------------------------------------ */
function syncControls() {
  el.inSpeed.value = S.speed; setText(el.outSpeed, `${S.speed} km/h`);
  el.inDist.value = S.simDist; setText(el.outDist, `${f1(S.simDist)} m`);
  el.inMotion.checked = S.motion;
  el.btnFog.classList.toggle('on', S.fog);
  el.btnDust.classList.toggle('on', S.dust);
  el.btnFault.classList.toggle('on', !S.sensors.radar);
  setText(el.btnFault, S.sensors.radar ? 'SIMULATE RADAR FAILURE' : 'RESTORE RADAR');
  $$('.scn').forEach((b) => b.classList.toggle('on', b.dataset.scn === S.scenario));
  el.tabLive.setAttribute('aria-selected', String(S.mode === 'live'));
  el.tabSim.setAttribute('aria-selected', String(S.mode === 'sim'));
  el.inConf.value = S.minConf; setText(el.outConf, `${Math.round(S.minConf * 100)}%`);
  el.inScale.value = String(S.scale);
  $$('#rangeSeg button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.r === S.ranging)));
  el.inRadar.value = S.manual.radar; el.inLidar.value = S.manual.lidar;
  el.pReact.value = S.p.react; el.pDecel.value = S.p.decel; el.pMargin.value = S.p.margin; el.pLoad.value = S.p.load;
  el.pLoaded.checked = S.loaded; el.pBand.value = S.p.band; el.pFogVis.value = S.p.fogVis; el.pDustVis.value = S.p.dustVis;
  setText(el.btnSound, AU.on ? 'ALERT SOUND ON' : 'ENABLE ALERT SOUND');
  el.btnSound.classList.toggle('on', AU.on);
  el.btnMute.disabled = !AU.on;
  setText(el.btnMute, AU.muted ? 'UNMUTE ALERT' : 'MUTE ALERT');
  el.btnMute.classList.toggle('on', AU.muted);
  setText(el.btnNet, S.net ? 'SIMULATE NETWORK LOSS' : 'RESTORE NETWORK');
  el.btnNet.classList.toggle('on', !S.net);
  setText(el.hdrLink, S.net ? 'ONLINE' : 'LINK LOST');
  el.hdrLinkDot.classList.toggle('lost', !S.net);
  if (R.assess) updateCamStatus();
}

function setMode(m) {
  if (m === S.mode && !(m === 'live' && R.cam.state !== 'on')) return;
  if (m === 'live') { startCamera(); return; }
  if (R.cam.state === 'on' || R.cam.state === 'starting') stopCamera(true);
  hideCamMsg();
  S.mode = 'sim';
  logEvent('Switched to SIMULATION MODE', 'li');
  syncControls();
}

function setScenario(k) {
  S.scenario = k;
  if (k !== 'clear') { S.simDist = SCN[k].dist; S.speed = 28; S.motion = false; }
  if (S.mode === 'live' && R.cam.state !== 'on') { S.mode = 'sim'; hideCamMsg(); logEvent('Camera offline → showing scenario in SIMULATION MODE', 'li'); }
  logEvent(k === 'clear' ? 'Scenario: CLEAR ROAD' : `Scenario: ${SCN[k].name.toUpperCase()} at ${SCN[k].dist} m`, 'li');
  syncControls();
}

function toggleSensor(k) {
  S.sensors[k] = !S.sensors[k];
  logEvent(`${SENSOR_NAME[k]} ${S.sensors[k] ? 'RESTORED' : 'FAILURE: OFFLINE'}${S.sensors[k] ? '' : '. System operating with remaining sensors'}`, S.sensors[k] ? 'l0' : 'l1');
  lastSensorSig = '';
  syncControls();
}

function resetSystem() {
  const keep = { mode: S.mode, ai: S.ai, scale: S.scale, minConf: S.minConf };
  S = clone(DEFAULTS);
  Object.assign(S, keep);
  if (R.queue.length) { R.queue.forEach(pushLog); R.queue = []; }
  R.level = 0; R.lowerSince = 0; R.series = [];
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  lastSensorSig = '';
  logEvent('SYSTEM RESET: all sensors online, clear road, normal visibility', 'l0');
  syncControls();
}

function num(input, lo, hi, fallback) { const v = parseFloat(input.value); return isFinite(v) ? clamp(v, lo, hi) : fallback; }

function bind() {
  el.btnCamStart.addEventListener('click', () => startCamera(el.camSelect.hidden ? undefined : el.camSelect.value || undefined));
  el.btnCamStop.addEventListener('click', () => { stopCamera(); syncControls(); });
  $('#btnCamRetry').addEventListener('click', () => startCamera());
  $('#btnGoSim').addEventListener('click', () => { hideCamMsg(); setMode('sim'); });
  el.camSelect.addEventListener('change', () => startCamera(el.camSelect.value));
  el.tabLive.addEventListener('click', () => setMode('live'));
  el.tabSim.addEventListener('click', () => setMode('sim'));
  el.btnAI.addEventListener('click', () => { S.ai = !S.ai; if (S.ai && R.cam.state === 'on') loadModel(); if (!S.ai) R.tracks = []; logEvent(`AI detection ${S.ai ? 'ON' : 'OFF'}`, 'li'); syncControls(); });
  el.inConf.addEventListener('input', () => { S.minConf = +el.inConf.value; syncControls(); });
  el.inScale.addEventListener('change', () => { S.scale = +el.inScale.value; logEvent(`Demo scale ×${S.scale}`, 'li'); });
  $$('.scn').forEach((b) => b.addEventListener('click', () => setScenario(b.dataset.scn)));
  el.btnFog.addEventListener('click', () => { S.fog = !S.fog; logEvent(S.fog ? `HEAVY FOG: visibility ${S.p.fogVis} m` : 'Fog cleared', S.fog ? 'l1' : 'l0'); syncControls(); });
  el.btnDust.addEventListener('click', () => { S.dust = !S.dust; logEvent(S.dust ? `DENSE DUST: visibility ${S.p.dustVis} m, RGB degraded, radar ranging` : 'Dust cleared', S.dust ? 'l1' : 'l0'); syncControls(); });
  el.btnFault.addEventListener('click', () => toggleSensor('radar'));
  el.inSpeed.addEventListener('input', () => { S.speed = +el.inSpeed.value; syncControls(); });
  $$('.step').forEach((b) => b.addEventListener('click', () => { S.speed = clamp(S.speed + +b.dataset.d, 0, 60); syncControls(); }));
  el.inDist.addEventListener('input', () => { S.simDist = +el.inDist.value; syncControls(); });
  el.inMotion.addEventListener('change', () => { S.motion = el.inMotion.checked; syncControls(); });
  el.btnSound.addEventListener('click', () => { AU.enable(); syncControls(); });
  el.btnMute.addEventListener('click', () => { AU.muted = !AU.muted; if (AU.muted && 'speechSynthesis' in window) speechSynthesis.cancel(); logEvent(AU.muted ? 'Alert sound muted' : 'Alert sound unmuted', 'li'); syncControls(); });
  $('#btnReset').addEventListener('click', resetSystem);
  el.sensorStrip.addEventListener('click', (e) => { const b = e.target.closest('[data-sensor]'); if (b) toggleSensor(b.dataset.sensor); });
  el.rangeSeg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.ranging = b.dataset.r; logEvent(`Ranging source: ${b.textContent}`, 'li'); syncControls(); });
  el.inRadar.addEventListener('input', () => { S.manual.radar = num(el.inRadar, 0.5, 300, S.manual.radar); });
  el.inLidar.addEventListener('input', () => { S.manual.lidar = num(el.inLidar, 0.5, 300, S.manual.lidar); });
  const pmap = [['pReact', 'react', 0.3, 3], ['pDecel', 'decel', 0.5, 8], ['pMargin', 'margin', 0, 50], ['pLoad', 'load', 1, 2], ['pBand', 'band', 1.1, 3], ['pFogVis', 'fogVis', 20, 999], ['pDustVis', 'dustVis', 10, 400]];
  for (const [id, key, lo, hi] of pmap) el[id].addEventListener('change', () => { S.p[key] = num(el[id], lo, hi, S.p[key]); el[id].value = S.p[key]; });
  el.pLoaded.addEventListener('change', () => { S.loaded = el.pLoaded.checked; });
  el.btnNet.addEventListener('click', () => {
    if (S.net) { logEvent('M-102 NETWORK LINK LOST: control room shows last known state; driver alerts continue locally', 'l1'); S.net = false; }
    else { S.net = true; const q = R.queue.length; R.queue.forEach(pushLog); R.queue = []; logEvent(`M-102 network link restored (${q} queued event${q === 1 ? '' : 's'} delivered)`, 'l0'); }
    syncControls();
  });
  $('#btnCal').addEventListener('click', () => {
    const known = num(el.inCalDist, 0.3, 20, 2);
    const t = R.tracks.filter((x) => x.cls === 'person' && x.raw != null).sort((a, b) => b.box[3] - a.box[3])[0];
    if (!t) { el.calNote.textContent = 'Calibration needs a PERSON detected by the live camera. Start the camera, stand at the known distance, then press CALIBRATE.'; return; }
    R.calib = clamp(R.calib * known / t.raw, 0.2, 5); saveCalib(R.calib); R.tracks = [];
    el.calNote.textContent = `Calibrated: focal-length factor ${R.calib.toFixed(2)} (saved in this browser). Camera distances are still ESTIMATES.`;
    logEvent(`Camera calibrated at ${known} m (factor ${R.calib.toFixed(2)})`, 'li');
  });
  $('#btnCalReset').addEventListener('click', () => { R.calib = 1; saveCalib(1); el.calNote.textContent = 'Calibration reset to the default 60° field-of-view assumption.'; });
  // Presenter keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input[type=number],input[type=text],select,textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k.startsWith('arrow') && e.target.matches('input[type=range]')) return;   // let sliders handle their own arrows
    const map = { 1: () => setScenario('clear'), 2: () => setScenario('vehicle'), 3: () => setScenario('person'), 4: () => setScenario('rock'),
      f: () => el.btnFog.click(), d: () => el.btnDust.click(), x: () => toggleSensor('radar'), r: resetSystem,
      c: () => (R.cam.state === 'on' ? (stopCamera(), syncControls()) : startCamera()), m: () => AU.on ? el.btnMute.click() : el.btnSound.click(),
      arrowup: () => { S.speed = clamp(S.speed + 2, 0, 60); syncControls(); }, arrowdown: () => { S.speed = clamp(S.speed - 2, 0, 60); syncControls(); },
      arrowright: () => { S.simDist = clamp(S.simDist + 2, 2, 120); syncControls(); }, arrowleft: () => { S.simDist = clamp(S.simDist - 2, 2, 120); syncControls(); } };
    if (map[k]) { if (k.startsWith('arrow')) e.preventDefault(); map[k](); }
  });
  window.addEventListener('resize', drawChart);
}

/* ------------------------------------------------------------------ */
/* 16. Main loop                                                       */
/* ------------------------------------------------------------------ */
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  try {
    updateNoise(now);
    R.phase += (S.speed / 3.6) * dt;
    if (S.motion && S.scenario !== 'clear') {
      const closing = S.speed - SCN[S.scenario].objSpeed;
      S.simDist = clamp(S.simDist - (closing / 3.6) * dt, 2, 120);
      el.inDist.value = S.simDist; setText(el.outDist, `${f1(S.simDist)} m`);
    }
    if (S.mode === 'live' && R.cam.state === 'on' && S.ai && S.sensors.rgb && R.ai.model && now - R.ai.lastRun > 100) runDetection(now);

    const vis = getVis(), safe = safeDistance(vis);
    R.vis = vis; R.safe = safe;
    R.objects = buildObjects(now, safe);
    const a = assess(R.objects, vis, safe);
    R.assess = a; R.prim = a.prim;
    // hysteresis: escalate immediately, de-escalate only after the lower level holds for 0.9 s
    const prev = R.level;
    if (a.lvl >= R.level) { R.level = a.lvl; R.lowerSince = 0; }
    else if (!R.lowerSince) R.lowerSince = now;
    else if (now - R.lowerSince > 900) { R.level = a.lvl; R.lowerSince = 0; }
    if (R.level !== prev) {
      const msg = alertFor(R.level, a, vis);
      const p = a.prim;
      logEvent(`M-102 ${LEVELS[R.level]}: ${p && p.dist != null ? `${p.label} ${f1(p.dist)} m (safe ${f1(safe.total)} m)` : msg.text.replace(/^⚠ /, '')}`, 'l' + R.level);
      AU.onLevel(R.level, msg, now);
    }

    drawView(now);
    if (now - R.thT > 120) { renderThermal(); R.thT = now; }
    if (now - R.uiT > 100) { updateUI(); R.uiT = now; }
    if (now - R.mapT > 120) { updateMap(); R.mapT = now; }
    if (now - R.dataT >= 1000) { dataTick(); R.dataT = now; }
    AU.tick(now, R.level, R.msg || alertFor(R.level, a, vis));
    R.fpsFrames++;
    if (now - R.fpsT > 1000) { R.fps = R.fpsFrames; R.fpsFrames = 0; R.fpsT = now; }
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(frame);
}

bind();
syncControls();
logEvent('MineSafe-Vision prototype started. SIMULATION MODE', 'li');
requestAnimationFrame(frame);
})();
