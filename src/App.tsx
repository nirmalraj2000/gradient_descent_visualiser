
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"

export default function App() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 35 }}>
        {/* Light */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        {/* Cube */}
        <mesh rotation={[0.4, 0.2, 0]} position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>

        {/* Controls */}
        <OrbitControls />
      </Canvas>
    </div>
  )
}
