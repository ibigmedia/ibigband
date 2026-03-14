'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  imageUrl: string;
  createdAt: any;
}

export default function BlogPostPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    try {
      const docRef = doc(db, 'blogs', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBlog({ id: docSnap.id, ...docSnap.data() } as Blog);
      } else {
        console.error('No such document!');
        router.push('/blog');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex-1 py-32 flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-12 h-12 text-[#E6C79C] animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  return (
    <article className="flex-1 bg-[#FAF9F6] pb-12 md:pb-24">
      {/* Hero Header Area */}
      <header className="relative w-full h-[60vh] md:h-[70vh] bg-[#2D2926] flex items-center justify-center -mt-24 mb-16 overflow-hidden">
        {blog.imageUrl ? (
          <img 
            src={blog.imageUrl} 
            alt={blog.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2D2926] to-[#78716A]"></div>
        )}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-transparent to-transparent"></div>
        
        {/* Header Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center mt-20">
          <div className="flex items-center justify-center gap-4 text-[#E6C79C] text-sm font-bold uppercase tracking-[0.2em] mb-6">
            <span className="flex items-center gap-2"><Calendar size={16} /> {formatDate(blog.createdAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-2"><User size={16} /> {blog.author || 'Admin'}</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-handwriting font-bold text-white leading-tight drop-shadow-2xl">
            {blog.title}
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-6">
        <Link 
          href="/blog" 
          className="inline-flex items-center text-[#78716A] hover:text-[#E6C79C] font-semibold mb-12 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" /> Back to Journal
        </Link>
        
        <div 
          className="prose prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:text-[#2D2926] prose-p:text-[#4A4744] prose-a:text-[#E6C79C] prose-img:rounded-3xl prose-img:shadow-xl prose-img:my-10 leading-loose"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
        
        <div className="mt-20 pt-10 border-t border-[#78716A]/20 flex justify-between items-center">
          <p className="text-[#78716A] italic">
            Thank you for reading out journey.
          </p>
          <Link 
            href="/blog" 
            className="px-6 py-3 border border-[#E6C79C] text-[#E6C79C] rounded-full text-sm font-bold hover:bg-[#E6C79C] hover:text-white transition-all shadow-md"
          >
            Show All Articles
          </Link>
        </div>
      </div>
    </article>
  );
}
