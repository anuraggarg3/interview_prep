'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

// Dynamically import components to prevent SSR issues
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { ssr: false });
const ProblemDescription = dynamic(() => import('@/components/ProblemDescription'), { ssr: false });
const VoiceInterviewer = dynamic(() => import('@/components/VoiceInterviewer'), { ssr: false });

export default function InterviewPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [splitPosition, setSplitPosition] = useState(33); // Default split at 33%
  const [isDragging, setIsDragging] = useState(false);
  const [showVoiceInterviewer, setShowVoiceInterviewer] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<any>(null);
  const problemDescriptionRef = useRef<any>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get('language');

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // If no programming language is specified for DSA focus, redirect to setup
      if (
        parsedUser.interviewPreferences?.focusArea === 'DSA' && 
        !parsedUser.interviewPreferences?.programmingLanguage && 
        !language
      ) {
        router.push('/interview-setup');
      }
      
    } catch (error) {
      console.error('Failed to parse user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router, language]);

  // Handle mouse down event on the resizer
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  // Handle mouse move event for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const container = document.getElementById('split-container');
      if (!container) return;
      
      // Calculate percentage position
      const containerRect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Limit the range (min 20%, max 80%)
      if (newPosition >= 20 && newPosition <= 80) {
        setSplitPosition(newPosition);
      }
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
  }, [isDragging]);

  // Toggle voice interviewer
  const toggleVoiceInterviewer = () => {
    if (!showVoiceInterviewer) {
      // Get current problem data from the ProblemDescription component ref
      if (problemDescriptionRef.current && problemDescriptionRef.current.getCurrentProblem) {
        const problem = problemDescriptionRef.current.getCurrentProblem();
        setCurrentProblem(problem);
      }
    }
    setShowVoiceInterviewer(prev => !prev);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Determine which language to use for the editor
  const getEditorLanguage = () => {
    // If language is passed via query param, use that
    if (language) {
      return language;
    }
    
    // Otherwise use the user's preferred language from their profile
    if (user?.interviewPreferences?.programmingLanguage) {
      return user.interviewPreferences.programmingLanguage;
    }
    
    // Default to JavaScript if nothing is specified
    return 'JavaScript';
  };

  const getFocusArea = () => {
    return user?.interviewPreferences?.focusArea || 'DSA';
  };

  return (
    <div id="split-container" className="flex min-h-screen bg-gray-50 relative">
      {/* Problem Description Panel - Resizable width */}
      <div style={{ width: `${splitPosition}%` }} className="p-4 overflow-auto">
        <ProblemDescription 
          focusArea={getFocusArea()} 
          ref={problemDescriptionRef}
        />
      </div>
      
      {/* Resizer handle */}
      <div 
        className="w-2 hover:w-4 bg-gray-300 hover:bg-indigo-500 cursor-col-resize active:bg-indigo-700 transition-all flex items-center justify-center"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'col-resize' : 'col-resize' }}
      >
        <div className="h-8 w-1 bg-gray-500 rounded-full opacity-50"></div>
      </div>
      
      {/* Code Editor Panel - Remaining width */}
      <div style={{ width: `${100 - splitPosition}%` }}>
        <CodeEditor language={getEditorLanguage()} />
      </div>
      
      {/* Voice Interviewer Toggle Button */}
      <button
        onClick={toggleVoiceInterviewer}
        className="fixed bottom-4 left-4 z-40 flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-full shadow-lg transition-all"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
        </svg>
        <span>{showVoiceInterviewer ? 'Hide Interviewer' : 'Talk to Interviewer'}</span>
      </button>
      
      {/* Voice Interviewer Component */}
      {showVoiceInterviewer && currentProblem && (
        <VoiceInterviewer
          problemTitle={currentProblem.title}
          problemDescription={currentProblem.description}
          problemDifficulty={currentProblem.difficulty}
          hints={currentProblem.hints}
          onClose={() => setShowVoiceInterviewer(false)}
        />
      )}
    </div>
  );
} 