
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { Grid, GridItem, Box, VStack } from "@chakra-ui/react"
import SurfaceMesh from "./components/SurfaceMesh"
import AxesGrid from "./components/AxesGrid"
import DescentMarker from "./components/DescentMarker"

export default function App() {
  return (
    <Grid
      w="100vw"
      h="100dvh"
      overflow="hidden"
      bg="#0b0b0c"
      templateColumns={{ base: "1fr", md: "1fr 360px" }}
      templateRows={{ base: "minmax(0, 1fr) 200px", md: "minmax(0, 1fr) 160px" }}
      gap={2}
      p={2}
    >
      <GridItem colSpan={1} rowSpan={2} display="grid" gridTemplateRows={{ base: "1fr 200px", md: "1fr 160px" }} gap={2}>
        <Box position="relative" w="100%" h="100%" bg="#0f0f10" borderRadius="md" overflow="hidden" border="1px solid" borderColor="whiteAlpha.300">
          <Canvas camera={{ position: [4, 3, 5], fov: 100 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 8, 5]} intensity={0.8} />

            <group rotation={[-Math.PI / 32, Math.PI / 32, 0]}>
              <AxesGrid size={12} divisions={30} />
              <SurfaceMesh
                fn={(x, y) => 0.5 * x * x  + 0.2 * y * y + 0.5 * Math.sin(x) * Math.cos(y)}
                xRange={[-4, 4]}
                yRange={[-4, 4]}
                steps={120}
              />
              <DescentMarker
                fn={(x, y) => 0.5 * x * x + 0.2 * y * y + 0.5 * Math.sin(x) * Math.cos(y)}
                start={[2.5, 2.0]}
                lr={0.01}
                stepsPerSecond={40}
              />
            </group>

            <OrbitControls enableDamping dampingFactor={0.08} minDistance={2} maxDistance={20} />
          </Canvas>
        </Box>
        <Box bg="#151517" border="1px solid" borderColor="whiteAlpha.200" borderRadius="md" p={3}>
          {/* Controls go here */}
        </Box>
      </GridItem>

      <GridItem colSpan={{ base: 1, md: 1 }} rowSpan={2} display={{ base: "none", md: "flex" }} flexDir="column" bg="#121214" borderLeft="1px solid" borderColor="whiteAlpha.200" borderRadius="md" overflow="hidden">
        <Box overflow="auto" p={3}>
          <VStack align="stretch" gap={3}>
            {/* {Array.from({ length: 40 }).map((_, index) => (
              <Box key={index} bg="#1a1b1e" border="1px solid" borderColor="whiteAlpha.300" borderRadius="md" p={3}>
                <Heading as="h3" size="sm" mb={1}>Item {index + 1}</Heading>
                <Text color="gray.300">Scrollable content placeholder</Text>
              </Box>
            ))} */}
          </VStack>
        </Box>
      </GridItem>
    </Grid>
  )
}
