import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from environment variables
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API key not configured. Please set ANTHROPIC_API_KEY environment variable.' 
      });
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Extract request data
    const { messages, model = 'claude-3-5-sonnet-20241022', max_tokens = 1000, system } = req.body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Invalid request: messages array is required' 
      });
    }

    // Prepare the request for Anthropic API
    const requestData = {
      model: model,
      max_tokens: max_tokens,
      messages: messages,
    };

    // Add system message if provided
    if (system) {
      requestData.system = system;
    }

    // Call Anthropic API
    const response = await anthropic.messages.create(requestData);

    // Return the response
    return res.status(200).json({
      content: response.content,
      usage: response.usage,
      model: response.model,
      stop_reason: response.stop_reason
    });

  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    
    // Return appropriate error response
    if (error.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid API key. Please check your Anthropic API key.' 
      });
    } else if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      });
    } else if (error.status === 400) {
      return res.status(400).json({ 
        error: 'Invalid request: ' + (error.message || 'Bad request') 
      });
    } else {
      return res.status(500).json({ 
        error: 'Internal server error: ' + (error.message || 'Unknown error') 
      });
    }
  }
}
