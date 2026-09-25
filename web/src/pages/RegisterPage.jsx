import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import PenguMascot from '../components/common/PenguMascot';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      setError('Password must be at least 8 characters and contain both letters and numbers.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(name, email, password);
      if (res.success) {
        // EXPLICIT REQUIREMENT: Registration redirects DIRECTLY to QUESTION PAGE
        // Do NOT redirect newly registered users to the dashboard.
        navigate('/question');
      } else {
        setError(res.error || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 pixel-grid-dots">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Pengu Mascot with Excited Pointer pose */}
        <div className="flex justify-center mb-3">
          <PenguMascot
            pose="point"
            size="lg"
            speech="Start your journey!"
            speechPosition="top"
            alt="Pengu Onboarding Mascot"
          />
        </div>

        <h1 className="font-pixel text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          Join PenguLearn
        </h1>
        <p className="mt-1 text-xs text-ink-secondary">
          Create an account to start your personalized adaptive diagnostic.
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
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border-2 border-slate-300 focus:border-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

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
                  placeholder="ada@argonyx.edu"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border-2 border-slate-300 focus:border-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-pixel font-bold text-ink uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 chars with letter & number"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border-2 border-slate-300 focus:border-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-primary/20 text-xs text-primary font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0 text-warning" />
              <span>Registration leads immediately to your first diagnostic question.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 pixel-btn-primary !py-2.5 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Profile...' : 'Register & Start Diagnostic'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-ink-secondary">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-pixel font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Sign in here</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
