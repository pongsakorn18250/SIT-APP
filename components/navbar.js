"use client";
import { useState, useEffect } from "react"; // เพิ่ม useEffect
import { supabase } from "../lib/supabase";   // เรียก Supabase
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Wrench, User, Rss } from "lucide-react";

const menuItems = [
  { name: "Home", icon: Home, path: "/" },
  { name: "Insider", icon: Rss, path: "/insider" },
  { name: "Schedule", icon: Calendar, path: "/schedule" },
  { name: "Tools", icon: Wrench, path: "/tools" },
  { name: "Profile", icon: User, path: "/profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState(null); // เก็บข้อมูล User

  // 1. ดึงข้อมูล User เมื่อโหลด Navbar
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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

  // หน้าที่ไม่เอา Navbar
  const disableNavbar = ["/login", "/register", "/select-major", "/select-character"];
  if (disableNavbar.includes(pathname)) return null;

  return (
    <>
      {/* 📱 Mobile Bottom Bar */}
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
      </div>

      {/* 💻 Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-gray-200 p-6 z-50">
        
        {/* --- ส่วน Profile ด้านบน (โชว์ข้อมูลจริงจาก DB) --- */}
        <div className="mb-8 pl-2 flex items-center gap-3">
            {/* โชว์รูปตัวละคร (ถ้าไม่มีใส่รูป Default) */}
            <div className="w-12 h-12 rounded-full bg-blue-50 overflow-hidden border-2 border-sit-secondary">
               <img src={profile?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Guest"} alt="Avatar" />
            </div>
            <div>
               <h1 className="text-sm font-bold text-sit-primary truncate w-32">
                 {profile?.first_name || "SIT Student"}
               </h1>
               <p className="text-xs text-gray-400">
                 {profile?.major || "No Major"} #{profile?.student_id ? profile.student_id.slice(-2) : "??"}
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
        </div>
      </div>
    </>
  );
}