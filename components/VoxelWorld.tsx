
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

interface VoxelWorldProps {
  activeBlock: string;
  mobileMove?: { x: number; z: number };
  mobileJump?: boolean;
  sensitivity?: number;
  fov?: number;
  renderDistance?: number;
  invertY?: boolean;
  autoJump?: boolean;
}

const VoxelWorld: React.FC<VoxelWorldProps> = ({ 
  activeBlock, 
  mobileMove = { x: 0, z: 0 }, 
  mobileJump = false,
  sensitivity = 0.8,
  fov = 75,
  renderDistance = 60,
  invertY = false,
  autoJump = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const activeBlockRef = useRef(activeBlock);
  const settingsRef = useRef({ sensitivity, fov, renderDistance, invertY, autoJump });
  const controlsRef = useRef<PointerLockControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    activeBlockRef.current = activeBlock;
  }, [activeBlock]);

  useEffect(() => {
    settingsRef.current = { sensitivity, fov, renderDistance, invertY, autoJump };
    
    // Atualizar câmera e névoa em tempo real se a cena existir
    if (cameraRef.current) {
      cameraRef.current.fov = fov;
      cameraRef.current.updateProjectionMatrix();
    }
    if (sceneRef.current) {
      sceneRef.current.fog = new THREE.FogExp2(0x87CEEB, 1 / renderDistance);
    }
  }, [sensitivity, fov, renderDistance, invertY, autoJump]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, 1 / renderDistance);

    const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new PointerLockControls(camera, renderer.domElement);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xfff7e6, 1.2);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    scene.add(sunLight);

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const getMat = (color: number, transparent = false, opacity = 1) => 
      new THREE.MeshStandardMaterial({ color, roughness: 0.8, transparent, opacity });

    const materials: { [key: string]: THREE.Material } = {
      grass: getMat(0x4d7c0f),
      dirt: getMat(0x8b4513),
      stone: getMat(0x808080),
      wood: getMat(0x5d4037),
      leaf: getMat(0x2e7d32),
      sand: getMat(0xffd700),
      snow: getMat(0xffffff),
      water: getMat(0x0ea5e9, true, 0.6),
      cactus: getMat(0x15803d),
      cloud: getMat(0xffffff, true, 0.8),
    };

    const addBlock = (x: number, y: number, z: number, type: string) => {
      const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
      if (worldRef.current[key]) return;
      const mesh = new THREE.Mesh(boxGeo, materials[type] || materials.stone);
      mesh.position.set(x, y, z);
      if (type !== 'water' && type !== 'cloud') {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
      scene.add(mesh);
      worldRef.current[key] = mesh;
    };

    const noise = (x: number, z: number) => {
      return (
        Math.sin(x * 0.1) * Math.sin(z * 0.1) * 4 + 
        Math.sin(x * 0.05) * Math.cos(z * 0.05) * 8 +
        Math.sin(x * 0.2) * Math.sin(z * 0.2) * 2
      );
    };

    const SEA_LEVEL = -1;
    const CLOUD_HEIGHT = 25;
    const WORLD_RADIUS = 40;

    for (let x = -WORLD_RADIUS; x < WORLD_RADIUS; x++) {
      for (let z = -WORLD_RADIUS; z < WORLD_RADIUS; z++) {
        const height = Math.floor(noise(x, z));
        let topBlock = 'grass';
        if (height > 6) topBlock = 'snow';
        else if (height < 0) topBlock = 'sand';
        
        const isDesert = Math.sin(x * 0.05) + Math.cos(z * 0.05) > 1.2;
        if (isDesert && height < 5) topBlock = 'sand';

        addBlock(x, height, z, topBlock);
        addBlock(x, height - 1, z, height < 0 ? 'sand' : 'dirt');
        for (let y = height - 2; y > height - 6; y--) addBlock(x, y, z, 'stone');

        if (height < SEA_LEVEL) {
          for (let y = height + 1; y <= SEA_LEVEL; y++) addBlock(x, y, z, 'water');
        }

        if (height >= 0 && height < 6 && !isDesert && Math.random() < 0.015) {
          const trunk = 3 + Math.floor(Math.random() * 3);
          for (let ty = 1; ty <= trunk; ty++) addBlock(x, height + ty, z, 'wood');
          for (let lx = -2; lx <= 2; lx++) {
            for (let lz = -2; lz <= 2; lz++) {
              for (let ly = 0; ly <= 2; ly++) {
                if (Math.abs(lx) + Math.abs(lz) + Math.abs(ly) < 4) 
                  addBlock(x + lx, height + trunk + ly, z + lz, 'leaf');
              }
            }
          }
        } else if (isDesert && height >= 0 && Math.random() < 0.01) {
          const cHeight = 2 + Math.floor(Math.random() * 2);
          for (let cy = 1; cy <= cHeight; cy++) addBlock(x, height + cy, z, 'cactus');
        }

        if (Math.random() < 0.005) {
          const cSize = 2 + Math.floor(Math.random() * 3);
          for (let cx = 0; cx < cSize; cx++) {
            for (let cz = 0; cz < cSize; cz++) {
              addBlock(x + cx, CLOUD_HEIGHT + Math.sin(cx) * 0.5, z + cz, 'cloud');
            }
          }
        }
      }
    }

    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    const velocity = new THREE.Vector3();
    const moveState = { w: false, a: false, s: false, d: false, space: false };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.code.toLowerCase().replace('key', '');
      if (k in moveState) (moveState as any)[k] = true;
      if (e.code === 'Space') moveState.space = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.code.toLowerCase().replace('key', '');
      if (k in moveState) (moveState as any)[k] = false;
      if (e.code === 'Space') moveState.space = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const touchState = { isTouching: false, lastX: 0, lastY: 0 };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches[0].pageX > window.innerWidth / 2) {
        touchState.isTouching = true;
        touchState.lastX = e.touches[0].pageX;
        touchState.lastY = e.touches[0].pageY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touchState.isTouching) return;
      const touch = e.touches[0];
      const deltaX = touch.pageX - touchState.lastX;
      const deltaY = touch.pageY - touchState.lastY;
      const sens = 0.004 * settingsRef.current.sensitivity;
      
      camera.rotation.y -= deltaX * sens;
      // Suporte para Invert Y
      const pitchDir = settingsRef.current.invertY ? 1 : -1;
      camera.rotation.x = Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, camera.rotation.x + (deltaY * sens * pitchDir)));
      
      touchState.lastX = touch.pageX;
      touchState.lastY = touch.pageY;
    };
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', () => touchState.isTouching = false);

    const performRaycast = (isPlace: boolean) => {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
      const objects = Object.values(worldRef.current);
      const intersects = raycaster.intersectObjects(objects);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        if (navigator.vibrate) navigator.vibrate(20);
        
        if (!isPlace) {
          const obj = intersect.object as THREE.Mesh;
          scene.remove(obj);
          delete worldRef.current[`${Math.round(obj.position.x)},${Math.round(obj.position.y)},${Math.round(obj.position.z)}`];
        } else {
          const pos = intersect.object.position.clone().add(intersect.face!.normal);
          addBlock(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z), activeBlockRef.current);
        }
      }
    };
    (window as any).performAction = performRaycast;

    let lastTime = performance.now();
    const animate = () => {
      requestAnimationFrame(animate);
      const time = performance.now();
      const delta = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      const isLocked = controls.isLocked || ('ontouchstart' in window);
      if (isLocked) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        
        if (camera.position.y > 15) velocity.y -= 30.0 * delta;
        else velocity.y = Math.max(0, velocity.y);

        const dirZ = (Number(moveState.w) - Number(moveState.s)) || -mobileMove.z;
        const dirX = (Number(moveState.d) - Number(moveState.a)) || mobileMove.x;
        const speed = 120.0;

        if (dirZ !== 0) velocity.z -= dirZ * speed * delta;
        if (dirX !== 0) velocity.x -= dirX * speed * delta;
        
        if (mobileJump || moveState.space) {
          if (camera.position.y < 30) velocity.y += 10;
        }

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        camera.position.y += velocity.y * delta;
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [mobileMove, mobileJump]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="size-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)] opacity-80"></div>
        <div className="absolute size-4 border border-white/20 rounded-full"></div>
      </div>
    </div>
  );
};

export default VoxelWorld;
