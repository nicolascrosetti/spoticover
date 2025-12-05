// --- GLOBAL VARIABLES ---
const canvas = document.getElementById('coverCanvas');
const ctx = canvas.getContext('2d');

// User Inputs
const imageLoader = document.getElementById('imageLoader');
const titleInput = document.getElementById('titleInput');
// NOTA: Eliminamos las referencias antiguas a los inputs nativos
// const barColorPicker = document.getElementById('barColorPicker'); 
// const titleColorPicker = document.getElementById('titleColorPicker');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');
const barHeightSlider = document.getElementById('barHeightSlider');
const barHeightValue = document.getElementById('barHeightValue');
const logoVisibilityToggle = document.getElementById('logoVisibilityToggle');
const logoSizeSlider = document.getElementById('logoSizeSlider');
const logoSizeValue = document.getElementById('logoSizeValue');

// Filter Inputs
const filterVisibilityToggle = document.getElementById('filterVisibilityToggle');
const filterOpacitySlider = document.getElementById('filterOpacitySlider');
const filterOpacityValue = document.getElementById('filterOpacityValue');

const downloadButton = document.getElementById('downloadButton');

// Background image
let backgroundImage = new Image();
backgroundImage.crossOrigin = "Anonymous";
let imageOffset = { x: 0, y: 0 };
let imageDrawInfo = null;
let isDraggingImage = false;
let dragStartPointer = { x: 0, y: 0 };
let dragStartOffset = { x: 0, y: 0 };
let activePointerId = null;

// Variables de color globales para que las lea el canvas
let currentBarColor = '#E0B0FF';
let currentTitleColor = '#000000';

// Spotify Logo Path
const spotifyLogoPathData = "M32 0C14.3 0 0 14.337 0 32c0 17.7 14.337 32 32 32 17.7 0 32-14.337 32-32S49.663 0 32 0zm14.68 46.184c-.573.956-1.797 1.223-2.753.65-7.532-4.588-16.975-5.62-28.14-3.097-1.07.23-2.14-.42-2.37-1.49s.42-2.14 1.49-2.37c12.196-2.79 22.67-1.606 31.082 3.556a2 2 0 0 1 .688 2.753zm3.9-8.717c-.726 1.185-2.256 1.53-3.44.84-8.602-5.276-21.716-6.805-31.885-3.747-1.338.382-2.714-.344-3.097-1.644-.382-1.338.344-2.714 1.682-3.097 11.622-3.517 26.074-1.835 35.976 4.244 1.147.688 1.49 2.217.765 3.403zm.344-9.1c-10.323-6.117-27.336-6.69-37.2-3.708-1.568.497-3.25-.42-3.747-1.988s.42-3.25 1.988-3.747c11.317-3.44 30.127-2.753 41.98 4.282 1.415.84 1.873 2.676 1.032 4.09-.765 1.453-2.638 1.912-4.053 1.07z";
const spotifyLogoPath = new Path2D(spotifyLogoPathData);
const spotifyLogoOriginalSize = 64;

// --- INITIALIZATION ---

window.onload = () => {
    initColorPickers(); // Inicializar Pickr
    updateLogoControlsState();
    updateFilterControlsState();
    drawCanvas();
};

function initColorPickers() {
    const commonConfig = {
        theme: 'monolith',
        useAsButton: true,  // <--- ESTA ES LA CLAVE: Usa nuestro div, no crea uno nuevo
        components: {
            preview: true,
            opacity: false,
            hue: true,
            interaction: {
                hex: true,
                input: true,
            }
        }
    };

    // 1. Configuración Main Color
    const barButton = document.getElementById('barColorPreview');
    const barPicker = Pickr.create({
        el: '#barColorPreview',
        default: currentBarColor,
        ...commonConfig
    });

    barPicker.on('change', (color) => {
        const hex = color.toHEXA().toString();
        currentBarColor = hex;

        // Actualizamos el color del cuadrado visualmente
        barButton.style.backgroundColor = hex;

        // Dibujamos el canvas
        drawCanvas();
    });

    // 2. Configuración Text Color
    const titleButton = document.getElementById('titleColorPreview');
    const titlePicker = Pickr.create({
        el: '#titleColorPreview',
        default: currentTitleColor,
        ...commonConfig
    });

    titlePicker.on('change', (color) => {
        const hex = color.toHEXA().toString();
        currentTitleColor = hex;

        // Actualizamos el color del cuadrado visualmente
        titleButton.style.backgroundColor = hex;

        // Dibujamos el canvas
        drawCanvas();
    });
}


// --- EVENT HANDLERS ---

imageLoader.addEventListener('change', handleImageUpload);
titleInput.addEventListener('input', drawCanvas);
// NOTA: Eliminados listeners de inputs nativos, ahora los maneja Pickr arriba
filterVisibilityToggle.addEventListener('change', drawCanvas);

fontSizeSlider.addEventListener('input', () => {
    fontSizeValue.textContent = fontSizeSlider.value;
    drawCanvas();
});

barHeightSlider.addEventListener('input', () => {
    barHeightValue.textContent = barHeightSlider.value;
    drawCanvas();
});

logoVisibilityToggle.addEventListener('change', () => {
    updateLogoControlsState();
    drawCanvas();
});

logoSizeSlider.addEventListener('input', () => {
    logoSizeValue.textContent = logoSizeSlider.value;
    drawCanvas();
});

filterVisibilityToggle.addEventListener('change', () => {
    updateFilterControlsState();
    drawCanvas();
});

filterOpacitySlider.addEventListener('input', () => {
    filterOpacityValue.textContent = filterOpacitySlider.value;
    drawCanvas();
});

canvas.addEventListener('pointerdown', startImageDrag);
canvas.addEventListener('pointermove', handleImageDrag);
canvas.addEventListener('pointerup', endImageDrag);
canvas.addEventListener('pointerleave', endImageDrag);
canvas.addEventListener('pointercancel', endImageDrag);

downloadButton.addEventListener('click', () => {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');

    // 1. Obtener el texto del input y quitar espacios al inicio/final
    const titleValue = titleInput.value.trim();

    // 2. Definir un nombre por defecto por si el input está vacío
    let fileName = 'spotify-cover.png';

    // 3. Si el usuario escribió algo, formatearlo
    if (titleValue) {
        // toLowerCase(): convierte a minúsculas
        // replace(/\s+/g, '-'): reemplaza cualquier espacio en blanco por un guion
        fileName = titleValue.toLowerCase().replace(/\s+/g, '-') + '.png';
    }

    link.download = fileName;
    link.href = dataURL;
    link.click();
});

// --- HELPER FUNCTIONS ---

function updateLogoControlsState() {
    const shouldShowLogo = logoVisibilityToggle.checked;
    logoSizeSlider.disabled = !shouldShowLogo;
    logoSizeSlider.closest('div').classList.toggle('opacity-50', !shouldShowLogo);
}

function updateFilterControlsState() {
    const shouldShowFilter = filterVisibilityToggle.checked;
    filterOpacitySlider.disabled = !shouldShowFilter;
    filterOpacitySlider.closest('div').classList.toggle('opacity-50', !shouldShowFilter);
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            backgroundImage.src = event.target.result;
            backgroundImage.onload = () => {
                imageOffset = { x: 0, y: 0 };
                imageDrawInfo = null;
                updateCanvasCursor();
                drawCanvas();
            };
        };
        reader.readAsDataURL(file);
    }
}

// --- MAIN DRAW FUNCTION ---

function drawCanvas() {
    const title = titleInput.value;
    // CAMBIO: Usamos las variables globales actualizadas por Pickr
    const barColor = currentBarColor;
    const titleColor = currentTitleColor;

    const fontSize = fontSizeSlider.value;
    const barHeight = barHeightSlider.value;
    const logoSize = logoSizeSlider.value;
    const showLogo = logoVisibilityToggle.checked;
    const showFilter = filterVisibilityToggle.checked;
    const filterOpacity = filterOpacitySlider.value / 100;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (backgroundImage.src) {
        const hRatio = canvas.width / backgroundImage.width;
        const vRatio = canvas.height / backgroundImage.height;
        const ratio = Math.max(hRatio, vRatio);
        const scaledWidth = backgroundImage.width * ratio;
        const scaledHeight = backgroundImage.height * ratio;
        const centerShift_x = (canvas.width - scaledWidth) / 2;
        const centerShift_y = (canvas.height - scaledHeight) / 2;

        imageDrawInfo = {
            scaledWidth,
            scaledHeight,
            centerShiftX: centerShift_x,
            centerShiftY: centerShift_y
        };
        clampImageOffset();

        ctx.drawImage(
            backgroundImage,
            0, 0, backgroundImage.width, backgroundImage.height,
            centerShift_x + imageOffset.x,
            centerShift_y + imageOffset.y,
            scaledWidth,
            scaledHeight
        );
    } else {
        imageDrawInfo = null;
        updateCanvasCursor();
    }

    if (showFilter) {
        ctx.save();
        ctx.fillStyle = barColor;
        ctx.globalAlpha = filterOpacity;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    ctx.fillStyle = barColor;
    ctx.save();
    ctx.globalAlpha = 0.95;

    const bottomMargin = 30;
    const numericBarHeight = parseInt(barHeight, 10);
    const barY = canvas.height - numericBarHeight - bottomMargin;

    const leftBarWidth = 20;
    const gapWidth = 20;
    const mainBarX = leftBarWidth + gapWidth;
    const mainBarWidth = canvas.width - mainBarX;

    ctx.fillRect(0, barY, leftBarWidth, numericBarHeight);
    ctx.fillRect(mainBarX, barY, mainBarWidth, numericBarHeight);
    ctx.restore();

    ctx.fillStyle = titleColor;
    ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const textPadding = 20;
    const titleX = mainBarX + textPadding;
    const titleY = barY + (numericBarHeight / 2);
    const maxWidth = mainBarWidth - (textPadding * 2);

    ctx.fillText(title, titleX, titleY, maxWidth);

    if (showLogo) {
        const numericLogoSize = parseInt(logoSize, 10);
        const logoPadding = 20;
        const logoScale = numericLogoSize / spotifyLogoOriginalSize;
        ctx.save();
        ctx.translate(logoPadding, logoPadding);
        ctx.scale(logoScale, logoScale);
        ctx.fillStyle = barColor;
        ctx.fill(spotifyLogoPath);
        ctx.restore();
    }

    updateCanvasCursor();
}

// --- IMAGE DRAG HELPERS ---

function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

function clampImageOffset() {
    if (!imageDrawInfo) return;
    const maxOffsetX = Math.max(0, (imageDrawInfo.scaledWidth - canvas.width) / 2);
    const maxOffsetY = Math.max(0, (imageDrawInfo.scaledHeight - canvas.height) / 2);
    imageOffset.x = Math.min(maxOffsetX, Math.max(-maxOffsetX, imageOffset.x));
    imageOffset.y = Math.min(maxOffsetY, Math.max(-maxOffsetY, imageOffset.y));
}

function startImageDrag(event) {
    if (!backgroundImage.src) return;
    isDraggingImage = true;
    activePointerId = event.pointerId;
    if (canvas.setPointerCapture) {
        canvas.setPointerCapture(activePointerId);
    }
    dragStartPointer = getCanvasCoordinates(event);
    dragStartOffset = { ...imageOffset };
    updateCanvasCursor();
    event.preventDefault();
}

function handleImageDrag(event) {
    if (!isDraggingImage) return;
    const currentPos = getCanvasCoordinates(event);
    const deltaX = currentPos.x - dragStartPointer.x;
    const deltaY = currentPos.y - dragStartPointer.y;
    imageOffset.x = dragStartOffset.x + deltaX;
    imageOffset.y = dragStartOffset.y + deltaY;
    clampImageOffset();
    drawCanvas();
    canvas.style.cursor = 'grabbing';
    event.preventDefault();
}

function endImageDrag() {
    if (!isDraggingImage) return;
    isDraggingImage = false;
    if (activePointerId !== null && canvas.releasePointerCapture) {
        canvas.releasePointerCapture(activePointerId);
        activePointerId = null;
    }
    updateCanvasCursor();
}

function updateCanvasCursor() {
    if (!backgroundImage.src) {
        canvas.style.cursor = 'default';
    } else {
        canvas.style.cursor = isDraggingImage ? 'grabbing' : 'grab';
    }
}
