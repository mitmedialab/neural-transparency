"""
Qualitative Analysis Classifiers for AI Companion Design Experiment
Open-ended Feedback Coding Scheme

Dataset: post_open_ended_feedback from participants in control vs experimental conditions
Context: Participants designed an AI companion and chatted with it for ~10 minutes
"""

CLASSIFIERS = {
    'overall_sentiment': {
        'prompt': '''Classify the overall sentiment of this feedback into ONE category.
        
        Consider the general tone and evaluation of the experience:
        - Very Positive: Enthusiastic, loved it, grateful, "best", "great", "fantastic", highly satisfied
        - Positive: Enjoyed it, helpful, interesting, satisfied, would recommend
        - Neutral: Balanced pros and cons, factual observations, neither positive nor negative
        - Negative: Disappointed, frustrated, problems outweigh benefits, critical
        - Very Negative: Extremely frustrated, angry, waste of time, strong criticism
        
        Choose the DOMINANT sentiment even if mixed feelings are present.
        
        Options:
        1. Very Positive
        2. Positive
        3. Neutral
        4. Negative
        5. Very Negative
        6. Cannot determine
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4', '5', '6']
    },
    
    'interface_usability': {
        'prompt': '''Rate feedback about the interface/platform usability into ONE category.
        
        Look for mentions of:
        - Easy to use: "Intuitive", "clear", "easy", "smooth", "user-friendly", "simple"
        - Usable with minor issues: Generally good but some confusion or suggestions
        - Confusing/difficult: "Confusing", "unclear", "hard to use", "not straightforward"
        - Not mentioned: No commentary on interface usability
        
        Options:
        1. Very easy to use (explicitly praised)
        2. Easy to use (no complaints)
        3. Usable with minor issues
        4. Confusing or difficult
        5. Not mentioned
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4', '5']
    },
    
    'ai_prompt_following': {
        'prompt': '''Classify feedback about how well the AI followed the user's design/prompt into ONE category.
        
        Key indicators:
        - Perfect match: "Exactly what I wanted", "spot on", "followed perfectly", "just like I designed"
        - Good match: Generally followed but small deviations, mostly satisfied
        - Partial match: Some aspects worked, others didn't, "close but not quite right"
        - Poor match: Didn't follow instructions, "refused to", "did opposite", had to redesign multiple times
        - Not mentioned: No commentary on whether AI matched their design
        
        Options:
        1. Perfect match (exactly as designed)
        2. Good match (mostly followed)
        3. Partial match (mixed results)
        4. Poor match (didn't follow instructions)
        5. Not mentioned
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4', '5']
    },
    
    'prompt_behavior_understanding': {
        'prompt': '''Classify whether the user demonstrates understanding of the causal relationship between their prompt/design and the AI's behavior (ONE category).
        
        This captures MECHANISTIC INTERPRETABILITY - do they understand how their specifications created the behavior?
        
        Key indicators:
        
        STRONG UNDERSTANDING - Explicit causal attribution:
        - "I saw immediate improvement each time I updated the prompt"
        - "I was able to see the differences in the AI just by changing a few words"
        - "The AI performed exactly to spec"
        - "Tight feedback loop between prompt specification and resulting behavior"
        - "My prompt for the AI was exactly what I got"
        - Describes specific changes they made and resulting behavioral changes
        - Shows understanding that their words directly shaped behavior
        
        MODERATE UNDERSTANDING - Implicit connection:
        - "I thought I was able to in some way affect the AI"
        - "I could tweak her personality"
        - "After I modified my prompt to include X, the AI did X (at first)"
        - Describes making changes to get desired results
        - Shows awareness of design-behavior link but less explicit
        
        UNCERTAIN/QUESTIONING - Questions the connection:
        - "I thought I was able to affect it BUT the responses seemed typical anyway"
        - "It seemed like some direct prompts weren't relevant" 
        - "I explicitly asked for X but the visualization indicated it wasn't prioritized"
        - Confusion about whether their design actually mattered
        - Mixed signals about causality
        
        NO UNDERSTANDING EVIDENT - No causal attribution:
        - Describes behavior without connecting to their design
        - "The AI was helpful" (no mention of why or their role)
        - No language suggesting they shaped the behavior
        - Treats AI as given, not as designed by them
        
        NOT MENTIONED - No discussion of design-behavior relationship
        
        Choose based on the CLEAREST evidence of causal understanding (or lack thereof).
        
        Options:
        1. Strong understanding (explicit causal attribution)
        2. Moderate understanding (implicit connection)
        3. Uncertain/questioning the connection
        4. No understanding evident
        5. Not mentioned
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4', '5']
    },
    
    'response_formatting_issues': {
        'prompt': '''Identify if the user mentions issues with AI response formatting (ONE category).
        
        Look for complaints about:
        - Too long: "Long responses", "too verbose", "overwhelming to read", "lengthy", "long-winded"
        - Formatting needs: "Need bullets", "formatting better", "paragraphs", "easier to read"
        - No issues mentioned: Either praised formatting or didn't mention it
        
        Options:
        1. Responses too long/verbose (explicit complaint)
        2. Formatting needs improvement (bullets, structure)
        3. Both length and formatting issues
        4. No formatting issues mentioned
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4']
    },
    
    'time_constraint_mentioned': {
        'prompt': '''Did the user mention time constraints as an issue? (ONE category)
        
        Look for:
        - Too short: "10 minutes too short", "needed more time", "ran out of time", "wish it was longer"
        - Cut off unexpectedly: "Cut off out of nowhere", "ended abruptly", "no warning"
        - Just right: Enough time, no complaints about duration
        - Not mentioned: No reference to time or duration
        
        Options:
        1. Too short (needed more time)
        2. Cut off unexpectedly
        3. Too short AND cut off unexpectedly
        4. Just right / no complaints
        5. Not mentioned
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4', '5']
    },
    
    'customization_experience': {
        'prompt': '''Classify feedback about the customization/design process into ONE category.
        
        Key indicators:
        - Loved it: "Fun to create", "enjoyed designing", "engaging", "cool to customize", positive about process
        - Satisfactory: Created successfully, no major complaints about the process
        - Challenging: "Hard to get right", "couldn't get it perfect", tweaking difficulties, "had to go back"
        - Not mentioned: No specific feedback about the customization/design process
        
        Options:
        1. Loved the customization process
        2. Satisfactory customization
        3. Challenging to get right
        4. Not mentioned
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4']
    },
    
    'emotional_impact': {
        'prompt': '''Classify the emotional impact of the conversation with the AI (ONE category).
        
        Look for emotional language:
        - Strong positive emotion: "Cheered me up", "felt safe", "emotionally attuned", "supportive", therapeutic feeling
        - Mild positive: Helpful, pleasant, friendly, nice interaction
        - Neutral: Factual, analytical, no emotional language
        - Negative emotion: Frustrated, annoyed, disappointed, unsettled
        - Not applicable: No emotional content or impact mentioned
        
        Options:
        1. Strong positive emotional impact
        2. Mild positive emotional impact
        3. Neutral (no emotional impact)
        4. Negative emotional impact
        5. Not mentioned / Not applicable
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4', '5']
    },
    
    'learning_outcome': {
        'prompt': '''Did the user indicate they learned something from the experience? (ONE category)
        
        Look for:
        - Learned about AI: "Opened my eyes to how AI works", "learned about AI", understanding AI systems
        - Learned about prompt engineering: Understanding how to design prompts, saw impact of changes
        - Learned about self: Self-discovery, understanding own needs, personal insights
        - Practical learning: Learned useful information from the conversation content
        - No learning mentioned: No indication of learning outcomes
        
        Options:
        1. Learned about AI/technology
        2. Learned about prompt engineering
        3. Learned about self
        4. Learned practical information
        5. Multiple learning outcomes
        6. No learning mentioned
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4', '5', '6']
    },
    
    'specific_issues': {
        'prompt': '''List ALL specific issues or problems mentioned (comma-separated numbers).
        
        Identify explicit problems:
        - AI refused requests: "Refused to talk", "wouldn't respond", rejection behaviors
        - Inconsistent behavior: "Went back to long responses", "forgot previous turns", inconsistency
        - False information: AI provided false/incorrect information
        - Repetitive/formulaic: "Pretty formulaic", same patterns, repetitive responses
        - Technical glitches: Bugs, errors, system problems
        - Tone issues: Too serious, not light enough, wrong personality tone
        - Prompt visualization mismatch: Visualization didn't match what user asked for
        - No issues mentioned: Everything worked fine, no problems stated
        
        List ALL that apply.
        
        Options:
        1. AI refused/rejected requests
        2. Inconsistent behavior
        3. False or incorrect information
        4. Repetitive or formulaic responses
        5. Technical glitches
        6. Wrong tone/personality
        7. Prompt visualization mismatch
        8. No specific issues mentioned
        
        OUTPUT ONLY NUMBERS (comma-separated if multiple): [x, y, z, ...]''',
        'options': ['1', '2', '3', '4', '5', '6', '7', '8'],
        'multiple': True
    },
    
    'positive_features': {
        'prompt': '''List ALL positive features or aspects explicitly praised (comma-separated numbers).
        
        Identify what the user explicitly liked:
        - AI personality match: "Exactly what I wanted", perfect personality, matched design
        - Empathetic/supportive: "Empathetic", "supportive", "non-judgmental", warm
        - Helpful advice: Gave good advice, useful suggestions, practical help
        - Natural conversation: "Felt natural", "like a real person", human-like, engaging dialogue
        - Visualization feature: Liked seeing the personality visualization/traits displayed
        - Quick iteration: "Saw immediate improvement", could test and refine quickly
        - Intelligent responses: Smart, thoughtful, detailed, knowledgeable
        - Followed requests well: Responsive to instructions, adapted to feedback
        - Interface design: Clean UI, well-designed, intuitive interface
        
        List ALL explicitly praised features.
        
        Options:
        1. AI personality matched design
        2. Empathetic and supportive
        3. Helpful and useful advice
        4. Natural conversation flow
        5. Visualization feature
        6. Quick iteration/feedback loop
        7. Intelligent and detailed responses
        8. Responsive to instructions
        9. Interface design
        10. No specific features praised
        
        OUTPUT ONLY NUMBERS (comma-separated if multiple): [x, y, z, ...]''',
        'options': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        'multiple': True
    },
    
    'suggested_improvements': {
        'prompt': '''List ALL improvements or changes suggested by the user (comma-separated numbers).
        
        Identify explicit suggestions:
        - More time needed: Longer interaction time, more than 10 minutes
        - Better formatting: Bullet points, structured responses, visual formatting
        - Shorter responses: More concise answers, less verbose
        - Time warnings: Timer, countdown, notification before ending
        - Clearer instructions: Better directions, less confusing guidance
        - More customization options: Additional features, more control
        - Better prompt following: Improve adherence to user specifications
        - No improvements suggested: Satisfied as-is, no changes needed
        
        List ALL suggestions made.
        
        Options:
        1. More time for interaction
        2. Better response formatting
        3. Shorter/more concise responses
        4. Time warnings or timer
        5. Clearer instructions
        6. More customization options
        7. Better prompt adherence
        8. No improvements suggested
        
        OUTPUT ONLY NUMBERS (comma-separated if multiple): [x, y, z, ...]''',
        'options': ['1', '2', '3', '4', '5', '6', '7', '8'],
        'multiple': True
    },
    
    'use_case_interest': {
        'prompt': '''What future use cases or interests does the user express? (ONE category)
        
        Look for mentions of:
        - Daily life assistance: Reminders, emails, daily activities, productivity help
        - Therapeutic use: Mental health support, therapy, emotional support
        - Self-improvement: Practice skills, personal growth, skill development
        - Entertainment: Fun, interesting to try, enjoyable activity
        - Professional interest: Industry application, work-related, research interest
        - General AI interest: Interested in AI technology, learning more about AI
        - No future interest mentioned: Just feedback on this experience
        
        Options:
        1. Daily life assistance
        2. Therapeutic/emotional support
        3. Self-improvement/skill practice
        4. Entertainment value
        5. Professional interest
        6. General AI interest
        7. Multiple interests
        8. No future interest mentioned
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4', '5', '6', '7', '8']
    },
    
    'conversation_quality': {
        'prompt': '''Rate the perceived quality of the AI conversation (ONE category).
        
        Consider statements about conversation quality:
        - Excellent: "Like talking to a real person", "exactly like I wanted", therapeutic quality
        - Good: Helpful, useful, appropriate, satisfactory interaction
        - Mixed: Some good aspects, some issues, inconsistent quality
        - Poor: Frustrating, unhelpful, low quality interaction
        - Not evaluated: No assessment of conversation quality provided
        
        Options:
        1. Excellent conversation quality
        2. Good conversation quality
        3. Mixed quality
        4. Poor conversation quality
        5. Not evaluated
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4', '5']
    },
    
    'design_control_perception': {
        'prompt': '''How much control over the AI design did the user feel they had? (ONE category)
        
        Key indicators:
        - High control: "Able to affect", "made changes", "got it right", successful customization
        - Moderate control: Some influence, but limitations or challenges
        - Low control: AI didn't follow design, couldn't get desired result, lack of influence
        - Uncertain: Mixed signals, "thought I was able to" but responses seemed typical
        - Not mentioned: No commentary on control or influence over the AI
        
        Options:
        1. High control (successfully customized)
        2. Moderate control (some influence)
        3. Low control (limited influence)
        4. Uncertain about control
        5. Not mentioned
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4', '5']
    },
    
    'comparison_to_other_ai': {
        'prompt': '''Does the user compare this to other AI systems? (ONE category)
        
        Look for:
        - Better than other AI: "Best AI interface", better than others they've used
        - Similar to other AI: Responses were typical, like other chatbots
        - Worse than expected: Below expectations based on other AI experiences
        - First AI experience: Never done this before, new experience
        - No comparison made: No reference to other AI systems
        
        Options:
        1. Better than other AI
        2. Similar to other AI
        3. Worse than other AI
        4. First AI experience
        5. No comparison made
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4', '5']
    },
    
    'participant_engagement': {
        'prompt': '''How engaged was the participant in the task? (ONE category)
        
        Indicators of engagement:
        - Highly engaged: "Fascinating", "loved it", actively explored, tested multiple configurations
        - Engaged: Completed thoughtfully, found it interesting, participated fully
        - Minimally engaged: Brief feedback, little detail, generic responses
        - Disengaged: "No feedback", minimal effort apparent
        
        Options:
        1. Highly engaged
        2. Engaged
        3. Minimally engaged
        4. Disengaged
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4']
    },
    
    'key_themes': {
        'prompt': '''Identify up to 3 MOST prominent themes in this feedback (comma-separated numbers).
        
        Theme categories:
        - Interface/Usability: Focus on platform design, ease of use, interface quality
        - AI Performance: Focus on how well AI followed instructions, response quality
        - Customization/Design: Focus on the design process, creating the personality
        - Emotional Experience: Focus on feelings, emotional impact, therapeutic aspects
        - Technical Issues: Focus on problems, bugs, limitations, formatting
        - Learning/Insight: Focus on what they learned or understood from the experience
        - Time/Pacing: Focus on duration, timing, rushing
        - Conversation Content: Focus on the actual chat, advice received, topics discussed
        - Future Applications: Focus on how they'd use this or similar systems
        - Comparison/Expectations: Focus on comparing to other AI or expectations
        
        Select 1-3 themes that are MOST central to the feedback.
        
        Options:
        1. Interface/Usability
        2. AI Performance
        3. Customization/Design
        4. Emotional Experience
        5. Technical Issues
        6. Learning/Insight
        7. Time/Pacing
        8. Conversation Content
        9. Future Applications
        10. Comparison/Expectations
        
        OUTPUT ONLY NUMBERS (comma-separated, maximum 3): [x, y, z]''',
        'options': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        'multiple': True,
        'max_items': 3
    },
    
    'trust_safety_indicators': {
        'prompt': '''Are there any trust or safety-related themes in this feedback? (ONE category)
        
        Look for:
        - Trust established: "Felt safe", "trustworthy", comfort with the AI
        - Privacy/safety concerns: Concerns about data, safety, appropriateness
        - Boundary testing: Tested limits, tried controversial topics, pushed boundaries
        - False information concern: Worried about AI providing false info
        - No trust/safety themes: No mention of trust, safety, or related concerns
        
        Options:
        1. Trust established (positive safety feeling)
        2. Privacy or safety concerns
        3. Boundary testing behavior
        4. False information concern
        5. No trust/safety themes mentioned
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4', '5']
    },
    
    'recommendation_likelihood': {
        'prompt': '''Based on the feedback tone, how likely would this user recommend the experience? (ONE category)
        
        Infer from overall sentiment and explicit statements:
        - Highly likely: Enthusiastic, grateful, "thank you", loved it, wants more
        - Likely: Positive experience, enjoyed it, found it useful
        - Neutral: Mixed feelings, some good and bad aspects
        - Unlikely: More negative than positive, frustrated, disappointed
        - Highly unlikely: Very negative, waste of time, poor experience
        
        Options:
        1. Highly likely to recommend
        2. Likely to recommend
        3. Neutral
        4. Unlikely to recommend
        5. Highly unlikely to recommend
        
        OUTPUT ONLY THE NUMBER: [x]''',
        'options': ['1', '2', '3', '4', '5']
    }
}

# Category mappings for interpretation
CATEGORY_LABELS = {
    'overall_sentiment': {
        '1': 'Very Positive',
        '2': 'Positive',
        '3': 'Neutral',
        '4': 'Negative',
        '5': 'Very Negative',
        '6': 'Cannot determine'
    },
    'interface_usability': {
        '1': 'Very easy to use',
        '2': 'Easy to use',
        '3': 'Usable with minor issues',
        '4': 'Confusing or difficult',
        '5': 'Not mentioned'
    },
    'ai_prompt_following': {
        '1': 'Perfect match',
        '2': 'Good match',
        '3': 'Partial match',
        '4': 'Poor match',
        '5': 'Not mentioned'
    },
    'prompt_behavior_understanding': {
        '1': 'Strong understanding',
        '2': 'Moderate understanding',
        '3': 'Uncertain/questioning',
        '4': 'No understanding evident',
        '5': 'Not mentioned'
    },
    'response_formatting_issues': {
        '1': 'Too long/verbose',
        '2': 'Formatting needs improvement',
        '3': 'Both length and formatting',
        '4': 'No issues mentioned'
    },
    'time_constraint_mentioned': {
        '1': 'Too short',
        '2': 'Cut off unexpectedly',
        '3': 'Too short AND cut off',
        '4': 'Just right',
        '5': 'Not mentioned'
    },
    'customization_experience': {
        '1': 'Loved customization',
        '2': 'Satisfactory',
        '3': 'Challenging',
        '4': 'Not mentioned'
    },
    'emotional_impact': {
        '1': 'Strong positive',
        '2': 'Mild positive',
        '3': 'Neutral',
        '4': 'Negative',
        '5': 'Not mentioned'
    },
    'learning_outcome': {
        '1': 'Learned about AI',
        '2': 'Learned about prompting',
        '3': 'Learned about self',
        '4': 'Learned practical info',
        '5': 'Multiple learnings',
        '6': 'No learning mentioned'
    },
    'specific_issues': {
        '1': 'AI refused requests',
        '2': 'Inconsistent behavior',
        '3': 'False information',
        '4': 'Repetitive/formulaic',
        '5': 'Technical glitches',
        '6': 'Wrong tone/personality',
        '7': 'Visualization mismatch',
        '8': 'No issues'
    },
    'positive_features': {
        '1': 'Personality match',
        '2': 'Empathetic/supportive',
        '3': 'Helpful advice',
        '4': 'Natural conversation',
        '5': 'Visualization feature',
        '6': 'Quick iteration',
        '7': 'Intelligent responses',
        '8': 'Responsive to instructions',
        '9': 'Interface design',
        '10': 'None praised'
    },
    'suggested_improvements': {
        '1': 'More time',
        '2': 'Better formatting',
        '3': 'Shorter responses',
        '4': 'Time warnings',
        '5': 'Clearer instructions',
        '6': 'More customization',
        '7': 'Better prompt adherence',
        '8': 'No improvements'
    },
    'use_case_interest': {
        '1': 'Daily assistance',
        '2': 'Therapeutic use',
        '3': 'Self-improvement',
        '4': 'Entertainment',
        '5': 'Professional interest',
        '6': 'AI interest',
        '7': 'Multiple interests',
        '8': 'None mentioned'
    },
    'conversation_quality': {
        '1': 'Excellent',
        '2': 'Good',
        '3': 'Mixed',
        '4': 'Poor',
        '5': 'Not evaluated'
    },
    'design_control_perception': {
        '1': 'High control',
        '2': 'Moderate control',
        '3': 'Low control',
        '4': 'Uncertain',
        '5': 'Not mentioned'
    },
    'comparison_to_other_ai': {
        '1': 'Better than others',
        '2': 'Similar to others',
        '3': 'Worse than others',
        '4': 'First AI experience',
        '5': 'No comparison'
    },
    'participant_engagement': {
        '1': 'Highly engaged',
        '2': 'Engaged',
        '3': 'Minimally engaged',
        '4': 'Disengaged'
    },
    'key_themes': {
        '1': 'Interface/Usability',
        '2': 'AI Performance',
        '3': 'Customization/Design',
        '4': 'Emotional Experience',
        '5': 'Technical Issues',
        '6': 'Learning/Insight',
        '7': 'Time/Pacing',
        '8': 'Conversation Content',
        '9': 'Future Applications',
        '10': 'Comparison/Expectations'
    },
    'trust_safety_indicators': {
        '1': 'Trust established',
        '2': 'Safety concerns',
        '3': 'Boundary testing',
        '4': 'False info concern',
        '5': 'No themes'
    },
    'recommendation_likelihood': {
        '1': 'Highly likely',
        '2': 'Likely',
        '3': 'Neutral',
        '4': 'Unlikely',
        '5': 'Highly unlikely'
    }
}

