import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { UIComponent } from '../../types';

interface ComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (component: Omit<UIComponent, 'id'>) => Promise<void>;
  initialData?: UIComponent;
}

export default function ComponentModal({ isOpen, onClose, onSave, initialData }: ComponentModalProps) {
  const [formData, setFormData] = useState<Omit<UIComponent, 'id'>>({
    projectId: initialData?.projectId || '',
    name: initialData?.name || '',
    type: initialData?.type || 'card',
    description: initialData?.description || '',
    purpose: initialData?.purpose || '',
    props: initialData?.props || {},
    usageGuidelines: initialData?.usageGuidelines || '',
    linkedFeatureIds: initialData?.linkedFeatureIds || [],
    createdAt: initialData?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving component:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <h3 className="text-lg font-bold text-white">{initialData ? 'Edit Component' : 'Add New Component'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Component Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="e.g. FeatureCard, UserAvatar"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              >
                <option value="card">Card</option>
                <option value="tab">Tab</option>
                <option value="chip">Chip</option>
                <option value="list">List</option>
                <option value="modal">Modal</option>
                <option value="section">Section</option>
                <option value="input">Input</option>
                <option value="button">Button</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Purpose</label>
            <textarea
              required
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all h-20 resize-none"
              placeholder="What is the main role of this component?"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Usage Guidelines</label>
            <textarea
              required
              value={formData.usageGuidelines}
              onChange={(e) => setFormData({ ...formData, usageGuidelines: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all h-24 resize-none"
              placeholder="How and where should this component be used?"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {initialData ? 'Update Component' : 'Create Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
