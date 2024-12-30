'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './ModelViewer.css';

interface ModelViewerProps {
  modelUrl: string;
  isForumView?: boolean;
  onError?: (error: string) => void;
}

export default function ModelViewer({ modelUrl, isForumView = false, onError }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || error) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;

    // Model loading
    const loadGLTF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use proxy endpoint to fetch the model
        const proxyUrl = `/api/proxy-model?url=${encodeURIComponent(modelUrl)}`;
        const loader = new GLTFLoader();
        
        // First try to load directly
        try {
          const gltf = await new Promise<GLTF>((resolve, reject) => {
            loader.load(
              proxyUrl,
              resolve,
              undefined,
              reject
            );
          });

          scene.add(gltf.scene);

          // Calculate bounding box
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          // Get the largest dimension
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;

          // Scale and center the model
          gltf.scene.scale.multiplyScalar(scale);
          gltf.scene.position.sub(center.multiplyScalar(scale));

          // Position camera
          camera.position.z = 4;
          camera.lookAt(0, 0, 0);

          setLoading(false);
        } catch (loadError) {
          console.error('Initial load error:', loadError);
          
          // If it's a forum view, try loading with isForumView flag
          if (isForumView) {
            const forumProxyUrl = `${proxyUrl}&isForumView=true`;
            loader.load(
              forumProxyUrl,
              (gltf: GLTF) => {
                scene.add(gltf.scene);

                // Calculate bounding box
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());

                // Get the largest dimension
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim;

                // Scale and center the model
                gltf.scene.scale.multiplyScalar(scale);
                gltf.scene.position.sub(center.multiplyScalar(scale));

                // Position camera
                camera.position.z = 4;
                camera.lookAt(0, 0, 0);

                setLoading(false);
              },
              undefined,
              (err: unknown) => {
                console.error('Forum load error:', err);
                const errorMessage = 'Failed to load model. Please try again later.';
                setError(errorMessage);
                onError?.(errorMessage);
              }
            );
          } else {
            throw loadError;
          }
        }
      } catch (err) {
        console.error('Load error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    };

    loadGLTF();

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!container) return;
      
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      
      if (rendererRef.current) {
        const domElement = rendererRef.current.domElement;
        if (domElement && domElement.parentNode && domElement.parentNode.contains(domElement)) {
          domElement.parentNode.removeChild(domElement);
        }
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      
      // Clean up scene
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          } else if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          }
        }
      });
    };
  }, [modelUrl, error, onError]);

  if (error) {
    return (
      <div className="model-error-message">
        {error}
      </div>
    );
  }

  return (
    <div className="model-viewer-wrapper">
      <div ref={containerRef} className="model-viewer">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <p>Loading model...</p>
          </div>
        )}
      </div>
    </div>
  );
} 