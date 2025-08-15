/**
 * FAQ Module
 * Handles FAQ page functionality including search, filtering, and interactions
 */

class FAQManager {
    constructor() {
        this.faqData = [];
        this.filteredFAQs = [];
        this.currentCategory = 'all';
        this.searchQuery = '';
        
        // Initialize FAQ manager
        this.init();
    }

    /**
     * Initialize FAQ manager
     */
    async init() {
        try {
            // Load FAQ data
            await this.loadFAQData();
            
            // Initialize event listeners
            this.initEventListeners();
            
            // Render initial FAQ content
            this.renderFAQs();
            
            // Initialize search functionality
            this.initSearch();
            
        } catch (error) {
            console.error('FAQ initialization error:', error);
            this.handleError('Failed to initialize FAQ page', error);
        }
    }

    /**
     * Load FAQ data
     */
    async loadFAQData() {
        // In a real app, this would fetch from an API or CMS
        // For now, using static data
        this.faqData = [
            // Getting Started
            {
                id: 'getting-started-1',
                category: 'getting-started',
                question: 'How do I create my first group?',
                answer: `To create your first group:
                1. Sign up for an account or continue as a guest
                2. Go to the Groups tab in your dashboard
                3. Click the "Create Group" button
                4. Enter a group name and description
                5. Add members by email or share the group link
                6. Start adding expenses to split with your group!`,
                tags: ['group', 'create', 'setup', 'beginner'],
                helpful: 0,
                notHelpful: 0
            },
            {
                id: 'getting-started-2',
                category: 'getting-started',
                question: 'Can I use SplitTheBill without creating an account?',
                answer: `Yes! You can use SplitTheBill as a guest user. Guest mode allows you to:
                • Create and manage groups
                • Add expenses and split them
                • Calculate who owes what
                • Export expense reports
                
                However, guest data is stored locally and won't sync across devices. For the best experience and data backup, we recommend creating an account.`,
                tags: ['guest', 'account', 'signup', 'local'],
                helpful: 0,
                notHelpful: 0
            },
            {
                id: 'getting-started-3',
                category: 'getting-started',
                question: 'Is SplitTheBill free to use?',
                answer: `Yes, SplitTheBill is completely free to use! All core features including:
                • Unlimited groups and expenses
                • Multiple split methods
                • PDF export
                • Multi-currency support
                • Offline functionality
                
                Are available at no cost. We believe expense splitting should be accessible to everyone.`,
                tags: ['free', 'pricing', 'cost', 'features'],
                helpful: 0,
                notHelpful: 0
            },
            
            // Groups & Members
            {
                id: 'groups-1',
                category: 'groups-members',
                question: 'How do I add members to my group?',
                answer: `You can add members to your group in several ways:
                
                **By Email:**
                1. Go to your group settings
                2. Click "Add Member"
                3. Enter their email address
                4. They'll receive an invitation to join
                
                **By Share Link:**
                1. Click "Share Group" in group settings
                2. Copy the invitation link
                3. Share it via text, email, or social media
                
                **Quick Add:**
                When adding an expense, you can quickly add new members by typing their name.`,
                tags: ['members', 'invite', 'add', 'email', 'share'],
                helpful: 0,
                notHelpful: 0
            },
            {
                id: 'groups-2',
                category: 'groups-members',
                question: 'Can I remove someone from a group?',
                answer: `Yes, group administrators can remove members:
                
                1. Go to the group's member list
                2. Click the menu (⋮) next to the member's name
                3. Select "Remove from Group"
                4. Confirm the action
                
                **Important:** Before removing a member, make sure to settle any outstanding balances. Removed members will lose access to the group but their expense history will be preserved.`,
                tags: ['remove', 'members', 'admin', 'permissions'],
                helpful: 0,
                notHelpful: 0
            },
            {
                id: 'groups-3',
                category: 'groups-members',
                question: 'What happens if I leave a group?',
                answer: `When you leave a group:
                • You'll lose access to the group and its expenses
                • Your expense history will remain for other members
                • Any outstanding balances should be settled before leaving
                • You can be re-invited by other group members
                
                To leave a group, go to group settings and click "Leave Group".`,
                tags: ['leave', 'group', 'access', 'history'],
                helpful: 0,
                notHelpful: 0
            },
            
            // Expenses & Splitting
            {
                id: 'expenses-1',
                category: 'expenses-splitting',
                question: 'What are the different ways to split an expense?',
                answer: `SplitTheBill offers several splitting methods:
                
                **Equal Split:** Divides the expense equally among all participants
                
                **Custom Amount:** Set specific amounts for each person
                
                **Percentage Split:** Assign percentages to each participant
                
                **Share-based Split:** Assign shares (e.g., 2 shares for adults, 1 share for children)
                
                **Unequal Split:** Some people pay more or less based on what they consumed
                
                You can choose the method that best fits your situation when adding each expense.`,
                tags: ['split', 'methods', 'equal', 'custom', 'percentage', 'shares'],
                helpful: 0,
                notHelpful: 0
            },
            {
                id: 'expenses-2',
                category: 'expenses-splitting',
                question: 'Can I edit an expense after adding it?',
                answer: `Yes, you can edit expenses:
                
                1. Find the expense in your expense list
                2. Click "Edit" or tap the expense
                3. Modify the details (amount, description, split method, etc.)
                4. Save your changes
                
                **Note:** If other group members have already seen the expense, they'll be notified of the changes. Major changes to settled expenses should be discussed with the group first.`,
                tags: ['edit', 'modify', 'expense', 'changes'],
                helpful: 0,
                notHelpful: 0
            },
            {
                id: 'expenses-3',
                category: 'expenses-splitting',
                question: 'How do I handle tips and taxes?',
                answer: `For tips and taxes, you have several options:
                
                **Include in Total:** Add the tip/tax to the base amount before splitting
                
                **Separate Line Item:** Create separate expenses for tips and taxes
                
                **Percentage Addition:** Use the percentage split method to add tips as a percentage
                
                **Example:** For a $100 dinner with 20% tip:
                • Option 1: Enter $120 total and split equally
                • Option 2: Enter $100 for dinner + $20 separate tip expense
                
                Choose the method that works best for your group's preferences.`,
                tags: ['tips', 'tax', 'percentage', 'total', 'separate'],
                helpful: 0,
                notHelpful: 0
            },
            
            // Account & Data
            {
                id: 'account-1',
                category: 'account-data',
                question: 'How do I change my password?',
                answer: `To change your password:
                
                1. Go to Settings in your dashboard
                2. Click on "Account Security"
                3. Click "Change Password"
                4. Enter your current password
                5. Enter and confirm your new password
                6. Click "Update Password"
                
                **Forgot your password?** Use the "Forgot Password" link on the sign-in page to reset it via email.`,
                tags: ['password', 'change', 'security', 'reset'],
                helpful: 0,
                notHelpful: 0
            },
            {
                id: 'account-2',
                category: 'account-data',
                question: 'Is my data secure and private?',
                answer: `Yes, we take data security seriously:
                
                **Encryption:** All data is encrypted in transit and at rest
                **Privacy:** We never share your personal information with third parties
                **Access Control:** Only you and your group members can see your shared expenses
                **Backup:** Your data is automatically backed up and can be exported
                **Compliance:** We follow industry-standard security practices
                
                For more details, please read our Privacy Policy and Terms of Service.`,
                tags: ['security', 'privacy', 'encryption', 'data', 'backup'],
                helpful: 0,
                notHelpful: 0
            },
            {
                id: 'account-3',
                category: 'account-data',
                question: 'Can I export my expense data?',
                answer: `Yes, you can export your data in multiple formats:
                
                **PDF Reports:** Generate detailed expense reports for any date range
                **CSV Export:** Download expense data for use in spreadsheets
                **Group Summary:** Export settlement summaries showing who owes what
                
                To export:
                1. Go to the group or expense view
                2. Click the "Export" button
                3. Choose your preferred format
                4. Select date range and options
                5. Download your report
                
                Exports include all expense details, split calculations, and payment history.`,
                tags: ['export', 'pdf', 'csv', 'data', 'download', 'report'],
                helpful: 0,
                notHelpful: 0
            },
            
            // Technical Issues
            {
                id: 'technical-1',
                category: 'technical',
                question: 'The app is not working properly. What should I do?',
                answer: `If you're experiencing issues, try these troubleshooting steps:
                
                **Basic Troubleshooting:**
                1. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
                2. Clear your browser cache and cookies
                3. Try a different browser or incognito/private mode
                4. Check your internet connection
                
                **Mobile Issues:**
                • Close and reopen the app
                • Restart your device
                • Update to the latest version
                
                **Still having problems?** Contact our support team with details about:
                • What you were trying to do
                • What happened instead
                • Your browser/device information
                • Any error messages you saw`,
                tags: ['troubleshooting', 'issues', 'problems', 'browser', 'mobile'],
                helpful: 0,
                notHelpful: 0
            },
            {
                id: 'technical-2',
                category: 'technical',
                question: 'Can I use SplitTheBill offline?',
                answer: `Yes! SplitTheBill works offline:
                
                **Offline Features:**
                • View existing groups and expenses
                • Add new expenses
                • Edit expense details
                • Calculate splits and balances
                • Generate PDF reports
                
                **Sync When Online:**
                When you reconnect to the internet, all changes made offline will automatically sync with the cloud and other group members.
                
                **Installation:**
                You can install SplitTheBill as a Progressive Web App (PWA) for better offline experience. Look for the "Install" prompt in your browser.`,
                tags: ['offline', 'sync', 'pwa', 'install', 'internet'],
                helpful: 0,
                notHelpful: 0
            },
            {
                id: 'technical-3',
                category: 'technical',
                question: 'Which browsers and devices are supported?',
                answer: `SplitTheBill works on all modern browsers and devices:
                
                **Desktop Browsers:**
                • Chrome 80+
                • Firefox 75+
                • Safari 13+
                • Edge 80+
                
                **Mobile Browsers:**
                • Chrome Mobile
                • Safari Mobile (iOS 13+)
                • Firefox Mobile
                • Samsung Internet
                
                **Devices:**
                • Windows, Mac, Linux computers
                • iPhone and iPad (iOS 13+)
                • Android phones and tablets (Android 7+)
                
                For the best experience, we recommend using the latest version of your preferred browser.`,
                tags: ['browsers', 'devices', 'compatibility', 'mobile', 'desktop'],
                helpful: 0,
                notHelpful: 0
            }
        ];
        
        this.filteredFAQs = [...this.faqData];
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Search input
        const searchInput = DOM.get('faq-search');
        if (searchInput) {
            searchInput.addEventListener('input', Timing.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
            
            // Clear search button
            const clearBtn = DOM.get('search-clear-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    searchInput.value = '';
                    this.handleSearch('');
                });
            }
        }

        // Category filters
        const categoryButtons = DOM.queryAll('.category-btn');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.handleCategoryFilter(category);
            });
        });

        // FAQ item toggles
        this.initFAQToggles();

        // Helpful/Not helpful buttons
        this.initHelpfulButtons();

        // Contact form
        this.initContactForm();
    }

    /**
     * Initialize search functionality
     */
    initSearch() {
        // Focus search input on page load
        const searchInput = DOM.get('faq-search');
        if (searchInput) {
            // Auto-focus on desktop, but not on mobile to avoid keyboard popup
            if (window.innerWidth > 768) {
                searchInput.focus();
            }
        }

        // Search keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
            
            // Escape to clear search
            if (e.key === 'Escape' && searchInput === document.activeElement) {
                searchInput.value = '';
                this.handleSearch('');
                searchInput.blur();
            }
        });
    }

    /**
     * Handle search
     */
    handleSearch(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.filterFAQs();
        this.renderFAQs();
        
        // Update search clear button visibility
        const clearBtn = DOM.get('search-clear-btn');
        if (clearBtn) {
            clearBtn.style.display = this.searchQuery ? 'block' : 'none';
        }
        
        // Track search analytics (in a real app)
        if (this.searchQuery) {
            console.log('FAQ search:', this.searchQuery);
        }
    }

    /**
     * Handle category filter
     */
    handleCategoryFilter(category) {
        this.currentCategory = category;
        
        // Update active category button
        const categoryButtons = DOM.queryAll('.category-btn');
        categoryButtons.forEach(btn => {
            btn.classList.remove('category-active');
            if (btn.dataset.category === category) {
                btn.classList.add('category-active');
            }
        });
        
        this.filterFAQs();
        this.renderFAQs();
    }

    /**
     * Filter FAQs based on search and category
     */
    filterFAQs() {
        this.filteredFAQs = this.faqData.filter(faq => {
            // Category filter
            const categoryMatch = this.currentCategory === 'all' || faq.category === this.currentCategory;
            
            // Search filter
            let searchMatch = true;
            if (this.searchQuery) {
                const searchText = `${faq.question} ${faq.answer} ${faq.tags.join(' ')}`.toLowerCase();
                searchMatch = searchText.includes(this.searchQuery);
            }
            
            return categoryMatch && searchMatch;
        });
    }

    /**
     * Render FAQs
     */
    renderFAQs() {
        const faqContainer = DOM.get('faq-content');
        const noResultsContainer = DOM.get('no-results');
        
        if (!faqContainer || !noResultsContainer) return;
        
        if (this.filteredFAQs.length === 0) {
            // Show no results
            faqContainer.style.display = 'none';
            noResultsContainer.style.display = 'block';
            
            // Update no results message
            const noResultsText = DOM.get('no-results-text');
            if (noResultsText) {
                if (this.searchQuery) {
                    noResultsText.innerHTML = `
                        No results found for "<strong>${Format.escapeHtml(this.searchQuery)}</strong>".
                        <br>Try different keywords or browse categories below.
                    `;
                } else {
                    noResultsText.textContent = 'No FAQs found in this category.';
                }
            }
        } else {
            // Show results
            faqContainer.style.display = 'block';
            noResultsContainer.style.display = 'none';
            
            // Group FAQs by category
            const groupedFAQs = this.groupFAQsByCategory(this.filteredFAQs);
            
            // Render grouped FAQs
            faqContainer.innerHTML = Object.entries(groupedFAQs)
                .map(([category, faqs]) => this.renderFAQCategory(category, faqs))
                .join('');
            
            // Re-initialize FAQ toggles for new content
            this.initFAQToggles();
            this.initHelpfulButtons();
        }
        
        // Update results count
        this.updateResultsCount();
    }

    /**
     * Group FAQs by category
     */
    groupFAQsByCategory(faqs) {
        const grouped = {};
        
        faqs.forEach(faq => {
            if (!grouped[faq.category]) {
                grouped[faq.category] = [];
            }
            grouped[faq.category].push(faq);
        });
        
        return grouped;
    }

    /**
     * Render FAQ category
     */
    renderFAQCategory(category, faqs) {
        const categoryTitle = this.getCategoryTitle(category);
        
        return `
            <div class="faq-category" data-category="${category}">
                <h2 class="faq-category-title">${categoryTitle}</h2>
                <div class="faq-items">
                    ${faqs.map(faq => this.renderFAQItem(faq)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render FAQ item
     */
    renderFAQItem(faq) {
        const answerId = `answer-${faq.id}`;
        const formattedAnswer = this.formatAnswer(faq.answer);
        
        return `
            <div class="faq-item" data-id="${faq.id}">
                <button class="faq-question" aria-expanded="false" aria-controls="${answerId}">
                    <span class="faq-question-text">${this.highlightSearchTerm(faq.question)}</span>
                    <span class="faq-toggle-icon">+</span>
                </button>
                <div class="faq-answer" id="${answerId}" aria-hidden="true">
                    <div class="faq-answer-content">
                        ${this.highlightSearchTerm(formattedAnswer)}
                        <div class="faq-helpful">
                            <span class="faq-helpful-text">Was this helpful?</span>
                            <div class="faq-helpful-buttons">
                                <button class="faq-helpful-btn" data-helpful="true" data-faq-id="${faq.id}">
                                    <span class="faq-helpful-icon">👍</span>
                                    <span class="faq-helpful-count">${faq.helpful}</span>
                                </button>
                                <button class="faq-helpful-btn" data-helpful="false" data-faq-id="${faq.id}">
                                    <span class="faq-helpful-icon">👎</span>
                                    <span class="faq-helpful-count">${faq.notHelpful}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Format answer text
     */
    formatAnswer(answer) {
        return answer
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^(.+)$/, '<p>$1</p>');
    }

    /**
     * Highlight search term in text
     */
    highlightSearchTerm(text) {
        if (!this.searchQuery) return text;
        
        const regex = new RegExp(`(${Format.escapeRegex(this.searchQuery)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Get category title
     */
    getCategoryTitle(category) {
        const titles = {
            'getting-started': 'Getting Started',
            'groups-members': 'Groups & Members',
            'expenses-splitting': 'Expenses & Splitting',
            'account-data': 'Account & Data',
            'technical': 'Technical Issues'
        };
        return titles[category] || Format.capitalize(category.replace('-', ' '));
    }

    /**
     * Initialize FAQ toggles
     */
    initFAQToggles() {
        const faqQuestions = DOM.queryAll('.faq-question');
        faqQuestions.forEach(question => {
            question.addEventListener('click', (e) => {
                this.toggleFAQ(e.target.closest('.faq-item'));
            });
        });
    }

    /**
     * Toggle FAQ item
     */
    toggleFAQ(faqItem) {
        if (!faqItem) return;
        
        const question = faqItem.querySelector('.faq-question');
        const answer = faqItem.querySelector('.faq-answer');
        const icon = faqItem.querySelector('.faq-toggle-icon');
        
        const isExpanded = question.getAttribute('aria-expanded') === 'true';
        
        // Toggle state
        question.setAttribute('aria-expanded', !isExpanded);
        answer.setAttribute('aria-hidden', isExpanded);
        
        // Update icon
        icon.textContent = isExpanded ? '+' : '−';
        
        // Add/remove active class
        faqItem.classList.toggle('faq-active', !isExpanded);
        
        // Smooth scroll to question if opening
        if (!isExpanded) {
            setTimeout(() => {
                question.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }, 100);
        }
    }

    /**
     * Initialize helpful buttons
     */
    initHelpfulButtons() {
        const helpfulButtons = DOM.queryAll('.faq-helpful-btn');
        helpfulButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleHelpfulClick(e.target.closest('.faq-helpful-btn'));
            });
        });
    }

    /**
     * Handle helpful button click
     */
    handleHelpfulClick(button) {
        if (!button) return;
        
        const faqId = button.dataset.faqId;
        const isHelpful = button.dataset.helpful === 'true';
        
        // Find FAQ item
        const faq = this.faqData.find(f => f.id === faqId);
        if (!faq) return;
        
        // Update count
        if (isHelpful) {
            faq.helpful++;
        } else {
            faq.notHelpful++;
        }
        
        // Update UI
        const countSpan = button.querySelector('.faq-helpful-count');
        if (countSpan) {
            countSpan.textContent = isHelpful ? faq.helpful : faq.notHelpful;
        }
        
        // Disable button temporarily
        button.disabled = true;
        button.classList.add('faq-helpful-clicked');
        
        // Show thank you message
        this.showHelpfulThankYou(button);
        
        // In a real app, send this data to analytics
        console.log(`FAQ ${faqId} marked as ${isHelpful ? 'helpful' : 'not helpful'}`);
    }

    /**
     * Show thank you message for helpful feedback
     */
    showHelpfulThankYou(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="faq-helpful-icon">✓</span> Thanks!';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('faq-helpful-clicked');
        }, 2000);
    }

    /**
     * Update results count
     */
    updateResultsCount() {
        const resultsCount = DOM.get('results-count');
        if (resultsCount) {
            const count = this.filteredFAQs.length;
            const total = this.faqData.length;
            
            if (this.searchQuery || this.currentCategory !== 'all') {
                resultsCount.textContent = `Showing ${count} of ${total} articles`;
                resultsCount.style.display = 'block';
            } else {
                resultsCount.style.display = 'none';
            }
        }
    }

    /**
     * Initialize contact form
     */
    initContactForm() {
        const contactForm = DOM.get('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactSubmit(e);
            });
        }
    }

    /**
     * Handle contact form submission
     */
    async handleContactSubmit(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };
        
        // Validate form
        if (!this.validateContactForm(contactData)) {
            return;
        }
        
        try {
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            // Simulate API call (in a real app, send to backend)
            await Timing.delay(1000);
            
            // Show success message
            this.showContactSuccess();
            
            // Reset form
            form.reset();
            
            // Restore button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
        } catch (error) {
            console.error('Contact form error:', error);
            this.showContactError('Failed to send message. Please try again.');
        }
    }

    /**
     * Validate contact form
     */
    validateContactForm(data) {
        if (!Validation.isRequired(data.name)) {
            this.showContactError('Name is required.');
            return false;
        }
        
        if (!Validation.isValidEmail(data.email)) {
            this.showContactError('Please enter a valid email address.');
            return false;
        }
        
        if (!Validation.isRequired(data.subject)) {
            this.showContactError('Subject is required.');
            return false;
        }
        
        if (!Validation.isRequired(data.message)) {
            this.showContactError('Message is required.');
            return false;
        }
        
        return true;
    }

    /**
     * Show contact success message
     */
    showContactSuccess() {
        this.showContactMessage('Thank you for your message! We\'ll get back to you soon.', 'success');
    }

    /**
     * Show contact error message
     */
    showContactError(message) {
        this.showContactMessage(message, 'error');
    }

    /**
     * Show contact message
     */
    showContactMessage(message, type) {
        // Remove existing messages
        const existingMessages = DOM.queryAll('.contact-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create message element
        const messageEl = DOM.create('div', {
            className: `contact-message contact-${type}`,
            innerHTML: `
                <span class="contact-message-icon">${type === 'success' ? '✅' : '⚠️'}</span>
                <span>${message}</span>
            `
        });
        
        // Insert message
        const contactForm = DOM.get('contact-form');
        if (contactForm) {
            contactForm.insertBefore(messageEl, contactForm.firstChild);
            
            // Auto-remove after delay
            setTimeout(() => {
                messageEl.remove();
            }, 5000);
        }
    }

    /**
     * Handle errors
     */
    handleError(message, error) {
        console.error(message, error);
        
        // Show error state
        const faqContainer = DOM.get('faq-content');
        if (faqContainer) {
            faqContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-state-icon">⚠️</div>
                    <h3>Error Loading FAQ</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Initialize FAQ manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new FAQManager();
    });
} else {
    new FAQManager();
}

console.log('✅ FAQ module loaded successfully');