// @ts-ignore
declare const Module: any;
import { compile, complex } from 'mathjs';

// Application Configurations
const CONFIG = {
  engineMode: 'sequence', 
  cr: -0.8,
  ci: 0.156,
  iterations: 50,
  visibleIterations: 50, 
  zoom: 120, 
  offsetX: 0,            
  offsetY: 0,            
  formulaStr: "4 * (0.5 * i)^n"
};

let compiledFormula = compile(CONFIG.formulaStr);

// 1. Create a global variable to hold running WASM instance once loaded
let wasmEngine: any = null; 

// Animation State Trackers
let isAnimating = false;
let animationId: number | null = null;
let lastFrameTime = 0;

let globalCanvas: HTMLCanvasElement | null = null;
let globalCtx: CanvasRenderingContext2D | null = null;

async function init() {
  // 2. Initialize  WebAssembly module  when the app starts
  try {
    wasmEngine = await Module({
      locateFile: (path: string) => {
        if (path.endsWith('.wasm')) {
          // Solves the GitHub Pages 404 issue by pointing to the root public folder
          return `${import.meta.env.BASE_URL}engine.wasm`;
        }
        return path;
      }
    });
    console.log("WebAssembly Engine successfully loaded!", wasmEngine);
  } catch (wasmError) {
    console.error("Failed to compile or instantiate WebAssembly binary:", wasmError);
  }

  const canvas = document.getElementById('complexCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  globalCanvas = canvas;
  globalCtx = ctx;

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    render(canvas, ctx);
  };
  
  window.addEventListener('resize', resize);
  setupInteractions(canvas, ctx);
  
  const formulaInput = document.getElementById('custom-formula') as HTMLInputElement;
  if (formulaInput) formulaInput.value = CONFIG.formulaStr;
  
  resize();
}

function render(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const displayWidth = canvas.width / (window.devicePixelRatio || 1);
  const displayHeight = canvas.height / (window.devicePixelRatio || 1);
  
  const centerX = displayWidth / 2 + CONFIG.offsetX;
  const centerY = displayHeight / 2 + CONFIG.offsetY;

  // Render Background
  ctx.fillStyle = '#0b0b0f';
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  // --- 1. ADAPTIVE MATHEMATICAL COORDINATE GRID ---
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.lineWidth = 1;
  
  // Calculate dynamic line spacing based on the current zoom level
  let gridSpacing = 50;
  if (CONFIG.zoom > 300) gridSpacing = 25;
  if (CONFIG.zoom < 60) gridSpacing = 100;

  for (let x = centerX % gridSpacing; x < displayWidth; x += gridSpacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, displayHeight); ctx.stroke();
  }
  for (let y = centerY % gridSpacing; y < displayHeight; y += gridSpacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(displayWidth, y); ctx.stroke();
  }

  // Draw Primary Axes Line Bars
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, displayHeight); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(displayWidth, centerY); ctx.stroke();

  // Draw Numerical Axis Labels (3Blue1Brown Cinematic Layout Typography)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '10px monospace';
  ctx.textBaseline = 'top';

  // Real Axis Numbers (Horizontal)
  for (let x = centerX % gridSpacing; x < displayWidth; x += gridSpacing) {
    const mathValue = (x - centerX) / CONFIG.zoom;
    if (Math.abs(mathValue) > 0.0001) { // Skip origin zero label intersections
      ctx.fillText(mathValue.toFixed(1), x - 8, centerY + 8);
    }
  }
  // Imaginary Axis Numbers (Vertical)
  ctx.textAlign = 'right';
  for (let y = centerY % gridSpacing; y < displayHeight; y += gridSpacing) {
    const mathValue = -(y - centerY) / CONFIG.zoom; // Invert axis coordinates
    if (Math.abs(mathValue) > 0.0001) {
      ctx.fillText(mathValue.toFixed(1) + "i", centerX - 8, y - 4);
    }
  }
  ctx.textAlign = 'left'; // Reset alignment defaults

  // --- 2. GENERATE AND COMPUTE VECTOR MATRICES ---
  const points: {x: number, y: number}[] = [];
  let runningZ = complex(0, 0);
  const constantC = complex(CONFIG.cr, CONFIG.ci);

  // Read loop limit from visibleIterations instead of fixed global configurations
  const loopLimit = isAnimating ? CONFIG.visibleIterations : CONFIG.iterations;

  try {
    for (let n = 0; n < loopLimit; n++) {
      let activeRe = 0;
      let activeIm = 0;

      if (CONFIG.engineMode === 'sequence') {
        const scope = { n: n, c: constantC, z: complex(0, 0) };
        const evaluatedZ = compiledFormula.evaluate(scope);
        activeRe = typeof evaluatedZ === 'number' ? evaluatedZ : evaluatedZ.re;
        activeIm = typeof evaluatedZ === 'number' ? 0 : evaluatedZ.im;
      } else {
        points.push({
          x: centerX + (runningZ.re * CONFIG.zoom),
          y: centerY + (-runningZ.im * CONFIG.zoom)
        });

        const scope = { n: n, c: constantC, z: runningZ };
        const nextZ = compiledFormula.evaluate(scope);
        runningZ = typeof nextZ === 'number' ? complex(nextZ, 0) : nextZ;
        
        if (isNaN(runningZ.re) || isNaN(runningZ.im) || Math.abs(runningZ.re) > 1000) break;
        continue; 
      }

      if (isNaN(activeRe) || isNaN(activeIm) || Math.abs(activeRe) > 10000) break;
      points.push({ x: centerX + (activeRe * CONFIG.zoom), y: centerY + (-activeIm * CONFIG.zoom) });
    }
    
    const errDiv = document.getElementById('formula-error');
    if (errDiv) errDiv.textContent = ""; 
  } catch (err) {
    const errDiv = document.getElementById('formula-error');
    if (errDiv) errDiv.textContent = "Invalid mathematical expression.";
    return;
  }

  // --- 3. RENDERING VECTOR LINES ---
  if (points.length < 2) return;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  
  const gradient = ctx.createLinearGradient(0, 0, displayWidth, displayHeight);
  gradient.addColorStop(0, '#00ffcc');
  gradient.addColorStop(1, '#ff007f');
  ctx.strokeStyle = gradient;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  // Draw Highlight Vertices
  for (let i = 0; i < points.length; i++) {
    ctx.fillStyle = i === points.length - 1 && isAnimating ? '#ff007f' : '#ffffff';
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, i === points.length - 1 && isAnimating ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- 4. STEP-BY-STEP ANIMATION DRIVE CONTROLLER ---
function stepAnimation(timestamp: number) {
  if (!isAnimating || !globalCanvas || !globalCtx) return;

  if (!lastFrameTime) lastFrameTime = timestamp;
  const elapsed = timestamp - lastFrameTime;

  // Render one new vector segment line every 120ms for a clear, smooth pacing speed
  if (elapsed > 120) {
    CONFIG.visibleIterations++;
    
    const statusSpan = document.getElementById('anim-status');
    if (statusSpan) statusSpan.textContent = `Rendering step: ${CONFIG.visibleIterations}`;

    if (CONFIG.visibleIterations > CONFIG.iterations) {
      // Loop complete! Reset to baseline state
      isAnimating = false;
      const playBtn = document.getElementById('play-btn');
      if (playBtn) {
        playBtn.textContent = "Play Sequence";
        playBtn.style.background = "#00ffcc";
      }
      if (statusSpan) statusSpan.textContent = "Done";
      render(globalCanvas, globalCtx);
      return;
    }

    render(globalCanvas, globalCtx);
    lastFrameTime = timestamp;
  }

  animationId = requestAnimationFrame(stepAnimation);
}

function setupInteractions(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const bindInputField = (id: string, param: 'cr' | 'ci' | 'iterations') => {
    const el = document.getElementById(id) as HTMLInputElement;
    if (!el) return;
    el.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const val = parseFloat(target.value);
      if (!isNaN(val)) {
        CONFIG[param] = val;
        
        // Dynamic readout badge sync updates
        if (id === 'param-iter') {
          const iterValDisplay = document.getElementById('iter-val');
          if (iterValDisplay) iterValDisplay.textContent = target.value;
        }
        
        render(canvas, ctx);
      }
    });
  };

  bindInputField('param-cr', 'cr');
  bindInputField('param-ci', 'ci');
  bindInputField('param-iter', 'iterations');

  const formulaInput = document.getElementById('custom-formula') as HTMLInputElement;
  if (formulaInput) {
    formulaInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      try {
        const testFormula = compile(target.value);
        testFormula.evaluate({ n: 1, c: complex(0,0), z: complex(0,0) });
        compiledFormula = testFormula;
        CONFIG.formulaStr = target.value;
        render(canvas, ctx);
      } catch(err) {}
    });
  }

  // Infinite Drag Pan Layout Hooks
  let isDragging = false;
  let startX = 0, startY = 0;

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - CONFIG.offsetX;
    startY = e.clientY - CONFIG.offsetY;
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    CONFIG.offsetX = e.clientX - startX;
    CONFIG.offsetY = e.clientY - startY;
    render(canvas, ctx);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'crosshair';
  });

  // Infinite Scroll Wheel Focus Zooming Hooks
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const displayWidth = canvas.width / (window.devicePixelRatio || 1);
    const displayHeight = canvas.height / (window.devicePixelRatio || 1);
    const mouseX = e.clientX, mouseY = e.clientY;

    const mathX = (mouseX - (displayWidth / 2 + CONFIG.offsetX)) / CONFIG.zoom;
    const mathY = (mouseY - (displayHeight / 2 + CONFIG.offsetY)) / CONFIG.zoom;

    const zoomFactor = 1.1;
    if (e.deltaY < 0) CONFIG.zoom *= zoomFactor;
    else CONFIG.zoom /= zoomFactor;

    CONFIG.offsetX = mouseX - (displayWidth / 2) - (mathX * CONFIG.zoom);
    CONFIG.offsetY = mouseY - (displayHeight / 2) - (mathY * CONFIG.zoom);

    render(canvas, ctx);
  }, { passive: false });

  // --- ANIMATION PLAYER INTERACTION INTERFACE CONNECTOR ---
  const playBtn = document.getElementById('play-btn') as HTMLButtonElement;
  const statusSpan = document.getElementById('anim-status');

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (isAnimating) {
        // Toggle Stop State Action
        isAnimating = false;
        if (animationId) cancelAnimationFrame(animationId);
        playBtn.textContent = "Play Sequence";
        playBtn.style.background = "#00ffcc";
        if (statusSpan) statusSpan.textContent = "Paused";
      } else {
        // Toggle Play Start State Action
        isAnimating = true;
        CONFIG.visibleIterations = 0; // Rewind state history clock back to zero entry bounds
        lastFrameTime = 0;
        playBtn.textContent = "Pause Loop";
        playBtn.style.background = "#ff007f";
        animationId = requestAnimationFrame(stepAnimation);
      }
    });
  }

  // Switch Subsystem Presets
  const seqBtn = document.getElementById('mode-sequence') as HTMLButtonElement;
  const iterBtn = document.getElementById('mode-iterative') as HTMLButtonElement;
  const iterLabel = document.getElementById('iter-label');

  if (seqBtn && iterBtn) {
    const switchMode = (mode: 'sequence' | 'iterative', activeBtn: HTMLButtonElement, inactiveBtn: HTMLButtonElement, defaultFormula: string, labelText: string) => {
      CONFIG.engineMode = mode;
      CONFIG.formulaStr = defaultFormula;
      compiledFormula = compile(defaultFormula);
      if (formulaInput) formulaInput.value = defaultFormula;
      if (iterLabel) iterLabel.textContent = labelText;

      activeBtn.style.background = 'rgba(255, 255, 255, 0.07)';
      activeBtn.style.color = '#00ffcc';
      inactiveBtn.style.background = 'transparent';
      inactiveBtn.style.color = 'var(--text-muted)';
      render(canvas, ctx);
    };

    seqBtn.addEventListener('click', () => switchMode('sequence', seqBtn, iterBtn, "4 * (0.5 * i)^n", "Steps (n)"));
    iterBtn.addEventListener('click', () => switchMode('iterative', iterBtn, seqBtn, "z^2 + c", "Max Iterations"));
  }
  // --- RECENTER CAMERA BUTTON SUBSYSTEM ---
  const recenterBtn = document.getElementById('recenter-btn') as HTMLButtonElement;
  if (recenterBtn) {
    recenterBtn.addEventListener('click', () => {
      CONFIG.offsetX = 0;   // Reset horizontal camera pan to origin
      CONFIG.offsetY = 0;   // Reset vertical camera pan to origin
      CONFIG.zoom = 120;    // Reset back to baseline zoom scale factor
      
      // Force an immediate re-render of the coordinate system space
      render(canvas, ctx);
    });

    // Add a quick visual hover state change via JS styling
    recenterBtn.addEventListener('mouseenter', () => recenterBtn.style.background = 'rgba(0, 255, 204, 0.15)');
    recenterBtn.addEventListener('mouseleave', () => recenterBtn.style.background = 'rgba(255, 255, 255, 0.05)');
  }
}

init();
