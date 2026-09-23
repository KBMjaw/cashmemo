# MineSafe-Vision: working web prototype

**AI-Enabled Safety & Monitoring System for Mine Vehicles in Fog and Low-Visibility Conditions**

A browser app that does the following:

- Opens your **real webcam**.
- Runs **real AI object detection** (TensorFlow.js COCO-SSD) on the live video.
- **Estimates distance**.
- Fuses it with **simulated mmWave radar and LiDAR**.
- Computes a **dynamic safe stopping distance**.
- Classifies the risk as **SAFE / CAUTION / CRITICAL**.
- Warns the driver with a screen banner, **audio tones and spoken alerts**.
- Mirrors everything to a simulated **mine control room**.

It is a safety-*assistance* prototype. It never controls steering, brakes or any vehicle function.

---

## 1. Run it

The webcam only works on a **secure page**: `http://localhost` or `https://`. Opening `index.html` by double-clicking (`file://`) is **not** supported.

**Option A: Python (installed on most computers)**

```bash
cd minesafe-vision
python -m http.server 8000        # on some systems: python3 -m http.server 8000
```

Then open **http://localhost:8000** in Chrome or Edge (Firefox and Safari also work).

**Option B: Node.js**

```bash
cd minesafe-vision
npx serve -l 8000
```

**Option C: VS Code**. Install the *Live Server* extension, then right-click `index.html` → *Open with Live Server*.

**Online:** the same app is deployed on Vercel over https, so the webcam works there too.

There is no build step and nothing to install. All libraries and the AI model weights are bundled in `vendor/` and `models/`, so **detection also works offline** once the page is served locally. Only the fonts come from the internet; offline, the page falls back to system fonts.

---

## 2. Test webcam access

1. Click **START CAMERA** (top of the camera panel) or the **LIVE CAMERA MODE** tab.
2. The browser asks for camera permission. Click **Allow**.
3. The panel shows your live video, and the status changes to **● ONLINE** with the tag **LIVE WEBCAM**.
4. The AI model loads the first time (5–20 s; see `AI: COCO-SSD READY` under the video).
5. Step in front of the camera. You get a box labelled **PERSON xx%** with an **EST.** distance, the movement (approaching / moving away / steady) and the risk level.
6. **STOP CAMERA** releases the webcam. If you have several cameras, a selector appears next to the buttons.

**If permission is denied**, the panel shows **CAMERA OFFLINE** with instructions. Click the camera or padlock icon in the address bar, set *Camera* to *Allow*, then press **TRY AGAIN**. On Windows also check *Settings → Privacy → Camera*; on macOS check *System Settings → Privacy & Security → Camera*. If another app (Zoom, Teams…) is using the camera, close it first.

**Tips for the live demo**
- **DEMO SCALE ×10** (default) maps 1 m in the room to 10 m on the haul road, so walking toward the webcam demonstrates SAFE → CAUTION → CRITICAL. Set it to ×1 for plain room distances.
- **CALIBRATE** (Sensor Fusion panel): stand at a known distance (e.g. 2 m) and press it. This makes the person-distance estimate more accurate on your webcam.
- **AI DETECTION: OFF** stops the presenter's own body from affecting the risk while you demonstrate the simulated scenarios on the live video.

---

## 3. Demonstration script (matches the project brief)

| Step | Action | What the audience sees |
|---|---|---|
| 1–4 | Open the site → **START CAMERA** → Allow | Live webcam, status **ONLINE** |
| 5–6 | **HEAVY FOG** | Fog over the video. Visibility **LOW · 320 m**. RGB camera and LiDAR show **REDUCED**; radar stays **ONLINE**. Risk becomes **CAUTION** (reduced visibility) |
| 7–8 | **VEHICLE AHEAD** | A simulated haul truck is inserted into the view. **VEHICLE · 18 m · FUSED**, speed **28 km/h**, safe distance **35.1 m**, closing **+6 km/h** |
| 9–10 | *(automatic)* | Risk **CRITICAL**, banner **VEHICLE INSIDE SAFE DISTANCE — 18 m AHEAD** |
| 11 | **ENABLE ALERT SOUND** (click once at the start of the demo) | Triple beep + spoken *“Warning. Vehicle ahead.”* repeating while CRITICAL |
| 12 | Scroll to **MINE CONTROL ROOM** | **TRUCK M-102 CRITICAL**, red marker on the map, safe-distance zone, entry in the event log |
| 13–15 | Move **SPEED** to **10 km/h** | Safe distance drops to **12.9 m**. Risk becomes **CAUTION** (the object is outside the safe distance but within the caution band) |
| 16 | **RESET SYSTEM** | Clear road, normal visibility, all sensors online, **SAFE** |

### Heavy fog
Click **HEAVY FOG**. The video gets a drifting fog layer and loses contrast.
- Visibility changes to **LOW** (default 320 m; editable under *Safe-distance model → Heavy-fog visibility*).
- The safe distance is multiplied by **×1.2**.
- On a clear road the risk becomes **CAUTION: visibility LOW**.

### Dense dust
Click **DENSE DUST**. The video turns brown and hazy with moving particles.
- Visibility changes to **VERY LOW (60 m)**, and the safe distance is multiplied by ×1.4.
- The sensor strip shows **RGB CAMERA: DEGRADED**, **THERMAL: AVAILABLE**, **RADAR: ONLINE** and **LiDAR: DEGRADED**.
- In the Sensor Fusion panel the radar gets most of the weight, because dust scatters the LiDAR beam and hides the camera image.
- Combine it with **ROCK OBSTACLE**. The rock is almost invisible in the image, but radar and LiDAR still range it, and the result is CRITICAL.

### Vehicle ahead
Click **VEHICLE AHEAD**.
- A haul truck appears 18 m ahead, driving at 22 km/h, so it closes at **+6 km/h** while you drive at 28 km/h.
- Tick **MOTION** to let it actually close in. Watch the distance, the time-to-contact and the risk change.
- Drag **SIM OBJECT DIST** to move it by hand.

### Rock obstacle
Click **ROCK OBSTACLE**. This sets Object = Rock, Distance = 18 m and Speed = 28 km/h. The safe distance is 29.3 m in clear weather.
- The risk becomes **CRITICAL** with **ROCK OBSTACLE — 18 m AHEAD**.
- A generic COCO model cannot recognise mine rocks, so this obstacle is simulated. The honesty table in the app says so.

### Critical safety distance
Choose any object, then show how the risk moves between levels:
- Drag **SIM OBJECT DIST** from 60 m (SAFE) down through 40 m (CAUTION) to under 29 m (CRITICAL).
- Or raise **SPEED** and watch the safe distance grow past the object distance.

The **Safe-Distance Model** panel shows every step of the calculation with live numbers. The **Real-time data** chart plots object distance against safe distance over time; the red area is "inside the safe distance".

### Sensor failure
- Click **SIMULATE RADAR FAILURE**, or click any sensor card, to take a sensor offline.
- The card turns red, the log records it, and the risk is at least CAUTION. The system keeps working with the remaining sensors.
- If the RGB camera fails, classification falls back to the thermal camera.
- If both RGB and thermal fail, radar and LiDAR report an unclassified **OBSTACLE**.

### Network loss (optional)
- **SIMULATE NETWORK LOSS** in the control room freezes M-102's data there. The truck shows **LINK LOST**.
- The **driver alerts keep working**, because decisions are made on the truck.
- When the link is restored, the queued events are delivered.

### Keyboard shortcuts (for presenting)
`1` clear road · `2` vehicle · `3` person · `4` rock · `F` fog · `D` dust · `X` radar failure · `↑/↓` speed · `←/→` object distance · `C` camera on/off · `M` sound · `R` reset

---

## 4. Safe-distance model and risk engine

```
v              = speed_kmh / 3.6                      (m/s)
reaction       = v × reaction_time                    (default 1.5 s)
braking        = v² / (2 × deceleration) × load_factor  (default 3.0 m/s², ×1.25 when loaded)
safe_distance  = (reaction + braking + margin) × visibility_factor
                  margin default 5 m; visibility factor GOOD 1.0 · MODERATE 1.1 · LOW 1.2 · VERY LOW 1.4
```

Example: 28 km/h, loaded, heavy fog → (11.7 + 12.6 + 5.0) × 1.2 = **35.1 m**. An object at 18 m is inside that distance, so the result is **CRITICAL**.

The risk level is the worst of these rules:

| Rule | Level |
|---|---|
| distance < safe distance | CRITICAL |
| distance < 1.5 × safe distance (caution band, editable) | CAUTION |
| person detected within 2× / 1.25× safe distance | CAUTION / CRITICAL |
| object approaching, time-to-contact < 4 s | CRITICAL |
| object closer than 5 m | CRITICAL |
| visibility LOW or VERY LOW | at least CAUTION |
| very low visibility **and** an object at CAUTION | CRITICAL |
| speed > 40 km/h | at least CAUTION |
| RGB / thermal / radar / LiDAR offline | at least CAUTION |

The level rises immediately and falls only after 0.9 s, so it does not flicker. The **WHY THIS LEVEL** list in the app shows which rules fired.

This is a **prototype model** with editable assumptions. It is not a certified mining braking-distance calculation.

---

## 5. What is real and what is simulated

| Part | Status |
|---|---|
| Webcam video (`getUserMedia`) | **Real** |
| Object detection: person, car, truck, bus, motorcycle, bicycle (COCO-SSD, TensorFlow.js, in the browser) | **Real AI** |
| Bounding boxes, confidence, tracking, closing speed of detected objects | **Real** (computed from the detections) |
| Camera distance: pinhole model `distance ≈ focal × real height ÷ box height` × demo scale | **Estimate**, always labelled *EST.* |
| Rocks / mine-specific obstacles | **Simulated** (a generic model cannot reliably detect them) |
| mmWave radar and LiDAR readings (with realistic noise) and their fusion | **Simulated**; inverse-variance fusion is real maths |
| Thermal camera view | **Simulated** false-colour render; the webcam is not a thermal camera |
| Fog and dust | **Simulated** visual effect + visibility value |
| GPS, IMU, visibility sensor, fleet trucks M-101/103/104 | **Simulated** |
| Safe-distance calculation and risk engine | **Real logic** running every frame |
| Audio warnings (Web Audio API tones + browser speech synthesis) | **Real** |
| Control room | **Simulated**; runs in the same browser, no server |

The **proposed real truck** would use:
- Low-light HDR RGB cameras
- An LWIR thermal camera
- 77–81 GHz mmWave radar
- LiDAR
- A visibility/environment sensor
- GPS/GNSS, IMU and wheel speed (CAN bus)
- An NVIDIA Jetson or industrial edge computer
- A rugged cab display, buzzer and seat vibration
- Wi-Fi/4G/5G for control-room monitoring only

---

## 6. Files

```
minesafe-vision/
├── index.html            dashboard layout
├── style.css             industrial dark theme
├── app.js                camera, AI, fusion, risk engine, rendering, audio, control room
├── vendor/               TensorFlow.js + COCO-SSD (bundled for offline use)
├── models/               COCO-SSD Lite MobileNet v2 weights (~18 MB)
├── presentation/         8-slide project presentation (HTML + PPTX)
└── README.md
```

No backend is needed. Everything runs in the browser.

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| "CAMERA OFFLINE: page must be secure" | Use `http://localhost:8000`, not `file://` or `http://192.168…` |
| Permission denied | Address-bar camera icon → Allow → **TRY AGAIN** |
| Camera busy | Close Zoom/Teams/other tabs using the camera |
| "AI UNAVAILABLE" | Make sure `vendor/` and `models/` were copied with the project. Simulation mode always works |
| No sound | Click **ENABLE ALERT SOUND** once (browsers block audio until you click). Check the system volume |
| Slow detection | Close other heavy tabs. Detection runs on the GPU through WebGL. Tracks adapt to slower frame rates |

---

*MineSafe-Vision is a prototype safety-assistance system for demonstration purposes. It is not a certified vehicle control or collision-avoidance system.*
