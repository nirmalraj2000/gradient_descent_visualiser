import { useEffect, useMemo, useRef, useState } from "react"
import { Mesh } from "three"

export type SurfaceFn = (x: number, y: number) => number

interface DescentMarkerProps {
  fn: SurfaceFn
  start: [number, number]
  lr?: number
  stepsPerSecond?: number
}

export default function DescentMarker({ fn, start, lr = 0.05, stepsPerSecond = 10 }: DescentMarkerProps) {
  const meshRef = useRef<Mesh>(null)
  const [xy, setXy] = useState<[number, number]>(start)

  // Numerical gradient via central differences
  const grad = useMemo(() => {
    return (x: number, y: number) => {
      const h = 1e-3
      const dfdx = (fn(x + h, y) - fn(x - h, y)) / (2 * h)
      const dfdy = (fn(x, y + h) - fn(x, y - h)) / (2 * h)
      return [dfdx, dfdy]
    }
  }, [fn])

  useEffect(() => {
    const intervalMs = 1000 / stepsPerSecond
    const id = setInterval(() => {
      setXy(([x, y]) => {
        const [gx, gy] = grad(x, y)
        const nx = x - lr * gx
        const ny = y - lr * gy
        return [nx, ny]
      })
    }, intervalMs)
    return () => clearInterval(id)
  }, [grad, lr, stepsPerSecond])

  const z = fn(xy[0], xy[1])

  return (
    <mesh ref={meshRef} position={[xy[0], z + 0.03, xy[1]]}>
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshStandardMaterial color="green" emissive={"#330000"} emissiveIntensity={0.5} />
    </mesh>
  )
}


