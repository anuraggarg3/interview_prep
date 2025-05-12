import RegisterForm from '@/components/auth/RegisterForm';
import { Metadata } from 'next';
import Logo from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Register | Interview Prep',
  description: 'Create an account for Interview Prep',
};

export default function Register() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      {/* Header */}
      <header className="bg-transparent backdrop-blur-sm ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Logo />
        </div>
      </header>

      <main className="flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 mt-12">
            <h1 className="text-3xl font-bold text-indigo-600 mb-2">Create an Account</h1>
            <p className="text-gray-600">Get started with your interview preparation</p>
          </div>
          <RegisterForm />
        </div>
      </main>
    </div>
  );
} 