
/*
consent.js

    Author      :   Helio Tejeda
    University  :   University of California, Irvine
    Lab         :   Modeling and Decision-Making Lab (MADLAB)

Consent Page METADATA file.

This file should contain static experimental metadata such as:
    - Experiment Summary
    - Experiment Estimated Time
    - Compensation
    -
    -
*/

/******************************************************************************
    IMPORTS

        Import all FirebaseJS functionality.
******************************************************************************/
/// Importing functions and variables from the Firebase Psych library
// import {
//     writeRealtimeDatabase,
//     writeURLParameters,
//     firebaseUserId
// } from "./firebasepsych1.1.js";

/******************************************************************************
    METADATA

        All metadata variables that are relevant to the consent page.
******************************************************************************/

/*
    Experiment Summary

        You want your summary to be descriptive but short.

        DEFAULT:
            None! This needs to be modified by you!
*/
var EXPERIMENT_SUMMARY = `
    This experiment tests how people shape AIs such as ChatGPT's behavior. 
    To test this, we built an interactive experiment that requires users to create AI characters using system prompts.
    We want to see how users understand the consequences of their system prompts and see if there are ways to help inform them of these AIs prompts prior to interaction.
`;

/*
    Time Commitment

        How long will your experiment take (in minutes)?

        Be sure to be as accurate as possible and feel free
        to include a range (40-50 minutes).

        DEFAULT:
            30 minutes
*/
var TIME_COMMITMENT = "30 minutes";

/*
    Benefits and Risks

        List any benefits and risks that may arise from participating
        in your study. If there are multiple, feel free to make a list.

        DEFAULT:
            There are no direct benefits from your participation in this study.
*/
var BENEFITS_AND_RISKS = `
    There are no direct benefits or risks from your participation in this study.
`;

/*
    Eligibility Requirements

        List all eligibility requirements for your study. This includes the
        criteria you use to filter participants while using Prolific or AMT.

        DEFAULT:
            1)  United States citizen
            2)  18 years or older
            3)  English speaker
            4)  HTML-5 compatible web browser (chrome, edge, safari, or firefox)
*/
var ELIGIBILITY_REQUIREMENTS = `
    <span>1)</span>     <span class="pl-2">United States citizen/resident</span>
    <br />
    <span>2)</span>     <span class="pl-2">18 years or older</span>
    <br />
    <span>3)</span>     <span class="pl-2">English speaker</span>
    <br />
    <span>4)</span>     <span class="pl-2">HTML-5 compatible web browser (chrome, edge, safari, or firefox)</span>
`;

/*
    Compensation

        How much will your participants be getting paid?

        DEFAULT:
            $5.00
*/
var COMPENSATION = "$5.00";

/*
    Recruitment Service

        Specify the recruitment service that you are using!

        DEFAULT:
            Amazon Mechanical Turk
*/
var RECRUITMENT_SERVICE = "Prolific";

/*
    Comprehention Quiz

        Specify how many questions will be in the comprehention quiz
        and how many a participant needs to correctly answer in order
        to participate in the study.

        DEFAULT:
            4/5
*/
var COMPREHENTION_QUIZ = "";

/*
    Lead Researcher

        This will be you! Be sure to put your name down and email
        so that participants from your study can contact you if
        needed.

        DEFAULT:
            None...Add your name!
*/
var LEAD_RESEARCHER = "Sheer Karny";
var LEAD_RESEARCHER_EMAIL   = "skarny@media.mit.edu";


/******************************************************************************
    RUN ON PAGE LOAD

        Run the following functions as soon as the page is loaded. This will
        render the consent.html page appropriately.
******************************************************************************/
$(document).ready(function (){
    /*
    CONSENT DATA
    */
    let CONSENT_DATA = {
        'consented': null,
        'consentTime': null,
    };


    /******************************************************************************
        FUNCTIONALITY

            All functions that will be used for the consent page.
    ******************************************************************************/
    function disableSubmit() {
        /*
            Disable the submit button.

            Submit button should be disabled by default and only enabled once
            a participant has consented to the study.
        */
        if (!document.getElementById("terms").checked) {
            $("#submit-consent").disabled = true;
        }
    };

    function activateButton() {
        /*
            Activate the submit button.

            Activates and deactivates the submit button based on a user checking
            or unchecking the consent box.
        */
        if (this.checked) {
            document.getElementById("submit-consent").disabled = false;
            CONSENT_DATA['consented'] = true;
            CONSENT_DATA['consentTime'] = Date().toString();
        }
        else {
            document.getElementById("submit-consent").disabled = true;
            CONSENT_DATA['consented'] = false;
            CONSENT_DATA['consentTime'] = null;
        }

        if (DEBUG){
            console.log(CONSENT_DATA);
        }
    };

    function submitConsent() {
        /*
            Consent has been submitted and we can move onto the instructions page.
        */
        // Hide Consent
        $("#consent-header").attr("hidden", true);
        $("#consent-main-content").attr("hidden", true);
        
        // Show Instructions (the full overview page)
        $("#instructions-header").attr("hidden", true);
        $("#instructions-main-content").attr("hidden", false);
        $('#instructions-main-content').load("html/instructions.html?v=" + Date.now());
        
        // Log consent data
        CONSENT_DATA['consentTime'] = Date().toString();
        
        if (DEBUG) {
            console.log("Consent submitted:", CONSENT_DATA);
        }
        
        // Optional: Write to Database
        // let path = EXPERIMENT_DATABASE_NAME + '/participantData/' + firebaseUserId + '/consentData';
        // writeRealtimeDatabase(path, CONSENT_DATA);
    };
    /*
        Insert METADATA into page appropriately :)
    */

    //      Experiment Summary
    $('#experiment-summary').html(EXPERIMENT_SUMMARY);

    //      Time Commitment
    $('#time-commitment').text(TIME_COMMITMENT);

    //      Benefits and Risks
    $('#benefits-and-risks').html(BENEFITS_AND_RISKS);

    //      Eligibility Requirements
    $('#eligibility-requirements').html(ELIGIBILITY_REQUIREMENTS);

    //      Compensation
    $('#compensation').text(COMPENSATION);
    
    //      Recruitment Service
    $('#recruitment-service').text(RECRUITMENT_SERVICE);

    //      Comprehension Quiz
    $('#comprehension-quiz').text(COMPREHENTION_QUIZ);

    //      Lead Researcher Information
    $('#lead-researcher').text(LEAD_RESEARCHER);
    $('#lead-researcher-email').text(LEAD_RESEARCHER_EMAIL);
    $('#lead-researcher-email').attr(
        "href",
        "mailto:" + LEAD_RESEARCHER_EMAIL + "?Subject=Noisy%20Image%20Classification"
    );

    if (DEBUG){
        console.log("TESTING");
       // console.log("Firebase UserID:", firebaseUserId);
    }
    /*  WRITE TO FIREBASE */
    // Save URL parameters on the path: "[studyId]/participantData/[firebaseUserId]/participantInfo"
    // let pathnow = EXPERIMENT_DATABASE_NAME + '/participantData/' + firebaseUserId + '/participantInfo';
    // writeURLParameters( pathnow );

    $('#terms').click(activateButton);
    $('#submit-consent').click(submitConsent);
});
