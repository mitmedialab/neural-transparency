/**
 * Settings Configuration for Mech Chat IUI
 * 
 * This module centralizes all URL parameter-based settings for the experiment.
 * URL parameters override default values, and all feature flags should reference
 * these settings rather than reading URL parameters directly.
 * 
 * Usage:
 *   Import this file before other scripts, then access: window.experimentSettings
 */

/**
 * Get settings from URL parameters and merge with defaults
 * @returns {Object} Settings object with all experiment configuration
 */
function getExperimentSettingsFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for demo mode first - it will override multiple settings
    const isDemoMode = urlParams.get('demo') === 'true';
    
    // If demo mode is active, clear any previous sessionStorage assignments
    // to ensure demo mode settings take precedence
    if (isDemoMode) {
        sessionStorage.removeItem('visualizationCondition');
        sessionStorage.removeItem('conditionAssignmentMethod');
    }
    
    let settings = {
        /**
         * Demo mode - combines debug features, skips surveys, always shows visualization
         * Automatically enables: debug, skipSurvey, visualizationCondition=1
         * Keeps helpful instruction modals (avatar, prompt, chat, visualization, refinement)
         * URL: ?demo=true
         * Default: false
         */
        demo: isDemoMode,
        
        /**
         * Debug mode - enables debug features and test buttons
         * URL: ?debug=true
         * Default: false
         * Note: Automatically enabled when demo=true
         */
        debug: isDemoMode || urlParams.get('debug') === 'true',
        
        /**
         * Debug timer mode - shortens timer for testing (10 seconds vs 10 minutes)
         * URL: ?debugTimer=true
         * Default: false
         */
        debugTimer: urlParams.get('debugTimer') === 'true',
        
        /**
         * Fresh mode - clears all session/local storage on load
         * URL: ?fresh=true
         * Default: false
         */
        fresh: urlParams.get('fresh') === 'true',
        
        /**
         * Skip all surveys (pre-task and post-task) and instruction modals
         * URL: ?skipSurvey=true
         * Default: false
         * Note: Automatically enabled when demo=true, but demo mode keeps certain modals
         */
        skipSurvey: isDemoMode || urlParams.get('skipSurvey') === 'true',
        
        /**
         * Shorten system prompt minimum character requirement (bypasses 100 char minimum)
         * URL: ?shortenPrompt=true
         * Default: false
         */
        shortenPrompt: urlParams.get('shortenPrompt') === 'true',
        
        /**
         * Use sunburst visualization for persona (vs bar chart)
         * URL: ?sunburst=true or ?sunburst=false
         * Default: false
         */
        sunburst: (() => {
            const sunburstParam = urlParams.get('sunburst');
            if (sunburstParam === null) {
                return false; // Default to false
            }
            return sunburstParam.toLowerCase() === 'true' || sunburstParam === '1';
        })(),
        
        /**
         * Visualization condition - experimental control setting
         * 0 = Control condition (no visualization)
         * 1 = Experimental condition (with visualization)
         * URL: ?visualizationCondition=0 or ?visualizationCondition=1
         * Default: Random 50/50 assignment
         * Note: Demo mode always forces visualizationCondition=1
         */
        visualizationCondition: (() => {
            // Demo mode always shows visualization (condition 1)
            if (isDemoMode) {
                sessionStorage.setItem('visualizationCondition', '1');
                sessionStorage.setItem('conditionAssignmentMethod', 'demo_mode');
                return 1;
            }
            
            const conditionParam = urlParams.get('visualizationCondition');
            
            // Check for URL parameter override first
            if (conditionParam !== null) {
                const value = parseInt(conditionParam, 10);
                if (value === 0 || value === 1) {
                    // Store in sessionStorage to maintain across navigations
                    sessionStorage.setItem('visualizationCondition', value.toString());
                    sessionStorage.setItem('conditionAssignmentMethod', 'manual_url');
                    return value;
                }
            }
            
            // Check if already assigned in this session
            const storedCondition = sessionStorage.getItem('visualizationCondition');
            const storedMethod = sessionStorage.getItem('conditionAssignmentMethod');
            if (storedCondition !== null && storedMethod !== null) {
                return parseInt(storedCondition, 10);
            }
            
            // Random 50/50 assignment for new sessions
            const randomCondition = Math.random() < 0.5 ? 0 : 1;
            sessionStorage.setItem('visualizationCondition', randomCondition.toString());
            sessionStorage.setItem('conditionAssignmentMethod', 'random');
            return randomCondition;
        })(),
    };
    
    return settings;
}

// ============================================
// DEFAULT SETTINGS (without URL parameters)
// ============================================
// Note: visualizationCondition uses random assignment, not a fixed default

let defaultSettings = {
    demo: false,
    debug: false,
    debugTimer: false,
    fresh: false,
    skipSurvey: false,
    shortenPrompt: false,
    sunburst: false,
    visualizationCondition: null, // Random assignment (0 or 1)
};

// ============================================
// INITIALIZE SETTINGS
// ============================================

// Create global settings object
window.experimentSettings = getExperimentSettingsFromURL();

// Debug: explicitly log demo flag and timestamp to verify new version is loaded
console.log('🔍 DEBUG [v2024-10-21-v2]: demo flag =', window.experimentSettings.demo);

// Log demo mode prominently if active
if (window.experimentSettings.demo) {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('   🎬 DEMO MODE ACTIVE');
    console.log('═══════════════════════════════════════════');
    console.log('Demo mode automatically enables:');
    console.log('  ✓ Skip consent page (go directly to avatar selection)');
    console.log('  ✓ Debug features enabled');
    console.log('  ✓ Skip surveys (pre-task and post-task)');
    console.log('  ✓ Visualization always shown');
    console.log('  ✓ Instruction modals kept (avatar, prompt, chat, viz, refinement)');
    console.log('═══════════════════════════════════════════');
    console.log('');
}

// Log settings on load (helpful for debugging)
console.log('⚙️ Experiment Settings Loaded:', window.experimentSettings);

// Log visualization condition prominently
const conditionName = window.experimentSettings.visualizationCondition === 0 ? 'CONTROL (No Visualization)' : 'EXPERIMENTAL (With Visualization)';
const conditionMethod = sessionStorage.getItem('conditionAssignmentMethod') || 'unknown';
console.log(`🔬 Visualization Condition: ${conditionName} (${conditionMethod})`);

// Log which settings were overridden by URL parameters
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.toString()) {
    console.log('🔗 URL Parameters Active:', urlParams.toString());
    
    // Show which specific settings were changed from defaults
    const changedSettings = [];
    for (const [key, value] of Object.entries(window.experimentSettings)) {
        if (JSON.stringify(value) !== JSON.stringify(defaultSettings[key])) {
            changedSettings.push(`  • ${key}: ${JSON.stringify(value)} (default: ${JSON.stringify(defaultSettings[key])})`);
        }
    }
    
    if (changedSettings.length > 0) {
        console.log('📝 Settings Changed from Defaults:\n' + changedSettings.join('\n'));
    }
} else {
    console.log('✅ Using all default settings (no URL parameters)');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get a specific setting value
 * @param {string} key - Setting key
 * @returns {*} Setting value
 */
window.getSetting = function(key) {
    return window.experimentSettings[key];
};

/**
 * Update a setting at runtime (useful for dynamic changes)
 * @param {string} key - Setting key
 * @param {*} value - New value
 */
window.updateSetting = function(key, value) {
    console.log(`⚙️ Setting updated: ${key} = ${JSON.stringify(value)}`);
    window.experimentSettings[key] = value;
};

// ============================================
// BACKWARD COMPATIBILITY HELPERS
// ============================================

/**
 * Legacy function for checking sunburst display mode
 * Kept for backward compatibility with existing code
 * @returns {boolean}
 */
window.useSunburstDisplay = function() {
    return window.experimentSettings.sunburst;
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        experimentSettings: window.experimentSettings,
        getSetting: window.getSetting,
        updateSetting: window.updateSetting,
        useSunburstDisplay: window.useSunburstDisplay
    };
}
