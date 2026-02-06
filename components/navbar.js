"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Wrench, User, Rss, ShieldAlert } from "lucide-react";

// ✅ ประกาศ menuItems ไว้ตรงนี้ (แก้ Error: menuItems is not defined)
const menuItems = [
  { name: "Home", icon: Home, path: "/" },
  { name: "Insider", icon: Rss, path: "/insider" },
  { name: "Schedule", icon: Calendar, path: "/schedule" },
  { name: "Tools", icon: Wrench, path: "/tools" },
  { name: "Profile", icon: User, path: "/profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(""); // ✅ เพิ่มตัวแปรเก็บอีเมล

  const ADMIN_EMAIL = "Admin1@gmail.com"; 

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserEmail(user.email); // ✅ เก็บอีเมลไว้เช็ค Admin
        
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  // ✅ เช็ค Admin แบบไม่สนตัวเล็ก/ใหญ่ และเช็คว่า currentUserEmail มีค่าแล้วหรือยัง
  const isAdmin = currentUserEmail && (currentUserEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  const getMajorColorClass = (major) => {
    switch (major) {
      case "IT": return "text-blue-600 bg-blue-50 border-blue-100";
      case "CS": return "text-indigo-600 bg-indigo-50 border-indigo-100";
      case "DSI": return "text-teal-600 bg-teal-50 border-teal-100";
      default: return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  // ซ่อน Navbar ในหน้าเหล่านี้
  const disableNavbar = ["/login", "/register", "/select-major", "/select-character", "/admin"];
  if (disableNavbar.includes(pathname)) return null;

  return (
    <>
      {/* 📱 MOBILE TOP AREA (Floating Profile) */}
      <div className="md:hidden fixed top-0 left-0 right-0 p-5 z-40 flex justify-between items-start pointer-events-none">
        <Link 
            href="/profile" 
            className="pointer-events-auto bg-white/95 backdrop-blur-xl shadow-xl rounded-2xl p-2 pr-5 flex items-center gap-3 border border-white/60 active:scale-95 transition-transform"
        >
            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
                <img src={profile?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Guest"} alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
                 <span className="text-sm font-bold text-gray-800 leading-tight mb-0.5">
                    {profile?.first_name || "Guest"}
                 </span>
                 <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getMajorColorClass(profile?.major)}`}>
                        {profile?.major || "..."}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono font-medium">
                        #{profile?.student_id ? profile.student_id.slice(-3) : "..."}
                    </span>
                 </div>
            </div>
        </Link>
      </div>

      {/* 📱 MOBILE BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 pb-5 z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.name} href={item.path} className="flex flex-col items-center gap-1 w-full">
              <item.icon size={24} className={isActive ? "text-sit-primary" : "text-gray-400"} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? "text-sit-primary font-bold" : "text-gray-400"}`}>{item.name}</span>
            </Link>
          );
        })}
        
        {/* ปุ่มลับ Admin (Mobile) */}
        {isAdmin && (
          <Link href="/admin" className="flex flex-col items-center gap-1 w-full text-red-500">
            <ShieldAlert size={24} />
            <span className="text-[10px] font-bold">Admin</span>
          </Link>
        )}
      </div>

      {/* 💻 DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-gray-200 p-6 z-50">
        <div className="mb-8 pl-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 overflow-hidden border-2 border-sit-secondary">
               <img src={profile?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Guest"} alt="Avatar" />
            </div>
            <div>
               <h1 className="text-sm font-bold text-sit-primary truncate w-32">
                 {profile?.first_name || "SIT Student"}
               </h1>
               <p className="text-xs text-gray-400 font-mono">
                 {profile?.major || "Major"} #{profile?.student_id ? profile.student_id.slice(-3) : "???"}
               </p>
            </div>
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

          {/* ปุ่มลับ Admin (Desktop) */}
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-500 hover:bg-red-50 font-bold mt-4 border border-red-100">
              <ShieldAlert size={20} />
              <span>Admin Tool</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}