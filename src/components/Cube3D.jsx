import { Canvas, useFrame } from "@react-three/fiber";
// import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";

function createTexture(text) {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#fff0f6";
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = "#be185d";
    ctx.font = "bold 120px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 128);

    return new THREE.CanvasTexture(c);
}

function Cube({ cube }) {
    const meshRef = useRef();

    const mats = [
        cube.right,
        cube.left,
        cube.top,
        cube.bottom,
        cube.front,
        cube.back
    ].map((t) =>
        new THREE.MeshStandardMaterial({
            map: createTexture(t),
            roughness: 0.3,
            metalness: 0.1
        })
    );

    return (
        <group>
            <mesh ref={meshRef} castShadow receiveShadow>
                <boxGeometry args={[2, 2, 2]} />
                {mats.map((m, i) => (
                    <primitive key={i} object={m} attach={`material-${i}`} />
                ))}
            </mesh>

            {/* 🔥 edge biar jelas */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(2, 2, 2)]} />
                <lineBasicMaterial color="#9d174d" linewidth={2} />
            </lineSegments>
        </group>
    );
}

export default function Cube3D({ cube }) {
    return (
        <div className="w-full max-w-[280px] h-[280px] sm:w-72 sm:h-72 bg-white rounded-2xl shadow-xl p-2">
            <Canvas
                shadows
                camera={{ position: [4, 4, 4], fov: 50 }}
            >
                {/* lighting biar 3D */}
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[5, 5, 5]}
                    intensity={1}
                    castShadow
                />

                {/* kubus */}
                <Cube cube={cube} />

                {/* control biar bisa diputar */}
                {/* <OrbitControls enableZoom={false} /> */}
            </Canvas>
        </div>
    );
}