// initialize firebase
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBnlqrGcIfgo59WCzure6azGQitEQaGhZg",
    authDomain: "mech-chat-ee0c5.firebaseapp.com",
    databaseURL: "https://mech-chat-ee0c5-default-rtdb.firebaseio.com",
    projectId: "mech-chat-ee0c5",
    storageBucket: "mech-chat-ee0c5.firebasestorage.app",
    messagingSenderId: "1027129084043",
    appId: "1:1027129084043:web:ece77d746e79110f98ec8e"
};

// Import Firebase functions from v1.0 (auto-initializes)
import { 
    writeRealtimeDatabase, writeURLParameters, readRealtimeDatabase,
    blockRandomization, finalizeBlockRandomization, firebaseUserId 
} from "./firebasepsych1.0.js";

// Clear sessionStorage on EVERY load to ensure fresh experience
// But preserve firebaseUserId which is critical for data collection
const preservedFirebaseUserId = sessionStorage.getItem('firebaseUserId');
sessionStorage.clear();

// Store firebaseUserId in sessionStorage for access by other pages (like complete.html)
sessionStorage.setItem('firebaseUserId', preservedFirebaseUserId || firebaseUserId);

// Clear localStorage states that would prevent fresh experience on reload
localStorage.removeItem('selectedAvatar');
localStorage.removeItem('preTaskSurveyCompleted');
localStorage.removeItem('preTaskSurveyData');

// Write a simple test case to the database
let studyId;
if (DEBUG){
    studyId = 'pilot-oct9-session3-debug';
} else {
    studyId = 'pilot-oct9-session3';
}

const testPath = studyId + '/participantData/' + firebaseUserId + '/testMessage';
const testValue = {
    message: "Hello from chat.js!",
    timestamp: new Date().toISOString(),
    value: 42
};

await writeRealtimeDatabase(testPath, testValue);

// Write URL parameters to Firebase
const urlParamsPath = studyId + '/participantData/' + firebaseUserId + '/urlParameters';
await writeURLParameters(urlParamsPath);

// Write visualization condition assignment to Firebase
const conditionPath = studyId + '/participantData/' + firebaseUserId + '/experimentCondition';
const conditionData = {
    visualizationCondition: window.experimentSettings.visualizationCondition,
    conditionName: window.experimentSettings.visualizationCondition === 0 ? 'control' : 'experimental',
    assignmentMethod: sessionStorage.getItem('conditionAssignmentMethod') || 'unknown',
    timestamp: new Date().toISOString()
};

// IMPORTANT: Log experiment condition explicitly
console.log('=== EXPERIMENT CONDITION ===');
console.log('Condition:', conditionData.conditionName.toUpperCase());
console.log('Visualization:', conditionData.visualizationCondition === 0 ? 'DISABLED (Control)' : 'ENABLED (Experimental)');
console.log('Assignment Method:', conditionData.assignmentMethod);
console.log('============================');

await writeRealtimeDatabase(conditionPath, conditionData);

// Enhanced Chat Interface JavaScript with System Prompt Configuration
// Initialize global variables if they don't exist
if (typeof window.messageIdCounter === 'undefined') {
    window.messageIdCounter = 2; // Start from 2 since we have initial message with ID 1
}
if (typeof window.conversationHistory === 'undefined') {
    window.conversationHistory = []; // Store conversation history for API calls
}
// Track sunburst layout mode
if (typeof window.sunburstOppositeLayout === 'undefined') {
    window.sunburstOppositeLayout = false; // Default: mirrored (shows neutral category at bottom)
}
// Store current persona data for redrawing
if (typeof window.currentPersonaData === 'undefined') {
    window.currentPersonaData = null;
}
if (typeof window.lastSystemPrompt === 'undefined') {
    window.lastSystemPrompt = null; // Track the last system prompt used
}
// Track if system prompt has been submitted for current version
if (typeof window.systemPromptSubmitted === 'undefined') {
    window.systemPromptSubmitted = false;
}
// Track if persona has been checked for current system prompt
if (typeof window.personaCheckedForCurrentPrompt === 'undefined') {
    window.personaCheckedForCurrentPrompt = false;
}
// Track if prompt has been edited since last submission
if (typeof window.promptHasChangedSinceSubmit === 'undefined') {
    window.promptHasChangedSinceSubmit = false;
}

// Timer variables
if (typeof window.timerStartTime === 'undefined') {
    window.timerStartTime = null;
}
if (typeof window.timerInterval === 'undefined') {
    window.timerInterval = null;
}
if (typeof window.timerDuration === 'undefined') {
    // Check for debug mode via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const debugTimer = urlParams.get('debugTimer') === 'true';
    window.timerDuration = debugTimer ? 10 : 600; // 10 seconds for debug, 10 minutes (600s) for production
}
if (typeof window.timerExpired === 'undefined') {
    window.timerExpired = false;
}

// Note: API configuration is loaded from config-unified.js file

// Avatar selection state
if (typeof window.selectedAvatar === 'undefined') {
    window.selectedAvatar = null; // Will store the avatar image path
}

$(document).ready(function() {
    // Initialize the dynamic interface
    initializeDynamicInterface();
});

function initializeDynamicInterface() {
    const avatarSelectionInterface = $('#avatarSelectionInterface');
    const systemPromptInterface = $('#systemPromptInterface');
    const chatInterface = $('#chatInterface');
    const messagesContainer = $('#messagesContainer');
    const messageInput = $('#messageInput');
    const sendBtn = $('#sendBtn');
    const typingIndicator = $('#typingIndicator');
    const attachBtn = $('#attachBtn');
    const imageBtn = $('#imageBtn');

    // System prompt configuration elements
    const resetConfig = $('#resetConfig');
    const startChatBtn = $('#startChatBtn');
    const backToConfigBtn = $('#backToConfigBtn');

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true';
    const skipSurvey = urlParams.get('skipSurvey') === 'true';
    const freshMode = urlParams.get('fresh') === 'true';
    
    // Fresh mode: Already handled in index.html, but keep for direct navigation to chat
    if (freshMode) {
        // If somehow we got here with fresh=true still in URL, clear it
        const newUrl = new URL(window.location);
        if (newUrl.searchParams.has('fresh')) {
            newUrl.searchParams.delete('fresh');
            window.history.replaceState({}, '', newUrl);
        }
    }
    
    // SessionStorage is already cleared at the top of this file for fresh experience on every load
    
    // Initialize avatar selection first
    initializeAvatarSelection();
    
    // Initialize system prompt configuration
    initializeSystemPromptConfig();
    
    // Initialize chat functionality
    initializeChatFunctionality();
    
    // Show avatar instruction modal when interface loads
    setTimeout(() => {
        window.showInstructionModal('avatar');
    }, 50);

    function initializeAvatarSelection() {
        const avatarGrid = $('.avatar-grid');
        const confirmAvatarBtn = $('#confirmAvatarBtn');
        
        // Use settings from global settings object
        const skipSurvey = window.experimentSettings.skipSurvey;
        
        if (skipSurvey) {
            localStorage.setItem('preTaskSurveyCompleted', 'true');
        }
        
        // Generate 12 avatar options
        const avatarCount = 12;
        let avatarHTML = '';
        
        for (let i = 1; i <= avatarCount; i++) {
            const avatarPath = `Avatar/avatar-${i}.jpg`;
            avatarHTML += `
                <div class="avatar-option" data-avatar="${avatarPath}">
                    <img src="${avatarPath}" alt="Avatar ${i}" />
                    <div class="avatar-check">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
            `;
        }
        
        avatarGrid.html(avatarHTML);
        
        // Handle avatar selection
        $('.avatar-option').on('click', async function() {
            // Remove selection from all avatars
            $('.avatar-option').css('border-color', 'transparent');
            $('.avatar-check').hide();
            
            // Select this avatar
            $(this).css('border-color', '#2196F3');
            $(this).find('.avatar-check').css('display', 'flex');
            
            // Store selected avatar
            const avatarPath = $(this).data('avatar');
            window.selectedAvatar = avatarPath;
            
            // Enable confirm button
            confirmAvatarBtn.prop('disabled', false);
        });
        
        // Confirm avatar selection
        confirmAvatarBtn.on('click', async function() {
            if (!window.selectedAvatar) {
                alert('Please select an avatar first.');
                return;
            }
            
            // Save to localStorage
            localStorage.setItem('selectedAvatar', window.selectedAvatar);
            
            // Log to Firebase
            const avatarLogPath = studyId + '/participantData/' + firebaseUserId + '/selectedAvatar';
            const avatarData = {
                avatar: window.selectedAvatar,
                timestamp: new Date().toISOString()
            };
            await writeRealtimeDatabase(avatarLogPath, avatarData);
            
            // Switch to system prompt configuration
            switchToSystemPromptConfig();
        });
    }

    function initializeSystemPromptConfig() {
        // Get the system prompt input
        const systemPromptInput = $('#systemPromptInput');

        // Initialize survey
        initializePreTaskSurvey();

        // LocalStorage already cleared at the top of this file for fresh experience
        
        // Get visualization condition from settings
        const visualizationCondition = window.experimentSettings.visualizationCondition;
        
        // IMPORTANT: Log condition explicitly
        console.log('=== SYSTEM PROMPT CONFIG INITIALIZATION ===');
        console.log('Visualization Condition:', visualizationCondition === 0 ? 'CONTROL (no-viz)' : 'EXPERIMENTAL (viz)');
        console.log('==========================================');

        // Always start with Check/Test Persona buttons hidden
        $('.persona-check-buttons').hide();
        
        // Hide visualization elements if in control condition
        if (visualizationCondition === 0) {
            // Hide persona visualization container permanently
            $('#personaVisualization').remove();
            // Hide visualization help button
            $('#visualizationHelpBtn').remove();
            // Hide toggle layout button
            $('#toggleLayoutBtn').remove();
        }
        
        // Check for debug mode - hide Test Persona button if not in debug mode
        const urlParams = new URLSearchParams(window.location.search);
        const debugMode = urlParams.get('debug') === 'true';
        if (!debugMode) {
            $('#testPersonaBtn').hide();
        }

        // Character counter functionality
        const MIN_CHAR_LENGTH = 100;
        const shortenPrompt = urlParams.get('shortenPrompt') === 'true';
        
        const updateCharacterCounter = function() {
            const currentLength = systemPromptInput.val().length;
            $('#charCount').text(currentLength);
            
            // Mark that system prompt needs to be resubmitted if it's changed
            if (window.systemPromptSubmitted) {
                // System prompt has changed after submission, require resubmission
                window.systemPromptSubmitted = false;
                window.personaCheckedForCurrentPrompt = false;
                window.promptHasChangedSinceSubmit = true;
                
                // Show Submit Prompt button
                $('#submitPromptBtn').show();
                
                // Disable Check/Test Persona buttons (viz condition only)
                $('.persona-check-buttons').hide();
                
                // Disable Start Chat until new prompt is submitted and persona is checked
                $('#startChatBtn').prop('disabled', true);
            }
            
            // Button is always visible but disabled until character requirement is met
            // Update color and button state based on whether minimum is met (or bypassed)
            if (shortenPrompt || currentLength >= MIN_CHAR_LENGTH) {
                $('#characterCounter').css('color', 'var(--success-color, #28a745)');
                $('#submitPromptBtn').prop('disabled', false);
            } else {
                $('#characterCounter').css('color', 'var(--text-secondary)');
                $('#submitPromptBtn').prop('disabled', true);
            }
            // Always show the button (unless it was explicitly hidden after submission)
            if (!$('.persona-check-buttons').is(':visible')) {
                $('#submitPromptBtn').show();
            }
        };
        
        // Update counter text if bypass is enabled
        if (shortenPrompt) {
            $('#characterCounter').html('<span id="charCount">0</span> characters (minimum bypassed)');
        }
        
        // Initialize character counter on page load
        updateCharacterCounter();
        
        // Update character counter on input
        systemPromptInput.on('input', updateCharacterCounter);

        // Check if survey has been completed
        const surveyCompleted = localStorage.getItem('preTaskSurveyCompleted');
        
        if (!surveyCompleted) {
            // Disable all buttons except Submit Prompt
            disableInterfaceButtons();
            // Show initial placeholder (survey will show after Submit Prompt clicked)
            $('#initialPlaceholder').show();
            $('#preTaskSurveyContainer').hide();
            $('#personaVisualization').hide();
            // Explicitly hide Check/Test Persona buttons until survey is complete
            $('.persona-check-buttons').hide();
        } else {
            // Survey already completed - show Submit Prompt initially so user can submit their prompt
            $('#submitPromptBtn').show();
            $('#initialPlaceholder').show();
            $('#initialPlaceholder').html(`
                <div style="text-align: center; color: var(--text-muted); padding: 3rem 2rem;">
                    <i class="fas fa-arrow-left" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p style="margin: 0; font-size: 1.1rem;">Click "Submit Prompt" to continue</p>
                </div>
            `);
            $('#preTaskSurveyContainer').hide();
            $('#personaVisualization').hide();
            // Hide Check/Test Persona buttons initially
            $('.persona-check-buttons').hide();
            // Disable Start Chat until persona is checked
            $('#startChatBtn').prop('disabled', true);
        }

        // Submit Prompt button - triggers survey
        $('#submitPromptBtn').on('click', function() {
            const systemPrompt = $('#systemPromptInput').val();
            
            if (!systemPrompt.trim()) {
                alert('Please enter a system prompt first.');
                return;
            }
            
            // Check minimum length unless bypassed
            if (!shortenPrompt && systemPrompt.length < MIN_CHAR_LENGTH) {
                alert(`Please enter at least ${MIN_CHAR_LENGTH} characters. Current length: ${systemPrompt.length}`);
                return;
            }
            
            // Mark system prompt as submitted
            window.systemPromptSubmitted = true;
            window.promptHasChangedSinceSubmit = false; // Reset change tracking
            
            // Reset persona checked flag since we have a new/updated prompt
            window.personaCheckedForCurrentPrompt = false;
            
            // Keep Start Chat disabled until persona is checked (or auto-unlocked in no-viz)
            $('#startChatBtn').prop('disabled', true);
            
            // Check if survey was already completed OR if skipSurvey mode is on
            const surveyCompleted = localStorage.getItem('preTaskSurveyCompleted');
            const skipSurvey = window.experimentSettings.skipSurvey;
            const visualizationCondition = window.experimentSettings.visualizationCondition;
            const isDemoMode = window.experimentSettings.demo;
            
            if (surveyCompleted || skipSurvey) {
                if (skipSurvey) {
                    localStorage.setItem('preTaskSurveyCompleted', 'true');
                    if (isDemoMode) {
                        console.log('🎬 Demo mode: Skipping pre-task survey, proceeding to visualization');
                    }
                }
                
                // Hide Submit button
                $('#submitPromptBtn').hide();
                
                // Check visualization condition
                if (visualizationCondition === 0) {
                    // NO-VIZ: Auto-submit flow
                    // Keep placeholder visible for trait definitions
                    $('#initialPlaceholder').show();
                    autoSubmitPersonaCheck(systemPrompt);
                    // Enable interface buttons (autoSubmitPersonaCheck handles Start Chat)
                    enableInterfaceButtons();
                } else {
                    // VIZ: Show Check Persona buttons
                    $('.persona-check-buttons').show();
                    $('#initialPlaceholder').show();
                    $('#initialPlaceholder').html(`
                        <div style="text-align: center; color: var(--text-muted); padding: 3rem 2rem;">
                            <i class="fas fa-chart-bar" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                            <p style="margin: 0; font-size: 1.1rem;">Click "Check Persona" to analyze and enable chat</p>
                        </div>
                    `);
                    // Enable interface buttons (except Start Chat which requires persona check)
                    enableInterfaceButtons();
                    $('#startChatBtn').prop('disabled', true); // Keep disabled until persona check
                }
                
                return;
            }
            
            // Hide placeholder and show survey
            $('#initialPlaceholder').hide();
            renderInlineSurvey();
            
            // Hide Submit Prompt button after clicking
            $('#submitPromptBtn').prop('disabled', true).hide();
        });

        // Reset configuration
        resetConfig.on('click', async function() {
            systemPromptInput.val('');
            updateCharacterCounter(); // Update the counter to show 0
            
            // Reset state flags
            window.systemPromptSubmitted = false;
            window.personaCheckedForCurrentPrompt = false;
            window.promptHasChangedSinceSubmit = false;
            
            // Hide Check/Test Persona buttons and show Submit Prompt
            $('.persona-check-buttons').hide();
            $('#submitPromptBtn').show();
            
            // Disable Start Chat button
            $('#startChatBtn').prop('disabled', true);
            
            // Reset visualizations (only if in viz condition)
            const visualizationCondition = window.experimentSettings.visualizationCondition;
            if (visualizationCondition === 1) {
                $('#personaVisualization').hide();
            }
            
            $('#initialPlaceholder').show();
            $('#initialPlaceholder').html(`
                <div style="text-align: center; color: var(--text-muted); padding: 3rem 2rem;">
                    <i class="fas fa-arrow-left" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p style="margin: 0; font-size: 1.1rem;">Click "Submit Prompt" to begin assessment</p>
                </div>
            `);
            
            // Log this reset action to Firebase
            const promptLogPath = studyId + '/participantData/' + firebaseUserId + '/systemPromptLog/' + Date.now();
            await writeRealtimeDatabase(promptLogPath, {
                prompt: '',
                action: 'reset_to_empty',
                timestamp: new Date().toISOString()
            });
        });

        // Start chat
        startChatBtn.on('click', async function() {
            const systemPrompt = $('#systemPromptInput').val();
            
            // Check if system prompt has changed
            const promptChanged = window.lastSystemPrompt !== null && window.lastSystemPrompt !== systemPrompt;
            
            if (promptChanged) {
                // Log the chat history clear event to Firebase
                const clearLogPath = studyId + '/participantData/' + firebaseUserId + '/chatHistoryClearLog/' + Date.now();
                await writeRealtimeDatabase(clearLogPath, {
                    previousPrompt: window.lastSystemPrompt,
                    newPrompt: systemPrompt,
                    timestamp: new Date().toISOString(),
                    reason: 'system_prompt_changed'
                });
                
                // Clear conversation history
                window.conversationHistory = [];
                // Clear chat UI
                const messagesContainer = $('#messagesContainer');
                messagesContainer.empty();
                
                // Get selected avatar for welcome message
                const selectedAvatar = localStorage.getItem('selectedAvatar') || window.selectedAvatar;
                let avatarHtml;
                if (selectedAvatar) {
                    avatarHtml = `<img src="${selectedAvatar}" alt="AI Assistant" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
                } else {
                    avatarHtml = '<i class="fas fa-robot"></i>';
                }
                
                // Add welcome message back
                const welcomeMessage = `
                    <div class="message assistant-message" data-message-id="1">
                        <div class="message-avatar">
                            ${avatarHtml}
                        </div>
                        <div class="message-content">
                            <div class="message-text">
                                Hi there!
                            </div>
                        </div>
                    </div>
                `;
                messagesContainer.append(welcomeMessage);
                // Reset message counter
                window.messageIdCounter = 2;
            }
            
            // Update last system prompt
            window.lastSystemPrompt = systemPrompt;
            
            // Store system prompt in localStorage for the chat interface
            localStorage.setItem('customSystemPrompt', systemPrompt);
            
            // Log this system prompt attempt to Firebase
            const promptLogPath = studyId + '/participantData/' + firebaseUserId + '/systemPromptLog/' + Date.now();
            await writeRealtimeDatabase(promptLogPath, {
                prompt: systemPrompt,
                action: 'start_chat',
                timestamp: new Date().toISOString()
            });
            
            // Save system prompt to Firebase
            const systemPromptPath = studyId + '/participantData/' + firebaseUserId + '/systemPrompt';
            await writeRealtimeDatabase(systemPromptPath, {
                prompt: systemPrompt,
                timestamp: new Date().toISOString()
            });
            
            // Start timer if not already started
            if (window.timerStartTime === null) {
                startTimer();
            }
            
            // Switch to chat interface
            switchToChat();
        });

        // Check Persona button - analyze persona with API
        $('#checkPersonaBtn').on('click', async function() {
            // Remove focus from button to return to default state
            $(this).blur();
            
            // Get the current system prompt from the input
            const systemPrompt = $('#systemPromptInput').val();
            
            // Log this system prompt attempt to Firebase
            const promptLogPath = studyId + '/participantData/' + firebaseUserId + '/systemPromptLog/' + Date.now();
            await writeRealtimeDatabase(promptLogPath, {
                prompt: systemPrompt,
                action: 'check_persona',
                timestamp: new Date().toISOString()
            });
            
            // Mark that persona has been checked for current prompt
            window.personaCheckedForCurrentPrompt = true;
            
            // Enable Start Chat button now that persona is checked
            $('#startChatBtn').prop('disabled', false);
            
            // Hide placeholder, show persona visualization area
            $('#initialPlaceholder').hide();
            $('#personaVisualization').show();
            
            // Show visualization explanation modal
            window.showVisualizationExplanation();
            
            // Call persona check
            checkPersona(systemPrompt);
        });

        // Test Persona button - generate mock data
        $('#testPersonaBtn').on('click', async function() {
            // Remove focus from button to return to default state
            $(this).blur();
            
            // Get the current system prompt from the input
            const systemPrompt = $('#systemPromptInput').val();
            
            // Log this system prompt attempt to Firebase
            const promptLogPath = studyId + '/participantData/' + firebaseUserId + '/systemPromptLog/' + Date.now();
            await writeRealtimeDatabase(promptLogPath, {
                prompt: systemPrompt,
                action: 'test_persona',
                timestamp: new Date().toISOString()
            });
            
            // Mark that persona has been checked for current prompt (test counts as check)
            window.personaCheckedForCurrentPrompt = true;
            
            // Enable Start Chat button now that persona is checked
            $('#startChatBtn').prop('disabled', false);
            
            // Hide placeholder, show persona visualization area
            $('#initialPlaceholder').hide();
            $('#personaVisualization').show();
            
            // Show visualization explanation modal
            window.showVisualizationExplanation();
            
            // Generate test persona
            testPersonaWithMockData();
        });

        // Visualization Help button - show explanation modal
        // Use event delegation since the button is loaded asynchronously
        $(document).on('click', '#visualizationHelpBtn', function() {
            // Remove focus from button to return to default state
            $(this).blur();
            
            // Show the visualization explanation modal (force show)
            window.showVisualizationExplanation(true);
        });

        // Dismiss visualization explanation modal
        $(document).on('click', '#dismissVisualizationExplanation', function() {
            window.dismissVisualizationExplanation();
        });

        // Dismiss prompt refinement modal
        $(document).on('click', '#dismissPromptRefinement', function() {
            window.dismissPromptRefinementModal();
        });

        // Toggle Layout button - switch between opposite and mirrored layouts
        // Use event delegation since the button is loaded asynchronously
        $(document).on('click', '#toggleLayoutBtn', function() {
            // Remove focus from button to return to default state
            $(this).blur();
            
            // Toggle the layout mode
            window.sunburstOppositeLayout = !window.sunburstOppositeLayout;
            
            // Update button text
            const modeText = window.sunburstOppositeLayout ? 'Opposite' : 'Mirrored';
            $('#layoutModeText').text(modeText);
            
            // Redraw the sunburst if we have persona data
            if (window.currentPersonaData && typeof createPersonaSunburst === 'function') {
                createPersonaSunburst(window.currentPersonaData, 'personaChartSunburst', {
                    width: 380,
                    height: 380,
                    innerRadius: 45,
                    animate: true,
                    oppositeLayout: window.sunburstOppositeLayout
                });
            }
        });

        // Helper function to show/hide persona sections
        window.showPersonaVisualization = function() {
            $('#personaVisualization').show();
            $('#personaPlaceholder').hide();
        };

        window.hidePersonaVisualization = function() {
            $('#personaVisualization').hide();
            $('#personaPlaceholder').show();
        };

        // Back to configuration
        backToConfigBtn.on('click', function() {
            switchToSystemPromptConfig();
        });

    }

    function initializeChatFunctionality() {
        // Enable/disable send button based on input
        messageInput.on('input', function() {
            sendBtn.prop('disabled', messageInput.val().trim() === '');
        });

        // Auto-resize textarea
        messageInput.on('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Event listeners
        sendBtn.on('click', sendMessage);
        
        messageInput.on('keypress', function(e) {
            if (e.which === 13 && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Attach button functionality
        attachBtn.on('click', function() {
            // Placeholder for file attachment
            alert('File attachment feature would be implemented here');
        });

        // Image button functionality
        imageBtn.on('click', function() {
            // Placeholder for image sending
            alert('Image sending feature would be implemented here');
        });
    }

    // Send message function
    async function sendMessage() {
        const message = messageInput.val().trim();
        if (message === '') return;

        // Add user message to conversation history first
        window.conversationHistory.push({
            role: 'user',
            content: message
        });

        // Add user message to UI and save to Firebase
        const userMessageId = await addMessage(message, 'user');
        messageInput.val('');
        sendBtn.prop('disabled', true);
        messageInput.css('height', 'auto');

        // Show typing indicator
        typingIndicator.show();

        // Call AI API for response
        callAIAPI(message);
    }

    // Function to call AI API (generalized for both Claude and Modal)
    async function callAIAPI(userMessage) {
        try {
            // Get custom system prompt from localStorage, fallback to default
            const customSystemPrompt = localStorage.getItem('customSystemPrompt') || 
                "You are a helpful research assistant for the MIT Media Lab Chat Study. Provide thoughtful, informative responses to help participants with their research questions. Be conversational and engaging while maintaining a professional tone.";

            const requestData = {
                model: API_CONFIG.model,
                max_tokens: API_CONFIG.maxTokens,
                messages: window.conversationHistory,
                system: customSystemPrompt
            };

            const data = await makeAPIRequest(requestData);
            
            // Hide typing indicator
            typingIndicator.hide();

            // Extract the assistant's response
            const assistantMessage = data.content[0].text;
            
            // Add assistant message to conversation history
            window.conversationHistory.push({
                role: 'assistant',
                content: assistantMessage
            });

            // Add assistant message to chat and save to Firebase
            await addMessage(assistantMessage, 'assistant');

        } catch (error) {
            console.error('Error calling AI API:', error);
            
            // Hide typing indicator
            typingIndicator.hide();
            
            // Show appropriate error message based on error type
            let errorMessage;
            if (error.message.includes('API key not found') || error.message.includes('not configured')) {
                errorMessage = `API configuration error: ${error.message}. Please check your API settings.`;
            } else if (error.message.includes('CORS')) {
                errorMessage = `CORS Error: ${error.message}. This might be due to network restrictions. Please try again or contact the study administrator.`;
            } else if (error.message.includes('Rate limit exceeded')) {
                errorMessage = `Rate limit exceeded. Please wait a moment and try again.`;
            } else if (error.message.includes('Invalid API key') || error.message.includes('Invalid')) {
                errorMessage = `Invalid configuration: ${error.message}. Please check your API settings and try again.`;
            } else {
                errorMessage = `Error: ${error.message}. Please try again or contact the study administrator.`;
            }
            
            // Add error message to conversation history
            window.conversationHistory.push({
                role: 'assistant',
                content: errorMessage
            });
            
            // Add error message to chat and save to Firebase
            await addMessage(errorMessage, 'assistant');
        }
    }

    // Add message to chat with enhanced features
    async function addMessage(text, sender) {
        const messageId = window.messageIdCounter++;
        const messageClass = sender === 'user' ? 'user-message' : 'assistant-message';
        const senderName = sender === 'user' ? 'You' : 'Assistant';
        const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const timestamp = new Date().toISOString();
        
        // Get the current system prompt being used
        const currentSystemPrompt = localStorage.getItem('customSystemPrompt') || 
            "You are a helpful research assistant for the MIT Media Lab Chat Study. Provide thoughtful, informative responses to help participants with their research questions. Be conversational and engaging while maintaining a professional tone.";
        
        // Generate avatar HTML based on sender and selected avatar
        let avatarHtml;
        if (sender === 'user') {
            avatarHtml = '<i class="fas fa-user"></i>';
        } else {
            // Use selected avatar image for assistant
            const selectedAvatar = localStorage.getItem('selectedAvatar') || window.selectedAvatar;
            if (selectedAvatar) {
                avatarHtml = `<img src="${selectedAvatar}" alt="AI Assistant" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
            } else {
                avatarHtml = '<i class="fas fa-robot"></i>';
            }
        }
        
        const messageHtml = `
            <div class="message ${messageClass}" data-message-id="${messageId}">
                <div class="message-avatar">
                    ${avatarHtml}
                </div>
                <div class="message-content">
                    <div class="message-text">${text}</div>
                </div>
            </div>
        `;
        
        messagesContainer.append(messageHtml);
        messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
        
        // Save message to Firebase with system prompt
        const messagePath = studyId + '/participantData/' + firebaseUserId + '/messages/' + messageId;
        const messageData = {
            messageId: messageId,
            role: sender,
            content: text,
            timestamp: timestamp,
            systemPrompt: currentSystemPrompt
        };
        await writeRealtimeDatabase(messagePath, messageData);
        
        // Also save the full conversation history after each message
        const conversationPath = studyId + '/participantData/' + firebaseUserId + '/conversationHistory';
        await writeRealtimeDatabase(conversationPath, window.conversationHistory);
        
        return messageId;
    }


    // Interface switching functions
    function switchToChat() {
        avatarSelectionInterface.hide();
        systemPromptInterface.hide();
        chatInterface.show();
        
        // Show chat instruction modal
        window.showInstructionModal('chat');
        
        // Show prompt refinement reminder modal (after a 15 second delay so users have time to start chatting)
        setTimeout(() => {
            window.showPromptRefinementModal();
        }, 15000);
        
        // Update initial message avatar with selected avatar
        const selectedAvatar = localStorage.getItem('selectedAvatar') || window.selectedAvatar;
        if (selectedAvatar) {
            const initialAvatarDiv = $('#initialMessageAvatar');
            if (initialAvatarDiv.length > 0) {
                initialAvatarDiv.html(`<img src="${selectedAvatar}" alt="AI Assistant" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`);
            }
        }
    }

    function switchToSystemPromptConfig() {
        avatarSelectionInterface.hide();
        chatInterface.hide();
        systemPromptInterface.show();
        
        // Show prompt instruction modal
        window.showInstructionModal('prompt');
        
        // Display selected avatar in header
        const selectedAvatar = localStorage.getItem('selectedAvatar') || window.selectedAvatar;
        if (selectedAvatar) {
            $('#selectedAvatarImage').attr('src', selectedAvatar);
            $('#selectedAvatarDisplay').show();
        }
        
        // Check if prompt has changed since submission
        const surveyCompleted = localStorage.getItem('preTaskSurveyCompleted');
        const visualizationCondition = window.experimentSettings.visualizationCondition;
        
        if (window.promptHasChangedSinceSubmit) {
            // Prompt was edited - require re-submission
            $('#submitPromptBtn').show();
            $('.persona-check-buttons').hide();
            $('#startChatBtn').prop('disabled', true);
        } else if (surveyCompleted && window.systemPromptSubmitted) {
            // Survey done and prompt was submitted without changes
            
            if (visualizationCondition === 0) {
                // NO-VIZ: No buttons to show, just keep Start Chat state
                $('#submitPromptBtn').hide();
                $('.persona-check-buttons').hide();
                
                // If persona was already checked, keep Start Chat enabled
                if (window.personaCheckedForCurrentPrompt) {
                    $('#startChatBtn').prop('disabled', false);
                    // Show trait definitions placeholder (same as after survey)
                    $('#initialPlaceholder').show();
                    showTraitDefinitionsNoViz();
                } else {
                    $('#startChatBtn').prop('disabled', true);
                }
            } else {
                // VIZ: Show Check Persona buttons
                $('#submitPromptBtn').hide();
                $('.persona-check-buttons').show();
                
                // If persona was already checked, keep Start Chat enabled, otherwise disable it
                if (window.personaCheckedForCurrentPrompt) {
                    $('#startChatBtn').prop('disabled', false);
                } else {
                    $('#startChatBtn').prop('disabled', true);
                }
            }
        }
    }

    // Add clear conversation function
    window.clearConversation = function() {
        window.conversationHistory = [];
        messagesContainer.empty();
        
        // Get selected avatar for welcome message
        const selectedAvatar = localStorage.getItem('selectedAvatar') || window.selectedAvatar;
        let avatarHtml;
        if (selectedAvatar) {
            avatarHtml = `<img src="${selectedAvatar}" alt="AI Assistant" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
        } else {
            avatarHtml = '<i class="fas fa-robot"></i>';
        }
        
        // Add welcome message back
        const welcomeMessage = `
            <div class="message assistant-message" data-message-id="1">
                <div class="message-avatar">
                    ${avatarHtml}
                </div>
                <div class="message-content">
                    <div class="message-text">
                       Hi there!
                    </div>
                </div>
            </div>
        `;
        messagesContainer.append(welcomeMessage);
        window.messageIdCounter = 2;
    };

    // Add function to get current provider info
    window.getCurrentProvider = function() {
        return {
            config: API_CONFIG
        };
    };
}

// Global functions for message actions
function copyMessage(messageId) {
    const messageElement = $(`[data-message-id="${messageId}"]`);
    const messageText = messageElement.find('.message-text').text();
    
    navigator.clipboard.writeText(messageText).then(function() {
        // Show temporary feedback
        const btn = messageElement.find('.action-btn').first();
        const originalIcon = btn.find('i').attr('class');
        btn.find('i').attr('class', 'fas fa-check');
        setTimeout(() => {
            btn.find('i').attr('class', originalIcon);
        }, 1000);
    });
}

async function regenerateMessage(messageId) {
    const messageElement = $(`[data-message-id="${messageId}"]`);
    const messageText = messageElement.find('.message-text');
    
    // Show loading state
    messageText.html('<i class="fas fa-spinner fa-spin"></i> Regenerating...');
    
    try {
        // Remove the last assistant message from conversation history
        if (window.conversationHistory.length > 0 && window.conversationHistory[window.conversationHistory.length - 1].role === 'assistant') {
            window.conversationHistory.pop();
        }
        
        // Call AI API for a new response
        const customSystemPrompt = localStorage.getItem('customSystemPrompt') || 
            "You are a helpful research assistant for the MIT Media Lab Chat Study. Provide thoughtful, informative responses to help participants with their research questions. Be conversational and engaging while maintaining a professional tone.";

        const requestData = {
            model: API_CONFIG.model,
            max_tokens: API_CONFIG.maxTokens,
            messages: window.conversationHistory,
            system: customSystemPrompt
        };

        const data = await makeAPIRequest(requestData);
        const newResponse = data.content[0].text;
        
        // Update the message text
        messageText.text(newResponse);
        
        // Add the new response to conversation history
        window.conversationHistory.push({
            role: 'assistant',
            content: newResponse
        });

    } catch (error) {
        console.error('Error regenerating message:', error);
        messageText.text(`I'm having trouble regenerating that response right now. Please try again later.`);
    }
}

function likeMessage(messageId) {
    const messageElement = $(`[data-message-id="${messageId}"]`);
    const likeBtn = messageElement.find('.action-btn').last();
    
    // Toggle like state
    if (likeBtn.hasClass('liked')) {
        likeBtn.removeClass('liked');
        likeBtn.find('i').attr('class', 'fas fa-thumbs-up');
    } else {
        likeBtn.addClass('liked');
        likeBtn.find('i').attr('class', 'fas fa-thumbs-up');
        // Show temporary feedback
        likeBtn.find('i').attr('class', 'fas fa-check');
        setTimeout(() => {
            likeBtn.find('i').attr('class', 'fas fa-thumbs-up');
        }, 1000);
    }
}

// Show trait definitions for no-viz condition
function showTraitDefinitionsNoViz() {
    $('#initialPlaceholder').html(`
        <div style="padding: 1.25rem; overflow-y: auto; max-height: 600px;">
            <h4 style="margin-top: 0; margin-bottom: 0.75rem; font-size: 1rem; color: var(--primary-color);">
                <i class="fas fa-info-circle"></i> Personality Traits Reference
            </h4>
            <p style="font-size: 0.75rem; margin-bottom: 1rem; color: var(--text-secondary); line-height: 1.3;">
                Keep these personality dimensions in mind as you interact with your AI companion:
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 0.65rem;">
                <!-- Empathy -->
                <div style="padding: 0.5rem 0.6rem; border-left: 3px solid #4caf50; background: #f8f9fa;">
                    <h5 style="margin: 0 0 0.25rem 0; font-size: 0.8rem; color: #2c3e50;">Empathy</h5>
                    <p style="margin: 0; font-size: 0.7rem; color: #555; line-height: 1.3;">
                        <strong>Unempathetic ↔ Empathetic:</strong> Ranges from lacking understanding of others' feelings to deeply understanding and sharing emotional experiences.
                    </p>
                </div>
                
                <!-- Encouraging -->
                <div style="padding: 0.5rem 0.6rem; border-left: 3px solid #4caf50; background: #f8f9fa;">
                    <h5 style="margin: 0 0 0.25rem 0; font-size: 0.8rem; color: #2c3e50;">Encouraging</h5>
                    <p style="margin: 0; font-size: 0.7rem; color: #555; line-height: 1.3;">
                        <strong>Discouraging ↔ Encouraging:</strong> Ranges from causing loss of confidence to inspiring confidence and hope.
                    </p>
                </div>
                
                <!-- Sociality -->
                <div style="padding: 0.5rem 0.6rem; border-left: 3px solid #4caf50; background: #f8f9fa;">
                    <h5 style="margin: 0 0 0.25rem 0; font-size: 0.8rem; color: #2c3e50;">Sociality</h5>
                    <p style="margin: 0; font-size: 0.7rem; color: #555; line-height: 1.3;">
                        <strong>Antisocial ↔ Social:</strong> Ranges from avoiding social interaction to actively seeking and enjoying it.
                    </p>
                </div>
                
                <!-- Honesty -->
                <div style="padding: 0.5rem 0.6rem; border-left: 3px solid #4caf50; background: #f8f9fa;">
                    <h5 style="margin: 0 0 0.25rem 0; font-size: 0.8rem; color: #2c3e50;">Honesty</h5>
                    <p style="margin: 0; font-size: 0.7rem; color: #555; line-height: 1.3;">
                        <strong>Sycophantic ↔ Honest:</strong> Ranges from excessive flattery to gain favor to being truthful and genuine.
                    </p>
                </div>
                
                <!-- Factual -->
                <div style="padding: 0.5rem 0.6rem; border-left: 3px solid #f44336; background: #f8f9fa;">
                    <h5 style="margin: 0 0 0.25rem 0; font-size: 0.8rem; color: #2c3e50;">Factual Accuracy</h5>
                    <p style="margin: 0; font-size: 0.7rem; color: #555; line-height: 1.3;">
                        <strong>Hallucinatory ↔ Factual:</strong> Ranges from generating false information to providing accurate, verifiable information.
                    </p>
                </div>
                
                <!-- Respectful -->
                <div style="padding: 0.5rem 0.6rem; border-left: 3px solid #f44336; background: #f8f9fa;">
                    <h5 style="margin: 0 0 0.25rem 0; font-size: 0.8rem; color: #2c3e50;">Respectfulness</h5>
                    <p style="margin: 0; font-size: 0.7rem; color: #555; line-height: 1.3;">
                        <strong>Toxic ↔ Respectful:</strong> Ranges from harmful and offensive behavior to showing consideration and courtesy.
                    </p>
                </div>
                
                <!-- Funniness -->
                <div style="padding: 0.5rem 0.6rem; border-left: 3px solid #9e9e9e; background: #f8f9fa;">
                    <h5 style="margin: 0 0 0.25rem 0; font-size: 0.8rem; color: #2c3e50;">Funniness</h5>
                    <p style="margin: 0; font-size: 0.7rem; color: #555; line-height: 1.3;">
                        <strong>Serious ↔ Funny:</strong> Ranges from thoughtful and earnest to using wit and humor to entertain.
                    </p>
                </div>
                
                <!-- Formality -->
                <div style="padding: 0.5rem 0.6rem; border-left: 3px solid #9e9e9e; background: #f8f9fa;">
                    <h5 style="margin: 0 0 0.25rem 0; font-size: 0.8rem; color: #2c3e50;">Formality</h5>
                    <p style="margin: 0; font-size: 0.7rem; color: #555; line-height: 1.3;">
                        <strong>Formal ↔ Casual:</strong> Ranges from following proper conventions and structure to being relaxed and informal.
                    </p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 1rem; padding: 0.75rem; background: #e8f5e9; border-radius: 8px;">
                <i class="fas fa-check-circle" style="color: #4caf50; font-size: 1.5rem; margin-bottom: 0.25rem;"></i>
                <p style="margin: 0; font-weight: 600; font-size: 0.9rem; color: #2c3e50;">Ready to start chatting!</p>
                <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #555;">Click "Start Chat" below to begin.</p>
            </div>
        </div>
    `);
}

// Auto-submit persona check for no-viz condition
async function autoSubmitPersonaCheck(systemPrompt) {
    // Use provided system prompt or get from localStorage
    const promptToUse = systemPrompt || 
        localStorage.getItem('customSystemPrompt') || 
        "You are a helpful research assistant for the MIT Media Lab Chat Study. Provide thoughtful, informative responses to help participants with their research questions. Be conversational and engaging while maintaining a professional tone.";

    // Always enable Start Chat and show trait definitions (API is just for background data collection)
    window.personaCheckedForCurrentPrompt = true;
    $('#startChatBtn').prop('disabled', false);
    showTraitDefinitionsNoViz();

    // Try to call API in background for data collection (don't block user on API errors)
    try {
        const response = await fetch('/api/persona-vector', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system: promptToUse
            })
        });

        if (response.ok) {
            const data = await response.json();
            
            // Log raw persona vector response
            console.log('Persona Vector API Response:', data);
            
            // Save persona vector to history log
            const personaLogPath = studyId + '/participantData/' + firebaseUserId + '/personaVectorLog/' + Date.now();
            await writeRealtimeDatabase(personaLogPath, {
                personaVector: data.content,
                systemPrompt: promptToUse,
                timestamp: new Date().toISOString(),
                condition: 'control_no_visualization'
            });
            
            // Save system prompt to log
            const promptLogPath = studyId + '/participantData/' + firebaseUserId + '/systemPromptLog/' + Date.now();
            await writeRealtimeDatabase(promptLogPath, {
                prompt: promptToUse,
                action: 'auto_check_persona_no_viz',
                timestamp: new Date().toISOString()
            });
        } else {
            const errorText = await response.text();
            console.error('Persona Vector API Error (no-viz):', response.status, errorText);
        }
    } catch (error) {
        console.error('Error calling persona-vector endpoint (no-viz):', error);
    }
}

// Check Persona function - calls persona-vector endpoint
async function checkPersona(systemPrompt) {
    try {
        // Use provided system prompt or get from localStorage
        const promptToUse = systemPrompt || 
            localStorage.getItem('customSystemPrompt') || 
            "You are a helpful research assistant for the MIT Media Lab Chat Study. Provide thoughtful, informative responses to help participants with their research questions. Be conversational and engaging while maintaining a professional tone.";

        // Show loading state
        showPersonaVisualization();
        const personaChart = $('#personaChart');
        personaChart.html('<div style="text-align: center; color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Analyzing persona...</div>');

        // Call the persona-vector endpoint
        const response = await fetch('/api/persona-vector', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system: promptToUse
            })
        });

        if (response.ok) {
            const data = await response.json();
            
            // Log raw persona vector response
            console.log('Persona Vector API Response:', data);
            
            // Save persona vector to history log
            const personaLogPath = studyId + '/participantData/' + firebaseUserId + '/personaVectorLog/' + Date.now();
            await writeRealtimeDatabase(personaLogPath, {
                personaVector: data.content,
                systemPrompt: promptToUse,
                timestamp: new Date().toISOString(),
                condition: 'experimental_with_visualization'
            });
            
            // Render the persona vector bar chart
            renderPersonaChart(data.content);
        } else {
            const errorData = await response.json();
            console.error('Persona Vector Error:', errorData);
            personaChart.html(`<div style="text-align: center; color: var(--error-color);">Error: ${errorData.error}</div>`);
        }
    } catch (error) {
        console.error('Error calling persona-vector endpoint:', error);
        const personaChart = $('#personaChart');
        personaChart.html(`<div style="text-align: center; color: var(--error-color);">Failed to analyze persona: ${error.message}</div>`);
    }
}

// Render persona vector chart (sunburst or bar chart based on URL parameter)
// Uses ?sunburst=true or ?sunburst=false URL parameter (defaults to true if not specified)
function renderPersonaChart(personaData) {
    const personaChart = $('#personaChart');
    
    // Use URL parameter to determine display mode (defaults to true if not specified)
    const useSunburst = typeof useSunburstDisplay === 'function' ? useSunburstDisplay() : true;
    
    if (!personaData || typeof personaData !== 'object') {
        console.error('Invalid persona data:', personaData);
        personaChart.html('<div style="text-align: center; color: var(--text-muted);">No persona data available</div>');
        return;
    }

    // Choose visualization based on config
    if (useSunburst) {
        // Check if D3 is loaded
        if (typeof d3 === 'undefined') {
            console.error('D3.js not loaded! Falling back to bar chart.');
            renderPersonaBarChart(personaData);
            return;
        }
        
        // Create container for sunburst
        personaChart.html('<div id="personaChartSunburst"></div>');
        
        // Create the sunburst visualization
        setTimeout(() => {
            if (typeof createPersonaSunburst === 'function') {
                // Store persona data for toggling
                window.currentPersonaData = personaData;
                createPersonaSunburst(personaData, 'personaChartSunburst', {
                    width: 380,
                    height: 380,
                    innerRadius: 45,
                    animate: true,
                    oppositeLayout: window.sunburstOppositeLayout
                });
            } else {
                console.error('createPersonaSunburst function not found. Falling back to bar chart.');
                // Fallback to bar chart
                renderPersonaBarChart(personaData);
            }
        }, 100);
    } else {
        renderPersonaBarChart(personaData);
    }
}

// Original bar chart rendering (fallback or primary based on USE_SUNBURST config)
function renderPersonaBarChart(personaData) {
    const personaChart = $('#personaChart');
    
    let chartHtml = '<div class="persona-fallback-list">';
    
    for (const [key, value] of Object.entries(personaData)) {
        const barWidth = Math.abs(value) / 2 * 50;
        const barLeft = value < 0 ? (50 - barWidth) : 50;
        const barClass = value < 0 ? 'negative' : 'positive';
        
        chartHtml += `
            <div class="persona-bar-item">
                <div class="persona-bar-label">
                    <span class="persona-bar-name">${key}</span>
                    <span class="persona-bar-value">${value.toFixed(3)}</span>
                </div>
                <div class="persona-bar-track">
                    <div class="persona-bar-background"></div>
                    <div class="persona-bar-center"></div>
                    <div class="persona-bar-fill ${barClass}" style="left: ${barLeft}%; width: ${barWidth}%;"></div>
                </div>
            </div>
        `;
    }
    
    chartHtml += `
        <div class="persona-axis" style="margin-top: 1rem;">
            <div class="persona-axis-tick">-2.0</div>
            <div class="persona-axis-tick">-1.0</div>
            <div class="persona-axis-tick">0.0</div>
            <div class="persona-axis-tick">1.0</div>
            <div class="persona-axis-tick">2.0</div>
        </div>
    </div>`;
    
    personaChart.html(chartHtml);
}

// Test persona with mock data - for development/testing without API calls
function testPersonaWithMockData() {
    const personaChart = $('#personaChart');
    
    // Show loading state
    showPersonaVisualization();
    personaChart.html('<div style="text-align: center; color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Generating test data...</div>');
    
    // Simulate API delay
    setTimeout(() => {
        // HARDCODED test data matching EXACT API format
        // Format: { category: { trait1: value [0,1], trait2: 0 } }
        // One trait has a value, the opposite is always 0
        const mockData = {
            empathy: {
                empathetic: 0.82,      // High empathy
                unempathetic: 0
            },
            encouraging: {
                encouraging: 0.75,     // Quite encouraging
                discouraging: 0
            },
            sociality: {
                social: 0.68,          // Moderately social
                antisocial: 0
            },
            formality: {
                formal: 0,             // Very casual (opposite trait active)
                casual: 0.85
            },
            sycophancy: {
                sycophantic: 0,        // Mostly honest (opposite trait active)
                honest: 0.65
            },
            funniness: {
                funny: 0.78,           // Quite funny
                serious: 0
            },
            hallucination: {
                hallucinatory: 0,      // Very factual/accurate (opposite trait active)
                factual: 0.88
            },
            toxicity: {
                toxic: 0,              // Very respectful (opposite trait active)
                respectful: 0.92
            }
        };
        
        renderPersonaChart(mockData);
    }, 800); // Simulate network delay
}

// ============================================
// PRE-TASK SURVEY FUNCTIONS
// ============================================

// Initialize pre-task survey (called on page load)
function initializePreTaskSurvey() {
    // This is now just a placeholder - actual event listeners are set up
    // in setupSurveyEventListeners() after HTML is inserted
}

// Set up survey event listeners (called after HTML is inserted)
function setupSurveyEventListeners() {
    const phase1 = $('#surveyPhase1');
    const phase2 = $('#surveyPhase2');
    const phase3 = $('#surveyPhase3');
    
    const phase1ProceedBtn = $('#phase1ProceedBtn');
    const phase2ProceedBtn = $('#phase2ProceedBtn');
    const phase3ProceedBtn = $('#phase3ProceedBtn');
    
    // Phase 1: Listen to radio button changes
    $('input[name="phase1_q1"], input[name="phase1_q2"]').on('change', function() {
        const q1Answered = $('input[name="phase1_q1"]:checked').length > 0;
        const q2Answered = $('input[name="phase1_q2"]:checked').length > 0;
        const bothAnswered = q1Answered && q2Answered;
        phase1ProceedBtn.prop('disabled', !bothAnswered);
    });
    
    // Phase 1 Proceed button
    phase1ProceedBtn.on('click', async function() {
        
        // Save Phase 1 data to Firebase
        await savePhase1Data();
        
        phase1.hide();
        phase2.show();
    });
    
    // Phase 2: Listen to all trait radio buttons
    const traitNames = [
        'trait_empathy',
        'trait_encouraging',
        'trait_sociality',
        'trait_honesty',
        'trait_hallucination',
        'trait_toxicity',
        'trait_funniness',
        'trait_formality'
    ];
    
    traitNames.forEach(traitName => {
        $(`input[name="${traitName}"]`).on('change', validatePhase2);
    });
    
    function validatePhase2() {
        const allAnswered = traitNames.every(traitName => {
            return $(`input[name="${traitName}"]:checked`).length > 0;
        });
        phase2ProceedBtn.prop('disabled', !allAnswered);
    }
    
    // Phase 2 Proceed button
    phase2ProceedBtn.on('click', async function() {
        // Save Phase 2 data to Firebase
        await savePhase2Data();
        
        phase2.hide();
        phase3.show();
    });
    
    // Phase 3: Listen to trust question
    $('input[name="phase3_trust"]').on('change', function() {
        const trustAnswered = $('input[name="phase3_trust"]:checked').length > 0;
        phase3ProceedBtn.prop('disabled', !trustAnswered);
    });
    
    // Phase 3 Proceed button - save data and close
    phase3ProceedBtn.on('click', async function() {
        // Save Phase 3 data to Firebase
        await savePhase3Data();
        
        closePreTaskSurvey();
    });
}

// Render survey inline in the right column
function renderInlineSurvey() {
    // Show survey instruction modal
    window.showInstructionModal('survey');
    
    // Get survey phases from hidden source
    const surveySource = $('#surveyPhasesSource .survey-phases-wrapper');
    
    if (surveySource.length > 0) {
        const surveyHTML = surveySource.html();
        $('#surveyPhasesContainer').html(surveyHTML);
        
        // NOW set up event listeners after HTML is in place
        setupSurveyEventListeners();
    } else {
        console.error('Survey source not found!');
    }
    
    // Show survey container
    $('#preTaskSurveyContainer').show();
    
    // Reset to phase 1
    setTimeout(() => {
        $('#surveyPhase1').show();
        $('#surveyPhase2').hide();
        $('#surveyPhase3').hide();
    }, 100);
}

// Close/hide inline survey
function closePreTaskSurvey() {
    // Hide survey container
    $('#preTaskSurveyContainer').hide();
    
    // Mark survey as completed
    localStorage.setItem('preTaskSurveyCompleted', 'true');
    
    // Enable interface buttons now that survey is complete
    enableInterfaceButtons();
    
    // Check visualization condition to determine next step
    const visualizationCondition = window.experimentSettings.visualizationCondition;
    
    // Log the condition being applied after survey
    console.log('=== POST-SURVEY: APPLYING CONDITION ===');
    console.log('Condition:', visualizationCondition === 0 ? 'CONTROL (no-viz)' : 'EXPERIMENTAL (viz)');
    console.log('======================================');
    
    if (visualizationCondition === 0) {
        // NO-VIZ CONDITION: Auto-submit persona check
        // Show placeholder while processing
        $('#initialPlaceholder').show();
        $('#initialPlaceholder').html(`
            <div style="text-align: center; color: var(--text-muted); padding: 3rem 2rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="margin: 0; font-size: 1.1rem;">Processing your system prompt...</p>
            </div>
        `);
        
        // Get the system prompt and auto-submit
        const systemPrompt = $('#systemPromptInput').val();
        autoSubmitPersonaCheck(systemPrompt);
        
    } else {
        // VIZ CONDITION: Show Check Persona buttons
        // Show placeholder in persona area with instructions
        $('#personaVisualization').hide();
        $('#initialPlaceholder').show();
        $('#initialPlaceholder').html(`
            <div style="text-align: center; color: var(--text-muted); padding: 3rem 2rem;">
                <i class="fas fa-chart-bar" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p style="margin: 0; font-size: 1.1rem;">Click "Check Persona" to analyze and enable chat</p>
            </div>
        `);
        
        // But keep Start Chat disabled until persona is checked
        $('#startChatBtn').prop('disabled', true);
        
        // Show Check Persona and Test Persona buttons
        $('.persona-check-buttons').show();
    }
}

// Disable interface buttons (called before survey)
function disableInterfaceButtons() {
    $('#startChatBtn').prop('disabled', true);
    $('#resetConfig').prop('disabled', true);
    $('#checkPersonaBtn').prop('disabled', true);
    $('#testPersonaBtn').prop('disabled', true);
    // Submit Prompt button state is controlled by character counter
    // Don't override it here - let updateCharacterCounter() handle it
}

// Enable interface buttons (called after survey)
function enableInterfaceButtons() {
    $('#startChatBtn').prop('disabled', false);
    $('#resetConfig').prop('disabled', false);
    $('#checkPersonaBtn').prop('disabled', false);
    $('#testPersonaBtn').prop('disabled', false);
    // Submit Prompt button already hidden/disabled after use
}

// Save Phase 1 data to Firebase
async function savePhase1Data() {
    try {
        const timestamp = new Date().toISOString();
        const systemPrompt = $('#systemPromptInput').val();
        
        // Collect Phase 1 responses
        const phase1Data = {
            "How well could you predict unintended behaviors from your system prompt?": parseInt($('input[name="phase1_q1"]:checked').val()),
            "How well could you predict negative unintended behaviors from your system prompt?": parseInt($('input[name="phase1_q2"]:checked').val())
        };
        
        // Save to Firebase
        const basePath = `${studyId}/participantData/${firebaseUserId}/preTaskSurvey`;
        const phase1WriteData = {
            responses: phase1Data,
            timestamp: timestamp
        };
        await writeRealtimeDatabase(`${basePath}/phase1`, phase1WriteData);
        
        // Save metadata on first phase
        const metadataWriteData = {
            system_prompt: systemPrompt,
            start_timestamp: timestamp
        };
        await writeRealtimeDatabase(`${basePath}/metadata`, metadataWriteData);
        
    } catch (error) {
        console.error('❌ Error saving Phase 1 data:', error);
    }
}

// Save Phase 2 data to Firebase
async function savePhase2Data() {
    try {
        const timestamp = new Date().toISOString();
        
        // Collect Phase 2 responses (trait predictions)
        const phase2Data = {
            "Empathy": parseInt($('input[name="trait_empathy"]:checked').val()),
            "Encouraging": parseInt($('input[name="trait_encouraging"]:checked').val()),
            "Sociality": parseInt($('input[name="trait_sociality"]:checked').val()),
            "Honesty": parseInt($('input[name="trait_honesty"]:checked').val()),
            "Hallucination": parseInt($('input[name="trait_hallucination"]:checked').val()),
            "Toxicity": parseInt($('input[name="trait_toxicity"]:checked').val()),
            "Funniness": parseInt($('input[name="trait_funniness"]:checked').val()),
            "Formality": parseInt($('input[name="trait_formality"]:checked').val())
        };
        
        // Save to Firebase
        const basePath = `${studyId}/participantData/${firebaseUserId}/preTaskSurvey`;
        const phase2WriteData = {
            responses: phase2Data,
            timestamp: timestamp
        };
        await writeRealtimeDatabase(`${basePath}/phase2`, phase2WriteData);
        
    } catch (error) {
        console.error('❌ Error saving Phase 2 data:', error);
    }
}

// Save Phase 3 data to Firebase
async function savePhase3Data() {
    try {
        const timestamp = new Date().toISOString();
        
        // Collect Phase 3 response
        const phase3Data = {
            "Given the relevant background about unintended model behaviors, how much do you trust this model?": parseInt($('input[name="phase3_trust"]:checked').val())
        };
        
        // Save to Firebase
        const basePath = `${studyId}/participantData/${firebaseUserId}/preTaskSurvey`;
        const phase3WriteData = {
            responses: phase3Data,
            timestamp: timestamp
        };
        await writeRealtimeDatabase(`${basePath}/phase3`, phase3WriteData);
        
        // Update metadata with completion time
        await writeRealtimeDatabase(`${basePath}/metadata/completion_timestamp`, timestamp);
        await writeRealtimeDatabase(`${basePath}/metadata/completion_time`, Date.now());
        
        // Mark survey as completed
        localStorage.setItem('preTaskSurveyCompleted', 'true');
        
    } catch (error) {
        console.error('❌ Error saving Phase 3 data:', error);
    }
}

// ============================================
// TIMER FUNCTIONS
// ============================================

// Start the timer
async function startTimer() {
    if (window.timerStartTime !== null) {
        return;
    }
    
    window.timerStartTime = Date.now();
    const startTimeISO = new Date().toISOString();
    
    // Save timer start to Firebase
    const timerPath = studyId + '/participantData/' + firebaseUserId + '/timer';
    await writeRealtimeDatabase(timerPath + '/startTime', startTimeISO);
    await writeRealtimeDatabase(timerPath + '/duration', window.timerDuration);
    
    // Show timer display
    $('#timerDisplay').show();
    
    // Update timer every second
    window.timerInterval = setInterval(updateTimer, 1000);
    
    // Initial update
    updateTimer();
}

// Update timer display
function updateTimer() {
    if (window.timerStartTime === null || window.timerExpired) {
        return;
    }
    
    const elapsed = Math.floor((Date.now() - window.timerStartTime) / 1000);
    const remaining = Math.max(0, window.timerDuration - elapsed);
    
    // Format time as M:SS
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    $('#timerText').text(timeString);
    
    // Check if timer has expired
    if (remaining <= 0 && !window.timerExpired) {
        timerExpired();
    }
}

// Timer has expired
async function timerExpired() {
    window.timerExpired = true;
    
    // Stop the interval
    if (window.timerInterval) {
        clearInterval(window.timerInterval);
        window.timerInterval = null;
    }
    
    // Save timer end to Firebase
    const endTimeISO = new Date().toISOString();
    const timerPath = studyId + '/participantData/' + firebaseUserId + '/timer';
    await writeRealtimeDatabase(timerPath + '/endTime', endTimeISO);
    
    // Show post-survey modal
    showPostSurvey();
}

// ============================================
// POST-SURVEY FUNCTIONS
// ============================================

// Show post-survey modal
function showPostSurvey() {
    // Skip post-survey in demo mode
    const isDemoMode = window.experimentSettings.demo;
    
    if (isDemoMode) {
        console.log('🎬 Demo mode: Skipping post-task survey');
        // In demo mode, just show a completion message or allow continued chatting
        // For now, just redirect to completion page
        completePostSurvey();
        return;
    }
    
    // Disable chat interface
    $('#messageInput').prop('disabled', true);
    $('#sendBtn').prop('disabled', true);
    $('#attachBtn').prop('disabled', true);
    $('#imageBtn').prop('disabled', true);
    $('#backToConfigBtn').prop('disabled', true);
    
    // Show/hide viz-specific questions based on condition
    const visualizationCondition = window.experimentSettings.visualizationCondition;
    if (visualizationCondition === 1) {
        // Viz condition: show questions 5 and 6
        $('#post_q5_container').show();
        $('#post_q6_container').show();
    } else {
        // Control condition: hide and clear questions 5 and 6
        $('#post_q5_container').hide();
        $('#post_q6_container').hide();
        $('input[name="post_q5"]').prop('checked', false);
        $('input[name="post_q6"]').prop('checked', false);
    }
    
    // Show modal
    $('#postSurveyModal').fadeIn(300);
    
    // Initialize post-survey event listeners
    initializePostSurvey();
}

// Initialize post-survey event listeners
function initializePostSurvey() {
    
    const visualizationCondition = window.experimentSettings.visualizationCondition;
    
    // Phase 1: Listen to radio button changes
    $('input[name="post_q1"], input[name="post_q2"], input[name="post_q3"], input[name="post_q4"], input[name="post_q5"], input[name="post_q6"]').on('change', function() {
        const q1Answered = $('input[name="post_q1"]:checked').length > 0;
        const q2Answered = $('input[name="post_q2"]:checked').length > 0;
        const q3Answered = $('input[name="post_q3"]:checked').length > 0;
        const q4Answered = $('input[name="post_q4"]:checked').length > 0;
        
        let allAnswered = q1Answered && q2Answered && q3Answered && q4Answered;
        
        // For viz condition, also require q5 and q6
        if (visualizationCondition === 1) {
            const q5Answered = $('input[name="post_q5"]:checked').length > 0;
            const q6Answered = $('input[name="post_q6"]:checked').length > 0;
            allAnswered = allAnswered && q5Answered && q6Answered;
        }
        
        $('#postPhase1ProceedBtn').prop('disabled', !allAnswered);
    });
    
    // Phase 1 Proceed button
    $('#postPhase1ProceedBtn').off('click').on('click', async function() {
        await savePostPhase1Data();
        $('#postSurveyPhase1').hide();
        $('#postSurveyPhase2').show();
    });
    
    // Phase 2: Listen to textarea input
    $('#postOpenEndedResponse').on('input', function() {
        const hasText = $(this).val().trim().length > 0;
        $('#postPhase2SubmitBtn').prop('disabled', !hasText);
    });
    
    // Phase 2 Back button
    $('#postPhase2BackBtn').off('click').on('click', function() {
        $('#postSurveyPhase2').hide();
        $('#postSurveyPhase1').show();
    });
    
    // Phase 2 Submit button
    $('#postPhase2SubmitBtn').off('click').on('click', async function() {
        await savePostPhase2Data();
        completePostSurvey();
    });
}

// Save Phase 1 data from post-survey
async function savePostPhase1Data() {
    try {
        const timestamp = new Date().toISOString();
        const visualizationCondition = window.experimentSettings.visualizationCondition;
        
        const phase1Data = {
            "How well could you predict unintended behaviors from your system prompt?": parseInt($('input[name="post_q1"]:checked').val()),
            "How well could you predict negative unintended behaviors from your system prompt?": parseInt($('input[name="post_q2"]:checked').val()),
            "Given the {relevant background abt unintended model behaviors}, how much do you trust this model?": parseInt($('input[name="post_q3"]:checked').val()),
            "Did you arrive at your desired character?": parseInt($('input[name="post_q4"]:checked').val())
        };
        
        // Add viz-specific questions if in experimental condition
        if (visualizationCondition === 1) {
            phase1Data["Did the visualization help you understand model behavior?"] = parseInt($('input[name="post_q5"]:checked').val());
            phase1Data["Would you like to see this visualization again in future interactions?"] = parseInt($('input[name="post_q6"]:checked').val());
        }
        
        const basePath = `${studyId}/participantData/${firebaseUserId}/postTaskSurvey`;
        const postPhase1WriteData = {
            responses: phase1Data,
            timestamp: timestamp,
            condition: visualizationCondition === 0 ? 'control' : 'experimental'
        };
        await writeRealtimeDatabase(`${basePath}/phase1`, postPhase1WriteData);
        
    } catch (error) {
        console.error('❌ Error saving post-survey Phase 1 data:', error);
    }
}

// Save Phase 2 data from post-survey
async function savePostPhase2Data() {
    try {
        const timestamp = new Date().toISOString();
        
        const phase2Data = {
            "openEndedFeedback": $('#postOpenEndedResponse').val().trim()
        };
        
        const basePath = `${studyId}/participantData/${firebaseUserId}/postTaskSurvey`;
        const postPhase2WriteData = {
            responses: phase2Data,
            timestamp: timestamp
        };
        await writeRealtimeDatabase(`${basePath}/phase2`, postPhase2WriteData);
        
        // Update metadata with completion time
        await writeRealtimeDatabase(`${basePath}/metadata/completion_timestamp`, timestamp);
        await writeRealtimeDatabase(`${basePath}/metadata/completion_time`, Date.now());
        
    } catch (error) {
        console.error('❌ Error saving post-survey Phase 2 data:', error);
    }
}

// Complete post-survey and redirect to completion page
function completePostSurvey() {
    // Hide modal
    $('#postSurveyModal').fadeOut(300);
    
    // Redirect to completion page after a short delay
    setTimeout(function() {
        // Load completion page into the main content area with cache-busting
        $('#task-main-content').load('html/complete.html?v=' + Date.now());
        
        // Or redirect to completion page
        // window.location.href = 'html/complete.html';
    }, 500);
}

/******************************************************************************
    INSTRUCTION MODALS - SIMPLE IMPLEMENTATION
******************************************************************************/

// Show instruction modal if not already shown
window.showInstructionModal = function(type) {
    // Demo mode: Keep certain helpful modals, skip survey modal
    const isDemoMode = window.experimentSettings.demo;
    const skipSurvey = window.experimentSettings.skipSurvey;
    
    // Define which modals to keep in demo mode
    const demoModeKeptModals = ['avatar', 'prompt', 'chat', 'visualization', 'promptRefinement'];
    
    if (isDemoMode) {
        // In demo mode, skip the survey instruction modal but keep others
        if (type === 'survey') {
            // Mark as shown so it won't appear later
            const instructionsShown = JSON.parse(sessionStorage.getItem('instructionsShown') || '{}');
            instructionsShown[type] = true;
            sessionStorage.setItem('instructionsShown', JSON.stringify(instructionsShown));
            return;
        }
        // Allow other modals to proceed normally
    } else if (skipSurvey) {
        // Original skipSurvey behavior: skip all modals
        const instructionsShown = JSON.parse(sessionStorage.getItem('instructionsShown') || '{}');
        instructionsShown[type] = true;
        sessionStorage.setItem('instructionsShown', JSON.stringify(instructionsShown));
        return;
    }
    
    // Check if already shown
    const instructionsShown = JSON.parse(sessionStorage.getItem('instructionsShown') || '{}');
    if (instructionsShown[type]) {
        return;
    }
    
    // Show the modal
    const modalId = type + 'InstructionModal';
    $('#' + modalId).fadeIn(300);
};

// Dismiss instruction modal
window.dismissInstructionModal = function(type) {
    // Hide the modal
    const modalId = type + 'InstructionModal';
    $('#' + modalId).fadeOut(300);
    
    // Mark as shown
    const instructionsShown = JSON.parse(sessionStorage.getItem('instructionsShown') || '{}');
    instructionsShown[type] = true;
    sessionStorage.setItem('instructionsShown', JSON.stringify(instructionsShown));
};

// Show visualization explanation modal
window.showVisualizationExplanation = function(forceShow = false) {
    // Don't show in no-viz condition
    const visualizationCondition = window.experimentSettings.visualizationCondition;
    if (visualizationCondition === 0) {
        return;
    }
    
    // Check if already shown (unless forced via ? button)
    const hasShown = sessionStorage.getItem('visualizationExplanationShown');
    
    if (hasShown && !forceShow) {
        return;
    }
    
    $('#visualizationExplanationModal').fadeIn(600);
    
    // Mark as shown
    if (!hasShown) {
        sessionStorage.setItem('visualizationExplanationShown', 'true');
    }
};

// Dismiss visualization explanation modal
window.dismissVisualizationExplanation = function() {
    $('#visualizationExplanationModal').fadeOut(400);
};

// Show prompt refinement reminder modal
window.showPromptRefinementModal = function() {
    // Check if already shown
    const hasShown = sessionStorage.getItem('promptRefinementShown');
    
    if (hasShown) {
        return;
    }
    
    // Update text based on visualization condition
    const visualizationCondition = window.experimentSettings.visualizationCondition;
    const modalContent = $('#promptRefinementModal .instruction-modal-content');
    
    if (visualizationCondition === 0) {
        // NO-VIZ: Remove visualization mention
        modalContent.find('p').eq(1).html('<strong>How to refine:</strong> Click "Back to Configuration" to adjust your prompt and test the updated behavior.');
    }
    
    $('#promptRefinementModal').fadeIn(600);
    
    // Mark as shown
    sessionStorage.setItem('promptRefinementShown', 'true');
};

// Dismiss prompt refinement modal
window.dismissPromptRefinementModal = function() {
    $('#promptRefinementModal').fadeOut(400);
};
