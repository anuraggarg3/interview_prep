import { useEffect, useRef, useCallback, useState } from 'react';

import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '@/lib/wavtools/index.js';

import { X, Mic, Play, RefreshCw } from 'react-feather';
import { Button } from '@mui/material';

// Define the structure for tracking interview metrics
interface InterviewMetrics {
  hintsRequested: number;
  communicationRating: number;
  problemSolvingRating: number;
  startTime: Date | null;
  endTime: Date | null;
  messages: Array<{
    role: 'user' | 'interviewer';
    content: string;
    timestamp: Date;
  }>;
}

type Props = {
  scrapedContent: string;
  problemTitle: string;
  problemDescription: string;
  codeContext: string;
  interviewerGender: 'Male' | 'Female';
};

export const VoiceChat: React.FC<Props> = ({ scrapedContent, problemTitle, problemDescription, codeContext, interviewerGender }) => {
  const apiKey =process.env.OPENAI_API_KEY || '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';
  const instructions = `SYSTEM SETTINGS:
------
INSTRUCTIONS:
- You are an AI interviewer conducting a technical interview.
- Start the interview by introducing yourself and asking for the candidate's name.
- Once the candidate provides their name, address them by their name throughout the conversation.
- Ask specific questions related to the candidate's coding skills, problem-solving abilities, and technical knowledge, focusing on the INTERVIEW CONTEXT provided below.
- Provide a realistic interview experience with follow-up questions based on the candidate's responses.
- Keep your responses concise and professional, under 200 characters when possible.
- Focus on assessing the candidate's technical abilities in a structured manner.
- Provide constructive feedback when appropriate.
- If the candidate asks for hints, review their current code context and provide targeted guidance based on it.
- Track when the candidate asks for hints specifically by starting your response with "HINT: ".
- At the end of the interview, provide a brief assessment of the candidate's performance.

------
PERSONALITY:
- Professional and encouraging
- Clear and articulate
- Maintain a formal interview tone

------
INTERVIEW CONTEXT:
The candidate is working on a problem related to: ${scrapedContent}.
Problem Title: ${problemTitle}.
Problem Description: ${problemDescription}.
Code Context:
${codeContext}
Please tailor your questions and scenarios based on this context.
`;

  /**
   * Instantiate:
   * - WavRecorder (speech input)
   * - WavStreamPlayer (speech output)
   * - RealtimeClient (API client)
   */
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient(
      {
            apiKey: apiKey,
            dangerouslyAllowAPIKeyInBrowser: true,
          }
    )
  );

  /**
   * References for
   * - Autoscrolling event logs
   * - Timing delta for event log displays
   */
  const startTimeRef = useRef<string>(new Date().toISOString());

  const [items, setItems] = useState<ItemType[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [interviewMetrics, setInterviewMetrics] = useState<InterviewMetrics>({
    hintsRequested: 0,
    communicationRating: 0,
    problemSolvingRating: 0,
    startTime: null,
    endTime: null,
    messages: []
  });

  /**
   * Disconnect and reset conversation state
   */
  const disconnectConversation = useCallback(async () => {
    try {
      setIsConnected(false);
      setItems([]);

      // Record end time of interview
      setInterviewMetrics(prev => ({
        ...prev,
        endTime: new Date()
      }));

      const client = clientRef.current;
      const wavRecorder = wavRecorderRef.current;
      const wavStreamPlayer = wavStreamPlayerRef.current;

      // First pause recording to stop audio chunks from being processed
      if (wavRecorder && wavRecorder.getStatus && wavRecorder.getStatus() === 'recording') {
        await wavRecorder.pause();
      }
      
      // Reset the chunk processor to an empty function
      if (wavRecorder && wavRecorder.record) {
        await wavRecorder.record(() => {}, 8192);
        await wavRecorder.pause();
      }
      
      // Now disconnect the client if it's connected
      if (client && client.isConnected && typeof client.isConnected === 'function' && client.isConnected()) {
        client.disconnect();
      }
      
      // Clean up recorder and player
      if (wavRecorder && wavRecorder.end) {
        await wavRecorder.end();
      }
      
      if (wavStreamPlayer && wavStreamPlayer.interrupt) {
        await wavStreamPlayer.interrupt();
      }

      // Store the interview metrics in sessionStorage for later use
      sessionStorage.setItem('interviewMetrics', JSON.stringify(interviewMetrics));
    } catch (error) {
      console.error('Error disconnecting from conversation:', error);
      // Still update the UI state even if cleanup fails
      setIsConnected(false);
    }
  }, [interviewMetrics]);

  /**
   * Connect to conversation:
   * WavRecorder takes speech input, WavStreamPlayer output, client is API client
   */
  const connectConversation = useCallback(async () => {
    try {
      const client = clientRef.current;
      const wavRecorder = wavRecorderRef.current;
      const wavStreamPlayer = wavStreamPlayerRef.current;

      if (!client || !wavRecorder || !wavStreamPlayer) {
        throw new Error('Required components not initialized');
      }

      startTimeRef.current = new Date().toISOString();
      
      // Initialize interview metrics
      setInterviewMetrics(prev => ({
        ...prev,
        startTime: new Date(),
        messages: []
      }));

      // Connect to microphone
      await wavRecorder.begin();

      // Connect to audio output
      await wavStreamPlayer.connect();

      try {
        // Connect to realtime API
        await client.connect();
      } catch (connectError) {
        console.error('Failed to connect to OpenAI Realtime API:', connectError);
        alert('Could not connect to the interview assistant. Please check your internet connection and try again.');
        throw connectError;
      }
      
      // Only set connected state after successful connection
      setIsConnected(true);
      setItems(client.conversation.getItems());

      // Send initial message
      client.sendUserMessageContent([
        {
          type: `input_text`,
          text: `Interviewer, please begin the interview.`
        },
      ]);

      if (client.getTurnDetectionType() === 'server_vad') {
        await wavRecorder.record((data) => client.appendInputAudio(data.mono));
      }
    } catch (error) {
      console.error('Error connecting to conversation:', error);
      // Clean up if connection fails
      await disconnectConversation();
    }
  }, [disconnectConversation]);

  const deleteConversationItem = useCallback(async (id: string) => {
    const client = clientRef.current;
    if (client && client.deleteItem) {
      client.deleteItem(id);
    }
  }, []);

  /**
   * Switch between Manual <> VAD mode for communication
   */
  const changeTurnEndType = async (value: string) => {
    try {
      const client = clientRef.current;
      const wavRecorder = wavRecorderRef.current;
      
      if (!client || !wavRecorder) {
        console.error('Client or wavRecorder not initialized');
        return;
      }
      
      if (value === 'none' && wavRecorder.getStatus() === 'recording') {
        await wavRecorder.pause();
      }
      
      client.updateSession({
        turn_detection: value === 'none' ? null : { type: 'server_vad' },
      });
      
      if (value === 'server_vad' && client.isConnected && client.isConnected()) {
        await wavRecorder.record((data) => client.appendInputAudio(data.mono));
      }
    } catch (error) {
      console.error('Error changing turn end type:', error);
    }
  };

  /**
   * Auto-scroll the conversation logs
   */
  useEffect(() => {
    const conversationEls = [].slice.call(
      document.body.querySelectorAll('[data-conversation-content]')
    );
    for (const el of conversationEls) {
      const conversationEl = el as HTMLDivElement;
      conversationEl.scrollTop = conversationEl.scrollHeight;
    }
  }, [items]);

  /**
   * Set up VAD mode
   */
  useEffect(() => {
    changeTurnEndType('server_vad');
    
    return () => {
      // cleanup if needed
    };
  }, []);

  /**
   * Core RealtimeClient and audio capture setup
   * Set all of our instructions, tools, events and more
   */
  useEffect(() => {
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const client = clientRef.current;

    if (!client || !wavStreamPlayer) {
      console.error('Client or wavStreamPlayer not initialized');
      return;
    }

    try {
      client.updateSession({ instructions });
      client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });
      client.updateSession({ voice: interviewerGender === 'Female' ? 'shimmer' : 'echo' });

      client.on('error', (event: any) => console.error(event));
      client.on('conversation.interrupted', async () => {
        const trackSampleOffset = await wavStreamPlayer.interrupt();
        if (trackSampleOffset?.trackId) {
          const { trackId, offset } = trackSampleOffset;
          await client.cancelResponse(trackId, offset);
        }
      });
      client.on('conversation.updated', async ({ item, delta }: any) => {
        const items = client.conversation.getItems();
        if (delta?.audio) {
          wavStreamPlayer.add16BitPCM(delta.audio, item.id);
        }
        if (item.status === 'completed' && item.formatted.audio?.length) {
          const wavFile = await WavRecorder.decode(
            item.formatted.audio,
            24000,
            24000
          );
          item.formatted.file = wavFile;
        }
        
        // Process conversation for metrics
        if (item.status === 'completed' && item.role === 'assistant' && item.formatted.text) {
          // Check if the response contains a hint
          if (item.formatted.text.startsWith('HINT:')) {
            setInterviewMetrics(prev => ({
              ...prev,
              hintsRequested: prev.hintsRequested + 1
            }));
          }
          
          // Store the message for later analysis
          setInterviewMetrics(prev => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                role: 'interviewer',
                content: item.formatted.text,
                timestamp: new Date()
              }
            ]
          }));
        }
        
        if (item.status === 'completed' && item.role === 'user' && item.formatted.text) {
          // Store user messages for analysis
          setInterviewMetrics(prev => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                role: 'user',
                content: item.formatted.text,
                timestamp: new Date()
              }
            ]
          }));
        }
        
        setItems(items);
      });

      setItems(client.conversation.getItems());
    } catch (error) {
      console.error('Error setting up realtime client:', error);
    }

    return () => {
      // cleanup; resets to defaults
      try {
        if (client && client.reset) {
          client.reset();
        }
      } catch (error) {
        console.error('Error resetting client:', error);
      }
    };
  }, [interviewerGender]);

  // Update session instructions whenever they change
  useEffect(() => {
    try {
      const client = clientRef.current;
      if (client && client.updateSession) {
        client.updateSession({ instructions });
      }
    } catch (error) {
      console.error('Error updating session instructions:', error);
    }
  }, [instructions]);

  // Update metrics when code context changes
  useEffect(() => {
    try {
      const client = clientRef.current;
      if (isConnected && client && client.isConnected && typeof client.isConnected === 'function' && client.isConnected()) {
        // Update the AI with the latest code context
        client.sendUserMessageContent([
          {
            type: 'input_text',
            text: `The current code context is: ${codeContext}`
          }
        ]);
      }
    } catch (error) {
      console.error('Error sending code context to AI:', error);
      // Don't crash the app if there's an error
    }
  }, [codeContext, isConnected]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  // Handle drag movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep button within viewport bounds
      const maxX = window.innerWidth - 150;
      const maxY = window.innerHeight - 60;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Update position on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 150),
        y: Math.min(prev.y, window.innerHeight - 60)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Render the application
   */
  return (
    <div>
      <div 
        className="fixed z-50 cursor-move"
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          transition: isDragging ? 'none' : 'all 0.1s ease'
        }}
        onMouseDown={handleMouseDown}
      >
        <Button
          variant="contained"
          size="large"
          className={`shadow-lg transition-all duration-300 ${isDragging ? 'scale-105' : ''}`}
          style={{
            backgroundColor: isConnected ? '#ef4444' : '#4f46e5',
            borderRadius: '24px',
            padding: '10px 20px',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          startIcon={isConnected ? <X /> : <Mic />}
          onClick={
            isConnected ? disconnectConversation : connectConversation
          }
        >
              {isConnected ? 'End Interview' : 'Start Interview'}
        </Button>
      </div>
    </div>
  );
};

// Export the interview metrics to make them available to other components
export const getInterviewMetrics = (): InterviewMetrics | null => {
  const metrics = sessionStorage.getItem('interviewMetrics');
  return metrics ? JSON.parse(metrics) : null;
};
