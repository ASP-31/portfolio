import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --------------------------------------------------------
// Smooth Scroll Setup (Lenis)
// --------------------------------------------------------
if (!prefersReducedMotion) {
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
}

// --------------------------------------------------------
// GSAP Scroll Animations Setup
// Safe when GSAP/CDN fails to load: content stays visible.
// --------------------------------------------------------
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);

    // Custom Cursor Logic
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');

    window.addEventListener('mousemove', (e) => {
        gsap.to(cursorDot, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.1,
            ease: 'power2.out'
        });
        gsap.to(cursorRing, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.3,
            ease: 'power2.out'
        });
    });

    // Cursor hover states
    const interactables = document.querySelectorAll('a, button, .project-card');
    interactables.forEach(el => {
        el.addEventListener('mouseenter', () => cursorRing.classList.add('active'));
        el.addEventListener('mouseleave', () => cursorRing.classList.remove('active'));
    });

    // Magnetic Buttons Logic
    const magneticBtns = document.querySelectorAll('.btn-primary, .btn-secondary');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distanceX = e.clientX - centerX;
            const distanceY = e.clientY - centerY;

            gsap.to(btn, {
                x: distanceX * 0.3,
                y: distanceY * 0.3,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    });

    // Journey Progress Line Animation
    gsap.fromTo('.progress-line',
        { scaleY: 0 },
        {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
                trigger: '.timeline',
                start: 'top 80%',
                end: 'bottom 20%',
                scrub: true
            }
        }
    );

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
    camera.position.set(0, 5, 30);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;

    // --------------------------------------------------------
    // Geometry Construction
    // --------------------------------------------------------
    const mainShapeGroup = new THREE.Group();

    // Morphing Organic Shape
    const organicGeo = new THREE.IcosahedronGeometry(8, 64);
    const organicMat = new THREE.MeshStandardMaterial({
        color: 0x00f2ff,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
        emissive: 0x00f2ff,
        emissiveIntensity: 0.5
    });
    const organicShape = new THREE.Mesh(organicGeo, organicMat);

    // Store original vertices for displacement
    const originalPositions = organicGeo.attributes.position.array.slice();

    mainShapeGroup.add(organicShape);

    // Digital Grid Floor
    const gridHelper = new THREE.GridHelper(100, 40, 0x7000ff, 0x222222);
    gridHelper.position.y = -15;
    scene.add(gridHelper);

    scene.add(mainShapeGroup);

    // Reactive Particles
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    const originArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 100;
        originArray[i] = posArray[i];
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
        size: 0.1,
        color: 0x00f2ff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    // --------------------------------------------------------
    // Lighting
    // --------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f2ff, 2, 100);
    pointLight1.position.set(20, 20, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x7000ff, 2, 100);
    pointLight2.position.set(-20, -20, -20);
    scene.add(pointLight2);

    // --------------------------------------------------------
    // Post-Processing (Bloom)
    // --------------------------------------------------------
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, 0.4, 0.85
    );
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.5;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

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
        mainShapeGroup.rotation.z = t * -0.001;
        mainShapeGroup.rotation.x = t * 0.001;
        mainShapeGroup.rotation.y = t * 0.001;
        camera.position.y = 5 - (t * 0.01);
    }

    window.addEventListener('scroll', moveCamera, { passive: true });

    // --------------------------------------------------------
    // Animation Loop
    // --------------------------------------------------------
    let renderId = null;
    let lastTime = 0;
    const clock = new THREE.Clock();

    function animate(time) {
        const delta = lastTime ? (time - lastTime) / 1000 : 0;
        lastTime = time;
        const elapsed = clock.getElapsedTime();

        // Organic Morphing (Vertex Displacement)
        const posAttr = organicGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const x = originalPositions[i * 3];
            const y = originalPositions[i * 3 + 1];
            const z = originalPositions[i * 3 + 2];

            const noise = Math.sin(x * 0.5 + elapsed) * 0.5 +
                          Math.cos(y * 0.5 + elapsed) * 0.5 +
                          Math.sin(z * 0.5 + elapsed) * 0.5;

            const factor = 1 + noise * 0.1;
            posAttr.setXYZ(i, x * factor, y * factor, z * factor);
        }
        posAttr.needsUpdate = true;

        mainShapeGroup.rotation.y += 0.002 * (delta * 60);
        mainShapeGroup.rotation.x += 0.001 * (delta * 60);

        targetX = mouseX * 0.5;
        targetY = mouseY * 0.5;
        mainShapeGroup.position.x += 0.05 * (targetX - mainShapeGroup.position.x);
        mainShapeGroup.position.y += 0.05 * (targetY - mainShapeGroup.position.y);

        // Reactive Particles (Repulsion)
        const pPosAttr = particlesGeo.attributes.position;
        for (let i = 0; i < particlesCount; i++) {
            const px = pPosAttr.getX(i);
            const py = pPosAttr.getY(i);
            const pz = pPosAttr.getZ(i);

            // Simplistic mouse repulsion
            const dx = px - (mouseX * 20);
            const dy = py - (mouseY * 20);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 10) {
                const force = (10 - dist) * 0.02;
                pPosAttr.setXYZ(
                    i,
                    px + dx * force,
                    py + dy * force,
                    pz
                );
            } else {
                // Drift back to origin
                const ox = originArray[i * 3];
                const oy = originArray[i * 3 + 1];
                const oz = originArray[i * 3 + 2];
                pPosAttr.setXYZ(
                    i,
                    px + (ox - px) * 0.01,
                    py + (oy - py) * 0.01,
                    pz + (oz - pz) * 0.01
                );
            }
        }
        pPosAttr.needsUpdate = true;
        particlesMesh.rotation.y += 0.0005;

        composer.render();
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

    window.addEventListener('resize', () => {
        if (window.innerWidth < 768) {
            camera.position.z = 50;
        } else {
            camera.position.z = 30;
        }

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    if (window.innerWidth < 768) camera.position.z = 50;

    moveCamera();
    if (prefersReducedMotion) {
        composer.render();
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
