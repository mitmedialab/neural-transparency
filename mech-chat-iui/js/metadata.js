// MADLAB Experiment Metadata
// This file contains configuration and metadata for the experiment

// Debug mode flag - set to true for development, false for production
const DEBUG = false;

// Experiment configuration
const EXPERIMENT_CONFIG = {
    name: "MADLAB Chat Interface Experiment",
    version: "1.0.0",
    author: "MADLAB",
    description: "A chat interface experiment for human-AI interaction studies",
    
    // Experiment settings
    settings: {
        maxMessages: 100,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        enableLogging: true,
        enableAnalytics: false
    },
    
    // UI Configuration
    ui: {
        theme: "dark",
        language: "en",
        showTimestamps: true,
        enableMarkdown: true
    },
    
    // Chat configuration
    chat: {
        placeholder: "Type your message here...",
        maxMessageLength: 2000,
        enableTypingIndicator: true,
        enableMessageHistory: true
    }
};

// Page titles for different sections
const PAGE_TITLES = {
    "consent-header": "Consent Form",
    "instructions-header": "Instructions", 
    "comprehension-quiz-header": "Comprehension Quiz",
    "task-header": "Chat Interface",
    "exp-survey-header": "Post-Experiment Survey",
    "exp-complete-header": "Experiment Complete"
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EXPERIMENT_CONFIG, PAGE_TITLES, DEBUG };
}
