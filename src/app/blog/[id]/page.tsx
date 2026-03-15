"use client";

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Clock, User, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function BlogDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [blog, setBlog] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, 'blogs', id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBlog({
            id: docSnap.id,
            ...data,
            title: data.title ? data.title.normalize('NFC') : data.title,
          });
        }
      } catch (error) {
        console.error('Error fetching blog details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center py-40 bg-[#FAF9F6]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E6C79C]"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-40 bg-[#FAF9F6] px-6 text-center">
        <h2 className="text-4xl font-handwriting mb-4 text-[#2D2926]">Journal Not Found</h2>
        <p className="text-[#78716A] mb-8">요청하신 블로그를 찾을 수 없습니다.</p>
        <button onClick={() => router.push('/blog')} className="px-6 py-3 bg-[#2D2926] text-white rounded-full font-bold">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F6]">
      {/* Hero Section */}
      <section className="relative w-full h-[50vh] md:h-[60vh] bg-[#2D2926]">
        {blog.imageUrl && (
          <Image 
            src={blog.imageUrl} 
            alt={blog.title} 
            fill 
            className="object-cover opacity-60 mix-blend-overlay" 
            unoptimized 
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-transparent to-transparent" />
        
        <div className="absolute max-w-4xl left-0 right-0 mx-auto px-6 bottom-[-2rem] z-10">
          <button 
            onClick={() => router.push('/blog')} 
            className="flex items-center gap-2 text-[#78716A] hover:text-[#2D2926] transition-colors mb-6 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full w-fit shadow-sm border border-[#78716A]/10"
          >
            <ArrowLeft size={16} /> 목록으로
          </button>
          <div className="bg-white p-8 md:p-12 rounded-t-[32px] shadow-sm border border-[#78716A]/5">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="text-xs font-bold text-[#2D2926] bg-[#E6C79C]/20 px-4 py-1.5 rounded-full uppercase tracking-wider">
                {blog.category || 'Journal'}
              </span>
              <div className="flex items-center text-xs text-[#78716A] gap-2 font-medium">
                <Clock size={14} />
                <span>{new Date(blog.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex items-center text-xs text-[#78716A] gap-2 font-medium">
                <User size={14} />
                <span>{blog.authorId || 'admin'}</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-handwriting text-[#2D2926] leading-tight mb-4 break-keep">
              {blog.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="px-6 pb-32 max-w-4xl mx-auto w-full pt-16 mt-8">
        <div className="bg-white p-8 md:p-12 rounded-b-[32px] shadow-sm border-x border-b border-[#78716A]/5 min-h-[50vh]">
          <div className="prose prose-lg prose-stone max-w-none text-[#2D2926] leading-loose break-keep font-light prose-img:rounded-2xl prose-img:shadow-md prose-headings:font-handwriting">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {blog.content}
            </ReactMarkdown>
          </div>
          
          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-16 pt-8 border-t border-[#78716A]/10 flex items-center gap-3">
              <Tag size={18} className="text-[#C48C5E]" />
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag: string, index: number) => (
                  <span key={index} className="text-sm text-[#78716A] bg-[#FAF9F6] px-3 py-1.5 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": blog.title,
            "image": blog.imageUrl ? [blog.imageUrl] : [],
            "datePublished": new Date(blog.createdAt).toISOString(),
            "dateModified": new Date(blog.createdAt).toISOString(),
            "author": [{
              "@type": "Person",
              "name": blog.authorId || "admin"
            }],
            "publisher": {
              "@type": "Organization",
              "name": "ibiGmedia"
            },
            "description": blog.excerpt || blog.content?.substring(0, 150).replace(/<[^>]+>/g, '') || blog.title
          })
        }}
      />
    </div>
  );
}
