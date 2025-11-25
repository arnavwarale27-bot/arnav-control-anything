// FINAL FIX – NO MORE "Camera is not defined" ERROR

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 480;

const gestureText = document.getElementById("gestureText");

// ⭐ FIXED CAMERA FUNCTION (NO MediaPipe Camera)
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" }
    });

    video.srcObject = stream;

    await video.play().catch(err => {
      console.log("Autoplay blocked:", err);
    });

    console.log("Camera started successfully!");
  } catch (err) {
    console.error("Camera Error:", err);
    alert("Please allow camera access.");
  }
}

// Helper functions
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isFingerUp(tip, pip) {
  return tip.y < pip.y;
}

function detectGesture(lm) {
  const thumb = lm[4];
  const indexTip = lm[8];
  const indexPip = lm[6];
  const midTip = lm[12];
  const midPip = lm[10];
  const ringTip = lm[16];
  const ringPip = lm[14];
  const pinkyTip = lm[20];
  const pinkyPip = lm[18];
  const wrist = lm[0];

  const indexUp = isFingerUp(indexTip, indexPip);
  const middleUp = isFingerUp(midTip, midPip);
  const ringUp = isFingerUp(ringTip, ringPip);
  const pinkyUp = isFingerUp(pinkyTip, pinkyPip);

  if (distance(thumb, indexTip) < 0.04) return "Pinch";
  if (!indexUp && !middleUp && !ringUp && !pinkyUp) return "Fist";
  if (indexUp && middleUp && ringUp && pinkyUp) return "Open Palm";
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return "Pointing";
  if (indexUp && middleUp && !ringUp && !pinkyUp) return "V-Sign";
  if (thumb.y < wrist.y - 0.05) return "Thumbs Up";

  return "Unknown";
}

// Neon cursor
let neon = document.createElement("div");
neon.id = "cursor";
Object.assign(neon.style, {
  position: "fixed",
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  background: "#00eaff",
  boxShadow: "0 0 15px #00eaff",
  pointerEvents: "none",
  zIndex: 9999
});
document.body.appendChild(neon);

// MediaPipe setup
const hands = new Hands({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

hands.onResults(results => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.image) {
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
  }

  if (!results.multiHandLandmarks) {
    gestureText.innerText = "---";
    return;
  }

  const lm = results.multiHandLandmarks[0];

  drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: "#00eaff", lineWidth: 2 });
  drawLandmarks(ctx, lm, { color: "#ff0066", lineWidth: 2 });

  const gesture = detectGesture(lm);
  gestureText.innerText = gesture;

  const indexTip = lm[8];
  const x = indexTip.x * canvas.width;
  const y = indexTip.y * canvas.height;

  const rect = canvas.getBoundingClientRect();
  neon.style.left = rect.left + x + "px";
  neon.style.top = rect.top + y + "px";
});

// ⭐ FINAL FIXED LOOP (manual)
async function mainLoop() {
  await hands.send({ image: video });
  requestAnimationFrame(mainLoop);
}

// Start everything
startCamera().then(mainLoop);





