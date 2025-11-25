const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gestureText = document.getElementById("gestureText");

// Start camera
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        video.onloadedmetadata = () => {
            video.play();
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        };
    } catch (err) {
        gestureText.innerText = "Camera Blocked!";
    }
}

// Gesture detection
function detectGesture(lm) {
    if (!lm) return "No Hand";

    const thumb = lm[4];
    const index = lm[8];
    const wrist = lm[0];

    const dist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
    if (dist < 0.05) return "Pinch";

    if (thumb.y < wrist.y - 0.1) return "Thumbs Up";

    return "Hand Detected";
}

// MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults((results) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiHandLandmarks) {
        gestureText.innerText = "---";
        return;
    }

    const lm = results.multiHandLandmarks[0];
    drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: "#00eaff", lineWidth: 2 });
    drawLandmarks(ctx, lm, { color: "red", lineWidth: 1 });

    const gesture = detectGesture(lm);
    gestureText.innerText = gesture;
});

// Camera loop
async function processFrame() {
    await hands.send({ image: video });
    requestAnimationFrame(processFrame);
}

startCamera();
video.addEventListener("playing", processFrame);






