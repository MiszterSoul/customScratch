// Configuration variables for scratch effect
const CONFIG = {
  particlesPerScratch: 8,            // number of particles on individual scratch
  fullRevealMaxClusters: 20,         // max clusters in full reveal
  fullRevealGridStep: 15,            // grid size for sampling full reveal
  particleSize: { min: 2, max: 6 },  // particle size range in px
  particleSpeed: { min: 1.5, max: 3.5 }, // particle speed range
};

// Canvas-based scratch card logic for frontend
// This script should be included in public/index.html

const scratchArea = document.getElementById('scratch-area');
const couponDiv = document.getElementById('coupon-code');
const codeP = document.getElementById('code');

let isDrawing = false;
let hasRequestedCoupon = false;
let sessionId = null;

// --- COLOR VARIABLES ---
let CARD_BG_GRAD = 'linear-gradient(135deg, #fff 60%, #e0e7ff 100%)';
let CARD_SHINE = 'linear-gradient(120deg, rgba(255,255,255,0.7) 0 10%, transparent 40% 100%)';
let CARD_SHADOW = '0 8px 32px rgba(0,0,0,0.18)';
let SCRATCH_COLOR = '#888';
let SCRATCH_BG = '#f1f5f9';
let PARTICLE_HUE = 45; // gold
let PARTICLE_SAT = 30;
let PARTICLE_LUM = 60;
let BTN_GRAD = 'linear-gradient(135deg, #38bdf8 60%, #2563eb 100%)';

function applyCardColors() {
  document.querySelector('.scratch-card').style.background = CARD_BG_GRAD;
  document.querySelector('.scratch-card').style.boxShadow = CARD_SHADOW;
  document.querySelector('.scratch-area').style.background = SCRATCH_BG;
  document.querySelector('.scratch-area').style.backgroundImage = CARD_SHINE + ', linear-gradient(90deg, ' + SCRATCH_BG + ' 60%, #e0e7ef 100%)';
  canvas.getContext('2d').fillStyle = SCRATCH_COLOR;
  document.querySelectorAll('button').forEach(btn => btn.style.background = BTN_GRAD);
}

function randomizeColors() {
  // Random pastel/metallics
  const hue = Math.floor(Math.random()*360);
  const hue2 = (hue+60)%360;
  CARD_BG_GRAD = `linear-gradient(135deg, hsl(${hue},100%,98%) 60%, hsl(${hue2},100%,92%) 100%)`;
  CARD_SHINE = `linear-gradient(120deg, rgba(255,255,255,0.7) 0 10%, transparent 40% 100%)`;
  CARD_SHADOW = `0 8px 32px hsla(${hue},60%,40%,0.18)`;
  SCRATCH_COLOR = `hsl(${hue2},10%,40%)`;
  SCRATCH_BG = `hsl(${hue}, 60%, 96%)`;
  PARTICLE_HUE = hue;
  BTN_GRAD = `linear-gradient(135deg, hsl(${hue},90%,70%) 60%, hsl(${hue2},90%,55%) 100%)`;
  applyCardColors();
  resizeScratchCanvases();
}

// Create canvas overlay
const canvas = document.createElement('canvas');
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.zIndex = '2';
scratchArea.appendChild(canvas);

// Coupon code is shown under the canvas, but hidden until scratched enough
couponDiv.style.position = 'absolute';
couponDiv.style.top = '0';
couponDiv.style.left = '0';
couponDiv.style.width = '100%';
couponDiv.style.height = '100%';
couponDiv.style.display = 'flex';
couponDiv.style.alignItems = 'center';
couponDiv.style.justifyContent = 'center';
couponDiv.style.flexDirection = 'column';
couponDiv.style.zIndex = '1';
couponDiv.style.background = 'transparent';
couponDiv.style.pointerEvents = 'none';
couponDiv.style.visibility = 'hidden';

const ctx = canvas.getContext('2d');
ctx.fillStyle = '#888'; // much darker gray for scratch layer
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.globalCompositeOperation = 'destination-out';

// --- Sound effect setup ---
const scratchSound = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae6e2.mp3'); // Ingyenes kaparó hang
scratchSound.loop = true;

// --- Particle system ---
const particles = [];
function spawnParticles(x, y) {
  for (let i = 0; i < CONFIG.particlesPerScratch; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * (CONFIG.particleSpeed.max - CONFIG.particleSpeed.min) + CONFIG.particleSpeed.min;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      alpha: 1,
      size: Math.random() * (CONFIG.particleSize.max - CONFIG.particleSize.min) + CONFIG.particleSize.min,
      color: `hsl(${PARTICLE_HUE}, ${PARTICLE_SAT}%, ${Math.random() * 20 + PARTICLE_LUM}%)`,
      z: Math.random() * 8 + 2,
      tilt: Math.random() * Math.PI * 2,
      tiltSpeed: (Math.random() - 0.5) * 0.2
    });
  }
}

// --- Particle overlay canvas ---
const particleCanvas = document.createElement('canvas');
particleCanvas.style.position = 'absolute';
particleCanvas.style.top = '0';
particleCanvas.style.left = '0';
particleCanvas.style.zIndex = '3';
particleCanvas.style.pointerEvents = 'none';
scratchArea.appendChild(particleCanvas);
const pctx = particleCanvas.getContext('2d');

function drawParticles() {
  pctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    pctx.save();
    pctx.globalAlpha = p.alpha * 0.8;
    pctx.translate(p.x, p.y);
    pctx.rotate(p.tilt);
    pctx.scale(1, 0.5 + 0.5 * (p.z / 10));
    pctx.fillStyle = p.color;
    pctx.beginPath();
    pctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, 2 * Math.PI);
    pctx.fill();
    pctx.restore();
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.13 + 0.03 * p.z;
    p.alpha -= 0.018;
    p.tilt += p.tiltSpeed;
    if (p.alpha <= 0) particles.splice(i, 1);
  }
}

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  } else {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
}

function scratch(e) {
  if (!isDrawing) return;
  const pos = getPointerPos(e);
  // Only spawn particles if area was not already cleared
  const pixelData = ctx.getImageData(pos.x, pos.y, 1, 1).data;
  const wasOpaque = pixelData[3] > 0;
  // Clear the area
  ctx.save();
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 18, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
  if (wasOpaque) {
    spawnParticles(pos.x, pos.y);
  }
}

function startScratch(e) {
  isDrawing = true;
  if (!hasRequestedCoupon) {
    hasRequestedCoupon = true;
    fetchCoupon();
  }
  scratchSound.currentTime = 0;
  scratchSound.play();
  scratch(e);
}

function endScratch() {
  isDrawing = false;
  scratchSound.pause();
  checkScratchPercent();
}

function fetchCoupon() {
  fetch('/api/coupon', {
    method: 'POST',
    credentials: 'include', // include cookies for session
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.json())
  .then(data => {
    codeP.textContent = data.couponCode;
    couponDiv.style.visibility = 'visible';
    if (data.generated) {
      const genSound = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae6e2.mp3');
      genSound.play();
    }
  });
}

// --- Get existing session coupon on load ---
window.addEventListener('DOMContentLoaded', () => {
  applyCardColors();
  // Check existing session
  fetch('/api/session', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.couponCode) {
        codeP.textContent = data.couponCode;
        canvas.style.display = 'none';
        particleCanvas.style.display = 'none';
        couponDiv.style.visibility = 'visible';
        hasRequestedCoupon = true;  // prevent new coupon fetch
      }
    });
  // Create "Scratch All" button
  const scratchAllBtn = document.createElement('button');
  scratchAllBtn.textContent = 'Mindet kapard le';
  scratchAllBtn.id = 'scratch-all-btn';
  scratchAllBtn.style.marginTop = '12px';
  scratchAllBtn.style.padding = '8px 16px';
  scratchAllBtn.style.fontSize = '0.95rem';
  scratchAllBtn.style.background = BTN_GRAD;
  scratchAllBtn.style.color = '#fff';
  scratchAllBtn.style.border = 'none';
  scratchAllBtn.style.borderRadius = '20px';
  scratchAllBtn.style.cursor = 'pointer';
  scratchAllBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
  document.querySelector('.scratch-card').appendChild(scratchAllBtn);
  scratchAllBtn.addEventListener('click', () => {
    if (!hasRequestedCoupon) {
      fetchCoupon();
      hasRequestedCoupon = true;
    }
    spawnFullParticles();
    canvas.style.display = 'none';
    couponDiv.style.visibility = 'visible';
  });
});

function checkScratchPercent() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let transparent = 0;
  const total = canvas.width * canvas.height;
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 3] === 0) transparent++;
  }
  const percent = transparent / total * 100;
  const threshold = 50; // percent
  if (percent > threshold) {
    // spawn particles for all remaining (un-scratched) areas
    spawnFullParticles();
    canvas.style.display = 'none';
    // let existing scratch particles continue
    couponDiv.style.visibility = 'visible';
  }
}

// Spawn particles for every unscratch area in a grid
function spawnFullParticles() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const positions = [];
  for (let y = 0; y < canvas.height; y += CONFIG.fullRevealGridStep) {
    for (let x = 0; x < w; x += CONFIG.fullRevealGridStep) {
      const alpha = imageData.data[(y * w + x) * 4 + 3];
      if (alpha > 0) positions.push({ x, y });
    }
  }
  for (let i = 0; i < Math.min(CONFIG.fullRevealMaxClusters, positions.length); i++) {
    const pos = positions[Math.floor(Math.random() * positions.length)];
    spawnParticles(pos.x, pos.y);
  }
}

canvas.addEventListener('mousedown', function(e) {
  startScratch(e);
  if (!hasRequestedCoupon) {
    hasRequestedCoupon = true;
    fetchCoupon();
  }
  window.addEventListener('mousemove', scratch);
  window.addEventListener('mouseup', function mouseUpHandler(ev) {
    endScratch(ev);
    window.removeEventListener('mousemove', scratch);
    window.removeEventListener('mouseup', mouseUpHandler);
  });
});

canvas.addEventListener('touchstart', function(e) {
  startScratch(e);
  if (!hasRequestedCoupon) {
    hasRequestedCoupon = true;
    fetchCoupon();
  }
  window.addEventListener('touchmove', scratch, { passive: false });
  window.addEventListener('touchend', function touchEndHandler(ev) {
    endScratch(ev);
    window.removeEventListener('touchmove', scratch);
    window.removeEventListener('touchend', touchEndHandler);
  });
}, { passive: false });

// Prevent scrolling on touch
canvas.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

function animate() {
  drawParticles();
  requestAnimationFrame(animate);
}
animate();

// 3D tilt effect on card
const scratchCardEl = document.getElementById('scratch-card');
function handleTilt(e) {
  const { clientX: x, clientY: y } = e;
  const { innerWidth: w, innerHeight: h } = window;
  // reduce tilt when scratching
  const sensitivity = isDrawing ? 0.3 : 1;
  const rotY = (x / w - 0.5) * 20 * sensitivity; // max ~20deg
  const rotX = -(y / h - 0.5) * 20 * sensitivity;
  scratchCardEl.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
}
document.addEventListener('mousemove', handleTilt);
document.addEventListener('mouseleave', () => {
  scratchCardEl.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg)';
});

// Add button to generate new session
const newSessionBtn = document.createElement('button');
newSessionBtn.textContent = 'Új kupon igénylése';
newSessionBtn.style.position = 'fixed';
newSessionBtn.style.bottom = '24px';
newSessionBtn.style.right = '24px';
newSessionBtn.style.zIndex = '1000';
newSessionBtn.style.background = BTN_GRAD;
newSessionBtn.style.color = '#fff';
newSessionBtn.style.border = 'none';
newSessionBtn.style.borderRadius = '24px';
newSessionBtn.style.padding = '12px 22px';
newSessionBtn.style.fontSize = '1rem';
newSessionBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
newSessionBtn.style.cursor = 'pointer';
document.body.appendChild(newSessionBtn);
newSessionBtn.addEventListener('click', () => {
  fetch('/api/coupon', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newCoupon: true })
  })
  .then(res => res.json())
  .then(data => {
    // Reset UI: refoil the card, hide coupon, show scratch area
    codeP.textContent = '';
    couponDiv.style.visibility = 'hidden';
    canvas.style.display = '';
    particleCanvas.style.display = '';
    hasRequestedCoupon = false;
    // Repaint the scratch foil
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = SCRATCH_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-out';
    // Optionally reset particles
    particles.length = 0;
  });
});

// Add button to randomize colors
const colorBtn = document.createElement('button');
colorBtn.textContent = '🎨 Színek véletlenszerűsítése';
colorBtn.style.position = 'fixed';
colorBtn.style.bottom = '24px';
colorBtn.style.left = '24px';
colorBtn.style.zIndex = '1000';
colorBtn.style.background = BTN_GRAD;
colorBtn.style.color = '#fff';
colorBtn.style.border = 'none';
colorBtn.style.borderRadius = '24px';
colorBtn.style.padding = '12px 22px';
colorBtn.style.fontSize = '1rem';
colorBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
colorBtn.style.cursor = 'pointer';
document.body.appendChild(colorBtn);
colorBtn.addEventListener('click', randomizeColors);

// --- COPY TO CLIPBOARD & TOOLTIP ---
const couponCopyInfo = document.createElement('div');
couponCopyInfo.textContent = 'Kupon kód kimásolva!';
couponCopyInfo.style.position = 'absolute';
couponCopyInfo.style.top = '50%';
couponCopyInfo.style.left = '50%';
couponCopyInfo.style.transform = 'translate(-50%, -50%)';
couponCopyInfo.style.background = 'rgba(30,30,30,0.92)';
couponCopyInfo.style.color = '#fff';
couponCopyInfo.style.padding = '10px 22px';
couponCopyInfo.style.borderRadius = '16px';
couponCopyInfo.style.fontSize = '1.1rem';
couponCopyInfo.style.zIndex = '10000';
couponCopyInfo.style.opacity = '0';
couponCopyInfo.style.pointerEvents = 'none';
couponCopyInfo.style.transition = 'opacity 0.2s';
document.body.appendChild(couponCopyInfo);

couponDiv.addEventListener('click', function(e) {
  if (codeP.textContent) {
    navigator.clipboard.writeText(codeP.textContent);
    couponCopyInfo.style.opacity = '1';
    setTimeout(() => { couponCopyInfo.style.opacity = '0'; }, 1800);
  }
});

// Add small text under coupon
let smallCopyText = document.createElement('div');
smallCopyText.textContent = 'Kattints a kuponkódra a másoláshoz!';
smallCopyText.style.fontSize = '0.85rem';
smallCopyText.style.color = '#888';
smallCopyText.style.marginTop = '8px';
smallCopyText.style.userSelect = 'none';
smallCopyText.style.pointerEvents = 'none';
couponDiv.appendChild(smallCopyText);

// Create canvas overlay
function resizeScratchCanvases() {
  const rect = scratchArea.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height);
  canvas.width = particleCanvas.width = size;
  canvas.height = particleCanvas.height = size;
  canvas.style.width = particleCanvas.style.width = '100%';
  canvas.style.height = particleCanvas.style.height = '100%';
  // Redraw scratch filter
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = SCRATCH_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'destination-out';
}
resizeScratchCanvases();
window.addEventListener('resize', resizeScratchCanvases);

// --- Place color and new coupon buttons in a mobile stack if on mobile ---
function isMobile() {
  return window.innerWidth <= 600;
}
function updateButtonLayout() {
  const colorBtn = document.querySelector('button[style*="Színek véletlenszerűsítése"]') || colorBtn;
  const newSessionBtn = document.querySelector('button[style*="Új kupon igénylése"]') || newSessionBtn;
  if (isMobile()) {
    let stack = document.querySelector('.mobile-btn-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'mobile-btn-stack';
      document.body.appendChild(stack);
    }
    stack.appendChild(newSessionBtn);
    stack.appendChild(colorBtn);
  } else {
    // Restore to fixed positions for desktop
    newSessionBtn.style.position = 'fixed';
    newSessionBtn.style.bottom = '24px';
    newSessionBtn.style.right = '24px';
    colorBtn.style.position = 'fixed';
    colorBtn.style.bottom = '24px';
    colorBtn.style.left = '24px';
    if (newSessionBtn.parentElement.classList.contains('mobile-btn-stack'))
      document.body.appendChild(newSessionBtn);
    if (colorBtn.parentElement.classList.contains('mobile-btn-stack'))
      document.body.appendChild(colorBtn);
    let stack = document.querySelector('.mobile-btn-stack');
    if (stack) stack.remove();
  }
}
window.addEventListener('resize', updateButtonLayout);
window.addEventListener('DOMContentLoaded', updateButtonLayout);
