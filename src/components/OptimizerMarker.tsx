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

  // Optimizer states
  const [velocity, setVelocity] = useState<[number, number]>([0, 0]); // momentum/adam
  const [gradSquareAvg, setGradSquareAvg] = useState<[number, number]>([0, 0]); // rmsprop
  const [gradSquareSum, setGradSquareSum] = useState<[number, number]>([0, 0]); // adagrad
  const [m, setM] = useState<[number, number]>([0, 0]); // adam first moment
  const [v, setV] = useState<[number, number]>([0, 0]); // adam second moment
  const [t, setT] = useState(0); // adam timestep

  const grad = useCentralDiffGradient(fn);

  useEffect(() => {
    setXy(start);
    setVelocity([0, 0]);
    setGradSquareAvg([0, 0]);
    setGradSquareSum([0, 0]);
    setM([0, 0]);
    setV([0, 0]);
    setT(0);
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
          setVelocity(([vx, vy]) => {
            const nvx = momentum * vx + lr * gx; // gradient ascent form inside, subtract later
            const nvy = momentum * vy + lr * gy;
            nx = x - nvx;
            ny = y - nvy;
            return [nvx, nvy];
          });
        } else if (optimizer === "rmsprop") {
          setGradSquareAvg(([sx, sy]) => {
            const nsx = decay * sx + (1 - decay) * (gx * gx);
            const nsy = decay * sy + (1 - decay) * (gy * gy);
            nx = x - (lr / Math.sqrt(nsx + eps)) * gx;
            ny = y - (lr / Math.sqrt(nsy + eps)) * gy;
            return [nsx, nsy];
          });
        } else if (optimizer === "adagrad") {
          setGradSquareSum(([sx, sy]) => {
            const nsx = sx + gx * gx;
            const nsy = sy + gy * gy;
            nx = x - (lr / Math.sqrt(nsx + eps)) * gx;
            ny = y - (lr / Math.sqrt(nsy + eps)) * gy;
            return [nsx, nsy];
          });
        } else if (optimizer === "adam") {
          setT((tt) => tt + 1);
          setM(([mx, my]) => {
            const nmx = beta1 * mx + (1 - beta1) * gx;
            const nmy = beta1 * my + (1 - beta1) * gy;
            setV(([vx2, vy2]) => {
              const nvx2 = beta2 * vx2 + (1 - beta2) * (gx * gx);
              const nvy2 = beta2 * vy2 + (1 - beta2) * (gy * gy);
              const tLocal = t + 1;
              const mHatX = nmx / (1 - Math.pow(beta1, tLocal));
              const mHatY = nmy / (1 - Math.pow(beta1, tLocal));
              const vHatX = nvx2 / (1 - Math.pow(beta2, tLocal));
              const vHatY = nvy2 / (1 - Math.pow(beta2, tLocal));
              nx = x - (lr * mHatX) / (Math.sqrt(vHatX) + eps);
              ny = y - (lr * mHatY) / (Math.sqrt(vHatY) + eps);
              return [nvx2, nvy2];
            });
            return [nmx, nmy];
          });
        }

        return [nx, ny];
      });
    }, dt);
    return () => clearInterval(id);
  }, [grad, lr, stepsPerSecond, optimizer, enabled, t]);

  const z = fn(xy[0], xy[1]) * zScale;

  if (!enabled) return null;

  return (
    <mesh ref={meshRef} name={name} position={[xy[0], z + 0.18, xy[1]]}>
      <sphereGeometry args={[0.18, 20, 20]} />
      <meshStandardMaterial color={color} emissive={emissive ?? color} emissiveIntensity={0.4} />
    </mesh>
  );
}
