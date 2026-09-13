"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface Helmet3DViewerProps {
  driverCode?: string;
  driverName?: string;
  teamName?: string;
  accentColor?: string;
}

export function Helmet3DViewer({
  driverCode = "HAM",
  driverName = "Lewis Hamilton",
  teamName = "Ferrari",
  accentColor = "#00FF66",
}: Helmet3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const helmetGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 450;
    const height = container.clientHeight || 500;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 14);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    // 4. OrbitControls (for optional user drag interaction)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minPolarAngle = Math.PI / 3;

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(10, 15, 12);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-10, 5, -8);
    scene.add(fillLight);

    const neonRimLight = new THREE.PointLight(0x00ff66, 3.5, 40);
    neonRimLight.position.set(-10, 8, 8);
    scene.add(neonRimLight);

    // 6. Helmet Group
    const helmetGroup = new THREE.Group();
    helmetGroup.rotation.y = -Math.PI / 6; // Initial attractive 3/4 angle
    scene.add(helmetGroup);
    helmetGroupRef.current = helmetGroup;

    // 7. Materials for Helmet
    const carbonShellMat = new THREE.MeshPhysicalMaterial({
      color: 0x18181c,
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.05,
      reflectivity: 1.0,
      clearcoat: 1.0,
    });

    const neonTrimMat = new THREE.MeshStandardMaterial({
      color: 0x00ff66,
      emissive: 0x00ff66,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });

    // 8. Load the 3D Model from D:\ApexGrid-F1\3D-Models\helmet-lh (served at /models/helmet-lh/)
    const loader = new OBJLoader();
    const partsToLoad = [
      "/models/helmet-lh/model_0.obj",
      "/models/helmet-lh/model_1.obj",
      "/models/helmet-lh/model_2.obj",
      "/models/helmet-lh/model_3.obj",
      "/models/helmet-lh/model_4.obj",
    ];

    let loadedCount = 0;
    const tempGroup = new THREE.Group();

    partsToLoad.forEach((url, idx) => {
      loader.load(
        url,
        (obj) => {
          obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              mesh.material = idx === 1 ? visorMat : idx === 3 ? neonTrimMat : carbonShellMat;
            }
          });
          tempGroup.add(obj);
          loadedCount++;

          if (loadedCount === partsToLoad.length || loadedCount >= 1) {
            // Auto-center and normalize size
            const box = new THREE.Box3().setFromObject(tempGroup);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = 7.5 / maxDim;

            tempGroup.position.sub(center);
            tempGroup.scale.set(scale, scale, scale);
            helmetGroup.add(tempGroup);
          }
        },
        undefined,
        (err) => {
          console.warn("OBJ load fallback part:", url, err);
        }
      );
    });

    // 9. GSAP ScrollTrigger: Rotate horizontally ~120 degrees as user scrolls through the page
    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: containerRef.current || container,
      start: "top bottom",
      end: "bottom top",
      scrub: 1.2,
      onUpdate: (self) => {
        if (helmetGroupRef.current) {
          // 120 degrees in radians = 120 * (Math.PI / 180) ≈ 2.094 rad
          const initialAngle = -Math.PI / 6;
          const rotationAngle = 120 * (Math.PI / 180);
          helmetGroupRef.current.rotation.y = initialAngle + self.progress * rotationAngle;
        }
      },
    });

    // 10. Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      scrollTriggerInstance.kill();
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center select-none pointer-events-none"
    >
      {/* Seamless 3D Canvas Mounting Area */}
      <div ref={mountRef} className="w-full h-full pointer-events-none" />
    </div>
  );
}
