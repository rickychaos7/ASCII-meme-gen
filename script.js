const imageInput = document.getElementById('imageInput');
const startCameraBtn = document.getElementById('startCamera');
const takePhotoBtn = document.getElementById('takePhoto');
const cameraFeed = document.getElementById('cameraFeed');
const canvas = document.getElementById('hiddenCanvas');
const ctx = canvas.getContext('2d');
const asciiOutput = document.getElementById('asciiOutput');
const asciiWidthInput = document.getElementById('asciiWidth');
const asciiWidthValue = document.getElementById('asciiWidthValue');
const contrastInput = document.getElementById('contrastLevel');
const contrastValue = document.getElementById('contrastValue');
const copyAsciiBtn = document.getElementById('copyAscii');
const downloadAsciiBtn = document.getElementById('downloadAscii');
const generateSampleBtn = document.getElementById('generateSample');

const density = '@%#*+=-:. ';

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function mapRange(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function updateSettingsDisplay() {
    const width = clamp(Number(asciiWidthInput.value) || 140, 80, 220);
    const contrast = clamp(Number(contrastInput.value) || 1.3, 0.8, 2.4);

    asciiWidthInput.value = String(width);
    asciiWidthValue.textContent = String(width);
    contrastInput.value = String(contrast);
    contrastValue.textContent = `${contrast.toFixed(1)}x`;

    return { width, contrast };
}

function renderAsciiFromImage(imageSource, sourceWidth, sourceHeight, customSettings = {}) {
    const { width, contrast } = { ...updateSettingsDisplay(), ...customSettings };
    const aspectRatio = sourceWidth / sourceHeight || 1;
    const height = Math.max(20, Math.floor(width / aspectRatio / 2));

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.filter = `contrast(${contrast}) saturate(${Math.min(contrast * 1.2, 2.5)})`;
    ctx.drawImage(imageSource, 0, 0, width, height);
    ctx.filter = 'none';

    const imageData = ctx.getImageData(0, 0, width, height);
    let asciiImage = '';

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];
            const luminance = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
            const charIndex = Math.floor(mapRange(luminance, 0, 255, density.length - 1, 0));
            asciiImage += density.charAt(charIndex);
        }
        asciiImage += '\n';
    }

    asciiOutput.textContent = asciiImage.trimEnd();
}

function loadImageFromFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => renderAsciiFromImage(img, img.width, img.height);
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function buildSampleArt() {
    const sampleCanvas = document.createElement('canvas');
    const sampleCtx = sampleCanvas.getContext('2d');
    const width = 180;
    const height = 100;

    sampleCanvas.width = width;
    sampleCanvas.height = height;

    const gradient = sampleCtx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1d4ed8');
    gradient.addColorStop(0.5, '#8b5cf6');
    gradient.addColorStop(1, '#0f172a');
    sampleCtx.fillStyle = gradient;
    sampleCtx.fillRect(0, 0, width, height);

    sampleCtx.fillStyle = 'rgba(255,255,255,0.92)';
    sampleCtx.font = 'bold 28px sans-serif';
    sampleCtx.fillText('ASCII', 28, 56);
    sampleCtx.font = 'bold 18px sans-serif';
    sampleCtx.fillText('MEME', 30, 82);

    sampleCtx.fillStyle = 'rgba(255,255,255,0.15)';
    sampleCtx.beginPath();
    sampleCtx.arc(140, 52, 24, 0, Math.PI * 2);
    sampleCtx.fill();

    renderAsciiFromImage(sampleCanvas, sampleCanvas.width, sampleCanvas.height);
}

imageInput.addEventListener('change', (event) => {
    loadImageFromFile(event.target.files[0]);
});

asciiWidthInput.addEventListener('input', updateSettingsDisplay);
contrastInput.addEventListener('input', updateSettingsDisplay);

asciiWidthInput.addEventListener('change', () => {
    if (cameraFeed.srcObject) {
        renderAsciiFromImage(cameraFeed, cameraFeed.videoWidth, cameraFeed.videoHeight);
    }
});

contrastInput.addEventListener('change', () => {
    if (cameraFeed.srcObject) {
        renderAsciiFromImage(cameraFeed, cameraFeed.videoWidth, cameraFeed.videoHeight);
    }
});

startCameraBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraFeed.srcObject = stream;
        cameraFeed.style.display = 'block';
        takePhotoBtn.classList.remove('hidden');
        startCameraBtn.classList.add('hidden');
    } catch (error) {
        alert('Camera access denied or unavailable on this browser.');
    }
});

takePhotoBtn.addEventListener('click', () => {
    if (cameraFeed.videoWidth && cameraFeed.videoHeight) {
        renderAsciiFromImage(cameraFeed, cameraFeed.videoWidth, cameraFeed.videoHeight);
    }
});

copyAsciiBtn.addEventListener('click', async () => {
    const text = asciiOutput.textContent.trim();
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        copyAsciiBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyAsciiBtn.textContent = 'Copy';
        }, 1200);
    } catch (error) {
        console.warn('Clipboard copy failed', error);
        copyAsciiBtn.textContent = 'Copy failed';
    }
});

downloadAsciiBtn.addEventListener('click', () => {
    const text = asciiOutput.textContent.trim();
    if (!text) return;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = 'ascii-meme.txt';
    link.click();
    URL.revokeObjectURL(url);
});

generateSampleBtn.addEventListener('click', buildSampleArt);

window.addEventListener('DOMContentLoaded', () => {
    updateSettingsDisplay();
    buildSampleArt();
});
