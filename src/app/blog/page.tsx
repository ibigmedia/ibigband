'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
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

export default function BlogListingPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blog));
      setBlogs(data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
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
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-12 h-12 text-[#E6C79C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Magazine Header */}
        <div className="text-center mb-24 space-y-6">
          <h1 className="text-5xl md:text-7xl font-handwriting font-bold text-[#2D2926]">
            iBigMedia <span className="text-[#E6C79C]">Journal</span>
          </h1>
          <p className="text-[#78716A] text-lg max-w-2xl mx-auto italic font-light">
            "Art and faith intersecting in our daily lives. Read our latest thoughts, AI-generated insights, and updates."
          </p>
          <div className="w-24 h-1 bg-[#E6C79C] mx-auto rounded-full mt-10"></div>
        </div>

        {/* Featured / Grid Loop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {blogs.length === 0 ? (
            <div className="col-span-12 text-center py-20 text-[#78716A]">
              No posts found. Start writing in the admin panel!
            </div>
          ) : (
            <>
              {/* Top Featured Post (Latest) */}
              <div className="col-span-1 lg:col-span-12">
                <Link href={`/blog/${blogs[0].id}`} className="group block">
                  <div className="relative rounded-[2rem] overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-[#2D2926] shadow-2xl">
                    {blogs[0].imageUrl && (
                      <img 
                        src={blogs[0].imageUrl} 
                        alt={blogs[0].title}
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    
                    <div className="absolute bottom-8 left-8 right-8 md:bottom-16 md:left-16 md:right-16 text-white">
                      <div className="flex items-center gap-4 text-sm font-medium text-[#E6C79C] mb-4 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(blogs[0].createdAt)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><User size={14} /> {blogs[0].author || 'Admin'}</span>
                      </div>
                      <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight group-hover:text-[#E6C79C] transition-colors line-clamp-2">
                        {blogs[0].title}
                      </h2>
                      <p className="text-[#D4D4D8] md:text-lg line-clamp-2 max-w-3xl font-light">
                        {blogs[0].excerpt || blogs[0].content.replace(/<[^>]+>/g, '')}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Remaining Posts Grid */}
              {blogs.slice(1).map((blog) => (
                <div key={blog.id} className="col-span-1 md:col-span-6 lg:col-span-4">
                  <Link href={`/blog/${blog.id}`} className="group block h-full flex flex-col">
                    <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-[#2D2926] shadow-lg mb-6">
                      {blog.imageUrl ? (
                        <img 
                          src={blog.imageUrl} 
                          alt={blog.title}
                          className="w-full h-full object-cover opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-[#2D2926] to-[#78716A] flex items-center justify-center">
                           <h3 className="text-white/30 font-handwriting text-3xl px-4 text-center line-clamp-2">{blog.title}</h3>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-3 text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-3">
                        <span>{formatDate(blog.createdAt)}</span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-[#2D2926] mb-3 line-clamp-2 group-hover:text-[#E6C79C] transition-colors">
                        {blog.title}
                      </h3>
                      
                      <p className="text-[#78716A] line-clamp-3 mb-6 font-light leading-relaxed flex-1">
                        {blog.excerpt || blog.content.replace(/<[^>]+>/g, '')}
                      </p>
                      
                      <div className="flex items-center text-[#E6C79C] font-bold text-sm uppercase tracking-wide group-hover:translate-x-2 transition-transform self-start">
                        Read Story <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
