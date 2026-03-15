import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Trash2, UserPlus, Users } from 'lucide-react';
import {
  addRegionalOfficer,
  deleteRegionalOfficer,
  fetchRegionalOfficers,
  fetchStates,
  type RegionalOfficer,
  type StateOption,
} from '../services/adminApi';

interface AddRegionalOfficerFormProps {
  states: StateOption[];
  onSubmit: (payload: { email: string; password: string; state_id: number }) => Promise<void>;
  submitting: boolean;
}

export const AddRegionalOfficerForm: React.FC<AddRegionalOfficerFormProps> = ({ states, onSubmit, submitting }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stateId, setStateId] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (states.length > 0 && stateId === 0) {
      setStateId(states[0].id);
    }
  }, [states, stateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password || !stateId) {
      setError('All fields are required.');
      return;
    }

    if (!normalizedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      await onSubmit({
        email: normalizedEmail,
        password,
        state_id: stateId,
      });

      setEmail('');
      setPassword('');
      if (states.length > 0) {
        setStateId(states[0].id);
      }
    } catch {
      // Parent handles API error display.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Officer email"
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={stateId || ''}
          onChange={(e) => setStateId(Number(e.target.value))}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {states.length === 0 && <option value="" className="bg-[#1a1f2e]">No states found</option>}
          {states.map((state) => (
            <option key={state.id} value={state.id} className="bg-[#1a1f2e]">
              {state.state_name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting || states.length === 0}
        className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {submitting ? 'Adding...' : 'Add Regional Officer'}
      </button>
    </form>
  );
};

interface RegionalOfficerListProps {
  officers: RegionalOfficer[];
  deletingEmail: string | null;
  onDelete: (email: string) => Promise<void>;
}

export const RegionalOfficerList: React.FC<RegionalOfficerListProps> = ({ officers, deletingEmail, onDelete }) => {
  if (officers.length === 0) {
    return <p className="text-xs text-slate-400">No regional officers found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Assigned State</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {officers.map((officer) => (
            <tr key={officer.id} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3 text-xs text-white font-medium">{officer.email}</td>
              <td className="px-4 py-3 text-xs text-slate-300">{officer.state_name}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(officer.email)}
                  disabled={deletingEmail === officer.email}
                  className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 disabled:opacity-60 transition-colors text-xs font-semibold"
                >
                  {deletingEmail === officer.email ? (
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

interface RegionalOfficerManagementProps {
  requesterEmail: string;
}

export const RegionalOfficerManagement: React.FC<RegionalOfficerManagementProps> = ({ requesterEmail }) => {
  const [states, setStates] = useState<StateOption[]>([]);
  const [officers, setOfficers] = useState<RegionalOfficer[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!requesterEmail) return;

    setLoading(true);
    setError(null);

    try {
      const [stateList, officerList] = await Promise.all([
        fetchStates(requesterEmail),
        fetchRegionalOfficers(requesterEmail),
      ]);
      setStates(stateList);
      setOfficers(officerList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load regional officer data');
    } finally {
      setLoading(false);
    }
  }, [requesterEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddOfficer = async (payload: { email: string; password: string; state_id: number }) => {
    if (!requesterEmail) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await addRegionalOfficer(requesterEmail, payload);
      setSuccess('Regional officer added successfully.');
      const updatedOfficers = await fetchRegionalOfficers(requesterEmail);
      setOfficers(updatedOfficers);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add regional officer';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOfficer = async (email: string) => {
    if (!requesterEmail) return;

    const ok = window.confirm(`Delete regional officer ${email}?`);
    if (!ok) return;

    setDeletingEmail(email);
    setError(null);
    setSuccess(null);

    try {
      await deleteRegionalOfficer(requesterEmail, email);
      setSuccess('Regional officer deleted successfully.');
      const updatedOfficers = await fetchRegionalOfficers(requesterEmail);
      setOfficers(updatedOfficers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete regional officer');
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
          <h3 className="font-bold text-lg text-white">RegionalOfficerManagement</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Super Admin controls regional officers</p>
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

      <AddRegionalOfficerForm states={states} onSubmit={handleAddOfficer} submitting={submitting} />

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-white">Regional Officers</h4>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading data...
          </div>
        ) : (
          <RegionalOfficerList officers={officers} deletingEmail={deletingEmail} onDelete={handleDeleteOfficer} />
        )}
      </div>
    </div>
  );
};
