import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, ContactShadows, Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { JannyMood, PartnerGender } from '../lib/live-session';

interface AvatarProps {
  state: "disconnected" | "connecting" | "connected" | "listening" | "speaking";
  isMuted: boolean;
  mood?: JannyMood;
  gender?: PartnerGender;
}

const ProceduralAvatar: React.FC<AvatarProps> = ({ state, mood = "romantic", gender = "female" }) => {
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Group>(null);
  const tearLeftRef = useRef<THREE.Mesh>(null);
  const tearRightRef = useRef<THREE.Mesh>(null);

  // Mood color schemes & visual emotional palettes
  const getMoodColors = () => {
    const isMale = gender === "male";
    switch (mood) {
      case "angry":
        return {
          head: state === "speaking" ? "#dc2626" : state === "listening" ? "#ef4444" : "#b91c1c",
          blush: "#7f1d1d",
          aura: "#ef4444",
          particles: "#f87171",
          blushOpacity: 0.7,
        };
      case "crying":
        return {
          head: state === "speaking" ? "#3b82f6" : state === "listening" ? "#60a5fa" : "#1d4ed8",
          blush: "#93c5fd",
          aura: "#38bdf8",
          particles: "#67e8f9",
          blushOpacity: 0.5,
        };
      case "jealous":
        return {
          head: state === "speaking" ? "#9333ea" : state === "listening" ? "#a855f7" : "#7e22ce",
          blush: "#581c87",
          aura: "#c084fc",
          particles: "#e879f9",
          blushOpacity: 0.6,
        };
      case "caring":
        return {
          head: state === "speaking" ? "#0d9488" : state === "listening" ? "#14b8a6" : "#0f766e",
          blush: isMale ? "#14b8a6" : "#fb7185",
          aura: "#2dd4bf",
          particles: "#99f6e4",
          blushOpacity: 0.35,
        };
      case "happy":
        return {
          head: state === "speaking" ? "#f59e0b" : state === "listening" ? "#fbbf24" : "#d97706",
          blush: "#f97316",
          aura: "#f59e0b",
          particles: "#fde047",
          blushOpacity: 0.4,
        };
      case "shy":
        return {
          head: state === "speaking" ? "#ec4899" : state === "listening" ? "#f472b6" : "#db2777",
          blush: "#e11d48",
          aura: "#f472b6",
          particles: "#fbcfe8",
          blushOpacity: 0.65,
        };
      case "playful":
        return {
          head: state === "speaking" ? "#d946ef" : state === "listening" ? "#e879f9" : "#c026d3",
          blush: "#c026d3",
          aura: "#c084fc",
          particles: "#f472b6",
          blushOpacity: 0.45,
        };
      case "romantic":
      default:
        return {
          head: isMale 
            ? (state === "speaking" ? "#38bdf8" : state === "listening" ? "#60a5fa" : "#0284c7")
            : (state === "speaking" ? "#fb7185" : state === "listening" ? "#f43f5e" : "#e11d48"),
          blush: isMale ? "#0369a1" : "#e11d48",
          aura: isMale ? "#38bdf8" : "#fb7185",
          particles: isMale ? "#7dd3fc" : "#fda4af",
          blushOpacity: 0.45,
        };
    }
  };

  const colors = getMoodColors();

  useFrame((stateFrame) => {
    const time = stateFrame.clock.getElapsedTime();
    
    if (headRef.current) {
      // Mood-specific head motion
      let speedMult = 1.0;
      if (mood === "happy") speedMult = 1.4;
      if (mood === "angry") speedMult = 1.6;
      if (mood === "crying") speedMult = 0.5;
      if (mood === "shy") speedMult = 0.7;

      headRef.current.position.y = Math.sin(time * 0.8 * speedMult) * 0.1;
      
      if (state === "speaking") {
        headRef.current.rotation.z = Math.sin(time * 10 * speedMult) * (mood === "angry" ? 0.09 : 0.06);
        headRef.current.rotation.x = Math.cos(time * 5 * speedMult) * 0.05;
      } else if (state === "listening") {
        headRef.current.rotation.x = 0.18; // Leaning forward to listen
        headRef.current.rotation.y = Math.sin(time * 2) * 0.1;
      } else if (mood === "shy") {
        headRef.current.rotation.x = 0.08;
        headRef.current.rotation.z = Math.sin(time * 0.5) * 0.05;
      } else if (mood === "crying") {
        // Melancholy downward tilt
        headRef.current.rotation.x = 0.12;
        headRef.current.rotation.z = Math.sin(time * 0.8) * 0.04;
      } else if (mood === "angry") {
        // Sulking sharp head tilt
        headRef.current.rotation.y = 0.25;
        headRef.current.rotation.x = -0.05;
      } else {
        headRef.current.rotation.y = Math.sin(time * 0.6) * 0.15;
      }
    }

    // Eye blinking and movement
    const blink = Math.sin(time * 0.5) > 0.98 ? 0.1 : 1;
    if (leftEyeRef.current) {
      leftEyeRef.current.scale.y = mood === "crying" ? 0.4 : blink;
    }
    if (rightEyeRef.current) {
      if (mood === "playful" && Math.sin(time * 0.25) > 0.95) {
        rightEyeRef.current.scale.y = 0.1;
      } else if (mood === "crying") {
        rightEyeRef.current.scale.y = 0.4;
      } else {
        rightEyeRef.current.scale.y = blink;
      }
    }

    // Tear animation for crying mood
    if (mood === "crying") {
      if (tearLeftRef.current) {
        tearLeftRef.current.position.y = -0.05 - (time * 0.6 % 0.4);
        tearLeftRef.current.scale.setScalar(0.8 + Math.sin(time * 5) * 0.2);
      }
      if (tearRightRef.current) {
        tearRightRef.current.position.y = -0.05 - ((time * 0.6 + 0.2) % 0.4);
        tearRightRef.current.scale.setScalar(0.8 + Math.cos(time * 5) * 0.2);
      }
    }

    // Mouth movement when speaking
    if (mouthRef.current) {
      if (state === "speaking") {
        mouthRef.current.scale.y = 0.5 + Math.abs(Math.sin(time * 15)) * 1.5;
        mouthRef.current.scale.x = 1 + Math.sin(time * 10) * 0.2;
      } else {
        mouthRef.current.scale.y = 0.12;
        mouthRef.current.scale.x = (mood === "happy" || mood === "playful") ? 1.3 : (mood === "angry" || mood === "crying") ? 0.7 : 1;
      }
    }

    // Animate mood particles
    if (particlesRef.current) {
      particlesRef.current.children.forEach((p, i) => {
        p.position.y += mood === "crying" ? -0.015 : 0.012;
        p.rotation.y += 0.02;
        p.scale.setScalar(Math.sin(time * 2 + i) * 0.05 + 0.18);
        if (p.position.y > 2.5) p.position.y = -1.5;
        if (p.position.y < -2.0) p.position.y = 2.0;
      });
    }
  });

  return (
    <group>
      <group ref={headRef}>
        {/* Main Head Sphere */}
        <Float speed={mood === "happy" ? 2.5 : mood === "angry" ? 2.0 : 1.8} rotationIntensity={0.4} floatIntensity={0.5}>
          <Sphere args={[gender === "male" ? 1.05 : 1, 64, 64]}>
            <MeshDistortMaterial
              color={colors.head}
              speed={state === "speaking" ? 4 : 2}
              distort={state === "speaking" ? 0.35 : mood === "angry" ? 0.28 : 0.2}
              radius={1}
              roughness={0.2}
            />
          </Sphere>
        </Float>

        {/* Face Group */}
        <group position={[0, 0, 0.8]}>
          {/* Eyes */}
          <mesh ref={leftEyeRef} position={[-0.35, 0.2, 0]}>
            <sphereGeometry args={[gender === "male" ? 0.08 : 0.09, 16, 16]} />
            <meshStandardMaterial color="#18181b" roughness={0.1} />
          </mesh>
          <mesh ref={rightEyeRef} position={[0.35, 0.2, 0]}>
            <sphereGeometry args={[gender === "male" ? 0.08 : 0.09, 16, 16]} />
            <meshStandardMaterial color="#18181b" roughness={0.1} />
          </mesh>

          {/* Eye Sparkles */}
          <mesh position={[-0.32, 0.23, 0.07]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.38, 0.23, 0.07]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          {/* Tears when Crying */}
          {mood === "crying" && (
            <>
              <mesh ref={tearLeftRef} position={[-0.35, 0.05, 0.1]}>
                <sphereGeometry args={[0.035, 8, 8]} />
                <meshStandardMaterial color="#67e8f9" transparent opacity={0.85} roughness={0.1} />
              </mesh>
              <mesh ref={tearRightRef} position={[0.35, 0.05, 0.1]}>
                <sphereGeometry args={[0.035, 8, 8]} />
                <meshStandardMaterial color="#67e8f9" transparent opacity={0.85} roughness={0.1} />
              </mesh>
            </>
          )}

          {/* Mouth */}
          <mesh ref={mouthRef} position={[0, -0.18, 0]}>
            <capsuleGeometry args={[gender === "male" ? 0.14 : 0.12, 0.08, 4, 8]} />
            <meshStandardMaterial color="#27272a" roughness={0.1} />
          </mesh>

          {/* Blush */}
          <mesh position={[-0.5, -0.02, -0.1]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial color={colors.blush} transparent opacity={colors.blushOpacity} />
          </mesh>
          <mesh position={[0.5, -0.02, -0.1]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial color={colors.blush} transparent opacity={colors.blushOpacity} />
          </mesh>
        </group>

        {/* Outer Aura */}
        <mesh scale={[1.25, 1.25, 1.25]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color={colors.aura}
            transparent
            opacity={mood === "angry" || mood === "jealous" ? 0.22 : 0.14}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* Floating Particles */}
      <group ref={particlesRef}>
        {[...Array(14)].map((_, i) => (
          <mesh 
            key={i} 
            position={[
              (Math.random() - 0.5) * 4.5,
              (Math.random() - 0.5) * 4,
              (Math.random() - 0.5) * 2.5
            ]}
          >
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={colors.particles} transparent opacity={0.45} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const JannyAvatar: React.FC<AvatarProps> = (props) => {
  return (
    <div className="w-full h-full absolute inset-0 z-0 pointer-events-none">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
        <ambientLight intensity={0.65} />
        <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1.8} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <React.Suspense fallback={null}>
          <ProceduralAvatar {...props} />
          <Environment preset="sunset" />
          <ContactShadows opacity={0.35} scale={10} blur={2} far={4.5} />
        </React.Suspense>
      </Canvas>
    </div>
  );
};

export default JannyAvatar;
