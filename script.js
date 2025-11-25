// ACA - fixed script.js (gesture detection + neon cursor + canvas sizing + debug logs)

// HTML elements
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gestureText = document.getElementById("gestureText");

// IMPORTANT: set real internal canvas pixel size (must match CSS visual size)
canvas.width = 640;
canvas.height = 480;

// Create neon cursor element if not present (so you don't need to edit CSS)
let neon = document.getElementById("neonCursor");
if (!neon) {
  neon = document.createElement("div");
  neon.id = "neonCursor";
  document.body.appendChild(neon);
  // basic inline style (can be overridden by CSS)
  Object.assign(neon.style, {
    position: "fixed",
    width: "20px",
    height: "20px",
    background: "#00eaff",
    borderRadius: "50%",
    pointerEvents: "none",
    boxShadow: "0 0 18px #00eaff, 0 0 36px #0088cc",
    transform: "translate(-50%, -50%)",
    zIndex: 9999,
    left: "-100px",
    top: "-100px"
  });
}

// Start camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
    console.log("Camera started");
  } catch (err) {
    console.error("Camera start failed:", err);
    alert("Camera access blocked or not available. Allow camera and reload the page.");
  }
}

// helpers
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function isFingerUp(tip, pip) {
  return tip.y < pip.y; // smaller y = higher on camera
}

// gesture detection
function detectGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return "No Hand";

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];
  const wrist = landmarks[0];

  const indexUp = isFingerUp(indexTip, indexPip);
  const middleUp = isFingerUp(middleTip, middlePip);
  const ringUp = isFingerUp(ringTip, ringPip);
  const pinkyUp = isFingerUp(pinkyTip, pinkyPip);

  const pinchDist = distance(thumbTip, indexTip);

  // Pinch
  if (pinchDist < 0.04) return "Pinch";

  // Fist (all tips near wrist)
  if (!indexUp && !middleUp && !ringUp && !pinkyUp) return "Fist";

  // Open Palm
  if (indexUp && middleUp && ringUp && pinkyUp) return "Open Palm";

  // Pointing (index only)
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return "Pointing";

  // V Sign
  if (indexUp && middleUp && !ringUp && !pinkyUp) return "V-Sign";

  // Thumbs up: thumb tip is above wrist and others down
  if (thumbTip.y < (wrist.y - 0.05) && !indexUp && !middleUp && !ringUp && !pinkyUp) {
    return "Thumbs Up";
  }

  return "Unknown";
}

// MediaPipe Hands setup
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

// onResults handler
hands.onResults((results) => {
  // clear & draw camera frame on canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (results.image) ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    gestureText.innerText = "---";
    // hide cursor when no hand
    neon.style.left = "-200px";
    neon.style.top = "-200px";
    return;
  }

  const lm = results.multiHandLandmarks[0];

  // draw landmarks & connectors (MediaPipe drawing utils)
  try {
    drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: "#00eaff", lineWidth: 2 });
    drawLandmarks(ctx, lm, { color: "#ff0066", lineWidth: 1 });
  } catch (e) {
    console.warn("Drawing helpers missing:", e);
  }

  // detect gesture and show label
  const gesture = detectGesture(lm);
  gestureText.innerText = gesture;

  // move neon cursor to index fingertip
  const indexTip = lm[8];
  // lm coords are normalized (0..1) relative to canvas size
  const cursorX = indexTip.x * canvas.width;
  const cursorY = indexTip.y * canvas.height;

  // Convert canvas coords to page (account for canvas position)
  const rect = canvas.getBoundingClientRect();
  const pageX = rect.left + cursorX;
  const pageY = rect.top + cursorY;

  // Smooth the cursor movement (simple low-pass)
  if (!neon._x) { neon._x = pageX; neon._y = pageY; }
  neon._x += (pageX - neon._x) * 0.35;
  neon._y += (pageY - neon._y) * 0.35;

  neon.style.left = neon._x + "px";
  neon.style.top = neon._y + "px";
});

// camera loop
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: canvas.width,
  height: canvas.height
});

// start everything
startCamera().then(() => camera.start()).catch(err => {
  console.error("Camera failed:", err);
});


