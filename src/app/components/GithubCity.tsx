import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { scaleLinear } from "d3-scale";
import { ContributionDay } from "../lib/github";
import React from "react";

interface GitHubCityProps {
  data: ContributionDay[];
}

const colorScale = scaleLinear<string>()
  .domain([0, 1, 2, 3, 4])
  .range(["#ebedf0", "#bef5ca", "#7ce3a1", "#4fd07b", "#2fb344"]);

// Use logarithmic scale for height to make differences more distinguishable
const heightScale = scaleLinear()
  .domain([0, Math.log(30 + 1)]) // Add 1 to avoid log(0)
  .range([0, 1.5]);

// Create window texture
const createWindowTexture = (color: THREE.Color) => {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d");
  if (!context) return null;

  // Fill with building color
  context.fillStyle = `rgb(${color.r * 255 * 0.85}, ${color.g * 255 * 0.85}, ${
    color.b * 255 * 0.85
  })`;
  context.fillRect(0, 0, 32, 32);

  // Add windows
  context.fillStyle = `rgba(255, 255, 255, 0.9)`;
  // First row of windows
  context.fillRect(4, 4, 8, 8);
  context.fillRect(20, 4, 8, 8);
  // Second row of windows
  context.fillRect(4, 20, 8, 8);
  context.fillRect(20, 20, 8, 8);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

const TerrainMesh = ({ data }: GitHubCityProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!meshRef.current) return;

    // Create a BoxGeometry for each contribution
    const group = new THREE.Group();

    // Adjust cell dimensions to make the final shape more squared
    const cellWidth = 0.25;
    const cellHeight = 0.25;
    const spacing = 0.15;

    // Calculate total width and height for centering
    // Now we have 26 columns (52/2) and 14 rows
    const totalWidth = (cellWidth + spacing) * 26; // Changed from 52 to 26 columns
    const totalHeight = (cellHeight + spacing) * 14; // Changed from 7 to 14 rows
    const startX = -totalWidth / 2;
    const startY = -totalHeight / 2;

    // Create base platform
    const baseWidth = totalWidth * 1.4; // Make base wider than the map
    const baseHeight = totalHeight * 1.4; // Make base longer than the map
    const baseDepth = 0.15; // Thickness of the base
    const baseGeometry = new THREE.BoxGeometry(
      baseWidth,
      baseHeight,
      baseDepth
    );
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color("#e6e0d8"),
      flatShading: true,
      shininess: 30,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.z = -baseDepth / 2; // Position it below the buildings
    group.add(base);

    // Add a slightly smaller top layer to the base for detail
    const topLayerGeometry = new THREE.BoxGeometry(
      baseWidth * 0.95,
      baseHeight * 0.95,
      baseDepth / 2
    );
    const topLayerMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color("#f0ebe4"),
      flatShading: true,
      shininess: 40,
    });
    const topLayer = new THREE.Mesh(topLayerGeometry, topLayerMaterial);
    topLayer.position.z = -baseDepth / 4; // Position it just above the base
    group.add(topLayer);

    // Reorganize the data into a 14x26 grid instead of 7x52
    for (let row = 0; row < 14; row++) {
      for (let col = 0; col < 26; col++) {
        // Calculate the index in the original data array
        // Each column in the new grid represents 2 columns from the original
        const dataIndex = col * 2 + Math.floor(row / 7) + (row % 7) * 52;
        if (dataIndex >= data.length) continue;

        const count = data[dataIndex].contributionCount;
        // Apply logarithmic scaling to the height
        const height = count > 0 ? heightScale(Math.log(count + 1)) : 0.05;

        // Create building-like geometry with beveled edges
        const geometry = new THREE.BoxGeometry(
          cellWidth,
          cellHeight,
          height,
          1,
          1,
          4
        );
        const colorStr = colorScale(Math.min(count, 4));
        const baseColor = new THREE.Color(colorStr);

        // Create slightly darker color for sides
        const sideColor = baseColor.clone().multiplyScalar(0.85);

        // Create window texture for the sides
        const windowTexture = createWindowTexture(baseColor);

        // Create materials with windows
        const materials = [
          new THREE.MeshPhongMaterial({
            map: windowTexture,
            color: sideColor,
            bumpMap: windowTexture,
            bumpScale: 0.01,
          }), // right
          new THREE.MeshPhongMaterial({
            map: windowTexture,
            color: sideColor,
            bumpMap: windowTexture,
            bumpScale: 0.01,
          }), // left
          new THREE.MeshPhongMaterial({
            color: baseColor,
            flatShading: true,
          }), // top
          new THREE.MeshPhongMaterial({
            color: sideColor,
            flatShading: true,
          }), // bottom
          new THREE.MeshPhongMaterial({
            map: windowTexture,
            color: sideColor,
            bumpMap: windowTexture,
            bumpScale: 0.01,
          }), // front
          new THREE.MeshPhongMaterial({
            map: windowTexture,
            color: sideColor,
            bumpMap: windowTexture,
            bumpScale: 0.01,
          }), // back
        ];

        materials.forEach((material) => {
          if (material.map) {
            material.map.repeat.set(1, Math.max(1, Math.floor(height * 2)));
          }
          material.shininess = 50;
        });

        const box = new THREE.Mesh(geometry, materials);

        // Position the box
        box.position.x = startX + col * (cellWidth + spacing) + cellWidth / 2;
        box.position.y = startY + row * (cellHeight + spacing) + cellHeight / 2;
        box.position.z = height / 2;

        group.add(box);
      }
    }

    // Clear existing mesh and add new group
    if (meshRef.current) {
      while (meshRef.current.children.length > 0) {
        const child = meshRef.current.children[0];
        meshRef.current.remove(child);
      }
      meshRef.current.add(group);
    }

    // Adjust camera position for better view of buildings
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);
  }, [data, camera]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = -Math.PI / 4;
    }
  });

  return <mesh ref={meshRef} />;
};

// Add useIsMobile hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIsMobile();

    // Add event listener
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
};

const GitHubCity = ({ data }: GitHubCityProps) => {
  const isMobile = useIsMobile();

  // Camera settings based on device
  const cameraSettings = isMobile
    ? {
        position: [0, 8, 20] as [number, number, number],
        fov: 45,
        controls: {
          minPolarAngle: Math.PI / 4,
          maxPolarAngle: Math.PI / 2.2,
          minDistance: 8,
          maxDistance: 50,
          enableDamping: true,
          dampingFactor: 0.08,
        },
      }
    : {
        position: [0, 8, 15] as [number, number, number],
        fov: 35,
        controls: {
          minPolarAngle: Math.PI / 6,
          maxPolarAngle: Math.PI / 2.5,
          minDistance: 5,
          maxDistance: 30,
          enableDamping: true,
          dampingFactor: 0.05,
        },
      };

  return (
    <div className="w-full h-screen">
      <Canvas camera={cameraSettings}>
        <color attach="background" args={["#f8faf9"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={0.9} />
        <directionalLight position={[-5, 5, 5]} intensity={0.5} />
        <TerrainMesh data={data} />
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          {...cameraSettings.controls}
        />
      </Canvas>
    </div>
  );
};

export default GitHubCity;
