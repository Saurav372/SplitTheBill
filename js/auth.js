/**
 * Authentication Module
 * Handles user authentication, registration, and session management
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        this.isGuest = false;
        this.guestData = null;
        
        // Initialize auth state listener
        this.initAuthStateListener();
        
        // Initialize UI event listeners
        this.initEventListeners();
        
        // Check for existing guest session
        this.checkGuestSession();
        
        // Handle redirect result for mobile social sign-in
        this.handleRedirectResult();
    }

    /**
     * Initialize Firebase auth state listener
     */
    initAuthStateListener() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
                this.isGuest = false;
                this.notifyAuthStateChange(user);
                
                if (user) {
                    console.log('User signed in:', user.email);
                    this.handleAuthSuccess(user);
                } else {
                    console.log('User signed out');
                    this.handleAuthSignOut();
                }
            });
        }
    }

    /**
     * Initialize UI event listeners
     */
    initEventListeners() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.bindEventListeners();
            });
        } else {
            this.bindEventListeners();
        }
    }

    /**
     * Bind event listeners to UI elements
     */
    bindEventListeners() {
        // Guest mode button
        const guestBtn = DOM.get('guest-mode-btn');
        if (guestBtn) {
            guestBtn.addEventListener('click', () => this.handleGuestMode());
        }

        // Sign in form
        const signInForm = DOM.get('signin-form');
        if (signInForm) {
            signInForm.addEventListener('submit', (e) => this.handleSignIn(e));
        }

        // Sign up form
        const signUpForm = DOM.get('signup-form');
        if (signUpForm) {
            signUpForm.addEventListener('submit', (e) => this.handleSignUp(e));
        }

        // Forgot password form
        const forgotForm = DOM.get('forgot-password-form');
        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        }

        // Social auth buttons
        const googleBtn = DOM.get('google-signin-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleSignIn());
        }

        const appleBtn = DOM.get('apple-signin-btn');
        if (appleBtn) {
            appleBtn.addEventListener('click', () => this.handleAppleSignIn());
        }

        // Navigation links
        const navLinks = DOM.queryAll('.auth-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Password strength indicator
        const passwordInputs = DOM.queryAll('input[type="password"]');
        passwordInputs.forEach(input => {
            if (input.id.includes('password') && !input.id.includes('confirm')) {
                input.addEventListener('input', (e) => this.updatePasswordStrength(e));
            }
        });

        // Sign out button (if on dashboard)
        const signOutBtn = DOM.get('signout-btn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }
    }

    /**
     * Handle guest mode
     */
    async handleGuestMode() {
        try {
            this.showLoading('guest-mode-btn');
            
            // Generate guest user data
            const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.guestData = {
                id: guestId,
                email: `${guestId}@guest.local`,
                displayName: 'Guest User',
                isGuest: true,
                createdAt: new Date().toISOString(),
                preferences: {
                    currency: 'USD',
                    language: 'en',
                    theme: 'light'
                }
            };
            
            // Store guest session
            Storage.set('guestSession', this.guestData);
            this.isGuest = true;
            
            // Initialize guest data structure
            this.initializeGuestData();
            
            // Simulate auth success
            this.notifyAuthStateChange(this.guestData);
            
            this.showSuccess('Welcome! You\'re now using SplitTheBill as a guest.');
            
            // Redirect to dashboard
            await Timing.delay(1000);
            window.location.href = 'dashboard.html?mode=guest';
            
        } catch (error) {
            this.handleAuthError(error, 'guest-mode');
        } finally {
            this.hideLoading('guest-mode-btn');
        }
    }

    /**
     * Initialize guest data structure
     */
    initializeGuestData() {
        // Initialize empty data structures for guest mode
        const guestData = {
            groups: [],
            expenses: [],
            members: [],
            settlements: []
        };
        
        Object.keys(guestData).forEach(key => {
            if (!Storage.get(`guest_${key}`)) {
                Storage.set(`guest_${key}`, guestData[key]);
            }
        });
    }

    /**
     * Handle sign in
     */
    async handleSignIn(event) {
        event.preventDefault();
        
        const form = event.target;
        const email = form.email.value.trim();
        const password = form.password.value;
        const rememberMe = form.remember?.checked || false;
        
        // Validate inputs
        if (!this.validateSignInForm(email, password)) {
            return;
        }
        
        try {
            this.showLoading('signin-btn');
            this.clearErrors();
            
            // Sign in with Firebase
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            
            // Handle remember me
            if (rememberMe) {
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            } else {
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
            }
            
            this.showSuccess('Welcome back! Redirecting to dashboard...');
            
            // Redirect to dashboard
            await Timing.delay(1000);
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            this.handleAuthError(error, 'signin');
        } finally {
            this.hideLoading('signin-btn');
        }
    }

    /**
     * Handle sign up
     */
    async handleSignUp(event) {
        event.preventDefault();
        
        const form = event.target;
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;
        const agreeTerms = form.agreeTerms?.checked || false;
        
        // Validate inputs
        if (!this.validateSignUpForm(name, email, password, confirmPassword, agreeTerms)) {
            return;
        }
        
        try {
            this.showLoading('signup-btn');
            this.clearErrors();
            
            // Create user with Firebase
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update user profile
            await user.updateProfile({
                displayName: name
            });
            
            // Create user document in Firestore
            await this.createUserDocument(user, { name, email });
            
            // Send email verification
            await user.sendEmailVerification();
            
            this.showSuccess('Account created successfully! Please check your email for verification.');
            
            // Redirect to dashboard
            await Timing.delay(2000);
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            this.handleAuthError(error, 'signup');
        } finally {
            this.hideLoading('signup-btn');
        }
    }

    /**
     * Handle forgot password
     */
    async handleForgotPassword(event) {
        event.preventDefault();
        
        const form = event.target;
        const email = form.email.value.trim();
        
        if (!Validation.isValidEmail(email)) {
            this.showError('Please enter a valid email address.');
            return;
        }
        
        try {
            this.showLoading('forgot-password-btn');
            this.clearErrors();
            
            await firebase.auth().sendPasswordResetEmail(email);
            
            this.showSuccess('Password reset email sent! Please check your inbox.');
            
            // Switch back to sign in after delay
            await Timing.delay(3000);
            this.showSection('signin');
            
        } catch (error) {
            this.handleAuthError(error, 'forgot-password');
        } finally {
            this.hideLoading('forgot-password-btn');
        }
    }

    /**
     * Handle Google Sign In
     */
    async handleGoogleSignIn() {
        await this.handleSocialSignIn('google');
    }

    /**
     * Handle Apple Sign In
     */
    async handleAppleSignIn() {
        await this.handleSocialSignIn('apple');
    }

    /**
     * Handle social authentication (Google/Apple)
     */
    async handleSocialSignIn(provider) {
        try {
            this.showLoading(`${provider}-signin-btn`);
            
            let authProvider;
            if (provider === 'google') {
                authProvider = new firebase.auth.GoogleAuthProvider();
                authProvider.addScope('email');
                authProvider.addScope('profile');
                // Set custom parameters for better UX
                authProvider.setCustomParameters({
                    prompt: 'select_account'
                });
            } else if (provider === 'apple') {
                authProvider = new firebase.auth.OAuthProvider('apple.com');
                authProvider.addScope('email');
                authProvider.addScope('name');
                // Set custom parameters for Apple
                authProvider.setCustomParameters({
                    locale: 'en'
                });
            }
            
            // Try popup first, fallback to redirect on mobile
            let result;
            if (this.isMobile()) {
                await firebase.auth().signInWithRedirect(authProvider);
                return; // Will handle result on page load
            } else {
                result = await firebase.auth().signInWithPopup(authProvider);
            }
            
            const user = result.user;
            const credential = result.credential;
            
            // Extract additional user info
            const additionalUserInfo = result.additionalUserInfo;
            const isNewUser = additionalUserInfo?.isNewUser || false;
            
            // Create or update user document
            await this.createUserDocument(user, {
                name: user.displayName || `${provider} User`,
                email: user.email,
                photoURL: user.photoURL,
                provider: provider,
                signInMethod: provider,
                lastSignIn: new Date().toISOString(),
                isNewUser,
                profile: additionalUserInfo?.profile || {}
            });
            
            // Show appropriate success message
            const message = isNewUser 
                ? `Welcome! Your account has been created with ${provider}.`
                : `Successfully signed in with ${provider}!`;
            this.showSuccess(message);
            
            // Redirect to dashboard
            await Timing.delay(1000);
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            console.error(`${provider} sign-in error:`, error);
            
            let errorMessage = `Failed to sign in with ${provider}.`;
            
            // Handle specific error codes
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Sign-in was cancelled.';
                    break;
                case 'auth/popup-blocked':
                    errorMessage = 'Pop-up was blocked. Please allow pop-ups and try again.';
                    break;
                case 'auth/account-exists-with-different-credential':
                    errorMessage = 'An account already exists with this email using a different sign-in method.';
                    break;
                case 'auth/credential-already-in-use':
                    errorMessage = 'This account is already linked to another user.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = `${provider} sign-in is not enabled. Please contact support.`;
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection and try again.';
                    break;
                default:
                    if (error.code !== 'auth/popup-closed-by-user') {
                        errorMessage = `Failed to sign in with ${provider}. Please try again.`;
                    }
            }
            
            if (error.code !== 'auth/popup-closed-by-user') {
                this.showError(errorMessage);
            }
        } finally {
            this.hideLoading(`${provider}-signin-btn`);
        }
    }
    
    /**
     * Check if device is mobile
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Handle redirect result for mobile social sign-in
     */
    async handleRedirectResult() {
        try {
            const result = await firebase.auth().getRedirectResult();
            if (result && result.user) {
                const user = result.user;
                const additionalUserInfo = result.additionalUserInfo;
                const isNewUser = additionalUserInfo?.isNewUser || false;
                const provider = result.credential?.signInMethod || 'unknown';
                
                // Create or update user document
                await this.createUserDocument(user, {
                    name: user.displayName || `${provider} User`,
                    email: user.email,
                    photoURL: user.photoURL,
                    provider: provider,
                    signInMethod: 'redirect',
                    lastSignIn: new Date().toISOString(),
                    isNewUser,
                    profile: additionalUserInfo?.profile || {}
                });
                
                const message = isNewUser 
                    ? 'Welcome! Your account has been created.'
                    : 'Successfully signed in!';
                this.showSuccess(message);
                
                // Redirect to dashboard
                await Timing.delay(1000);
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.error('Redirect result error:', error);
            this.showError('Failed to complete sign-in. Please try again.');
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            if (this.isGuest) {
                // Clear guest session
                Storage.remove('guestSession');
                this.isGuest = false;
                this.guestData = null;
                this.notifyAuthStateChange(null);
            } else {
                // Sign out from Firebase
                await firebase.auth().signOut();
            }
            
            // Redirect to home page
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('Sign out error:', error);
            this.showError('Error signing out. Please try again.');
        }
    }

    /**
     * Create user document in Firestore
     */
    async createUserDocument(user, additionalData = {}) {
        if (!user) return;
        
        try {
            const userRef = firebase.firestore().doc(`users/${user.uid}`);
            const snapshot = await userRef.get();
            
            if (!snapshot.exists) {
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || additionalData.name || 'User',
                    photoURL: user.photoURL || null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                    settings: {
                        currency: 'USD',
                        language: 'en',
                        theme: 'light',
                        notifications: {
                            email: true,
                            push: true,
                            expenseUpdates: true,
                            groupInvites: true
                        }
                    },
                    ...additionalData
                };
                
                await userRef.set(userData);
                console.log('User document created successfully');
            } else {
                // Update last login
                await userRef.update({
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error creating user document:', error);
        }
    }

    /**
     * Check for existing guest session
     */
    checkGuestSession() {
        const guestSession = Storage.get('guestSession');
        if (guestSession && guestSession.isGuest) {
            this.isGuest = true;
            this.guestData = guestSession;
            this.notifyAuthStateChange(guestSession);
        }
    }

    /**
     * Validate sign in form
     */
    validateSignInForm(email, password) {
        if (!Validation.isValidEmail(email)) {
            this.showError('Please enter a valid email address.');
            return false;
        }
        
        if (!Validation.isRequired(password)) {
            this.showError('Password is required.');
            return false;
        }
        
        return true;
    }

    /**
     * Validate sign up form
     */
    validateSignUpForm(name, email, password, confirmPassword, agreeTerms) {
        if (!Validation.isRequired(name)) {
            this.showError('Name is required.');
            return false;
        }
        
        if (!Validation.isValidEmail(email)) {
            this.showError('Please enter a valid email address.');
            return false;
        }
        
        const passwordValidation = this.validatePassword(password);
        if (passwordValidation.length > 0) {
            this.showError(passwordValidation[0]);
            return false;
        }
        
        if (password !== confirmPassword) {
            this.showError('Passwords do not match.');
            return false;
        }
        
        if (!agreeTerms) {
            this.showError('Please agree to the Terms of Service and Privacy Policy.');
            return false;
        }
        
        return true;
    }

    /**
     * Enhanced password validation
     */
    validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        return errors;
    }

    /**
     * Update password strength indicator
     */
    updatePasswordStrength(event) {
        const password = event.target.value;
        const validation = Validation.validatePassword(password);
        
        const strengthBar = DOM.query('.strength-fill');
        const strengthText = DOM.query('.strength-text');
        
        if (strengthBar && strengthText) {
            // Remove existing classes
            strengthBar.className = 'strength-fill';
            
            if (password.length > 0) {
                strengthBar.classList.add(validation.strength);
                strengthText.textContent = `Password strength: ${Format.capitalize(validation.strength)}`;
            } else {
                strengthText.textContent = '';
            }
        }
    }

    /**
     * Handle navigation between auth sections
     */
    handleNavigation(event) {
        event.preventDefault();
        const target = event.target.dataset.target;
        if (target) {
            this.showSection(target);
        }
    }

    /**
     * Show specific auth section
     */
    showSection(sectionName) {
        // Hide all sections
        const sections = DOM.queryAll('.auth-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = DOM.get(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Clear any existing errors
        this.clearErrors();
    }

    /**
     * Handle authentication errors
     */
    handleAuthError(error, context) {
        console.error(`Auth error (${context}):`, error);
        
        let message = 'An error occurred. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'No account found with this email address.';
                break;
            case 'auth/wrong-password':
                message = 'Incorrect password. Please try again.';
                break;
            case 'auth/email-already-in-use':
                message = 'An account with this email already exists.';
                break;
            case 'auth/weak-password':
                message = 'Password is too weak. Please choose a stronger password.';
                break;
            case 'auth/invalid-email':
                message = 'Please enter a valid email address.';
                break;
            case 'auth/user-disabled':
                message = 'This account has been disabled. Please contact support.';
                break;
            case 'auth/too-many-requests':
                message = 'Too many failed attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                message = 'Network error. Please check your connection and try again.';
                break;
            default:
                message = error.message || message;
        }
        
        this.showError(message);
    }

    /**
     * Handle successful authentication
     */
    handleAuthSuccess(user) {
        // Store user info for quick access
        if (user && !this.isGuest) {
            Storage.set('currentUser', {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified
            });
        }
    }

    /**
     * Handle sign out
     */
    handleAuthSignOut() {
        // Clear stored user data
        Storage.remove('currentUser');
        Storage.remove('guestSession');
    }

    /**
     * Show loading state
     */
    showLoading(buttonId) {
        const button = DOM.get(buttonId);
        if (button) {
            button.disabled = true;
            button.classList.add('btn-loading');
        }
    }

    /**
     * Hide loading state
     */
    hideLoading(buttonId) {
        const button = DOM.get(buttonId);
        if (button) {
            button.disabled = false;
            button.classList.remove('btn-loading');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show message
     */
    showMessage(message, type = 'error') {
        // Remove existing messages
        this.clearErrors();
        
        // Create message element
        const messageEl = DOM.create('div', {
            className: `auth-${type}`,
            innerHTML: `
                <span class="auth-${type}-icon">${type === 'error' ? '⚠️' : '✅'}</span>
                <span>${message}</span>
            `
        });
        
        // Insert at the top of the active section
        const activeSection = DOM.query('.auth-section.active');
        if (activeSection) {
            const form = activeSection.querySelector('form');
            if (form) {
                form.insertBefore(messageEl, form.firstChild);
            } else {
                activeSection.insertBefore(messageEl, activeSection.firstChild);
            }
        }
    }

    /**
     * Clear error messages
     */
    clearErrors() {
        const messages = DOM.queryAll('.auth-error, .auth-success');
        messages.forEach(message => message.remove());
    }

    /**
     * Add auth state change listener
     */
    onAuthStateChange(callback) {
        this.authStateListeners.push(callback);
        
        // Call immediately with current state
        if (this.isGuest && this.guestData) {
            callback(this.guestData);
        } else if (this.currentUser) {
            callback(this.currentUser);
        }
    }

    /**
     * Notify auth state change listeners
     */
    notifyAuthStateChange(user) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Auth state listener error:', error);
            }
        });
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        if (this.isGuest) {
            return this.guestData;
        }
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!(this.currentUser || (this.isGuest && this.guestData));
    }

    /**
     * Check if user is guest
     */
    isGuestUser() {
        return this.isGuest;
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for global access
window.AuthManager = authManager;

console.log('✅ Auth module loaded successfully');