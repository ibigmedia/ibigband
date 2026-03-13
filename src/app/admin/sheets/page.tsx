"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getCollectionDocs, addDocument, createOrUpdateDoc, deleteDocument, SheetMusic } from '@/lib/firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';
import { Plus, Edit, Trash2, FileText, Music, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';

export default function AdminSheetsPage() {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<SheetMusic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState('');
  const [bpm, setBpm] = useState('');
  const [musicKey, setMusicKey] = useState('');
  const [moodTags, setMoodTags] = useState('');
  const [isPremiumOnly, setIsPremiumOnly] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState('');
  const [existingAudioUrl, setExistingAudioUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    setLoading(true);
    try {
      const data = await getCollectionDocs<SheetMusic>('sheets');
      setSheets(data);
    } catch (e) {
      console.error(e);
      alert('Failed to load sheets. Ensure you are an Admin.');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setCurrentId(null);
    setTitle('');
    setArtistId('');
    setBpm('');
    setMusicKey('');
    setMoodTags('');
    setIsPremiumOnly(false);
    setPdfFile(null);
    setAudioFile(null);
    setExistingPdfUrl('');
    setExistingAudioUrl('');
    setIsEditing(false);
  };

  const handleEdit = (sheet: SheetMusic) => {
    setCurrentId(sheet.id || null);
    setTitle(sheet.title);
    setArtistId(sheet.artistId);
    setBpm(sheet.bpm.toString());
    setMusicKey(sheet.key);
    setMoodTags(sheet.moodTags.join(', '));
    setIsPremiumOnly(sheet.isPremiumOnly);
    setExistingPdfUrl(sheet.pdfUrl);
    setExistingAudioUrl(sheet.audioUrl || '');
    setPdfFile(null);
    setAudioFile(null);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sheet?')) return;
    try {
      await deleteDocument('sheets', id);
      setSheets(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
      alert('Delete failed.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!pdfFile && !existingPdfUrl)) {
      alert('Title and PDF File are required.');
      return;
    }
    
    setSaving(true);
    try {
      let pdfUrl = existingPdfUrl;
      let audioUrl = existingAudioUrl;

      // Upload files if new ones are selected
      const pathPrefix = isPremiumOnly ? 'premium/sheets' : 'public/sheets';
      
      if (pdfFile) {
        pdfUrl = await uploadFile(pdfFile, `${pathPrefix}/${Date.now()}_${pdfFile.name}`);
      }
      if (audioFile) {
        audioUrl = await uploadFile(audioFile, `${pathPrefix}/${Date.now()}_${audioFile.name}`);
      }

      const sheetData: Omit<SheetMusic, 'id'> = {
        title,
        artistId,
        bpm: Number(bpm) || 0,
        key: musicKey,
        moodTags: moodTags.split(',').map(tag => tag.trim()).filter(Boolean),
        pdfUrl,
        audioUrl: audioUrl || undefined,
        isPremiumOnly,
        createdAt: currentId ? undefined! /* preserve creation */ : Date.now(),
      };

      if (currentId) {
        // Update
        // Note: createOrUpdateDoc merges, so we prevent overwriting createdAt implicitly
        delete (sheetData as any).createdAt; 
        await createOrUpdateDoc('sheets', currentId, sheetData);
      } else {
        // Add
        await addDocument('sheets', sheetData);
      }

      await fetchSheets();
      resetForm();
    } catch (e) {
      console.error(e);
      alert('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2"/>Loading Sheets...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-handwriting text-[#E6C79C]">Sheet Music Management</h1>
          <p className="text-gray-400 mt-2">Create, edit, and orchestrate sheet files with backend synchronization.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add New Sheet
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card className="bg-[#2D2926]/50 border border-[#78716A]/20 p-6 text-white">
          <h3 className="text-xl font-bold mb-6">{currentId ? 'Edit Sheet' : 'New Sheet'}</h3>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-[#E6C79C] mb-2">Title *</label>
                <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Amazing Grace (New Ver)" className="bg-black/20 text-white border-none w-full"/>
              </div>
              <div>
                <label className="block text-sm text-[#E6C79C] mb-2">Artist / Uploader ID</label>
                <Input value={artistId} onChange={e => setArtistId(e.target.value)} placeholder="e.g. artist_123" className="bg-black/20 text-white border-none w-full"/>
              </div>
              <div>
                <label className="block text-sm text-[#E6C79C] mb-2">BPM</label>
                <Input type="number" value={bpm} onChange={e => setBpm(e.target.value)} placeholder="e.g. 120" className="bg-black/20 text-white border-none w-full"/>
              </div>
              <div>
                <label className="block text-sm text-[#E6C79C] mb-2">Key</label>
                <Input value={musicKey} onChange={e => setMusicKey(e.target.value)} placeholder="e.g. G Major" className="bg-black/20 text-white border-none w-full"/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-[#E6C79C] mb-2">Mood Tags (comma separated)</label>
                <Input value={moodTags} onChange={e => setMoodTags(e.target.value)} placeholder="e.g. Warm, Acoustic, Worship" className="bg-black/20 text-white border-none w-full"/>
              </div>

              {/* Files */}
              <div className="md:col-span-2 space-y-4 p-4 bg-black/10 rounded-ibig">
                <div>
                  <label className="block text-sm font-bold text-white mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2"/> PDF Sheet File {currentId && !pdfFile ? '(Keep Existing)' : '*'}
                  </label>
                  <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-ibig file:border-0 file:text-sm file:font-semibold file:bg-[#E6C79C] file:text-[#2D2926] hover:file:bg-[#E6C79C]/80" />
                  {existingPdfUrl && !pdfFile && <p className="text-xs text-green-400 mt-2">✓ Existing PDF will be kept.</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2 flex items-center">
                    <Music className="w-4 h-4 mr-2"/> Guide Audio / MR File (Optional)
                  </label>
                  <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-ibig file:border-0 file:text-sm file:font-semibold file:bg-[#2D2926] file:border file:border-[#78716A] file:text-white hover:file:bg-[#78716A]/50" />
                  {existingAudioUrl && !audioFile && <p className="text-xs text-green-400 mt-2">✓ Existing Audio will be kept.</p>}
                </div>
              </div>

              {/* Premium toggle */}
              <div className="md:col-span-2 flex items-center space-x-3">
                <input type="checkbox" id="premium" checked={isPremiumOnly} onChange={e => setIsPremiumOnly(e.target.checked)} className="w-5 h-5 accent-[#E6C79C]" />
                <label htmlFor="premium" className="text-sm">Premium Members Only (Secure Storage & Access)</label>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" variant="secondary" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Saving...</> : 'Save Sheet'}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="bg-[#2D2926]/50 rounded-2xl border border-[#78716A]/20 overflow-hidden">
          {sheets.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No sheets uploaded yet.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#2D2926] text-[#E6C79C] uppercase font-bold text-xs">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Key & BPM</th>
                  <th className="px-6 py-4">Premium</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sheets.map(sheet => (
                  <tr key={sheet.id} className="border-b border-[#78716A]/10 hover:bg-[#78716A]/5">
                    <td className="px-6 py-4 font-bold text-white">{sheet.title}</td>
                    <td className="px-6 py-4">{sheet.key} / {sheet.bpm}</td>
                    <td className="px-6 py-4">
                      {sheet.isPremiumOnly ? <span className="text-[#E6C79C] font-bold text-xs bg-[#E6C79C]/10 px-2 py-1 rounded">PREMIUM</span> : <span className="text-gray-400 text-xs">FREE</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(sheet)} className="text-gray-400 hover:text-white mr-4"><Edit className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(sheet.id!)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
