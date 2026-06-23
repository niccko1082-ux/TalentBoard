import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiException } from '../api/client';
import { ErrorBanner } from '../components/ui';

const DEMO = [
  { label: 'Admin', email: 'admin@talentboard.com', password: 'Admin123!' },
  { label: 'Recruiter', email: 'recruiter@talentboard.com', password: 'Recruiter123!' },
  { label: 'Candidate', email: 'candidate@talentboard.com', password: 'Candidate123!' },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiException ? 'Invalid email or password' : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(d: (typeof DEMO)[number]) {
    setEmail(d.email);
    setPassword(d.password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-brand-700">TalentBoard</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage your selection processes</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <ErrorBanner message={error} />}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={password}
              onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-center text-sm text-slate-500">
            No account?{' '}
            <Link to="/register" className="font-medium text-brand-600 hover:underline">
              Register as a candidate
            </Link>
          </p>
        </form>
        <div className="mt-4 card">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Demo accounts</p>
          <div className="flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <button key={d.email} type="button" onClick={() => fillDemo(d)} className="btn-secondary text-xs">
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
