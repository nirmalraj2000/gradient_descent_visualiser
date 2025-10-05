# Gradient Descent Visualiser

[Live Demo](https://nirmalraj2000.github.io/gradient_descent_visualiser/)

---

## Overview

This project is an interactive 3D visualizer for gradient descent on various mathematical surfaces. It helps you understand how gradient descent works by letting you experiment with different functions, learning rates, and starting points—all in real time.

## Features

- **Multiple Surfaces:**
  - Global Minimum (simple quadratic)
  - Saddle Point
  - Hills and Plateau
  - Local Minimum (multiple basins)
  - Rosenbrock Function
  - Rastrigin Function
  - Ackley Function
- **Interactive Controls:**
  - Change the surface type from a dropdown menu
  - Adjust the learning rate with a slider
  - Adjust the steps per second (animation speed) with a slider
  - Ctrl + Click anywhere on the surface to set a custom starting position for the descent
  - Restart the descent at any time
  - Reset to the default starting position
- **3D Visualization:**
  - Color-mapped surface for easy height interpretation (green = low, yellow = mid, red = high)
  - Reference grid and axes
  - Orbit, pan, and zoom controls (mouse/touch)
  - Animated descent marker (ball) that follows the gradient path
- **Responsive UI:**
  - Works on desktop and large tablets
  - Clean, modern interface with dark mode

## Screenshot

![Gradient Descent Visualiser Screenshot](screenshot.png)

_You can use your own screenshot or the one above to showcase the UI._

## Getting Started

Visit the live demo:

👉 **[https://nirmalraj2000.github.io/gradient_descent_visualiser/](https://nirmalraj2000.github.io/gradient_descent_visualiser/)**

Or run locally:

```bash
npm install
npm run dev
```

## Usage Tips

- Use the dropdown to explore different optimization landscapes.
- Adjust the learning rate to see how it affects convergence.
- Ctrl + Click on the surface to experiment with different starting points.
- Use the orbit controls to view the surface from any angle.

---

Made with React, Three.js, Chakra UI, and Vite.
