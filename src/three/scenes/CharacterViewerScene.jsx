import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';

function PreviewModel({ appearance = {} }) {
  const { skin = '#deb99e', hair = '#343735', outfit = '#747e69' } = appearance;
  // TODO: replace geometric preview with a catalog-resolved GLTF, shared rig, modular clothing and morph targets.
  return (
    <group position={[0, -1, 0]}>
      <mesh position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0, 2.05, -0.04]}>
        <sphereGeometry args={[0.355, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={hair} />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <capsuleGeometry args={[0.32, 0.6, 8, 24]} />
        <meshStandardMaterial color={outfit} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.48, 1.13, 0]} rotation={[0, 0, side * 0.12]}>
            <capsuleGeometry args={[0.105, 0.7, 8, 16]} />
            <meshStandardMaterial color={outfit} />
          </mesh>
          <mesh position={[side * 0.18, 0.4, 0]}>
            <capsuleGeometry args={[0.13, 0.65, 8, 16]} />
            <meshStandardMaterial color="#3f4441" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
export default function CharacterViewerScene({ appearance, name }) {
  return (
    <div
      className="three-viewer"
      role="img"
      aria-label={`${name}: geometric 3D placeholder. Drag to rotate; scroll to zoom.`}
    >
      <Canvas
        camera={{ position: [0, 0.6, 4], fov: 38 }}
        dpr={[1, 1.5]}
        fallback={<p>3D is unavailable on this browser. Choose the 2D preview.</p>}
      >
        <color attach="background" args={['#e5e5dc']} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 5, 4]} intensity={2} />
        <PreviewModel appearance={appearance} />
        <ContactShadows position={[0, -1.1, 0]} opacity={0.25} scale={5} blur={2.5} far={3} />
        <OrbitControls
          enablePan={false}
          minDistance={2.5}
          maxDistance={6}
          minPolarAngle={0.5}
          maxPolarAngle={Math.PI / 2}
          target={[0, 0.1, 0]}
        />
      </Canvas>
    </div>
  );
}
