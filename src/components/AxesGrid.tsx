import { GridHelper, AxesHelper } from "three"
import { useMemo } from "react"

interface AxesGridProps {
  size: number
  divisions?: number
}

export default function AxesGrid({ size, divisions = 20 }: AxesGridProps) {
  const grid = useMemo(() => new GridHelper(size, divisions, 0x666666, 0x444444), [size, divisions])
  const axes = useMemo(() => new AxesHelper(size * 0.6), [size])
  return (
    <group>
      <primitive object={grid} rotation={[0, 0, 0]} position={[0, -0.001, 0]} />
      <primitive object={axes} />
    </group>
  )
}


