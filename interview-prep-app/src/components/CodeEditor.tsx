'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useRouter } from 'next/navigation';
import { getInterviewMetrics } from '@/app/interview/Interview-assistant';

type CodeEditorProps = {
  language: string;
  onCodeChange?: (code: string) => void;
  problemId?: string | number;
  problemTitle?: string;
}

// Map the user-friendly language name to Monaco Editor language ID
const languageMap: Record<string, string> = {
  'JavaScript': 'javascript',
  'TypeScript': 'typescript',
  'Python': 'python',
  'Java': 'java',
  'C++': 'cpp',
  'Go': 'go',
  'Rust': 'rust',
};

// Default code snippets by language
const defaultCode: Record<string, string> = {
  'javascript': '// JavaScript code\nfunction solution(input) {\n  // Your code here\n  return result;\n}\n',
  'typescript': '// TypeScript code\nfunction solution(input: any): any {\n  // Your code here\n  return result;\n}\n',
  'python': '# Python code\ndef solution(input):\n    # Your code here\n    return result\n',
  'java': '// Java code\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n\n    public static Object solution(Object input) {\n        // Your code here\n        return result;\n    }\n}\n',
  'cpp': '// C++ code\n#include <iostream>\nusing namespace std;\n\nint solution(int input) {\n    // Your code here\n    return result;\n}\n\nint main() {\n    // Test your solution\n    return 0;\n}\n',
  'go': '// Go code\npackage main\n\nimport "fmt"\n\nfunc solution(input interface{}) interface{} {\n    // Your code here\n    return result\n}\n\nfunc main() {\n    // Test your solution\n}\n',
  'rust': '// Rust code\nfn solution(input: i32) -> i32 {\n    // Your code here\n    return result;\n}\n\nfn main() {\n    // Test your solution\n}\n',
};

// Code editor themes
const editorThemes = [
  { label: 'Light', value: 'vs' },
  { label: 'Dark', value: 'vs-dark' },
  { label: 'High Contrast', value: 'hc-black' },
];

const CodeEditor: React.FC<CodeEditorProps> = ({ language, onCodeChange, problemId, problemTitle }) => {
  const [code, setCode] = useState<string>('');
  const [theme, setTheme] = useState<string>('vs-dark');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const monacoLanguage = languageMap[language] || 'javascript';
  const router = useRouter();
  
  useEffect(() => {
    // Set the default code snippet based on the language
    const initial = defaultCode[monacoLanguage] || defaultCode['javascript'];
    setCode(initial);
    if (onCodeChange) onCodeChange(initial);
  }, [monacoLanguage]);

  // Handler for Monaco Editor's onMount event to fix resizing issues
  const handleEditorDidMount = (editor: any) => {
    // Add a window resize listener to ensure editor layout is updated
    const handleResize = () => {
      editor.layout();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Handle parent container resize (using ResizeObserver if available)
    if (typeof ResizeObserver !== 'undefined') {
      const editorElement = editor.getDomNode();
      if (editorElement && editorElement.parentElement) {
        const resizeObserver = new ResizeObserver(() => {
          editor.layout();
        });
        resizeObserver.observe(editorElement.parentElement);
        
        // Cleanup observer on unmount
        return () => {
          resizeObserver.disconnect();
          window.removeEventListener('resize', handleResize);
        };
      }
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      if (onCodeChange) onCodeChange(value);
    }
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Get interview metrics from session storage
      const metrics = getInterviewMetrics();
      
      if (!metrics) {
        console.error('No interview metrics found');
        alert('Please complete an interview before submitting');
        setIsSubmitting(false);
        return;
      }
      
      // Get user data from local storage
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : { name: 'Anonymous User' };
      
      // Calculate time spent
      let timeSpent = '0 minutes';
      if (metrics.startTime && metrics.endTime) {
        const start = new Date(metrics.startTime);
        const end = new Date(metrics.endTime);
        const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
        timeSpent = `${diffMinutes} minutes`;
      }
      
      // Basic code analysis
      const codeLength = code.length;
      const commentCount = (code.match(/\/\/|\/\*|\*\/|#/g) || []).length;
      const codeQualityScore = Math.min(5, Math.max(1, Math.round((codeLength > 50 ? 3 : 1) + (commentCount > 3 ? 2 : 0))));
      
      // Analyze messages for communication skills
      const userMessages = metrics.messages.filter(m => m.role === 'user');
      const avgMessageLength = userMessages.length > 0 
        ? userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length
        : 0;
      const communicationScore = Math.min(5, Math.max(1, Math.round(avgMessageLength > 50 ? 4 : avgMessageLength > 20 ? 3 : 2)));
      
      // Determine problem solving score based on hints and time
      const problemSolvingScore = Math.min(5, Math.max(1, 5 - metrics.hintsRequested));
      
      // Generate feedback data
      const feedbackData = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        candidateName: user.name || 'Anonymous User',
        problemId: problemId ? String(problemId) : 'unknown',
        problemTitle: problemTitle || 'Coding Challenge',
        programmingLanguage: language,
        dateCompleted: new Date().toISOString(),
        metrics: {
          problemSolving: problemSolvingScore,
          communication: communicationScore,
          codeQuality: codeQualityScore,
          technicalKnowledge: metrics.hintsRequested > 3 ? 2 : metrics.hintsRequested > 1 ? 3 : 4
        },
        statistics: {
          hintsRequested: metrics.hintsRequested,
          timeSpent: timeSpent,
          completionStatus: code.length > 100 ? 'completed' : code.length > 50 ? 'partially_completed' : 'incomplete'
        },
        strengths: [
          problemSolvingScore >= 4 ? "Strong problem-solving skills" : null,
          communicationScore >= 4 ? "Clear communication of thought process" : null,
          codeQualityScore >= 4 ? "Well-structured and documented code" : null,
          metrics.hintsRequested === 0 ? "Independent problem solving without hints" : null
        ].filter(Boolean) as string[],
        areasToImprove: [
          problemSolvingScore < 3 ? "Problem decomposition: Break down problems into smaller steps" : null,
          communicationScore < 3 ? "Communication: Articulate your thought process more clearly" : null,
          codeQualityScore < 3 ? "Code quality: Improve code organization and add more comments" : null,
          metrics.hintsRequested > 2 ? "Technical knowledge: Review fundamental concepts in this area" : null
        ].filter(Boolean) as string[],
        interviewerNotes: "The candidate worked through the problem with varying degrees of assistance. Review the interview transcript for detailed interactions.",
        overallAssessment: generateOverallAssessment(problemSolvingScore, communicationScore, codeQualityScore, metrics.hintsRequested)
      };
      
      // Store in sessionStorage for access on the feedback page
      sessionStorage.setItem('interviewFeedback', JSON.stringify(feedbackData));
      
      // Send to API (in a production app)
      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feedbackData),
        });
        
        if (response.ok) {
          const result = await response.json();
          // Navigate to feedback page with the ID
          router.push(`/interview-feedback?id=${result.feedbackId}`);
        } else {
          // If API fails, still navigate to feedback page using the cached data
          router.push('/interview-feedback');
        }
      } catch (error) {
        console.error('Error saving feedback:', error);
        // Still navigate to feedback page using the cached data
        router.push('/interview-feedback');
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      alert('There was an error generating your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate an overall assessment based on scores
  const generateOverallAssessment = (
    problemSolving: number, 
    communication: number, 
    codeQuality: number, 
    hintsRequested: number
  ): string => {
    const average = (problemSolving + communication + codeQuality) / 3;
    
    if (average >= 4) {
      return `Excellent performance! You demonstrated strong problem-solving abilities and communicated your thought process clearly. Your code is well-structured${hintsRequested === 0 ? ' and you completed the task without requiring hints' : ', though you required some assistance'}.`;
    } else if (average >= 3) {
      return `Good performance. You showed solid understanding of the problem and produced a working solution${hintsRequested > 2 ? ', though you required several hints' : ''}. Continue practicing to improve your ${problemSolving < 3 ? 'problem-solving approach' : codeQuality < 3 ? 'code quality' : 'communication skills'}.`;
    } else {
      return `You made progress on the problem but had some difficulties. Focus on improving your ${problemSolving < 2 ? 'problem-solving methodology' : codeQuality < 2 ? 'code structure and quality' : 'ability to articulate your thought process'}. Regular practice with similar problems will help you build confidence and skill.`;
    }
  };

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Coding Interview: {language}
          </h1>
          <select
            value={theme}
            onChange={handleThemeChange}
            className="p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
          >
            {editorThemes.map((themeOption) => (
              <option key={themeOption.value} value={themeOption.value}>
                {themeOption.label} Theme
              </option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded transition-colors flex items-center space-x-2`}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Processing...</span>
              </>
            ) : (
              <span>Submit Solution</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-grow relative">
        <Editor
          height="100%"
          defaultLanguage={monacoLanguage}
          language={monacoLanguage}
          value={code}
          theme={theme}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            formatOnType: true,
            formatOnPaste: true,
            autoIndent: 'full',
            tabSize: 2,
            wordWrap: 'on',
            folding: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            },
            suggestSelection: 'first',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoSurround: 'languageDefined',
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor; 