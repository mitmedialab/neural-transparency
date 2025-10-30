// Unified Configuration for Local Development and Vercel Deployment
// Automatically detects environment and uses appropriate API configuration

// Claude API Configuration (uncomment to use Claude)
// const API_CONFIG = {
//     model: 'claude-3-5-sonnet-20241022',
//     maxTokens: 1000,
//     apiEndpoint: '/api/claude'
// };

// Modal AI Configuration (uncomment to use Modal, comment out Claude config above)
const API_CONFIG = {
    // model: 'gemma-2-2b-it', // Gemma 2B model from your friend's Modal deployment
    maxTokens: 1000,
    apiEndpoint: '/api/modal'
};

// Function to make API request using Vercel serverless function or CORS proxy fallback
async function makeAPIRequest(requestData) {
    // Check if we're running on Vercel (production) or locally
    const isVercel = window.location.hostname.includes('vercel.app') || 
                     window.location.hostname.includes('vercel.com') ||
                     window.location.hostname.includes('vercel') ||
                     window.location.hostname === 'localhost' && window.location.port === '3000';
    
    console.log('API Request:', {
        hostname: window.location.hostname,
        isVercel: isVercel,
        apiEndpoint: API_CONFIG.apiEndpoint
    });
    
    if (isVercel) {
        // Use Vercel serverless function (no API key needed on frontend)
        try {
            const response = await fetch(API_CONFIG.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                return await response.json();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || `API request failed with status: ${response.status}`);
            }
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    } else {
        // Local development - use direct API calls
        try {
            const response = await fetch(API_CONFIG.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                return await response.json();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || `API request failed with status: ${response.status}`);
            }
        } catch (error) {
            console.error('Local API error:', error);
            throw error;
        }
    }
}


// Pre-load Modal.ai models to ensure they're warm and ready
// Track if models have already been preloaded to avoid duplicate calls
let modelsPreloaded = false;

async function preloadModels() {
    // Only preload once
    if (modelsPreloaded) {
        console.log('⏭️ Models already preloaded, skipping...');
        return;
    }
    
    modelsPreloaded = true;
    console.log('🔄 Pre-loading Modal.ai endpoints...');
    
    // Pre-load both endpoints in parallel for maximum efficiency
    const preloadPromises = [
        // 1. Pre-load the persona-vector endpoint with a test system prompt
        (async () => {
            try {
                const response = await fetch('/api/persona-vector', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        system: 'You are a helpful research assistant.'
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✓ Persona-vector endpoint fully loaded and ready');
                    console.log('  Sample persona response received:', Object.keys(data.content || {}).length, 'dimensions');
                    return { success: true, endpoint: 'persona-vector', data };
                } else {
                    console.warn('⚠ Persona-vector returned non-OK status:', response.status);
                    return { success: false, endpoint: 'persona-vector' };
                }
            } catch (error) {
                console.warn('⚠ Persona-vector pre-loading failed (non-critical):', error.message);
                return { success: false, endpoint: 'persona-vector', error };
            }
        })(),
        
        // 2. Pre-load the chat/LLM endpoint with a test message (not stored in history)
        (async () => {
            try {
                const response = await fetch(API_CONFIG.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        // model: API_CONFIG.model,
                        max_tokens: 100,
                        messages: [
                            { role: 'user', content: 'Hi' }
                        ],
                        system: 'You are a helpful assistant. Respond briefly.'
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const responseText = data.content?.[0]?.text || 'No response';
                    console.log('✓ Chat/LLM endpoint fully loaded and ready');
                    console.log('  Sample chat response received:', responseText.substring(0, 50) + '...');
                    // NOTE: This response is NOT added to conversation history
                    return { success: true, endpoint: 'chat', data };
                } else {
                    console.warn('⚠ Chat/LLM returned non-OK status:', response.status);
                    return { success: false, endpoint: 'chat' };
                }
            } catch (error) {
                console.warn('⚠ Chat/LLM pre-loading failed (non-critical):', error.message);
                return { success: false, endpoint: 'chat', error };
            }
        })()
    ];
    
    // Wait for both to complete
    try {
        const results = await Promise.all(preloadPromises);
        const allSuccess = results.every(r => r.success);
        
        if (allSuccess) {
            console.log('✅ All Modal.ai endpoints fully loaded and ready!');
        } else {
            console.warn('⚠️ Some endpoints may not be ready, but continuing anyway');
        }
        
        return results;
    } catch (error) {
        console.warn('⚠ Unexpected error during pre-loading (non-critical):', error);
        return [];
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        API_CONFIG, 
        makeAPIRequest,
        preloadModels
    };
}