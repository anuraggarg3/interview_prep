'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

// Dynamically import components to prevent SSR issues
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { ssr: false });
const ProblemDescription = dynamic(() => import('@/components/ProblemDescription'), { ssr: false });

export default function InterviewPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Problem Description Panel - 1/3 width */}
      <div className="w-1/3 p-4 overflow-auto">
        <ProblemDescription focusArea={getFocusArea()} />
      </div>
      
      {/* Code Editor Panel - 2/3 width */}
      <div className="w-2/3">
        <CodeEditor language={getEditorLanguage()} />
      </div>
    </div>
  );
} 