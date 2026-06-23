import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/resources';
import { useAuth } from '../auth/AuthContext';
import { ApiException } from '../api/client';
import { ErrorBanner } from '../components/ui';

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register({ fullName, email, password });
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-brand-700">TalentBoard</h1>
          <p className="mt-1 text-sm text-slate-500">Create your candidate account</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <ErrorBanner message={error} />}
          <div>
            <label className="label" htmlFor="fullName">Full name</label>
            <input id="fullName" className="input" value={fullName}
              onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
