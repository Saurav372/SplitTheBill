// Firebase Configuration and Initialization
// This file sets up Firebase services for SplitTheBill application

// Firebase configuration object
// Note: Replace these with your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};

// Initialize Firebase
let app;
let auth;
let db;
let isFirebaseInitialized = false;

try {
    // Initialize Firebase App
    app = firebase.initializeApp(firebaseConfig);
    
    // Initialize Firebase Authentication
    auth = firebase.auth();
    
    // Initialize Firestore Database
    db = firebase.firestore();
    
    // Configure Firestore settings BEFORE enabling persistence or any other calls
    try {
        db.settings({
            cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
        });
    } catch (e) {
        console.warn('Firestore settings error:', e);
    }
    
    // Enable offline persistence for Firestore
    db.enablePersistence({
        synchronizeTabs: true
    }).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Firebase persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.warn('Firebase persistence not supported by browser');
        }
    });
    
    isFirebaseInitialized = true;
    console.log('Firebase initialized successfully');
    
} catch (error) {
    console.error('Firebase initialization failed:', error);
    isFirebaseInitialized = false;
}

// Firebase Authentication State Observer
let currentUser = null;
let authStateListeners = [];

if (isFirebaseInitialized) {
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        
        // Notify all listeners about auth state change
        authStateListeners.forEach(listener => {
            try {
                listener(user);
            } catch (error) {
                console.error('Auth state listener error:', error);
            }
        });
        
        // Update UI based on auth state
        updateAuthUI(user);
    });
}

// Function to add auth state change listeners
function addAuthStateListener(callback) {
    if (typeof callback === 'function') {
        authStateListeners.push(callback);
        
        // If user is already loaded, call the callback immediately
        if (currentUser !== null) {
            callback(currentUser);
        }
    }
}

// Function to remove auth state change listeners
function removeAuthStateListener(callback) {
    const index = authStateListeners.indexOf(callback);
    if (index > -1) {
        authStateListeners.splice(index, 1);
    }
}

// Function to update authentication UI elements
function updateAuthUI(user) {
    // Update user avatar and name in header
    const userNameEl = document.getElementById('user-name');
    const userModeEl = document.getElementById('user-mode');
    const userAvatarEl = document.getElementById('user-avatar-img');
    const dropdownNameEl = document.getElementById('dropdown-name');
    const dropdownEmailEl = document.getElementById('dropdown-email');
    const dropdownAvatarEl = document.getElementById('dropdown-avatar');
    const guestWarningEl = document.getElementById('guest-warning');
    
    if (user) {
        // Authenticated user
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
        const email = user.email || 'No email';
        const photoURL = user.photoURL || '/assets/placeholder.svg';
        
        if (userNameEl) userNameEl.textContent = displayName;
        if (userModeEl) userModeEl.textContent = 'Signed In';
        if (userAvatarEl) userAvatarEl.src = photoURL;
        if (dropdownNameEl) dropdownNameEl.textContent = displayName;
        if (dropdownEmailEl) dropdownEmailEl.textContent = email;
        if (dropdownAvatarEl) dropdownAvatarEl.src = photoURL;
        if (guestWarningEl) guestWarningEl.style.display = 'none';
        
    } else {
        // Guest user or not authenticated
        if (userNameEl) userNameEl.textContent = 'Guest User';
        if (userModeEl) userModeEl.textContent = 'Guest Mode';
        if (userAvatarEl) {
  userAvatarEl.src = '/assets/placeholder.svg';
  userAvatarEl.setAttribute('data-placeholder', 'user-avatar');
}
        if (dropdownNameEl) dropdownNameEl.textContent = 'Guest User';
        if (dropdownEmailEl) dropdownEmailEl.textContent = 'guest@splitthebill.app';
        if (dropdownAvatarEl) {
  dropdownAvatarEl.src = '/assets/placeholder.svg';
  dropdownAvatarEl.setAttribute('data-placeholder', 'user-avatar');
}
        if (guestWarningEl) guestWarningEl.style.display = 'block';
    }
}

// Authentication helper functions
const FirebaseAuth = {
    // Sign in with email and password
    signInWithEmail: async (email, password) => {
        if (!isFirebaseInitialized) {
            throw new Error('Firebase not initialized');
        }
        
        try {
            const result = await auth.signInWithEmailAndPassword(email, password);
            return result.user;
        } catch (error) {
            console.error('Email sign in error:', error);
            throw error;
        }
    },
    
    // Sign up with email and password
    signUpWithEmail: async (email, password, displayName = null) => {
        if (!isFirebaseInitialized) {
            throw new Error('Firebase not initialized');
        }
        
        try {
            const result = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update user profile with display name
            if (displayName && result.user) {
                await result.user.updateProfile({
                    displayName: displayName
                });
            }
            
            return result.user;
        } catch (error) {
            console.error('Email sign up error:', error);
            throw error;
        }
    },
    
    // Sign in with Google
    signInWithGoogle: async () => {
        if (!isFirebaseInitialized) {
            throw new Error('Firebase not initialized');
        }
        
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            const result = await auth.signInWithPopup(provider);
            return result.user;
        } catch (error) {
            console.error('Google sign in error:', error);
            throw error;
        }
    },
    
    // Sign out
    signOut: async () => {
        if (!isFirebaseInitialized) {
            return; // No need to sign out if Firebase isn't initialized
        }
        
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    },
    
    // Send password reset email
    sendPasswordReset: async (email) => {
        if (!isFirebaseInitialized) {
            throw new Error('Firebase not initialized');
        }
        
        try {
            await auth.sendPasswordResetEmail(email);
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    },
    
    // Get current user
    getCurrentUser: () => {
        return currentUser;
    },
    
    // Check if user is authenticated
    isAuthenticated: () => {
        return currentUser !== null;
    }
};

// Firestore helper functions
const FirebaseDB = {
    // Collections
    collections: {
        users: 'users',
        groups: 'groups',
        expenses: 'expenses',
        members: 'members',
        settlements: 'settlements'
    },
    
    // Create document
    create: async (collection, data, docId = null) => {
        if (!isFirebaseInitialized) {
            throw new Error('Firebase not initialized');
        }
        
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const docData = {
                ...data,
                createdAt: timestamp,
                updatedAt: timestamp,
                userId: currentUser?.uid || 'guest'
            };
            
            let docRef;
            if (docId) {
                docRef = db.collection(collection).doc(docId);
                await docRef.set(docData);
            } else {
                docRef = await db.collection(collection).add(docData);
            }
            
            return docRef.id;
        } catch (error) {
            console.error('Firestore create error:', error);
            throw error;
        }
    },
    
    // Read document
    read: async (collection, docId) => {
        if (!isFirebaseInitialized) {
            throw new Error('Firebase not initialized');
        }
        
        try {
            const doc = await db.collection(collection).doc(docId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error('Firestore read error:', error);
            throw error;
        }
    },
    
    // Update document
    update: async (collection, docId, data) => {
        if (!isFirebaseInitialized) {
            throw new Error('Firebase not initialized');
        }
        
        try {
            const updateData = {
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection(collection).doc(docId).update(updateData);
        } catch (error) {
            console.error('Firestore update error:', error);
            throw error;
        }
    },
    
    // Delete document
    delete: async (collection, docId) => {
        if (!isFirebaseInitialized) {
            throw new Error('Firebase not initialized');
        }
        
        try {
            await db.collection(collection).doc(docId).delete();
        } catch (error) {
            console.error('Firestore delete error:', error);
            throw error;
        }
    },
    
    // Query documents
    query: async (collection, conditions = [], orderBy = null, limit = null) => {
        if (!isFirebaseInitialized) {
            throw new Error('Firebase not initialized');
        }
        
        try {
            let query = db.collection(collection);
            
            // Apply conditions
            conditions.forEach(condition => {
                const [field, operator, value] = condition;
                query = query.where(field, operator, value);
            });
            
            // Apply ordering
            if (orderBy) {
                const [field, direction = 'asc'] = orderBy;
                query = query.orderBy(field, direction);
            }
            
            // Apply limit
            if (limit) {
                query = query.limit(limit);
            }
            
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Firestore query error:', error);
            throw error;
        }
    },
    
    // Listen to real-time updates
    listen: (collection, conditions = [], callback) => {
        if (!isFirebaseInitialized) {
            console.warn('Firebase not initialized, cannot listen to real-time updates');
            return () => {}; // Return empty unsubscribe function
        }
        
        try {
            let query = db.collection(collection);
            
            // Apply conditions
            conditions.forEach(condition => {
                const [field, operator, value] = condition;
                query = query.where(field, operator, value);
            });
            
            return query.onSnapshot(snapshot => {
                const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(docs);
            }, error => {
                console.error('Firestore listen error:', error);
            });
        } catch (error) {
            console.error('Firestore listen setup error:', error);
            return () => {}; // Return empty unsubscribe function
        }
    }
};

// Export Firebase services and helpers
window.FirebaseAuth = FirebaseAuth;
window.FirebaseDB = FirebaseDB;
window.addAuthStateListener = addAuthStateListener;
window.removeAuthStateListener = removeAuthStateListener;
window.isFirebaseInitialized = () => isFirebaseInitialized;

// For debugging in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.firebase = firebase;
    window.auth = auth;
    window.db = db;
    console.log('Firebase services exposed to window for debugging');
}