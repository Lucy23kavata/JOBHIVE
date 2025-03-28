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
document.addEventListener('DOMContentLoaded', function () {
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

// Certificate Upload Handling
document.addEventListener('DOMContentLoaded', function () {
    // Handle certificate upload type toggle
    const certUploadTypes = document.querySelectorAll('input[name="cert-upload-type"]');
    certUploadTypes.forEach(radio => {
        radio.addEventListener('change', function () {
            const container = this.closest('.cert-upload-container');
            const urlInput = container.querySelector('.cert-url-input');
            const imageInput = container.querySelector('.cert-image-input');

            if (this.value === 'url') {
                urlInput.style.display = 'block';
                imageInput.style.display = 'none';
            } else {
                urlInput.style.display = 'none';
                imageInput.style.display = 'block';
            }
        });
    });

    // Handle image preview
    const certImageInputs = document.querySelectorAll('.cert-image');
    certImageInputs.forEach(input => {
        input.addEventListener('change', function () {
            const preview = this.nextElementSibling;
            const file = this.files[0];

            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Certificate preview">`;
                    preview.classList.add('has-image');
                };
                reader.readAsDataURL(file);
            } else {
                preview.innerHTML = '';
                preview.classList.remove('has-image');
            }
        });
    });
});

// Update the addNewEntry function to handle certificate upload
function addNewEntry(containerId, templateId) {
    const container = document.getElementById(containerId);
    const template = document.getElementById(templateId).content.cloneNode(true);

    // Reset certificate upload fields
    const certUploadContainer = template.querySelector('.cert-upload-container');
    if (certUploadContainer) {
        const urlInput = certUploadContainer.querySelector('.cert-url-input');
        const imageInput = certUploadContainer.querySelector('.cert-image-input');
        const preview = certUploadContainer.querySelector('.cert-image-preview');

        urlInput.style.display = 'block';
        imageInput.style.display = 'none';
        preview.innerHTML = '';
        preview.classList.remove('has-image');
    }

    container.appendChild(template);
}

// Update the saveResume function to handle certificate images
async function saveResume() {
    // ... existing save logic ...

    // Handle certificate images
    const certImages = document.querySelectorAll('.cert-image');
    for (const imageInput of certImages) {
        if (imageInput.files.length > 0) {
            const file = imageInput.files[0];
            const storageRef = firebase.storage().ref(`certificates/${Date.now()}_${file.name}`);
            await storageRef.put(file);
            const url = await storageRef.getDownloadURL();
            // Store the URL in your resume data
            // ... 
        }
    }

    // ... rest of save logic ...
}

// Employer Authentication Functions
function showWelcomeSection() {
    document.getElementById('employerWelcome').style.display = 'block';
    document.querySelector('.employer-dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('employerWelcome').style.display = 'none';
    document.querySelector('.employer-dashboard').style.display = 'block';
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function loadEmployerData(uid) {
    firebase.firestore().collection('employers').doc(uid).get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('companyName').textContent = data.companyName;
                document.getElementById('companyEmail').textContent = data.email;
            }
        })
        .catch((error) => {
            console.error('Error loading employer data:', error);
        });
}

// Initialize employer authentication
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication state
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            showDashboard();
            loadEmployerData(user.uid);
        } else {
            showWelcomeSection();
        }
    });

    // Add event listeners for login/register buttons
    document.querySelectorAll('#welcomeLoginBtn, #loginBtn').forEach(btn => {
        btn.addEventListener('click', showLoginModal);
    });

    document.querySelectorAll('#welcomeRegisterBtn, #registerBtn').forEach(btn => {
        btn.addEventListener('click', showRegisterModal);
    });

    // Handle login form
    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;
        const password = this.querySelector('input[type="password"]').value;

        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                closeModal('loginModal');
                showDashboard();
                loadEmployerData(userCredential.user.uid);
            })
            .catch((error) => {
                alert('Login failed: ' + error.message);
            });
    });

    // Handle register form
    document.getElementById('registerForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const companyName = this.querySelector('input[type="text"]').value;
        const email = this.querySelector('input[type="email"]').value;
        const password = this.querySelector('input[type="password"]').value;

        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                return firebase.firestore().collection('employers').doc(userCredential.user.uid).set({
                    companyName: companyName,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                closeModal('registerModal');
                showDashboard();
                loadEmployerData(firebase.auth().currentUser.uid);
            })
            .catch((error) => {
                alert('Registration failed: ' + error.message);
            });
    });

    // Handle modal closing
    window.onclick = function (event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.onclick = function () {
            this.closest('.modal').style.display = 'none';
        }
    });

    // Switch between login and register modals
    document.getElementById('showRegister').onclick = function (e) {
        e.preventDefault();
        closeModal('loginModal');
        showRegisterModal();
    };

    document.getElementById('showLogin').onclick = function (e) {
        e.preventDefault();
        closeModal('registerModal');
        showLoginModal();
    };
});

// Employer Page Functionality
document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on the employer page
    if (document.querySelector('.employer-welcome') || document.querySelector('.employer-dashboard')) {
        const auth = firebase.auth();
        const db = firebase.firestore();
        const storage = firebase.storage();

        // DOM Elements
        const welcomeSection = document.getElementById('employerWelcome');
        const dashboardSection = document.querySelector('.employer-dashboard');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const welcomeLoginBtn = document.getElementById('welcomeLoginBtn');
        const welcomeRegisterBtn = document.getElementById('welcomeRegisterBtn');
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        const closeButtons = document.querySelectorAll('.close');
        const showRegisterLink = document.getElementById('showRegister');
        const showLoginLink = document.getElementById('showLogin');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const employerMenu = document.querySelector('.employer-menu');
        const dashboardSections = document.querySelectorAll('.dashboard-section');
        const postJobForm = document.getElementById('postJobForm');
        const companyProfileForm = document.getElementById('companyProfileForm');
        const jobSearch = document.getElementById('jobSearch');
        const jobStatus = document.getElementById('jobStatus');
        const jobFilter = document.getElementById('jobFilter');
        const statusFilter = document.getElementById('statusFilter');
        const resumeSearch = document.getElementById('resumeSearch');
        const experienceFilter = document.getElementById('experienceFilter');
        const educationFilter = document.getElementById('educationFilter');
        const locationFilter = document.getElementById('locationFilter');

        // Check authentication state
        auth.onAuthStateChanged((user) => {
            if (user) {
                showDashboard();
                loadEmployerData(user.uid);
            } else {
                showWelcomeSection();
            }
        });

        // Show/Hide Sections
        function showDashboard() {
            welcomeSection.style.display = 'none';
            dashboardSection.style.display = 'block';
        }

        function showWelcomeSection() {
            welcomeSection.style.display = 'block';
            dashboardSection.style.display = 'none';
        }

        // Modal Functions
        function showLoginModal() {
            loginModal.style.display = 'block';
        }

        function showRegisterModal() {
            registerModal.style.display = 'block';
        }

        function closeModal(modal) {
            modal.style.display = 'none';
        }

        // Event Listeners for Buttons
        loginBtn.addEventListener('click', showLoginModal);
        registerBtn.addEventListener('click', showRegisterModal);
        welcomeLoginBtn.addEventListener('click', showLoginModal);
        welcomeRegisterBtn.addEventListener('click', showRegisterModal);

        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                closeModal(loginModal);
                closeModal(registerModal);
            });
        });

        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(loginModal);
            showRegisterModal();
        });

        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(registerModal);
            showLoginModal();
        });

        // Login Form Handler
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;

            try {
                await auth.signInWithEmailAndPassword(email, password);
                closeModal(loginModal);
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        });

        // Register Form Handler
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const companyName = registerForm.querySelector('input[type="text"]').value;
            const email = registerForm.querySelector('input[type="email"]').value;
            const password = registerForm.querySelector('input[type="password"]').value;

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await db.collection('employers').doc(userCredential.user.uid).set({
                    companyName,
                    email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                closeModal(registerModal);
            } catch (error) {
                alert('Registration failed: ' + error.message);
            }
        });

        // Dashboard Navigation
        employerMenu.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.target.closest('a').getAttribute('href').substring(1);

            // Update active states
            employerMenu.querySelectorAll('a').forEach(link => link.classList.remove('active'));
            e.target.closest('a').classList.add('active');

            // Show target section
            dashboardSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });
        });

        // Post Job Form Handler
        if (postJobForm) {
            postJobForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const jobData = {
                    title: document.getElementById('jobTitle').value,
                    type: document.getElementById('jobType').value,
                    category: document.getElementById('jobCategory').value,
                    location: document.getElementById('location').value,
                    salaryRange: document.getElementById('salaryRange').value,
                    description: document.getElementById('jobDescription').value,
                    requirements: document.getElementById('requirements').value,
                    deadline: document.getElementById('deadline').value,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'active'
                };

                try {
                    await db.collection('jobs').add(jobData);
                    alert('Job posted successfully!');
                    postJobForm.reset();
                } catch (error) {
                    alert('Failed to post job: ' + error.message);
                }
            });
        }

        // Company Profile Form Handler
        if (companyProfileForm) {
            companyProfileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const user = auth.currentUser;
                if (!user) return;

                const logoFile = document.getElementById('companyLogo').files[0];
                let logoUrl = '';

                if (logoFile) {
                    const storageRef = storage.ref(`company-logos/${user.uid}`);
                    await storageRef.put(logoFile);
                    logoUrl = await storageRef.getDownloadURL();
                }

                const profileData = {
                    companyName: document.getElementById('companyName').value,
                    description: document.getElementById('companyDescription').value,
                    email: document.getElementById('companyEmail').value,
                    phone: document.getElementById('companyPhone').value,
                    website: document.getElementById('companyWebsite').value,
                    address: document.getElementById('companyAddress').value,
                    logo: logoUrl || document.getElementById('logoPreview').src,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                try {
                    await db.collection('employers').doc(user.uid).update(profileData);
                    alert('Profile updated successfully!');
                } catch (error) {
                    alert('Failed to update profile: ' + error.message);
                }
            });
        }

        // Load Employer Data
        async function loadEmployerData(uid) {
            try {
                const doc = await db.collection('employers').doc(uid).get();
                if (doc.exists) {
                    const data = doc.data();
                    document.getElementById('companyName').textContent = data.companyName;
                    document.getElementById('companyEmail').textContent = data.email;
                    if (data.logo) {
                        document.getElementById('companyLogo').src = data.logo;
                        document.getElementById('logoPreview').src = data.logo;
                    }
                }
            } catch (error) {
                console.error('Error loading employer data:', error);
            }
        }

        // Job Search and Filtering
        if (jobSearch) {
            jobSearch.addEventListener('input', debounce(async (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const jobsList = document.getElementById('jobsList');
                const querySnapshot = await db.collection('jobs')
                    .where('companyId', '==', auth.currentUser.uid)
                    .get();

                jobsList.innerHTML = '';
                querySnapshot.forEach(doc => {
                    const job = doc.data();
                    if (job.title.toLowerCase().includes(searchTerm) ||
                        job.description.toLowerCase().includes(searchTerm)) {
                        jobsList.appendChild(createJobCard(doc.id, job));
                    }
                });
            }, 300));
        }

        // Resume Search
        if (resumeSearch) {
            resumeSearch.addEventListener('input', debounce(async (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const resumesList = document.getElementById('resumesList');
                const querySnapshot = await db.collection('resumes')
                    .where('skills', 'array-contains', searchTerm)
                    .get();

                resumesList.innerHTML = '';
                querySnapshot.forEach(doc => {
                    const resume = doc.data();
                    resumesList.appendChild(createResumeCard(doc.id, resume));
                });
            }, 300));
        }

        // Utility Functions
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

        function createJobCard(id, job) {
            const card = document.createElement('div');
            card.className = 'job-card';
            card.innerHTML = `
                <div class="job-header">
                    <h3>${job.title}</h3>
                    <span class="status ${job.status}">${job.status}</span>
                </div>
                <div class="job-details">
                    <p><strong>Type:</strong> ${job.type}</p>
                    <p><strong>Location:</strong> ${job.location}</p>
                    <p><strong>Posted:</strong> ${job.createdAt.toDate().toLocaleDateString()}</p>
                </div>
                <div class="job-actions">
                    <button onclick="editJob('${id}')" class="btn btn-outline">Edit</button>
                    <button onclick="deleteJob('${id}')" class="btn btn-danger">Delete</button>
                </div>
            `;
            return card;
        }

        function createResumeCard(id, resume) {
            const card = document.createElement('div');
            card.className = 'resume-card';
            card.innerHTML = `
                <div class="resume-header">
                    <h3>${resume.fullName}</h3>
                    <p>${resume.title}</p>
                </div>
                <div class="resume-details">
                    <p><strong>Experience:</strong> ${resume.experience}</p>
                    <p><strong>Education:</strong> ${resume.education}</p>
                    <p><strong>Skills:</strong> ${resume.skills.join(', ')}</p>
                </div>
                <div class="resume-actions">
                    <button onclick="viewResume('${id}')" class="btn btn-primary">View Resume</button>
                    <button onclick="contactCandidate('${id}')" class="btn btn-outline">Contact</button>
                </div>
            `;
            return card;
        }
    }
}); 