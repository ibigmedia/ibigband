'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { addFavorite, removeFavorite, isFavorite } from '@/lib/firebase/favorites';
import { Sheet } from '@/types/sheet';
import { useTranslations } from 'next-intl';

interface FavoriteButtonProps {
  sheet: Sheet;
  size?: number;
  className?: string;
  isFavorited?: boolean;
  onToggle?: (nextFavorited: boolean) => void;
}

export default function FavoriteButton({
  sheet,
  size = 20,
  className = '',
  isFavorited,
  onToggle,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const t = useTranslations('sheets');
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof isFavorited === 'boolean') {
      setFavorited(isFavorited);
      return;
    }

    if (!user) {
      setFavorited(false);
      return;
    }

    isFavorite(user.uid, sheet.id).then(setFavorited);
  }, [isFavorited, user, sheet.id]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      alert(t('favLoginRequired'));
      return;
    }

    setLoading(true);
    try {
      if (favorited) {
        await removeFavorite(user.uid, sheet.id);
        setFavorited(false);
        onToggle?.(false);
      } else {
        await addFavorite(user.uid, {
          sheetId: sheet.id,
          title: sheet.title,
          artistId: sheet.artistId,
          thumbnailUrl: sheet.thumbnailUrl,
        });
        setFavorited(true);
        onToggle?.(true);
      }
    } catch (err) {
      console.error('즐겨찾기 처리 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`transition-all duration-200 hover:scale-110 disabled:opacity-50 ${className}`}
      aria-label={favorited ? t('favAriaRemove') : t('favAriaAdd')}
    >
      <Heart
        size={size}
        className={
          favorited
            ? 'fill-red-500 text-red-500'
            : 'text-white/50 hover:text-white/80'
        }
      />
    </button>
  );
}
