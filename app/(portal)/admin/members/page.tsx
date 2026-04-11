'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';

type Member = { id: number; name: string; role: string; email: string; status: string };

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: 'Sarah Jenkins', role: 'Leader', email: 'sarah@shion.photography', status: 'Active' },
    { id: 2, name: 'David Kim', role: 'Photographer', email: 'david@shion.photography', status: 'Active' },
    { id: 3, name: 'Elena Rossi', role: 'Photographer', email: 'elena@shion.photography', status: 'On Leave' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [role, setRole] = useState('Photographer');
  const [status, setStatus] = useState('Active');

  const openAddModal = () => {
    setEditingMember(null);
    setRole('Photographer');
    setStatus('Active');
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setRole(member.role);
    setStatus(member.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMember = {
      id: editingMember ? editingMember.id : Date.now(),
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      email: formData.get('email') as string,
      status: formData.get('status') as string,
    };

    if (editingMember) {
      setMembers(members.map(m => m.id === editingMember.id ? newMember : m));
    } else {
      setMembers([...members, newMember]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-serif text-4xl text-[#111]">Team Members</h1>
          <p className="text-[#777] mt-2">Manage photographers and their roles.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-[#111] text-white px-6 py-2 font-medium hover:bg-[#ff4d94] transition-colors"
        >
          + Add Member
        </button>
      </header>

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
              {members.map((m) => (
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
                    <button 
                      onClick={() => openEditModal(m)}
                      className="text-[#111] hover:text-[#ff4d94] font-medium text-sm underline underline-offset-2"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
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
                    required 
                    className="w-full border border-[#111] p-2 focus:outline-none focus:border-[#ff4d94]" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">Role</label>
                    <CustomSelect 
                      name="role"
                      value={role}
                      onChange={setRole}
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
                      onChange={setStatus}
                      options={[
                        { label: 'Active', value: 'Active' },
                        { label: 'On Leave', value: 'On Leave' },
                        { label: 'Inactive', value: 'Inactive' }
                      ]}
                    />
                  </div>
                </div>
                
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
                    className="px-6 py-2 bg-[#111] text-white hover:bg-[#ff4d94] transition-colors"
                  >
                    Save
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
