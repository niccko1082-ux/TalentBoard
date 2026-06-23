import { FormEvent, useEffect, useState } from 'react';
import { userApi } from '../api/resources';
import type { Role, UserResponse } from '../types';
import { ApiException } from '../api/client';
import {
  Badge,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Spinner,
  SuccessBanner,
} from '../components/ui';
import { formatDate, humanize } from '../lib/format';

const ROLES: Role[] = ['ADMIN', 'RECRUITER', 'CANDIDATE'];

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  RECRUITER: 'bg-blue-100 text-blue-700',
  CANDIDATE: 'bg-slate-100 text-slate-700',
};

export function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'RECRUITER' as Role });

  function reload() {
    userApi
      .list()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function createUser(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await userApi.create(form);
      setMessage(`User ${form.email} created.`);
      setForm({ fullName: '', email: '', password: '', role: 'RECRUITER' });
      reload();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Could not create user');
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled(u: UserResponse) {
    setBusy(true);
    try {
      await userApi.update(u.id, { fullName: u.fullName, enabled: !u.enabled });
      reload();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Could not update user');
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(u: UserResponse) {
    if (!confirm(`Delete ${u.email}?`)) return;
    setBusy(true);
    try {
      await userApi.remove(u.id);
      reload();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Could not delete user');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="Manage accounts and roles" />
      {message && <SuccessBanner message={message} />}
      {error && <ErrorBanner message={error} />}

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Create user</h2>
        <form onSubmit={createUser} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="fullName">Full name</label>
            <input id="fullName" className="input" value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </div>
          <div>
            <label className="label" htmlFor="role">Role</label>
            <select id="role" className="input" value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{humanize(r)}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Create user'}
            </button>
          </div>
        </form>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <Spinner />
        ) : users.length === 0 ? (
          <EmptyState message="No users." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-800">{u.fullName}</td>
                  <td className="py-2 text-slate-600">{u.email}</td>
                  <td className="py-2"><Badge className={ROLE_COLORS[u.role]}>{humanize(u.role)}</Badge></td>
                  <td className="py-2">
                    <Badge className={u.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                      {u.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="py-2 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="py-2 text-right space-x-3">
                    <button className="text-brand-600 hover:underline" disabled={busy}
                      onClick={() => toggleEnabled(u)}>
                      {u.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button className="text-red-600 hover:underline" disabled={busy}
                      onClick={() => removeUser(u)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
