# Voice Interview Feature

This feature adds an AI-powered voice interviewer to help candidates practice technical interviews through natural conversation. The voice interviewer can:

- Interact with you through natural voice conversations
- Provide hints and feedback on your approach
- Ask questions to help guide your problem-solving process
- Respond naturally to interruptions and questions

## Setup Instructions

To use the Voice Interviewer feature, you need to set up the OpenAI Voice API credentials:

1. Create an `.env.local` file in the root directory with your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key
```

2. Install the necessary dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

## Using the Voice Interviewer

1. Navigate to the interview page.
2. Click the "Talk to Interviewer" button in the bottom-left corner.
3. Click "Start Interview" in the interviewer panel.
4. Wait for the AI to greet you and begin the conversation.
5. Speak naturally - the system will automatically detect when you're speaking and stop the AI.
6. You can use the quick action buttons or simply ask questions verbally like:
   - "Can you give me a hint?"
   - "Let me talk through my approach"
   - "What's the time complexity requirement?"

## Technical Implementation

The voice interviewer uses:

- OpenAI's Realtime API for speech-to-speech conversation
- WebRTC for efficient audio streaming
- Server-side voice activity detection to identify when users are speaking
- Context-aware responses based on the current problem

## Troubleshooting

- **Microphone Access**: Make sure to grant microphone permissions when prompted.
- **Audio Issues**: If you can't hear the AI, check your volume settings in the voice panel.
- **Connection Problems**: If the connection fails, try refreshing the page or check your internet connection.

## Environment Variables

Make sure the following environment variables are set in your `.env.local` file:

```
OPENAI_API_KEY=your_openai_api_key
```

You'll need to obtain an API key from the [OpenAI platform](https://platform.openai.com/api-keys). 