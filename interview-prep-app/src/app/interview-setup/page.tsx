'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InterviewSetupForm from '@/components/InterviewSetupForm';

export default function InterviewSetup() {
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">Interview Setup</h1>
          <p className="text-gray-600">Customize your interview experience</p>
        </div>
        <InterviewSetupForm />
      </div>
    </main>
  );
} 