import { useEffect, useMemo, useRef, useState } from "react";
import { Mesh } from "three";

export type SurfaceFn = (x: number, y: number) => number;

interface DescentMarkerProps {
  fn: SurfaceFn;
  start: [number, number];
  lr?: number;
  stepsPerSecond?: number;
  zScale?: number; // Add zScale prop
}

export default function DescentMarker({
  fn,
  start,
  lr = 0.05,
  stepsPerSecond = 10,
  zScale = 1, // Default to 1
}: DescentMarkerProps) {
  const meshRef = useRef<Mesh>(null);
  const [xy, setXy] = useState<[number, number]>(start);

  // Numerical gradient via central differences
  const grad = useMemo(() => {
    return (x: number, y: number) => {
      const h = 1e-3;
      const dfdx = (fn(x + h, y) - fn(x - h, y)) / (2 * h);
      const dfdy = (fn(x, y + h) - fn(x, y - h)) / (2 * h);
      return [dfdx, dfdy];
    };
  }, [fn]);

  useEffect(() => {
    const intervalMs = 1000 / stepsPerSecond;
    const id = setInterval(() => {
      setXy(([x, y]) => {
        const [gx, gy] = grad(x, y);
        const nx = x - lr * gx;
        const ny = y - lr * gy;
        return [nx, ny];
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [grad, lr, stepsPerSecond]);

  const z = fn(xy[0], xy[1]) * zScale;

  return (
    <mesh ref={meshRef} position={[xy[0], z + 0.18, xy[1]]}>
      <sphereGeometry args={[0.18, 20, 20]} />
      <meshStandardMaterial
        color="#14b8a6"
        emissive={"#0d9488"}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}
