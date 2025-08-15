/**
 * Main JavaScript for SplitTheBill Homepage
 * Handles navigation, mobile menu, smooth scrolling, and interactive features
 */

class HomepageManager {
    constructor() {
        this.mobileMenuOpen = false;
        this.scrollThreshold = 100;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupScrollEffects();
        this.setupAnimations();
        this.setupFeatureCards();
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    this.closeMobileMenu();
                }
            });
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => this.handleSmoothScroll(e));
        });

        // CTA buttons
        document.querySelectorAll('.cta-button, .btn-primary').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCTAClick(e));
        });

        // Window scroll events
        window.addEventListener('scroll', () => this.handleScroll());
        window.addEventListener('resize', () => this.handleResize());

        // Feature card interactions
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('mouseenter', () => this.animateFeatureCard(card, true));
            card.addEventListener('mouseleave', () => this.animateFeatureCard(card, false));
        });

        // How it works step interactions
        document.querySelectorAll('.step').forEach((step, index) => {
            step.addEventListener('click', () => this.highlightStep(step, index));
        });
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        
        this.mobileMenuOpen = !this.mobileMenuOpen;
        
        if (this.mobileMenuOpen) {
            mobileMenu.classList.add('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        } else {
            mobileMenu.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }

    closeMobileMenu() {
        if (this.mobileMenuOpen) {
            this.toggleMobileMenu();
        }
    }

    handleSmoothScroll(e) {
        const href = e.target.getAttribute('href');
        
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('header')?.offsetHeight || 0;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                this.closeMobileMenu();
                
                // Update URL without triggering scroll
                history.pushState(null, null, href);
            }
        }
    }

    handleCTAClick(e) {
        const button = e.target;
        const action = button.dataset.action || 'get-started';
        
        // Add click animation
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
        
        // Handle different CTA actions
        switch (action) {
            case 'get-started':
                window.location.href = 'auth.html';
                break;
            case 'try-demo':
                window.location.href = 'dashboard.html?mode=guest';
                break;
            case 'learn-more':
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                break;
            default:
                window.location.href = 'auth.html';
        }
    }

    handleScroll() {
        const scrollY = window.scrollY;
        const header = document.querySelector('header');
        
        // Header background on scroll
        if (header) {
            if (scrollY > this.scrollThreshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        
        // Parallax effect for hero section
        const hero = document.querySelector('.hero');
        if (hero && scrollY < window.innerHeight) {
            const parallaxSpeed = 0.5;
            hero.style.transform = `translateY(${scrollY * parallaxSpeed}px)`;
        }
        
        // Animate elements on scroll
        this.animateOnScroll();
    }

    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768 && this.mobileMenuOpen) {
            this.closeMobileMenu();
        }
    }

    setupScrollEffects() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observe elements for animation
        document.querySelectorAll('.feature-card, .step, .stats-item').forEach(el => {
            observer.observe(el);
        });
    }

    setupAnimations() {
        // Add CSS classes for animations
        const style = document.createElement('style');
        style.textContent = `
            .animate-in {
                animation: fadeInUp 0.6s ease-out forwards;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .feature-card {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            
            .feature-card.hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            }
            
            .step {
                transition: transform 0.2s ease;
                cursor: pointer;
            }
            
            .step.highlighted {
                transform: scale(1.05);
            }
            
            header {
                transition: background-color 0.3s ease, backdrop-filter 0.3s ease;
            }
            
            header.scrolled {
                background-color: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
        `;
        document.head.appendChild(style);
    }

    setupFeatureCards() {
        // Add interactive icons to feature cards
        document.querySelectorAll('.feature-card').forEach((card, index) => {
            const icon = card.querySelector('.feature-icon');
            if (icon) {
                // Add hover effect to icons
                icon.style.transition = 'transform 0.3s ease';
            }
        });
    }

    animateFeatureCard(card, isHover) {
        if (isHover) {
            card.classList.add('hover');
            const icon = card.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
            }
        } else {
            card.classList.remove('hover');
            const icon = card.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = '';
            }
        }
    }

    highlightStep(step, index) {
        // Remove highlight from all steps
        document.querySelectorAll('.step').forEach(s => s.classList.remove('highlighted'));
        
        // Add highlight to clicked step
        step.classList.add('highlighted');
        
        // Optional: Show additional info or animation
        setTimeout(() => {
            step.classList.remove('highlighted');
        }, 2000);
    }

    animateOnScroll() {
        // Counter animation for stats
        const statsItems = document.querySelectorAll('.stats-item .stat-number');
        statsItems.forEach(item => {
            if (this.isElementInViewport(item) && !item.dataset.animated) {
                this.animateCounter(item);
                item.dataset.animated = 'true';
            }
        });
    }

    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    animateCounter(element) {
        const target = parseInt(element.textContent.replace(/[^0-9]/g, ''));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            const suffix = element.textContent.replace(/[0-9]/g, '');
            element.textContent = Math.floor(current) + suffix;
        }, 16);
    }

    // Utility method to add loading states
    showLoading(element) {
        element.style.opacity = '0.6';
        element.style.pointerEvents = 'none';
    }

    hideLoading(element) {
        element.style.opacity = '';
        element.style.pointerEvents = '';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomepageManager();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations when page is hidden
        document.body.style.animationPlayState = 'paused';
    } else {
        // Resume animations when page is visible
        document.body.style.animationPlayState = 'running';
    }
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HomepageManager;
}