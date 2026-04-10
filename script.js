import * as THREE from 'three';

// --------------------------------------------------------
// GSAP Scroll Animations Setup
// --------------------------------------------------------
gsap.registerPlugin(ScrollTrigger);

// Animate elements with .fade-up class as they scroll into view
gsap.utils.toArray('.fade-up').forEach(element => {
    gsap.to(element, {
        scrollTrigger: {
            trigger: element,
            start: "top 85%", // Trigger when top of element hits 85% of viewport
            toggleActions: "play none none reverse" // Play on scroll down, reverse on scroll up
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
    });
});

// --------------------------------------------------------
// Three.js Scene Setup
// --------------------------------------------------------
const scene = new THREE.Scene();
// No fog, deep dark space illusion
scene.fog = new THREE.FogExp2(0x020202, 0.015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 30);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // optimize pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight);

// --------------------------------------------------------
// Geometry Construction
// --------------------------------------------------------
// 1. The Main Abstract Shape
const mainShapeGroup = new THREE.Group();

const torusGeo = new THREE.TorusKnotGeometry(10, 2, 100, 16);
const torusMat = new THREE.MeshStandardMaterial({
    color: 0x00f2ff,
    wireframe: true,
    transparent: true,
    opacity: 0.3
});
const abstractShape = new THREE.Mesh(torusGeo, torusMat);
mainShapeGroup.add(abstractShape);

// A Solid core inside
const coreGeo = new THREE.IcosahedronGeometry(6, 0);
const coreMat = new THREE.MeshStandardMaterial({
    color: 0x00A0B0,
    flatShading: true,
    roughness: 0.2,
    metalness: 0.8
});
const solidCore = new THREE.Mesh(coreGeo, coreMat);
mainShapeGroup.add(solidCore);

scene.add(mainShapeGroup);

// 2. Floating Particles
const particlesGeo = new THREE.BufferGeometry();
const particlesCount = 1500;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 150;
}

particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({
    size: 0.1,
    color: 0x00f2ff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});
const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particlesMesh);

// --------------------------------------------------------
// Lighting
// --------------------------------------------------------
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0x00f2ff, 1, 100);
pointLight1.position.set(20, 20, 20);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x0a40d1, 1, 100);
pointLight2.position.set(-20, -20, -20);
scene.add(pointLight2);

// --------------------------------------------------------
// Interaction Logic (Mouse & Scroll)
// --------------------------------------------------------
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

// Mouse tracking
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Scroll tracking (Move the camera or the shape based on scroll)
function moveCamera() {
    const t = document.documentElement.scrollTop || document.body.scrollTop;

    // Rotate the shape as we scroll
    abstractShape.rotation.z = t * -0.001;
    abstractShape.rotation.x = t * 0.001;
    abstractShape.rotation.y = t * 0.001;

    // Optional: shift camera down slightly based on scroll
    camera.position.y = t * -0.01;
}

// Add scroll listener
window.addEventListener('scroll', moveCamera);

// --------------------------------------------------------
// Animation Loop
// --------------------------------------------------------
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // Constant slow rotation
    mainShapeGroup.rotation.y += 0.002;
    mainShapeGroup.rotation.x += 0.001;

    // Core pulsing effect
    solidCore.scale.setScalar(1 + Math.sin(time * 2) * 0.05);

    // Mouse parallax for the entire shape group
    targetX = mouseX * 0.5;
    targetY = mouseY * 0.5;

    mainShapeGroup.position.x += 0.05 * (targetX - mainShapeGroup.position.x);
    mainShapeGroup.position.y += 0.05 * (targetY - mainShapeGroup.position.y);

    // Particle subtle rotation
    particlesMesh.rotation.y += 0.0005;
    particlesMesh.rotation.x += 0.0002;

    renderer.render(scene, camera);
}

// --------------------------------------------------------
// Handle Window Resize
// --------------------------------------------------------
window.addEventListener('resize', () => {
    // If mobile, pull the camera back further to fit shape
    if (window.innerWidth < 768) {
        camera.position.z = 50;
    } else {
        camera.position.z = 30;
    }

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initial trigger for resize logic
window.dispatchEvent(new Event('resize'));

moveCamera();
animate();