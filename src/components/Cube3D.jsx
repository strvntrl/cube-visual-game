import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";

function createTexture(text) {
    const c = document.createElement("canvas");
    c.width = 256; 
    c.height = 256;
    const ctx = c.getContext("2d");

    // background
    ctx.fillStyle = "#fff0f6";
    ctx.fillRect(0, 0, 256, 256);

    // text
    ctx.fillStyle = "#be185d";
    ctx.font = "bold 120px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 128);

    return new THREE.CanvasTexture(c);
}

function Cube({ cube, visible }) {
    const meshRef = useRef();

    const sides = ["right","left","top","bottom","front","back"];

    const mats = sides.map((side) => {
        // 🔥 kalau tidak termasuk visible → transparan
        if (visible && !visible.includes(side)) {
            return new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0
            });
        }

        return new THREE.MeshStandardMaterial({
            map: createTexture(cube[side]),
            roughness: 0.3,
            metalness: 0.1
        });
    });

    return (
        <group>
            <mesh ref={meshRef} castShadow receiveShadow>
                <boxGeometry args={[2, 2, 2]} />
                {mats.map((m, i) => (
                    <primitive key={i} object={m} attach={`material-${i}`} />
                ))}
            </mesh>

            {/* 🔥 edge tetap tampil biar bentuk kubus kebaca */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(2, 2, 2)]} />
                <lineBasicMaterial color="#9d174d" />
            </lineSegments>
        </group>
    );
}

export default function Cube3D({ cube, visible }) {
    return (
        <div className="w-full max-w-[280px] h-[280px] sm:w-72 sm:h-72 bg-white rounded-2xl shadow-xl p-2">
            <Canvas
                shadows
                camera={{ position: [4, 4, 4], fov: 50 }}
            >
                {/* lighting */}
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

                <Cube cube={cube} visible={visible} />
            </Canvas>
        </div>
    );
}