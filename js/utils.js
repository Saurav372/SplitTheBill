/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

// DOM Utilities
const DOM = {
    /**
     * Get element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null}
     */
    get(id) {
        return document.getElementById(id);
    },

    /**
     * Get element by selector
     * @param {string} selector - CSS selector
     * @returns {HTMLElement|null}
     */
    query(selector) {
        return document.querySelector(selector);
    },

    /**
     * Get all elements by selector
     * @param {string} selector - CSS selector
     * @returns {NodeList}
     */
    queryAll(selector) {
        return document.querySelectorAll(selector);
    },

    /**
     * Create element with attributes
     * @param {string} tag - HTML tag
     * @param {Object} attributes - Element attributes
     * @param {string} content - Inner content
     * @returns {HTMLElement}
     */
    create(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    },

    /**
     * Show element
     * @param {HTMLElement} element
     */
    show(element) {
        if (element) {
            element.style.display = '';
            element.classList.remove('hidden');
        }
    },

    /**
     * Hide element
     * @param {HTMLElement} element
     */
    hide(element) {
        if (element) {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    },

    /**
     * Toggle element visibility
     * @param {HTMLElement} element
     */
    toggle(element) {
        if (element) {
            if (element.style.display === 'none' || element.classList.contains('hidden')) {
                this.show(element);
            } else {
                this.hide(element);
            }
        }
    },

    /**
     * Add event listener with cleanup
     * @param {HTMLElement} element
     * @param {string} event
     * @param {Function} handler
     * @param {Object} options
     * @returns {Function} cleanup function
     */
    on(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    },

    /**
     * Remove all children from element
     * @param {HTMLElement} element
     */
    empty(element) {
        if (element) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }
    }
};

// Validation Utilities
const Validation = {
    /**
     * Validate email format
     * @param {string} email
     * @returns {boolean}
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate password strength
     * @param {string} password
     * @returns {Object} {isValid: boolean, strength: string, issues: string[]}
     */
    validatePassword(password) {
        const issues = [];
        let strength = 'weak';
        
        if (password.length < 8) {
            issues.push('Password must be at least 8 characters long');
        }
        
        if (!/[a-z]/.test(password)) {
            issues.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[A-Z]/.test(password)) {
            issues.push('Password must contain at least one uppercase letter');
        }
        
        if (!/\d/.test(password)) {
            issues.push('Password must contain at least one number');
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            issues.push('Password must contain at least one special character');
        }
        
        // Determine strength
        if (issues.length === 0) {
            if (password.length >= 12) {
                strength = 'strong';
            } else if (password.length >= 10) {
                strength = 'good';
            } else {
                strength = 'fair';
            }
        }
        
        return {
            isValid: issues.length === 0,
            strength,
            issues
        };
    },

    /**
     * Validate required field
     * @param {string} value
     * @returns {boolean}
     */
    isRequired(value) {
        return value && value.trim().length > 0;
    },

    /**
     * Validate number
     * @param {string|number} value
     * @param {number} min
     * @param {number} max
     * @returns {boolean}
     */
    isValidNumber(value, min = -Infinity, max = Infinity) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    },

    /**
     * Validate phone number
     * @param {string} phone
     * @returns {boolean}
     */
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
};

// Formatting Utilities
const Format = {
    /**
     * Format currency
     * @param {number} amount
     * @param {string} currency
     * @param {string} locale
     * @returns {string}
     */
    currency(amount, currency = 'USD', locale = 'en-US') {
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        } catch (error) {
            console.warn('Currency formatting error:', error);
            return `${currency} ${amount.toFixed(2)}`;
        }
    },

    /**
     * Format number
     * @param {number} number
     * @param {number} decimals
     * @returns {string}
     */
    number(number, decimals = 2) {
        return parseFloat(number).toFixed(decimals);
    },

    /**
     * Format date
     * @param {Date|string} date
     * @param {string} locale
     * @param {Object} options
     * @returns {string}
     */
    date(date, locale = 'en-US', options = {}) {
        const dateObj = date instanceof Date ? date : new Date(date);
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        try {
            return dateObj.toLocaleDateString(locale, { ...defaultOptions, ...options });
        } catch (error) {
            console.warn('Date formatting error:', error);
            return dateObj.toLocaleDateString();
        }
    },

    /**
     * Format time
     * @param {Date|string} date
     * @param {string} locale
     * @returns {string}
     */
    time(date, locale = 'en-US') {
        const dateObj = date instanceof Date ? date : new Date(date);
        
        try {
            return dateObj.toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.warn('Time formatting error:', error);
            return dateObj.toLocaleTimeString();
        }
    },

    /**
     * Format relative time (e.g., "2 hours ago")
     * @param {Date|string} date
     * @returns {string}
     */
    relativeTime(date) {
        const dateObj = date instanceof Date ? date : new Date(date);
        const now = new Date();
        const diffMs = now - dateObj;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSecs < 60) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return this.date(dateObj);
        }
    },

    /**
     * Truncate text
     * @param {string} text
     * @param {number} length
     * @param {string} suffix
     * @returns {string}
     */
    truncate(text, length = 100, suffix = '...') {
        if (text.length <= length) return text;
        return text.substring(0, length - suffix.length) + suffix;
    },

    /**
     * Capitalize first letter
     * @param {string} text
     * @returns {string}
     */
    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },

    /**
     * Convert to title case
     * @param {string} text
     * @returns {string}
     */
    titleCase(text) {
        return text.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }
};

// Storage Utilities
const Storage = {
    /**
     * Set item in localStorage
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('Storage set error:', error);
        }
    },

    /**
     * Get item from localStorage
     * @param {string} key
     * @param {any} defaultValue
     * @returns {any}
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Storage get error:', error);
            return defaultValue;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Storage remove error:', error);
        }
    },

    /**
     * Clear all localStorage
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.warn('Storage clear error:', error);
        }
    },

    /**
     * Check if localStorage is available
     * @returns {boolean}
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
};

// URL Utilities
const URL = {
    /**
     * Get URL parameters
     * @returns {Object}
     */
    getParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    },

    /**
     * Get specific URL parameter
     * @param {string} name
     * @param {string} defaultValue
     * @returns {string}
     */
    getParam(name, defaultValue = '') {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || defaultValue;
    },

    /**
     * Set URL parameter
     * @param {string} name
     * @param {string} value
     * @param {boolean} replaceState
     */
    setParam(name, value, replaceState = true) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        
        if (replaceState) {
            window.history.replaceState({}, '', url);
        } else {
            window.history.pushState({}, '', url);
        }
    },

    /**
     * Remove URL parameter
     * @param {string} name
     * @param {boolean} replaceState
     */
    removeParam(name, replaceState = true) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        
        if (replaceState) {
            window.history.replaceState({}, '', url);
        } else {
            window.history.pushState({}, '', url);
        }
    }
};

// Debounce and Throttle Utilities
const Timing = {
    /**
     * Debounce function
     * @param {Function} func
     * @param {number} wait
     * @param {boolean} immediate
     * @returns {Function}
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    /**
     * Throttle function
     * @param {Function} func
     * @param {number} limit
     * @returns {Function}
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Delay function
     * @param {number} ms
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Array Utilities
const Arrays = {
    /**
     * Remove duplicates from array
     * @param {Array} array
     * @param {string} key - Optional key for objects
     * @returns {Array}
     */
    unique(array, key = null) {
        if (key) {
            const seen = new Set();
            return array.filter(item => {
                const value = item[key];
                if (seen.has(value)) {
                    return false;
                }
                seen.add(value);
                return true;
            });
        }
        return [...new Set(array)];
    },

    /**
     * Group array by key
     * @param {Array} array
     * @param {string|Function} key
     * @returns {Object}
     */
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = typeof key === 'function' ? key(item) : item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    },

    /**
     * Sort array by key
     * @param {Array} array
     * @param {string} key
     * @param {string} direction - 'asc' or 'desc'
     * @returns {Array}
     */
    sortBy(array, key, direction = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    },

    /**
     * Chunk array into smaller arrays
     * @param {Array} array
     * @param {number} size
     * @returns {Array}
     */
    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
};

// Math Utilities
const Math = {
    /**
     * Round to specific decimal places
     * @param {number} number
     * @param {number} decimals
     * @returns {number}
     */
    round(number, decimals = 2) {
        return Number(Math.round(number + 'e' + decimals) + 'e-' + decimals);
    },

    /**
     * Clamp number between min and max
     * @param {number} number
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    clamp(number, min, max) {
        return Math.min(Math.max(number, min), max);
    },

    /**
     * Generate random number between min and max
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * Generate random integer between min and max
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Calculate percentage
     * @param {number} value
     * @param {number} total
     * @returns {number}
     */
    percentage(value, total) {
        return total === 0 ? 0 : (value / total) * 100;
    }
};

// Device Detection
const Device = {
    /**
     * Check if mobile device
     * @returns {boolean}
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Check if tablet device
     * @returns {boolean}
     */
    isTablet() {
        return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
    },

    /**
     * Check if desktop device
     * @returns {boolean}
     */
    isDesktop() {
        return !this.isMobile() && !this.isTablet();
    },

    /**
     * Check if touch device
     * @returns {boolean}
     */
    isTouch() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    /**
     * Get viewport dimensions
     * @returns {Object}
     */
    getViewport() {
        return {
            width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };
    }
};

// Error Handling
const ErrorHandler = {
    /**
     * Log error with context
     * @param {Error|string} error
     * @param {string} context
     * @param {Object} data
     */
    log(error, context = '', data = {}) {
        const errorInfo = {
            message: error.message || error,
            stack: error.stack,
            context,
            data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('Application Error:', errorInfo);
        
        // In production, you might want to send this to an error tracking service
        // this.sendToErrorService(errorInfo);
    },

    /**
     * Handle async errors
     * @param {Promise} promise
     * @param {string} context
     * @returns {Promise}
     */
    async handle(promise, context = '') {
        try {
            return await promise;
        } catch (error) {
            this.log(error, context);
            throw error;
        }
    }
};

// Export utilities
window.Utils = {
    DOM,
    Validation,
    Format,
    Storage,
    URL,
    Timing,
    Arrays,
    Math,
    Device,
    ErrorHandler
};

// Also export individual utilities for convenience
window.DOM = DOM;
window.Validation = Validation;
window.Format = Format;
window.Storage = Storage;
window.URLUtils = URL;
window.Timing = Timing;
window.Arrays = Arrays;
window.MathUtils = Math;
window.Device = Device;
window.ErrorHandler = ErrorHandler;

console.log('✅ Utils loaded successfully');