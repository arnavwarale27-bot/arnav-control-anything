// Select video and canvas
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const gestureBox = document.getElementById("gestureBox");

// Start camera
async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
}

// Setup MediaPipe Hands
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

    // Draw the video image
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // If no hand detected
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        gestureBox.innerText = "Gesture: No Hand";
        return;
    }

    const landmarks = results.multiHandLandmarks[0];

    // Draw landmarks on screen
    drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: "#00eaff", lineWidth: 2 });
    drawLandmarks(ctx, landmarks, { color: "#ff0000", lineWidth: 1 });

    // TEMP gesture (just showing index finger tip coords)
    const indexTip = landmarks[8];
    gestureBox.innerText = "Gesture: Hand Detected";
});

// Setup camera loop
const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 640,
    height: 480
});

startCamera();
camera.start();
