import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Grid,
  GridItem,
  Box,
  VStack,
  HStack,
  Text,
  Slider,
  Button,
} from "@chakra-ui/react";
import SurfaceMesh from "./components/SurfaceMesh";
import AxesGrid from "./components/AxesGrid";
import DescentMarker from "./components/DescentMarker";
import { useState, useRef } from "react";

const DEFAULT_LEARNING_RATE = 0.008;
const DEFAULT_STEPS_PER_SECOND = 40;

// Surface type definitions
type SurfaceType =
  | "global-minimum"
  | "saddle-point"
  | "hills-plateau"
  | "local-minimum"
  | "rosenbrock"
  | "rastrigin"
  | "ackley";

interface SurfaceConfig {
  name: string;
  description: string;
  fn: (x: number, y: number) => number;
  xRange: [number, number];
  yRange: [number, number];
  startPosition: [number, number];
}

const SURFACE_CONFIGS: Record<SurfaceType, SurfaceConfig> = {
  "global-minimum": {
    name: "Global Minimum",
    description: "Simple quadratic with global minimum at origin",
    fn: (x, y) => 0.5 * x * x + 0.2 * y * y + 0.5 * Math.sin(x) * Math.cos(y),
    xRange: [-6, 6],
    yRange: [-6, 6],
    startPosition: [4.0, 3.0],
  },
  "saddle-point": {
    name: "Saddle Point",
    description: "Classic axis-aligned hyperbolic paraboloid (saddle)",
    fn: (x, y) => y * y - x * x,
    xRange: [-2, 2],
    yRange: [-2, 2],
    startPosition: [1.0, 1.0],
  },
  "hills-plateau": {
    name: "Hills and Plateau",
    description: "Multiple peaks with flat plateau regions",
    fn: (x, y) =>
      0.35 * (x * x + y * y) -
      5 * Math.exp(-((x - 1.5) ** 2 + (y - 1.5) ** 2) / 0.5) -
      3 * Math.exp(-((x + 1.5) ** 2 + (y + 1.5) ** 2) / 1.5) -
      2 * Math.exp(-((x - 2.5) ** 2 + (y + 2.5) ** 2) / 0.3),
    xRange: [-5, 5],
    yRange: [-5, 5],
    startPosition: [3.5, 3.0],
  },
  "local-minimum": {
    name: "Local Minimum",
    description: "Multiple local minima with one global minimum",
    fn: (x, y) =>
      // Main basin (deepest - global minimum)
      0.3 * Math.exp(-((x + 2) * (x + 2) + (y - 2) * (y - 2)) / 1.5) +
      // Secondary basin (medium depth)
      0.6 * Math.exp(-((x - 1.5) * (x - 1.5) + (y + 1) * (y + 1)) / 2.5) +
      // Tertiary basin (shallow)
      0.8 * Math.exp(-((x + 0.5) * (x + 0.5) + (y - 3) * (y - 3)) / 3) +
      // Background quadratic to create overall bowl shape
      0.1 * (x * x + y * y) +
      // Add some noise/ripples for complexity
      0.2 * Math.sin(1.5 * x) * Math.cos(1.5 * y),
    xRange: [-6, 6],
    yRange: [-6, 6],
    startPosition: [4.5, 4.0],
  },
  rosenbrock: {
    name: "Rosenbrock Function",
    description: "Classic optimization benchmark with narrow valley",
    fn: (x, y) => 100 * Math.pow(y - x * x, 2) + Math.pow(1 - x, 2),
    xRange: [-3, 3],
    yRange: [-1, 5],
    startPosition: [-2.0, 3.0],
  },
  rastrigin: {
    name: "Rastrigin Function",
    description: "Highly multimodal with many local minima",
    fn: (x, y) =>
      20 +
      x * x +
      y * y -
      10 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y)),
    xRange: [-5, 5],
    yRange: [-5, 5],
    startPosition: [3.5, 3.5],
  },
  ackley: {
    name: "Ackley Function",
    description: "Complex multimodal function with many local optima",
    fn: (x, y) =>
      -20 * Math.exp(-0.2 * Math.sqrt(0.5 * (x * x + y * y))) -
      Math.exp(0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y))) +
      Math.E +
      20,
    xRange: [-6, 6],
    yRange: [-6, 6],
    startPosition: [4.5, 4.5],
  },
};

export default function App() {
  const [learningRate, setLearningRate] = useState(DEFAULT_LEARNING_RATE);
  const [stepsPerSecond, setStepsPerSecond] = useState(
    DEFAULT_STEPS_PER_SECOND
  );
  const [restartKey, setRestartKey] = useState(0);
  const [selectedSurface, setSelectedSurface] =
    useState<SurfaceType>("global-minimum");
  const [customStartPosition, setCustomStartPosition] = useState<
    [number, number] | null
  >(null);
  const [controlsEnabled, setControlsEnabled] = useState(true);

  const currentSurface = SURFACE_CONFIGS[selectedSurface];
  const startPosition = customStartPosition || currentSurface.startPosition;

  return (
    <Grid
      w="100vw"
      h="100dvh"
      overflow="hidden"
      bg="#0b0b0c"
      templateColumns={{ base: "1fr", md: "1fr 450px" }}
      templateRows={{
        base: "minmax(0, 1fr) 200px",
        md: "minmax(0, 1fr) 220px",
      }}
      gap={2}
      p={2}
    >
      <GridItem
        colSpan={1}
        rowSpan={2}
        display="grid"
        gridTemplateRows={{ base: "1fr 200px", md: "1fr 220px" }}
        gap={2}
      >
        <Box
          position="relative"
          w="100%"
          h="100%"
          bg="#0f0f10"
          borderRadius="md"
          overflow="hidden"
          border="1px solid"
          borderColor="whiteAlpha.300"
        >
          <Canvas
            camera={{ position: [4, 3, 5], fov: 100 }}
            onPointerDown={(event) => {
              console.log("Canvas click detected, ctrlKey:", event.ctrlKey);
              if (event.ctrlKey) {
                event.preventDefault();
                event.stopPropagation();
                setControlsEnabled(false);
              }
            }}
            onPointerUp={() => {
              setControlsEnabled(true);
            }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 8, 5]} intensity={0.8} />

            <group rotation={[-Math.PI / 32, Math.PI / 32, 0]}>
              <AxesGrid size={24} divisions={30} />
              <SurfaceMesh
                name="surface-mesh"
                fn={currentSurface.fn}
                xRange={currentSurface.xRange}
                yRange={currentSurface.yRange}
                steps={200}
                zScale={0.2}
                onSurfaceClick={(x, y) => {
                  setCustomStartPosition([x, y]);
                  setRestartKey((k) => k + 1);
                  console.log("New position set:", [x, y]);
                }}
              />
              {/* Starting position marker */}
              <mesh
                position={[
                  startPosition[0],
                  currentSurface.fn(startPosition[0], startPosition[1]) * 0.2 +
                    0.15,
                  startPosition[1],
                ]}
              >
                <sphereGeometry args={[0.1, 12, 12]} />
                <meshStandardMaterial
                  color="#666666"
                  wireframe={true}
                  transparent
                  opacity={0.6}
                />
              </mesh>
              <DescentMarker
                key={restartKey}
                fn={currentSurface.fn}
                start={startPosition}
                lr={learningRate}
                stepsPerSecond={stepsPerSecond}
                zScale={0.2}
              />
            </group>

            <OrbitControls
              enabled={controlsEnabled}
              enableDamping
              dampingFactor={0.08}
              minDistance={2}
              maxDistance={20}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              onStart={() => console.log("OrbitControls started")}
              onEnd={() => console.log("OrbitControls ended")}
            />
          </Canvas>
        </Box>
        <Box
          bg="#151517"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="md"
          p={2}
          overflowY="auto"
        >
          <VStack align="stretch" gap={2}>
            {/* Surface Type Selector */}
            <VStack gap={1} w="100%">
              <HStack justify="space-between" w="100%" align="center">
                <HStack gap={3} align="center">
                  <Text color="gray.200" fontSize="sm" fontWeight="medium">
                    Surface Type
                  </Text>
                  <select
                    value={selectedSurface}
                    onChange={(e) => {
                      setSelectedSurface(e.target.value as SurfaceType);
                      setCustomStartPosition(null); // Reset custom position when surface changes
                      setRestartKey((k) => k + 1); // Restart animation when surface changes
                    }}
                    style={{
                      width: "200px",
                      height: "32px",
                      backgroundColor: "#1a1b1e",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: "6px",
                      padding: "0 12px",
                      color: "white",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLSelectElement).style.borderColor =
                        "#38b2ac";
                      (e.target as HTMLSelectElement).style.boxShadow =
                        "0 0 0 1px #38b2ac";
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLSelectElement).style.borderColor =
                        "rgba(255, 255, 255, 0.3)";
                      (e.target as HTMLSelectElement).style.boxShadow = "none";
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLSelectElement).style.borderColor =
                        "rgba(255, 255, 255, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLSelectElement).style.borderColor =
                        "rgba(255, 255, 255, 0.3)";
                    }}
                  >
                    {Object.entries(SURFACE_CONFIGS).map(([key, config]) => (
                      <option
                        key={key}
                        value={key}
                        style={{ backgroundColor: "#1a1b1e", color: "white" }}
                      >
                        {config.name}
                      </option>
                    ))}
                  </select>
                </HStack>
                <Button
                  size="sm"
                  colorPalette="blue"
                  variant="solid"
                  borderRadius="6px"
                  onClick={() => {
                    setRestartKey((k) => k + 1);
                  }}
                  _hover={{
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                  transition="all 0.2s ease"
                  fontWeight="medium"
                  px={3}
                  py={1}
                >
                  Restart
                </Button>
              </HStack>
              <Text color="gray.400" fontSize="xs">
                💡 Ctrl + Click on the surface to set custom start position
              </Text>
            </VStack>

            <HStack gap={4} align="stretch" w="100%">
              <Box flex="1" minW="200px">
                <VStack gap={1} w="100%">
                  <HStack justify="space-between" w="100%">
                    <Text color="gray.200" fontSize="sm">
                      Learning rate
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                      {learningRate.toFixed(3)}
                    </Text>
                  </HStack>
                  <Slider.Root
                    aria-label={["learning-rate-slider"]}
                    min={0.001}
                    max={0.1}
                    step={0.001}
                    value={[learningRate]}
                    onValueChange={(details) =>
                      setLearningRate(Number(details.value[0].toFixed(3)))
                    }
                    colorPalette="teal"
                    size="sm"
                    w="100%"
                  >
                    <Slider.Control w="100%">
                      <Slider.Track w="100%">
                        <Slider.Range />
                      </Slider.Track>
                      <Slider.Thumb index={0} />
                    </Slider.Control>
                  </Slider.Root>
                </VStack>
              </Box>

              <Box flex="1" minW="200px">
                <VStack gap={1} w="100%">
                  <HStack justify="space-between" w="100%">
                    <Text color="gray.200" fontSize="sm">
                      Steps per second
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                      {stepsPerSecond}
                    </Text>
                  </HStack>
                  <Slider.Root
                    aria-label={["steps-per-second-slider"]}
                    min={1}
                    max={120}
                    step={1}
                    value={[stepsPerSecond]}
                    onValueChange={(details) =>
                      setStepsPerSecond(details.value[0])
                    }
                    colorPalette="purple"
                    size="sm"
                    w="100%"
                  >
                    <Slider.Control w="100%">
                      <Slider.Track w="100%">
                        <Slider.Range />
                      </Slider.Track>
                      <Slider.Thumb index={0} />
                    </Slider.Control>
                  </Slider.Root>
                </VStack>
              </Box>
            </HStack>
            {/* Custom position info and reset buttons */}
            {customStartPosition && (
              <HStack justify="space-between" w="100%" align="center">
                <Text color="teal.300" fontSize="sm" fontWeight="medium">
                  Custom Start Position: ({customStartPosition[0].toFixed(2)},{" "}
                  {customStartPosition[1].toFixed(2)})
                </Text>
                <Button
                  size="sm"
                  colorPalette="orange"
                  variant="outline"
                  borderRadius="6px"
                  onClick={() => {
                    setCustomStartPosition(null);
                    setRestartKey((k) => k + 1);
                  }}
                  _hover={{
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                  transition="all 0.2s ease"
                  fontWeight="medium"
                  px={3}
                  py={1}
                >
                  Reset to Default
                </Button>
              </HStack>
            )}
          </VStack>
        </Box>
      </GridItem>

      <GridItem
        colSpan={{ base: 1, md: 1 }}
        rowSpan={2}
        display={{ base: "none", md: "flex" }}
        flexDir="column"
        bg="#121214"
        borderLeft="1px solid"
        borderColor="whiteAlpha.200"
        borderRadius="md"
        overflow="hidden"
      >
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
  );
}
