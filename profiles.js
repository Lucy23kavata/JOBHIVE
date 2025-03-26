// Check authentication state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        loadUserProfile(user);
        setupEventListeners();
    } else {
        // User is signed out, redirect to login
        window.location.href = 'jobseeker-login.html';
    }
});

// Load user profile data
async function loadUserProfile(user) {
    try {
        const userDoc = await firebase.firestore().collection('jobseekers').doc(user.uid).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            updateProfileUI(data);
        } else {
            // If no profile exists, create one with basic info
            const basicProfile = {
                fullName: user.displayName || '',
                email: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await firebase.firestore().collection('jobseekers').doc(user.uid).set(basicProfile);
            updateProfileUI(basicProfile);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile data');
    }
}

// Update profile UI with user data
function updateProfileUI(data) {
    // Update header information
    document.getElementById('fullName').textContent = data.fullName || 'Not set';
    document.getElementById('location').textContent = data.location || 'Not set';
    document.getElementById('bio').textContent = data.bio || 'No bio available';

    // Update profile picture if available
    if (data.profilePicture) {
        document.getElementById('profilePicture').src = data.profilePicture;
    }

    // Update form fields
    document.getElementById('fullNameInput').value = data.fullName || '';
    document.getElementById('emailInput').value = data.email || '';
    document.getElementById('phoneInput').value = data.phone || '';
    document.getElementById('locationInput').value = data.location || '';
    document.getElementById('linkedinInput').value = data.linkedin || '';
    document.getElementById('githubInput').value = data.github || '';
    document.getElementById('bioInput').value = data.bio || '';
    document.getElementById('portfolioLink').value = data.portfolio || '';
    document.getElementById('skillsInput').value = data.skills?.join(', ') || '';
    document.getElementById('jobAlerts').checked = data.jobAlerts || false;
    document.getElementById('profileVisibility').checked = data.profileVisible || false;

    // Update resume section if available
    if (data.resumeUrl) {
        const resumeSection = document.querySelector('.document-upload');
        resumeSection.innerHTML += `
            <div class="resume-preview">
                <h3>Current Resume</h3>
                <p>${data.resumeFileName}</p>
                <div class="document-actions">
                    <a href="${data.resumeUrl}" class="btn btn-primary" target="_blank">
                        <i class="fas fa-download"></i> Download Resume
                    </a>
                </div>
            </div>
        `;
    }

    // Update lists
    updateEducationList(data.education || []);
    updateExperienceList(data.experience || []);
    updateCertificationsList(data.certifications || []);
}

// Setup event listeners
function setupEventListeners() {
    // Profile picture upload
    document.getElementById('profilePictureInput').addEventListener('change', handleProfilePictureUpload);

    // Form submissions
    document.getElementById('personalInfoForm').addEventListener('submit', handlePersonalInfoSubmit);
    document.getElementById('accountSettingsForm').addEventListener('submit', handleAccountSettingsSubmit);

    // Resume upload
    document.getElementById('resumeUpload').addEventListener('change', handleResumeUpload);

    // Add buttons
    document.getElementById('addEducation').addEventListener('click', () => showModal('educationModal'));
    document.getElementById('addExperience').addEventListener('click', () => showModal('experienceModal'));
    document.getElementById('addCertification').addEventListener('click', () => showModal('certificationModal'));

    // Modal close buttons
    document.querySelectorAll('.close').forEach(button => {
        button.addEventListener('click', () => hideAllModals());
    });

    // Modal form submissions
    document.getElementById('educationForm').addEventListener('submit', handleEducationSubmit);
    document.getElementById('experienceForm').addEventListener('submit', handleExperienceSubmit);
    document.getElementById('certificationForm').addEventListener('submit', handleCertificationSubmit);

    // Certification image preview
    document.getElementById('certImage').addEventListener('change', handleCertImagePreview);
}

// Handle profile picture upload
async function handleProfilePictureUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const user = firebase.auth().currentUser;
        const storageRef = firebase.storage().ref(`profile-pictures/${user.uid}`);
        await storageRef.put(file);
        const url = await storageRef.getDownloadURL();

        // Update Firestore
        await firebase.firestore().collection('jobseekers').doc(user.uid).update({
            profilePicture: url
        });

        // Update UI
        document.getElementById('profilePicture').src = url;
        showSuccess('Profile picture updated successfully');
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        showError('Failed to upload profile picture');
    }
}

// Handle personal information form submission
async function handlePersonalInfoSubmit(event) {
    event.preventDefault();
    const user = firebase.auth().currentUser;

    try {
        const data = {
            fullName: document.getElementById('fullNameInput').value,
            email: document.getElementById('emailInput').value,
            phone: document.getElementById('phoneInput').value,
            location: document.getElementById('locationInput').value,
            linkedin: document.getElementById('linkedinInput').value,
            github: document.getElementById('githubInput').value,
            bio: document.getElementById('bioInput').value,
            portfolio: document.getElementById('portfolioLink').value
        };

        await firebase.firestore().collection('jobseekers').doc(user.uid).update(data);
        showSuccess('Personal information updated successfully');
    } catch (error) {
        console.error('Error updating personal information:', error);
        showError('Failed to update personal information');
    }
}

// Handle account settings form submission
async function handleAccountSettingsSubmit(event) {
    event.preventDefault();
    const user = firebase.auth().currentUser;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    try {
        // Update password if provided
        if (newPassword) {
            if (newPassword !== confirmPassword) {
                throw new Error('New passwords do not match');
            }

            // Reauthenticate user
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            await user.reauthenticateWithCredential(credential);

            // Update password
            await user.updatePassword(newPassword);
        }

        // Update settings in Firestore
        await firebase.firestore().collection('jobseekers').doc(user.uid).update({
            jobAlerts: document.getElementById('jobAlerts').checked,
            profileVisible: document.getElementById('profileVisibility').checked
        });

        showSuccess('Account settings updated successfully');
        event.target.reset();
    } catch (error) {
        console.error('Error updating account settings:', error);
        showError(error.message || 'Failed to update account settings');
    }
}

// Handle resume upload
async function handleResumeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const user = firebase.auth().currentUser;
        const storageRef = firebase.storage().ref(`resumes/${user.uid}`);
        await storageRef.put(file);
        const url = await storageRef.getDownloadURL();

        // Update Firestore
        await firebase.firestore().collection('jobseekers').doc(user.uid).update({
            resumeUrl: url,
            resumeFileName: file.name
        });

        showSuccess('Resume uploaded successfully');
    } catch (error) {
        console.error('Error uploading resume:', error);
        showError('Failed to upload resume');
    }
}

// Handle education form submission
async function handleEducationSubmit(event) {
    event.preventDefault();
    const user = firebase.auth().currentUser;

    try {
        const education = {
            school: document.getElementById('schoolName').value,
            degree: document.getElementById('degree').value,
            graduationYear: document.getElementById('graduationYear').value,
            id: Date.now().toString()
        };

        await firebase.firestore().collection('jobseekers').doc(user.uid).update({
            education: firebase.firestore.FieldValue.arrayUnion(education)
        });

        updateEducationList([education]);
        hideAllModals();
        event.target.reset();
        showSuccess('Education added successfully');
    } catch (error) {
        console.error('Error adding education:', error);
        showError('Failed to add education');
    }
}

// Handle experience form submission
async function handleExperienceSubmit(event) {
    event.preventDefault();
    const user = firebase.auth().currentUser;

    try {
        const experience = {
            title: document.getElementById('jobTitle').value,
            company: document.getElementById('companyName').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            responsibilities: document.getElementById('responsibilities').value.split('\n').filter(r => r.trim()),
            id: Date.now().toString()
        };

        await firebase.firestore().collection('jobseekers').doc(user.uid).update({
            experience: firebase.firestore.FieldValue.arrayUnion(experience)
        });

        updateExperienceList([experience]);
        hideAllModals();
        event.target.reset();
        showSuccess('Experience added successfully');
    } catch (error) {
        console.error('Error adding experience:', error);
        showError('Failed to add experience');
    }
}

// Handle certification form submission
async function handleCertificationSubmit(event) {
    event.preventDefault();
    const user = firebase.auth().currentUser;
    const certImage = document.getElementById('certImage').files[0];

    try {
        let imageUrl = '';
        if (certImage) {
            // Upload image to Firebase Storage
            const storageRef = firebase.storage().ref(`certifications/${user.uid}/${Date.now()}_${certImage.name}`);
            await storageRef.put(certImage);
            imageUrl = await storageRef.getDownloadURL();
        }

        const certification = {
            name: document.getElementById('certName').value,
            organization: document.getElementById('issuingOrg').value,
            issueDate: document.getElementById('certDate').value,
            expiryDate: document.getElementById('certExpiry').value,
            imageUrl: imageUrl,
            id: Date.now().toString()
        };

        await firebase.firestore().collection('jobseekers').doc(user.uid).update({
            certifications: firebase.firestore.FieldValue.arrayUnion(certification)
        });

        updateCertificationsList([certification]);
        hideAllModals();
        event.target.reset();
        document.getElementById('previewImage').style.display = 'none';
        showSuccess('Certification added successfully');
    } catch (error) {
        console.error('Error adding certification:', error);
        showError('Failed to add certification');
    }
}

// Handle certification image preview
function handleCertImagePreview(event) {
    const file = event.target.files[0];
    const previewImage = document.getElementById('previewImage');
    const previewContainer = document.getElementById('certImagePreview');

    if (file) {
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            showError('File size must be less than 5MB');
            event.target.value = '';
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            showError('Please upload an image file');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewImage.style.display = 'none';
        previewContainer.style.display = 'none';
    }
}

// View certification image in full size
function viewCertImage(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Certification Image</h2>
            <div class="image-viewer">
                <img src="${imageUrl}" alt="Certification" style="max-width: 100%; max-height: 80vh;">
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = function() {
        modal.remove();
    };

    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    };
}

// Update lists
function updateEducationList(education) {
    const container = document.getElementById('educationList');
    container.innerHTML = education.map(edu => `
        <div class="list-item" data-id="${edu.id}">
            <div class="list-item-content">
                <h3>${edu.school}</h3>
                <p>${edu.degree} - ${edu.graduationYear}</p>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-outline" onclick="deleteEducation('${edu.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateExperienceList(experience) {
    const container = document.getElementById('experienceList');
    container.innerHTML = experience.map(exp => `
        <div class="list-item" data-id="${exp.id}">
            <div class="list-item-content">
                <h3>${exp.title}</h3>
                <p>${exp.company}</p>
                <p>${exp.startDate} - ${exp.endDate || 'Present'}</p>
                <ul>
                    ${exp.responsibilities.map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-outline" onclick="deleteExperience('${exp.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateCertificationsList(certifications) {
    const container = document.getElementById('certificationsList');
    container.innerHTML = certifications.map(cert => `
        <div class="list-item" data-id="${cert.id}">
            <div class="list-item-content">
                <h3>${cert.name}</h3>
                <p>${cert.organization}</p>
                <p>Issued: ${cert.issueDate}</p>
                ${cert.expiryDate ? `<p>Expires: ${cert.expiryDate}</p>` : ''}
                ${cert.imageUrl ? `
                    <div class="cert-image-container">
                        <img src="${cert.imageUrl}" alt="${cert.name}" class="cert-image">
                        <button class="btn btn-outline btn-sm" onclick="viewCertImage('${cert.imageUrl}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="list-item-actions">
                <button class="btn btn-outline" onclick="deleteCertification('${cert.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Delete functions
async function deleteEducation(id) {
    if (!confirm('Are you sure you want to delete this education entry?')) return;

    try {
        const user = firebase.auth().currentUser;
        const userDoc = await firebase.firestore().collection('jobseekers').doc(user.uid).get();
        const education = userDoc.data().education.filter(edu => edu.id !== id);

        await firebase.firestore().collection('jobseekers').doc(user.uid).update({
            education: education
        });

        updateEducationList(education);
        showSuccess('Education deleted successfully');
    } catch (error) {
        console.error('Error deleting education:', error);
        showError('Failed to delete education');
    }
}

async function deleteExperience(id) {
    if (!confirm('Are you sure you want to delete this experience entry?')) return;

    try {
        const user = firebase.auth().currentUser;
        const userDoc = await firebase.firestore().collection('jobseekers').doc(user.uid).get();
        const experience = userDoc.data().experience.filter(exp => exp.id !== id);

        await firebase.firestore().collection('jobseekers').doc(user.uid).update({
            experience: experience
        });

        updateExperienceList(experience);
        showSuccess('Experience deleted successfully');
    } catch (error) {
        console.error('Error deleting experience:', error);
        showError('Failed to delete experience');
    }
}

async function deleteCertification(id) {
    if (!confirm('Are you sure you want to delete this certification?')) return;

    try {
        const user = firebase.auth().currentUser;
        const userDoc = await firebase.firestore().collection('jobseekers').doc(user.uid).get();
        const certifications = userDoc.data().certifications.filter(cert => cert.id !== id);

        await firebase.firestore().collection('jobseekers').doc(user.uid).update({
            certifications: certifications
        });

        updateCertificationsList(certifications);
        showSuccess('Certification deleted successfully');
    } catch (error) {
        console.error('Error deleting certification:', error);
        showError('Failed to delete certification');
    }
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Utility functions
function showSuccess(message) {
    alert(message); // Replace with a better notification system
}

function showError(message) {
    alert(message); // Replace with a better notification system
} 