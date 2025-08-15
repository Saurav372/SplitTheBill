class GroupManager {
    constructor() {
        this.currentUser = null;
        this.isGuest = false;
        this.groups = [];
        this.members = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    checkAuthState() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    this.currentUser = user;
                    this.isGuest = false;
                } else {
                    // Check for guest mode
                    const guestData = localStorage.getItem('guestUser');
                    if (guestData) {
                        this.currentUser = JSON.parse(guestData);
                        this.isGuest = true;
                    }
                }
                this.loadGroups();
            });
        } else {
            // Fallback for guest mode
            const guestData = localStorage.getItem('guestUser');
            if (guestData) {
                this.currentUser = JSON.parse(guestData);
                this.isGuest = true;
                this.loadGroups();
            }
        }
    }

    setupEventListeners() {
        // Create group button
        const createGroupBtn = document.getElementById('create-group-btn');
        if (createGroupBtn) {
            createGroupBtn.addEventListener('click', () => this.showCreateGroupModal());
        }

        // Create group form submission
        const createGroupForm = document.getElementById('create-group-form');
        if (createGroupForm) {
            createGroupForm.addEventListener('submit', (e) => this.handleCreateGroup(e));
        }

        // Edit group form submission
        const editGroupForm = document.getElementById('edit-group-form');
        if (editGroupForm) {
            editGroupForm.addEventListener('submit', (e) => this.handleEditGroup(e));
        }

        // Add member button in create group modal
        const addMemberBtn = document.getElementById('add-member-btn');
        if (addMemberBtn) {
            addMemberBtn.addEventListener('click', () => this.addMemberField());
        }

        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }

    async loadGroups() {
        try {
            if (this.isGuest) {
                // Load from localStorage for guest users
                const storedGroups = localStorage.getItem('guestGroups');
                this.groups = storedGroups ? JSON.parse(storedGroups) : [];
            } else if (this.currentUser) {
                // Load from Firestore for authenticated users
                const groupsRef = firebase.firestore().collection('groups')
                    .where('members', 'array-contains', this.currentUser.uid);
                const snapshot = await groupsRef.get();
                this.groups = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }
            this.renderGroups();
        } catch (error) {
            console.error('Error loading groups:', error);
            this.showError('Failed to load groups');
        }
    }

    renderGroups() {
        const groupsList = document.getElementById('groups-list');
        if (!groupsList) return;

        if (this.groups.length === 0) {
            groupsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>No Groups Yet</h3>
                    <p>Create your first group to start splitting expenses with friends!</p>
                    <button class="btn btn-primary" onclick="groupManager.showCreateGroupModal()">Create Group</button>
                </div>
            `;
            return;
        }

        groupsList.innerHTML = this.groups.map(group => `
            <div class="group-card" data-group-id="${group.id}">
                <div class="group-header">
                    <div class="group-info">
                        <div class="group-avatar">
                            ${this.getGroupInitials(group.name)}
                        </div>
                        <div class="group-details">
                            <h3 class="group-name">${group.name}</h3>
                            <p class="group-description">${group.description || 'No description'}</p>
                            <div class="group-stats">
                                <span class="member-count">${group.memberCount || 0} members</span>
                                <span class="expense-count">${group.expenseCount || 0} expenses</span>
                            </div>
                        </div>
                    </div>
                    <div class="group-actions">
                        <button class="btn btn-sm btn-outline" onclick="groupManager.viewGroup('${group.id}')">
                            <i class="icon-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="groupManager.editGroup('${group.id}')">
                            <i class="icon-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="groupManager.deleteGroup('${group.id}')">
                            <i class="icon-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="group-balance">
                    <div class="balance-info">
                        <span class="balance-label">Your Balance:</span>
                        <span class="balance-amount ${this.getBalanceClass(group.userBalance || 0)}">
                            $${Math.abs(group.userBalance || 0).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getGroupInitials(name) {
        return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
    }

    getBalanceClass(balance) {
        if (balance > 0) return 'positive';
        if (balance < 0) return 'negative';
        return 'neutral';
    }

    showCreateGroupModal() {
        const modal = document.getElementById('create-group-modal');
        if (modal) {
            modal.style.display = 'block';
            // Reset form
            const form = document.getElementById('create-group-form');
            if (form) form.reset();
            // Reset member fields
            this.resetMemberFields();
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    resetMemberFields() {
        const membersList = document.getElementById('group-members-list');
        if (membersList) {
            membersList.innerHTML = `
                <div class="member-field">
                    <input type="email" class="form-input" placeholder="Member email" required>
                    <input type="text" class="form-input" placeholder="Member name" required>
                </div>
            `;
        }
    }

    addMemberField() {
        const membersList = document.getElementById('group-members-list');
        if (membersList) {
            const memberField = document.createElement('div');
            memberField.className = 'member-field';
            memberField.innerHTML = `
                <input type="email" class="form-input" placeholder="Member email" required>
                <input type="text" class="form-input" placeholder="Member name" required>
                <button type="button" class="btn btn-sm btn-danger remove-member-btn" onclick="this.parentElement.remove()">
                    <i class="icon-trash"></i>
                </button>
            `;
            membersList.appendChild(memberField);
        }
    }

    async handleCreateGroup(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const groupName = formData.get('group-name');
            const groupDescription = formData.get('group-description');
            
            // Collect member data
            const memberFields = document.querySelectorAll('.member-field');
            const members = [];
            
            memberFields.forEach(field => {
                const emailInput = field.querySelector('input[type="email"]');
                const nameInput = field.querySelector('input[type="text"]');
                if (emailInput.value && nameInput.value) {
                    members.push({
                        email: emailInput.value,
                        name: nameInput.value,
                        id: this.generateMemberId()
                    });
                }
            });

            // Add current user as a member
            if (this.currentUser) {
                members.unshift({
                    email: this.currentUser.email,
                    name: this.currentUser.displayName || this.currentUser.email,
                    id: this.currentUser.uid || this.currentUser.id,
                    isOwner: true
                });
            }

            const groupData = {
                id: this.generateGroupId(),
                name: groupName,
                description: groupDescription,
                members: members,
                memberCount: members.length,
                expenseCount: 0,
                userBalance: 0,
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser.uid || this.currentUser.id,
                currency: 'USD'
            };

            if (this.isGuest) {
                // Save to localStorage for guest users
                this.groups.push(groupData);
                localStorage.setItem('guestGroups', JSON.stringify(this.groups));
            } else {
                // Save to Firestore for authenticated users
                await firebase.firestore().collection('groups').doc(groupData.id).set(groupData);
                this.groups.push(groupData);
            }

            this.renderGroups();
            this.closeModals();
            this.showSuccess('Group created successfully!');
            
        } catch (error) {
            console.error('Error creating group:', error);
            this.showError('Failed to create group');
        }
    }

    generateGroupId() {
        return 'group_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateMemberId() {
        return 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async editGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) {
            this.showError('Group not found');
            return;
        }

        // Show edit modal with pre-filled data
        const modal = document.getElementById('edit-group-modal');
        if (modal) {
            // Pre-fill form data
            const nameInput = modal.querySelector('#edit-group-name');
            const descInput = modal.querySelector('#edit-group-description');
            
            if (nameInput) nameInput.value = group.name;
            if (descInput) descInput.value = group.description || '';
            
            // Store group ID for update
            modal.dataset.groupId = groupId;
            modal.style.display = 'block';
        }
    }

    async handleEditGroup(e) {
        e.preventDefault();
        
        const modal = document.getElementById('edit-group-modal');
        const groupId = modal.dataset.groupId;
        
        if (!groupId) {
            this.showError('Group ID not found');
            return;
        }

        try {
            const formData = new FormData(e.target);
            const groupName = formData.get('group-name');
            const groupDescription = formData.get('group-description');
            
            const updatedData = {
                name: groupName,
                description: groupDescription,
                updatedAt: new Date().toISOString()
            };

            if (this.isGuest) {
                // Update in localStorage for guest users
                const groupIndex = this.groups.findIndex(g => g.id === groupId);
                if (groupIndex !== -1) {
                    this.groups[groupIndex] = { ...this.groups[groupIndex], ...updatedData };
                    localStorage.setItem('guestGroups', JSON.stringify(this.groups));
                }
            } else {
                // Update in Firestore for authenticated users
                await firebase.firestore().collection('groups').doc(groupId).update(updatedData);
                const groupIndex = this.groups.findIndex(g => g.id === groupId);
                if (groupIndex !== -1) {
                    this.groups[groupIndex] = { ...this.groups[groupIndex], ...updatedData };
                }
            }

            this.renderGroups();
            this.closeModals();
            this.showSuccess('Group updated successfully!');
            
        } catch (error) {
            console.error('Error updating group:', error);
            this.showError('Failed to update group');
        }
    }

    async deleteGroup(groupId) {
        if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
            return;
        }

        try {
            if (this.isGuest) {
                // Remove from localStorage for guest users
                this.groups = this.groups.filter(g => g.id !== groupId);
                localStorage.setItem('guestGroups', JSON.stringify(this.groups));
            } else {
                // Remove from Firestore for authenticated users
                await firebase.firestore().collection('groups').doc(groupId).delete();
                this.groups = this.groups.filter(g => g.id !== groupId);
            }

            this.renderGroups();
            this.showSuccess('Group deleted successfully!');
            
        } catch (error) {
            console.error('Error deleting group:', error);
            this.showError('Failed to delete group');
        }
    }

    viewGroup(groupId) {
        // Navigate to group details view
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            // Store selected group for detailed view
            sessionStorage.setItem('selectedGroup', JSON.stringify(group));
            // You can implement a detailed group view here
            this.showGroupDetails(group);
        }
    }

    showGroupDetails(group) {
        // Implementation for showing detailed group view
        console.log('Showing details for group:', group);
        // This could open a new modal or navigate to a different view
    }

    showError(message) {
        // Create and show error toast
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="icon-alert-circle"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showSuccess(message) {
        // Create and show success toast
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="icon-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize group manager when DOM is loaded
let groupManager;
document.addEventListener('DOMContentLoaded', () => {
    groupManager = new GroupManager();
});