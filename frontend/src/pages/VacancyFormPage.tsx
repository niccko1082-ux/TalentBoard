import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vacancyApi } from '../api/resources';
import type { VacancyRequest, WorkModality } from '../types';
import { ApiException } from '../api/client';
import { ErrorBanner, PageHeader, Spinner } from '../components/ui';

const MODALITIES: WorkModality[] = ['ON_SITE', 'REMOTE', 'HYBRID'];

export function VacancyFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<VacancyRequest>({
    title: '',
    description: '',
    area: '',
    workModality: 'REMOTE',
    minSalary: null,
    maxSalary: null,
  });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return;
    vacancyApi
      .get(Number(id))
      .then((v) =>
        setForm({
          title: v.title,
          description: v.description,
          area: v.area,
          workModality: v.workModality,
          minSalary: v.minSalary,
          maxSalary: v.maxSalary,
        }),
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [editing, id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: VacancyRequest = {
        ...form,
        minSalary: form.minSalary || null,
        maxSalary: form.maxSalary || null,
      };
      const saved = editing
        ? await vacancyApi.update(Number(id), payload)
        : await vacancyApi.create(payload);
      navigate(`/vacancies/${saved.id}`);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Could not save the vacancy');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="max-w-2xl">
      <PageHeader title={editing ? 'Edit vacancy' : 'New vacancy'} />
      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && <ErrorBanner message={error} />}
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" className="input" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div>
          <label className="label" htmlFor="area">Area / category</label>
          <input id="area" className="input" value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })} required />
        </div>
        <div>
          <label className="label" htmlFor="modality">Work modality</label>
          <select id="modality" className="input" value={form.workModality}
            onChange={(e) => setForm({ ...form, workModality: e.target.value as WorkModality })}>
            {MODALITIES.map((m) => (
              <option key={m} value={m}>{m.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="minSalary">Min salary (optional)</label>
            <input id="minSalary" type="number" min="0" className="input"
              value={form.minSalary ?? ''}
              onChange={(e) => setForm({ ...form, minSalary: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <label className="label" htmlFor="maxSalary">Max salary (optional)</label>
            <input id="maxSalary" type="number" min="0" className="input"
              value={form.maxSalary ?? ''}
              onChange={(e) => setForm({ ...form, maxSalary: e.target.value ? Number(e.target.value) : null })} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" rows={5} className="input" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create vacancy'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
