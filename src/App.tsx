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
import { useState } from "react";

const DEFAULT_LEARNING_RATE = 0.008;
const DEFAULT_STEPS_PER_SECOND = 40;

export default function App() {
  const [learningRate, setLearningRate] = useState(DEFAULT_LEARNING_RATE);
  const [stepsPerSecond, setStepsPerSecond] = useState(
    DEFAULT_STEPS_PER_SECOND
  );
  const [restartKey, setRestartKey] = useState(0);

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
          <Canvas camera={{ position: [4, 3, 5], fov: 100 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 8, 5]} intensity={0.8} />

            <group rotation={[-Math.PI / 32, Math.PI / 32, 0]}>
              <AxesGrid size={12} divisions={30} />
              <SurfaceMesh
                fn={(x, y) =>
                  0.5 * x * x + 0.2 * y * y + 0.5 * Math.sin(x) * Math.cos(y)
                }
                xRange={[-4, 4]}
                yRange={[-4, 4]}
                steps={120}
              />
              <DescentMarker
                key={restartKey}
                fn={(x, y) =>
                  0.5 * x * x + 0.2 * y * y + 0.5 * Math.sin(x) * Math.cos(y)
                }
                start={[2.5, 2.0]}
                lr={learningRate}
                stepsPerSecond={stepsPerSecond}
              />
            </group>

            <OrbitControls
              enableDamping
              dampingFactor={0.08}
              minDistance={2}
              maxDistance={20}
            />
          </Canvas>
        </Box>
        <Box
          bg="#151517"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="md"
          p={3}
          overflowY="auto"
        >
          <VStack align="stretch" gap={3}>
            <HStack gap={6} align="stretch" w="100%">
              <Box flex="1" minW="200px">
                <VStack gap={2} w="100%">
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
                <VStack gap={2} w="100%">
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
            {/* add a button to reset the parameters */}
            <HStack justify="flex-end" pt={2}>
              <Button
                size="sm"
                colorPalette="blue"
                variant="solid"
                borderRadius="6px"
                onClick={() => {
                  // setSteps(120)
                  // setLearningRate(0.01)
                  // setStepsPerSecond(40)
                  setRestartKey((k) => k + 1);
                }}
                _hover={{
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                }}
                transition="all 0.2s ease"
                fontWeight="medium"
                px={4}
                py={2}
              >
                Restart
              </Button>
            </HStack>
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
