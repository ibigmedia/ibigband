"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getCollectionDocs, addDocument, createOrUpdateDoc, deleteDocument, BlogPost } from '@/lib/firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';

export default function AdminBlogPage() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  
  // AI Config State
  const [aiTopic, setAiTopic] = useState('');
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleAIGenerate = async () => {
    if (!aiTopic) {
      alert("Please enter a topic for the AI.");
      return;
    }
    setAiLoading(true);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ topic: aiTopic, keywords: aiKeywords })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      if (data.success && data.data) {
        setTitle(data.data.title || '');
        setContent(data.data.content || '');
        if (data.data.tags && Array.isArray(data.data.tags)) {
          setTags(data.data.tags.join(', '));
        }
        if (data.data.imagePrompt) setImagePrompt(data.data.imagePrompt);
      }
    } catch (e: any) {
      console.error(e);
      alert("AI Generation failed: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const data = await getCollectionDocs<BlogPost>('blogs');
      setBlogs(data);
    } catch (e) {
      console.error(e);
      alert('Failed to load blogs. Ensure you are an Admin.');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setCurrentId(null);
    setTitle('');
    setContent('');
    setTags('');
    setImageFile(null);
    setExistingImageUrl('');
    setIsEditing(false);
  };

  const handleEdit = (blog: BlogPost) => {
    setCurrentId(blog.id || null);
    setTitle(blog.title);
    setContent(blog.content);
    setTags(blog.tags.join(', '));
    setExistingImageUrl(blog.imageUrl || '');
    setImageFile(null);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await deleteDocument('blogs', id);
      setBlogs(prev => prev.filter(b => b.id !== id));
    } catch (e) {
      console.error(e);
      alert('Delete failed.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      alert('Title and Content are required.');
      return;
    }
    
    setSaving(true);
    try {
      let imageUrl = existingImageUrl;

      if (imageFile) {
        imageUrl = await uploadFile(imageFile, `public/blogs/${Date.now()}_${imageFile.name}`);
      }

      const blogData: Omit<BlogPost, 'id'> = {
        title,
        content,
        authorId: 'ibiGband', // Updated to save as 'ibiGband' instead of UID
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        imageUrl: imageUrl || undefined,
        createdAt: currentId ? undefined! : Date.now(),
      };

      if (currentId) {
        delete (blogData as any).createdAt;
        await createOrUpdateDoc('blogs', currentId, blogData);
      } else {
        await addDocument('blogs', blogData);
      }

      await fetchBlogs();
      resetForm();
    } catch (e) {
      console.error(e);
      alert('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2"/>Loading Blogs...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-handwriting text-t-copper">Blog Management</h1>
          <p className="text-t-muted mt-2">Publish and manage insights, news, and devotionals.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="w-4 h-4 mr-2" /> Write Post
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card className="bg-[#FFFDF9] border border-[#78716A]/20 p-6 text-[#121110] max-w-4xl">
          <h3 className="text-xl font-bold mb-6">{currentId ? 'Edit Post' : 'New Post'}</h3>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-6">
              {/* AI Auto Generate Section */}
              <div className="p-4 mb-6 bg-[#ECE7DC] rounded-ibig border border-dashed border-[#E8481C]/50">
                <label className="block text-sm font-bold text-t-copper mb-2 flex items-center">
                  ✨ AI 블로그 자동 생성기 (Gemini)
                </label>
                <div className="flex gap-2 mb-2">
                  <Input 
                    value={aiTopic} 
                    onChange={e => setAiTopic(e.target.value)} 
                    placeholder="블로그 주제를 입력하세요 (예: 크리스마스 예배 준비)" 
                    className="bg-[#ECE7DC] text-[#121110] border-none flex-1"
                  />
                  <Input 
                    value={aiKeywords} 
                    onChange={e => setAiKeywords(e.target.value)} 
                    placeholder="키워드 (예: 기쁨, 탄생, 찬양)" 
                    className="bg-[#ECE7DC] text-[#121110] border-none flex-1"
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={handleAIGenerate} 
                  disabled={aiLoading} 
                  className="w-full bg-[#E8481C] text-[#121110] hover:bg-[#E8481C]/80"
                >
                  {aiLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> 생성 중...</> : '내용 및 제목 자동 생성하기'}
                </Button>
                {imagePrompt && (
                   <div className="mt-4 p-3 bg-[#ECE7DC] rounded text-sm text-t-muted">
                     <p className="font-bold text-t-copper mb-1">썸네일 생성용 추천 프롬프트 (Midjourney / DALL-E):</p>
                     <p className="italic">{imagePrompt}</p>
                   </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-t-copper mb-2">Title *</label>
                <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title..." className="bg-[#ECE7DC] text-[#121110] border-none w-full text-xl py-4"/>
              </div>

              <div>
                <label className="block text-sm text-t-copper mb-2">Content * (Supports Markdown / HTML later)</label>
                <textarea 
                  required
                  rows={15}
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder="Write your amazing content here..." 
                  className="w-full bg-[#ECE7DC] border-none rounded-ibig p-6 text-[#121110] text-base focus:ring-2 focus:ring-[#E8481C]/50 outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-sm text-t-copper mb-2">Tags (comma separated)</label>
                <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. Worship, Event, Guide" className="bg-[#ECE7DC] text-[#121110] border-none w-full"/>
              </div>

              {/* Cover Image */}
              <div className="p-4 bg-[#ECE7DC] rounded-ibig border border-dashed border-[#78716A]/50">
                <label className="block text-sm font-bold text-[#121110] mb-2 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2"/> Cover Image {currentId && !imageFile ? '(Keep Existing)' : ''}
                </label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-ibig file:border-0 file:text-sm file:font-semibold file:bg-[#E8481C] file:text-[#121110] hover:file:bg-[#E8481C]/80" />
                {existingImageUrl && !imageFile && <p className="text-xs text-green-800 mt-2">✓ Existing Image will be kept.</p>}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-[#78716A]/20">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" variant="secondary" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Publishing...</> : 'Publish Post'}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.length === 0 ? (
            <div className="md:col-span-3 p-8 text-center text-t-muted bg-[#FFFDF9] rounded-2xl border border-[#78716A]/20">No blog posts found. Write one!</div>
          ) : (
            blogs.map(blog => (
              <Card key={blog.id} className="bg-[#FFFDF9] border border-[#78716A]/20 flex flex-col justify-between overflow-hidden">
                {blog.imageUrl && (
                  <div className="h-40 w-full bg-cover bg-center border-b border-[#78716A]/20" style={{ backgroundImage: `url(${blog.imageUrl})` }}></div>
                )}
                <div className="p-6">
                  <p className="text-xs text-t-muted mb-2">{new Date(blog.createdAt).toLocaleDateString()}</p>
                  <h3 className="text-lg font-bold text-[#121110] mb-2 line-clamp-2">{blog.title}</h3>
                  <p className="text-sm text-t-muted line-clamp-3 mb-4">{blog.content}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {blog.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 bg-[#78716A]/20 text-t-copper rounded">{tag}</span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-[#78716A]/20">
                    <button onClick={() => handleEdit(blog)} className="text-t-copper hover:text-[#B3350F] flex items-center text-sm"><Edit className="w-4 h-4 mr-1"/> Edit</button>
                    <button onClick={() => handleDelete(blog.id!)} className="text-red-700 hover:text-red-700 flex items-center text-sm"><Trash2 className="w-4 h-4 mr-1"/> Delete</button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
