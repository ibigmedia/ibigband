'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Heart, Music, User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { getFavorites, removeFavorite } from '@/lib/firebase/favorites';
import { Favorite } from '@/types/favorite';
import { useTranslations } from 'next-intl';

export default function MyPage() {
  const { user, userData, loading, signOut } = useAuth();
  const router = useRouter();
  const t = useTranslations('mypage');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favLoading, setFavLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    getFavorites(user.uid)
      .then(setFavorites)
      .finally(() => setFavLoading(false));
  }, [user]);

  const handleRemove = async (sheetId: string) => {
    if (!user) return;
    setFavorites(prev => prev.filter(f => f.sheetId !== sheetId));
    await removeFavorite(user.uid, sheetId);
  };

  if (loading || !user) {
    return (
      <div className="flex-1 bg-[#FDFBF7] flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#E6C79C] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#FDFBF7] pt-12 md:pt-16 pb-16">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* 프로필 헤더 */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-full bg-[#E6C79C]/20 flex items-center justify-center border-2 border-[#E6C79C]/30">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-[#C9A675]" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-[#2D2926]">
              {userData?.displayName || t('userFallback')}
            </h1>
            <p className="text-[#78716A] text-sm">{userData?.email}</p>
          </div>
          <button
            onClick={async () => { await signOut(); router.replace('/'); }}
            className="p-2 rounded-full hover:bg-[#78716A]/10 text-[#78716A] transition-colors"
            aria-label={t('signOutAria')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* 즐겨찾기 섹션 */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <h2 className="text-xl font-bold text-[#2D2926]">{t('favoritesTitle')}</h2>
            <span className="text-sm text-[#78716A] ml-1">({favorites.length})</span>
          </div>

          {favLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-[#E6C79C] border-t-transparent animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#78716A]/10">
              <Music className="w-10 h-10 text-[#78716A]/30 mx-auto mb-3" />
              <p className="text-[#78716A] font-medium">{t('favoritesEmpty')}</p>
              <button
                onClick={() => router.push('/sheets')}
                className="mt-4 text-sm text-[#C9A675] hover:text-[#A68B5B] font-medium transition-colors"
              >
                {t('browseSheets')} &rarr;
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((fav) => (
                <div
                  key={fav.sheetId}
                  className="group bg-white rounded-2xl border border-[#78716A]/10 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/sheets?sheetId=${fav.sheetId}`)}
                >
                  {/* 썸네일 */}
                  <div className="aspect-[4/3] bg-[#F5F5F3] relative overflow-hidden">
                    {fav.thumbnailUrl ? (
                      <img
                        src={fav.thumbnailUrl}
                        alt={fav.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-10 h-10 text-[#78716A]/20" />
                      </div>
                    )}
                    {/* 하트 해제 버튼 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(fav.sheetId); }}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                      aria-label={t('removeFavoriteAria')}
                    >
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </button>
                  </div>

                  {/* 정보 */}
                  <div className="p-4">
                    <h3 className="font-bold text-[#2D2926] line-clamp-1 group-hover:text-[#C9A675] transition-colors font-handwriting text-xl">
                      {fav.title}
                    </h3>
                    <p className="text-sm text-[#78716A] mt-1 line-clamp-1">
                      {fav.artistId || t('unknownArtist')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
