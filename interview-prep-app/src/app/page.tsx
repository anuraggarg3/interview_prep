import LoginForm from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Interview Prep',
  description: 'Login to your Interview Prep account',
};

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">Interview Prep</h1>
          <p className="text-gray-600">Practice your interview skills with AI-powered feedback</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
