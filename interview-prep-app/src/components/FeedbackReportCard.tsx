'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Award, AlertCircle, CheckCircle, HelpCircle, MessageCircle, Code, BookOpen, Download, Share2, RefreshCw, Clock, ArrowLeft } from 'react-feather';

// Define the structure of the feedback data
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

const ProgressBar = ({ value, maxValue = 5, label, color = 'indigo' }: { value: number; maxValue?: number; label: string; color?: string }) => {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-700">{value}/{maxValue}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`bg-${color}-600 h-2.5 rounded-full`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const FeedbackReportCard = ({ feedback }: { feedback: FeedbackData }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  const handleDownloadPDF = () => {
    // Implement PDF download functionality
    console.log('Downloading PDF...');
    alert('PDF download functionality will be implemented here');
  };

  const handleShare = () => {
    // Implement sharing functionality
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleTryAgain = () => {
    // Navigate back to interview setup with the same problem
    router.push(`/interview-setup?problemId=${feedback.problemId}`);
  };

  const handleReturnToDashboard = () => {
    // Navigate to the dashboard
    router.push('/dashboard');
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-500';
    if (score >= 3) return 'text-blue-500';
    if (score >= 2) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getOverallScoreEmoji = () => {
    const average = Object.values(feedback.metrics).reduce((sum, val) => sum + val, 0) / 
                   Object.values(feedback.metrics).length;
    
    if (average >= 4.5) return '🏆';
    if (average >= 4) return '🌟';
    if (average >= 3.5) return '😊';
    if (average >= 3) return '👍';
    if (average >= 2) return '🤔';
    return '😐';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header with summary */}
      <div className="p-6 bg-indigo-600 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Interview Assessment {getOverallScoreEmoji()}</h2>
            <p className="text-indigo-100">Problem: {feedback.problemTitle}</p>
            <p className="text-indigo-100">Language: {feedback.programmingLanguage}</p>
            <p className="text-indigo-100">Date: {new Date(feedback.dateCompleted).toLocaleDateString()}</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleReturnToDashboard}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
              title="Download PDF"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
              title="Share Feedback"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="bg-gray-50 px-6 border-b">
        <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'detailed'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Detailed Analysis
          </button>
          <button
            onClick={() => setActiveTab('improvement')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'improvement'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Improvement Plan
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Award className="mr-2 text-indigo-500" size={20} />
                  Performance Metrics
                </h3>
                <ProgressBar label="Problem Solving" value={feedback.metrics.problemSolving} />
                <ProgressBar label="Communication" value={feedback.metrics.communication} />
                <ProgressBar label="Code Quality" value={feedback.metrics.codeQuality} />
                <ProgressBar label="Technical Knowledge" value={feedback.metrics.technicalKnowledge} />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <AlertCircle className="mr-2 text-indigo-500" size={20} />
                  Interview Statistics
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600 flex items-center">
                      <HelpCircle size={16} className="mr-2 text-yellow-500" />
                      Hints Requested:
                    </span>
                    <span className="font-semibold">{feedback.statistics.hintsRequested}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600 flex items-center">
                      <Clock size={16} className="mr-2 text-blue-500" />
                      Time Spent:
                    </span>
                    <span className="font-semibold">{feedback.statistics.timeSpent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center">
                      <CheckCircle size={16} className="mr-2 text-green-500" />
                      Completion Status:
                    </span>
                    <span className={`font-semibold ${
                      feedback.statistics.completionStatus === 'completed' ? 'text-green-500' :
                      feedback.statistics.completionStatus === 'partially_completed' ? 'text-yellow-500' : 
                      'text-red-500'
                    }`}>
                      {feedback.statistics.completionStatus.replace('_', ' ').charAt(0).toUpperCase() + 
                       feedback.statistics.completionStatus.replace('_', ' ').slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Star className="mr-2 text-indigo-500" size={20} />
                Overall Assessment
              </h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{feedback.overallAssessment}</p>
            </div>
          </div>
        )}
        
        {/* Detailed Analysis Tab */}
        {activeTab === 'detailed' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <CheckCircle className="mr-2 text-green-500" size={20} />
                Strengths
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 bg-green-50 p-4 rounded-lg">
                {feedback.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <AlertCircle className="mr-2 text-red-500" size={20} />
                Areas to Improve
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 bg-red-50 p-4 rounded-lg">
                {feedback.areasToImprove.map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <MessageCircle className="mr-2 text-indigo-500" size={20} />
                Interviewer Notes
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
                {feedback.interviewerNotes}
              </div>
            </div>
          </div>
        )}
        
        {/* Improvement Plan Tab */}
        {activeTab === 'improvement' && (
          <div>
            <p className="text-gray-700 mb-6">
              Based on your performance, here are some recommended resources and next steps to help you improve:
            </p>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Code className="mr-2 text-indigo-500" size={20} />
                Practice Problems
              </h3>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="mb-3 text-gray-700">Try these similar problems to improve your skills:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>
                    <a href="#" className="text-indigo-600 hover:underline">Similar Problem 1</a> - focuses on the same concepts
                  </li>
                  <li>
                    <a href="#" className="text-indigo-600 hover:underline">Similar Problem 2</a> - slightly more challenging
                  </li>
                  <li>
                    <a href="#" className="text-indigo-600 hover:underline">Similar Problem 3</a> - different approach to same concept
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <BookOpen className="mr-2 text-indigo-500" size={20} />
                Learning Resources
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="mb-3 text-gray-700">Review these resources to strengthen your understanding:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {feedback.areasToImprove.map((area, index) => (
                    <li key={index}>
                      <span className="font-medium">{area.split(':')[0]}</span>: 
                      <a href="#" className="text-blue-600 hover:underline ml-1">Related resource</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={handleReturnToDashboard}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
              >
                Return to Dashboard
              </button>
              <button
                onClick={handleTryAgain}
                className="px-6 py-3 bg-white border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors flex items-center"
              >
                <RefreshCw size={18} className="mr-2" />
                Try This Interview Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackReportCard; 