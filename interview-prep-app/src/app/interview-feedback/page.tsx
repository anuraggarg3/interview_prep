'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FeedbackReportCard from '@/components/FeedbackReportCard';

interface FeedbackData {
  id: string;
  candidateName: string;
  problemId: string;
  problemTitle: string;
  programmingLanguage: string;
  dateCompleted: string;
  metrics: {
    problemSolving: number;
    communication: number;
    codeQuality: number;
    technicalKnowledge: number;
  };
  statistics: {
    hintsRequested: number;
    timeSpent: string;
    completionStatus: 'completed' | 'partially_completed' | 'incomplete';
  };
  strengths: string[];
  areasToImprove: string[];
  interviewerNotes: string;
  overallAssessment: string;
}

export default function InterviewFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = searchParams.get('id');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Fetch feedback data if we have an interview ID
    if (interviewId) {
      fetchFeedback(interviewId);
    } else {
      // If no ID provided, check if there's recent feedback in session storage
      const cachedFeedback = sessionStorage.getItem('interviewFeedback');
      if (cachedFeedback) {
        try {
          const parsedFeedback = JSON.parse(cachedFeedback) as FeedbackData;
          setFeedback(parsedFeedback);
          
          // Save this to our database to ensure persistence
          saveFeedbackToDatabase(parsedFeedback);
          
          setLoading(false);
        } catch (error) {
          console.error('Error parsing cached feedback:', error);
          router.push('/dashboard');
        }
      } else {
        // No feedback data available, redirect to dashboard
        router.push('/dashboard');
      }
    }
  }, [interviewId, router]);

  const fetchFeedback = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/feedback/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      const data = await response.json();
      setFeedback(data);
      
      // Cache the feedback in session storage
      sessionStorage.setItem('interviewFeedback', JSON.stringify(data));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setLoading(false);
    }
  };

  const saveFeedbackToDatabase = async (feedbackData: FeedbackData) => {
    try {
      // Only save if it has the required fields
      if (!feedbackData.id || !feedbackData.problemTitle) {
        return;
      }
      
      // Send the feedback data to our API to save in the database
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });
      
      if (!response.ok) {
        console.error('Failed to save feedback to database');
      }
    } catch (error) {
      console.error('Error saving feedback to database:', error);
    }
  };

  const handleReturnToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">Interview Assessment</h1>
          <p className="text-gray-600">Review your interview performance and feedback</p>
        </div>
        
        {feedback ? (
          <FeedbackReportCard feedback={feedback} />
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold text-red-500 mb-4">Feedback Not Available</h2>
            <p className="text-gray-600 mb-6">We couldn't retrieve your interview feedback. Please try again later.</p>
            <button 
              onClick={handleReturnToDashboard}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  );
} 