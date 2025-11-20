# AI Assistant Setup Guide

The UniCarpool app now includes an **AI Assistant** feature that helps users navigate and use the application.

## Features

The AI Assistant can help with:
- Creating rides (driver mode)
- Joining rides (rider mode)
- Viewing ride history and schedules
- Understanding upcoming rides
- Answering questions about how the app works
- General app navigation

## Setup Instructions

### 1. Get an OpenRouter API Key

1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Click "Sign Up" and create a free account
3. After signing in, go to [https://openrouter.ai/keys](https://openrouter.ai/keys)
4. Click "Create Key"
5. Give it a name like "UniCarpool AI"
6. Copy the API key (starts with `sk-or-...`)

### 2. Configure Your Environment

1. In the `App/carpooling-frontend/` directory, create a `.env` file (copy from `.env.example`)
2. Add your OpenRouter API key:

```env
VITE_OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

3. Save the file

### 3. Restart Your Development Server

```bash
cd App/carpooling-frontend
npm run dev
```

## Usage

1. Open the app
2. Click the menu icon (☰) to open the sidebar
3. Click "AI Assistant"
4. Start chatting!

## Example Questions

Try asking the AI Assistant:
- "How do I create a ride?"
- "Show me my upcoming rides"
- "What's my schedule for this week?"
- "How does the rating system work?"
- "How do I cancel a booking?"

## Context Awareness

The AI Assistant has access to:
- Your upcoming rides
- Your past ride history
- Active bookings
- Your profile information (name, rating, etc.)

It will only use information from your actual data in the app - it won't make up or guess information.

## Privacy & Security

- Your API key is stored locally in your `.env` file
- The AI Assistant only has access to your own ride data
- No personal data is shared with third parties
- All communication is encrypted

## Cost

OpenRouter offers a **free tier** with:
- $1 free credit when you sign up
- Pay-as-you-go after that
- GPT-4 Turbo costs approximately $0.01-0.03 per conversation

For a school project, the free credit should be more than enough!

## Troubleshooting

### "OpenRouter API key not configured" error
- Make sure your `.env` file has `VITE_OPENROUTER_API_KEY` set
- Restart the development server after adding the key
- Check that the key starts with `sk-or-`

### AI responses seem generic
- The AI is designed to only use information from the app context
- If you don't have any rides yet, it won't have much to show
- Try creating some test rides first

### API rate limit errors
- OpenRouter has rate limits on the free tier
- Wait a few seconds between messages
- Consider upgrading if you need higher limits

## Technical Details

- **API**: OpenRouter (https://openrouter.ai)
- **Model**: GPT-4 Turbo
- **Service File**: `src/services/aiAssistant.ts`
- **UI Component**: `src/pages/AIAssistantPage.tsx`
- **Context**: User rides, bookings, and profile data from Firestore

## Support

For issues or questions about the AI Assistant feature, check:
1. This setup guide
2. The `.env.example` file
3. Console errors in browser DevTools (F12)