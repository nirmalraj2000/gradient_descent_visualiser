import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
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
  const surfaceRef = useRef<THREE.Mesh>(null);
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
        if (z < zMin) {
          zMin = z;
        }
        if (z > zMax) zMax = z;
      }
    }

    // Correct color mapping: Low -> Red, Mid -> Yellow, High -> Green
    const colorGreen = new Color("#00ff66"); // High
    const colorYellow = new Color("#ffff00"); // Mid
    const colorRed = new Color("#ff0000"); // Low

    const gridWidth = steps + 1;
    positions.forEach((p) => {
      vertices.push(p.x, p.y, p.z);
      // t=0 is low (red), t=1 is high (green)
      const t = zMax === zMin ? 0.5 : (p.y - zMin) / (zMax - zMin);
      // Piecewise linear interpolation Red->Yellow->Green
      let c: Color;
      if (t < 0.5) {
        // 0..0.5 => Red -> Yellow
        const localT = t / 0.5;
        c = colorRed.clone().lerp(colorYellow, localT);
      } else {
        // 0.5..1 => Yellow -> Green
        const localT = (t - 0.5) / 0.5;
        c = colorYellow.clone().lerp(colorGreen, localT);
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

  // --- Scalar (grid) lines logic ---
  const gridLines = useMemo(() => {
    const xMin = xRange[0];
    const xMax = xRange[1];
    const yMin = yRange[0];
    const yMax = yRange[1];
    const numLines = 30; // Number of grid lines in each direction (increased from 10)
    const xLines: number[][] = [];
    const yLines: number[][] = [];
    // Vertical lines (constant x, varying y)
    for (let i = 0; i <= numLines; i++) {
      const x = xMin + (xMax - xMin) * (i / numLines);
      const line: number[] = [];
      for (let j = 0; j <= steps; j++) {
        const ty = j / steps;
        const y = yMin + (yMax - yMin) * ty;
        const z = fn(x, y) * zScale;
        line.push(x, z, y);
      }
      xLines.push(line);
    }
    // Horizontal lines (constant y, varying x)
    for (let i = 0; i <= numLines; i++) {
      const y = yMin + (yMax - yMin) * (i / numLines);
      const line: number[] = [];
      for (let j = 0; j <= steps; j++) {
        const tx = j / steps;
        const x = xMin + (xMax - xMin) * tx;
        const z = fn(x, y) * zScale;
        line.push(x, z, y);
      }
      yLines.push(line);
    }
    return { xLines, yLines };
  }, [fn, xRange, yRange, steps, zScale]);

  // Find the minimum point on the surface
  const minPos = useMemo(() => {
    const xMin = xRange[0];
    const xMax = xRange[1];
    const yMin = yRange[0];
    const yMax = yRange[1];
    let minZ = Number.POSITIVE_INFINITY;
    let min: [number, number, number] = [0, 0, 0];
    for (let iy = 0; iy <= steps; iy++) {
      const ty = iy / steps;
      const y = yMin + (yMax - yMin) * ty;
      for (let ix = 0; ix <= steps; ix++) {
        const tx = ix / steps;
        const x = xMin + (xMax - xMin) * tx;
        const z = fn(x, y) * zScale;
        if (z < minZ) {
          minZ = z;
          min = [x, z, y];
        }
      }
    }
    return min;
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
        // Prefer the main surface mesh's local space for consistent coordinates
        const container =
          surfaceRef.current ?? (event.object as THREE.Object3D);
        // Convert the world-space intersection to the mesh's local space.
        // In mesh local coordinates, geometry vertices are laid out as (x, fn(x,y)*zScale, y)
        // so we can directly read the planar coordinates from (local.x, local.z).
        const local = container.worldToLocal(point.clone());
        const lx = local.x;
        const lz = local.z;
        console.log("Raw intersection point:", point);
        console.log("Local (mesh) coordinates:", [lx, lz]);
        console.log("Surface click at:", [lx, lz]);
        onSurfaceClick(lx, lz);
      } else {
        console.log("No intersection point found");
      }
    }
  };

  const flagRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (flagRef.current && flagRef.current.geometry) {
      const geom = flagRef.current.geometry as THREE.BufferGeometry;
      const t = performance.now() * 0.001;
      const pos = geom.attributes.position;

      // Animate each vertex of the triangle
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);

        // Create a waving effect that varies across the triangle
        // The rightmost point (tip) waves more than the left edge
        const distanceFromLeft = x + 0.14; // Distance from left edge (0 to 0.28)
        const waveIntensity = distanceFromLeft / 0.28; // 0 at left edge, 1 at tip

        // Waving effect: stronger at the tip, weaker at the base
        const wave =
          0.08 * Math.sin(8 * distanceFromLeft + t * 3) * waveIntensity;
        pos.setZ(i, wave);
      }
      pos.needsUpdate = true;
      geom.computeVertexNormals();
    }
  });

  return (
    <>
      <mesh
        ref={surfaceRef}
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
      {/* Draw grid lines along x */}
      {gridLines.xLines.map((line, idx) => (
        <line key={"x-" + idx}>
          <bufferGeometry
            attach="geometry"
            attributes={{ position: new Float32BufferAttribute(line, 3) }}
          />
          <lineBasicMaterial attach="material" color="#222" linewidth={1} />
        </line>
      ))}
      {/* Draw grid lines along y */}
      {gridLines.yLines.map((line, idx) => (
        <line key={"y-" + idx}>
          <bufferGeometry
            attach="geometry"
            attributes={{ position: new Float32BufferAttribute(line, 3) }}
          />
          <lineBasicMaterial attach="material" color="#222" linewidth={1} />
        </line>
      ))}
      {/* Finish line flag at the lowest point */}
      <group position={[minPos[0], minPos[1], minPos[2]]}>
        {/* Flag pole */}
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.56, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Flag (triangle) */}
        <mesh
          ref={flagRef}
          position={[0.14, 0.5, 0]}
          rotation={[0, 0, Math.PI / 16]}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array([
                  // Triangle vertices: base at left, point at right
                  -0.14,
                  -0.08,
                  0, // Bottom left
                  -0.14,
                  0.08,
                  0, // Top left
                  0.14,
                  0.0,
                  0, // Right point
                ]),
                3,
              ]}
            />
            <bufferAttribute
              attach="attributes-uv"
              args={[
                new Float32Array([
                  0,
                  0, // Bottom left
                  0,
                  1, // Top left
                  1,
                  0.5, // Right point
                ]),
                2,
              ]}
            />
            <bufferAttribute
              attach="index"
              args={[new Uint16Array([0, 1, 2]), 1]}
            />
          </bufferGeometry>
          <meshStandardMaterial color="#22c55e" side={2} />
        </mesh>
      </group>
    </>
  );
}
