

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNpY2TBvcUG8k8At8OXf16ZdpOyfSuV1Q",
  authDomain: "jobhive-kenya.firebaseapp.com",
  projectId: "jobhive-kenya",
  storageBucket: "jobhive-kenya.firebasestorage.app",
  messagingSenderId: "488147181865",
  appId: "1:488147181865:web:02b8a6abf43a21736ad738",
  measurementId: "G-K8JFZN0KK7"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
