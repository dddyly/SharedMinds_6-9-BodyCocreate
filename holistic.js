import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";

// ===== FIREBASE AUTHENTICATION =====
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    setPersistence,
    browserSessionPersistence,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getDatabase,
    ref,
    push,
    onValue,
    set,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase configuration - REPLACE WITH YOUR OWN CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBgTC88BIaZn1tTOr6E3-yoes_XyaLp_RE",
  authDomain: "fbproject-2-yl.firebaseapp.com",
  projectId: "fbproject-2-yl",
  storageBucket: "fbproject-2-yl.firebasestorage.app",
  messagingSenderId: "48841954039",
  appId: "1:48841954039:web:e4e3ff4fb1be8ad55f79f2",
  measurementId: "G-YB6HWM3FR8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const googleAuthProvider = new GoogleAuthProvider();

// Set authentication persistence
setPersistence(auth, browserSessionPersistence)
    .then(() => {
        console.log('Auth persistence set to session');
    })
    .catch((error) => {
        console.error('Error setting persistence:', error);
    });

// Current user state
let currentUser = null;

// Subscribe to authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log('User signed in:', user.displayName || user.email);

        // Update UI to show user info
        updateAuthUI(true, user);
    } else {
        currentUser = null;
        console.log('User signed out');

        // Update UI to show sign-in button
        updateAuthUI(false);
    }
});

// Function to update authentication UI
function updateAuthUI(isSignedIn, user = null) {
    const landingPage = document.getElementById('landingPage');
    const appContainer = document.getElementById('appContainer');
    const userContainer = document.getElementById('userContainer');
    const userInfo = document.getElementById('userInfo');

    if (isSignedIn && user) {
        // Hide landing page
        landingPage.classList.add('hidden');

        // Show main app
        appContainer.classList.add('visible');

        // Show user info
        userContainer.classList.remove('hidden');
        userInfo.textContent = `${user.displayName || user.email}`;
    } else {
        // Show landing page
        landingPage.classList.remove('hidden');

        // Hide main app
        appContainer.classList.remove('visible');

        // Hide user info
        userContainer.classList.add('hidden');
        userInfo.textContent = '';
    }
}

// Function to sign in with Google
async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleAuthProvider);
        const user = result.user;
        console.log('Successfully signed in:', user.displayName);
        return user;
    } catch (error) {
        console.error('Error signing in:', error.message);
        throw error;
    }
}

// Function to sign out
async function signOutUser() {
    try {
        await signOut(auth);
        console.log('Successfully signed out');
    } catch (error) {
        console.error('Error signing out:', error.message);
        throw error;
    }
}

// Function to subscribe to data
function subscribeToData(dataPath) {
    const dataRef = ref(database, dataPath);
    onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        console.log(`Data from ${dataPath}:`, data);
        // Handle the data here
        if (data) {
            handleIncomingData(data);
        }
    });
}

// Function to write text data to Firebase
function writeTextToDatabase(text) {
    if (!currentUser) {
        console.warn('User must be signed in to write data');
        return;
    }

    const textsRef = ref(database, 'texts');
    const newTextRef = push(textsRef);

    set(newTextRef, {
        text: text,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        timestamp: serverTimestamp()
    }).then(() => {
        console.log('Text written to database:', text);
    }).catch((error) => {
        console.error('Error writing to database:', error);
    });
}

// Function to handle incoming data from Firebase
function handleIncomingData(data) {
    // Process the data received from Firebase
    // You can update your visualization or text display here
    console.log('Handling incoming data:', data);
}

// Start subscribing to texts data
subscribeToData('texts');

// Make functions available globally (if needed in console or other scripts)
window.signInWithGoogle = signInWithGoogle;
window.signOutUser = signOutUser;
window.writeTextToDatabase = writeTextToDatabase;

// ===== END FIREBASE AUTHENTICATION =====

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

// ===== TEXT SEGMENT MANAGEMENT =====
// Store words with their segment positions and timestamps
let textSegments = [];
let lastProcessedText = '';
const SEGMENT_LIFETIME = 45000; // 45 seconds in milliseconds
const NUM_SEGMENTS = 30; // Number of positions along the arm path
// ===== END TEXT SEGMENT MANAGEMENT =====

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
    
    let lastSavedText = '';

    recognition.onresult = function(event) {
        let fullTranscript = '';
        for (let r = 0; r < event.results.length; r++) {
            fullTranscript += event.results[r][0].transcript;
        }
        spokenText = fullTranscript;
        console.log('🎤 You said:', spokenText);

        // Save to Firebase when speech recognition finalizes (optional)
        // Only save if result is final and text has changed
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal && spokenText !== lastSavedText && currentUser) {
            writeTextToDatabase(spokenText);
            lastSavedText = spokenText;
        }
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

// ===== HELPER FUNCTION TO CALCULATE ARM PATH SEGMENTS =====
function calculateArmSegments(leftWrist, leftElbow, leftShoulder, rightShoulder, rightElbow, rightWrist, canvas) {
    const pathPoints = [];

    if (leftWrist) pathPoints.push({ x: leftWrist.x * canvas.width, y: leftWrist.y * canvas.height });
    if (leftElbow) pathPoints.push({ x: leftElbow.x * canvas.width, y: leftElbow.y * canvas.height });
    if (leftShoulder) pathPoints.push({ x: leftShoulder.x * canvas.width, y: leftShoulder.y * canvas.height });
    if (rightShoulder) pathPoints.push({ x: rightShoulder.x * canvas.width, y: rightShoulder.y * canvas.height });
    if (rightElbow) pathPoints.push({ x: rightElbow.x * canvas.width, y: rightElbow.y * canvas.height });
    if (rightWrist) pathPoints.push({ x: rightWrist.x * canvas.width, y: rightWrist.y * canvas.height });

    if (pathPoints.length < 2) return [];

    // Calculate total path length
    let totalLength = 0;
    const lengths = [];
    for (let i = 0; i < pathPoints.length - 1; i++) {
        const dx = pathPoints[i + 1].x - pathPoints[i].x;
        const dy = pathPoints[i + 1].y - pathPoints[i].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        lengths.push(len);
        totalLength += len;
    }

    // Create evenly spaced segments along the path
    const segments = [];
    const segmentSpacing = totalLength / NUM_SEGMENTS;

    let accumulatedDistance = 0;
    let pathIndex = 0;
    let segmentIndex = 0;

    while (segmentIndex < NUM_SEGMENTS && pathIndex < pathPoints.length - 1) {
        const targetDistance = segmentIndex * segmentSpacing;
        const segmentStart = pathPoints[pathIndex];
        const segmentEnd = pathPoints[pathIndex + 1];
        const segmentLength = lengths[pathIndex];

        if (targetDistance >= accumulatedDistance && targetDistance < accumulatedDistance + segmentLength) {
            const localDistance = targetDistance - accumulatedDistance;
            const t = localDistance / segmentLength;
            const dx = segmentEnd.x - segmentStart.x;
            const dy = segmentEnd.y - segmentStart.y;
            const x = segmentStart.x + dx * t;
            const y = segmentStart.y + dy * t;

            // Text angle is always 0 (horizontal, parallel to ground)
            const textAngle = 0;

            segments.push({ x, y, angle: textAngle, index: segmentIndex });
            segmentIndex++;
        } else {
            accumulatedDistance += segmentLength;
            pathIndex++;
        }
    }

    return segments;
}

// ===== PROCESS NEW SPOKEN WORDS =====
function processSpokenWords(text) {
    if (!text || text === lastProcessedText) return;

    const words = text.split(' ').filter(w => w.length > 0);
    const newWords = [];

    // Extract only the new words that weren't in the last processed text
    if (lastProcessedText) {
        const lastWords = lastProcessedText.split(' ');
        const startIndex = lastWords.length;
        for (let i = startIndex; i < words.length; i++) {
            newWords.push(words[i]);
        }
    } else {
        newWords.push(...words);
    }

    // Add new words to textSegments
    const now = Date.now();
    for (const word of newWords) {
        // Find the first available segment (starting from left)
        let segmentIndex = 0;
        let foundSlot = false;

        while (segmentIndex < NUM_SEGMENTS && !foundSlot) {
            const occupied = textSegments.some(seg => seg.segmentIndex === segmentIndex);
            if (!occupied) {
                textSegments.push({
                    word: word,
                    segmentIndex: segmentIndex,
                    timestamp: now
                });
                foundSlot = true;
            }
            segmentIndex++;
        }
    }

    lastProcessedText = text;
}

// ===== DRAW TEXT SEGMENTS =====
function drawTextSegments(ctx, segments) {
    if (!segments || segments.length === 0) return;

    const now = Date.now();

    // Remove expired text segments
    textSegments = textSegments.filter(seg => now - seg.timestamp < SEGMENT_LIFETIME);

    // Draw each active text segment
    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

    for (const textSeg of textSegments) {
        const segment = segments[textSeg.segmentIndex];
        if (!segment) continue;

        // Calculate fade out effect in last 5 seconds
        const age = now - textSeg.timestamp;
        let alpha = 0.9;
        if (age > SEGMENT_LIFETIME - 5000) {
            alpha = 0.9 * (SEGMENT_LIFETIME - age) / 5000;
        }

        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.translate(segment.x, segment.y);
        ctx.rotate(segment.angle);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(textSeg.word, 0, 0);
        ctx.restore();
    }
}
// ===== END HELPER FUNCTIONS =====

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
        console.log(results);
        if (results.rightHandLandmarks) {
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            connect(canvasCtx, [[
                results.poseLandmarks[mpHolistic.POSE_LANDMARKS.RIGHT_ELBOW],
                results.rightHandLandmarks[0]
            ]]);
        }

        if (results.leftHandLandmarks) {
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            connect(canvasCtx, [[
                results.poseLandmarks[mpHolistic.POSE_LANDMARKS.LEFT_ELBOW],
                results.leftHandLandmarks[0]
            ]]);
        }

        // Process new spoken words and draw text segments along arm path
        if (results.leftHandLandmarks && results.rightHandLandmarks) {
            const leftWrist = results.leftHandLandmarks[0];
            const leftElbow = results.poseLandmarks[mpHolistic.POSE_LANDMARKS.LEFT_ELBOW];
            const leftShoulder = results.poseLandmarks[mpHolistic.POSE_LANDMARKS.LEFT_SHOULDER];
            const rightShoulder = results.poseLandmarks[mpHolistic.POSE_LANDMARKS.RIGHT_SHOULDER];
            const rightElbow = results.poseLandmarks[mpHolistic.POSE_LANDMARKS.RIGHT_ELBOW];
            const rightWrist = results.rightHandLandmarks[0];

            // Calculate segment positions along the arm
            const segments = calculateArmSegments(
                leftWrist, leftElbow, leftShoulder,
                rightShoulder, rightElbow, rightWrist,
                canvasElement
            );

            // Process new words from speech recognition
            processSpokenWords(spokenText);

            // Draw all active text segments
            drawTextSegments(canvasCtx, segments);
        }
    }




    
    // Draw pose skeleton
    drawingUtils.drawConnectors(canvasCtx, results.poseLandmarks,
        mpHolistic.POSE_CONNECTIONS, { color: 'rgba(255, 255, 255, 0.5)' });

    // Define custom hand connections - only middle finger
    const CUSTOM_HAND_CONNECTIONS = [
        [0, 9],    // Wrist to middle finger base
        [9, 10],   // Middle finger: base to first joint
        [10, 11],  // Middle finger: first to second joint
        [11, 12]   // Middle finger: second joint to tip
    ];

    // Draw custom hand connections
    drawingUtils.drawConnectors(canvasCtx, results.rightHandLandmarks, 
        CUSTOM_HAND_CONNECTIONS, { color: 'rgba(255, 255, 255, 0.5)'  });
    drawingUtils.drawConnectors(canvasCtx, results.leftHandLandmarks, 
        CUSTOM_HAND_CONNECTIONS, { color: 'rgba(255, 255, 255, 0.5)'  });
    
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

// ===== AUTHENTICATION BUTTON EVENT LISTENERS =====
// Add event listeners once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {


    
    const landingSignInBtn = document.getElementById('landingSignInBtn');
    const signOutBtn = document.getElementById('signOutBtn');

    if (landingSignInBtn) {
        landingSignInBtn.addEventListener('click', async () => {
            try {
                landingSignInBtn.textContent = 'Signing in...';
                landingSignInBtn.disabled = true;
                await signInWithGoogle();
                landingSignInBtn.textContent = 'Sign In with Google';
                landingSignInBtn.disabled = false;
            } catch (error) {
                alert('Failed to sign in: ' + error.message);
                landingSignInBtn.textContent = 'Sign In with Google';
                landingSignInBtn.disabled = false;
            }
        });
    }

    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            try {
                await signOutUser();
            } catch (error) {
                alert('Failed to sign out: ' + error.message);
            }
        });
    }
});
// ===== END AUTHENTICATION BUTTON EVENT LISTENERS =====