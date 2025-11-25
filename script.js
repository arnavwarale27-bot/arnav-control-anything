const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gestureText = document.getElementById("gestureText");

// Start Camera
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();
    } catch (err) {
        console.error("Camera error:", err);
        gestureText.innerText = "Camera Blocked!";
    }
}

// Distance helper
function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Finger up/down helper
function isFingerUp(tip, pip) {
    return tip.y < pip.y;
}

// Gesture Detection Logic
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

    const pinchDist = distance(thumbTip, indexTip);

    if (pinchDist < 0.04) return "Pinch";
    if (!indexUp && !middleUp && !ringUp && !pinkyUp) return "Fist";
    if (indexUp && middleUp && ringUp && pinkyUp) return "Open Palm";
    if (indexUp && !middleUp && !ringUp && !pinkyUp) return "Point";
    if (indexUp && middleUp && !ringUp && !pinkyUp) return "V Sign";
    if (thumbTip.y < wrist.y - 0.05 && !indexUp && !middleUp && !ringUp && !pinkyUp)
        return "Thumbs Up";

    return "Unknown";
}

// Load MediaPipe Hands using CDN
const hands = new Hands({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

hands.onResults(results => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (!results.multiHandLandmarks) {
        gestureText.innerText = "---";
        return;
    }

    const lm = results.multiHandLandmarks[0];

    drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: "#00eaff", lineWidth: 2 });
    drawLandmarks(ctx, lm, { color: "#ff0000", lineWidth: 1 });

    gestureText.innerText = detectGesture(lm);
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





