"use client"; // บรรทัดนี้สำคัญ! บอก Next.js ว่าไฟล์นี้มีการกดปุ่ม/เปลี่ยนหน้า

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Wrench, User, Rss } from "lucide-react";

// เมนูทั้งหมดของเรา
const menuItems = [
  { name: "Home", icon: Home, path: "/" },
  { name: "Insider", icon: Rss, path: "/insider" }, // เพิ่มหน้า Insider ตามบรีฟ
  { name: "Schedule", icon: Calendar, path: "/schedule" },
  { name: "Tools", icon: Wrench, path: "/tools" },
  { name: "Profile", icon: User, path: "/profile" },
];

export default function Navbar() {
  const pathname = usePathname(); // เช็คว่าตอนนี้อยู่หน้าไหน

  return (
    <>
      {/* 📱 Mobile Bottom Bar (แสดงเฉพาะมือถือ) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 pb-5 z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.name} href={item.path} className="flex flex-col items-center gap-1 w-full">
              <item.icon
                size={24}
                className={isActive ? "text-sit-primary" : "text-gray-400"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] ${isActive ? "text-sit-primary font-bold" : "text-gray-400"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* 💻 Desktop Sidebar (แสดงเฉพาะจอใหญ่ md ขึ้นไป) */}
      <div className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-gray-200 p-6 z-50">
        <div className="mb-8 pl-2">
          <h1 className="text-2xl font-bold text-sit-primary">SIT App</h1>
          <p className="text-xs text-gray-400">For SIT Student</p>
        </div>
        
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? "bg-sit-primary text-white shadow-md shadow-blue-200" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-sit-primary"
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}