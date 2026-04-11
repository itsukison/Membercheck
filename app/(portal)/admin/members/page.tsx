'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

type Member = {
  id: string;
  name: string;
  role: 'Photographer' | 'Leader';
  email: string;
  status: 'Active' | 'On Leave' | 'Inactive';
};

export default function AdminMembers() {
  const { member: currentMember } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [role, setRole] = useState<'Photographer' | 'Leader'>('Photographer');
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('id, name, role, email, status')
      .order('created_at', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setMembers((data ?? []) as Member[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const openAddModal = () => {
    setEditingMember(null);
    setRole('Photographer');
    setStatus('Active');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setRole(m.role);
    setStatus(m.status);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalError(null);
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (editingMember) {
      const { error } = await supabase
        .from('members')
        .update({ name, role, status })
        .eq('id', editingMember.id);

      if (error) {
        setModalError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const password = formData.get('password') as string;
      if (!password || password.length < 8) {
        setModalError('Password must be at least 8 characters.');
        setSaving(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setModalError('Not signed in.');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/create-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name, email, password, role, status }),
      });

      if (!res.ok) {
        const { error: errMsg } = await res.json().catch(() => ({ error: 'Unknown error' }));
        setModalError(errMsg ?? 'Failed to create member.');
        setSaving(false);
        return;
      }
    }

    await loadMembers();
    setSaving(false);
    setIsModalOpen(false);
  };

  const canAddMembers = currentMember?.role === 'Leader';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-serif text-4xl text-[#111]">Team Members</h1>
          <p className="text-[#777] mt-2">Manage photographers and their roles.</p>
        </div>
        {canAddMembers && (
          <button
            onClick={openAddModal}
            className="bg-[#111] text-white px-6 py-2 font-medium hover:bg-[#ff4d94] transition-colors"
          >
            + Add Member
          </button>
        )}
      </header>

      {error && (
        <div className="border border-[#ff4d94] bg-[#ff4d94]/5 text-[#ff4d94] p-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#fcfbf9] border-b border-[#111]">
                <th className="p-4 font-medium text-[#111]">Name</th>
                <th className="p-4 font-medium text-[#111]">Role</th>
                <th className="p-4 font-medium text-[#111]">Email</th>
                <th className="p-4 font-medium text-[#111]">Status</th>
                <th className="p-4 font-medium text-[#111]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#777]">Loading…</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-[#777]">No members yet.</td></tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="border-b border-[#e8e6e1] hover:bg-[#fcfbf9]/50 transition-colors">
                    <td className="p-4 text-[#111] font-medium">{m.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-medium border ${m.role === 'Leader' ? 'border-[#ff4d94] text-[#ff4d94]' : 'border-[#111] text-[#111]'}`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="p-4 text-[#777]">{m.email}</td>
                    <td className="p-4 text-[#777]">{m.status}</td>
                    <td className="p-4">
                      {canAddMembers ? (
                        <button
                          onClick={() => openEditModal(m)}
                          className="text-[#111] hover:text-[#ff4d94] font-medium text-sm underline underline-offset-2"
                        >
                          Edit
                        </button>
                      ) : m.id === currentMember?.id ? (
                        <button
                          onClick={() => openEditModal(m)}
                          className="text-[#111] hover:text-[#ff4d94] font-medium text-sm underline underline-offset-2"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-[#ccc] text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white border border-[#111] shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] w-full max-w-md p-6 relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-[#777] hover:text-[#111]"
              >
                <X size={20} />
              </button>

              <h2 className="font-serif text-2xl text-[#111] mb-6">
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">Full Name</label>
                  <input
                    name="name"
                    defaultValue={editingMember?.name}
                    required
                    className="w-full border border-[#111] p-2 focus:outline-none focus:border-[#ff4d94]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingMember?.email}
                    disabled={!!editingMember}
                    required
                    className="w-full border border-[#111] p-2 focus:outline-none focus:border-[#ff4d94] disabled:bg-[#fcfbf9] disabled:text-[#777]"
                  />
                </div>
                {!editingMember && (
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">Initial Password</label>
                    <input
                      name="password"
                      type="password"
                      minLength={8}
                      required
                      className="w-full border border-[#111] p-2 focus:outline-none focus:border-[#ff4d94]"
                      placeholder="Min 8 characters"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">Role</label>
                    <CustomSelect
                      name="role"
                      value={role}
                      onChange={(val: string) => setRole(val as 'Photographer' | 'Leader')}
                      options={[
                        { label: 'Photographer', value: 'Photographer' },
                        { label: 'Leader', value: 'Leader' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">Status</label>
                    <CustomSelect
                      name="status"
                      value={status}
                      onChange={(val: string) => setStatus(val as 'Active' | 'On Leave' | 'Inactive')}
                      options={[
                        { label: 'Active', value: 'Active' },
                        { label: 'On Leave', value: 'On Leave' },
                        { label: 'Inactive', value: 'Inactive' }
                      ]}
                    />
                  </div>
                </div>

                {modalError && (
                  <div className="text-sm text-[#ff4d94] border border-[#ff4d94] p-3 bg-[#ff4d94]/5">
                    {modalError}
                  </div>
                )}

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-[#111] text-[#111] hover:bg-[#fcfbf9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-[#111] text-white hover:bg-[#ff4d94] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
