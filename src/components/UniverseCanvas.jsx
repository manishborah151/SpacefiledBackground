import React, {useRef, useMemo} from "react";
import {Canvas, useFrame, useThree} from "@react-three/fiber";
import * as THREE from "three";

const STAR_COUNT = 8000;
const STAR_AREA = 200;

function Stars() {
  const glowTexture = useMemo(() => createGlowTexture(), []);
  const meshRef = useRef();

  const positions = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * STAR_AREA * 5; // wider scatter
      pos[i + 1] = (Math.random() - 0.5) * STAR_AREA * 5;
      pos[i + 2] = Math.random() * -STAR_AREA * 2; // deeper spread
    }
    return pos;
  }, []);

  useFrame(() => {
    const pos = meshRef.current.geometry.attributes.position.array;

    for (let i = 0; i < STAR_COUNT * 3; i += 3) {
      const z = pos[i + 2];

      // Determine movement speed based on distance (closer = faster)
      const depthFactor = THREE.MathUtils.mapLinear(
        z,
        -STAR_AREA * 2,
        0,
        0.1,
        1.5
      );
      pos[i + 2] += depthFactor; // Move toward camera

      // Recycle stars that go behind
      if (pos[i + 2] > 5) {
        pos[i] = (Math.random() - 0.5) * STAR_AREA * 3;
        pos[i + 1] = (Math.random() - 0.5) * STAR_AREA * 3;
        pos[i + 2] = -STAR_AREA * 1;
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={STAR_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={glowTexture}
        color={0xffffff}
        size={1.5}
        sizeAttenuation
        transparent
        alphaTest={0.01}
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function LookAroundCamera() {
  const {camera, mouse} = useThree();

  useFrame(() => {
    // Camera stays at origin, only rotates
    camera.position.set(0, 0, 0);

    camera.rotation.y = THREE.MathUtils.lerp(
      camera.rotation.y,
      -mouse.x * 0.3,
      0.03
    );
    camera.rotation.x = THREE.MathUtils.lerp(
      camera.rotation.x,
      mouse.y * 0.3,
      0.03
    );
  });

  return null;
}
function createGlowTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.2, "rgba(255,255,255,0.8)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.3)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function UniverseCanvas() {
  return (
    <Canvas camera={{position: [0, 0, 0], fov: 75}}>
      <color attach="background" args={["#000"]} />
      <ambientLight intensity={0.1} />
      <Stars />
      <LookAroundCamera />
    </Canvas>
  );
}
