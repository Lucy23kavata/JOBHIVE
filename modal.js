// Get DOM elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const closeBtns = document.getElementsByClassName('close');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');

// Open modal functions
function openLoginModal(e) {
    if (e) e.preventDefault();
    if (loginModal) {
        loginModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }
}

function openRegisterModal(e) {
    if (e) e.preventDefault();
    if (registerModal) {
        registerModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }
}

// Close modal functions
function closeLoginModal() {
    if (loginModal) {
        loginModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling when modal is closed
    }
}

function closeRegisterModal() {
    if (registerModal) {
        registerModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling when modal is closed
    }
}

// Event listeners
if (loginBtn) {
    loginBtn.addEventListener('click', openLoginModal);
}

if (registerBtn) {
    registerBtn.addEventListener('click', openRegisterModal);
}

if (showRegister) {
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        closeLoginModal();
        openRegisterModal();
    });
}

if (showLogin) {
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        closeRegisterModal();
        openLoginModal();
    });
}

// Close modals when clicking the close button
Array.from(closeBtns).forEach(btn => {
    btn.addEventListener('click', () => {
        closeLoginModal();
        closeRegisterModal();
    });
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) closeLoginModal();
    if (e.target === registerModal) closeRegisterModal();
});

// Close modal when pressing Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLoginModal();
        closeRegisterModal();
    }
}); 