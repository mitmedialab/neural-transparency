/*
complete.js

Complete Page JS file (metadata and functionality).

This file should contain all variables and functions needed for
the end of the experiment.
*/

/******************************************************************************
    IMPORTS

        Import all FirebaseJS functionality.
        Note: Firebase is already initialized in chat.js, we retrieve the userId
        from sessionStorage to avoid re-initialization conflicts.
******************************************************************************/
/// Importing functions from the Firebase Psych library
import {
    writeRealtimeDatabase
} from "./firebasepsych1.0.js";

// Retrieve firebaseUserId from sessionStorage (set by chat.js during initialization)
const firebaseUserId = sessionStorage.getItem('firebaseUserId') || 'uid-not-found';

console.log("Database and firebaseuid: ", firebaseUserId);

if (firebaseUserId === 'uid-not-found') {
    console.warn('⚠️ Firebase UserId not found in sessionStorage. This may cause data saving issues.');
}

/******************************************************************************
    DEBUG

        For now we are in DEBUG mode. Turn off DEBUG mode in js/metadata.js.
******************************************************************************/
//      Turn ON/OFF Debug Mode
var DEBUG_COMPLETE = false;


/******************************************************************************
    VARIABLES

        All metadata variables that are relevant to the complete page.
******************************************************************************/
// Study ID
const studyId = 'chat-study';

// Database Path
var COMPLETE_DB_PATH = studyId + '/participantData/' + firebaseUserId + '/userFeedback';


/******************************************************************************
    RUN ON PAGE LOAD

        Run the following functions as soon as the page is loaded. This will
        render the complete.html page appropriately.
******************************************************************************/
$(document).ready(function (){
    /******************************************************************************
        FUNCTIONALITY

            All functions that will be used for the complete page.
    ******************************************************************************/
    function replaceClass(element, remove, add) {
        /*
            Use jQuery to replace the class of the given element.
        */

        $(element).removeClass(remove);
        $(element).addClass(add);
    };
    
    function copyCode() {
        /*
            Copy the Unique Code to the clipboard.

            Use this function if you will be providing a unique code for
            participants to submit when redirected to Prolific or MTurk.
        */
        var temp = $("<input>");
        $("body").append(temp);
        temp.val($('#code').val()).select();
        document.execCommand("copy");
        alert("Copied the code: " + temp.val());
        temp.remove();
    };

    function redirectToProlific() {
        /*
            Redirect participants back to prolific after the study.
        */
        var restart;
        if (confirm("If you click 'OK', you will be redirected to Prolific. If you click 'Cancel' you will stay on this page.")) {
            restart = true;
        } else {
            restart = false;
        }
        
        // The redirect URL should be back to Prolific
        if (restart) {
            if (DEBUG_COMPLETE){
                // Debug redirect URL
                window.location.replace("https://app.prolific.com/submissions/complete?cc=DEBUG");
            } else {
                // Production Prolific redirect URL
                window.location.replace("https://app.prolific.com/submissions/complete?cc=C10PV7GP");
            }
        }
    }

    function feedbackToSubmit() {
        /*
            Determine if there is feedback to submit or not.

            If there is then the button is enabled.
            If there isn't then the button is disabled.

        */
        let content = $("#user-feedback-text").val().trim();
        $('#user-feedback-button').prop('disabled', content === '');
    }

    function submitFeedback() {
        /*
            Submit user feedback.
        */
        const feedbackData = {
            "feedbackTime": Date().toString(),
            "feedbackText": $('#user-feedback-text').val()
        };
        
        console.log('📝 Writing user feedback to Firebase:', COMPLETE_DB_PATH, feedbackData);
        writeRealtimeDatabase(COMPLETE_DB_PATH, feedbackData);
        console.log('✅ User feedback write initiated');

        replaceClass('#user-feedback-button', "btn-secondary", "btn-primary");
    };

    //  Copy Unique Code to Clipboard / Redirect to Prolific
    $('#unique-code-copy-button').click(redirectToProlific);

    //  Determine if there is User Feedback to be Submitted
    $('#user-feedback-text').on('keyup', feedbackToSubmit);

    //  Submit User Feedback
    $('#user-feedback-button').click(submitFeedback);

    // Write completion status to Firebase
    const completionPath = studyId + '/participantData/' + firebaseUserId + '/completion';
    const completionData = {
        completed: true,
        timestamp: new Date().toISOString()
    };
    
    console.log('📝 Writing completion status to Firebase:', completionPath, completionData);
    writeRealtimeDatabase(completionPath, completionData);
    console.log("✅ Completion status write initiated");
});
