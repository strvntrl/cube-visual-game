import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function texture(text) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = "#ff1493";
  ctx.font = "bold 120px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 128);

  return new THREE.CanvasTexture(c);
}

function Cube({ cube }) {
  const mats = [
    cube.right, cube.left, cube.top,
    cube.bottom, cube.front, cube.back
  ].map(t => new THREE.MeshBasicMaterial({ map: texture(t) }));

  return (
    <mesh rotation={[0.4, 0.4, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      {mats.map((m, i) => <primitive key={i} object={m} attach={`material-${i}`} />)}
    </mesh>
  );
}

export default function Cube3D({ cube }) {
  return (
    <div className="w-64 h-64">
      <Canvas camera={{ position: [3, 3, 3] }}>
        <ambientLight />
        <Cube cube={cube} />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}