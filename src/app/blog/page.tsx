"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FileText, ArrowRight, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function BlogPage() {
  const router = useRouter();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const qBlogs = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
        const snapBlogs = await getDocs(qBlogs);
        setBlogs(snapBlogs.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            title: data.title ? data.title.normalize('NFC') : data.title,
            excerpt: data.excerpt ? data.excerpt.normalize('NFC') : data.excerpt
          };
        }));
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F6]">
      {/* Header Section */}
      <section className="pt-32 pb-16 px-6 text-center border-b border-[#78716A]/10 bg-white">
        <h1 className="text-5xl md:text-7xl font-handwriting mb-4 text-[#2D2926]">ibiGmedia Journal</h1>
        <p className="text-[#78716A] text-lg font-light italic max-w-2xl mx-auto">
          찬양과 예배, 그리고 음악에 대한 깊이 있는 통찰과 이야기
        </p>
      </section>

      {/* Blog List Section */}
      <section className="pt-16 pb-32 px-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center items-center py-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E6C79C]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <article 
                key={blog.id} 
                className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-[#78716A]/5 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col group"
                onClick={() => router.push(`/blog/${blog.id}`)}
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                  {blog.imageUrl ? (
                    <Image 
                      src={blog.imageUrl} 
                      alt={blog.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                      unoptimized 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#78716A]/30">
                      <FileText size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity opacity-0 group-hover:opacity-100" />
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold text-[#2D2926] bg-[#E6C79C]/20 px-3 py-1 rounded-full uppercase tracking-wider">
                      {blog.category || 'Journal'}
                    </span>
                    {blog.tags && blog.tags.slice(0, 2).map((tag: string, index: number) => (
                      <span key={index} className="text-xs text-[#78716A] bg-gray-100 px-2 py-1 rounded-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-bold text-2xl text-[#2D2926] leading-tight line-clamp-2 mb-4 group-hover:text-[#E6C79C] transition-colors">
                    {blog.title}
                  </h3>
                  <p className="text-[#78716A] line-clamp-3 font-light leading-relaxed mb-6 flex-1">
                    {blog.excerpt || blog.content?.replace(/<[^>]+>/g, '') || ''}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-[#78716A]/10">
                    <div className="flex items-center text-xs text-[#78716A] gap-2 font-medium">
                      <span>{new Date(blog.createdAt).toLocaleDateString('ko-KR')}</span>
                      <span>•</span>
                      <span>By {blog.authorId || 'admin'}</span>
                    </div>
                    <div className="text-[#2D2926] bg-[#FAF9F6] p-2 rounded-full group-hover:bg-[#E6C79C]/20 transition-colors">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {blogs.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-32 text-[#78716A]">
                <BookOpen size={64} className="mb-6 opacity-20" />
                <p className="text-xl font-handwriting">아직 작성된 저널이 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
