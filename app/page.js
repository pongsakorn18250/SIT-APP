"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase"; // เช็ค path ให้ตรง (น่าจะ ../lib/supabase)
import { Loader2, Crown, ShieldAlert } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("STUDENT");

  useEffect(() => {
    const checkUser = async () => {
      // 1. เช็ค Session ปัจจุบัน
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // ❌ ถ้ายังไม่ Login -> ดีดไปหน้า Register ทันที!
        router.replace("/register");
        return;
      }

      // ✅ ถ้า Login แล้ว -> ให้ดึงข้อมูลมาโชว์หน้า Home
      setUser(session.user);
      
      // ดึง Role มาโชว์เท่ๆ
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      
      if (profile) setRole(profile.role);
      
      setLoading(false);
    };

    checkUser();
  }, [router]);

  // ตอนกำลังเช็ค Login ให้หมุนๆ รอไปก่อน
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // --- ส่วนนี้จะโชว์เฉพาะคนที่ Login แล้วเท่านั้น (Dashboard) ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-lg w-full border border-gray-100 animate-fade-in-up">
        
        <div className="mb-6 flex justify-center">
           <div className={`w-20 h-20 rounded-full flex items-center justify-center ${role === 'OWNER' ? 'bg-orange-100 text-orange-500' : 'bg-blue-100 text-blue-500'}`}>
              {role === 'OWNER' ? <Crown size={40} /> : <ShieldAlert size={40} />}
           </div>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Welcome Back!</h1>
        <p className="text-gray-500 mb-8">You are logged in as <span className="font-bold text-gray-800">{user?.email}</span></p>

        <div className="p-4 bg-gray-50 rounded-2xl mb-8 border border-gray-200">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Current Role</p>
            <p className={`text-xl font-bold ${role === 'OWNER' ? 'text-orange-600' : 'text-blue-600'}`}>{role}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push('/profile')} className="py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                Go to Profile
            </button>
            <button onClick={() => router.push('/schedule')} className="py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                Check Schedule
            </button>
        </div>
        
        {/* ปุ่ม Logout */}
        <button 
            onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/register");
            }}
            className="mt-6 text-sm text-red-500 hover:text-red-700 font-bold underline"
        >
            Logout
        </button>

      </div>
    </div>
  );
}