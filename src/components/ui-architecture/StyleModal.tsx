import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { UIStyleSystem } from '../../types';

interface StyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (style: Partial<UIStyleSystem>) => Promise<void>;
  initialData: UIStyleSystem | null;
}

export default function StyleModal({ isOpen, onClose, onSave, initialData }: StyleModalProps) {
  const [formData, setFormData] = useState<Partial<UIStyleSystem>>(initialData || {
    colors: {
      primary: '#6366f1',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#0a0a0a',
      surface: '#141414',
      error: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b',
      info: '#3b82f6',
    },
    typography: {
      fontSans: 'Inter',
      fontMono: 'JetBrains Mono',
      baseSize: '16px',
      scale: 1.2,
    },
    spacing: {
      unit: 4,
      scale: [0, 4, 8, 12, 16, 24, 32, 48, 64],
    },
    darkMode: true,
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
      console.error('Error saving style system:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateColor = (key: keyof UIStyleSystem['colors'], value: string) => {
    setFormData({
      ...formData,
      colors: {
        ...formData.colors!,
        [key]: value
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <h3 className="text-lg font-bold text-white">Design System Configuration</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Colors */}
          <section>
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Brand Colors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ColorInput label="Primary" value={formData.colors?.primary || ''} onChange={(val) => updateColor('primary', val)} />
              <ColorInput label="Secondary" value={formData.colors?.secondary || ''} onChange={(val) => updateColor('secondary', val)} />
              <ColorInput label="Accent" value={formData.colors?.accent || ''} onChange={(val) => updateColor('accent', val)} />
              <ColorInput label="Background" value={formData.colors?.background || ''} onChange={(val) => updateColor('background', val)} />
              <ColorInput label="Surface" value={formData.colors?.surface || ''} onChange={(val) => updateColor('surface', val)} />
            </div>
          </section>

          {/* Typography */}
          <section>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">Typography</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Sans Font</label>
                <input
                  type="text"
                  value={formData.typography?.fontSans}
                  onChange={(e) => setFormData({ ...formData, typography: { ...formData.typography!, fontSans: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Mono Font</label>
                <input
                  type="text"
                  value={formData.typography?.fontMono}
                  onChange={(e) => setFormData({ ...formData, typography: { ...formData.typography!, fontMono: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>
          </section>

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
              Save Design System
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
      <input 
        type="color" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
      />
      <div className="flex-1">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{label}</label>
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-none p-0 text-xs font-mono text-white focus:outline-none"
        />
      </div>
    </div>
  );
}
