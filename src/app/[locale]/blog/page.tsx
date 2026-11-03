"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FileText, ArrowRight, BookOpen } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function BlogPage() {
  const router = useRouter();
  const t = useTranslations('blog');
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
    <div className="flex-1 flex flex-col bg-[#F5F2EC]">
      {/* Header Section */}
      <section className="pt-16 pb-8 px-6 text-center border-b border-[#78716A]/10 bg-white">
        <h1 className="text-4xl md:text-6xl font-handwriting mb-4 text-t-gold">ibiGband Journal</h1>
        <p className="text-t-muted text-lg font-normal italic max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </section>

      {/* Blog List Section */}
      <section className="pt-16 pb-32 px-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center items-center py-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E8481C]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {blogs.map((blog) => (
              <article 
                key={blog.id} 
                className="bg-white rounded-2xl md:rounded-[18px] overflow-hidden shadow-sm border border-[#78716A]/5 hover:shadow-md md:hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-row md:flex-col group"
                onClick={() => router.push(`/blog/${blog.id}`)}
              >
                <div className="w-1/3 md:w-full aspect-[3/4] md:aspect-[4/3] relative overflow-hidden bg-[#ECE7DC] shrink-0">
                  {blog.imageUrl ? (
                    <Image 
                      src={blog.imageUrl} 
                      alt={blog.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105" 
                      unoptimized 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-t-muted/30">
                      <FileText size={24} className="md:w-16 md:h-16"/>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/5 md:bg-black/10 transition-opacity opacity-0 group-hover:opacity-100" />
                </div>
                <div className="p-4 md:p-6 md:px-8 flex flex-col flex-1 justify-center bg-white">
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2 md:mb-4">
                    <span className="text-[12px] md:text-xs font-bold text-t-gold uppercase tracking-wider">
                      {blog.category || 'Journal'}
                    </span>
                    <div className="hidden md:flex gap-1.5 flex-wrap">
                      {blog.tags && blog.tags.slice(0, 2).map((tag: string, index: number) => (
                        <span key={index} className="text-xs text-t-muted bg-gray-100 px-2 py-1 rounded-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className="font-bold text-[15px] md:text-2xl text-[#121110] leading-tight line-clamp-2 md:line-clamp-2 mb-2 md:mb-4 group-hover:text-t-gold transition-colors">
                    {blog.title}
                  </h3>
                  <p className="text-[12px] md:text-base text-t-muted line-clamp-2 md:line-clamp-3 font-normal leading-relaxed mb-0 md:mb-6 flex-1">
                    {blog.excerpt || blog.content?.replace(/<[^>]+>/g, '') || ''}
                  </p>
                  <div className="hidden md:flex items-center justify-between mt-auto pt-6 border-t border-[#78716A]/10">
                    <div className="flex items-center text-xs text-t-muted gap-2 font-medium">
                      
                    </div>
                    <div className="text-[#121110] bg-[#F5F2EC] p-2 rounded-full group-hover:bg-[#E8481C]/20 transition-colors">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {blogs.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-32 text-t-muted">
                <BookOpen size={64} className="mb-6 opacity-20" />
                <p className="text-lg font-handwriting">{t('empty')}</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
