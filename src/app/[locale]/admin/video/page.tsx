"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Edit2, Trash2, Video, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Video as VideoType, RelatedLink } from '@/types/video';

export default function AdminVideoPage() {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [featured, setFeatured] = useState(false);
  const [relatedLinks, setRelatedLinks] = useState<RelatedLink[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'videos'));
      const videoList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VideoType[];
      
      // Sort in JS instead of compound query to save an index creation right now
      videoList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || a.createdAt || 0;
        const timeB = b.createdAt?.toMillis?.() || b.createdAt || 0;
        return timeB - timeA;
      });
      
      setVideos(videoList);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenModal = (video?: VideoType) => {
    if (video) {
        setEditingVideo(video);
        setTitle(video.title || '');
        setDescription(video.description || '');
        setYoutubeUrl(video.youtubeUrl || '');
        setThumbnailUrl(video.thumbnailUrl || '');
        setFeatured(video.featured || false);
        setRelatedLinks(video.relatedLinks || []);
    } else {
        setEditingVideo(null);
        setTitle('');
        setDescription('');
        setYoutubeUrl('');
        setThumbnailUrl('');
        setFeatured(false);
        setRelatedLinks([]);
        setVideoFile(null);
        setThumbnailFile(null);
    }
    setIsModalOpen(true);
  };

  const handleAutoFill = async () => {
    if (!youtubeUrl) return;
    setIsFetchingMeta(true);
    try {
      const res = await fetch('/api/video-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl })
      });
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.image) setThumbnailUrl(data.image);
    } catch (e) {
      console.error('Metadata fetch failed:', e);
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const generateAIThumbnail = () => {
    if (!title) {
        alert("먼저 영상 제목을 입력해주세요!");
        return;
    }
    const cleanTitle = encodeURIComponent(title.replace(/[\/\?&\\]/g, ' '));
    setThumbnailUrl(`https://image.pollinations.ai/prompt/${cleanTitle}%20cinematic%20minimalist%20worship%20beautiful%20lighting?width=1280&height=720&nologo=true`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalVideoUrl = editingVideo?.videoUrl || '';
      
      if (videoFile) {
        const fileRef = ref(storage, `videos/${Date.now()}_${videoFile.name}`);
        const uploadResult = await uploadBytes(fileRef, videoFile);
        finalVideoUrl = await getDownloadURL(uploadResult.ref);
      }

      // Automatically generate YouTube thumbnail if youtubeUrl is provided and thumbnail is empty
      let finalThumbnail = thumbnailUrl;
      if (thumbnailFile) {
        const fileRef = ref(storage, `thumbnails/videos_${Date.now()}_${thumbnailFile.name}`);
        const uploadResult = await uploadBytes(fileRef, thumbnailFile);
        finalThumbnail = await getDownloadURL(uploadResult.ref);
      } else if (youtubeUrl && !finalThumbnail) {
         const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
         if (match && match[1]) {
            finalThumbnail = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
         }
      }

      const videoData = {
        title,
        description,
        youtubeUrl,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnail,
        featured,
        relatedLinks,
        updatedAt: serverTimestamp()
      };

      if (editingVideo) {
        await updateDoc(doc(db, 'videos', editingVideo.id), videoData);
      } else {
        await addDoc(collection(db, 'videos'), {
          ...videoData,
          createdAt: serverTimestamp()
        });
      }

      alert(editingVideo ? '수정되었습니다.' : '추가되었습니다.');
      setIsModalOpen(false);
      fetchVideos();
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await deleteDoc(doc(db, 'videos', id));
      fetchVideos();
    }
  };

  const addRelatedLink = () => {
    setRelatedLinks([...relatedLinks, { title: '', url: '', type: 'link' }]);
  };

  const updateRelatedLink = (index: number, key: string, value: string) => {
    const updated = [...relatedLinks];
    updated[index] = { ...updated[index], [key]: value };
    setRelatedLinks(updated);
  };

  const removeRelatedLink = (index: number) => {
    setRelatedLinks(relatedLinks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-handwriting text-[#E6C79C]">영상 관리</h1>
          <p className="text-gray-400 mt-2">유튜브 영상 및 관련 모달 정보 관리</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus size={16} /> 영상 추가
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map(video => (
          <Card key={video.id} className="bg-[#2D2926]/50 border border-[#78716A]/20 overflow-hidden flex flex-col group relative">
             <div className="aspect-video relative bg-black/50 border-b border-[#78716A]/20">
                {video.thumbnailUrl ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center">
                      <Video size={48} className="text-[#78716A]/30" />
                   </div>
                )}
                {video.featured && (
                    <span className="absolute top-2 right-2 bg-[#E6C79C] text-[#2D2926] text-[10px] font-bold px-2 py-1 rounded">FEATURED</span>
                )}
             </div>
             
             <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-white mb-2 line-clamp-1">{video.title}</h3>
                <p className="text-xs text-[#78716A] line-clamp-2 mb-4 flex-1">{video.description}</p>
                
                <div className="flex justify-end gap-2 pt-4 border-t border-[#78716A]/10 mt-auto">
                   <button onClick={() => handleOpenModal(video)} className="p-2 text-[#78716A] hover:text-[#E6C79C] transition-colors"><Edit2 size={16} /></button>
                   <button onClick={() => handleDelete(video.id)} className="p-2 text-[#78716A] hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                </div>
             </div>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
          <Card className="bg-[#2D2926] border border-[#78716A]/20 p-6 w-full max-w-2xl text-left my-8">
            <h2 className="text-2xl font-bold text-[#E6C79C] mb-6">
              {editingVideo ? '영상 수정' : '새 영상 추가'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">제목</label>
                <Input required value={title} onChange={e => setTitle(e.target.value)} className="bg-black/30 border-[#78716A]/20 text-white" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">설명 / 공지</label>
                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md bg-black/30 border border-[#78716A]/20 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#E6C79C]" placeholder="영상에 대한 설명이나 공지사항안내..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">유튜브 링크 (우선)</label>
                    <div className="flex relative items-center gap-2">
                       <div className="relative flex-1">
                          <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716A]" />
                          <Input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?..." className="bg-black/30 w-full border-[#78716A]/20 text-white pl-9" />
                       </div>
                       <Button type="button" onClick={handleAutoFill} disabled={isFetchingMeta} variant="outline" className="shrink-0 text-xs border-[#78716A]/30 text-[#E6C79C]">
                          {isFetchingMeta ? '불러오는중..' : '자동 채우기'}
                       </Button>
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">또는 직접 첨부 (URL우선)</label>
                    <Input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="bg-black/30 border-[#78716A]/20 text-white p-1 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#78716A]/20 file:text-white" />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">커스텀 썸네일 직접 업로드</label>
                    <Input type="file" accept="image/*" onChange={e => setThumbnailFile(e.target.files?.[0] || null)} className="bg-black/30 border-[#78716A]/20 text-white p-1 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#78716A]/20 file:text-white" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">썸네일 URL (비워두면 자동추출)</label>
                    <div className="flex relative items-center gap-2">
                       <div className="relative flex-1">
                          <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716A]" />
                          <Input value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://..." className="bg-black/30 w-full border-[#78716A]/20 text-white pl-9" />
                       </div>
                       <Button type="button" onClick={generateAIThumbnail} variant="outline" className="shrink-0 text-xs border-[#78716A]/30 text-[#E6C79C]">
                          AI생성
                       </Button>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-2">
                 <input type="checkbox" id="featured" checked={featured} onChange={e => setFeatured(e.target.checked)} className="w-4 h-4 rounded bg-black/30 border-[#78716A]/20 accent-[#E6C79C]" />
                 <label htmlFor="featured" className="text-gray-300 text-sm">홈페이지 주요 섹션에 노출하기 (Featured)</label>
              </div>

              <div className="border-t border-[#78716A]/20 pt-6">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">관계된 링크 (콜투액션)</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addRelatedLink} className="text-xs">
                       <Plus size={14} className="mr-1" /> 추가
                    </Button>
                 </div>
                 
                 <div className="space-y-3">
                    {relatedLinks.map((link, index) => (
                       <div key={index} className="flex gap-2 items-start bg-black/20 p-3 rounded-lg border border-[#78716A]/10">
                          <div className="flex-1 space-y-2">
                             <div className="flex gap-2">
                                <select 
                                   value={link.type} 
                                   onChange={e => updateRelatedLink(index, 'type', e.target.value)}
                                   className="bg-black/50 border border-[#78716A]/20 rounded px-2 py-1 text-xs text-white"
                                >
                                   <option value="link">일반 링크</option>
                                   <option value="sheet">악보 보기</option>
                                   <option value="music">음원 듣기</option>
                                   <option value="merch">굿즈 구매</option>
                                   <option value="premium">프리미엄 구독</option>
                                </select>
                                <Input value={link.title} onChange={e => updateRelatedLink(index, 'title', e.target.value)} placeholder="제목 (ex: 악보 다운로드)" className="flex-1 h-8 text-xs bg-black/30 border-[#78716A]/20 text-white" />
                             </div>
                             <Input value={link.url} onChange={e => updateRelatedLink(index, 'url', e.target.value)} placeholder="연결할 주소 (예: /sheets/123)" className="h-8 text-xs bg-black/30 border-[#78716A]/20 text-white" />
                          </div>
                          <button type="button" onClick={() => removeRelatedLink(index)} className="p-2 text-[#78716A] hover:text-red-400">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    ))}
                    {relatedLinks.length === 0 && (
                       <div className="text-xs text-[#78716A] text-center p-4">추가된 콜투액션(관련 사이트링크/악보/음원 등)이 없습니다.</div>
                    )}
                 </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#78716A]/20">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  취소
                </Button>
                <Button type="submit" disabled={loading} className="bg-[#E6C79C] text-[#2D2926] hover:bg-white">
                  {loading ? '저장 중...' : '저장'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
