const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const gestureText = document.getElementById("gestureText");

// Start Camera
async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
}

// Distance helper
function distance(a, b) {
    return Math.sqrt(
        (a.x - b.x) ** 2 +
        (a.y - b.y) ** 2
    );
}

// Finger up/down helper
function isFingerUp(tip, pip) {
    return tip.y < pip.y; // on camera: smaller y = higher
}

// Gesture Detection Logic
function detectGesture(landmarks) {

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

    // Finger States
    const indexUp = isFingerUp(indexTip, indexPip);
    const middleUp = isFingerUp(middleTip, middlePip);
    const ringUp = isFingerUp(ringTip, ringPip);
    const pinkyUp = isFingerUp(pinkyTip, pinkyPip);

    const pinchDist = distance(thumbTip, indexTip);

    // Pinch Gesture
    if (pinchDist < 0.04) return "Pinch";

    // Fist (all fingers down)
    if (!indexUp && !middleUp && !ringUp && !pinkyUp) return "Fist";

    // Open Palm
    if (indexUp && middleUp && ringUp && pinkyUp) return "Open Palm";

    // One Finger Pointing
    if (indexUp && !middleUp && !ringUp && !pinkyUp) return "Pointing";

    // V Sign (2 fingers)
    if (indexUp && middleUp && !ringUp && !pinkyUp) return "V-Sign";

    // Thumbs Up (thumb above wrist)
    if (thumbTip.y < wrist.y - 0.05 && !indexUp && !middleUp && !ringUp && !pinkyUp) {
        return "Thumbs Up";
    }

    return "Unknown";
}

// MediaPipe Hands Setup
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

hands.onResults((results) => {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (!results.multiHandLandmarks) {
        gestureText.innerText = "---";
        return;
    }

    const lm = results.multiHandLandmarks[0];

    drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: "#00eaff", lineWidth: 2 });
    drawLandmarks(ctx, lm, { color: "#ff0000", lineWidth: 1 });

    const gesture = detectGesture(lm);
    gestureText.innerText = gesture;
});

const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 640,
    height: 480
});

startCamera();
camera.start();

