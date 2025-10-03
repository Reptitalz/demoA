
"use client";

import React, { useRef, useEffect, useCallback } from "react";
import * as THREE from 'three';

const PhoneCanvas = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentMount = mountRef.current;
    if (!currentMount) return;

    // --- Constantes de Diseño ---
    const PHONE_W = 1.8;
    const PHONE_H = PHONE_W * 2;
    const PHONE_D = 0.15;
    const SCREEN_INSET = 0.1;
    const CORNER_RADIUS = 0.2;

    // --- Constantes de Animación ---
    const DAMPING = 0.05;
    const SCROLL_SPEED = 0.0005;

    // --- Escena, Cámara y Renderizador ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    
    // --- Grupo para el teléfono ---
    const phoneGroup = new THREE.Group();
    scene.add(phoneGroup);
    
    // --- Iluminación ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // --- Crear el cuerpo del teléfono ---
    const phoneShape = new THREE.Shape();
    phoneShape.moveTo(-PHONE_W / 2 + CORNER_RADIUS, -PHONE_H / 2);
    phoneShape.lineTo(PHONE_W / 2 - CORNER_RADIUS, -PHONE_H / 2);
    phoneShape.quadraticCurveTo(PHONE_W / 2, -PHONE_H / 2, PHONE_W / 2, -PHONE_H / 2 + CORNER_RADIUS);
    phoneShape.lineTo(PHONE_W / 2, PHONE_H / 2 - CORNER_RADIUS);
    phoneShape.quadraticCurveTo(PHONE_W / 2, PHONE_H / 2, PHONE_W / 2 - CORNER_RADIUS, PHONE_H / 2);
    phoneShape.lineTo(-PHONE_W / 2 + CORNER_RADIUS, PHONE_H / 2);
    phoneShape.quadraticCurveTo(-PHONE_W / 2, PHONE_H / 2, -PHONE_W / 2, PHONE_H / 2 - CORNER_RADIUS);
    phoneShape.lineTo(-PHONE_W / 2, -PHONE_H / 2 + CORNER_RADIUS);
    phoneShape.quadraticCurveTo(-PHONE_W / 2, -PHONE_H / 2, -PHONE_W / 2 + CORNER_RADIUS, -PHONE_H / 2);

    const extrudeSettings = { depth: PHONE_D, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 };
    const phoneGeometry = new THREE.ExtrudeGeometry(phoneShape, extrudeSettings);
    const phoneMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.3 });
    const phoneMesh = new THREE.Mesh(phoneGeometry, phoneMaterial);
    phoneMesh.position.z = -PHONE_D / 2;
    phoneGroup.add(phoneMesh);
    
    // --- Crear la pantalla ---
    const screenW = PHONE_W - SCREEN_INSET * 2;
    const screenH = PHONE_H - SCREEN_INSET * 2;
    const screenCornerRadius = CORNER_RADIUS * 0.8;
    
    const screenShape = new THREE.Shape();
    screenShape.moveTo(-screenW / 2 + screenCornerRadius, -screenH / 2);
    screenShape.lineTo(screenW / 2 - screenCornerRadius, -screenH / 2);
    screenShape.quadraticCurveTo(screenW / 2, -screenH / 2, screenW / 2, -screenH / 2 + screenCornerRadius);
    screenShape.lineTo(screenW / 2, screenH / 2 - screenCornerRadius);
    screenShape.quadraticCurveTo(screenW / 2, screenH / 2, screenW / 2 - screenCornerRadius, screenH / 2);
    screenShape.lineTo(-screenW / 2 + screenCornerRadius, screenH / 2);
    screenShape.quadraticCurveTo(-screenW / 2, screenH / 2, -screenW / 2, screenH / 2 - screenCornerRadius);
    screenShape.lineTo(-screenW / 2, -screenH / 2 + screenCornerRadius);
    screenShape.quadraticCurveTo(-screenW / 2, -screenH / 2, -screenW / 2 + screenCornerRadius, -screenH / 2);

    const screenGeometry = new THREE.ShapeGeometry(screenShape);
    const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
    screenMesh.position.z = (PHONE_D / 2) + 0.001;
    phoneGroup.add(screenMesh);
    
    // --- Variables de animación ---
    let lastTime = 0;
    let targetRotationY = 0;
    let targetRotationX = 0;

    function animate(time: number) {
      animationFrameId = requestAnimationFrame(animate);
      const deltaTime = time - lastTime;
      lastTime = time;

      // Movimiento flotante
      const floatSpeed = 0.0005;
      const floatHeight = 0.1;
      phoneGroup.position.y = Math.sin(time * floatSpeed) * floatHeight;

      // Amortiguación de rotación
      phoneGroup.rotation.y += (targetRotationY - phoneGroup.rotation.y) * DAMPING;
      phoneGroup.rotation.x += (targetRotationX - phoneGroup.rotation.x) * DAMPING;

      renderer.render(scene, camera);
    }
    
    let animationFrameId = animate(0);

    const onWindowResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // --- Manejo de Eventos ---
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const ROTATION_SENSITIVITY = 0.005;

    const getClientCoordinates = (event: PointerEvent | TouchEvent) => {
        if (event instanceof TouchEvent) {
            return { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }
        return { x: event.clientX, y: event.clientY };
    };

    const onPointerDown = (event: PointerEvent | TouchEvent) => {
        isDragging = true;
        const coords = getClientCoordinates(event);
        previousMousePosition = { x: coords.x, y: coords.y };
    };

    const onPointerMove = (event: PointerEvent | TouchEvent) => {
        if (!isDragging) return;
        const coords = getClientCoordinates(event);
        const deltaX = coords.x - previousMousePosition.x;
        const deltaY = coords.y - previousMousePosition.y;

        targetRotationY += deltaX * ROTATION_SENSITIVITY;
        targetRotationX += deltaY * ROTATION_SENSITIVITY;
        
        targetRotationX = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, targetRotationX));

        previousMousePosition = { x: coords.x, y: coords.y };
    };

    const onPointerUp = () => {
        isDragging = false;
    };
    
    currentMount.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // --- Limpieza ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      currentMount.removeChild(renderer.domElement);
      window.removeEventListener('resize', onWindowResize);
      currentMount.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default PhoneCanvas;
