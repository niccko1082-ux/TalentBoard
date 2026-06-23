import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { applicationApi, vacancyApi } from '../api/resources';
import type { JobApplication, Vacancy, VacancyStatus } from '../types';
import { useAuth } from '../auth/AuthContext';
import { ApiException } from '../api/client';
import {
  Badge,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Spinner,
  SuccessBanner,
} from '../components/ui';
import {
  applicationStatusColor,
  humanize,
  salaryRange,
  vacancyStatusColor,
} from '../lib/format';

const STATUSES: VacancyStatus[] = ['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED'];

export function VacancyDetailPage() {
  const { id } = useParams();
  const vacancyId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [applicants, setApplicants] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'RECRUITER';
  const isCandidate = user?.role === 'CANDIDATE';

  function load() {
    setLoading(true);
    vacancyApi
      .get(vacancyId)
      .then((v) => {
        setVacancy(v);
        if (canManage) {
          return vacancyApi.applications(vacancyId).then(setApplicants);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [vacancyId]);

  async function changeStatus(status: VacancyStatus) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const updated = await vacancyApi.updateStatus(vacancyId, status);
      setVacancy(updated);
      setMessage(`Status changed to ${humanize(status)}.`);
    } catch (e) {
      setError(e instanceof ApiException ? e.message : 'Could not change status');
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await applicationApi.apply({ vacancyId, comments: comments || undefined });
      setMessage('Application submitted! Track it under "Applications".');
      setComments('');
    } catch (e) {
      setError(e instanceof ApiException ? e.message : 'Could not apply');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;
  if (!vacancy) return <ErrorBanner message={error || 'Vacancy not found'} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={vacancy.title}
        subtitle={`${vacancy.area} · ${humanize(vacancy.workModality)} · ${salaryRange(vacancy.minSalary, vacancy.maxSalary)}`}
        action={
          canManage && (
            <Link to={`/vacancies/${vacancy.id}/edit`} className="btn-secondary">Edit</Link>
          )
        }
      />

      {message && <SuccessBanner message={message} />}
      {error && <ErrorBanner message={error} />}

      <div className="card space-y-3">
        <div className="flex items-center gap-3">
          <Badge className={vacancyStatusColor(vacancy.status)}>{humanize(vacancy.status)}</Badge>
          <span className="text-xs text-slate-400">
            Posted {vacancy.publicationDate} · Responsible: {vacancy.responsibleUserName}
          </span>
        </div>
        <p className="whitespace-pre-line text-sm text-slate-700">{vacancy.description}</p>
      </div>

      {canManage && (
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Change status</h2>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button key={s} disabled={busy || s === vacancy.status}
                onClick={() => changeStatus(s)}
                className={s === vacancy.status ? 'btn-primary' : 'btn-secondary'}>
                {humanize(s)}
              </button>
            ))}
          </div>
        </div>
      )}

      {isCandidate && (
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Apply to this vacancy</h2>
          {vacancy.status !== 'OPEN' ? (
            <p className="text-sm text-slate-500">This vacancy is not open for applications.</p>
          ) : (
            <div className="space-y-3">
              <textarea className="input" rows={3} placeholder="Add a note for the recruiter (optional)"
                value={comments} onChange={(e) => setComments(e.target.value)} />
              <button className="btn-primary" onClick={apply} disabled={busy}>
                {busy ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
          )}
        </div>
      )}

      {canManage && (
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">
            Applicants ({applicants.length})
          </h2>
          {applicants.length === 0 ? (
            <EmptyState message="No applications for this vacancy yet." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">Candidate</th>
                  <th className="py-2">Applied</th>
                  <th className="py-2">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="py-2 font-medium text-slate-800">{a.candidateName}</td>
                    <td className="py-2 text-slate-500">{new Date(a.applicationDate).toLocaleDateString()}</td>
                    <td className="py-2">
                      <Badge className={applicationStatusColor(a.status)}>{humanize(a.status)}</Badge>
                    </td>
                    <td className="py-2 text-right">
                      <button className="text-brand-600 hover:underline"
                        onClick={() => navigate(`/applications/${a.id}`)}>Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
