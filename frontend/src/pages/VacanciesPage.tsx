import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { vacancyApi } from '../api/resources';
import type { Vacancy } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Badge, EmptyState, ErrorBanner, PageHeader, Spinner } from '../components/ui';
import { humanize, salaryRange, vacancyStatusColor } from '../lib/format';

export function VacanciesPage() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canManage = user?.role === 'ADMIN' || user?.role === 'RECRUITER';

  useEffect(() => {
    vacancyApi
      .list()
      .then(setVacancies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Vacancies"
        subtitle="Open positions across the organization"
        action={canManage && <Link to="/vacancies/new" className="btn-primary">New vacancy</Link>}
      />
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : vacancies.length === 0 ? (
        <EmptyState message="No vacancies to display yet." />
      ) : (
        <div className="grid gap-4">
          {vacancies.map((v) => (
            <Link key={v.id} to={`/vacancies/${v.id}`} className="card transition hover:ring-brand-300">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{v.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {v.area} · {humanize(v.workModality)} · {salaryRange(v.minSalary, v.maxSalary)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{v.description}</p>
                </div>
                <Badge className={vacancyStatusColor(v.status)}>{humanize(v.status)}</Badge>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                Posted {v.publicationDate} · Responsible: {v.responsibleUserName}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
