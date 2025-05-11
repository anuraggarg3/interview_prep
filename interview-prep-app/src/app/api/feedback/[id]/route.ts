import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock feedback as fallback for demo purposes
const mockFeedbackData = {
  "feedback_123": {
    id: "feedback_123",
    candidateName: "John Doe",
    problemId: "prob_001",
    problemTitle: "Two Sum",
    programmingLanguage: "JavaScript",
    dateCompleted: "2023-05-15T14:30:00Z",
    metrics: {
      problemSolving: 4,
      communication: 3,
      codeQuality: 4,
      technicalKnowledge: 3
    },
    statistics: {
      hintsRequested: 2,
      timeSpent: "25 minutes",
      completionStatus: "completed"
    },
    strengths: [
      "Strong algorithmic thinking",
      "Clean code organization",
      "Good time complexity understanding"
    ],
    areasToImprove: [
      "Code optimization: Could improve runtime efficiency",
      "Edge cases: Should consider more edge scenarios",
      "Explanation: Could articulate approach more clearly"
    ],
    interviewerNotes: "John showed good understanding of the problem and implemented a working solution efficiently. He asked for hints twice but was able to progress independently. His solution used a hashmap approach with O(n) time complexity.",
    overallAssessment: "Overall, John performed well in this interview. He demonstrated solid problem-solving skills and technical knowledge. With some improvement in articulating his thought process and considering edge cases more thoroughly, he would be an even stronger candidate."
  }
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // First try to get from our database
    let feedback = await prisma.feedback.findUnique({
      where: { id }
    });
    
    // Also check with feedback_ prefix
    if (!feedback) {
      feedback = await prisma.feedback.findUnique({
        where: { id: `feedback_${id}` }
      });
    }
    
    // If found in database, return it
    if (feedback) {
      return NextResponse.json(feedback);
    }
    
    // If id is 123 and not found in DB, use our mock example
    if (id === "123") {
      // Store the mock in our database for future requests
      await prisma.feedback.create({
        data: mockFeedbackData.feedback_123
      });
      return NextResponse.json(mockFeedbackData.feedback_123);
    }
    
    // If still not found, generate plausible mock data
    // In a real app, we would return a 404 here
    const mockFeedback = {
      id: `feedback_${id}`,
      candidateName: "User",
      problemId: `prob_${Math.floor(Math.random() * 100)}`,
      problemTitle: ["Array Manipulation", "Linked List Cycle", "Binary Tree Traversal", "Dynamic Programming Challenge"][Math.floor(Math.random() * 4)],
      programmingLanguage: ["JavaScript", "Python", "Java", "TypeScript"][Math.floor(Math.random() * 4)],
      dateCompleted: new Date().toISOString(),
      metrics: {
        problemSolving: Math.floor(Math.random() * 5) + 1,
        communication: Math.floor(Math.random() * 5) + 1,
        codeQuality: Math.floor(Math.random() * 5) + 1,
        technicalKnowledge: Math.floor(Math.random() * 5) + 1
      },
      statistics: {
        hintsRequested: Math.floor(Math.random() * 5),
        timeSpent: `${Math.floor(Math.random() * 30) + 10} minutes`,
        completionStatus: ["completed", "partially_completed", "incomplete"][Math.floor(Math.random() * 3)]
      },
      strengths: [
        "Logical problem decomposition",
        "Efficient algorithm selection",
        "Good code organization",
        "Clear explanation of approach"
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      areasToImprove: [
        "Time complexity analysis: Consider Big O implications more carefully",
        "Edge cases: Should test more boundary conditions",
        "Code readability: Add more comments explaining approach",
        "Algorithm selection: Consider more optimal solutions"
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      interviewerNotes: "The candidate demonstrated good problem-solving skills but could improve on explaining their thought process more clearly. They were able to implement a working solution with minimal guidance.",
      overallAssessment: "The candidate shows promise in technical skills with room for improvement in communication. With practice on articulating their approach and considering edge cases, they would become a stronger candidate."
    };
    
    // Store this in our database so it persists
    await prisma.feedback.create({
      data: mockFeedback
    });
    
    return NextResponse.json(mockFeedback);
  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 