import { useEffect, useMemo, useRef, useState } from "react";
import { Mesh } from "three";

export type SurfaceFn = (x: number, y: number) => number;

type OptimizerType = "gd" | "sgd" | "momentum" | "rmsprop" | "adagrad" | "adam";

interface OptimizerMarkerProps {
  fn: SurfaceFn;
  start: [number, number];
  lr: number;
  stepsPerSecond: number;
  zScale?: number;
  optimizer: OptimizerType;
  color: string;
  emissive?: string;
  enabled?: boolean;
  name?: string;
}

function useCentralDiffGradient(fn: SurfaceFn) {
  return useMemo(() => {
    return (x: number, y: number): [number, number] => {
      const h = 1e-3;
      const dfdx = (fn(x + h, y) - fn(x - h, y)) / (2 * h);
      const dfdy = (fn(x, y + h) - fn(x, y - h)) / (2 * h);
      return [dfdx, dfdy];
    };
  }, [fn]);
}

export default function OptimizerMarker({ fn, start, lr, stepsPerSecond, zScale = 1, optimizer, color, emissive, enabled = true, name }: OptimizerMarkerProps) {
  const meshRef = useRef<Mesh>(null);
  const [xy, setXy] = useState<[number, number]>(start);

  // Optimizer states using refs to avoid stale closures and side-effects in state updaters
  const velocityRef = useRef<[number, number]>([0, 0]);
  const gradSquareAvgRef = useRef<[number, number]>([0, 0]);
  const gradSquareSumRef = useRef<[number, number]>([0, 0]);
  const mRef = useRef<[number, number]>([0, 0]);
  const vRef = useRef<[number, number]>([0, 0]);
  const tRef = useRef<number>(0);

  const grad = useCentralDiffGradient(fn);

  useEffect(() => {
    setXy(start);
    velocityRef.current = [0, 0];
    gradSquareAvgRef.current = [0, 0];
    gradSquareSumRef.current = [0, 0];
    mRef.current = [0, 0];
    vRef.current = [0, 0];
    tRef.current = 0;
  }, [start, fn, optimizer]);

  useEffect(() => {
    if (!enabled) return;
    const dt = 1000 / stepsPerSecond;
    const eps = 1e-8;
    const beta1 = 0.9;
    const beta2 = 0.999;
    const decay = 0.9; // for RMSProp
    const momentum = 0.9; // for Momentum

    const id = setInterval(() => {
      setXy(([x, y]) => {
        // For SGD, add noise to coordinates before gradient to emulate stochastic sampling
        const noiseScale = optimizer === "sgd" ? 0.02 : 0;
        const xn = x + (Math.random() * 2 - 1) * noiseScale;
        const yn = y + (Math.random() * 2 - 1) * noiseScale;
        const [gx, gy] = grad(xn, yn);

        let nx = x;
        let ny = y;

        if (optimizer === "gd" || optimizer === "sgd") {
          nx = x - lr * gx;
          ny = y - lr * gy;
        } else if (optimizer === "momentum") {
          const [vx, vy] = velocityRef.current;
          const nvx = momentum * vx + lr * gx; // gradient ascent form inside, subtract later
          const nvy = momentum * vy + lr * gy;
          velocityRef.current = [nvx, nvy];
          nx = x - nvx;
          ny = y - nvy;
        } else if (optimizer === "rmsprop") {
          const [sx, sy] = gradSquareAvgRef.current;
          const nsx = decay * sx + (1 - decay) * (gx * gx);
          const nsy = decay * sy + (1 - decay) * (gy * gy);
          gradSquareAvgRef.current = [nsx, nsy];
          nx = x - (lr / Math.sqrt(nsx + eps)) * gx;
          ny = y - (lr / Math.sqrt(nsy + eps)) * gy;
        } else if (optimizer === "adagrad") {
          const [sx, sy] = gradSquareSumRef.current;
          const nsx = sx + gx * gx;
          const nsy = sy + gy * gy;
          gradSquareSumRef.current = [nsx, nsy];
          nx = x - (lr / Math.sqrt(nsx + eps)) * gx;
          ny = y - (lr / Math.sqrt(nsy + eps)) * gy;
        } else if (optimizer === "adam") {
          tRef.current += 1;
          const [mx, my] = mRef.current;
          const nmx = beta1 * mx + (1 - beta1) * gx;
          const nmy = beta1 * my + (1 - beta1) * gy;
          mRef.current = [nmx, nmy];

          const [vx2, vy2] = vRef.current;
          const nvx2 = beta2 * vx2 + (1 - beta2) * (gx * gx);
          const nvy2 = beta2 * vy2 + (1 - beta2) * (gy * gy);
          vRef.current = [nvx2, nvy2];

          const tLocal = tRef.current;
          const mHatX = nmx / (1 - Math.pow(beta1, tLocal));
          const mHatY = nmy / (1 - Math.pow(beta1, tLocal));
          const vHatX = nvx2 / (1 - Math.pow(beta2, tLocal));
          const vHatY = nvy2 / (1 - Math.pow(beta2, tLocal));
          nx = x - (lr * mHatX) / (Math.sqrt(vHatX) + eps);
          ny = y - (lr * mHatY) / (Math.sqrt(vHatY) + eps);
        }

        return [nx, ny];
      });
    }, dt);
    return () => clearInterval(id);
  }, [grad, lr, stepsPerSecond, optimizer, enabled]);

  const z = fn(xy[0], xy[1]) * zScale;

  if (!enabled) return null;

  return (
    <mesh ref={meshRef} name={name} position={[xy[0], z + 0.18, xy[1]]}>
      <sphereGeometry args={[0.18, 20, 20]} />
      <meshStandardMaterial color={color} emissive={emissive ?? color} emissiveIntensity={0.4} />
    </mesh>
  );
}
