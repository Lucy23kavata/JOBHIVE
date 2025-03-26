// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCNpY2TBvcUG8k8At8OXf16ZdpOyfSuV1Q",
    authDomain: "jobhive-kenya.firebaseapp.com",
    projectId: "jobhive-kenya",
    storageBucket: "jobhive-kenya.firebasestorage.app",
    messagingSenderId: "488147181865",
    appId: "1:488147181865:web:02b8a6abf43a21736ad738",
    measurementId: "G-K8JFZN0KK7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const analytics = firebase.analytics();

// Export Firebase services
window.auth = auth;
window.db = db;
window.storage = storage;
window.analytics = analytics; 