// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyALdV9ONs-eFKTJNWs2DdRPfPmzyy3AePA",
    authDomain: "jobhive-5f3ae.firebaseapp.com",
    projectId: "jobhive-5f3ae",
    storageBucket: "jobhive-5f3ae.firebasestorage.app",
    messagingSenderId: "256367707577",
    appId: "1:256367707577:web:506c8c5f7d5c29d1abe268",
    measurementId: "G-ESGTXJMLJ4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// DOM Elements
const navLinks = document.querySelectorAll('.nav-links a[data-section]');
const sections = document.querySelectorAll('.dashboard-section');
const logoutBtn = document.getElementById('logoutBtn');
const postJobForm = document.getElementById('postJobForm');
const profileForm = document.getElementById('profileForm');
const jobStatusFilter = document.getElementById('jobStatusFilter');
const jobSearch = document.getElementById('jobSearch');
const applicationStatusFilter = document.getElementById('applicationStatusFilter');
const jobFilter = document.getElementById('jobFilter');

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = link.getAttribute('data-section');
        
        // Update active states
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetSection) {
                section.classList.add('active');
            }
        });
    });
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Error logging out. Please try again.');
    }
});

// Post Job Form
postJobForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const jobData = {
        title: document.getElementById('jobTitle').value,
        type: document.getElementById('jobType').value,
        location: document.getElementById('location').value,
        salary: document.getElementById('salary').value,
        requiredEducation: document.getElementById('requiredEducation').value,
        description: document.getElementById('description').value,
        requirements: document.getElementById('requirements').value,
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        employerId: auth.currentUser.uid
    };

    try {
        await db.collection('jobs').add(jobData);
        alert('Job posted successfully!');
        postJobForm.reset();
        loadJobs(); // Refresh jobs list
        updateDashboardStats(); // Update dashboard stats
    } catch (error) {
        console.error('Error posting job:', error);
        alert('Error posting job. Please try again.');
    }
});

// Profile Form
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const profileData = {
        companyName: document.getElementById('companyName').value,
        industry: document.getElementById('industry').value,
        companySize: document.getElementById('companySize').value,
        description: document.getElementById('companyDescription').value,
        website: document.getElementById('website').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        // Handle logo upload if selected
        const logoFile = document.getElementById('logo').files[0];
        if (logoFile) {
            const storageRef = storage.ref(`company-logos/${auth.currentUser.uid}`);
            await storageRef.put(logoFile);
            const logoUrl = await storageRef.getDownloadURL();
            profileData.logo = logoUrl;
        }

        await db.collection('employers').doc(auth.currentUser.uid).set(profileData, { merge: true });
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile. Please try again.');
    }
});

// Load Jobs
async function loadJobs() {
    const jobsList = document.getElementById('manageJobsList');
    jobsList.innerHTML = '';

    try {
        const snapshot = await db.collection('jobs')
            .where('employerId', '==', auth.currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();

        snapshot.forEach(doc => {
            const job = doc.data();
            const jobCard = createJobCard(doc.id, job);
            jobsList.appendChild(jobCard);
        });
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

// Create Job Card
function createJobCard(jobId, job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
        <h3>${job.title}</h3>
        <p class="company">${job.company || 'Your Company'}</p>
        <p class="location">${job.location}</p>
        <p class="type">${job.type}</p>
        <p class="salary">${job.salary}</p>
        <p class="status">Status: ${job.status}</p>
        <div class="job-actions">
            <button onclick="editJob('${jobId}')" class="btn">Edit</button>
            <button onclick="deleteJob('${jobId}')" class="btn btn-danger">Delete</button>
        </div>
    `;
    return card;
}

// Load Applications
async function loadApplications() {
    const applicationsList = document.getElementById('applicationsList');
    applicationsList.innerHTML = '';

    try {
        const snapshot = await db.collection('applications')
            .where('employerId', '==', auth.currentUser.uid)
            .orderBy('appliedAt', 'desc')
            .get();

        snapshot.forEach(doc => {
            const application = doc.data();
            const applicationCard = createApplicationCard(doc.id, application);
            applicationsList.appendChild(applicationCard);
        });
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Create Application Card
function createApplicationCard(applicationId, application) {
    const card = document.createElement('div');
    card.className = 'application-card';
    card.innerHTML = `
        <div class="candidate-name">${application.candidateName}</div>
        <div class="job-title">${application.jobTitle}</div>
        <div class="status ${application.status}">${application.status}</div>
        <div class="application-actions">
            <button onclick="viewApplication('${applicationId}')" class="btn">View Details</button>
            <button onclick="updateApplicationStatus('${applicationId}', 'shortlisted')" class="btn">Shortlist</button>
            <button onclick="updateApplicationStatus('${applicationId}', 'rejected')" class="btn btn-danger">Reject</button>
        </div>
    `;
    return card;
}

// Update Dashboard Stats
async function updateDashboardStats() {
    try {
        const jobsSnapshot = await db.collection('jobs')
            .where('employerId', '==', auth.currentUser.uid)
            .get();

        const applicationsSnapshot = await db.collection('applications')
            .where('employerId', '==', auth.currentUser.uid)
            .get();

        const activeJobs = jobsSnapshot.docs.filter(doc => doc.data().status === 'active').length;
        const totalApplications = applicationsSnapshot.size;
        const shortlistedCount = applicationsSnapshot.docs.filter(doc => doc.data().status === 'shortlisted').length;

        document.getElementById('activeJobsCount').textContent = activeJobs;
        document.getElementById('totalApplications').textContent = totalApplications;
        document.getElementById('shortlistedCount').textContent = shortlistedCount;
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Load Recent Activity
async function loadRecentActivity() {
    const activityList = document.getElementById('recentActivityList');
    activityList.innerHTML = '';

    try {
        const applicationsSnapshot = await db.collection('applications')
            .where('employerId', '==', auth.currentUser.uid)
            .orderBy('appliedAt', 'desc')
            .limit(5)
            .get();

        applicationsSnapshot.forEach(doc => {
            const application = doc.data();
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <p>${application.candidateName} applied for ${application.jobTitle}</p>
                <small>${application.appliedAt.toDate().toLocaleDateString()}</small>
            `;
            activityList.appendChild(activityItem);
        });
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        // Load initial data
        loadJobs();
        loadApplications();
        updateDashboardStats();
        loadRecentActivity();

        // Load employer profile
        db.collection('employers').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('companyName').value = data.companyName || '';
                document.getElementById('industry').value = data.industry || '';
                document.getElementById('companySize').value = data.companySize || '';
                document.getElementById('companyDescription').value = data.description || '';
                document.getElementById('website').value = data.website || '';
            }
        });
    });

    // Filter event listeners
    jobStatusFilter.addEventListener('change', loadJobs);
    jobSearch.addEventListener('input', loadJobs);
    applicationStatusFilter.addEventListener('change', loadApplications);
    jobFilter.addEventListener('change', loadApplications);
}); 