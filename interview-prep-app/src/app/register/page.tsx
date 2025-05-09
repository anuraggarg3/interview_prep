import RegisterForm from '@/components/auth/RegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | Interview Prep',
  description: 'Create an account for Interview Prep',
};

export default function Register() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">Interview Prep</h1>
          <p className="text-gray-600">Create an account to begin your interview preparation</p>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
} 