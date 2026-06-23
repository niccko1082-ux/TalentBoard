import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationApi } from '../api/resources';
import type { JobApplication } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Badge, EmptyState, ErrorBanner, PageHeader, Spinner } from '../components/ui';
import { applicationStatusColor, formatDateTime, humanize } from '../lib/format';

export function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isCandidate = user?.role === 'CANDIDATE';

  useEffect(() => {
    applicationApi
      .list()
      .then(setApplications)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title={isCandidate ? 'My applications' : 'Applications'}
        subtitle={isCandidate ? 'Track the progress of your applications' : 'All applications in the pipeline'}
      />
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : applications.length === 0 ? (
        <EmptyState message={isCandidate ? "You haven't applied to any vacancy yet." : 'No applications yet.'} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">Vacancy</th>
                {!isCandidate && <th className="py-2">Candidate</th>}
                <th className="py-2">Applied</th>
                <th className="py-2">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-800">{a.vacancyTitle}</td>
                  {!isCandidate && <td className="py-2 text-slate-600">{a.candidateName}</td>}
                  <td className="py-2 text-slate-500">{formatDateTime(a.applicationDate)}</td>
                  <td className="py-2">
                    <Badge className={applicationStatusColor(a.status)}>{humanize(a.status)}</Badge>
                  </td>
                  <td className="py-2 text-right">
                    <Link to={`/applications/${a.id}`} className="text-brand-600 hover:underline">
                      {isCandidate ? 'View' : 'Manage'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
