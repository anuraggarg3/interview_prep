import { useEffect, useRef, useCallback, useState } from 'react';

import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '@/lib/wavtools/index.js';

import { X, Mic, Play, RefreshCw } from 'react-feather';
import { Button } from '@mui/material';


type Props = {
  scrapedContent: string;
};

export const VoiceChat: React.FC<Props> = ({ scrapedContent }) => {
  const apiKey =process.env.OPENAI_API_KEY || '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';
  const instructions = `SYSTEM SETTINGS:
------
INSTRUCTIONS:
- You are an AI interviewer conducting a technical interview.
- Ask specific questions related to the candidate's coding skills, problem-solving abilities, and technical knowledge.
- Provide a realistic interview experience with follow-up questions based on the candidate's responses.
- Keep your responses concise and professional, under 200 characters when possible.
- Focus on assessing the candidate's technical abilities in a structured manner.
- Provide constructive feedback when appropriate.

------
PERSONALITY:
- Professional and encouraging
- Clear and articulate
- Maintain a formal interview tone

------
INTERVIEW CONTEXT:

${scrapedContent}
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


  /**
   * Connect to conversation:
   * WavRecorder takes speech input, WavStreamPlayer output, client is API client
   */
  const connectConversation = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    startTimeRef.current = new Date().toISOString();
    setIsConnected(true);
    setItems(client.conversation.getItems());

    // Connect to microphone
    await wavRecorder.begin();

    // Connect to audio output
    await wavStreamPlayer.connect();

    // Connect to realtime API
    await client.connect();
    client.sendUserMessageContent([
      {
        type: `input_text`,
        text: `Hello!`, // Can change this initial text
      },
    ]);

    if (client.getTurnDetectionType() === 'server_vad') {
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
    }
  }, []);

  /**
   * Disconnect and reset conversation state
   */
  const disconnectConversation = useCallback(async () => {
    setIsConnected(false);
    setItems([]);

    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    // First pause recording to stop audio chunks from being processed
    if (wavRecorder.getStatus() === 'recording') {
      await wavRecorder.pause();
    }
    
    // Reset the chunk processor to an empty function
    await wavRecorder.record(() => {}, 8192);
    await wavRecorder.pause();
    
    // Now disconnect the client
    client.disconnect();
    
    // Clean up recorder and player
    await wavRecorder.end();
    await wavStreamPlayer.interrupt();
  }, []);

  const deleteConversationItem = useCallback(async (id: string) => {
    const client = clientRef.current;
    client.deleteItem(id);
  }, []);

  /**
   * Switch between Manual <> VAD mode for communication
   */
  const changeTurnEndType = async (value: string) => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    if (value === 'none' && wavRecorder.getStatus() === 'recording') {
      await wavRecorder.pause();
    }
    client.updateSession({
      turn_detection: value === 'none' ? null : { type: 'server_vad' },
    });
    if (value === 'server_vad' && client.isConnected()) {
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
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

    client.updateSession({ instructions: instructions });
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });
    client.updateSession({ voice: 'echo' });

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
      setItems(items);
    });

    setItems(client.conversation.getItems());

    return () => {
      // cleanup; resets to defaults
      client.reset();
    };
  }, []);



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
