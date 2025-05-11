'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { VoiceChat } from './Interview-assistant';
// Dynamically import components to prevent SSR issues
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { ssr: false });
const ProblemDescription = dynamic(() => import('@/components/ProblemDescription'), { ssr: false });

export default function InterviewPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [splitPosition, setSplitPosition] = useState(33); // Default split at 33%
  const [isDragging, setIsDragging] = useState(false);
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
        <ProblemDescription focusArea={getFocusArea()} />
      </div>
      <VoiceChat scrapedContent={getFocusArea()} />
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
    </div>
  );
} 