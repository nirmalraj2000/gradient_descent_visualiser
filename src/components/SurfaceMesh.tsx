import { useMemo } from "react";
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Vector3,
} from "three";

export type SurfaceFn = (x: number, y: number) => number;

export interface SurfaceMeshProps {
  fn: SurfaceFn;
  xRange: [number, number];
  yRange: [number, number];
  steps?: number;
  wireframe?: boolean;
  name?: string;
  onSurfaceClick?: (x: number, y: number) => void;
  zScale?: number; // Add zScale prop
}

export default function SurfaceMesh({
  fn,
  xRange,
  yRange,
  steps = 100,
  wireframe,
  name,
  onSurfaceClick,
  zScale = 0.2, // Default to 0.2 for a flatter surface
}: SurfaceMeshProps) {
  const geometry = useMemo(() => {
    const xMin = xRange[0];
    const xMax = xRange[1];
    const yMin = yRange[0];
    const yMax = yRange[1];

    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    // Precompute Z min/max for color normalization
    let zMin = Number.POSITIVE_INFINITY;
    let zMax = Number.NEGATIVE_INFINITY;

    const positions: Vector3[] = [];
    for (let iy = 0; iy <= steps; iy++) {
      const ty = iy / steps;
      const y = yMin + (yMax - yMin) * ty;
      for (let ix = 0; ix <= steps; ix++) {
        const tx = ix / steps;
        const x = xMin + (xMax - xMin) * tx;
        const z = fn(x, y) * zScale; // Scale z here
        positions.push(new Vector3(x, z, y));
        if (z < zMin) zMin = z;
        if (z > zMax) zMax = z;
      }
    }

    // Two-stop gradient following Z plane convention:
    // Low -> High : Green -> Yellow -> Red
    const colorGreen = new Color("#00ff66"); // Low
    const colorYellow = new Color("#ffff00"); // Mid
    const colorRed = new Color("#ff0000"); // High

    const gridWidth = steps + 1;
    positions.forEach((p) => {
      vertices.push(p.x, p.y, p.z);
      const t = zMax === zMin ? 0.5 : (p.y - zMin) / (zMax - zMin);

      // Piecewise linear interpolation Green->Yellow->Red
      let c: Color;
      if (t < 0.5) {
        // 0..0.5 => Green -> Yellow
        const localT = t / 0.5;
        c = colorGreen.clone().lerp(colorYellow, localT);
      } else {
        // 0.5..1 => Yellow -> Red
        const localT = (t - 0.5) / 0.5;
        c = colorYellow.clone().lerp(colorRed, localT);
      }

      colors.push(c.r, c.g, c.b);
    });

    for (let y = 0; y < steps; y++) {
      for (let x = 0; x < steps; x++) {
        const a = y * gridWidth + x;
        const b = a + 1;
        const c = a + gridWidth;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geom = new BufferGeometry();
    geom.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geom.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, [fn, xRange, yRange, steps, zScale]);

  const handlePointerDown = (event: any) => {
    console.log("SurfaceMesh pointer down detected!");
    console.log("Event details:", {
      ctrlKey: event.ctrlKey,
      button: event.button,
      type: event.type,
      hasPoint: !!event.point,
      onSurfaceClick: !!onSurfaceClick,
    });

    // Test: Always log when clicking on surface, regardless of Ctrl
    if (event.point) {
      const x = event.point.x;
      const y = event.point.z;
      console.log("Surface intersection at:", [x, y]);
    }

    if (event.ctrlKey && onSurfaceClick) {
      // Don't call preventDefault on Three.js events
      // event.preventDefault();
      // event.stopPropagation();

      // Get the intersection point
      const point = event.point;
      if (point) {
        // The intersection point is in world coordinates
        // We need to account for the group rotation: [-Math.PI / 32, Math.PI / 32, 0]
        // Transform the point back to the original coordinate system

        // Create a rotation matrix to reverse the group rotation
        const rotationX = Math.PI / 32;
        const rotationY = -Math.PI / 32;

        // Apply inverse rotation
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);

        // Rotate around Y axis first, then X axis (inverse of the group rotation)
        let x = point.x;
        let y = point.y;
        let z = point.z;

        // Inverse Y rotation
        const tempX = x * cosY + z * sinY;
        const tempZ = -x * sinY + z * cosY;
        x = tempX;
        z = tempZ;

        // Inverse X rotation
        const tempY = y * cosX - z * sinX;
        const tempZ2 = y * sinX + z * cosX;
        y = tempY;
        z = tempZ2;

        // Use (x, z) as the new (x, y) position for the function
        console.log("Raw intersection point:", point);
        console.log("Transformed coordinates:", [x, z]);
        console.log("Surface click at:", [x, z]);
        onSurfaceClick(x, z);
      } else {
        console.log("No intersection point found");
      }
    }
  };

  return (
    <mesh
      geometry={geometry}
      rotation={[0, 0, 0]}
      name={name}
      onPointerDown={handlePointerDown}
    >
      <meshStandardMaterial
        vertexColors
        side={DoubleSide}
        wireframe={wireframe}
      />
    </mesh>
  );
}
