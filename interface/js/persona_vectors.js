// Persona Vector Ratings Request JavaScript
let personaVectorRequestInProgress = false;

/**
 * Gets URL parameter value
 * @param {string} name - Parameter name
 * @returns {string|null} - Parameter value or null if not found
 */
function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Todo items:
// Okay, we're going to adjust sunburst visualization to these parameters
// 1) We should display all the traits original lables and their antonyms.
// 2) We should expect that the values we get are between 0 and 1 from the api query. 
// 3) We should add labels that are peripheral to the visualization.

/**
 * Determines if sunburst display should be used based on URL parameter
 * URL parameter: ?sunburst=true or ?sunburst=false
 * Default: true (if parameter not specified)
 * @returns {boolean}
 */
function useSunburstDisplay() {
    const sunburstParam = getURLParameter('sunburst');
    if (sunburstParam === null) {
        return true; // Default to true
    }
    return sunburstParam.toLowerCase() === 'true' || sunburstParam === '1';
}

$(document).ready(function() {
    // Add button to trigger persona vector ratings request
    const personaVectorBtn = $('#personaVectorBtn'); // You'll need to add this button to your HTML
    
    personaVectorBtn.on('click', function() {
        if (!personaVectorRequestInProgress) {
            requestPersonaVectorRatings();
        }
    });
});

// Function to request persona vector ratings based on system prompt
async function requestPersonaVectorRatings() {
    if (personaVectorRequestInProgress) {
        console.log('Persona vector request already in progress');
        return;
    }

    personaVectorRequestInProgress = true;

    try {
        // Get the system prompt from the conversation
        // This assumes you have the system prompt available
        const systemPrompt = "You are a helpful research assistant for the MIT Media Lab Chat Study. Provide thoughtful, informative responses to help participants with their research questions. Be conversational and engaging while maintaining a professional tone.";

        const requestData = {
            model: API_CONFIG.model,
            max_tokens: API_CONFIG.maxTokens,
            messages: conversationHistory,
            system: systemPrompt
        };

        // Call your Modal API endpoint for persona vector ratings
        const response = await fetch(API_CONFIG.personaVectorEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_CONFIG.apiKey
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Persona Vector API Response:', data);
        
        // Process the persona vector ratings
        processPersonaVectorRatings(data);

    } catch (error) {
        console.error('Error requesting persona vector ratings:', error);
        
        let errorMessage;
        if (error.message.includes('API key not found')) {
            errorMessage = 'API key not found. Please check your configuration.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your connection.';
        } else {
            errorMessage = `Error: ${error.message}`;
        }
        
        displayPersonaVectorError(errorMessage);
    } finally {
        personaVectorRequestInProgress = false;
    }
}

// Function to process the persona vector ratings response
function processPersonaVectorRatings(data) {
    // Expected response format:
    // {
    //     "persona_vector_ratings": {
    //         "value1": 0.75,
    //         "value2": 0.42,
    //         "value3": 0.88,
    //         "value4": 0.61,
    //         "value5": 0.33
    //     },
    //     "system_prompt": "The system prompt that was used"
    // }

    const personaVectorRatings = data.persona_vector_ratings;
    const systemPrompt = data.system_prompt;

    // Display the persona vector ratings
    displayPersonaVectorRatings(personaVectorRatings, systemPrompt);
}

// Function to display persona vector ratings in the UI
function displayPersonaVectorRatings(personaVectorRatings, systemPrompt) {
    // Create a display container if it doesn't exist
    let personaVectorDisplay = $('#personaVectorDisplay');
    
    if (personaVectorDisplay.length === 0) {
        $('body').append('<div id="personaVectorDisplay"></div>');
        personaVectorDisplay = $('#personaVectorDisplay');
    }

    // Build the HTML to display the persona vector ratings
    const useSunburst = useSunburstDisplay();
    const sunburstHtml = useSunburst ? '<div id="personaSunburstContainer" class="persona-sunburst-container"></div>' : '';
    const barChartHtml = !useSunburst ? '<div id="personaBarChartContainer"></div>' : '';
    
    const personaVectorHtml = `
        <div class="persona-vector-results">
            <div class="persona-vector-header">
                <h3>Persona Vector Ratings</h3>
                <button class="close-btn" onclick="closePersonaVectorDisplay()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            ${sunburstHtml}
            ${barChartHtml}
            
            <div class="persona-vector-details">
                <h4>${useSunburst ? 'Detailed Values:' : 'Values:'}</h4>
                <div class="persona-vector-ratings">
                    ${Object.entries(personaVectorRatings).map(([key, value]) => `
                        <div class="persona-vector-item">
                            <span class="persona-vector-label">${formatLabel(key)}:</span>
                            <span class="persona-vector-value">${value.toFixed(3)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="system-prompt-used">
                <strong>System Prompt:</strong>
                <p>${systemPrompt}</p>
            </div>
        </div>
    `;

    personaVectorDisplay.html(personaVectorHtml);
    personaVectorDisplay.show();

    // Create the sunburst visualization if enabled
    if (useSunburst) {
        setTimeout(() => {
            if (typeof createPersonaSunburst === 'function') {
                createPersonaSunburst(personaVectorRatings, 'personaSunburstContainer', {
                    width: 500,
                    height: 500,
                    innerRadius: 60,
                    animate: true
                });
            } else {
                console.error('createPersonaSunburst function not found. Make sure persona-sunburst.js is loaded.');
            }
        }, 100);
    } else {
        // Render the bar chart when sunburst is disabled
        renderPersonaVectorBarChart(personaVectorRatings);
    }
}

// Function to render bar chart visualization (used when sunburst is disabled)
function renderPersonaVectorBarChart(personaData) {
    const container = $('#personaBarChartContainer');
    
    if (container.length === 0) {
        console.error('Bar chart container not found');
        return;
    }
    
    let chartHtml = '<div class="persona-bar-chart">';
    
    for (const [key, value] of Object.entries(personaData)) {
        // Calculate bar width and position
        // Values typically range from -2 to 2, so we normalize to 0-100%
        const normalizedValue = Math.max(-2, Math.min(2, value)); // Clamp to [-2, 2]
        const barWidth = Math.abs(normalizedValue) / 2 * 50; // Map to 0-50%
        const barLeft = normalizedValue < 0 ? (50 - barWidth) : 50;
        const barClass = normalizedValue < 0 ? 'negative' : 'positive';
        
        chartHtml += `
            <div class="persona-bar-item">
                <div class="persona-bar-label">
                    <span class="persona-bar-name">${formatLabel(key)}</span>
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
    
    // Add axis labels
    chartHtml += `
        <div class="persona-axis" style="margin-top: 1rem;">
            <div class="persona-axis-tick">-2.0</div>
            <div class="persona-axis-tick">-1.0</div>
            <div class="persona-axis-tick">0.0</div>
            <div class="persona-axis-tick">1.0</div>
            <div class="persona-axis-tick">2.0</div>
        </div>
    </div>`;
    
    container.html(chartHtml);
}

// Helper function to format labels
function formatLabel(key) {
    return key.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Function to display error messages
function displayPersonaVectorError(errorMessage) {
    let personaVectorDisplay = $('#personaVectorDisplay');
    
    if (personaVectorDisplay.length === 0) {
        $('body').append('<div id="personaVectorDisplay"></div>');
        personaVectorDisplay = $('#personaVectorDisplay');
    }

    const errorHtml = `
        <div class="persona-vector-results error">
            <h3>Error</h3>
            <p>${errorMessage}</p>
            <button class="close-btn" onclick="closePersonaVectorDisplay()">Close</button>
        </div>
    `;

    personaVectorDisplay.html(errorHtml);
    personaVectorDisplay.show();
}

// Function to close the persona vector display
function closePersonaVectorDisplay() {
    $('#personaVectorDisplay').hide();
}

// Alternative: If you want to extract system prompt from the current conversation
function getCurrentSystemPrompt() {
    // This would extract the system prompt that's being used in the chat
    // You might store this as a global variable when the chat initializes
    return "You are a helpful research assistant for the MIT Media Lab Chat Study. Provide thoughtful, informative responses to help participants with their research questions. Be conversational and engaging while maintaining a professional tone.";
}