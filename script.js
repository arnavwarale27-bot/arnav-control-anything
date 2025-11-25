// Get elements
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 480;

const gestureText = document.getElementById("gestureText");

// ⭐ FIXED CAMERA FUNCTION
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 640,
                height: 480,
                facingMode: "user"
            }
        });

        video.srcObject = stream;
        await video.play().catch(e => console.log("Autoplay blocked:", e));

        console.log("Camera started!");
    } catch (err) {
        console.error("Camera Error:", err);
        alert("Camera blocked! Please allow camera in browser settings.");
    }
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function isFingerUp(tip, pip) {
    return tip.y < pip.y;
}

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

    if (distance(thumbTip, indexTip) < 0.04) return "Pinch";

    if (!indexUp && !middleUp && !ringUp && !pinkyUp) return "Fist";

    if (indexUp && middleUp && ringUp && pinkyUp) return "Open Palm";

    if (indexUp && !middleUp && !ringUp && !pinkyUp) return "Pointing";

    if (indexUp && middleUp && !ringUp && !pinkyUp) return "V-Sign";

    if (thumbTip.y < wrist.y - 0.05) return "Thumbs Up";

    return "Unknown";
}

// ⭐ NEON CURSOR
let neon = document.createElement("div");
neon.style.position = "fixed";
neon.style.width = "20px";
neon.style.height = "20px";
neon.style.borderRadius = "50%";
neon.style.background = "#00eaff";
neon.style.boxShadow = "0 0 15px #00eaff";
neon.style.pointerEvents = "none";
neon.style.zIndex = "9999";
document.body.appendChild(neon);

// ⭐ MediaPipe Setup
const hands = new Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`
});

hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

hands.onResults(results => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.image)
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (!results.multiHandLandmarks) {
        gestureText.innerText = "---";
        return;
    }

    const lm = results.multiHandLandmarks[0];

    drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: "#00eaff", lineWidth: 2 });
    drawLandmarks(ctx, lm, { color: "#ff0066", lineWidth: 1 });

    const gesture = detectGesture(lm);
    gestureText.innerText = gesture;

    const indexTip = lm[8];
    const x = indexTip.x * canvas.width;
    const y = indexTip.y * canvas.height;

    const rect = canvas.getBoundingClientRect();
    neon.style.left = rect.left + x + "px";
    neon.style.top = rect.top + y + "px";
});

// ⭐ Camera Loop
const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 640,
    height: 480
});

// ⭐ Start Everything
startCamera().then(() => camera.start());



