import { AdminSideNav, AdminMobileNav } from './AdminNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 bg-[#1A1817] text-white flex flex-col min-h-screen">
      <div className="flex flex-1 relative">
        <AdminSideNav />
        {/* 모바일 에서는 탭바만큼 공간 확보(pb-28), 상단은 헤더/네비(pt-8) */}
        <main className="flex-1 p-4 pb-28 pt-8 lg:p-10 lg:pt-10 lg:pb-10 overflow-x-hidden overflow-y-auto w-full">
          {children}
        </main>
      </div>
      <AdminMobileNav />
    </div>
  );
}
