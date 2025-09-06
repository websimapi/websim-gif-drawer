// --- DOM Elements ---
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const colorPicker = document.getElementById('color-picker');
const brushSize = document.getElementById('brush-size');
const eraserTool = document.getElementById('eraser-tool');
const clearFrameBtn = document.getElementById('clear-frame');

const prevFrameBtn = document.getElementById('prev-frame');
const nextFrameBtn = document.getElementById('next-frame');
const addFrameBtn = document.getElementById('add-frame');
const frameCounter = document.getElementById('frame-counter');

const frameDelayInput = document.getElementById('frame-delay');
const generateGifBtn = document.getElementById('generate-gif');
const gifOutput = document.getElementById('gif-output');
const gifPreview = document.getElementById('gif-preview');
const downloadLink = document.getElementById('download-link');

// --- State ---
let isDrawing = false;
let isErasing = false;
let lastX = 0;
let lastY = 0;

let frames = [];
let currentFrame = 0;

// --- Canvas Setup ---
function initializeCanvas() {
    const container = document.getElementById('canvas-container');
    const aspectRatio = 16 / 9;
    canvas.width = container.clientWidth;
    canvas.height = container.clientWidth / aspectRatio;

    // Add initial blank frame
    addFrame();
    loadFrame(0);

    // Disable buttons initially
    updateNavButtons();
}

function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --- Drawing Logic ---
function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const coords = getCoords(e);
    [lastX, lastY] = [coords.x, coords.y];
}

function draw(e) {
    e.preventDefault();
    if (!isDrawing) return;

    const coords = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(coords.x, coords.y);

    ctx.strokeStyle = isErasing ? 'white' : colorPicker.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.stroke();

    [lastX, lastY] = [coords.x, coords.y];
}

function stopDrawing() {
    if (isDrawing) {
        saveCurrentFrame();
    }
    isDrawing = false;
}

// --- Frame Management ---
function saveCurrentFrame() {
    frames[currentFrame] = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function loadFrame(index) {
    if (frames[index]) {
        ctx.putImageData(frames[index], 0, 0);
    } else {
        clearCanvas();
    }
    currentFrame = index;
    updateUI();
}

function addFrame() {
    saveCurrentFrame();
    const newFrameData = ctx.createImageData(canvas.width, canvas.height);
    // Fill new frame with white
    const data = newFrameData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
    }
    frames.splice(currentFrame + 1, 0, newFrameData);
    loadFrame(currentFrame + 1);
}

function prevFrame() {
    if (currentFrame > 0) {
        saveCurrentFrame();
        loadFrame(currentFrame - 1);
    }
}

function nextFrame() {
    if (currentFrame < frames.length - 1) {
        saveCurrentFrame();
        loadFrame(currentFrame + 1);
    }
}

// --- UI Updates ---
function updateUI() {
    updateFrameCounter();
    updateNavButtons();
}

function updateFrameCounter() {
    frameCounter.textContent = `Frame ${currentFrame + 1} / ${frames.length}`;
}

function updateNavButtons() {
    prevFrameBtn.disabled = currentFrame === 0;
    nextFrameBtn.disabled = currentFrame === frames.length - 1;
}

function toggleEraser() {
    isErasing = !isErasing;
    eraserTool.classList.toggle('active', isErasing);
}

// --- GIF Generation ---
function generateGif() {
    generateGifBtn.textContent = 'Generating...';
    generateGifBtn.disabled = true;

    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
    });
    
    // Final save before render
    saveCurrentFrame();
    
    const delay = parseInt(frameDelayInput.value, 10);

    frames.forEach(frameData => {
        gif.addFrame(frameData, { delay: delay });
    });

    gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        gifPreview.src = url;
        downloadLink.href = url;
        gifOutput.classList.remove('hidden');
        
        generateGifBtn.textContent = 'Generate GIF';
        generateGifBtn.disabled = false;
    });

    gif.render();
}


// --- Event Listeners ---
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

eraserTool.addEventListener('click', toggleEraser);
clearFrameBtn.addEventListener('click', () => {
    clearCanvas();
    saveCurrentFrame();
});

addFrameBtn.addEventListener('click', addFrame);
prevFrameBtn.addEventListener('click', prevFrame);
nextFrameBtn.addEventListener('click', nextFrame);

generateGifBtn.addEventListener('click', generateGif);

// --- Initialization ---
window.addEventListener('load', initializeCanvas);