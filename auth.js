// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCNpY2TBvcUG8k8At8OXf16ZdpOyfSuV1Q",
    authDomain: "jobhive-kenya.firebaseapp.com",
    projectId: "jobhive-kenya",
    sstorageBucket: "jobhive-kenya.appspot.com",
    messagingSenderId: "488147181865",
    appId: "1:488147181865:web:02b8a6abf43a21736ad738",
    measurementId: "G-K8JFZN0KK7"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get DOM elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const authButtons = document.querySelector('.auth-buttons');
const closeBtns = document.querySelectorAll('.close');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Helper Functions
const showError = (element, message) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    element.parentNode.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
};

const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = password => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
const validateCompanyName = name => name.length >= 2 && name.length <= 50;

// Modal Handling
const openModal = (modal) => {
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
};

const closeModal = (modal) => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
};

loginBtn?.addEventListener("click", () => openModal(loginModal));
registerBtn?.addEventListener("click", () => openModal(registerModal));
showRegister?.addEventListener("click", (e) => { e.preventDefault(); closeModal(loginModal); openModal(registerModal); });
showLogin?.addEventListener("click", (e) => { e.preventDefault(); closeModal(registerModal); openModal(loginModal); });
closeBtns.forEach(btn => btn.addEventListener("click", () => { closeModal(loginModal); closeModal(registerModal); }));
window.addEventListener("click", (e) => { if (e.target === loginModal) closeModal(loginModal); if (e.target === registerModal) closeModal(registerModal); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(loginModal); closeModal(registerModal); }});

// Authentication State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginBtn?.style.display = 'none';
        registerBtn?.style.display = 'none';
        addLogoutButton();
    } else {
        loginBtn?.style.display = 'block';
        registerBtn?.style.display = 'block';
        removeLogoutButton();
    }
});

// Login Handler
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="email"]').value.trim();
    const password = loginForm.querySelector('input[type="password"]').value;
    
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    if (!validateEmail(email)) return showError(loginForm, "Invalid email format.");
    if (!validatePassword(password)) return showError(loginForm, "Weak password: Minimum 8 characters, 1 letter & 1 number.");

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        if (userDoc.exists()) {
            window.location.href = userDoc.data().type === "employer" ? "employer-dashboard.html" : "jobseeker-dashboard.html";
        }
    } catch (error) {
        showError(loginForm, "Login failed. Check credentials.");
    }
});

// Register Handler
registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const companyName = registerForm.querySelector('input[type="text"]').value.trim();
    const email = registerForm.querySelector('input[type="email"]').value.trim();
    const password = registerForm.querySelector('input[type="password"]').value;
    const userType = registerForm.querySelector('select').value;

    document.querySelectorAll('.error-message').forEach(el => el.remove());
    if (!validateCompanyName(companyName)) return showError(registerForm, "Company name must be 2-50 characters.");
    if (!validateEmail(email)) return showError(registerForm, "Invalid email format.");
    if (!validatePassword(password)) return showError(registerForm, "Weak password: Minimum 8 characters, 1 letter & 1 number.");
    if (!userType) return showError(registerForm, "Select an account type.");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), { name: companyName, email, type: userType, createdAt: new Date() });
        if (userType === "employer") await setDoc(doc(db, "employers", userCredential.user.uid), { companyName, email, createdAt: new Date() });
        window.location.href = userType === "employer" ? "employer-dashboard.html" : "jobseeker-dashboard.html";
    } catch (error) {
        showError(registerForm, "Registration failed. Try again.");
    }
});

// Logout Handler
const addLogoutButton = () => {
    if (!document.getElementById("logoutBtn")) {
        const logoutBtn = document.createElement("button");
        logoutBtn.id = "logoutBtn";
        logoutBtn.className = "btn";
        logoutBtn.textContent = "Logout";
        logoutBtn.onclick = () => signOut(auth);
        authButtons.appendChild(logoutBtn);
    }
};

const removeLogoutButton = () => {
    document.getElementById("logoutBtn")?.remove();
};
