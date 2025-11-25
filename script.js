// ACA - fixed script.js (gesture detection + neon cursor + canvas sizing + debug logs)

// HTML elements
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gestureText = document.getElementById("gestureText");

// IMPORTANT: set real internal canvas pixel size
canvas.width = 640;
canvas.height = 480;

// Create neon cursor element
let neon = document.createElement("div");
neon.id = "neonCursor";
document.body.appendChild(neon);
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
});

// Camera start
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await video.play();
}

// Helpers
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function isFingerUp(tip, pip) {
  return tip.y < pip.y;
}

// Gesture Detection
function detectGesture(lm) {
  const thumbTip = lm[4];
  const indexTip = lm[8];
  const indexPip = lm[6];
  const middleTip = lm[12];
  const middlePip = lm[10];
  const ringTip = lm[16];
  const ringPip = lm[14];
  const pinkyTip = lm[20];
  const pinkyPip = lm[18];
  const wrist = lm[0];

  const indexUp = isFingerUp(indexTip, indexPip);
  const middleUp = isFingerUp(middleTip, middlePip);
  const ringUp = isFingerUp(ringTip, ringPip);
  const pinkyUp = isFingerUp(pinkyTip, pinkyPip);

  // Pinch
  if (distance(thumbTip, indexTip) < 0.04) return "Pinch";

  // Fist
  if (!indexUp && !middleUp && !ringUp && !pinkyUp) return "Fist";

  // Open Palm
  if (indexUp && middleUp && ringUp && pinkyUp) return "Open Palm";

  // Pointing
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return "Pointing";

  // V Sign
  if (indexUp && middleUp && !ringUp && !pinkyUp) return "V-Sign";

  // Thumbs Up
  if (thumbTip.y < wrist.y - 0.05) return "Thumbs Up";

  return "Unknown";
}

// MediaPipe Setup
const hands = new Hands({
  locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`,
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6,
});

hands.onResults((results) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.image) ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (!results.multiHandLandmarks) {
    gestureText.innerText = "---";
    return;
  }

  const lm = results.multiHandLandmarks[0];

  drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: "#00eaff", lineWidth: 2 });
  drawLandmarks(ctx, lm, { color: "#ff0066", lineWidth: 1 });

  const gesture = detectGesture(lm);
  gestureText.innerText = gesture;

  // Neon cursor follow
  const indexTip = lm[8];
  const x = indexTip.x * canvas.width;
  const y = indexTip.y * canvas.height;

  const rect = canvas.getBoundingClientRect();
  neon.style.left = rect.left + x + "px";
  neon.style.top = rect.top + y + "px";
});

// Camera Loop
const camera = new Camera(video, {
  onFrame: async () => await hands.send({ image: video }),
  width: 640,
  height: 480,
});

// Start
startCamera().then(() => camera.start());



