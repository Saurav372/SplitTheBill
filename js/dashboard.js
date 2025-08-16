/**
 * Dashboard Manager - Handles main application functionality
 * Manages SPA routing, authentication, and dashboard operations
 */
class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.currentTab = 'groups';
        this.isLoading = false;
        
        // Data arrays
        this.groups = [];
        this.members = [];
        this.expenses = [];
        this.notifications = [];
        
        // Initialize I18n Manager
        this.i18n = new I18nManager();
    }
    
    /**
     * Initialize the dashboard
     */
    async init() {
        try {
            this.showLoadingScreen();
            
            // Initialize I18n first
            await this.i18n.init();
            
            // Enable guest mode via URL param if specified
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('mode') === 'guest') {
                localStorage.setItem('splitbill_guest_mode', 'true');
                // Seed a basic guest user if not present
                if (!localStorage.getItem('guestUser')) {
                    const guestUser = {
                        uid: 'guest',
                        email: 'guest@splitbill.com',
                        displayName: 'Guest User',
                        isGuest: true,
                        preferences: {
                            currency: 'USD',
                            language: this.i18n?.currentLanguage || 'en',
                            theme: 'light'
                        }
                    };
                    localStorage.setItem('guestUser', JSON.stringify(guestUser));
                }
            }
            
            // Check authentication first
            await this.checkAuthentication();
            
            // Update language and currency selects with saved preferences
            this.updateLocalizationUI();
            
            // Initialize event listeners
            this.initEventListeners();
            
            // Initialize SPA routing
            this.initSPARouting();
            
            // Load initial data
            await this.loadInitialData();
            
            this.hideLoadingScreen();
        } catch (error) {
            this.handleError('Failed to initialize dashboard', error);
        }
    }
    
    /**
     * Check user authentication status
     */
    async checkAuthentication() {
        return new Promise((resolve, reject) => {
            // Check if user is in guest mode
            const guestMode = localStorage.getItem('splitbill_guest_mode');
            if (guestMode === 'true') {
                this.currentUser = {
                    uid: 'guest',
                    email: 'guest@splitbill.com',
                    displayName: 'Guest User',
                    isGuest: true,
                    preferences: {
                        currency: 'USD',
                        language: 'en',
                        theme: 'light'
                    }
                };
                this.showGuestWarning();
                resolve(this.currentUser);
                return;
            }
            
            // Check if Firebase is available and supported
            if (!this.isFirebaseSupported()) {
                // Fall back to guest mode automatically
                const existingGuest = localStorage.getItem('guestUser');
                if (existingGuest) {
                    try {
                        this.currentUser = { ...JSON.parse(existingGuest), isGuest: true };
                    } catch (_) {
                        this.currentUser = {
                            uid: 'guest',
                            email: 'guest@splitbill.com',
                            displayName: 'Guest User',
                            isGuest: true,
                            preferences: { currency: 'USD', language: 'en', theme: 'light' }
                        };
                    }
                } else {
                    this.currentUser = {
                        uid: 'guest',
                        email: 'guest@splitbill.com',
                        displayName: 'Guest User',
                        isGuest: true,
                        preferences: { currency: 'USD', language: 'en', theme: 'light' }
                    };
                    localStorage.setItem('guestUser', JSON.stringify(this.currentUser));
                }
                localStorage.setItem('splitbill_guest_mode', 'true');
                this.showGuestWarning();
                resolve(this.currentUser);
                return;
            }
            
            // Check Firebase authentication
            try {
                firebase.auth().onAuthStateChanged((user) => {
                    if (user) {
                        this.currentUser = user;
                        this.hideGuestWarning();
                        this.loadUserProfile();
                        resolve(user);
                    } else {
                        // Redirect to auth page if not authenticated
                        window.location.href = '/auth.html';
                        reject(new Error('User not authenticated'));
                    }
                });
            } catch (error) {
                console.error('Firebase authentication error:', error);
                // Auto guest fallback on error
                const existingGuest = localStorage.getItem('guestUser');
                if (existingGuest) {
                    try {
                        this.currentUser = { ...JSON.parse(existingGuest), isGuest: true };
                        localStorage.setItem('splitbill_guest_mode', 'true');
                        this.showGuestWarning();
                        resolve(this.currentUser);
                        return;
                    } catch (_) { /* fallthrough */ }
                }
                this.currentUser = {
                    uid: 'guest',
                    email: 'guest@splitbill.com',
                    displayName: 'Guest User',
                    isGuest: true,
                    preferences: { currency: 'USD', language: 'en', theme: 'light' }
                };
                localStorage.setItem('guestUser', JSON.stringify(this.currentUser));
                localStorage.setItem('splitbill_guest_mode', 'true');
                this.showGuestWarning();
                resolve(this.currentUser);
            }
        });
    }
    
    /**
     * Check if Firebase is supported in current environment
     */
    isFirebaseSupported() {
        // Check if running in supported protocol
        const supportedProtocols = ['http:', 'https:', 'chrome-extension:'];
        if (!supportedProtocols.includes(window.location.protocol)) {
            return false;
        }
        
        // Check if web storage is enabled
        try {
            const testKey = '__firebase_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
        } catch (error) {
            return false;
        }
        
        // Check if Firebase is defined and available
        return typeof firebase !== 'undefined' && firebase.auth;
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Sidebar toggle
        const menuToggle = DOM.get('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                const sidebar = DOM.get('sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('active');
                }
            });
        }
        
        // Tab navigation
        const navTabs = DOM.getAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.dataset.tab;
                if (tabName) {
                    this.showTab(tabName);
                }
            });
        });
        
        // User menu toggle
        const userMenuToggle = DOM.get('user-menu-toggle');
        if (userMenuToggle) {
            userMenuToggle.addEventListener('click', () => {
                const userDropdown = DOM.get('user-dropdown');
                if (userDropdown) {
                    userDropdown.classList.toggle('active');
                }
            });
        }
        
        // Notifications toggle
        const notificationsBtn = DOM.get('notifications-btn');
        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', () => {
                const notificationsDropdown = DOM.get('notifications-dropdown');
                if (notificationsDropdown) {
                    notificationsDropdown.classList.toggle('active');
                }
            });
        }
        
        // Sign out button
        const logoutBtn = DOM.get('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSignOut();
            });
        }
        
        // Theme toggle
        const themeToggle = DOM.get('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Search functionality
        const searchInput = DOM.get('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        // PDF Export button
        const exportPdfBtn = DOM.get('export-pdf-btn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                this.openPdfExportModal();
            });
        }
        
        // PDF Export modal event listeners
        this.initPdfExportListeners();
        
        // Language selection
        const languageSelect = DOM.get('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.handleLanguageChange(e.target.value);
            });
        }
        
        // Currency selection
        const currencySelect = DOM.get('currency-select');
        if (currencySelect) {
            currencySelect.addEventListener('change', (e) => {
                this.handleCurrencyChange(e.target.value);
            });
        }
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                const userDropdown = DOM.get('user-dropdown');
                if (userDropdown) {
                    userDropdown.classList.remove('active');
                }
            }
            
            if (!e.target.closest('.notifications')) {
                const notificationsDropdown = DOM.get('notifications-dropdown');
                if (notificationsDropdown) {
                    notificationsDropdown.classList.remove('active');
                }
            }
        });
    }
    
    /**
     * Initialize SPA routing
     */
    initSPARouting() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            const tab = this.getInitialTab();
            this.showTab(tab, false); // Don't update history
        });
        
        // Load initial tab from URL
        const initialTab = this.getInitialTab();
        this.showTab(initialTab, false);
    }
    
    /**
     * Get initial tab from URL hash
     */
    getInitialTab() {
        const hash = window.location.hash.substring(1);
        const validTabs = ['groups', 'members', 'expenses', 'analytics', 'settings'];
        return validTabs.includes(hash) ? hash : 'groups';
    }
    
    /**
     * Show specific tab
     */
    showTab(tabName, updateHistory = true) {
        // Update current tab
        this.currentTab = tabName;
        
        // Update URL hash
        if (updateHistory) {
            window.history.pushState(null, null, `#${tabName}`);
        }
        
        // Update page title
        document.title = `SplitTheBill - ${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
        
        // Hide all tab contents
        const tabContents = DOM.getAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected tab content
        const selectedTab = DOM.get(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Update navigation active state
        const navTabs = DOM.getAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeNavTab = DOM.get(`${tabName}-nav`);
        if (activeNavTab) {
            activeNavTab.classList.add('active');
        }
        
        // Close mobile sidebar on smaller screens
        if (window.innerWidth <= 768) {
            const sidebar = DOM.get('sidebar');
            if (sidebar) {
                sidebar.classList.remove('active');
            }
        }
        
        // Load tab-specific data
        this.loadTabData(tabName);
    }
    
    /**
     * Load data for specific tab
     */
    async loadTabData(tabName) {
        try {
            switch (tabName) {
                case 'groups':
                    await this.loadGroups();
                    break;
                case 'members':
                    await this.loadMembers();
                    break;
                case 'expenses':
                    await this.loadExpenses();
                    break;
                case 'analytics':
                    await this.loadAnalytics();
                    break;
                case 'settings':
                    // Settings don't require data loading
                    break;
            }
        } catch (error) {
            this.handleError(`Failed to load ${tabName} data`, error);
        }
    }
    
    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            // Load user profile
            await this.loadUserProfile();
            
            // Load groups first (needed for members and expenses)
            await this.loadGroups();
            
            // Load other data
            await Promise.all([
                this.loadMembers(),
                this.loadExpenses()
            ]);
            
            // Update user UI
            this.updateUserUI();
        } catch (error) {
            this.handleError('Failed to load initial data', error);
        }
    }
    
    /**
     * Handle search functionality
     */
    handleSearch(query) {
        // TODO: Implement search across groups, members, and expenses
        console.log('Search query:', query);
    }
    
    /**
     * Update user UI
     */
    updateUserUI() {
        if (!this.currentUser) return;
        
        // Update user name
        const userNameEl = DOM.get('user-name');
        if (userNameEl) {
            userNameEl.textContent = this.currentUser.displayName || this.currentUser.name || 'User';
        }
        
        // Update user email
        const userEmailEl = DOM.get('user-email');
        if (userEmailEl) {
            userEmailEl.textContent = this.currentUser.email || '';
        }
        
        // Update user avatar
        const userAvatarEl = DOM.get('user-avatar');
        if (userAvatarEl) {
            if (this.currentUser.photoURL) {
                userAvatarEl.innerHTML = `<img src="${this.currentUser.photoURL}" alt="User Avatar" />`;
            } else {
                const initials = this.getInitials(this.currentUser.displayName || this.currentUser.email);
                userAvatarEl.innerHTML = `<div class="avatar-placeholder">${initials}</div>`;
            }
        }
    }
    
    /**
     * Show guest warning
     */
    showGuestWarning() {
        const guestWarning = DOM.get('guest-warning');
        if (guestWarning) {
            guestWarning.style.display = 'block';
        }
    }
    
    /**
     * Hide guest warning
     */
    hideGuestWarning() {
        const guestWarning = DOM.get('guest-warning');
        if (guestWarning) {
            guestWarning.style.display = 'none';
        }
    }
    
    /**
     * Toggle theme
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('splitbill_theme', newTheme);
        
        // Update user preferences if authenticated
        if (this.currentUser && !this.currentUser.isGuest) {
            this.updateUserPreferences({ theme: newTheme });
        }
    }
    
    /**
     * Handle sign out
     */
    async handleSignOut() {
        try {
            // Always clear local guest-related data
            localStorage.removeItem('splitbill_guest_mode');
            localStorage.removeItem('splitbill_groups');
            localStorage.removeItem('splitbill_members');
            localStorage.removeItem('splitbill_expenses');
            localStorage.removeItem('splitbill_settlements');
            localStorage.removeItem('guestUser');

            if (!this.currentUser?.isGuest) {
                // Sign out from Firebase only when available and supported
                if (this.isFirebaseSupported() && typeof firebase !== 'undefined' && firebase.auth) {
                    await firebase.auth().signOut();
                }
            }
            
            // Redirect to auth page
            window.location.href = '/auth.html';
        } catch (error) {
            this.handleError('Failed to sign out', error);
        }
    }
    
    /**
     * Update user preferences
     */
    async updateUserPreferences(preferences) {
        if (!this.currentUser || this.currentUser.isGuest) return;
        
        // Ensure Firebase is available before attempting to update
        if (!this.isFirebaseSupported() || typeof firebase === 'undefined' || !firebase.firestore) return;
        
        try {
            await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .update({ preferences });
        } catch (error) {
            console.error('Failed to update user preferences:', error);
        }
    }
    
    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = DOM.get('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = DOM.get('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
    
    /**
     * Show error message
     */
    showError(message, error = null) {
        console.error('Dashboard error:', message, error);
        
        // Create toast notification
        this.showToast(message, 'error');
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toastContainer = DOM.get('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getToastIcon(type)}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
    
    /**
     * Get toast icon based on type
     */
    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    /**
     * Handle errors
     */
    handleError(message, error = null) {
        this.hideLoadingScreen();
        this.showError(message, error);
    }
    
    /**
     * Load user profile
     */
    async loadUserProfile() {
        if (!this.currentUser || this.currentUser.isGuest) {
            return;
        }
        
        try {
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .get();
                
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.currentUser = { ...this.currentUser, ...userData };
                this.updateUserUI();
            }
        } catch (error) {
            this.handleError('Failed to load user profile', error);
        }
    }
    
    /**
     * Load groups data
     */
    async loadGroups() {
        if (this.currentUser?.isGuest) {
            // Load from localStorage for guest users
            const savedGroups = localStorage.getItem('splitbill_groups');
            this.groups = savedGroups ? JSON.parse(savedGroups) : [];
            this.renderGroups();
            return;
        }
        
        if (!this.currentUser) return;
        
        try {
            const groupsSnapshot = await firebase.firestore()
                .collection('groups')
                .where('members', 'array-contains', this.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();
                
            this.groups = groupsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.renderGroups();
        } catch (error) {
            this.handleError('Failed to load groups', error);
        }
    }
    
    /**
     * Load members data
     */
    async loadMembers() {
        if (this.currentUser?.isGuest) {
            // Load from localStorage for guest users
            const savedMembers = localStorage.getItem('splitbill_members');
            this.members = savedMembers ? JSON.parse(savedMembers) : [];
            this.renderMembers();
            return;
        }
        
        if (!this.currentUser) return;
        
        try {
            // Get unique member IDs from all groups
            const memberIds = new Set();
            this.groups.forEach(group => {
                group.members?.forEach(memberId => memberIds.add(memberId));
            });
            
            if (memberIds.size === 0) {
                this.members = [];
                this.renderMembers();
                return;
            }
            
            const membersSnapshot = await firebase.firestore()
                .collection('users')
                .where(firebase.firestore.FieldPath.documentId(), 'in', Array.from(memberIds))
                .get();
                
            this.members = membersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.renderMembers();
        } catch (error) {
            this.handleError('Failed to load members', error);
        }
    }
    
    /**
     * Load expenses data
     */
    async loadExpenses() {
        if (this.currentUser?.isGuest) {
            // Load from localStorage for guest users
            const savedExpenses = localStorage.getItem('splitbill_expenses');
            this.expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
            this.renderExpenses();
            return;
        }
        
        if (!this.currentUser) return;
        
        try {
            const expensesSnapshot = await firebase.firestore()
                .collection('expenses')
                .where('participants', 'array-contains', this.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .limit(100)
                .get();
                
            this.expenses = expensesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.renderExpenses();
        } catch (error) {
            this.handleError('Failed to load expenses', error);
        }
    }
    
    /**
     * Load analytics data
     */
    async loadAnalytics() {
        try {
            // Calculate analytics from existing data
            const analytics = {
                totalExpenses: this.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
                activeGroups: this.groups.filter(group => group.isActive !== false).length,
                userBalance: this.calculateUserBalance(),
                monthlyExpenses: this.calculateMonthlyExpenses()
            };
            
            this.renderAnalytics(analytics);
        } catch (error) {
            this.handleError('Failed to load analytics', error);
        }
    }
    
    /**
     * Calculate user balance
     */
    calculateUserBalance() {
        if (!this.currentUser) return 0;
        
        let balance = 0;
        this.expenses.forEach(expense => {
            if (expense.paidBy === this.currentUser.uid) {
                balance += expense.amount || 0;
            }
            
            const userShare = expense.splits?.find(split => split.userId === this.currentUser.uid);
            if (userShare) {
                balance -= userShare.amount || 0;
            }
        });
        
        return balance;
    }
    
    /**
     * Calculate monthly expenses
     */
    calculateMonthlyExpenses() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.expenses
            .filter(expense => {
                const expenseDate = expense.date ? new Date(expense.date) : new Date(expense.createdAt?.toDate?.() || expense.createdAt);
                return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
            })
            .reduce((sum, expense) => sum + (expense.amount || 0), 0);
    }
    
    /**
     * Render groups in the UI
     */
    renderGroups() {
        const groupsList = DOM.get('groups-list');
        const emptyState = DOM.get('groups-empty');
        
        if (!groupsList) return;
        
        if (this.groups.length === 0) {
            groupsList.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        groupsList.style.display = 'block';
        
        groupsList.innerHTML = this.groups.map(group => `
            <div class="group-card" data-group-id="${group.id}">
                <div class="group-header">
                    <h3 class="group-name">${group.name || 'Unnamed Group'}</h3>
                    <div class="group-actions">
                        <button class="btn-icon" onclick="dashboardManager.editGroup('${group.id}')" title="Edit Group">
                            <i class="icon-edit">✏️</i>
                        </button>
                        <button class="btn-icon" onclick="dashboardManager.deleteGroup('${group.id}')" title="Delete Group">
                            <i class="icon-delete">🗑️</i>
                        </button>
                    </div>
                </div>
                <div class="group-info">
                    <p class="group-description">${group.description || 'No description'}</p>
                    <div class="group-stats">
                        <span class="stat">
                            <i class="icon-users">👥</i>
                            ${group.members?.length || 0} members
                        </span>
                        <span class="stat">
                            <i class="icon-money">💰</i>
                            $${this.calculateGroupTotal(group.id).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Render members in the UI
     */
    renderMembers() {
        const membersList = DOM.get('members-list');
        const emptyState = DOM.get('members-empty');
        
        if (!membersList) return;
        
        if (this.members.length === 0) {
            membersList.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        membersList.style.display = 'block';
        
        membersList.innerHTML = this.members.map(member => `
            <div class="member-card" data-member-id="${member.id}">
                <div class="member-avatar">
                    ${member.photoURL ? 
                        `<img src="${member.photoURL}" alt="${member.displayName || member.email}" />` :
                        `<div class="avatar-placeholder">${this.getInitials(member.displayName || member.email)}</div>`
                    }
                </div>
                <div class="member-info">
                    <h4 class="member-name">${member.displayName || member.email}</h4>
                    <p class="member-email">${member.email}</p>
                    <div class="member-balance ${this.getMemberBalance(member.id) >= 0 ? 'positive' : 'negative'}">
                        Balance: $${this.getMemberBalance(member.id).toFixed(2)}
                    </div>
                </div>
                <div class="member-actions">
                    <button class="btn-icon" onclick="dashboardManager.viewMemberDetails('${member.id}')" title="View Details">
                        <i class="icon-view">👁️</i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Render expenses in the UI
     */
    renderExpenses() {
        const expensesList = DOM.get('expenses-list');
        const emptyState = DOM.get('expenses-empty');
        
        if (!expensesList) return;
        
        if (this.expenses.length === 0) {
            expensesList.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        expensesList.style.display = 'block';
        
        expensesList.innerHTML = this.expenses.map(expense => `
            <div class="expense-card" data-expense-id="${expense.id}">
                <div class="expense-header">
                    <h4 class="expense-title">${expense.title || 'Untitled Expense'}</h4>
                    <div class="expense-amount">$${(expense.amount || 0).toFixed(2)}</div>
                </div>
                <div class="expense-details">
                    <div class="expense-meta">
                        <span class="expense-date">${this.formatDate(expense.date || expense.createdAt)}</span>
                        <span class="expense-category">${expense.category || 'General'}</span>
                    </div>
                    <div class="expense-group">
                        Group: ${this.getGroupName(expense.groupId) || 'Personal'}
                    </div>
                    <div class="expense-payer">
                        Paid by: ${this.getMemberName(expense.paidBy) || 'Unknown'}
                    </div>
                </div>
                <div class="expense-actions">
                    <button class="btn-icon" onclick="dashboardManager.editExpense('${expense.id}')" title="Edit Expense">
                        <i class="icon-edit">✏️</i>
                    </button>
                    <button class="btn-icon" onclick="dashboardManager.deleteExpense('${expense.id}')" title="Delete Expense">
                        <i class="icon-delete">🗑️</i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Render analytics in the UI
     */
    renderAnalytics(analytics) {
        // Update summary cards
        const totalExpensesEl = DOM.get('total-expenses');
        const activeGroupsEl = DOM.get('active-groups');
        const userBalanceEl = DOM.get('user-balance');
        const monthlyExpensesEl = DOM.get('monthly-expenses');
        
        if (totalExpensesEl) totalExpensesEl.textContent = `$${analytics.totalExpenses.toFixed(2)}`;
        if (activeGroupsEl) activeGroupsEl.textContent = analytics.activeGroups;
        if (userBalanceEl) {
            userBalanceEl.textContent = `$${analytics.userBalance.toFixed(2)}`;
            userBalanceEl.className = analytics.userBalance >= 0 ? 'positive' : 'negative';
        }
        if (monthlyExpensesEl) monthlyExpensesEl.textContent = `$${analytics.monthlyExpenses.toFixed(2)}`;
        
        // TODO: Implement Chart.js graphs for monthly spending and expense categories
        this.renderCharts(analytics);
    }
    
    /**
     * Render charts (placeholder for Chart.js implementation)
     */
    renderCharts(analytics) {
        // This will be implemented when Chart.js is properly integrated
        console.log('Charts rendering with analytics:', analytics);
    }
    
    /**
     * Helper methods
     */
    calculateGroupTotal(groupId) {
        return this.expenses
            .filter(expense => expense.groupId === groupId)
            .reduce((sum, expense) => sum + (expense.amount || 0), 0);
    }
    
    getMemberBalance(memberId) {
        let balance = 0;
        this.expenses.forEach(expense => {
            if (expense.paidBy === memberId) {
                balance += expense.amount || 0;
            }
            
            const memberShare = expense.splits?.find(split => split.userId === memberId);
            if (memberShare) {
                balance -= memberShare.amount || 0;
            }
        });
        return balance;
    }
    
    getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    
    formatDate(date) {
        if (!date) return 'Unknown';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString();
    }
    
    getGroupName(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        return group?.name || null;
    }
    
    getMemberName(memberId) {
        const member = this.members.find(m => m.id === memberId);
        return member?.displayName || member?.email || null;
    }
    
    /**
     * Action methods for UI interactions
     */
    async editGroup(groupId) {
        // TODO: Implement group editing modal
        console.log('Edit group:', groupId);
        this.showToast('Group editing feature coming soon!', 'info');
    }
    
    async deleteGroup(groupId) {
        if (!confirm('Are you sure you want to delete this group?')) return;
        
        try {
            if (this.currentUser?.isGuest) {
                this.groups = this.groups.filter(g => g.id !== groupId);
                localStorage.setItem('splitbill_groups', JSON.stringify(this.groups));
            } else {
                await firebase.firestore().collection('groups').doc(groupId).delete();
                this.groups = this.groups.filter(g => g.id !== groupId);
            }
            
            this.renderGroups();
            this.showSuccess('Group deleted successfully');
        } catch (error) {
            this.handleError('Failed to delete group', error);
        }
    }
    
    async editExpense(expenseId) {
        // TODO: Implement expense editing modal
        console.log('Edit expense:', expenseId);
        this.showToast('Expense editing feature coming soon!', 'info');
    }
    
    async deleteExpense(expenseId) {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        
        try {
            if (this.currentUser?.isGuest) {
                this.expenses = this.expenses.filter(e => e.id !== expenseId);
                localStorage.setItem('splitbill_expenses', JSON.stringify(this.expenses));
            } else {
                await firebase.firestore().collection('expenses').doc(expenseId).delete();
                this.expenses = this.expenses.filter(e => e.id !== expenseId);
            }
            
            this.renderExpenses();
            this.renderAnalytics({
                totalExpenses: this.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
                activeGroups: this.groups.filter(group => group.isActive !== false).length,
                userBalance: this.calculateUserBalance(),
                monthlyExpenses: this.calculateMonthlyExpenses()
            });
            this.showSuccess('Expense deleted successfully');
        } catch (error) {
            this.handleError('Failed to delete expense', error);
        }
    }
    
    /**
     * Initialize PDF export event listeners
     */
    initPdfExportListeners() {
        // Report type change handler
        const reportTypeSelect = DOM.get('report-type');
        if (reportTypeSelect) {
            reportTypeSelect.addEventListener('change', (e) => {
                const memberSelection = DOM.get('member-selection');
                if (e.target.value === 'individual') {
                    memberSelection.classList.add('show');
                    memberSelection.style.display = 'block';
                } else {
                    memberSelection.classList.remove('show');
                    memberSelection.style.display = 'none';
                }
            });
        }
        
        // Date range change handler
        const dateRangeSelect = DOM.get('date-range');
        if (dateRangeSelect) {
            dateRangeSelect.addEventListener('change', (e) => {
                const customDateRange = DOM.get('custom-date-range');
                if (e.target.value === 'custom') {
                    customDateRange.classList.add('show');
                    customDateRange.style.display = 'flex';
                } else {
                    customDateRange.classList.remove('show');
                    customDateRange.style.display = 'none';
                }
            });
        }
        
        // Export buttons
        const exportPdfBtn = DOM.get('export-pdf');
        const exportCsvBtn = DOM.get('export-csv');
        const exportJsonBtn = DOM.get('export-json');
        
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.handlePdfExport());
        }
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this.handleCsvExport());
        }
        
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => this.handleJsonExport());
        }
    }
    
    /**
     * Open PDF export modal
     */
    openPdfExportModal() {
        const modal = DOM.get('pdf-export-modal');
        const groupSelect = DOM.get('export-group');
        const memberSelect = DOM.get('export-member');
        
        if (!modal) return;
        
        // Populate group options
        if (groupSelect) {
            groupSelect.innerHTML = '<option value="">Choose a group</option>';
            this.groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.name;
                groupSelect.appendChild(option);
            });
        }
        
        // Group change handler for member population
        if (groupSelect && memberSelect) {
            groupSelect.addEventListener('change', (e) => {
                const selectedGroup = this.groups.find(g => g.id === e.target.value);
                memberSelect.innerHTML = '<option value="">Choose a member</option>';
                
                if (selectedGroup && selectedGroup.members) {
                    selectedGroup.members.forEach(member => {
                        const option = document.createElement('option');
                        option.value = member.id;
                        option.textContent = member.displayName || member.name || member.email;
                        memberSelect.appendChild(option);
                    });
                }
            });
        }
        
        modal.classList.add('active');
    }
    
    /**
     * Handle PDF export
     */
    async handlePdfExport() {
        try {
            const formData = this.getPdfExportFormData();
            if (!formData) return;
            
            const exportBtn = DOM.get('export-pdf');
            if (exportBtn) {
                exportBtn.classList.add('loading');
                exportBtn.disabled = true;
            }
            
            // Initialize PDF generator if not already done
            if (!this.pdfGenerator) {
                this.pdfGenerator = new PDFGenerator();
            }
            
            const result = await this.pdfGenerator.generateExpenseReport(formData);
            
            if (result.success) {
                this.showSuccess(`PDF report generated successfully: ${result.fileName}`);
                this.closePdfExportModal();
            } else {
                this.showError(`Failed to generate PDF: ${result.error}`);
            }
        } catch (error) {
            this.handleError('Failed to export PDF', error);
        } finally {
            const exportBtn = DOM.get('export-pdf');
            if (exportBtn) {
                exportBtn.classList.remove('loading');
                exportBtn.disabled = false;
            }
        }
    }
    
    /**
     * Handle CSV export
     */
    async handleCsvExport() {
        try {
            const formData = this.getPdfExportFormData();
            if (!formData) return;
            
            const exportBtn = DOM.get('export-csv');
            if (exportBtn) {
                exportBtn.classList.add('loading');
                exportBtn.disabled = true;
            }
            
            if (!this.pdfGenerator) {
                this.pdfGenerator = new PDFGenerator();
            }
            
            const result = this.pdfGenerator.exportExpensesCSV(formData.expenses, formData.groupName);
            
            if (result.success) {
                this.showSuccess('CSV export completed successfully');
                this.closePdfExportModal();
            } else {
                this.showError(`Failed to export CSV: ${result.error}`);
            }
        } catch (error) {
            this.handleError('Failed to export CSV', error);
        } finally {
            const exportBtn = DOM.get('export-csv');
            if (exportBtn) {
                exportBtn.classList.remove('loading');
                exportBtn.disabled = false;
            }
        }
    }
    
    /**
     * Handle JSON export
     */
    async handleJsonExport() {
        try {
            const formData = this.getPdfExportFormData();
            if (!formData) return;
            
            const exportBtn = DOM.get('export-json');
            if (exportBtn) {
                exportBtn.classList.add('loading');
                exportBtn.disabled = true;
            }
            
            const selectedGroup = this.groups.find(g => g.id === formData.groupId);
            if (!selectedGroup) {
                this.showError('Selected group not found');
                return;
            }
            
            const groupData = {
                ...selectedGroup,
                expenses: formData.expenses,
                exportDate: new Date().toISOString(),
                dateRange: formData.dateRange
            };
            
            if (!this.pdfGenerator) {
                this.pdfGenerator = new PDFGenerator();
            }
            
            const result = this.pdfGenerator.exportGroupData(groupData);
            
            if (result.success) {
                this.showSuccess('JSON export completed successfully');
                this.closePdfExportModal();
            } else {
                this.showError(`Failed to export JSON: ${result.error}`);
            }
        } catch (error) {
            this.handleError('Failed to export JSON', error);
        } finally {
            const exportBtn = DOM.get('export-json');
            if (exportBtn) {
                exportBtn.classList.remove('loading');
                exportBtn.disabled = false;
            }
        }
    }
    
    /**
     * Get PDF export form data
     */
    getPdfExportFormData() {
        const groupId = DOM.get('export-group')?.value;
        const reportType = DOM.get('report-type')?.value;
        const memberId = DOM.get('export-member')?.value;
        const dateRange = DOM.get('date-range')?.value;
        const startDate = DOM.get('start-date')?.value;
        const endDate = DOM.get('end-date')?.value;
        
        if (!groupId) {
            this.showError('Please select a group');
            return null;
        }
        
        if (!reportType) {
            this.showError('Please select a report type');
            return null;
        }
        
        if (reportType === 'individual' && !memberId) {
            this.showError('Please select a member for individual report');
            return null;
        }
        
        const selectedGroup = this.groups.find(g => g.id === groupId);
        if (!selectedGroup) {
            this.showError('Selected group not found');
            return null;
        }
        
        // Filter expenses by group and date range
        let filteredExpenses = this.expenses.filter(expense => expense.groupId === groupId);
        
        if (dateRange !== 'all') {
            const now = new Date();
            let filterDate;
            
            switch (dateRange) {
                case 'last-month':
                    filterDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    break;
                case 'last-3-months':
                    filterDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                    break;
                case 'last-6-months':
                    filterDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                    break;
                case 'this-year':
                    filterDate = new Date(now.getFullYear(), 0, 1);
                    break;
                case 'custom':
                    if (startDate) {
                        const start = new Date(startDate);
                        filteredExpenses = filteredExpenses.filter(expense => new Date(expense.date) >= start);
                    }
                    if (endDate) {
                        const end = new Date(endDate);
                        filteredExpenses = filteredExpenses.filter(expense => new Date(expense.date) <= end);
                    }
                    break;
            }
            
            if (dateRange !== 'custom' && filterDate) {
                filteredExpenses = filteredExpenses.filter(expense => new Date(expense.date) >= filterDate);
            }
        }
        
        return {
            groupId,
            groupName: selectedGroup.name,
            expenses: filteredExpenses,
            members: selectedGroup.members || [],
            reportType,
            memberId,
            dateRange: this.getDateRangeText(dateRange, startDate, endDate)
        };
    }
    
    /**
     * Get date range text for display
     */
    getDateRangeText(dateRange, startDate, endDate) {
        switch (dateRange) {
            case 'all':
                return 'All Time';
            case 'last-month':
                return 'Last Month';
            case 'last-3-months':
                return 'Last 3 Months';
            case 'last-6-months':
                return 'Last 6 Months';
            case 'this-year':
                return 'This Year';
            case 'custom':
                if (startDate && endDate) {
                    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
                } else if (startDate) {
                    return `From ${new Date(startDate).toLocaleDateString()}`;
                } else if (endDate) {
                    return `Until ${new Date(endDate).toLocaleDateString()}`;
                }
                return 'Custom Range';
            default:
                return dateRange;
        }
    }
    
    /**
     * Close PDF export modal
     */
    closePdfExportModal() {
        const modal = DOM.get('pdf-export-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Reset form
        const form = DOM.get('pdf-export-form');
        if (form) {
            form.reset();
        }
        
        // Hide conditional fields
        const memberSelection = DOM.get('member-selection');
        const customDateRange = DOM.get('custom-date-range');
        
        if (memberSelection) {
            memberSelection.classList.remove('show');
            memberSelection.style.display = 'none';
        }
        
        if (customDateRange) {
            customDateRange.classList.remove('show');
            customDateRange.style.display = 'none';
        }
    }

    /**
     * Update localization UI with saved preferences
     */
    updateLocalizationUI() {
        // Update language select
        const languageSelect = DOM.get('language-select');
        if (languageSelect) {
            languageSelect.value = this.i18n.currentLanguage;
        }
        
        // Update currency select
        const currencySelect = DOM.get('currency-select');
        if (currencySelect) {
            currencySelect.value = this.i18n.currentCurrency;
        }
    }

    /**
     * Handle language change
     */
    async handleLanguageChange(language) {
        try {
            await this.i18n.setLanguage(language);
            this.showToast('Language updated successfully', 'success');
            
            // Update user preferences if authenticated
            if (this.currentUser && !this.currentUser.isGuest) {
                await this.updateUserPreferences({ language });
            }
        } catch (error) {
            console.error('Error changing language:', error);
            this.showToast('Failed to change language', 'error');
        }
    }

    /**
     * Handle currency change
     */
    async handleCurrencyChange(currency) {
        try {
            await this.i18n.setCurrency(currency);
            this.showToast('Currency updated successfully', 'success');
            
            // Update user preferences if authenticated
            if (this.currentUser && !this.currentUser.isGuest) {
                await this.updateUserPreferences({ currency });
            }
            
            // Refresh current tab to update currency display
            this.refreshCurrentTab();
        } catch (error) {
            console.error('Error changing currency:', error);
            this.showToast('Failed to change currency', 'error');
        }
    }

    /**
     * Refresh current tab content
     */
    refreshCurrentTab() {
        switch (this.currentTab) {
            case 'groups':
                this.loadGroups();
                break;
            case 'expenses':
                this.loadExpenses();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            default:
                break;
        }
    }

    viewMemberDetails(memberId) {
        // TODO: Implement member details modal
        console.log('View member details:', memberId);
        this.showToast('Member details feature coming soon!', 'info');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
    window.dashboardManager.init();
});