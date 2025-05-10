'use client';

import React, { useState, useEffect, useRef } from 'react';

interface VoiceInterviewerProps {
  problemTitle: string;
  problemDescription: string;
  problemDifficulty: string;
  hints: string[];
  onClose: () => void;
}

const VoiceInterviewer: React.FC<VoiceInterviewerProps> = ({
  problemTitle,
  problemDescription,
  problemDifficulty,
  hints,
  onClose,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState<{text: string, sender: 'user' | 'ai'}[]>([]);
  
  // WebRTC connection references
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Initialize Voice Chat
  const initializeVoiceChat = async () => {
    try {
      setIsConnecting(true);
      
      // Create audio element for AI voice
      const audioEl = new Audio();
      audioEl.autoplay = true;
      audioEl.volume = volume / 100;
      audioElementRef.current = audioEl;
      
      // Get ephemeral token from our server
      const tokenResponse = await fetch('/api/voice/token', {
        method: 'POST',
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to get OpenAI token');
      }
      
      const tokenData = await tokenResponse.json();
      const ephemeralToken = tokenData.client_secret.value;
      
      // Create WebRTC peer connection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;
      
      // Handle incoming audio track from the model
      pc.ontrack = (event) => {
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = event.streams[0];
        }
      };
      
      // Get user microphone access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = mediaStream;
      
      // Add local audio track to peer connection
      mediaStream.getAudioTracks().forEach(track => {
        if (pc && localStreamRef.current) {
          pc.addTrack(track, localStreamRef.current);
        }
      });
      
      // Setup data channel for communication with OpenAI
      const dataChannel = pc.createDataChannel('oai-events');
      dataChannelRef.current = dataChannel;
      
      // Handle incoming messages from OpenAI
      dataChannel.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        handleOpenAIEvent(data);
      });
      
      // Create and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Send the offer to OpenAI and get answer
      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeralToken}`,
          'Content-Type': 'application/sdp',
        },
        body: pc.localDescription?.sdp,
      });
      
      const answer = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      };
      
      await pc.setRemoteDescription(answer as RTCSessionDescriptionInit);
      
      // Send session configuration
      setTimeout(() => {
        sendSessionConfig();
      }, 500);
      
      setIsConnected(true);
      setIsConnecting(false);
      
      // Start the interview with a greeting
      setTimeout(() => {
        startInterview();
      }, 1000);
      
    } catch (error) {
      console.error('Error initializing voice chat:', error);
      setIsConnecting(false);
      alert('Failed to initialize voice chat. Please try again.');
    }
  };
  
  // Handle events from OpenAI
  const handleOpenAIEvent = (data: any) => {
    // Log for debugging
    console.log('OpenAI event:', data);
    
    // Handle different event types
    switch (data.type) {
      case 'session.created':
        console.log('Session created successfully');
        break;
        
      case 'response.create':
        setIsSpeaking(true);
        break;
        
      case 'response.done':
        setIsSpeaking(false);
        break;
        
      case 'input_audio_buffer.speech_started':
        setIsListening(true);
        break;
        
      case 'input_audio_buffer.speech_stopped':
        setIsListening(false);
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        if (data.transcript) {
          setTranscription(prev => [...prev, { text: data.transcript, sender: 'user' }]);
        }
        break;
        
      case 'response.text.delta':
        if (data.delta) {
          // For the first chunk, create a new entry
          if (!transcription.length || transcription[transcription.length - 1].sender !== 'ai') {
            setTranscription(prev => [...prev, { text: data.delta, sender: 'ai' }]);
          } else {
            // For subsequent chunks, append to the last AI message
            setTranscription(prev => {
              const newTranscription = [...prev];
              const lastIndex = newTranscription.length - 1;
              newTranscription[lastIndex] = {
                ...newTranscription[lastIndex],
                text: newTranscription[lastIndex].text + data.delta
              };
              return newTranscription;
            });
          }
        }
        break;
    }
  };
  
  // Configure the session with OpenAI
  const sendSessionConfig = () => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      const sessionConfig = {
        type: 'session.update',
        session: {
          turn_detection: { type: 'server_vad' }, // Server-side voice activity detection
          input_audio_format: 'opus',
          output_audio_format: 'opus',
          voice: 'alloy', // Can be customized
          instructions: `You are an AI technical interviewer conducting a coding interview. The candidate is working on the following problem:
          
Problem: ${problemTitle} (Difficulty: ${problemDifficulty})

${problemDescription}

Your role is to:
1. Ask questions about their approach and thought process
2. Provide hints when asked, without giving away the full solution
3. Respond like a real software developer interviewer with appropriate technical knowledge
4. Be encouraging but also realistic in your assessment

Available hints (only reveal if asked):
${hints.map((hint, index) => `Hint ${index + 1}: ${hint}`).join('\n')}

Begin by greeting the candidate and asking how they'd like to approach the problem.`,
          modalities: ['text', 'audio'],
          temperature: 0.7,
          input_audio_transcription: {
            model: 'whisper-1', // Use Whisper for transcription
          },
        },
      };
      
      dataChannelRef.current.send(JSON.stringify(sessionConfig));
    }
  };
  
  // Start the interview with an initial greeting
  const sendMessage = (message: string) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      const event = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: message }],
        },
      };
      dataChannelRef.current.send(JSON.stringify(event));
      
      // Request a response
      dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }));
    }
  };
  
  // Start the interview
  const startInterview = () => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      // Request a response without user input to start the interview
      dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }));
    }
  };
  
  // Handle volume change
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Close WebRTC connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      // Stop local media streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  return (
    <div className="fixed bottom-20 left-4 z-50 bg-white rounded-lg shadow-lg w-80 max-h-96 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-3 flex justify-between items-center">
        <h3 className="font-medium">AI Interviewer</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-white p-1 rounded hover:bg-indigo-500"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <button
            onClick={onClose}
            className="text-white p-1 rounded hover:bg-indigo-500"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Status */}
      <div className="bg-gray-100 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-700">
            {isConnected 
              ? isListening 
                ? 'Listening...' 
                : isSpeaking 
                  ? 'Speaking...' 
                  : 'Connected'
              : isConnecting 
                ? 'Connecting...' 
                : 'Disconnected'}
          </span>
        </div>
        
        {/* Volume control */}
        {isConnected && (
          <div className="flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3.5a.5.5 0 01.5.5v10a.5.5 0 01-1 0V4a.5.5 0 01.5-.5z" clipRule="evenodd" />
              <path d="M9.243 3.03a1 1 0 01.727 0l6 2A1 1 0 0117 6v8a1 1 0 01-.758.97l-6 2A1 1 0 019 16V4a1 1 0 01.243-.97z" />
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 h-2"
            />
          </div>
        )}
      </div>
      
      {/* Conversation history */}
      <div className="flex-grow overflow-y-auto p-3 space-y-3 bg-gray-50">
        {transcription.map((item, index) => (
          <div 
            key={index} 
            className={`${item.sender === 'user' ? 'bg-blue-100 ml-6' : 'bg-gray-200 mr-6'} p-2 rounded-lg text-sm`}
          >
            <div className="font-semibold mb-1">{item.sender === 'user' ? 'You' : 'Interviewer'}</div>
            <div>{item.text}</div>
          </div>
        ))}
        
        {/* Auto-scroll to bottom */}
        <div id="scroll-target"></div>
      </div>
      
      {/* Action buttons */}
      <div className="p-3 border-t border-gray-200">
        {!isConnected ? (
          <button
            onClick={initializeVoiceChat}
            disabled={isConnecting}
            className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isConnecting ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isConnecting ? 'Connecting...' : 'Start Interview'}
          </button>
        ) : (
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => sendMessage("Can you give me a hint for this problem?")}
              className="bg-indigo-100 text-indigo-700 py-1 px-3 rounded-md hover:bg-indigo-200 text-sm"
            >
              Ask for a hint
            </button>
            <button
              onClick={() => sendMessage("Let's discuss my approach")}
              className="bg-indigo-100 text-indigo-700 py-1 px-3 rounded-md hover:bg-indigo-200 text-sm"
            >
              Discuss my approach
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInterviewer; 