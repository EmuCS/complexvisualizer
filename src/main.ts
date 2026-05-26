import Module from './core/engine.js';

async function init() {
  const canvas = document.getElementById('complexCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  
  // 1. IMMEDIATE DRAW (Before any WASM logic)
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (!ctx) return;

  ctx.fillStyle = "blue"; // Background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "red";  // Center Square
  ctx.fillRect(canvas.width / 2 - 25, canvas.height / 2 - 25, 50, 50);

  console.log("Canvas initialized. If you don't see blue/red, check index.html path.");

  try {
    // 2. WASM LOADING (The "Risky" part)
    console.log("Loading WASM...");
    const wasm: any = await Module();
    console.log("WASM Success!");

    const computeSequence = wasm.cwrap('compute_sequence', null, ['number', 'number', 'number', 'number', 'number']);
    const getBufferPtr = wasm.cwrap('get_buffer_ptr', 'number', []);

    computeSequence(0, 0, -0.8, 0.156, 50); 
    const ptr = getBufferPtr();
    const results = new Float64Array(wasm.HEAPF64.buffer, ptr, 100);

    // 3. DRAWING DATA
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < results.length; i += 2) {
      const x = centerX + (results[i] * 200);
      const y = centerY + (results[i + 1] * 200);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

  } catch (e) {
    console.error("The WASM broke the script:", e);
  }
}

init();ru