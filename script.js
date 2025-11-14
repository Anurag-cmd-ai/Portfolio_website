/**
 * ===================================================================
 * 3D BACKGROUND ANIMATION (THREE.JS)
 * ===================================================================
 * This section initializes a 3D particle field background.
 */

// Import Three.js (assuming it's loaded from the HTML)
const THREE = window.THREE;

let scene, camera, renderer, particles, group;

function init3DBackground() {
    try {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) {
            console.error("3D Canvas not found.");
            return;
        }

        // 1. Scene
        scene = new THREE.Scene();

        // 2. Camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 15; // Move camera back

        // 3. Renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true // Use alpha for a transparent background
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimize for retina
        renderer.setClearColor(0x0A192F, 1); // Set background to Navy

        // 4. Create Particles
        group = new THREE.Group();
        const particleCount = 500;
        const geometry = new THREE.OctahedronGeometry(0.1, 0); // Small octahedrons
        
        // Amber material
        const material = new THREE.MeshStandardMaterial({
            color: 0xF59E0B, // Amber 500
            metalness: 0.1,
            roughness: 0.5
        });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            
            // Random position in a large box
            const [x, y, z] = [
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50
            ];
            particle.position.set(x, y, z);
            
            // Random rotation
            particle.rotation.set(Math.random() * Math.PI, Math.react, Math.random() * Math.PI);
            
            // Random scale
            const scale = Math.random() * 0.5 + 0.5;
            particle.scale.set(scale, scale, scale);
            
            group.add(particle);
        }
        scene.add(group);
        
        // 5. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        // 6. Handle Window Resize
        window.addEventListener('resize', onWindowResize, false);
        
        // 7. Start Animation
        animate();

    } catch (error) {
        console.error("Error initializing 3D background:", error);
        // Hide canvas if it fails
        if (document.getElementById('bg-canvas')) {
            document.getElementById('bg-canvas').style.display = 'none';
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function animate() {
    requestAnimationFrame(animate);
    
    // Rotate the particle group
    if (group) {
        group.rotation.x += 0.0005;
        group.rotation.y += 0.0005;
    }
    
    renderer.render(scene, camera);
}

// Initialize the 3D background as soon as the script runs
init3DBackground();


/**
 * ===================================================================
 * FIREBASE & UI SCRIPT
 * ===================================================================
 * This section handles Firebase setup and general UI interactions.
 */

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Firebase Config and Initialization ---
// IMPORTANT: These variables are injected by the environment.
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let db, auth, userId;

async function initializeFirebase() {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        // Sign in
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }

        userId = auth.currentUser?.uid || `anon-${crypto.randomUUID()}`;
        
        // Update the user ID display in the footer
        const userIdDisplay = document.getElementById('user-id-display');
        if (userIdDisplay) {
            userIdDisplay.textContent = `User ID: ${userId}`;
        }

    } catch (error) {
        console.error("Firebase Initialization Error:", error);
        const userIdDisplay = document.getElementById('user-id-display');
        if (userIdDisplay) {
            userIdDisplay.textContent = "Firebase failed to load.";
        }
    }
}

// --- UI Event Listeners (Run on DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Mobile Menu Toggle Logic
    const menuButton = document.getElementById('menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Hide mobile menu when a link is clicked
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    // Smooth Scrolling (for internal links)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href').length > 1) {
                e.preventDefault();
                const targetElement = document.querySelector(this.getAttribute('href'));
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Contact Form Submission Handler
    const contactForm = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');
    const submitButton = contactForm ? contactForm.querySelector('button[type="submit"]') : null;

    if (contactForm && formMessage && submitButton) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Ensure Firebase is ready
            if (!db || !userId) {
                formMessage.textContent = 'Error: Connection not established. Please refresh.';
                formMessage.className = 'mt-4 text-center text-red-400 text-sm font-medium';
                return;
            }

            // 1. Get form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;

            // 2. Update UI to show loading
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `<span classclass="animate-spin mr-2">...</span>Sending...`;
            formMessage.className = 'mt-4 text-center text-yellow-400 text-sm font-medium';
            formMessage.textContent = 'Submitting message...';

            try {
                // 3. Save to Firestore (Private to the user)
                const collectionPath = `/artifacts/${appId}/users/${userId}/contact_messages`;
                await addDoc(collection(db, collectionPath), {
                    name: name,
                    email: email,
                    message: message,
                    createdAt: serverTimestamp(),
                    status: "new"
                });
                
                // 4. Mock email forwarding (client-side)
                // In a real app, this would be a cloud function.
                // We'll simulate it for the UI.
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
                const emailStatus = "success"; // Assume success
                
                // 5. Handle submission result
                if (emailStatus === "success") {
                    formMessage.className = 'mt-4 text-center text-green-400 text-sm font-medium';
                    formMessage.textContent = `Thanks for your response, ${name}! Your message has been saved and forwarded.`;
                    contactForm.reset();
                } else {
                    throw new Error("Mock email forwarding failed.");
                }

            } catch (error) {
                console.error("Form Submission Error:", error);
                formMessage.className = 'mt-4 text-center text-red-400 text-sm font-medium';
                formMessage.textContent = 'An error occurred. Please try again later.';
            } finally {
                // 6. Restore button
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }
})();


// Initialize Firebase as soon as the script loads
initializeFirebase();