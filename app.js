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
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const closeBtns = document.getElementsByClassName('close');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const jobListings = document.getElementById('jobListings');

// Modal Functions
function openModal(modal) {
    modal.style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

// Event Listeners
loginBtn.addEventListener('click', () => openModal(loginModal));
registerBtn.addEventListener('click', () => openModal(registerModal));
showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(loginModal);
    openModal(registerModal);
});
showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(registerModal);
    openModal(loginModal);
});

Array.from(closeBtns).forEach(btn => {
    btn.addEventListener('click', () => {
        closeModal(loginModal);
        closeModal(registerModal);
    });
});

window.addEventListener('click', (e) => {
    if (e.target === loginModal) closeModal(loginModal);
    if (e.target === registerModal) closeModal(registerModal);
});

// Authentication Functions
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log('Logged in:', user);
        closeModal(loginModal);
        // Redirect based on user type
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.type === 'employer') {
                window.location.href = 'employer-dashboard.html';
            } else {
                window.location.href = 'jobseeker-dashboard.html';
            }
        }
    } catch (error) {
        alert(error.message);
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = registerForm.querySelector('input[type="text"]').value;
    const email = registerForm.querySelector('input[type="email"]').value;
    const password = registerForm.querySelector('input[type="password"]').value;
    const userType = registerForm.querySelector('select').value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            name,
            email,
            type: userType,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('Registered:', user);
        closeModal(registerModal);
        // Redirect based on user type
        if (userType === 'employer') {
            window.location.href = 'employer-dashboard.html';
        } else {
            window.location.href = 'jobseeker-dashboard.html';
        }
    } catch (error) {
        alert(error.message);
    }
});

// Job Listings Functions
async function loadJobListings(page = 1, filters = {}) {
    const jobListings = document.getElementById('jobListings');
    jobListings.innerHTML = '<div class="loading">Loading jobs...</div>';

    try {
        let query = db.collection('jobs').where('status', '==', 'active');

        // Apply filters
        if (filters.location) query = query.where('location', '==', filters.location);
        if (filters.type) query = query.where('type', '==', filters.type);
        if (filters.education) query = query.where('requiredEducation', '==', filters.education);
        if (filters.industry) query = query.where('industry', '==', filters.industry);
        if (filters.salaryMin) query = query.where('salaryMin', '>=', filters.salaryMin);
        if (filters.salaryMax) query = query.where('salaryMax', '<=', filters.salaryMax);

        // Add pagination
        const limit = 10;
        const startAfter = (page - 1) * limit;
        query = query.orderBy('postedAt', 'desc').limit(limit);

        const snapshot = await query.get();
        
        if (snapshot.empty) {
            jobListings.innerHTML = '<div class="no-jobs">No jobs found matching your criteria.</div>';
            return;
        }

        jobListings.innerHTML = '';
        
        snapshot.forEach(doc => {
            const job = doc.data();
            const jobCard = createJobCard(doc.id, job);
            jobListings.appendChild(jobCard);
        });

        // Add load more button if there are more jobs
        if (snapshot.docs.length === limit) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'btn load-more';
            loadMoreBtn.textContent = 'Load More Jobs';
            loadMoreBtn.onclick = () => loadJobListings(page + 1, filters);
            jobListings.appendChild(loadMoreBtn);
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        jobListings.innerHTML = '<div class="error">Error loading jobs. Please try again.</div>';
    }
}

function createJobCard(jobId, job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    
    // Calculate time since posting
    const postedDate = job.postedAt?.toDate() || new Date();
    const timeSincePosted = getTimeSincePosted(postedDate);
    
    // Check if job is expiring soon
    const expiryDate = job.deadline?.toDate();
    const isExpiringSoon = expiryDate && (expiryDate - new Date()) < (7 * 24 * 60 * 60 * 1000);
    
    card.innerHTML = `
        <div class="job-header">
            <div class="company-logo">
                ${job.companyLogo ? 
                    `<img src="${job.companyLogo}" alt="${job.companyName} logo">` : 
                    `<div class="logo-placeholder">${job.companyName.charAt(0)}</div>`
                }
            </div>
            <div class="job-title-section">
                <h3>${job.title}</h3>
                <p class="company-name">${job.companyName}</p>
                <div class="job-meta">
                    <span class="location"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                    <span class="type"><i class="fas fa-briefcase"></i> ${job.type}</span>
                    <span class="industry"><i class="fas fa-building"></i> ${job.industry}</span>
                </div>
            </div>
        </div>
        
        <div class="job-details">
            <div class="description">
                <h4>Job Description</h4>
                <p>${job.description}</p>
            </div>
            
            <div class="requirements">
                <h4>Requirements</h4>
                <ul>
                    ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                </ul>
            </div>
            
            <div class="job-info">
                <div class="info-item">
                    <i class="fas fa-graduation-cap"></i>
                    <span>${job.requiredEducation}</span>
                </div>
                ${job.salaryRange ? `
                    <div class="info-item">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>${job.salaryRange}</span>
                    </div>
                ` : ''}
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>Posted ${timeSincePosted}</span>
                </div>
                ${expiryDate ? `
                    <div class="info-item ${isExpiringSoon ? 'expiring-soon' : ''}">
                        <i class="fas fa-calendar-times"></i>
                        <span>Deadline: ${expiryDate.toLocaleDateString()}</span>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="job-actions">
            <button onclick="viewJob('${jobId}')" class="btn btn-primary">View Details</button>
            ${job.applyUrl ? 
                `<a href="${job.applyUrl}" target="_blank" class="btn btn-secondary">Apply Externally</a>` :
                `<button onclick="applyForJob('${jobId}')" class="btn btn-primary">Apply Now</button>`
            }
            <button onclick="saveJob('${jobId}')" class="btn btn-outline">
                <i class="far fa-bookmark"></i> Save Job
            </button>
        </div>
    `;
    
    return card;
}

function getTimeSincePosted(date) {
    const now = new Date();
    const diff = now - date;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    return 'Just now';
}

// Update the searchJobs function
async function searchJobs() {
    const searchTerm = jobSearch.value.toLowerCase();
    const filters = {
        location: locationFilter.value,
        type: typeFilter.value,
        education: educationFilter.value,
        industry: industryFilter.value,
        salaryMin: salaryMinFilter.value,
        salaryMax: salaryMaxFilter.value
    };
    
    await loadJobListings(1, filters);
}

// Add event listeners for filters
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...
    
    // Add filter event listeners
    jobSearch.addEventListener('input', debounce(searchJobs, 500));
    locationFilter.addEventListener('change', searchJobs);
    typeFilter.addEventListener('change', searchJobs);
    educationFilter.addEventListener('change', searchJobs);
    industryFilter.addEventListener('change', searchJobs);
    salaryMinFilter.addEventListener('change', searchJobs);
    salaryMaxFilter.addEventListener('change', searchJobs);
    
    // Initial load
    loadJobListings();
});

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadJobListings();
    
    // Check authentication state
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            loginBtn.style.display = 'none';
            registerBtn.style.display = 'none';
            // Add logout button or user profile menu
        } else {
            // User is signed out
            loginBtn.style.display = 'block';
            registerBtn.style.display = 'block';
        }
    });
});

// Job Details and Application Functions
function viewJob(jobId) {
    const jobDetailsModal = document.getElementById('jobDetailsModal');
    const jobDetailsContent = document.getElementById('jobDetailsContent');
    
    // Get job details from Firestore
    db.collection('jobs').doc(jobId).get()
        .then(doc => {
            if (doc.exists) {
                const job = doc.data();
                jobDetailsContent.innerHTML = `
                    <div class="job-header">
                        <div class="company-logo">
                            ${job.companyLogo ? 
                                `<img src="${job.companyLogo}" alt="${job.companyName} logo">` : 
                                `<div class="logo-placeholder">${job.companyName.charAt(0)}</div>`
                            }
                        </div>
                        <div class="job-title-section">
                            <h3>${job.title}</h3>
                            <p class="company-name">${job.companyName}</p>
                            <div class="job-meta">
                                <span class="location"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                                <span class="type"><i class="fas fa-briefcase"></i> ${job.type}</span>
                                <span class="industry"><i class="fas fa-building"></i> ${job.industry}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="job-details">
                        <div class="description">
                            <h4>Job Description</h4>
                            <p>${job.description}</p>
                        </div>
                        
                        <div class="requirements">
                            <h4>Requirements</h4>
                            <ul>
                                ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="job-info">
                            <div class="info-item">
                                <i class="fas fa-graduation-cap"></i>
                                <span>${job.requiredEducation}</span>
                            </div>
                            ${job.salaryRange ? `
                                <div class="info-item">
                                    <i class="fas fa-money-bill-wave"></i>
                                    <span>${job.salaryRange}</span>
                                </div>
                            ` : ''}
                            <div class="info-item">
                                <i class="fas fa-clock"></i>
                                <span>Posted ${getTimeSincePosted(job.postedAt?.toDate())}</span>
                            </div>
                            ${job.deadline ? `
                                <div class="info-item ${isExpiringSoon(job.deadline?.toDate()) ? 'expiring-soon' : ''}">
                                    <i class="fas fa-calendar-times"></i>
                                    <span>Deadline: ${job.deadline.toDate().toLocaleDateString()}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="job-actions">
                        <button onclick="applyForJob('${jobId}', '${job.title}')" class="btn btn-primary">Apply Now</button>
                        <button onclick="saveJob('${jobId}')" class="btn btn-outline">
                            <i class="far fa-bookmark"></i> Save Job
                        </button>
                    </div>
                `;
                openModal(jobDetailsModal);
            } else {
                alert('Job not found');
            }
        })
        .catch(error => {
            console.error('Error loading job details:', error);
            alert('Error loading job details. Please try again.');
        });
}

function applyForJob(jobId, jobTitle) {
    const applicationModal = document.getElementById('jobApplicationModal');
    const applicationJobTitle = document.getElementById('applicationJobTitle');
    const jobApplicationForm = document.getElementById('jobApplicationForm');
    
    // Check if user is logged in
    if (!auth.currentUser) {
        alert('Please log in to apply for jobs');
        closeModal(document.getElementById('jobDetailsModal'));
        openModal(document.getElementById('loginModal'));
        return;
    }
    
    applicationJobTitle.textContent = jobTitle;
    openModal(applicationModal);
    
    // Handle form submission
    jobApplicationForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const resume = document.getElementById('resume').files[0];
        const coverLetter = document.getElementById('coverLetter').value;
        
        try {
            // Upload resume to Firebase Storage
            const resumeRef = storage.ref(`applications/${jobId}/${auth.currentUser.uid}/${resume.name}`);
            await resumeRef.put(resume);
            const resumeUrl = await resumeRef.getDownloadURL();
            
            // Save application to Firestore
            await db.collection('applications').add({
                jobId,
                userId: auth.currentUser.uid,
                fullName,
                email,
                phone,
                resumeUrl,
                coverLetter,
                status: 'pending',
                appliedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            alert('Application submitted successfully!');
            closeModal(applicationModal);
            closeModal(document.getElementById('jobDetailsModal'));
            
            // Reset form
            jobApplicationForm.reset();
        } catch (error) {
            console.error('Error submitting application:', error);
            alert('Error submitting application. Please try again.');
        }
    };
}

function saveJob(jobId) {
    if (!auth.currentUser) {
        alert('Please log in to save jobs');
        return;
    }
    
    const userId = auth.currentUser.uid;
    const savedJobsRef = db.collection('users').doc(userId).collection('savedJobs');
    
    savedJobsRef.doc(jobId).get()
        .then(doc => {
            if (doc.exists) {
                // Job is already saved, remove it
                savedJobsRef.doc(jobId).delete()
                    .then(() => alert('Job removed from saved jobs'))
                    .catch(error => {
                        console.error('Error removing saved job:', error);
                        alert('Error removing saved job');
                    });
            } else {
                // Save the job
                savedJobsRef.doc(jobId).set({
                    savedAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => alert('Job saved successfully'))
                .catch(error => {
                    console.error('Error saving job:', error);
                    alert('Error saving job');
                });
            }
        })
        .catch(error => {
            console.error('Error checking saved job:', error);
            alert('Error checking saved job');
        });
}

function isExpiringSoon(date) {
    if (!date) return false;
    const now = new Date();
    const diff = date - now;
    return diff > 0 && diff < (7 * 24 * 60 * 60 * 1000); // Less than 7 days
}

// Resume Builder Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize resume data
    let resumeData = {
        personalInfo: {},
        summary: '',
        experience: [],
        education: [],
        skills: {
            technical: [],
            soft: []
        },
        certifications: [],
        projects: [],
        achievements: [],
        references: []
    };

    // Add entry buttons functionality
    const addButtons = {
        experience: document.getElementById('addExperience'),
        education: document.getElementById('addEducation'),
        certification: document.getElementById('addCertification'),
        project: document.getElementById('addProject'),
        achievement: document.getElementById('addAchievement'),
        reference: document.getElementById('addReference')
    };

    // Add new entry functions
    function addNewEntry(type) {
        const container = document.getElementById(`${type}Container`);
        const template = container.querySelector(`.${type}-entry`).cloneNode(true);
        
        // Clear input values
        template.querySelectorAll('input, textarea').forEach(input => {
            input.value = '';
        });
        
        container.appendChild(template);
    }

    // Add event listeners for add buttons
    Object.entries(addButtons).forEach(([type, button]) => {
        button.addEventListener('click', () => addNewEntry(type));
    });

    // Live preview update
    function updatePreview() {
        const preview = document.getElementById('resumePreview');
        const template = document.getElementById('templateSelect').value;
        
        // Clear previous preview
        preview.innerHTML = '';
        
        // Add template class
        preview.className = `preview-content template-${template}`;
        
        // Personal Information
        const personalInfo = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value,
            linkedin: document.getElementById('linkedin').value,
            website: document.getElementById('website').value
        };
        
        // Update resume data
        resumeData.personalInfo = personalInfo;
        resumeData.summary = document.getElementById('summary').value;
        
        // Generate preview HTML
        let previewHTML = `
            <div class="resume-header">
                <h1>${personalInfo.fullName || 'Your Name'}</h1>
                <div class="contact-info">
                    ${personalInfo.email ? `<p><i class="fas fa-envelope"></i> ${personalInfo.email}</p>` : ''}
                    ${personalInfo.phone ? `<p><i class="fas fa-phone"></i> ${personalInfo.phone}</p>` : ''}
                    ${personalInfo.location ? `<p><i class="fas fa-map-marker-alt"></i> ${personalInfo.location}</p>` : ''}
                </div>
                <div class="social-links">
                    ${personalInfo.linkedin ? `<a href="${personalInfo.linkedin}" target="_blank"><i class="fab fa-linkedin"></i></a>` : ''}
                    ${personalInfo.website ? `<a href="${personalInfo.website}" target="_blank"><i class="fas fa-globe"></i></a>` : ''}
                </div>
            </div>
        `;
        
        // Professional Summary
        if (resumeData.summary) {
            previewHTML += `
                <div class="resume-section">
                    <h2>Professional Summary</h2>
                    <p>${resumeData.summary}</p>
                </div>
            `;
        }
        
        // Work Experience
        const experiences = document.querySelectorAll('.experience-entry');
        if (experiences.length > 0) {
            previewHTML += `
                <div class="resume-section">
                    <h2>Work Experience</h2>
                    ${Array.from(experiences).map(exp => {
                        const company = exp.querySelector('.company-name').value;
                        const title = exp.querySelector('.job-title').value;
                        const startDate = exp.querySelector('.start-date').value;
                        const endDate = exp.querySelector('.end-date').value;
                        const responsibilities = exp.querySelector('.responsibilities').value;
                        
                        return `
                            <div class="experience-item">
                                <h3>${title || 'Job Title'}</h3>
                                <p class="company">${company || 'Company Name'}</p>
                                <p class="date">${startDate || 'Start Date'} - ${endDate || 'Present'}</p>
                                <p class="responsibilities">${responsibilities || 'Responsibilities'}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        // Education
        const education = document.querySelectorAll('.education-entry');
        if (education.length > 0) {
            previewHTML += `
                <div class="resume-section">
                    <h2>Education</h2>
                    ${Array.from(education).map(edu => {
                        const institution = edu.querySelector('.institution').value;
                        const degree = edu.querySelector('.degree').value;
                        const startDate = edu.querySelector('.start-date').value;
                        const endDate = edu.querySelector('.end-date').value;
                        
                        return `
                            <div class="education-item">
                                <h3>${degree || 'Degree'}</h3>
                                <p class="institution">${institution || 'Institution'}</p>
                                <p class="date">${startDate || 'Start Date'} - ${endDate || 'End Date'}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        // Skills
        const technicalSkills = document.getElementById('technicalSkills').value.split(',').map(s => s.trim()).filter(s => s);
        const softSkills = document.getElementById('softSkills').value.split(',').map(s => s.trim()).filter(s => s);
        
        if (technicalSkills.length > 0 || softSkills.length > 0) {
            previewHTML += `
                <div class="resume-section">
                    <h2>Skills</h2>
                    ${technicalSkills.length > 0 ? `
                        <div class="skills-group">
                            <h3>Technical Skills</h3>
                            <ul>
                                ${technicalSkills.map(skill => `<li>${skill}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${softSkills.length > 0 ? `
                        <div class="skills-group">
                            <h3>Soft Skills</h3>
                            <ul>
                                ${softSkills.map(skill => `<li>${skill}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        // Update preview content
        preview.innerHTML = previewHTML;
    }
    
    // Add input event listeners for live preview
    document.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('input', updatePreview);
    });
    
    // Save resume
    document.getElementById('saveResume').addEventListener('click', async () => {
        try {
            // Check if user is logged in
            const user = firebase.auth().currentUser;
            if (!user) {
                alert('Please log in to save your resume');
                return;
            }
            
            // Save to Firestore
            await firebase.firestore().collection('resumes').doc(user.uid).set({
                ...resumeData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            alert('Resume saved successfully!');
        } catch (error) {
            console.error('Error saving resume:', error);
            alert('Error saving resume. Please try again.');
        }
    });
    
    // Download as PDF
    document.getElementById('downloadPDF').addEventListener('click', () => {
        // Here you would implement PDF generation
        // You can use libraries like html2pdf.js or jsPDF
        alert('PDF download functionality will be implemented soon!');
    });
    
    // Template change handler
    document.getElementById('templateSelect').addEventListener('change', updatePreview);
    
    // Load saved resume if exists
    async function loadSavedResume() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return;
            
            const doc = await firebase.firestore().collection('resumes').doc(user.uid).get();
            if (doc.exists) {
                const data = doc.data();
                // Populate form fields with saved data
                // This would need to be implemented based on your data structure
            }
        } catch (error) {
            console.error('Error loading saved resume:', error);
        }
    }
    
    // Load saved resume when page loads
    loadSavedResume();
}); 