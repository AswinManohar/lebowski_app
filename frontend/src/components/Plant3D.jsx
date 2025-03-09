import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Plant stem component
const Stem = ({ height, thickness }) => {
  return (
    <mesh position={[0, height / 2, 0]}>
      <cylinderGeometry args={[thickness, thickness, height, 8]} />
      <meshStandardMaterial color="green" />
    </mesh>
  );
};

// Plant leaf component
const Leaf = ({ position, rotation, scale }) => {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <coneGeometry args={[0.5, 1, 4]} />
      <meshStandardMaterial color="lightgreen" />
    </mesh>
  );
};

// Flower component
const Flower = ({ position, size }) => {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[size, 8, 8]} />
        <meshStandardMaterial color="pink" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[size * 0.3, 8, 8]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
    </group>
  );
};

// Main plant component
const Plant = ({ growthLevel }) => {
  const stemHeight = Math.min(5, 0.5 + growthLevel * 0.5);
  const stemThickness = Math.min(0.3, 0.05 + growthLevel * 0.03);
  const leafSize = Math.min(1, 0.2 + growthLevel * 0.1);
  
  // Calculate number of leaf pairs based on growth
  const leafPairs = Math.min(5, Math.floor(growthLevel / 2));
  
  // Determine if flower should be visible
  const showFlower = growthLevel >= 8;
  
  return (
    <group position={[0, 0, 0]}>
      <Stem height={stemHeight} thickness={stemThickness} />
      
      {/* Generate leaves based on growth level */}
      {Array.from({ length: leafPairs }).map((_, index) => {
        const height = (index + 1) * (stemHeight / (leafPairs + 1));
        const angle = index * Math.PI / 2;
        
        return (
          <React.Fragment key={index}>
            <Leaf 
              position={[Math.cos(angle) * 0.3, height, Math.sin(angle) * 0.3]} 
              rotation={[0, angle, Math.PI / 4]} 
              scale={[leafSize, leafSize, leafSize]} 
            />
            <Leaf 
              position={[Math.cos(angle + Math.PI) * 0.3, height, Math.sin(angle + Math.PI) * 0.3]} 
              rotation={[0, angle + Math.PI, Math.PI / 4]} 
              scale={[leafSize, leafSize, leafSize]} 
            />
          </React.Fragment>
        );
      })}
      
      {/* Add flower at the top when growth is sufficient */}
      {showFlower && <Flower position={[0, stemHeight, 0]} size={0.3} />}
    </group>
  );
};

// Animate the plant with a gentle sway
const AnimatedPlant = ({ growthLevel }) => {
  const groupRef = useRef();
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
      groupRef.current.position.y = Math.sin(clock.getElapsedTime()) * 0.05;
    }
  });
  
  return (
    <group ref={groupRef}>
      <Plant growthLevel={growthLevel} />
    </group>
  );
};

// Main component with canvas
const Plant3D = ({ totalSeconds }) => {
  // Calculate growth level based on recorded seconds (every 20 seconds)
  const growthLevel = Math.floor(totalSeconds / 20);
  
  return (
    <div style={{ width: '300px', height: '300px' }}>
      <Canvas 
        camera={{ position: [0, 2, 5], fov: 50 }}
        style={{ background: 'linear-gradient(to bottom, #f9f3e6, #fff9ea)' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <AnimatedPlant growthLevel={growthLevel} />
        <OrbitControls enableZoom={true} enablePan={true} />
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
};

export default Plant3D; 