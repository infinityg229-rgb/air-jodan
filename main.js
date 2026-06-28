// Configuration
const FRAME_COUNT = 210;
// Vite/Vercel serve the 'public' folder at the root, while a local python server at root needs the 'public/' prefix.
const IMAGES_DIR = (window.location.port === '8000' || window.location.port === '8080') ? 'public/frames/' : 'frames/';
const FILE_PREFIX = 'ezgif-frame-';
const FILE_EXT = '.jpg';

// State Variables
const images = [];
let loadedCount = 0;
let currentFrameIndex = 0;
let targetFrameIndex = 0;
const damping = 0.1; // Smoothness factor for scroll inertia (0.05 to 0.2)

// DOM Elements
const canvas = document.getElementById('sneaker-canvas');
const ctx = canvas.getContext('2d');
const preloader = document.getElementById('preloader');
const progressBar = document.getElementById('progress-bar');
const statusPercentage = document.getElementById('status-percentage');
const scrollHeader = document.getElementById('scroll-header');

// 1. Image Preloader
function preloadImages() {
  return new Promise((resolve) => {
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      // Pad frame number with leading zeros (e.g., 001, 012, 110)
      const frameNum = String(i).padStart(3, '0');
      img.src = `${IMAGES_DIR}${FILE_PREFIX}${frameNum}${FILE_EXT}`;
      
      img.onload = () => {
        loadedCount++;
        const progress = Math.round((loadedCount / FRAME_COUNT) * 100);
        progressBar.style.width = `${progress}%`;
        statusPercentage.textContent = `${progress}%`;
        
        if (loadedCount === FRAME_COUNT) {
          setTimeout(() => {
            preloader.classList.add('fade-out');
            resolve();
          }, 600); // Small delay for visual transition
        }
      };
      
      img.onerror = () => {
        console.error(`Failed to load image: ${img.src}`);
        loadedCount++;
      };
      
      images.push(img);
    }
  });
}

// 2. High-DPI Canvas Setup
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  ctx.scale(dpr, dpr);
  
  // Redraw current frame after resize
  renderFrame(Math.round(currentFrameIndex));
}

// 3. Render Image on Canvas (Centered & Contained)
function renderFrame(index) {
  const img = images[index];
  if (!img) return;

  const rect = canvas.getBoundingClientRect();
  const canvasWidth = rect.width;
  const canvasHeight = rect.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // Calculate scaling (contain fit with 5% padding)
  const imgWidth = img.width;
  const imgHeight = img.height;
  const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight) * 0.95;
  
  const x = (canvasWidth - imgWidth * scale) / 2;
  const y = (canvasHeight - imgHeight * scale) / 2;
  
  ctx.drawImage(img, x, y, imgWidth * scale, imgHeight * scale);
}

// 4. Smooth Animation Loop (Handles inertia)
function animationLoop() {
  // Smooth interpolation (Inertia)
  const diff = targetFrameIndex - currentFrameIndex;
  currentFrameIndex += diff * damping;
  
  // Stop loop updating if we are extremely close to target
  if (Math.abs(targetFrameIndex - currentFrameIndex) < 0.01) {
    currentFrameIndex = targetFrameIndex;
  }
  
  renderFrame(Math.round(currentFrameIndex));
  requestAnimationFrame(animationLoop);
}

// 5. Scroll Event Handler
function handleScroll() {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const scrollFraction = maxScroll <= 0 ? 0 : scrollTop / maxScroll;
  
  // Map scroll fraction to frame index
  targetFrameIndex = Math.min(FRAME_COUNT - 1, Math.floor(scrollFraction * FRAME_COUNT));

  // Fade out the heading overlay at 30% of the 600vh scroll animation section
  if (scrollHeader) {
    const fadeLimit = window.innerHeight * 1.8; // 30% of 600vh = 180vh
    const opacity = Math.max(0, 1 - (scrollTop / fadeLimit));
    scrollHeader.style.opacity = opacity;
    if (opacity === 0) {
      scrollHeader.style.visibility = 'hidden';
    } else {
      scrollHeader.style.visibility = 'visible';
    }
  }
}

// Initialize Application
async function init() {
  // 1. Preload all frames
  await preloadImages();
  
  // 2. Setup Canvas size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // 3. Bind scroll events
  window.addEventListener('scroll', handleScroll);
  
  // 4. Initial draw
  handleScroll();
  currentFrameIndex = targetFrameIndex;
  renderFrame(currentFrameIndex);
  
  // 5. Start animation loop
  animationLoop();
}

// Run on load
window.addEventListener('DOMContentLoaded', init);
