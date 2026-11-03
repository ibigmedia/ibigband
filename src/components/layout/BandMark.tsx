// 로고 마크: 소문자 i의 점(포인트 색) + 음표. 글자 "ibiGband"와 함께 쓴다.
export default function BandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="44" cy="23" r="7.5" fill="#E6C79C" />
      <path d="M50 37v36" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="39.5" cy="73" rx="13.5" ry="10.5" transform="rotate(-20 39.5 73)" fill="#fff" />
      <path d="M50 37q15 3 19 17" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
