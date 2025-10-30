# MIT Media Lab Chat Study

Research study interface for conducting chat-based experiments using Claude AI, designed for Vercel serverless deployment.

## Quick Start

### Demo Mode

Test all features without running a full study:

```
http://localhost:3000?demo=true
```

Demo mode skips consent page, surveys, and timers. Perfect for testing and demos. See [DEMO_MODE.md](DEMO_MODE.md) for details.

### Deploy to Vercel

1. Fork or clone this repository
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Deploy

Your study will be live at `https://your-project.vercel.app`

### Local Development

**Option 1: Vercel CLI**
```bash
npm i -g vercel
cd interface
vercel dev
```
Access at: `http://localhost:3000`

**Option 2: Python Server (Testing)**
```bash
cd interface
python -m http.server 8000
```
Access at: `http://localhost:8000`

Or with Python 2:
```bash
python -m SimpleHTTPServer 8000
```

## 📋 Features

- **🎬 Demo Mode**: Instant feature exploration with `?demo=true` - skip surveys, see everything immediately
- **Zero Configuration**: Participants can start chatting immediately - no API key setup required
- **Serverless Architecture**: Deployed on Vercel with automatic scaling
- **Secure API Handling**: API keys stored server-side, never exposed to frontend
- **Clean Interface**: Streamlined chat interface without settings or configuration UI
- **Research-Ready**: Built for academic studies with consent flow and data collection
- **Firebase Integration**: Optional data collection and analytics
- **Mobile Responsive**: Works on all devices

## 🏗️ Architecture

### Frontend
- **Static Files**: HTML, CSS, JavaScript served from Vercel CDN
- **Framework**: Vanilla JavaScript with jQuery
- **Styling**: Custom CSS with modern design system
- **Responsive**: Mobile-first design

### Backend
- **Serverless Function**: `/api/claude` handles Claude API calls
- **Security**: API key stored in environment variables
- **CORS**: Properly configured for frontend requests
- **Error Handling**: Comprehensive error management

### Data Flow
```
User Input → Frontend → /api/claude → Anthropic API → Response → Frontend → User
```

## 📁 Project Structure

```
├── index.html                 # Main application entry point
├── api/
│   └── modal.js             # Serverless function for Modal Chat API
│   └── persona-vector.js    # Serverless function for Persona Vector Generation API
├── js/
│   ├── config-unified.js     # Unified configuration (Vercel + local)
│   ├── chat.js              # Chat interface logic
│   ├── consent.js           # Consent form handling
│   ├── metadata.js          # Study metadata
│   └── firebasepsych1.1.js  # Firebase integration
├── html/
│   ├── consent.html         # Consent page
│   └── chat-content.html    # Chat interface
├── css/
│   └── consent.css          # Consent page styles
├── images/
│   └── ml_logo.png          # MIT Media Lab logo
├── vercel.json              # Vercel configuration
├── package.json             # Dependencies
```

## Configuration

### API Endpoints
API configuration is in the `/api` directory. Environment variables are handled by the endpoints.

### Deployment
The application is designed for Vercel deployment:
- **Production**: Uses serverless functions
- **Local Development**: Uses Vercel CLI or Python server

### Customization
- **Study Title**: Edit `#experiment-title` in `index.html`
- **Chat System Prompt**: Modify in `js/chat.js`
- **Styling**: Update CSS variables in `index.html`
- **Firebase**: Configure in `js/firebasepsych1.1.js`

## 🔧 Development

### Prerequisites
- Node.js 18+ (for Vercel CLI)
- Anthropic API key
- Git

### Local Setup
1. Clone the repository
2. Install Vercel CLI: `npm i -g vercel`
3. Run `vercel dev` for local development
4. Set environment variables as needed

### Testing

**🎬 Use Demo Mode for rapid testing:**
```bash
# Local testing
http://localhost:3000?demo=true

# Production testing
https://your-deployment.vercel.app/?demo=true
```

**Standard Testing:**
- Test locally with `vercel dev`
- Test production deployment
- Verify API functionality
- Check mobile responsiveness

**Demo Mode Benefits:**
- Test complete chat flow in 2-3 minutes
- Skip 10-minute timer and surveys
- See all visualization features immediately
- Perfect for iterative development

**→ See [DEMO_MODE.md](DEMO_MODE.md) for testing checklist**

## 👥 User Experience

### For Study Participants
- **Zero Setup Required**: No API keys, accounts, or configuration needed
- **Immediate Access**: Start chatting as soon as they visit the site
- **Clean Interface**: No distracting settings or configuration options
- **Mobile Friendly**: Works seamlessly on all devices

### For Researchers
- **🎬 Demo Mode**: Test and showcase study with `?demo=true` - perfect for stakeholder demos
- **Easy Deployment**: One-click setup on Vercel
- **Secure by Default**: API keys handled server-side automatically
- **Scalable**: Handles any number of participants automatically
- **Maintenance-Free**: No server management or updates needed

## 📊 Research Features

### Consent Management
- IRB-compliant consent flow
- Participant information display
- Consent tracking

### Data Collection
- Optional Firebase integration
- Conversation logging
- Participant analytics
- Export capabilities

### Study Flow
1. **Consent Page**: Participant agreement
2. **Instructions**: Study guidelines
3. **Chat Interface**: Main experiment (zero configuration)
4. **Survey**: Optional post-study questions
5. **Completion**: Thank you and next steps

## 🚀 Deployment

### Vercel (Exclusively Supported)
- **Pros**: Serverless, secure, fast, free tier, zero configuration
- **Setup**: Connect GitHub repo, add API key, deploy
- **Cost**: Free for research studies
- **Why Vercel Only**: Simplified architecture, better security, easier maintenance

**Note**: This application is optimized specifically for Vercel's serverless architecture. Other platforms are not supported due to the simplified design approach.

## 🔒 Security

### API Key Protection
- Stored in Vercel environment variables
- Never exposed to frontend
- Encrypted at rest

### Data Privacy
- No data stored on frontend
- Optional Firebase for research data
- GDPR compliant design

### CORS Security
- Properly configured for your domain
- No wildcard origins
- Secure headers

## 📈 Performance

### Vercel Benefits
- **Global CDN**: Fast loading worldwide
- **Serverless**: Automatic scaling
- **Edge Functions**: Low latency
- **Caching**: Optimized delivery

### Optimization
- Minified assets
- Optimized images
- Efficient API calls
- Responsive design

## 🐛 Troubleshooting

### Common Issues

- Check environment variables in Vercel dashboard
- Verify all static files are loading (no 404 errors)
- Check function logs in Vercel dashboard
- Redeploy after setting environment variables
- Check browser console for JavaScript errors

### Getting Help

- Check browser console for errors
- Review Vercel function logs
- See [Vercel documentation](https://vercel.com/docs)

## Documentation

- [DEMO_MODE.md](DEMO_MODE.md) - Demo mode guide
- [SUNBURST_VISUALIZATION.md](SUNBURST_VISUALIZATION.md) - Persona visualization system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🏛️ MIT Media Lab

This project is developed for research at the MIT Media Lab. For questions about the study or research purposes, please contact the study administrators.

---

## 🚀 Get Started

**Ready to deploy?** Follow the [Vercel Deployment Guide](VERCEL_DEPLOYMENT.md) to get started!

**Want to test first?** Try Demo Mode:
```
# Add ?demo=true to any deployment
https://your-deployment.vercel.app/?demo=true

# Or locally
http://localhost:3000?demo=true
```

**📖 Full Demo Mode Documentation:** [DEMO_MODE.md](DEMO_MODE.md)

---
