import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { UIPage, UILayout } from '../../types';

interface PageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (page: Omit<UIPage, 'id'>) => Promise<void>;
  layouts: UILayout[];
  initialData?: UIPage;
}

export default function PageModal({ isOpen, onClose, onSave, layouts, initialData }: PageModalProps) {
  const [formData, setFormData] = useState<Omit<UIPage, 'id'>>({
    projectId: initialData?.projectId || '',
    name: initialData?.name || '',
    path: initialData?.path || '/',
    purpose: initialData?.purpose || '',
    layoutId: initialData?.layoutId || '',
    linkedFeatureIds: initialData?.linkedFeatureIds || [],
    componentIds: initialData?.componentIds || [],
    mobilePattern: initialData?.mobilePattern || 'Stacked',
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
      console.error('Error saving page:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <h3 className="text-lg font-bold text-white">{initialData ? 'Edit Page' : 'Add New Page'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Page Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="e.g. Dashboard, User Profile"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Path</label>
            <input
              type="text"
              required
              value={formData.path}
              onChange={(e) => setFormData({ ...formData, path: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="e.g. /dashboard, /profile/:id"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Purpose</label>
            <textarea
              required
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all h-24 resize-none"
              placeholder="What is the main goal of this page?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Layout</label>
              <select
                value={formData.layoutId}
                onChange={(e) => setFormData({ ...formData, layoutId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              >
                <option value="">Select Layout</option>
                {layouts.map(layout => (
                  <option key={layout.id} value={layout.id}>{layout.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Mobile Pattern</label>
              <select
                value={formData.mobilePattern}
                onChange={(e) => setFormData({ ...formData, mobilePattern: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              >
                <option value="Stacked">Stacked</option>
                <option value="Tabs">Tabs</option>
                <option value="Drawer">Drawer</option>
                <option value="Modal">Modal</option>
              </select>
            </div>
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
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {initialData ? 'Update Page' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


