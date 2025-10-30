/*
instructions.js

    Instructions Page Functionality
    
    Handles navigation between instruction phases and progression to main experiment
*/

/******************************************************************************
    RUN ON PAGE LOAD
******************************************************************************/
$(document).ready(function() {
    console.log("Instructions page loaded");

    /******************************************************************************
        PHASE NAVIGATION STATE
    ******************************************************************************/
    
    let currentPhase = 0;
    const totalPhases = 7; // 0-6 (added avatar selection phase)
    const completedPhases = new Set();
    
    // Check visualization condition
    const visualizationCondition = window.experimentSettings ? window.experimentSettings.visualizationCondition : 0;
    const phasesToSkip = visualizationCondition === 0 ? [4] : []; // Skip phase 4 (Persona Visualization) in no-viz
    console.log('📖 Instructions condition:', visualizationCondition === 0 ? 'CONTROL (no-viz)' : 'EXPERIMENTAL (viz)');
    if (phasesToSkip.length > 0) {
        console.log('⏭️ Skipping phases:', phasesToSkip);
    }

    /******************************************************************************
        NAVIGATION FUNCTIONS
    ******************************************************************************/
    
    function updatePhaseDisplay() {
        /*
            Update which phase is visible and update UI elements
        */
        // Hide all phases
        $('.instruction-phase').removeClass('active');
        
        // Hide phases that should be skipped
        phasesToSkip.forEach(phaseNum => {
            $(`.instruction-phase[data-phase="${phaseNum}"]`).hide();
        });
        
        // Show current phase
        $(`.instruction-phase[data-phase="${currentPhase}"]`).addClass('active');
        
        // Update progress dots
        $('.progress-dot').each(function() {
            const dotPhase = parseInt($(this).attr('data-phase'));
            $(this).removeClass('active completed');
            
            if (dotPhase === currentPhase) {
                $(this).addClass('active');
            } else if (completedPhases.has(dotPhase)) {
                $(this).addClass('completed');
            }
        });
        
            // Update navigation buttons
        // Always show "Next" button (Phase 0 will proceed to task)
        $('#next-phase-btn').show();
        $('#proceed-to-task').hide();
        
        // Scroll to top of page
        window.scrollTo(0, 0);
    }
    
    function goToNextPhase() {
        /*
            Navigate to next instruction phase.
            After Phase 0 (overview), proceed directly to task.
        */
        if (currentPhase === 0) {
            // After overview, go directly to the experiment
            proceedToTask();
        } else if (currentPhase < totalPhases - 1) {
            completedPhases.add(currentPhase);
            currentPhase++;
            
            // Skip phases that should be skipped
            while (phasesToSkip.includes(currentPhase) && currentPhase < totalPhases - 1) {
                console.log(`⏭️ Skipping phase ${currentPhase}`);
                completedPhases.add(currentPhase);
                currentPhase++;
            }
            
            updatePhaseDisplay();
            
            console.log(`Advanced to phase ${currentPhase}`);
        }
    }
    
    
    function proceedToTask() {
        /*
            Navigate to main experiment task.
            
            Hide instructions page and show the chat interface.
        */
        // Mark all phases as completed
        for (let i = 0; i < totalPhases; i++) {
            completedPhases.add(i);
        }
        
        // Hide Instructions
        // $("#instructions-header").attr("hidden", true);
        $("#instructions-main-content").attr("hidden", true);
        
        // Show Task
        $("#task-header").attr("hidden", false);
        $("#task-main-content").attr("hidden", false);
        
        // Load Chat Interface with cache-busting
        $('#task-main-content').load('html/chat-content.html?v=' + Date.now());
        
        // Log completion
        console.log("User completed instructions and proceeded to main task at:", new Date().toISOString());
        console.log("Time spent on instructions:", Math.round((Date.now() - instructionsStartTime) / 1000), "seconds");
    }

    /******************************************************************************
        EVENT LISTENERS
    ******************************************************************************/
    
    $('#next-phase-btn').click(goToNextPhase);
    $('#proceed-to-task').click(proceedToTask);
    
    // Optional: Track time spent on instructions page
    const instructionsStartTime = Date.now();
    
    // Initialize display
    updatePhaseDisplay();
    
    // Keyboard navigation disabled to prevent accidental advancement
    console.log('✅ Instructions.js initialized - Phase 0 only mode');
});