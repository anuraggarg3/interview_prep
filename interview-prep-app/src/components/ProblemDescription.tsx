'use client';

import React, { useState, useEffect, useRef } from 'react';

// Sample problems for different focus areas
const dsaProblems = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
    
You may assume that each input would have exactly one solution, and you may not use the same element twice.
    
Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
    
Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]`,
    hints: [
      'Consider using a hash map to store previously seen values.',
      'For each number, check if target - number is already in the hash map.',
      'Time complexity can be O(n) if you use a hash map approach.'
    ],
  },
  {
    id: 2,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Example 1:
Input: s = "()"
Output: true

Example 2:
Input: s = "()[]{}"
Output: true

Example 3:
Input: s = "(]"
Output: false`,
    hints: [
      'Consider using a stack data structure.',
      'Push opening brackets onto the stack.',
      'When encountering a closing bracket, check if it matches the top of the stack.'
    ],
  },
  {
    id: 3,
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    description: `You are given the heads of two sorted linked lists list1 and list2.

Merge the two lists in a one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.

Example 1:
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]

Example 2:
Input: list1 = [], list2 = []
Output: []

Example 3:
Input: list1 = [], list2 = [0]
Output: [0]`,
    hints: [
      'You can create a dummy head to simplify the logic.',
      'Compare the values of the two lists and append the smaller one to your result list.',
      'Don\'t forget to handle the case when one list is empty but the other isn\'t.'
    ],
  },
];

interface ProblemDescriptionProps {
  focusArea: string;
}

const ProblemDescription: React.FC<ProblemDescriptionProps> = ({ focusArea }) => {
  // We could have different problems based on the focus area
  // Currently we're just using DSA problems as a demo
  const problems = focusArea === 'DSA' ? dsaProblems : dsaProblems;
  
  // Randomly select a problem for the session
  const [selectedProblem] = useState(() => {
    const randomIndex = Math.floor(Math.random() * problems.length);
    return problems[randomIndex];
  });
  
  const [showHints, setShowHints] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure the container adapts to size changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      // Just having the observer is enough to trigger re-renders on resize
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="bg-white rounded-lg shadow-md h-full flex flex-col"
    >
      <div className="p-4 flex-grow overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{selectedProblem.title}</h2>
          <span className={`px-3 py-1 rounded-full text-sm ${
            selectedProblem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
            selectedProblem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {selectedProblem.difficulty}
          </span>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <pre className="whitespace-pre-wrap text-gray-700 font-mono text-sm">
            {selectedProblem.description}
          </pre>
        </div>
        
        <div className="mt-6">
          <button
            onClick={() => setShowHints(!showHints)}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </button>
          
          {showHints && (
            <div className="mt-3 space-y-2">
              {selectedProblem.hints.map((hint, index) => (
                <div key={index} className="bg-indigo-50 p-3 rounded-md text-sm text-gray-700">
                  <span className="font-medium text-indigo-700">Hint {index + 1}: </span>
                  {hint}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemDescription; 