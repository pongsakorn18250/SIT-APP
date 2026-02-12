"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, LogOut, Crown, Edit3, X, CheckCircle } from "lucide-react";

// Avatar Seeds เดิม
const AVATAR_SEEDS = [
  "Felix", "Aneka", "Zoe", "Jack", "Abby", "Liam", 
  "Molly", "Pepper", "Sugar", "Dusty", "Ginger", "Bandit",
  "Midnight", "Rocky", "Cuddles", "Snuggles", "Boots", "Whiskers",
  "Socks", "Tiger", "Shadow", "Coco", "Missy", "Jasper",
  "Smokey", "Loki", "Sasha", "Oscar", "Sammy", "Misty"
];

export default function MiniProfile() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Fetch function แยกออกมาเพื่อให้เรียกใช้ซ้ำได้
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) {
            setIsAdmin(data.role !== 'STUDENT');
            setProfile(data);
        }
      } else {
        setProfile(null); // Clear profile if no user
      }
    };

    // 2. เรียกครั้งแรกตอน Load
    fetchUser();

    // 3. ✅ เพิ่ม Listener ดักจับการ Login/Logout แบบ Real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            fetchUser(); // ดึงข้อมูลใหม่ทันที
        } else if (event === 'SIGNED_OUT') {
            setProfile(null);
            setIsAdmin(false);
        }
    });

    // Cleanup Listener
    return () => {
        subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if(!confirm("Log out now?")) return;
    await supabase.auth.signOut();
    router.push("/register");
  };

  const handleAvatarChange = async (newUrl) => {
    setLoading(true);
    await supabase.from("profiles").update({ avatar: newUrl }).eq("id", profile.id);
    setProfile({ ...profile, avatar: newUrl });
    setShowAvatarModal(false);
    setLoading(false);
    // ไม่ต้อง window.location.reload() แล้ว เพราะ State อัปเดตเอง
  };

  const getStudentIdDisplay = () => profile?.student_id ? String(profile.student_id).slice(-3) : "???";

  let themeButton = "bg-gray-800 text-white";
  if (profile?.role === 'OWNER') themeButton = "bg-yellow-600 text-white";
  else if (isAdmin) themeButton = "bg-rose-600 text-white";
  else if (profile?.major === "IT") themeButton = "bg-blue-600 text-white";
  else if (profile?.major === "CS") themeButton = "bg-indigo-600 text-white";
  else if (profile?.major === "DSI") themeButton = "bg-emerald-600 text-white";

  const isAuthPage = ["/login", "/register", "/select-major", "/select-character"].includes(pathname);
  if (isAuthPage) return null;

  if (!profile) return null;

  return (
    <>
      <div className="md:hidden absolute top-4 left-4 z-[50]">
        <div className="relative">
            <button 
                onClick={() => setShowMenu(!showMenu)} 
                className={`flex items-center gap-2 p-1.5 pr-3 rounded-full shadow-md border border-white/50 active:scale-95 transition-transform ${themeButton}`}
            >
                <div className="w-9 h-9 rounded-full bg-white overflow-hidden border border-white/20 shrink-0">
                    <img src={profile?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Guest"} className="w-full h-full object-cover"/>
                </div>
                <div className="text-left leading-tight">
                    <p className="text-xs font-bold text-white shadow-sm">{profile?.first_name}</p>
                    <div className="flex items-center gap-1">
                        {profile?.role === 'OWNER' && <Crown size={10} className="text-yellow-300 fill-yellow-300"/>}
                        <p className="text-[9px] font-bold text-white/90">
                            {isAdmin ? profile?.role : `${profile?.major} #${getStudentIdDisplay()}`}
                        </p>
                    </div>
                </div>
                <ChevronDown size={12} className={`text-white/90 transition-transform ${showMenu ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
                <div className="absolute top-14 left-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col animate-fade-in-up origin-top-left">
                    <button onClick={() => { setShowAvatarModal(true); setShowMenu(false); }} className="p-3 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Edit3 size={14}/> Change Avatar
                    </button>
                    <div className="h-[1px] bg-gray-100 mx-2"></div>
                    <button onClick={handleLogout} className="p-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2">
                        <LogOut size={14}/> Log Out
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Choose New Avatar</h2>
                    <button onClick={() => setShowAvatarModal(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-4 gap-3">
                        {AVATAR_SEEDS.map((seed) => (
                            <button key={seed} disabled={loading} onClick={() => handleAvatarChange(`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`)} className="rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 bg-gray-50 aspect-square">
                                <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`} className="w-full h-full"/>
                            </button>
                        ))}
                    </div>
                </div>
             </div>
        </div>
      )}
    </>
  );
}