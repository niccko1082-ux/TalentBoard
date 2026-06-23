import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { applicationApi, vacancyApi } from '../api/resources';
import { PageHeader, Spinner } from '../components/ui';
import { humanize } from '../lib/format';

export function DashboardPage() {
  const { user } = useAuth();
  const [openVacancies, setOpenVacancies] = useState<number | null>(null);
  const [applications, setApplications] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([vacancyApi.list(), applicationApi.list()])
      .then(([vacancies, apps]) => {
        setOpenVacancies(vacancies.filter((v) => v.status === 'OPEN').length);
        setApplications(apps.length);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const isCandidate = user.role === 'CANDIDATE';

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.fullName.split(' ')[0]}`}
        subtitle={`You are signed in as ${humanize(user.role)}.`}
      />
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/vacancies" className="card transition hover:ring-brand-300">
            <div className="text-sm text-slate-500">Open vacancies</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{openVacancies ?? '—'}</div>
          </Link>
          <Link to="/applications" className="card transition hover:ring-brand-300">
            <div className="text-sm text-slate-500">
              {isCandidate ? 'My applications' : 'Applications in the pipeline'}
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{applications ?? '—'}</div>
          </Link>
        </div>
      )}

      <div className="mt-8 card">
        <h2 className="mb-2 text-lg font-semibold text-slate-800">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/vacancies" className="btn-secondary">Browse vacancies</Link>
          {(user.role === 'ADMIN' || user.role === 'RECRUITER') && (
            <Link to="/vacancies/new" className="btn-primary">Create a vacancy</Link>
          )}
          <Link to="/applications" className="btn-secondary">
            {isCandidate ? 'Track my applications' : 'Review applications'}
          </Link>
          {user.role === 'ADMIN' && (
            <Link to="/users" className="btn-secondary">Manage users</Link>
          )}
        </div>
      </div>
    </div>
  );
}
