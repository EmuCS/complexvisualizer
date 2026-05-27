# Complex Visualizer Sandbox

A mathematical engine built to visualize and compare discrete complex sequences alongside chaotic iterative loops. This webprogram acts as an interactive sandbox for exploring complex plane behaviors, coordinate mappings, and orbital dynamics in real time.

---

## 🔨 Local Setup & Development

Follow these steps to get the interactive development environment running locally on your machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended) along with `npm` (Node Package Manager).

### Installation Steps

1. **Clone the repository:**
   Bash: git clone [https://github.com/emucs/complex-dynamics-visualizer.git](https://github.com/emucs/complex-dynamics-visualizer.git)
   cd complex-dynamics-visualizer
   
2. Install the project dependencies:
    This pulls down mathjs, typescript, vite, and the required type definition wrappers into your local setup.
    Bash: npm install

3. Launch the local development server:
    Boot up the Vite HMR (Hot Module Replacement) pipeline.
    Bash: npm run dev

4. Open the Application:
    Once the terminal boots the server, click the local link provided in your console (usually http://localhost:5173) to open the interactive canvas right in your browser.

---

## Architectural Overview

This project was because I felt there was a gap in mathematical visualizers that just allowed the simple creation of series and sequences (of complex numbers)

To fill this gap
1. **Discrete Sequence Mode ($n$):** Computes absolute positions independently using an increasing step index ($n$) to render uniform, geometric paths (e.g., standard complex exam proofs and spiral convergences).
2. **Iterative Feedback Mode ($z$):** Feeds previous outputs directly back into the system ($z_{n+1} = f(z_n)$) to compute and map non-linear, chaotic orbital trajectories typical of Mandelbrot and Julia set behavior.

---

## 🛠️ Key Engineering Features

### Infinite Spatial Coordinates & Focal Anchoring
* Implemented an infinitely scalable 2D coordinate canvas supporting seamless pan-and-drag interactions.
* **Focal Mouse-Zooming:** Mathematical offsets dynamically adjust relative to the user's viewport cursor position, anchoring the structural focus area cleanly during scaling operations.
* Features a custom, auto-scaling coordinate grid layout that dynamically recalculates and draws primary axes and typography rules ($1.0, 1.0i$) to avoid visual collisions.

### Frame-Budgeted Animation Engine
* Built an asynchronous execution clock leveraging `requestAnimationFrame` to step through multi-point sequence trajectories linearly over time.
* **16.6ms Optimization:** To maintain a locked 60 FPS target, user input strings are compiled *once* into an algebraic execution tree outside the loop. The renderer utilizes strict early-exit escape boundaries the moment an orbit diverges ($|z| > 1000$), preserving memory overhead and protecting the browser thread from freezing.

### 🌐 Multi-Language Portability Architecture
* Features an internal data structure pipeline designed to handle shared linear memory buffers, passing data via raw memory pointers over an array buffer bridge to accommodate native WebAssembly runtime tasks without data-copy overhead.

---

## 🔬 Mathematical Sandbox Testing

Toggle into **Sequence Mode** or **Iterative Mode** within the interface dashboard and experiment with these configurations:

### Discrete Spirals (Sequence Mode)
* **Exam Baseline:** `4 * (0.5 * i)^n` — Renders a perfect, right-angle geometric spiral collapsing precisely into the origin $(0,0)$.
* **Variable Velocity:** `n * (0.95 * i)^n` — Animates an expanding orbital loop that maps the scaling effects of a dynamic scalar variable.

### Chaotic Basins (Iterative Mode)
* **Classic Julia:** `z^2 + c` — Set $C.real = -0.8$ and $C.imag = 0.156$ to explore stable vs. escaping orbit boundaries.
* **Trigonometric Space:** `sin(z) + c` — Computes transcendental wave transformations across complex planes.

---

## 💻 Tech Stack & Dependencies

* **Language:** TypeScript (Strict Type Safety)
* **Runtime Compiler:** Math.js (Expression Tree Parser & Complex Number Matrix)
* **Graphics:** HTML5 Canvas API (Context 2D Optimized Vector Pipeline)
* **Environment Tooling:** Vite (Fast HMR Bundler Architecture)

