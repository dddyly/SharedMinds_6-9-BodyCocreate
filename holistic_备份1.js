import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";
// Usage: testSupport({client?: string, os?: string}[])
// Client and os are regular expressions.
// See: https://cdn.jsdelivr.net/npm/device-detector-js@2.2.10/README.md for
// legal values for client and os

// ===== ADD PARTICLE CLASS HERE =====
class NatureParticle {
    constructor(x, y, type = 'water') {
        this.x = x;
        this.y = y;
        this.life = 1.0;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 2; // Random horizontal drift
        this.vy = (Math.random() - 0.5) * 2; // Random vertical drift
        
        if (type === 'water') {
            this.color = `rgba(100, 200, 255, ${this.life})`;
            this.size = 2;
            this.vy += 1; // Water falls down
        } else if (type === 'firefly') {
            this.color = `rgba(255, 255, 150, ${this.life})`;
            this.size = 3;
            this.vy -= 0.5; // Fireflies float up
        } else if (type === 'leaf') {
            this.color = `rgba(100, 200, 100, ${this.life})`;
            this.size = 4;
            this.vy += 0.8; // Leaves fall gently
            this.vx = Math.sin(Date.now() * 0.001) * 2; // Sway side to side
        }
    }
    
    update() {
        this.life -= 0.015; // Fade out slowly
        this.x += this.vx;
        this.y += this.vy;
        
        // Leaves sway as they fall
        if (this.type === 'leaf') {
            this.vx = Math.sin(this.y * 0.05) * 2;
        }
        
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        const alpha = Math.max(0, this.life);
        
        if (this.type === 'water') {
            // Water droplet
            ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (this.type === 'firefly') {
            // Glowing firefly
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(255, 255, 150, ${alpha})`;
            ctx.fillStyle = `rgba(255, 255, 150, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (this.type === 'leaf') {
            // Leaf shape
            ctx.fillStyle = `rgba(100, 200, 100, ${alpha * 0.7})`;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.size, this.size * 1.5, 
                       Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// Global particle array
let particles = [];
// ===== END PARTICLE CLASS =====

// Usage: testSupport({client?: string, os?: string}[])
testSupport([
    { client: 'Chrome' },
]);
// ... rest of 

testSupport([
    { client: 'Chrome' },
]);
function testSupport(supportedDevices) {
    const deviceDetector = new DeviceDetector();
    const detectedDevice = deviceDetector.parse(navigator.userAgent);
    let isSupported = false;
    for (const device of supportedDevices) {
        if (device.client !== undefined) {
            const re = new RegExp(`^${device.client}$`);
            if (!re.test(detectedDevice.client.name)) {
                continue;
            }
        }
        if (device.os !== undefined) {
            const re = new RegExp(`^${device.os}$`);
            if (!re.test(detectedDevice.os.name)) {
                continue;
            }
        }
        isSupported = true;
        break;
    }
    if (!isSupported) {
        alert(`This demo, running on ${detectedDevice.client.name}/${detectedDevice.os.name}, ` +
            `is not well supported at this time, continue at your own risk.`);
    }
}
const controls = window;
const mpHolistic = window;
const drawingUtils = window;
const config = { locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@` +
            `${mpHolistic.VERSION}/${file}`;
    } };
// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
if (spinner) {
    spinner.ontransitionend = () => {
        spinner.style.display = 'none';
    };
}
function removeElements(landmarks, elements) {
    for (const element of elements) {
        delete landmarks[element];
    }
}
function removeLandmarks(results) {
    if (results.poseLandmarks) {
        removeElements(results.poseLandmarks, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22]);
    }
}
function connect(ctx, connectors) {
    const canvas = ctx.canvas;
    for (const connector of connectors) {
        const from = connector[0];
        const to = connector[1];
        if (from && to) {
            if (from.visibility && to.visibility &&
                (from.visibility < 0.1 || to.visibility < 0.1)) {
                continue;
            }
            ctx.beginPath();
            ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
            ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
            ctx.stroke();
        }
    }
}

// ===== ADD THIS HELPER FUNCTION =====
function drawFlowingConnection(ctx, from, to, particleType = 'water') {
    if (!from || !to) return;
    
    const canvas = ctx.canvas;
    const startX = from.x * canvas.width;
    const startY = from.y * canvas.height;
    const endX = to.x * canvas.width;
    const endY = to.y * canvas.height;
    
    // Create particles along the line
    const numParticles = 3; // Fewer particles = better performance
    for (let i = 0; i < numParticles; i++) {
        const t = Math.random();
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        particles.push(new NatureParticle(x, y, particleType));
    }
    
    // Draw faint connecting line (optional)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
}
// ===== END HELPER FUNCTION =====

function onResults(results) {
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Remove landmarks we don't want to draw.
    removeLandmarks(results);
    // Draw the overlays.
    canvasCtx.save();

    // BLACK BACKGROUND - No video feed
    canvasCtx.fillStyle = '#000000';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);


    // ===== UPDATE AND DRAW PARTICLES =====
    // Remove dead particles and update living ones
    particles = particles.filter(p => p.update());
    
    // Draw all particles
    particles.forEach(p => p.draw(canvasCtx));
    
    // Keep particle count reasonable (performance optimization)
    if (particles.length > 500) {
        particles = particles.slice(-500);
    }
    // ===== END PARTICLE UPDATE =====

    // Connect elbows to hands. Do this first so that the other graphics will draw
    // on top of these marks.
    canvasCtx.lineWidth = 5;
    if (results.poseLandmarks) {
        if (results.rightHandLandmarks) {
            canvasCtx.strokeStyle = 'white';
            connect(canvasCtx, [[
                    results.poseLandmarks[mpHolistic.POSE_LANDMARKS.RIGHT_ELBOW],
                    results.rightHandLandmarks[0]
                ]]);
        }
        if (results.leftHandLandmarks) {
            canvasCtx.strokeStyle = 'white';
            connect(canvasCtx, [[
                    results.poseLandmarks[mpHolistic.POSE_LANDMARKS.LEFT_ELBOW],
                    results.leftHandLandmarks[0]
                ]]);
        }
    }
    // Pose - just the connections, no landmark dots
    drawingUtils.drawConnectors(canvasCtx, results.poseLandmarks, mpHolistic.POSE_CONNECTIONS, { color: 'white' });

// Define custom connections - only middle finger
const CUSTOM_HAND_CONNECTIONS = [
    [0, 9],    // Wrist to middle finger base
    [9, 10],   // Middle finger: base to first joint
    [10, 11],  // Middle finger: first to second joint
    [11, 12]   // Middle finger: second joint to tip
];

// Use your custom connections instead
drawingUtils.drawConnectors(canvasCtx, results.rightHandLandmarks, 
    CUSTOM_HAND_CONNECTIONS, { color: 'white' });
drawingUtils.drawConnectors(canvasCtx, results.leftHandLandmarks, 
    CUSTOM_HAND_CONNECTIONS, { color: 'white' });
    // Face - only eyes, nose, and mouth
    drawingUtils.drawConnectors(canvasCtx, results.faceLandmarks, mpHolistic.FACEMESH_LEFT_EYE, { color: 'white', lineWidth: 2 });
    drawingUtils.drawConnectors(canvasCtx, results.faceLandmarks, mpHolistic.FACEMESH_RIGHT_EYE, { color: 'white', lineWidth: 2 });
    drawingUtils.drawConnectors(canvasCtx, results.faceLandmarks, mpHolistic.FACEMESH_LEFT_EYEBROW, { color: 'white', lineWidth: 2 });
    drawingUtils.drawConnectors(canvasCtx, results.faceLandmarks, mpHolistic.FACEMESH_RIGHT_EYEBROW, { color: 'white', lineWidth: 2 });
    // Note: MediaPipe doesn't have a separate nose contour constant, but nose is included in face irises
    drawingUtils.drawConnectors(canvasCtx, results.faceLandmarks, mpHolistic.FACEMESH_LIPS, { color: 'white', lineWidth: 2 });
    canvasCtx.restore();
}
const holistic = new mpHolistic.Holistic(config);
holistic.setOptions({
    selfieMode: true,
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
});
holistic.onResults(onResults);

// Initialize camera
const camera = new controls.Camera(videoElement, {
    onFrame: async () => {
        await holistic.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});
camera.start();