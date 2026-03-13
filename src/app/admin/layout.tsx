export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#2D2926] text-white">
      {/* 어드민 사이드바 등 전용 레이아웃 요소를 배치할 수 있습니다 */}
      <div className="flex">
        <aside className="w-64 bg-black/20 p-6 hidden md:block min-h-screen">
          <h2 className="text-2xl font-handwriting text-[#E6C79C] mb-10">ibigband<br/>Admin Space</h2>
          <nav className="space-y-4 text-sm font-light">
            <a href="/admin" className="block text-[#E6C79C] font-bold">Dashboard</a>
            <a href="/admin/sheets" className="block hover:text-[#E6C79C] transition-colors">Sheet Music</a>
            <a href="/admin/blog" className="block hover:text-[#E6C79C] transition-colors">Blog Posts</a>
            <a href="/admin/users" className="block hover:text-[#E6C79C] transition-colors">Users & Payments</a>
          </nav>
        </aside>
        <main className="flex-1 p-10 pt-32 md:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}
