import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";

// ===== PARTICLE CLASS =====
class NatureParticle {
    constructor(x, y, type = 'water') {
        this.x = x;
        this.y = y;
        this.life = 1.0;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        
        if (type === 'water') {
            this.color = `rgba(100, 200, 255, ${this.life})`;
            this.size = 2;
            this.vy += 1;
        } else if (type === 'firefly') {
            this.color = `rgba(255, 255, 150, ${this.life})`;
            this.size = 3;
            this.vy -= 0.5;
        } else if (type === 'leaf') {
            this.color = `rgba(100, 200, 100, ${this.life})`;
            this.size = 4;
            this.vy += 0.8;
            this.vx = Math.sin(Date.now() * 0.001) * 2;
        }
    }
    
    update() {
        this.life -= 0.015;
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.type === 'leaf') {
            this.vx = Math.sin(this.y * 0.05) * 2;
        }
        
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        const alpha = Math.max(0, this.life);
        
        if (this.type === 'water') {
            ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (this.type === 'firefly') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(255, 255, 150, ${alpha})`;
            ctx.fillStyle = `rgba(255, 255, 150, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (this.type === 'leaf') {
            ctx.fillStyle = `rgba(100, 200, 100, ${alpha * 0.7})`;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.size, this.size * 1.5, 
                       Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

let particles = [];
// ===== END PARTICLE CLASS =====

// ===== SPEECH RECOGNITION =====
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;

// ✅ DECLARE THESE OUTSIDE THE IF BLOCK SO THEY'RE ACCESSIBLE EVERYWHERE
let spokenText = '';
let lastSpokenText = '';
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    recognition.onresult = function(event) {
        let fullTranscript = '';
        for (let r = 0; r < event.results.length; r++) {
            fullTranscript += event.results[r][0].transcript;
        }
        spokenText = fullTranscript;
        console.log('🎤 You said:', spokenText);
    };
    
    recognition.onend = function() {
        console.log('Speech recognition ended, restarting...');
        try {
            recognition.start();
        } catch (e) {
            console.log('Could not restart:', e);
        }
    };
    
    recognition.onerror = function(event) {
        console.error('❌ Speech error:', event.error);
        if (event.error === 'not-allowed') {
            alert('Please allow microphone access!');
        }
    };
    
    try {
        recognition.start();
        console.log('✅ Speech recognition started! Speak into your microphone.');
    } catch (e) {
        console.error('Could not start speech recognition:', e);
    }
} else {
    console.warn('⚠️ Speech recognition not supported in this browser. Use Chrome!');
    spokenText = 'Speech not supported';
}
// ===== END SPEECH RECOGNITION =====

// ===== DEVICE DETECTION =====
testSupport([{ client: 'Chrome' }]);

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

// ===== SETUP =====
const controls = window;
const mpHolistic = window;
const drawingUtils = window;
const config = { 
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@${mpHolistic.VERSION}/${file}`;
    } 
};

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

const spinner = document.querySelector('.loading');
if (spinner) {
    spinner.ontransitionend = () => {
        spinner.style.display = 'none';
    };
}

// ===== HELPER FUNCTIONS =====
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

function drawFlowingConnection(ctx, from, to, particleType = 'water') {
    if (!from || !to) return;
    
    const canvas = ctx.canvas;
    const startX = from.x * canvas.width;
    const startY = from.y * canvas.height;
    const endX = to.x * canvas.width;
    const endY = to.y * canvas.height;
    
    const numParticles = 3;
    for (let i = 0; i < numParticles; i++) {
        const t = Math.random();
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        particles.push(new NatureParticle(x, y, particleType));
    }
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
}

// ===== HELPER FUNCTION TO DRAW TEXT ALONG ARM PATH =====
function drawTextAlongArmPath(ctx, text, leftWrist, leftElbow, leftShoulder, rightShoulder, rightElbow, rightWrist) {
    if (!text || !leftWrist || !rightWrist) return;

    const canvas = ctx.canvas;

    // Create path points from left wrist to right wrist
    const pathPoints = [];

    if (leftWrist) pathPoints.push({ x: leftWrist.x * canvas.width, y: leftWrist.y * canvas.height });
    if (leftElbow) pathPoints.push({ x: leftElbow.x * canvas.width, y: leftElbow.y * canvas.height });
    if (leftShoulder) pathPoints.push({ x: leftShoulder.x * canvas.width, y: leftShoulder.y * canvas.height });
    if (rightShoulder) pathPoints.push({ x: rightShoulder.x * canvas.width, y: rightShoulder.y * canvas.height });
    if (rightElbow) pathPoints.push({ x: rightElbow.x * canvas.width, y: rightElbow.y * canvas.height });
    if (rightWrist) pathPoints.push({ x: rightWrist.x * canvas.width, y: rightWrist.y * canvas.height });

    if (pathPoints.length < 2) return;

    // Calculate total path length
    let totalLength = 0;
    for (let i = 0; i < pathPoints.length - 1; i++) {
        const dx = pathPoints[i + 1].x - pathPoints[i].x;
        const dy = pathPoints[i + 1].y - pathPoints[i].y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
    }

    // Split text into words
    const words = text.split(' ');
    const wordSpacing = totalLength / Math.max(words.length, 1);

    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

    let currentDistance = 0;
    let wordIndex = 0;

    // Draw each word along the path
    for (let i = 0; i < pathPoints.length - 1 && wordIndex < words.length; i++) {
        const segmentStart = pathPoints[i];
        const segmentEnd = pathPoints[i + 1];
        const dx = segmentEnd.x - segmentStart.x;
        const dy = segmentEnd.y - segmentStart.y;
        const segmentLength = Math.sqrt(dx * dx + dy * dy);

        // Place words along this segment
        while (currentDistance < segmentLength && wordIndex < words.length) {
            const t = currentDistance / segmentLength;
            const x = segmentStart.x + dx * t;
            const y = segmentStart.y + dy * t;

            // Calculate angle for text rotation (perpendicular to arm - pointing inward)
            const angle = Math.atan2(dy, dx) + Math.PI / 2; // Add 90 degrees to make it perpendicular

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(words[wordIndex], 0, 0); // Draw at the path position
            ctx.restore();

            wordIndex++;
            currentDistance += wordSpacing;
        }

        currentDistance -= segmentLength;
    }
}
// ===== END HELPER FUNCTION =====

// ===== MAIN DRAWING FUNCTION =====
function onResults(results) {
    document.body.classList.add('loaded');
    removeLandmarks(results);
    
    canvasCtx.save();

    // Black background
    canvasCtx.fillStyle = '#000000';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // ===== DISPLAY SPOKEN TEXT =====
    if (spokenText) {
        canvasCtx.fillStyle = 'white';
        canvasCtx.font = 'bold 32px Arial';
        canvasCtx.textAlign = 'center';
        canvasCtx.shadowBlur = 10;
        canvasCtx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        canvasCtx.fillText(spokenText, canvasElement.width / 2, 50);
        canvasCtx.shadowBlur = 0;
    }
    
    // Instructions
    canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    canvasCtx.font = '18px Arial';
    canvasCtx.textAlign = 'left';
    canvasCtx.fillText('🎤 Speak to see your words!', 20, canvasElement.height - 20);
    // ===== END TEXT DISPLAY =====

    // ===== UPDATE AND DRAW PARTICLES =====
    particles = particles.filter(p => p.update());
    particles.forEach(p => p.draw(canvasCtx));
    
    if (particles.length > 500) {
        particles = particles.slice(-500);
    }
    // ===== END PARTICLE UPDATE =====

    // ===== SPEECH-TRIGGERED EFFECTS =====
    if (spokenText !== lastSpokenText && spokenText.length > 0) {
        console.log('💬 New words detected:', spokenText);
        
        if (results.poseLandmarks) {
            if (results.rightHandLandmarks) {
                const finger = results.rightHandLandmarks[12];
                for (let i = 0; i < 30; i++) {
                    particles.push(new NatureParticle(
                        finger.x * canvasElement.width,
                        finger.y * canvasElement.height,
                        'firefly'
                    ));
                }
            }
            
            if (results.leftHandLandmarks) {
                const finger = results.leftHandLandmarks[12];
                for (let i = 0; i < 30; i++) {
                    particles.push(new NatureParticle(
                        finger.x * canvasElement.width,
                        finger.y * canvasElement.height,
                        'firefly'
                    ));
                }
            }
        }
        
        lastSpokenText = spokenText;
    }
    // ===== END SPEECH EFFECTS =====

    // Connect elbows to hands
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

        // Draw text flowing along arms from left wrist to right wrist
        if (spokenText && results.leftHandLandmarks && results.rightHandLandmarks) {
            const leftWrist = results.leftHandLandmarks[0];
            const leftElbow = results.poseLandmarks[mpHolistic.POSE_LANDMARKS.LEFT_ELBOW];
            const leftShoulder = results.poseLandmarks[mpHolistic.POSE_LANDMARKS.LEFT_SHOULDER];
            const rightShoulder = results.poseLandmarks[mpHolistic.POSE_LANDMARKS.RIGHT_SHOULDER];
            const rightElbow = results.poseLandmarks[mpHolistic.POSE_LANDMARKS.RIGHT_ELBOW];
            const rightWrist = results.rightHandLandmarks[0];

            drawTextAlongArmPath(canvasCtx, spokenText, leftWrist, leftElbow, leftShoulder, rightShoulder, rightElbow, rightWrist);
        }
    }
    
    // Draw pose skeleton
    drawingUtils.drawConnectors(canvasCtx, results.poseLandmarks, 
        mpHolistic.POSE_CONNECTIONS, { color: 'white' });

    // Define custom hand connections - only middle finger
    const CUSTOM_HAND_CONNECTIONS = [
        [0, 9],    // Wrist to middle finger base
        [9, 10],   // Middle finger: base to first joint
        [10, 11],  // Middle finger: first to second joint
        [11, 12]   // Middle finger: second joint to tip
    ];

    // Draw custom hand connections
    drawingUtils.drawConnectors(canvasCtx, results.rightHandLandmarks, 
        CUSTOM_HAND_CONNECTIONS, { color: 'white' });
    drawingUtils.drawConnectors(canvasCtx, results.leftHandLandmarks, 
        CUSTOM_HAND_CONNECTIONS, { color: 'white' });
    
    // Face mesh hidden - only showing arms and body
    
    canvasCtx.restore();
}

// ===== INITIALIZATION =====
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

const camera = new controls.Camera(videoElement, {
    onFrame: async () => {
        await holistic.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});
camera.start();