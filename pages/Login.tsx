
import React, { useState, ReactNode } from 'react';
// FIX: Using named imports for react-router-dom to resolve module export issues.
import { useNavigate, Navigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { Code } from 'lucide-react';
import Alert from '../components/ui/Alert';
import { FirebaseError } from '@firebase/app';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | ReactNode>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      if (err instanceof FirebaseError && err.code === 'auth/invalid-credential') {
        setError(
          <>
            <p className="mb-2">This error means the email or password is incorrect. To log in, you must first create a user in your Firebase project.</p>
            <p className="font-medium mt-3 mb-1">How to fix this:</p>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-500">Firebase Console</a>.</li>
              <li>Select your project (<code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded">brotech-web-solutions</code>).</li>
              <li>Go to the <strong>Authentication</strong> section.</li>
              <li>Under the <strong>Users</strong> tab, click <strong>Add user</strong>.</li>
              <li>Create an account, then use those credentials to log in here.</li>
            </ol>
          </>
        );
      } else {
        setError('An unexpected error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-3">
          <Code className="text-primary-600 h-10 w-auto" />
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            BroTech Admin Panel
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
             {error && (
              <Alert title="Login Failed">
                {error}
              </Alert>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner className="h-5 w-5"/> : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
