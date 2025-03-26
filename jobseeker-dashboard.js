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
const resumeForm = document.getElementById('resumeForm');
const profileForm = document.getElementById('profileForm');
const jobSearch = document.getElementById('jobSearch');
const jobTypeFilter = document.getElementById('jobTypeFilter');
const locationFilter = document.getElementById('locationFilter');
const educationFilter = document.getElementById('educationFilter');
const applicationStatusFilter = document.getElementById('applicationStatusFilter');

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

// Resume Builder Functions
function addEducation() {
    const educationList = document.getElementById('educationList');
    const newEducation = document.createElement('div');
    newEducation.className = 'education-item';
    newEducation.innerHTML = `
        <div class="form-group">
            <label>Institution</label>
            <input type="text" name="institution" required>
        </div>
        <div class="form-group">
            <label>Degree</label>
            <input type="text" name="degree" required>
        </div>
        <div class="form-group">
            <label>Year</label>
            <input type="text" name="year" required>
        </div>
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">Remove</button>
    `;
    educationList.appendChild(newEducation);
}

function addExperience() {
    const experienceList = document.getElementById('experienceList');
    const newExperience = document.createElement('div');
    newExperience.className = 'experience-item';
    newExperience.innerHTML = `
        <div class="form-group">
            <label>Company</label>
            <input type="text" name="company" required>
        </div>
        <div class="form-group">
            <label>Position</label>
            <input type="text" name="position" required>
        </div>
        <div class="form-group">
            <label>Duration</label>
            <input type="text" name="duration" required>
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea name="description" required></textarea>
        </div>
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">Remove</button>
    `;
    experienceList.appendChild(newExperience);
}

// Resume Form Submission
resumeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const resumeData = {
        personalInfo: {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value
        },
        education: Array.from(document.querySelectorAll('.education-item')).map(item => ({
            institution: item.querySelector('[name="institution"]').value,
            degree: item.querySelector('[name="degree"]').value,
            year: item.querySelector('[name="year"]').value
        })),
        experience: Array.from(document.querySelectorAll('.experience-item')).map(item => ({
            company: item.querySelector('[name="company"]').value,
            position: item.querySelector('[name="position"]').value,
            duration: item.querySelector('[name="duration"]').value,
            description: item.querySelector('[name="description"]').value
        })),
        skills: document.getElementById('skills').value.split(',').map(skill => skill.trim()),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('resumes').doc(auth.currentUser.uid).set(resumeData, { merge: true });
        alert('Resume saved successfully!');
    } catch (error) {
        console.error('Error saving resume:', error);
        alert('Error saving resume. Please try again.');
    }
});

// Profile Form Submission
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const profileData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value,
        bio: document.getElementById('bio').value,
        skills: document.getElementById('skills').value.split(',').map(skill => skill.trim()),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        // Handle profile picture upload
        const profilePicture = document.getElementById('profilePicture').files[0];
        if (profilePicture) {
            const storageRef = storage.ref(`profile-pictures/${auth.currentUser.uid}`);
            await storageRef.put(profilePicture);
            const pictureUrl = await storageRef.getDownloadURL();
            profileData.profilePicture = pictureUrl;
        }

        // Handle resume upload
        const resumeFile = document.getElementById('resume').files[0];
        if (resumeFile) {
            const storageRef = storage.ref(`resumes/${auth.currentUser.uid}`);
            await storageRef.put(resumeFile);
            const resumeUrl = await storageRef.getDownloadURL();
            profileData.resumeUrl = resumeUrl;
        }

        await db.collection('jobseekers').doc(auth.currentUser.uid).set(profileData, { merge: true });
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile. Please try again.');
    }
});

// Job Search Functions
async function searchJobs() {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';

    const searchTerm = jobSearch.value.toLowerCase();
    const jobType = jobTypeFilter.value;
    const location = locationFilter.value;
    const education = educationFilter.value;

    try {
        let query = db.collection('jobs').where('status', '==', 'active');

        if (jobType) query = query.where('type', '==', jobType);
        if (location) query = query.where('location', '==', location);
        if (education) query = query.where('requiredEducation', '==', education);

        const snapshot = await query.get();
        
        snapshot.forEach(doc => {
            const job = doc.data();
            if (searchTerm && 
                !job.title.toLowerCase().includes(searchTerm) && 
                !job.company.toLowerCase().includes(searchTerm) && 
                !job.location.toLowerCase().includes(searchTerm)) {
                return;
            }

            const jobCard = createJobCard(doc.id, job);
            searchResults.appendChild(jobCard);
        });
    } catch (error) {
        console.error('Error searching jobs:', error);
    }
}

function createJobCard(jobId, job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
        <h3>${job.title}</h3>
        <p class="company">${job.company}</p>
        <p class="location">${job.location}</p>
        <p class="type">${job.type}</p>
        <p class="salary">${job.salary}</p>
        <p class="description">${job.description.substring(0, 150)}...</p>
        <div class="job-actions">
            <button onclick="viewJob('${jobId}')" class="btn">View Details</button>
            <button onclick="applyForJob('${jobId}')" class="btn">Apply Now</button>
            <button onclick="saveJob('${jobId}')" class="btn">Save Job</button>
        </div>
    `;
    return card;
}

// Application Functions
async function applyForJob(jobId) {
    try {
        const jobDoc = await db.collection('jobs').doc(jobId).get();
        const job = jobDoc.data();

        const applicationData = {
            jobId,
            jobTitle: job.title,
            employerId: job.employerId,
            candidateId: auth.currentUser.uid,
            status: 'pending',
            appliedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('applications').add(applicationData);
        alert('Application submitted successfully!');
        updateDashboardStats();
        loadMyApplications();
    } catch (error) {
        console.error('Error applying for job:', error);
        alert('Error applying for job. Please try again.');
    }
}

async function saveJob(jobId) {
    try {
        await db.collection('savedJobs').add({
            jobId,
            userId: auth.currentUser.uid,
            savedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Job saved successfully!');
        updateDashboardStats();
    } catch (error) {
        console.error('Error saving job:', error);
        alert('Error saving job. Please try again.');
    }
}

// Load My Applications
async function loadMyApplications() {
    const applicationsList = document.getElementById('myApplicationsList');
    applicationsList.innerHTML = '';

    try {
        const snapshot = await db.collection('applications')
            .where('candidateId', '==', auth.currentUser.uid)
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

function createApplicationCard(applicationId, application) {
    const card = document.createElement('div');
    card.className = 'application-card';
    card.innerHTML = `
        <div class="job-title">${application.jobTitle}</div>
        <div class="status ${application.status}">${application.status}</div>
        <div class="applied-date">Applied: ${application.appliedAt.toDate().toLocaleDateString()}</div>
        <div class="application-actions">
            <button onclick="viewApplication('${applicationId}')" class="btn">View Details</button>
        </div>
    `;
    return card;
}

// Update Dashboard Stats
async function updateDashboardStats() {
    try {
        const applicationsSnapshot = await db.collection('applications')
            .where('candidateId', '==', auth.currentUser.uid)
            .get();

        const savedJobsSnapshot = await db.collection('savedJobs')
            .where('userId', '==', auth.currentUser.uid)
            .get();

        const shortlistedCount = applicationsSnapshot.docs.filter(doc => 
            doc.data().status === 'shortlisted'
        ).length;

        document.getElementById('applicationsSent').textContent = applicationsSnapshot.size;
        document.getElementById('shortlistedCount').textContent = shortlistedCount;
        document.getElementById('savedJobsCount').textContent = savedJobsSnapshot.size;
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
            .where('candidateId', '==', auth.currentUser.uid)
            .orderBy('appliedAt', 'desc')
            .limit(5)
            .get();

        applicationsSnapshot.forEach(doc => {
            const application = doc.data();
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <p>Applied for ${application.jobTitle}</p>
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
        searchJobs();
        loadMyApplications();
        updateDashboardStats();
        loadRecentActivity();

        // Load job seeker profile
        db.collection('jobseekers').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('fullName').value = data.fullName || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('phone').value = data.phone || '';
                document.getElementById('location').value = data.location || '';
                document.getElementById('bio').value = data.bio || '';
                document.getElementById('skills').value = data.skills?.join(', ') || '';
            }
        });
    });

    // Search and filter event listeners
    jobSearch.addEventListener('input', searchJobs);
    jobTypeFilter.addEventListener('change', searchJobs);
    locationFilter.addEventListener('change', searchJobs);
    educationFilter.addEventListener('change', searchJobs);
    applicationStatusFilter.addEventListener('change', loadMyApplications);
}); 