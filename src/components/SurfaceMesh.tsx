import { useMemo } from "react"
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Vector3 } from "three"

export type SurfaceFn = (x: number, y: number) => number

export interface SurfaceMeshProps {
  fn: SurfaceFn
  xRange: [number, number]
  yRange: [number, number]
  steps?: number
  wireframe?: boolean
}

export default function SurfaceMesh({ fn, xRange, yRange, steps = 100, wireframe }: SurfaceMeshProps) {
  const geometry = useMemo(() => {
    const xMin = xRange[0]
    const xMax = xRange[1]
    const yMin = yRange[0]
    const yMax = yRange[1]

    const vertices: number[] = []
    const colors: number[] = []
    const indices: number[] = []

    // Precompute Z min/max for color normalization
    let zMin = Number.POSITIVE_INFINITY
    let zMax = Number.NEGATIVE_INFINITY

    const positions: Vector3[] = []
    for (let iy = 0; iy <= steps; iy++) {
      const ty = iy / steps
      const y = yMin + (yMax - yMin) * ty
      for (let ix = 0; ix <= steps; ix++) {
        const tx = ix / steps
        const x = xMin + (xMax - xMin) * tx
        const z = fn(x, y)
        positions.push(new Vector3(x, z, y))
        if (z < zMin) zMin = z
        if (z > zMax) zMax = z
      }
    }

    const colorLow = new Color("#7400b8")
    const colorHigh = new Color("#80ff72")

    const gridWidth = steps + 1
    positions.forEach((p) => {
      vertices.push(p.x, p.y, p.z)
      const t = zMax === zMin ? 0.5 : (p.y - zMin) / (zMax - zMin)
      const c = colorLow.clone().lerp(colorHigh, t)
      colors.push(c.r, c.g, c.b)
    })

    for (let y = 0; y < steps; y++) {
      for (let x = 0; x < steps; x++) {
        const a = y * gridWidth + x
        const b = a + 1
        const c = a + gridWidth
        const d = c + 1
        indices.push(a, c, b, b, c, d)
      }
    }

    const geom = new BufferGeometry()
    geom.setAttribute("position", new Float32BufferAttribute(vertices, 3))
    geom.setAttribute("color", new Float32BufferAttribute(colors, 3))
    geom.setIndex(indices)
    geom.computeVertexNormals()
    return geom
  }, [fn, xRange, yRange, steps])

  return (
    <mesh geometry={geometry} rotation={[0, 0, 0]}>
      <meshStandardMaterial vertexColors side={DoubleSide} wireframe={wireframe} />
    </mesh>
  )
}


