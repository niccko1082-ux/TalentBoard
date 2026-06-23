import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { applicationApi, interviewApi, userApi } from '../api/resources';
import type {
  ApplicationStatus,
  Interview,
  InterviewResult,
  InterviewType,
  JobApplication,
  UserResponse,
} from '../types';
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
  APPLICATION_TRANSITIONS,
  applicationStatusColor,
  formatDate,
  humanize,
  interviewResultColor,
} from '../lib/format';

const INTERVIEW_TYPES: InterviewType[] = ['PHONE_SCREENING', 'TECHNICAL', 'HR', 'FINAL_ROUND'];
const INTERVIEW_RESULTS: InterviewResult[] = ['PENDING', 'PASSED', 'FAILED', 'NO_SHOW', 'CANCELLED'];

export function ApplicationDetailPage() {
  const { id } = useParams();
  const applicationId = Number(id);
  const { user } = useAuth();

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [interviewers, setInterviewers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'RECRUITER';

  // Schedule-interview form state
  const [form, setForm] = useState({
    date: '',
    time: '',
    type: 'TECHNICAL' as InterviewType,
    interviewerId: user?.id ?? 0,
    observations: '',
  });

  function reload() {
    Promise.all([applicationApi.get(applicationId), applicationApi.interviews(applicationId)])
      .then(([app, ints]) => {
        setApplication(app);
        setInterviews(ints);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    if (user?.role === 'ADMIN') {
      userApi
        .list()
        .then((users) => setInterviewers(users.filter((u) => u.role !== 'CANDIDATE')))
        .catch(() => undefined);
    }
  }, [applicationId]);

  async function changeStatus(status: ApplicationStatus) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const updated = await applicationApi.updateStatus(applicationId, status);
      setApplication(updated);
      setMessage(`Application moved to ${humanize(status)}.`);
    } catch (e) {
      setError(e instanceof ApiException ? e.message : 'Could not update status');
    } finally {
      setBusy(false);
    }
  }

  async function scheduleInterview(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await interviewApi.create({
        jobApplicationId: applicationId,
        date: form.date,
        time: form.time.length === 5 ? `${form.time}:00` : form.time,
        type: form.type,
        interviewerId: form.interviewerId || user!.id,
        observations: form.observations || undefined,
      });
      setMessage('Interview scheduled.');
      setForm({ ...form, date: '', time: '', observations: '' });
      reload();
    } catch (e) {
      setError(e instanceof ApiException ? e.message : 'Could not schedule interview');
    } finally {
      setBusy(false);
    }
  }

  async function updateResult(interview: Interview, result: InterviewResult) {
    setBusy(true);
    setError('');
    try {
      await interviewApi.update(interview.id, {
        date: interview.date,
        time: interview.time,
        type: interview.type,
        result,
        observations: interview.observations ?? undefined,
      });
      reload();
    } catch (e) {
      setError(e instanceof ApiException ? e.message : 'Could not update interview');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;
  if (!application) return <ErrorBanner message={error || 'Application not found'} />;

  const nextStates = APPLICATION_TRANSITIONS[application.status];

  return (
    <div className="space-y-6">
      <PageHeader title={application.vacancyTitle} subtitle={`Candidate: ${application.candidateName}`} />

      {message && <SuccessBanner message={message} />}
      {error && <ErrorBanner message={error} />}

      <div className="card space-y-2">
        <div className="flex items-center gap-3">
          <Badge className={applicationStatusColor(application.status)}>{humanize(application.status)}</Badge>
          <span className="text-xs text-slate-400">
            Applied {formatDate(application.applicationDate)}
          </span>
        </div>
        {application.comments && (
          <p className="text-sm text-slate-600">“{application.comments}”</p>
        )}
      </div>

      {canManage && (
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Advance the process</h2>
          {nextStates.length === 0 ? (
            <p className="text-sm text-slate-500">This application is in a final state.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {nextStates.map((s) => (
                <button key={s} className="btn-secondary" disabled={busy} onClick={() => changeStatus(s)}>
                  {humanize(s)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Interviews ({interviews.length})</h2>
        {interviews.length === 0 ? (
          <EmptyState message="No interviews scheduled yet." />
        ) : (
          <div className="space-y-3">
            {interviews.map((iv) => (
              <div key={iv.id} className="rounded-md border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-800">{humanize(iv.type)}</div>
                    <div className="text-sm text-slate-500">
                      {iv.date} at {iv.time} · Interviewer: {iv.interviewerName}
                    </div>
                  </div>
                  <Badge className={interviewResultColor(iv.result)}>{humanize(iv.result)}</Badge>
                </div>
                {iv.observations && <p className="mt-2 text-sm text-slate-600">{iv.observations}</p>}
                {canManage && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400">Set result:</span>
                    {INTERVIEW_RESULTS.map((r) => (
                      <button key={r} disabled={busy || r === iv.result}
                        onClick={() => updateResult(iv, r)}
                        className="rounded px-2 py-1 text-xs ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40">
                        {humanize(r)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {canManage && (
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Schedule an interview</h2>
          <form onSubmit={scheduleInterview} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="date">Date</label>
                <input id="date" type="date" className="input" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <label className="label" htmlFor="time">Time</label>
                <input id="time" type="time" className="input" value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="type">Type</label>
                <select id="type" className="input" value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as InterviewType })}>
                  {INTERVIEW_TYPES.map((t) => (
                    <option key={t} value={t}>{humanize(t)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="interviewer">Interviewer</label>
                {user?.role === 'ADMIN' && interviewers.length > 0 ? (
                  <select id="interviewer" className="input" value={form.interviewerId}
                    onChange={(e) => setForm({ ...form, interviewerId: Number(e.target.value) })}>
                    {interviewers.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName} ({humanize(u.role)})</option>
                    ))}
                  </select>
                ) : (
                  <input id="interviewer" className="input bg-slate-50" value={`${user?.fullName} (you)`} disabled />
                )}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="observations">Observations (optional)</label>
              <textarea id="observations" rows={2} className="input" value={form.observations}
                onChange={(e) => setForm({ ...form, observations: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Scheduling…' : 'Schedule interview'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
