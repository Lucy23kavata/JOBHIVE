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

// Authentication Functions
document.addEventListener('DOMContentLoaded', () => {
    // Get form elements
    const employerLoginForm = document.getElementById('employerLoginForm');
    const employerSignupForm = document.getElementById('employerSignupForm');

    // Employer Login Handler
    if (employerLoginForm) {
        employerLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = employerLoginForm.querySelector('#email').value;
            const password = employerLoginForm.querySelector('#password').value;

            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
                
                if (userDoc.exists && userDoc.data().type === 'employer') {
                    window.location.href = 'employer.html';
                } else {
                    alert('This account is not registered as an employer.');
                    await auth.signOut();
                }
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        });
    }

    // Employer Signup Handler
    if (employerSignupForm) {
        employerSignupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const companyName = employerSignupForm.querySelector('#companyName').value;
            const email = employerSignupForm.querySelector('#email').value;
            const password = employerSignupForm.querySelector('#password').value;
            const confirmPassword = employerSignupForm.querySelector('#confirmPassword').value;
            const location = employerSignupForm.querySelector('#location').value;
            const phone = employerSignupForm.querySelector('#phone').value;
            const website = employerSignupForm.querySelector('#website').value;
            const description = employerSignupForm.querySelector('#description').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await db.collection('users').doc(userCredential.user.uid).set({
                    companyName,
                    email,
                    type: 'employer',
                    location,
                    phone,
                    website,
                    description,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                window.location.href = 'employer.html';
            } catch (error) {
                alert('Registration failed: ' + error.message);
            }
        });
    }
});

// Jobseeker Registration Handler
document.addEventListener('DOMContentLoaded', function() {
    const jobseekerRegisterForm = document.getElementById('jobseekerRegisterForm');
    if (jobseekerRegisterForm) {
        jobseekerRegisterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const phone = document.getElementById('phone').value;
            const location = document.getElementById('location').value;
            const skills = document.getElementById('skills').value;
            const experience = document.getElementById('experience').value;
            const education = document.getElementById('education').value;

            // Clear previous errors
            clearErrors();

            // Validate passwords match
            if (password !== confirmPassword) {
                showError('confirmPasswordError', 'Passwords do not match');
                return;
            }

            try {
                // Create user account
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Create jobseeker profile in Firestore
                await setDoc(doc(db, "jobseekers", user.uid), {
                    fullName,
                    email,
                    phone,
                    location,
                    skills: skills.split(',').map(skill => skill.trim()),
                    experience,
                    education,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Redirect to jobseeker dashboard
                window.location.href = 'jobseeker-dashboard.html';
            } catch (error) {
                handleAuthError(error);
            }
        });
    }
});

// Helper function to clear all error messages
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
    });
}

// Helper function to show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

// Helper function to handle authentication errors
function handleAuthError(error) {
    let errorMessage = 'An error occurred during registration.';
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered. Please use a different email or login.';
            showError('emailError', errorMessage);
            break;
        case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            showError('emailError', errorMessage);
            break;
        case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters long.';
            showError('passwordError', errorMessage);
            break;
        default:
            console.error('Registration error:', error);
            alert(errorMessage);
    }
}
