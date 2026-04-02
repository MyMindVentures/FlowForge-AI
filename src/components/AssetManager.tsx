import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, 
  FileText, 
  Plus, 
  Search, 
  Link as LinkIcon, 
  Trash2, 
  Download,
  MoreVertical,
  X,
  Sparkles,
  Loader2,
  Check
} from 'lucide-react';
import { Project, Feature, Asset } from '../types';
import { generateAssetTags } from '../services/geminiService';
import { useToast } from './Toast';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from '../hooks/useFirestore';

interface AssetManagerProps {
  project: Project;
  features: Feature[];
  onBack?: () => void;
}

export default function AssetManager({ project, features, onBack }: AssetManagerProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'image' as Asset['type'],
    url: '',
    tags: [] as string[]
  });
  const { showToast } = useToast();

  const { data: assets, loading, add: addAsset, remove: removeAsset } = useFirestore<Asset>(
    project.id ? `projects/${project.id}/assets` : null
  );

  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [assets]);

  const handleAutoTag = async () => {
    if (!newAsset.name) {
      showToast('Please enter an asset name first', 'error');
      return;
    }
    setIsAdding(true);
    try {
      const tags = await generateAssetTags(newAsset.name, newAsset.type, {
        name: project.name,
        description: project.description
      });
      setNewAsset(prev => ({ ...prev, tags }));
      showToast('AI tags generated');
    } catch (error) {
      console.error('Error generating tags:', error);
      showToast('Failed to generate tags', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddAsset = async () => {
    if (!newAsset.name || !newAsset.url) {
      showToast('Name and URL are required', 'error');
      return;
    }
    setIsAdding(true);
    try {
      await addAsset({
        projectId: project.id,
        name: newAsset.name,
        type: newAsset.type,
        url: newAsset.url,
        tags: newAsset.tags,
        featureIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setNewAsset({ name: '', type: 'image', url: '', tags: [] });
      showToast('Asset added successfully');
    } catch (error) {
      console.error('Error adding asset:', error);
      showToast('Failed to add asset', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await removeAsset(assetId);
      showToast('Asset deleted');
    } catch (error) {
      console.error('Error deleting asset:', error);
      showToast('Failed to delete asset', 'error');
    }
  };

  const filteredAssets = useMemo(() => {
    return sortedAssets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === 'all' || asset.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [sortedAssets, searchQuery, selectedType]);

  const allTags = Array.from(new Set(assets.flatMap(a => a.tags)));

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <header className="p-6 border-b border-white/5 bg-[#0d0d0d]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Asset Library</h2>
              <p className="text-gray-500 text-sm">Manage project media, logos, and documents</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
          >
            <Plus size={20} />
            Add Asset
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search by name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'image', 'logo', 'document', 'other'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all",
                  selectedType === type 
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" 
                    : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <ImageIcon size={64} className="text-gray-600" />
            <div>
              <p className="text-white font-bold">No assets found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or add a new asset</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => (
              <motion.div
                key={asset.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group bg-[#141414] border border-white/5 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all shadow-xl"
              >
                {/* Preview */}
                <div className="aspect-video bg-[#0d0d0d] relative flex items-center justify-center overflow-hidden">
                  {asset.type === 'image' || asset.type === 'logo' ? (
                    <img 
                      src={asset.url} 
                      alt={asset.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-indigo-400">
                      <FileText size={48} />
                    </div>
                  )}
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <a 
                      href={asset.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                      <Download size={20} />
                    </a>
                    <button 
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white">
                    {asset.type}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white truncate text-sm" title={asset.name}>
                      {asset.name}
                    </h3>
                    <button className="text-gray-600 hover:text-white transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {asset.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-gray-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Linked Features */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                      <LinkIcon size={12} />
                      <span>{asset.featureIds.length} Linked Features</span>
                    </div>
                    <span className="text-[10px] text-gray-700">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#141414] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Add New Asset</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Asset Name</label>
                    <input
                      type="text"
                      value={newAsset.name}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. App Logo v2"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Type</label>
                      <select
                        value={newAsset.type}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
                      >
                        <option value="image">Image</option>
                        <option value="logo">Logo</option>
                        <option value="document">Document</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Preview URL</label>
                      <input
                        type="text"
                        value={newAsset.url}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Tags</label>
                      <button 
                        onClick={handleAutoTag}
                        disabled={isAdding}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {isAdding ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Auto-Tag with AI
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-4 bg-white/5 border border-white/10 rounded-xl min-h-[60px]">
                      {newAsset.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs flex items-center gap-2">
                          {tag}
                          <button onClick={() => setNewAsset(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== idx) }))}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Add tag..."
                        className="bg-transparent border-none focus:outline-none text-xs text-white flex-1 min-w-[80px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val && !newAsset.tags.includes(val)) {
                              setNewAsset(prev => ({ ...prev, tags: [...prev.tags, val] }));
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAsset}
                    disabled={isAdding}
                    className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAdding ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                    Save Asset
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
