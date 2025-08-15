class ExpenseManager {
    constructor() {
        this.currentUser = null;
        this.isGuest = false;
        this.expenses = [];
        this.groups = [];
        this.selectedGroup = null;
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
                this.loadData();
            });
        } else {
            // Fallback for guest mode
            const guestData = localStorage.getItem('guestUser');
            if (guestData) {
                this.currentUser = JSON.parse(guestData);
                this.isGuest = true;
                this.loadData();
            }
        }
    }

    setupEventListeners() {
        // Add expense button
        const addExpenseBtn = document.getElementById('add-expense-btn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => this.showAddExpenseModal());
        }

        // Add expense form submission
        const addExpenseForm = document.getElementById('add-expense-form');
        if (addExpenseForm) {
            addExpenseForm.addEventListener('submit', (e) => this.handleAddExpense(e));
        }

        // Edit expense form submission
        const editExpenseForm = document.getElementById('edit-expense-form');
        if (editExpenseForm) {
            editExpenseForm.addEventListener('submit', (e) => this.handleEditExpense(e));
        }

        // Split method change
        const splitMethodSelect = document.getElementById('split-method');
        if (splitMethodSelect) {
            splitMethodSelect.addEventListener('change', (e) => this.handleSplitMethodChange(e));
        }

        // Group selection change
        const groupSelect = document.getElementById('expense-group');
        if (groupSelect) {
            groupSelect.addEventListener('change', (e) => this.handleGroupChange(e));
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

    async loadData() {
        try {
            await this.loadGroups();
            await this.loadExpenses();
            this.renderExpenses();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data');
        }
    }

    async loadGroups() {
        try {
            if (this.isGuest) {
                const storedGroups = localStorage.getItem('guestGroups');
                this.groups = storedGroups ? JSON.parse(storedGroups) : [];
            } else if (this.currentUser) {
                const groupsRef = firebase.firestore().collection('groups')
                    .where('members', 'array-contains', this.currentUser.uid);
                const snapshot = await groupsRef.get();
                this.groups = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }
            this.populateGroupSelect();
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    }

    async loadExpenses() {
        try {
            if (this.isGuest) {
                const storedExpenses = localStorage.getItem('guestExpenses');
                this.expenses = storedExpenses ? JSON.parse(storedExpenses) : [];
            } else if (this.currentUser) {
                const expensesRef = firebase.firestore().collection('expenses')
                    .where('participants', 'array-contains', this.currentUser.uid)
                    .orderBy('createdAt', 'desc');
                const snapshot = await expensesRef.get();
                this.expenses = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }
        } catch (error) {
            console.error('Error loading expenses:', error);
        }
    }

    populateGroupSelect() {
        const groupSelect = document.getElementById('expense-group');
        const editGroupSelect = document.getElementById('edit-expense-group');
        
        if (groupSelect) {
            groupSelect.innerHTML = '<option value="">Select a group</option>' +
                this.groups.map(group => `<option value="${group.id}">${group.name}</option>`).join('');
        }
        
        if (editGroupSelect) {
            editGroupSelect.innerHTML = '<option value="">Select a group</option>' +
                this.groups.map(group => `<option value="${group.id}">${group.name}</option>`).join('');
        }
    }

    renderExpenses() {
        const expensesList = document.getElementById('expenses-list');
        if (!expensesList) return;

        if (this.expenses.length === 0) {
            expensesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💰</div>
                    <h3>No Expenses Yet</h3>
                    <p>Add your first expense to start tracking shared costs!</p>
                    <button class="btn btn-primary" onclick="expenseManager.showAddExpenseModal()">Add Expense</button>
                </div>
            `;
            return;
        }

        expensesList.innerHTML = this.expenses.map(expense => `
            <div class="expense-card" data-expense-id="${expense.id}">
                <div class="expense-header">
                    <div class="expense-info">
                        <div class="expense-category">
                            ${this.getCategoryIcon(expense.category)}
                        </div>
                        <div class="expense-details">
                            <h3 class="expense-title">${expense.title}</h3>
                            <p class="expense-description">${expense.description || 'No description'}</p>
                            <div class="expense-meta">
                                <span class="expense-date">${this.formatDate(expense.createdAt)}</span>
                                <span class="expense-group">${this.getGroupName(expense.groupId)}</span>
                                <span class="expense-method">${this.getSplitMethodLabel(expense.splitMethod)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="expense-amount">
                        <div class="total-amount">$${expense.amount.toFixed(2)}</div>
                        <div class="user-share ${this.getShareClass(expense.userShare)}">
                            ${expense.userShare > 0 ? 'You owe' : expense.userShare < 0 ? 'You are owed' : 'Settled'}
                            $${Math.abs(expense.userShare || 0).toFixed(2)}
                        </div>
                    </div>
                </div>
                <div class="expense-actions">
                    <button class="btn btn-sm btn-outline" onclick="expenseManager.viewExpense('${expense.id}')">
                        <i class="icon-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="expenseManager.editExpense('${expense.id}')">
                        <i class="icon-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="expenseManager.deleteExpense('${expense.id}')">
                        <i class="icon-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    getCategoryIcon(category) {
        const icons = {
            food: '🍽️',
            transport: '🚗',
            accommodation: '🏠',
            entertainment: '🎬',
            shopping: '🛍️',
            utilities: '⚡',
            healthcare: '🏥',
            other: '📝'
        };
        return icons[category] || icons.other;
    }

    getSplitMethodLabel(method) {
        const labels = {
            equal: 'Equal Split',
            custom: 'Custom Split',
            percentage: 'Percentage Split',
            shares: 'Share-based Split'
        };
        return labels[method] || 'Equal Split';
    }

    getShareClass(share) {
        if (share > 0) return 'owe';
        if (share < 0) return 'owed';
        return 'settled';
    }

    getGroupName(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        return group ? group.name : 'Unknown Group';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    showAddExpenseModal() {
        const modal = document.getElementById('add-expense-modal');
        if (modal) {
            modal.style.display = 'block';
            // Reset form
            const form = document.getElementById('add-expense-form');
            if (form) form.reset();
            // Reset split details
            this.resetSplitDetails();
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    handleGroupChange(e) {
        const groupId = e.target.value;
        this.selectedGroup = this.groups.find(g => g.id === groupId);
        this.updateParticipantsList();
    }

    handleSplitMethodChange(e) {
        const method = e.target.value;
        this.updateSplitDetails(method);
    }

    updateParticipantsList() {
        const participantsList = document.getElementById('participants-list');
        if (!participantsList || !this.selectedGroup) return;

        participantsList.innerHTML = this.selectedGroup.members.map(member => `
            <div class="participant-item">
                <div class="participant-info">
                    <div class="participant-avatar">${this.getInitials(member.name)}</div>
                    <span class="participant-name">${member.name}</span>
                </div>
                <div class="participant-controls">
                    <input type="checkbox" class="participant-checkbox" value="${member.id}" checked>
                    <input type="number" class="participant-amount" placeholder="0.00" step="0.01" min="0">
                </div>
            </div>
        `).join('');

        // Add event listeners for split calculation
        const checkboxes = participantsList.querySelectorAll('.participant-checkbox');
        const amountInputs = participantsList.querySelectorAll('.participant-amount');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.calculateSplit());
        });
        
        amountInputs.forEach(input => {
            input.addEventListener('input', () => this.calculateSplit());
        });
    }

    updateSplitDetails(method) {
        const splitDetails = document.getElementById('split-details');
        if (!splitDetails) return;

        switch (method) {
            case 'equal':
                splitDetails.innerHTML = '<p class="split-info">Amount will be split equally among selected participants.</p>';
                break;
            case 'custom':
                splitDetails.innerHTML = '<p class="split-info">Enter custom amounts for each participant.</p>';
                break;
            case 'percentage':
                splitDetails.innerHTML = '<p class="split-info">Enter percentage for each participant (must total 100%).</p>';
                break;
            case 'shares':
                splitDetails.innerHTML = '<p class="split-info">Enter number of shares for each participant.</p>';
                break;
        }
        
        this.calculateSplit();
    }

    resetSplitDetails() {
        const splitDetails = document.getElementById('split-details');
        if (splitDetails) {
            splitDetails.innerHTML = '';
        }
        
        const participantsList = document.getElementById('participants-list');
        if (participantsList) {
            participantsList.innerHTML = '';
        }
    }

    calculateSplit() {
        const totalAmount = parseFloat(document.getElementById('expense-amount')?.value || 0);
        const splitMethod = document.getElementById('split-method')?.value || 'equal';
        const participantsList = document.getElementById('participants-list');
        
        if (!participantsList || totalAmount <= 0) return;

        const participants = Array.from(participantsList.querySelectorAll('.participant-item'));
        const selectedParticipants = participants.filter(item => 
            item.querySelector('.participant-checkbox').checked
        );

        if (selectedParticipants.length === 0) return;

        switch (splitMethod) {
            case 'equal':
                this.calculateEqualSplit(selectedParticipants, totalAmount);
                break;
            case 'custom':
                this.calculateCustomSplit(selectedParticipants, totalAmount);
                break;
            case 'percentage':
                this.calculatePercentageSplit(selectedParticipants, totalAmount);
                break;
            case 'shares':
                this.calculateShareSplit(selectedParticipants, totalAmount);
                break;
        }
    }

    calculateEqualSplit(participants, totalAmount) {
        const amountPerPerson = totalAmount / participants.length;
        participants.forEach(participant => {
            const amountInput = participant.querySelector('.participant-amount');
            amountInput.value = amountPerPerson.toFixed(2);
            amountInput.readOnly = true;
        });
    }

    calculateCustomSplit(participants, totalAmount) {
        participants.forEach(participant => {
            const amountInput = participant.querySelector('.participant-amount');
            amountInput.readOnly = false;
            amountInput.placeholder = '0.00';
        });
        
        // Validate that custom amounts don't exceed total
        this.validateCustomAmounts(participants, totalAmount);
    }

    calculatePercentageSplit(participants, totalAmount) {
        participants.forEach(participant => {
            const amountInput = participant.querySelector('.participant-amount');
            amountInput.readOnly = false;
            amountInput.placeholder = '%';
            amountInput.max = '100';
        });
        
        // Convert percentages to amounts
        this.validatePercentages(participants, totalAmount);
    }

    calculateShareSplit(participants, totalAmount) {
        participants.forEach(participant => {
            const amountInput = participant.querySelector('.participant-amount');
            amountInput.readOnly = false;
            amountInput.placeholder = 'shares';
            amountInput.step = '1';
        });
        
        // Calculate amounts based on shares
        this.validateShares(participants, totalAmount);
    }

    validateCustomAmounts(participants, totalAmount) {
        const total = participants.reduce((sum, participant) => {
            const amount = parseFloat(participant.querySelector('.participant-amount').value || 0);
            return sum + amount;
        }, 0);
        
        const validationMsg = document.getElementById('split-validation');
        if (validationMsg) {
            if (Math.abs(total - totalAmount) > 0.01) {
                validationMsg.textContent = `Total: $${total.toFixed(2)} (should be $${totalAmount.toFixed(2)})`;
                validationMsg.className = 'validation-error';
            } else {
                validationMsg.textContent = 'Split is valid ✓';
                validationMsg.className = 'validation-success';
            }
        }
    }

    validatePercentages(participants, totalAmount) {
        const totalPercentage = participants.reduce((sum, participant) => {
            const percentage = parseFloat(participant.querySelector('.participant-amount').value || 0);
            return sum + percentage;
        }, 0);
        
        const validationMsg = document.getElementById('split-validation');
        if (validationMsg) {
            if (Math.abs(totalPercentage - 100) > 0.01) {
                validationMsg.textContent = `Total: ${totalPercentage.toFixed(1)}% (should be 100%)`;
                validationMsg.className = 'validation-error';
            } else {
                validationMsg.textContent = 'Percentages are valid ✓';
                validationMsg.className = 'validation-success';
            }
        }
    }

    validateShares(participants, totalAmount) {
        const totalShares = participants.reduce((sum, participant) => {
            const shares = parseInt(participant.querySelector('.participant-amount').value || 0);
            return sum + shares;
        }, 0);
        
        if (totalShares > 0) {
            participants.forEach(participant => {
                const shares = parseInt(participant.querySelector('.participant-amount').value || 0);
                const amount = (shares / totalShares) * totalAmount;
                participant.querySelector('.participant-amount').title = `$${amount.toFixed(2)}`;
            });
        }
    }

    getInitials(name) {
        return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
    }

    async handleAddExpense(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const expenseData = this.collectExpenseData(formData);
            
            if (!this.validateExpenseData(expenseData)) {
                return;
            }

            expenseData.id = this.generateExpenseId();
            expenseData.createdAt = new Date().toISOString();
            expenseData.createdBy = this.currentUser.uid || this.currentUser.id;
            expenseData.userShare = this.calculateUserShare(expenseData);

            if (this.isGuest) {
                this.expenses.unshift(expenseData);
                localStorage.setItem('guestExpenses', JSON.stringify(this.expenses));
            } else {
                await firebase.firestore().collection('expenses').doc(expenseData.id).set(expenseData);
                this.expenses.unshift(expenseData);
            }

            this.renderExpenses();
            this.closeModals();
            this.showSuccess('Expense added successfully!');
            
        } catch (error) {
            console.error('Error adding expense:', error);
            this.showError('Failed to add expense');
        }
    }

    collectExpenseData(formData) {
        const participantsList = document.getElementById('participants-list');
        const participants = [];
        const splits = [];
        
        if (participantsList) {
            const participantItems = participantsList.querySelectorAll('.participant-item');
            participantItems.forEach(item => {
                const checkbox = item.querySelector('.participant-checkbox');
                const amountInput = item.querySelector('.participant-amount');
                
                if (checkbox.checked) {
                    participants.push(checkbox.value);
                    splits.push({
                        userId: checkbox.value,
                        amount: parseFloat(amountInput.value || 0)
                    });
                }
            });
        }

        return {
            title: formData.get('expense-title'),
            description: formData.get('expense-description'),
            amount: parseFloat(formData.get('expense-amount')),
            category: formData.get('expense-category'),
            groupId: formData.get('expense-group'),
            splitMethod: formData.get('split-method'),
            participants: participants,
            splits: splits,
            currency: 'USD'
        };
    }

    validateExpenseData(data) {
        if (!data.title || data.title.trim() === '') {
            this.showError('Please enter an expense title');
            return false;
        }
        
        if (!data.amount || data.amount <= 0) {
            this.showError('Please enter a valid amount');
            return false;
        }
        
        if (!data.groupId) {
            this.showError('Please select a group');
            return false;
        }
        
        if (data.participants.length === 0) {
            this.showError('Please select at least one participant');
            return false;
        }
        
        // Validate split amounts
        const totalSplit = data.splits.reduce((sum, split) => sum + split.amount, 0);
        if (Math.abs(totalSplit - data.amount) > 0.01) {
            this.showError('Split amounts do not match the total expense amount');
            return false;
        }
        
        return true;
    }

    calculateUserShare(expenseData) {
        const currentUserId = this.currentUser.uid || this.currentUser.id;
        const userSplit = expenseData.splits.find(split => split.userId === currentUserId);
        return userSplit ? userSplit.amount : 0;
    }

    generateExpenseId() {
        return 'expense_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async editExpense(expenseId) {
        const expense = this.expenses.find(e => e.id === expenseId);
        if (!expense) {
            this.showError('Expense not found');
            return;
        }

        // Show edit modal with pre-filled data
        const modal = document.getElementById('edit-expense-modal');
        if (modal) {
            this.populateEditForm(expense);
            modal.dataset.expenseId = expenseId;
            modal.style.display = 'block';
        }
    }

    populateEditForm(expense) {
        const form = document.getElementById('edit-expense-form');
        if (!form) return;

        form.querySelector('#edit-expense-title').value = expense.title;
        form.querySelector('#edit-expense-description').value = expense.description || '';
        form.querySelector('#edit-expense-amount').value = expense.amount;
        form.querySelector('#edit-expense-category').value = expense.category;
        form.querySelector('#edit-expense-group').value = expense.groupId;
        form.querySelector('#edit-split-method').value = expense.splitMethod;
    }

    async handleEditExpense(e) {
        e.preventDefault();
        
        const modal = document.getElementById('edit-expense-modal');
        const expenseId = modal.dataset.expenseId;
        
        if (!expenseId) {
            this.showError('Expense ID not found');
            return;
        }

        try {
            const formData = new FormData(e.target);
            const updatedData = {
                title: formData.get('expense-title'),
                description: formData.get('expense-description'),
                amount: parseFloat(formData.get('expense-amount')),
                category: formData.get('expense-category'),
                updatedAt: new Date().toISOString()
            };

            if (this.isGuest) {
                const expenseIndex = this.expenses.findIndex(e => e.id === expenseId);
                if (expenseIndex !== -1) {
                    this.expenses[expenseIndex] = { ...this.expenses[expenseIndex], ...updatedData };
                    localStorage.setItem('guestExpenses', JSON.stringify(this.expenses));
                }
            } else {
                await firebase.firestore().collection('expenses').doc(expenseId).update(updatedData);
                const expenseIndex = this.expenses.findIndex(e => e.id === expenseId);
                if (expenseIndex !== -1) {
                    this.expenses[expenseIndex] = { ...this.expenses[expenseIndex], ...updatedData };
                }
            }

            this.renderExpenses();
            this.closeModals();
            this.showSuccess('Expense updated successfully!');
            
        } catch (error) {
            console.error('Error updating expense:', error);
            this.showError('Failed to update expense');
        }
    }

    async deleteExpense(expenseId) {
        if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
            return;
        }

        try {
            if (this.isGuest) {
                this.expenses = this.expenses.filter(e => e.id !== expenseId);
                localStorage.setItem('guestExpenses', JSON.stringify(this.expenses));
            } else {
                await firebase.firestore().collection('expenses').doc(expenseId).delete();
                this.expenses = this.expenses.filter(e => e.id !== expenseId);
            }

            this.renderExpenses();
            this.showSuccess('Expense deleted successfully!');
            
        } catch (error) {
            console.error('Error deleting expense:', error);
            this.showError('Failed to delete expense');
        }
    }

    viewExpense(expenseId) {
        const expense = this.expenses.find(e => e.id === expenseId);
        if (expense) {
            // Store selected expense for detailed view
            sessionStorage.setItem('selectedExpense', JSON.stringify(expense));
            this.showExpenseDetails(expense);
        }
    }

    showExpenseDetails(expense) {
        // Implementation for showing detailed expense view
        console.log('Showing details for expense:', expense);
        // This could open a new modal or navigate to a different view
    }

    showError(message) {
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

// Initialize expense manager when DOM is loaded
let expenseManager;
document.addEventListener('DOMContentLoaded', () => {
    expenseManager = new ExpenseManager();
});