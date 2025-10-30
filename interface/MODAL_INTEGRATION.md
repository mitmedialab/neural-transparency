# Modal.ai Integration Guide

This document explains how to use the Modal.ai integration with your chat application.

## Setup

### 1. Environment Variables

Add the following environment variable to your Vercel deployment:

```
MODAL_API_KEY=your-modal-api-key
```

Replace `your-modal-api-key` with the actual API key from your friend's Modal deployment.

### 2. Configuration

To switch between Claude and Modal.ai, simply comment/uncomment the appropriate configuration in `js/config-unified.js`:

```javascript
// Claude API Configuration (uncomment to use Claude)
const API_CONFIG = {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 1000,
    apiEndpoint: '/api/claude'
};

// Modal AI Configuration (uncomment to use Modal, comment out Claude config above)
// const API_CONFIG = {
//     model: 'gemma-2-2b-it', // Gemma 2B model from your friend's Modal deployment
//     maxTokens: 1000,
//     apiEndpoint: '/api/modal'
// };
```

### 3. Modal.ai API Endpoint

The Modal.ai integration is handled by `/api/modal.js`, which:
- Accepts the same request format as the Claude API
- Forwards requests to your Modal.ai endpoint
- Returns responses in a format compatible with the chat interface

**Important:** You need to update the Modal endpoint URL in `/api/modal.js`:
- Replace `https://your-username--gemma-chat-api-chat-endpoint.modal.run` with your actual Modal deployment URL
- The URL format should be: `https://[username]--gemma-chat-api-chat-endpoint.modal.run`

## Usage

### Switching Models

To switch between models, simply comment/uncomment the appropriate configuration in the config file and redeploy:

- Comment out Modal config and uncomment Claude config to use Claude
- Comment out Claude config and uncomment Modal config to use Modal.ai

### Default Behavior

- The application uses whichever provider is specified in the config
- All existing functionality works unchanged
- The chat interface automatically uses the configured provider

## API Request Format

The Modal.ai endpoint expects requests in this format:

```json
{
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "max_tokens": 1000,
  "model": "your-model-name",
  "system": "You are a helpful assistant."
}
```

## Response Format

The Modal.ai endpoint should return responses in this format:

```json
{
  "content": [{"text": "Response text"}],
  "usage": {"input_tokens": 10, "output_tokens": 20},
  "model": "your-model-name",
  "stop_reason": "end_turn"
}
```

## Error Handling

The integration includes comprehensive error handling for:
- Missing endpoint configuration
- Network errors
- Rate limiting
- Invalid responses

## Testing

To test the Modal.ai integration:

1. Set up your Modal.ai endpoint URL
2. Deploy to Vercel
3. Use the browser console to switch providers:
   ```javascript
   switchAIProvider('modal');
   ```
4. Send a message to test the integration

## Troubleshooting

### Common Issues

1. **"Modal API key not configured"**: Set the `MODAL_API_KEY` environment variable
2. **"Modal API error: 401"**: Check your Modal API key and authentication
3. **"Modal API error: 400"**: Verify your request format matches the expected schema

### Debug Information

Check the browser console for detailed logging of API requests and responses.
