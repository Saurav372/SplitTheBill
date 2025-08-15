/**
 * Internationalization (i18n) Manager
 * Handles multi-language support and currency formatting
 */
class I18nManager {
    constructor() {
        this.currentLanguage = 'en';
        this.currentCurrency = 'USD';
        this.translations = {};
        this.currencies = {};
        this.supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh'];
        this.supportedCurrencies = [
            'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD',
            'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR', 'KRW',
            'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'DKK', 'ISK', 'THB', 'MYR'
        ];
        
        this.init();
    }
    
    /**
     * Initialize i18n system
     */
    async init() {
        try {
            // Load saved preferences
            this.loadPreferences();
            
            // Load translations
            await this.loadTranslations();
            
            // Load currency data
            this.loadCurrencyData();
            
            // Apply initial language
            this.applyLanguage(this.currentLanguage);
            
            console.log('I18n system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize i18n system:', error);
        }
    }
    
    /**
     * Load user preferences from localStorage
     */
    loadPreferences() {
        const savedLanguage = localStorage.getItem('splitthebill_language');
        const savedCurrency = localStorage.getItem('splitthebill_currency');
        
        if (savedLanguage && this.supportedLanguages.includes(savedLanguage)) {
            this.currentLanguage = savedLanguage;
        } else {
            // Detect browser language
            const browserLang = navigator.language.split('-')[0];
            if (this.supportedLanguages.includes(browserLang)) {
                this.currentLanguage = browserLang;
            }
        }
        
        if (savedCurrency && this.supportedCurrencies.includes(savedCurrency)) {
            this.currentCurrency = savedCurrency;
        }
    }
    
    /**
     * Load translations for all supported languages
     */
    async loadTranslations() {
        const translationPromises = this.supportedLanguages.map(async (lang) => {
            try {
                const response = await fetch(`/assets/translations/${lang}.json`);
                if (response.ok) {
                    this.translations[lang] = await response.json();
                } else {
                    console.warn(`Failed to load translations for ${lang}`);
                }
            } catch (error) {
                console.warn(`Error loading translations for ${lang}:`, error);
            }
        });
        
        await Promise.all(translationPromises);
    }
    
    /**
     * Load currency data
     */
    loadCurrencyData() {
        this.currencies = {
            'USD': { symbol: '$', name: 'US Dollar', code: 'USD' },
            'EUR': { symbol: '€', name: 'Euro', code: 'EUR' },
            'GBP': { symbol: '£', name: 'British Pound', code: 'GBP' },
            'JPY': { symbol: '¥', name: 'Japanese Yen', code: 'JPY' },
            'CAD': { symbol: 'C$', name: 'Canadian Dollar', code: 'CAD' },
            'AUD': { symbol: 'A$', name: 'Australian Dollar', code: 'AUD' },
            'CHF': { symbol: 'CHF', name: 'Swiss Franc', code: 'CHF' },
            'CNY': { symbol: '¥', name: 'Chinese Yuan', code: 'CNY' },
            'SEK': { symbol: 'kr', name: 'Swedish Krona', code: 'SEK' },
            'NZD': { symbol: 'NZ$', name: 'New Zealand Dollar', code: 'NZD' },
            'MXN': { symbol: '$', name: 'Mexican Peso', code: 'MXN' },
            'SGD': { symbol: 'S$', name: 'Singapore Dollar', code: 'SGD' },
            'HKD': { symbol: 'HK$', name: 'Hong Kong Dollar', code: 'HKD' },
            'NOK': { symbol: 'kr', name: 'Norwegian Krone', code: 'NOK' },
            'TRY': { symbol: '₺', name: 'Turkish Lira', code: 'TRY' },
            'RUB': { symbol: '₽', name: 'Russian Ruble', code: 'RUB' },
            'INR': { symbol: '₹', name: 'Indian Rupee', code: 'INR' },
            'BRL': { symbol: 'R$', name: 'Brazilian Real', code: 'BRL' },
            'ZAR': { symbol: 'R', name: 'South African Rand', code: 'ZAR' },
            'KRW': { symbol: '₩', name: 'South Korean Won', code: 'KRW' },
            'PLN': { symbol: 'zł', name: 'Polish Zloty', code: 'PLN' },
            'CZK': { symbol: 'Kč', name: 'Czech Koruna', code: 'CZK' },
            'HUF': { symbol: 'Ft', name: 'Hungarian Forint', code: 'HUF' },
            'RON': { symbol: 'lei', name: 'Romanian Leu', code: 'RON' },
            'BGN': { symbol: 'лв', name: 'Bulgarian Lev', code: 'BGN' },
            'HRK': { symbol: 'kn', name: 'Croatian Kuna', code: 'HRK' },
            'DKK': { symbol: 'kr', name: 'Danish Krone', code: 'DKK' },
            'ISK': { symbol: 'kr', name: 'Icelandic Krona', code: 'ISK' },
            'THB': { symbol: '฿', name: 'Thai Baht', code: 'THB' },
            'MYR': { symbol: 'RM', name: 'Malaysian Ringgit', code: 'MYR' }
        };
    }
    
    /**
     * Get translated text
     */
    t(key, params = {}) {
        const translation = this.getNestedTranslation(key);
        
        if (!translation) {
            console.warn(`Translation missing for key: ${key}`);
            return key;
        }
        
        // Replace parameters in translation
        return this.interpolate(translation, params);
    }
    
    /**
     * Get nested translation by key path
     */
    getNestedTranslation(key) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (translation && typeof translation === 'object') {
                translation = translation[k];
            } else {
                return null;
            }
        }
        
        return translation;
    }
    
    /**
     * Interpolate parameters in translation string
     */
    interpolate(text, params) {
        if (typeof text !== 'string') return text;
        
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }
    
    /**
     * Change current language
     */
    async setLanguage(languageCode) {
        if (!this.supportedLanguages.includes(languageCode)) {
            console.error(`Unsupported language: ${languageCode}`);
            return false;
        }
        
        this.currentLanguage = languageCode;
        localStorage.setItem('splitthebill_language', languageCode);
        
        // Apply language to UI
        this.applyLanguage(languageCode);
        
        // Trigger language change event
        this.dispatchLanguageChangeEvent();
        
        return true;
    }
    
    /**
     * Apply language to UI elements
     */
    applyLanguage(languageCode) {
        // Update document language
        document.documentElement.lang = languageCode;
        
        // Update all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update elements with data-i18n-title attribute
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
    }
    
    /**
     * Set current currency
     */
    setCurrency(currencyCode) {
        if (!this.supportedCurrencies.includes(currencyCode)) {
            console.error(`Unsupported currency: ${currencyCode}`);
            return false;
        }
        
        this.currentCurrency = currencyCode;
        localStorage.setItem('splitthebill_currency', currencyCode);
        
        // Trigger currency change event
        this.dispatchCurrencyChangeEvent();
        
        return true;
    }
    
    /**
     * Format currency amount
     */
    formatCurrency(amount, currencyCode = null) {
        const currency = currencyCode || this.currentCurrency;
        const currencyData = this.currencies[currency];
        
        if (!currencyData) {
            return `${amount} ${currency}`;
        }
        
        try {
            // Use Intl.NumberFormat for proper currency formatting
            const formatter = new Intl.NumberFormat(this.getLocaleForCurrency(currency), {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            return formatter.format(amount);
        } catch (error) {
            // Fallback formatting
            return `${currencyData.symbol}${amount.toFixed(2)}`;
        }
    }
    
    /**
     * Get locale for currency formatting
     */
    getLocaleForCurrency(currency) {
        const localeMap = {
            'USD': 'en-US',
            'EUR': 'de-DE',
            'GBP': 'en-GB',
            'JPY': 'ja-JP',
            'CAD': 'en-CA',
            'AUD': 'en-AU',
            'CHF': 'de-CH',
            'CNY': 'zh-CN',
            'SEK': 'sv-SE',
            'NZD': 'en-NZ',
            'MXN': 'es-MX',
            'SGD': 'en-SG',
            'HKD': 'zh-HK',
            'NOK': 'nb-NO',
            'TRY': 'tr-TR',
            'RUB': 'ru-RU',
            'INR': 'hi-IN',
            'BRL': 'pt-BR',
            'ZAR': 'en-ZA',
            'KRW': 'ko-KR'
        };
        
        return localeMap[currency] || 'en-US';
    }
    
    /**
     * Get currency symbol
     */
    getCurrencySymbol(currencyCode = null) {
        const currency = currencyCode || this.currentCurrency;
        return this.currencies[currency]?.symbol || currency;
    }
    
    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return this.supportedLanguages.map(code => ({
            code,
            name: this.t(`languages.${code}`),
            nativeName: this.getNativeLanguageName(code)
        }));
    }
    
    /**
     * Get native language names
     */
    getNativeLanguageName(code) {
        const nativeNames = {
            'en': 'English',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'it': 'Italiano',
            'pt': 'Português',
            'zh': '中文'
        };
        
        return nativeNames[code] || code;
    }
    
    /**
     * Get available currencies
     */
    getAvailableCurrencies() {
        return this.supportedCurrencies.map(code => ({
            code,
            name: this.currencies[code]?.name || code,
            symbol: this.currencies[code]?.symbol || code
        }));
    }
    
    /**
     * Dispatch language change event
     */
    dispatchLanguageChangeEvent() {
        const event = new CustomEvent('languageChanged', {
            detail: {
                language: this.currentLanguage,
                translations: this.translations[this.currentLanguage]
            }
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * Dispatch currency change event
     */
    dispatchCurrencyChangeEvent() {
        const event = new CustomEvent('currencyChanged', {
            detail: {
                currency: this.currentCurrency,
                currencyData: this.currencies[this.currentCurrency]
            }
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    /**
     * Get current currency
     */
    getCurrentCurrency() {
        return this.currentCurrency;
    }
    
    /**
     * Format date according to current locale
     */
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        try {
            return new Intl.DateTimeFormat(this.currentLanguage, formatOptions).format(date);
        } catch (error) {
            return date.toLocaleDateString();
        }
    }
    
    /**
     * Format number according to current locale
     */
    formatNumber(number, options = {}) {
        try {
            return new Intl.NumberFormat(this.currentLanguage, options).format(number);
        } catch (error) {
            return number.toString();
        }
    }
}

// Global instance
window.i18n = new I18nManager();