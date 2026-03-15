import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Trash2, Users } from 'lucide-react';
import API_BASE from '../config/api';

const API_BASE_URL = API_BASE.replace(/\/$/, '');
const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

export interface MonitoringTeam {
  id: number;
  email: string;
  state_id: number;
  district_name: string;
  team_zone: 'north' | 'south' | string;
}

interface AddMonitoringTeamPayload {
  email: string;
  password: string;
  district_name: string;
  team_zone: 'north' | 'south';
}

interface AddMonitoringTeamFormProps {
  onSubmit: (payload: AddMonitoringTeamPayload) => Promise<void>;
  submitting: boolean;
}

export const AddMonitoringTeamForm: React.FC<AddMonitoringTeamFormProps> = ({ onSubmit, submitting }) => {
  const [form, setForm] = useState<AddMonitoringTeamPayload>({
    email: '',
    password: '',
    district_name: '',
    team_zone: 'north',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = form.email.trim().toLowerCase();
    const districtName = form.district_name.trim();

    if (!email || !form.password || !districtName) {
      setError('All fields are required.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      await onSubmit({
        ...form,
        email,
        district_name: districtName,
      });
      setForm({ email: '', password: '', district_name: '', team_zone: 'north' });
    } catch {
      // Parent handles server errors.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="Monitoring team email"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          placeholder="Password"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="text"
          value={form.district_name}
          onChange={(e) => setForm((prev) => ({ ...prev, district_name: e.target.value }))}
          placeholder="District name"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={form.team_zone}
          onChange={(e) => setForm((prev) => ({ ...prev, team_zone: e.target.value as 'north' | 'south' }))}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="north" className="bg-[#1a1f2e]">north</option>
          <option value="south" className="bg-[#1a1f2e]">south</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all"
      >
        {submitting ? 'Adding Team...' : 'Add Monitoring Team'}
      </button>
    </form>
  );
};

interface MonitoringTeamListProps {
  teams: MonitoringTeam[];
  deletingEmail: string | null;
  onDelete: (email: string) => Promise<void>;
}

export const MonitoringTeamList: React.FC<MonitoringTeamListProps> = ({ teams, deletingEmail, onDelete }) => {
  if (teams.length === 0) {
    return <p className="text-xs text-slate-400">No monitoring teams found for your state.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">District</th>
            <th className="px-4 py-3">Zone</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {teams.map((team) => (
            <tr key={team.id} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3 text-xs text-white font-medium">{team.email}</td>
              <td className="px-4 py-3 text-xs text-slate-300">{team.district_name}</td>
              <td className="px-4 py-3 text-xs text-slate-300 uppercase">{team.team_zone}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(team.email)}
                  disabled={deletingEmail === team.email}
                  className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 disabled:opacity-60 transition-colors text-xs font-semibold"
                >
                  {deletingEmail === team.email ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface MonitoringTeamManagementProps {
  authToken: string;
  requesterEmail: string;
}

export const MonitoringTeamManagement: React.FC<MonitoringTeamManagementProps> = ({ authToken, requesterEmail }) => {
  const [teams, setTeams] = useState<MonitoringTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/regional/monitoring-teams'), {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-User-Email': requesterEmail,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.detail || 'Failed to load monitoring teams');
      }

      const data = await response.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitoring teams');
    } finally {
      setLoading(false);
    }
  }, [authToken, requesterEmail]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const addTeam = async (payload: AddMonitoringTeamPayload) => {
    if (!authToken) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(apiUrl('/api/regional/add-monitoring-team'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'X-User-Email': requesterEmail,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload?.detail || 'Failed to add monitoring team');
      }

      setSuccess('Monitoring team added successfully.');
      await fetchTeams();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add monitoring team';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTeam = async (email: string) => {
    if (!authToken) return;

    const ok = window.confirm(`Delete monitoring team ${email}?`);
    if (!ok) return;

    setDeletingEmail(email);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(apiUrl(`/api/regional/delete-monitoring-team/${encodeURIComponent(email)}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-User-Email': requesterEmail,
        },
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload?.detail || 'Failed to delete monitoring team');
      }

      setSuccess('Monitoring team deleted successfully.');
      await fetchTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete monitoring team');
    } finally {
      setDeletingEmail(null);
    }
  };

  return (
    <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-500/20">
          <Users className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">Monitoring Team Management</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Regional state-scoped control</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{success}</p>
        </div>
      )}

      <AddMonitoringTeamForm onSubmit={addTeam} submitting={submitting} />

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-white">Monitoring Team List</h4>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading teams...
          </div>
        ) : (
          <MonitoringTeamList teams={teams} deletingEmail={deletingEmail} onDelete={deleteTeam} />
        )}
      </div>
    </div>
  );
};
