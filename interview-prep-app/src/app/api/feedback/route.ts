import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

// This would typically connect to your database
// For now, we'll use a simple in-memory store
const feedbackStore: Record<string, any> = {};

export async function POST(request: Request) {
  try {
    // In a real app, you would verify the user's session here
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const feedback = await request.json();
    
    // Validate the required fields
    if (!feedback.candidateName || !feedback.problemId || !feedback.problemTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Generate a unique ID for the feedback if not provided
    const feedbackId = feedback.id || `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add the current date if not provided
    if (!feedback.dateCompleted) {
      feedback.dateCompleted = new Date().toISOString();
    }
    
    // Store the feedback data with the ID as the key
    const storedFeedback = {
      id: feedbackId,
      ...feedback
    };
    
    // Save to our simulated database using our prisma utility
    await prisma.feedback.create({
      data: storedFeedback
    });
    
    return NextResponse.json({ 
      success: true,
      feedbackId,
      message: 'Feedback saved successfully' 
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // In a real app, you would verify the user's session here
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Get the URL object to extract query parameters
    const url = new URL(request.url);
    const feedbackId = url.searchParams.get('id');
    
    if (feedbackId) {
      // Return a specific feedback
      const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId }
      });
      
      if (!feedback) {
        return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
      }
      
      return NextResponse.json(feedback);
    }
    
    // Return all feedback (in a real app, you would add pagination)
    const allFeedback = await prisma.feedback.findMany();
    
    // Sort by date (most recent first)
    allFeedback.sort((a, b) => {
      return new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime();
    });
    
    return NextResponse.json(allFeedback);
  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 