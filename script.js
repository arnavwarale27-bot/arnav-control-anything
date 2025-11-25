console.log("Script loaded!");

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gestureText = document.getElementById("gestureText");

// -------------------------
//  Start Camera
// -------------------------
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" }
        });

        video.srcObject = stream;
        await video.play();

        console.log("Camera started!");
    } catch (e) {
        console.error("Camera error:", e);
        gestureText.innerText = "Camera Blocked!";
    }
}

// -------------------------
// Gesture Detection Helper
// -------------------------
function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function isFingerUp(tip, pip) {
    return tip.y < pip.y;
}

// -------------------------
// Gesture Logic
// -------------------------
function detectGesture(lm) {
    const thumbTip = lm[4];
    const indexTip = lm[8];
    const middleTip = lm[12];
    const ringTip = lm[16];
    const pinkyTip = lm[20];

    const indexPip = lm[6];
    const middlePip = lm[10];
    const ringPip = lm[14];
    const pinkyPip = lm[18];

    const wrist = lm[0];

    const indexUp = isFingerUp(indexTip, indexPip);
    const middleUp = isFingerUp(middleTip, middlePip);
    const ringUp = isFingerUp(ringTip, ringPip);
    const pinkyUp = isFingerUp(pinkyTip, pinkyPip);

    const pinchDist = distance(thumbTip, indexTip);

    if (pinchDist < 0.04) return "Pinch";
    if (!indexUp && !middleUp && !ringUp && !pinkyUp) return "Fist";
    if (indexUp && middleUp && ringUp && pinkyUp) return "Open Palm";
    if (indexUp && !middleUp && !ringUp && !pinkyUp) return "Pointing";
    if (indexUp && middleUp && !ringUp && !pinkyUp) return "V-Sign";
    if (thumbTip.y < wrist.y - 0.05) return "Thumbs Up";

    return "Unknown";
}

// -------------------------
// MediaPipe Setup
// -------------------------
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults((results) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        gestureText.innerText = "---";
        return;
    }

    const lm = results.multiHandLandmarks[0];

    // Draw hand connections
    drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: "#00eaff", lineWidth: 3 });

    // Draw landmarks
    drawLandmarks(ctx, lm, { color: "#ff0000", radius: 3 });

    // Detect gesture
    const gesture = detectGesture(lm);
    gestureText.innerText = gesture;
});

// -------------------------
// Camera Utils Setup
// -------------------------
const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 640,
    height: 480
});

// Start
startCamera();
camera.start();






