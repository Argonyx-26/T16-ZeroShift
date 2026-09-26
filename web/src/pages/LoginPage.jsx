import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import PenguMascot from '../components/common/PenguMascot';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        // EXPLICIT REQUIREMENT: Login redirects DIRECTLY to DASHBOARD
        navigate('/dashboard');
      } else {
        setError(res.error || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 pixel-grid-dots">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Pengu Mascot Welcome */}
        <div className="flex justify-center mb-3">
          <PenguMascot
            pose="wave"
            size="lg"
            speech="Welcome back!"
            speechPosition="top"
            alt="Pengu Login Mascot"
          />
        </div>

        <h1 className="font-pixel text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          Sign In to PenguLearn
        </h1>
        <p className="mt-1 text-xs text-ink-secondary">
          Continue your adaptive study streak and take diagnostic tests.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-surface py-8 px-6 sm:px-10 border-2 border-slate-900 shadow-pixel-lg rounded-3xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-error-soft border-2 border-error flex items-start gap-2.5 text-xs text-error font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-pixel font-bold text-ink uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@argonyx.edu"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border-2 border-slate-300 focus:border-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-pixel font-bold text-ink uppercase">
                  Password
                </label>
                <span className="text-[11px] text-ink-secondary hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border-2 border-slate-300 focus:border-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 pixel-btn-primary !py-2.5 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Signing In...' : 'Sign In to Dashboard'}</span>
            </button>
          </form>

          {/* Quick Demo credentials helper */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-[11px] text-ink-secondary">
              Demo access: <strong className="text-ink">demo@argonyx.edu</strong> / <strong className="text-ink">pass1234</strong>
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-ink-secondary">
              New learner?{' '}
              <Link
                to="/register"
                className="font-pixel font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Create an account</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
