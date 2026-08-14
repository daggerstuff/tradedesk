'use client';

import { useState, useEffect, useCallback } from 'react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
];

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadMembers = useCallback(async () => {
    const res = await fetch('/api/team');
    const data = await res.json();
    setMembers(data.members || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInviting(true);

    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    const data = await res.json();
    setInviting(false);

    if (!res.ok) {
      setError(data.error || 'Failed to send invite');
      return;
    }

    if (data.invited) {
      setSuccess(`Invite sent to ${inviteEmail}`);
    } else {
      setSuccess('Team member added');
    }
    setInviteEmail('');
    loadMembers();
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from your team?`)) return;

    const res = await fetch('/api/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (res.ok) {
      setSuccess(`${name} removed from team`);
      loadMembers();
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch('/api/team/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    });

    if (res.ok) {
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage who has access to your TradeDesk account
        </p>
      </div>

      {/* Invite Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h2>
        <form onSubmit={handleInvite} className="flex flex-wrap gap-3">
          <input
            type="email"
            placeholder="Email address"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            required
            className="flex-1 min-w-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {inviting ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Team Members ({members.length})
          </h2>
        </div>

        {members.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">
              No team members yet. Invite someone to collaborate on your jobs, invoices, and customers.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {members.map(member => (
              <li key={member.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-700">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={member.role}
                    onChange={e => handleRoleChange(member.id, e.target.value)}
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemove(member.id, member.name)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-800">
          <strong>Members</strong> can view and edit jobs, invoices, and customers.
          <strong> Admins</strong> can also manage team members and billing.
        </p>
      </div>
    </div>
  );
}
