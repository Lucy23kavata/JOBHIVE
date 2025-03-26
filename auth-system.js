// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Form Validation Functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    // Password must be at least 8 characters long and contain at least one number and one letter
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
}

function validateName(name) {
    return name.length >= 2 && name.length <= 50;
}

function validateConfirmPassword(password, confirmPassword) {
    return password === confirmPassword;
}

// Show Error Message
function showError(element, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    element.parentNode.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Login Form Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // Validation
    if (!validateEmail(email)) {
        showError(emailInput, 'Please enter a valid email address');
        return;
    }

    if (!validatePassword(password)) {
        showError(passwordInput, 'Password must be at least 8 characters long and contain at least one number and one letter');
        return;
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Check user type and redirect accordingly
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.type === 'employer') {
                // Check if employer exists in employers collection
                const employerDoc = await db.collection('employers').doc(user.uid).get();
                if (employerDoc.exists) {
                    window.location.href = 'employer-dashboard.html';
                } else {
                    showError(emailInput, 'Employer account not found');
                    await auth.signOut();
                }
            } else {
                window.location.href = 'jobseeker-dashboard.html';
            }
        }
    } catch (error) {
        let errorMessage = 'Login failed. Please try again.';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
        }
        showError(emailInput, errorMessage);
    }
});

// Register Form Handler
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('registerName');
    const emailInput = document.getElementById('registerEmail');
    const passwordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('registerConfirmPassword');
    const userTypeSelect = document.getElementById('userType');
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const userType = userTypeSelect.value;

    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // Validation
    if (!validateName(name)) {
        showError(nameInput, 'Name must be between 2 and 50 characters');
        return;
    }

    if (!validateEmail(email)) {
        showError(emailInput, 'Please enter a valid email address');
        return;
    }

    if (!validatePassword(password)) {
        showError(passwordInput, 'Password must be at least 8 characters long and contain at least one number and one letter');
        return;
    }

    if (!validateConfirmPassword(password, confirmPassword)) {
        showError(confirmPasswordInput, 'Passwords do not match');
        return;
    }

    if (!userType) {
        showError(userTypeSelect, 'Please select an account type');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Create user document in users collection
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            type: userType,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Create profile based on user type
        if (userType === 'employer') {
            await db.collection('employers').doc(user.uid).set({
                companyName: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            });
            window.location.href = 'employer-dashboard.html';
        } else {
            await db.collection('jobseekers').doc(user.uid).set({
                fullName: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            });
            window.location.href = 'jobseeker-dashboard.html';
        }
    } catch (error) {
        let errorMessage = 'Registration failed. Please try again.';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'An account with this email already exists.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Registration is currently disabled.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak.';
                break;
        }
        showError(emailInput, errorMessage);
    }
});

// Check Authentication State
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        // Add logout button
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons && !authButtons.querySelector('.logout-btn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'btn logout-btn';
            logoutBtn.textContent = 'Logout';
            logoutBtn.onclick = () => auth.signOut();
            authButtons.appendChild(logoutBtn);
        }
    } else {
        // User is signed out
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) logoutBtn.remove();
    }
}); 