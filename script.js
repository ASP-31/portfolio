import * as THREE from 'three';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --------------------------------------------------------
// GSAP Scroll Animations Setup
// Safe when GSAP/CDN fails to load: content stays visible.
// --------------------------------------------------------
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.fade-up').forEach(element => {
        gsap.from(element, {
            scrollTrigger: {
                trigger: element,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            opacity: 0,
            y: 40,
            duration: 0.8,
            ease: "power3.out"
        });
    });
}

// --------------------------------------------------------
// Three.js Scene Setup
// --------------------------------------------------------
const canvas = document.querySelector('#bg');
if (canvas && typeof THREE !== 'undefined') {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020202, 0.015);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 30);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // --------------------------------------------------------
    // Geometry Construction
    // --------------------------------------------------------
    const mainShapeGroup = new THREE.Group();

    const torusGeo = new THREE.TorusKnotGeometry(9, 2.2, 64, 8);
    const torusMat = new THREE.MeshStandardMaterial({
        color: 0x00f2ff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const abstractShape = new THREE.Mesh(torusGeo, torusMat);
    mainShapeGroup.add(abstractShape);

    const coreGeo = new THREE.IcosahedronGeometry(5.5, 0);
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
    const particlesCount = 1000;
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
    // Interaction Logic
    // --------------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    if (!prefersReducedMotion) {
        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    function moveCamera() {
        const t = window.scrollY;
        abstractShape.rotation.z = t * -0.001;
        abstractShape.rotation.x = t * 0.001;
        abstractShape.rotation.y = t * 0.001;
        camera.position.y = t * -0.01;
    }

    window.addEventListener('scroll', moveCamera, { passive: true });

    // --------------------------------------------------------
    // Animation Loop (skips motion when tab is hidden or user prefers reduced motion)
    // --------------------------------------------------------
    let renderId = null;
    let lastTime = 0;
    const clock = new THREE.Clock();

    function animate(time) {
        const delta = lastTime ? (time - lastTime) / 1000 : 0;
        lastTime = time;

        mainShapeGroup.rotation.y += 0.002 * (delta * 60);
        mainShapeGroup.rotation.x += 0.001 * (delta * 60);

        solidCore.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 2) * 0.05);

        targetX = mouseX * 0.5;
        targetY = mouseY * 0.5;
        mainShapeGroup.position.x += 0.05 * (targetX - mainShapeGroup.position.x);
        mainShapeGroup.position.y += 0.05 * (targetY - mainShapeGroup.position.y);

        particlesMesh.rotation.y += 0.0005;
        particlesMesh.rotation.x += 0.0002;

        renderer.render(scene, camera);
        renderId = requestAnimationFrame(animate);
    }

    function startRendering() {
        if (renderId === null && !prefersReducedMotion) {
            lastTime = 0;
            renderId = requestAnimationFrame(animate);
        }
    }

    function stopRendering() {
        if (renderId !== null) {
            cancelAnimationFrame(renderId);
            renderId = null;
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopRendering();
        else startRendering();
    });

    // --------------------------------------------------------
    // Handle Window Resize
    // --------------------------------------------------------
    window.addEventListener('resize', () => {
        if (window.innerWidth < 768) {
            camera.position.z = 50;
        } else {
            camera.position.z = 30;
        }

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Initial sizing
    if (window.innerWidth < 768) camera.position.z = 50;

    moveCamera();
    if (prefersReducedMotion) {
        // Render a single static frame so the 3D background still shows
        renderer.render(scene, camera);
    } else {
        startRendering();
    }
}

// --------------------------------------------------------
// Mobile Navigation Toggle
// --------------------------------------------------------
const navbar = document.querySelector('.navbar');
const navToggle = document.querySelector('.nav-toggle');

if (navbar && navToggle) {
    navToggle.addEventListener('click', () => {
        const open = navbar.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(open));
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navbar.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}
