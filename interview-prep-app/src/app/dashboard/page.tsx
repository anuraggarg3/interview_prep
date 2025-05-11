'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type User = {
  id: string;
  name: string;
  email: string;
  interviewPreferences?: {
    experienceLevel?: string;
    focusArea?: string;
    interviewerGender?: string;
    programmingLanguage?: string;
  };
};

type FeedbackSummary = {
  id: string;
  problemTitle: string;
  programmingLanguage: string;
  dateCompleted: string;
  averageScore: number;
  completionStatus: 'completed' | 'partially_completed' | 'incomplete';
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackSummary[]>([]);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // If user hasn't completed setup, redirect to setup
      if (!parsedUser.interviewPreferences?.focusArea) {
        router.push('/interview-setup');
      }
    } catch (error) {
      console.error('Failed to parse user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch feedback history when user data is loaded
  useEffect(() => {
    if (user) {
      fetchFeedbackHistory();
    }
  }, [user]);

  const fetchFeedbackHistory = async () => {
    setIsFeedbackLoading(true);
    try {
      // In a real application, this would be a call to your API with the user's ID
      // For now, we'll simulate it with a GET request to our feedback endpoint
      const response = await fetch('/api/feedback');
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedback history');
      }
      
      const data = await response.json();
      
      // Format the feedback data for display
      const formattedFeedback = data.map((feedback: any) => ({
        id: feedback.id,
        problemTitle: feedback.problemTitle,
        programmingLanguage: feedback.programmingLanguage,
        dateCompleted: feedback.dateCompleted,
        averageScore: calculateAverageScore(feedback.metrics),
        completionStatus: feedback.statistics.completionStatus
      }));
      
      setFeedbackHistory(formattedFeedback);
    } catch (error) {
      console.error('Error fetching feedback history:', error);
      // If API fails, fallback to mock data for demonstration
      setFeedbackHistory(getMockFeedbackData());
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  const calculateAverageScore = (metrics: any) => {
    if (!metrics) return 0;
    const values = Object.values(metrics) as number[];
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const getMockFeedbackData = (): FeedbackSummary[] => {
    return [
      {
        id: 'feedback_123',
        problemTitle: 'Two Sum',
        programmingLanguage: 'JavaScript',
        dateCompleted: '2023-05-15T14:30:00Z',
        averageScore: 3.5,
        completionStatus: 'completed'
      },
      {
        id: 'feedback_456',
        problemTitle: 'Binary Tree Traversal',
        programmingLanguage: 'Python',
        dateCompleted: '2023-05-10T10:15:00Z',
        averageScore: 4.2,
        completionStatus: 'completed'
      },
      {
        id: 'feedback_789',
        problemTitle: 'Dynamic Programming Challenge',
        programmingLanguage: 'Java',
        dateCompleted: '2023-05-05T16:45:00Z',
        averageScore: 2.8,
        completionStatus: 'partially_completed'
      }
    ];
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleStartInterview = () => {
    // For DSA focus, we will navigate to the code editor
    if (user?.interviewPreferences?.focusArea === 'DSA') {
      router.push(`/interview?language=${user.interviewPreferences.programmingLanguage || 'JavaScript'}`);
    } else {
      // For other focus areas, we'll still navigate to the interview page
      // but without a specific language parameter
      router.push('/interview');
    }
  };

  const handleViewFeedback = (feedbackId: string) => {
    router.push(`/interview-feedback?id=${feedbackId}`);
  };

  const getScoreClass = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-blue-600';
    if (score >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusClass = (status: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-800';
    if (status === 'partially_completed') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Interview Prep</h1>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user?.name}</span>
            <button 
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Interview Preferences</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500 mb-1">Experience Level</p>
              <p className="font-medium">{user?.interviewPreferences?.experienceLevel || 'Not specified'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500 mb-1">Focus Area</p>
              <p className="font-medium">{user?.interviewPreferences?.focusArea || 'Not specified'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500 mb-1">Interviewer Voice</p>
              <p className="font-medium">{user?.interviewPreferences?.interviewerGender || 'Not specified'}</p>
            </div>
            
            {user?.interviewPreferences?.focusArea === 'DSA' && (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500 mb-1">Programming Language</p>
                <p className="font-medium">{user?.interviewPreferences?.programmingLanguage || 'Not specified'}</p>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <Link
              href="/interview-setup"
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
            >
              Update Preferences
            </Link>
          </div>
        </div>
        
        {/* Interview Feedback History */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Interview History</h2>
          
          {isFeedbackLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : feedbackHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Problem</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feedbackHistory.map((feedback) => (
                    <tr key={feedback.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{feedback.problemTitle}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{feedback.programmingLanguage}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(feedback.dateCompleted).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getScoreClass(feedback.averageScore)}`}>
                          {feedback.averageScore.toFixed(1)}/5
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(feedback.completionStatus)}`}>
                          {feedback.completionStatus.replace('_', ' ').charAt(0).toUpperCase() + 
                           feedback.completionStatus.replace('_', ' ').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => handleViewFeedback(feedback.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No interview feedback available yet. Complete an interview to see your results here.</p>
            </div>
          )}
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Start an Interview</h2>
          <p className="text-gray-600 mb-6">Ready to practice? Start a mock interview based on your preferences.</p>
          
          <button
            onClick={handleStartInterview}
            className="bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 transition duration-200 font-medium"
          >
            Start Interview Session
          </button>
        </div>
      </main>
    </div>
  );
} 