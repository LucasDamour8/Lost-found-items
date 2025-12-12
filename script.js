// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // File Upload Handler
    const fileUpload = document.getElementById('fileUpload');
    const fileInput = document.getElementById('photos');

    if (fileUpload && fileInput) {
        fileUpload.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                const fileNames = Array.from(files).map(f => f.name).join(', ');
                const uploadText = fileUpload.querySelector('p');
                uploadText.textContent = `${files.length} file(s) selected`;
            }
        });

        // Drag and Drop
        fileUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUpload.style.borderColor = '#FFD500';
            fileUpload.style.background = '#fffef0';
        });

        fileUpload.addEventListener('dragleave', () => {
            fileUpload.style.borderColor = '#e0e0e0';
            fileUpload.style.background = 'transparent';
        });

        fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.style.borderColor = '#e0e0e0';
            fileUpload.style.background = 'transparent';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                const uploadText = fileUpload.querySelector('p');
                uploadText.textContent = `${files.length} file(s) selected`;
            }
        });
    }

    // Form Submission Handlers
    const reportLostForm = document.getElementById('reportLostForm');
    if (reportLostForm) {
        reportLostForm.addEventListener('submit', handleLostItemSubmit);
    }

    const reportFoundForm = document.getElementById('reportFoundForm');
    if (reportFoundForm) {
        reportFoundForm.addEventListener('submit', handleFoundItemSubmit);
    }

    // Smooth Scroll for Anchor Links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                const target = document.querySelector(href);
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add Animation on Scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.feature-card, .category-card, .item-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s, transform 0.5s';
        observer.observe(el);
    });
});

// Handle Lost Item Form Submission
function handleLostItemSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Validate form
    if (!validateForm(data)) {
        return;
    }
    
    // Show success message
    showNotification('Success! Your lost item report has been submitted.', 'success');
    
    // Reset form
    e.target.reset();
    
    // Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = 'search-items.html';
    }, 2000);
}

// Handle Found Item Form Submission
function handleFoundItemSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Validate form
    if (!validateForm(data)) {
        return;
    }
    
    // Show success message
    showNotification('Thank you! Your found item report has been submitted.', 'success');
    
    // Reset form
    e.target.reset();
    
    // Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = 'search-items.html';
    }, 2000);
}

// Form Validation
function validateForm(data) {
    const requiredFields = ['fullName', 'email', 'phone', 'category', 'itemName', 'description', 'location'];
    
    for (let field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            showNotification(`Please fill in the ${field} field.`, 'error');
            return false;
        }
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showNotification('Please enter a valid email address.', 'error');
        return false;
    }
    
    // Validate phone
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(data.phone)) {
        showNotification('Please enter a valid phone number.', 'error');
        return false;
    }
    
    return true;
}

// Show Notification
function showNotification(message, type) {
    // Remove existing notifications
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 20px 30px;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Search Functionality
function performSearch(query) {
    // This would typically make an API call to your backend
    console.log('Searching for:', query);
    showNotification('Search functionality will be connected to the backend.', 'success');
}

// Category Filter
function filterByCategory(category) {
    console.log('Filtering by category:', category);
    // This would filter the displayed items
}

// Status Filter
function filterByStatus(status) {
    console.log('Filtering by status:', status);
    // This would filter the displayed items
}

// Location Filter
function filterByLocation(location) {
    console.log('Filtering by location:', location);
    // This would filter the displayed items
}

// Load More Items
function loadMoreItems() {
    showNotification('Loading more items...', 'success');
    // This would load additional items from the backend
}

// Initialize on page load
window.addEventListener('load', function() {
    console.log('Lost & Found Hub System Initialized');
    
    // Add any additional initialization code here
    // For example, load user preferences, check authentication status, etc.
});