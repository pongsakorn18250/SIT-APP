"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Home, Calendar, Settings, User, Rss, ShieldAlert, LogOut, 
  ChevronDown, Edit3, X, CheckCircle, Crown 
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AVATAR_SEEDS = [
  "Felix", "Aneka", "Zoe", "Jack", "Abby", "Liam", 
  "Molly", "Pepper", "Sugar", "Dusty", "Ginger", "Bandit",
  "Midnight", "Rocky", "Cuddles", "Snuggles", "Boots", "Whiskers",
  "Socks", "Tiger", "Shadow", "Coco", "Missy", "Jasper",
  "Smokey", "Loki", "Sasha", "Oscar", "Sammy", "Misty"
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [profile, setProfile] = useState(null);
  const [showMiniMenu, setShowMiniMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data?.role !== 'STUDENT') {
            setIsAdmin(true);
        }
        setProfile(data);
      }
    };
    fetchUser();
  }, []);

  const performLogout = async () => {
    await supabase.auth.signOut();
    router.push("/register"); 
    router.refresh();
  };

  const handleQuickAvatarChange = async (newUrl) => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ avatar: newUrl }).eq("id", profile.id);
    if (!error) {
        setProfile({ ...profile, avatar: newUrl });
        setShowAvatarModal(false);
    }
    setLoading(false);
  };

  // Helper ดึงรหัส 3 ตัวท้าย (ป้องกัน Error)
  const getStudentIdDisplay = () => {
    if (!profile?.student_id) return "???";
    return String(profile.student_id).slice(-3);
  };

  const getTheme = () => {
    if (profile?.role === 'OWNER') return { name: "OWNER", bgMain: "bg-yellow-50", bgNav: "bg-yellow-50/90", text: "text-yellow-600", textLight: "text-yellow-500", active: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-yellow-200", border: "border-yellow-100", button: "bg-yellow-600 text-white" };
    if (isAdmin) return { name: "ADMIN", bgMain: "bg-rose-50", bgNav: "bg-rose-50/90", text: "text-rose-600", textLight: "text-rose-400", active: "bg-rose-600 text-white shadow-rose-200", border: "border-rose-100", button: "bg-rose-600 text-white" };

    switch (profile?.major) {
      case "IT": return { bgMain: "bg-blue-50", bgNav: "bg-blue-50/90", text: "text-blue-600", textLight: "text-blue-400", active: "bg-blue-600 text-white shadow-blue-200", border: "border-blue-100", button: "bg-blue-600 text-white" };
      case "CS": return { bgMain: "bg-indigo-50", bgNav: "bg-indigo-50/90", text: "text-indigo-600", textLight: "text-indigo-400", active: "bg-indigo-600 text-white shadow-indigo-200", border: "border-indigo-100", button: "bg-indigo-600 text-white" };
      case "DSI": return { bgMain: "bg-emerald-50", bgNav: "bg-emerald-50/90", text: "text-emerald-600", textLight: "text-emerald-500", active: "bg-emerald-600 text-white shadow-emerald-200", border: "border-emerald-100", button: "bg-emerald-600 text-white" };
      default: return { bgMain: "bg-gray-50", bgNav: "bg-white/90", text: "text-gray-600", textLight: "text-gray-400", active: "bg-gray-800 text-white", border: "border-gray-200", button: "bg-gray-800 text-white" };
    }
  };
  const theme = getTheme();

  const hiddenPaths = ["/login", "/register", "/select-character", "/select-major", "/select-role"];
  if (hiddenPaths.includes(pathname)) return null;

  return (
    <>
      {/* ================= MOBILE NAV ================= */}
      <div className="md:hidden">
        {pathname !== "/profile" && (
            <div className="fixed top-4 left-4 z-50 animate-fade-in">
                <div className="relative">
                    <button onClick={() => setShowMiniMenu(!showMiniMenu)} className={`flex items-center gap-2 p-1.5 pr-3 rounded-full shadow-lg active:scale-95 transition-transform ${theme.button}`}>
                        <div className="w-9 h-9 rounded-full bg-white overflow-hidden border-2 border-white/50">
                            <img src={profile?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Guest"} className="w-full h-full object-cover"/>
                        </div>
                        <div className="text-left leading-tight">
                            <p className="text-xs font-bold text-white">{profile?.first_name || "Guest"}</p>
                            <div className="flex items-center gap-1">
                                {profile?.role === 'OWNER' && <Crown size={10} className="text-yellow-300 fill-yellow-300"/>}
                                {/* ✅ MOBILE: โชว์ 3 ตัวท้าย */}
                                <p className="text-[9px] font-bold text-white/80">
                                    {isAdmin ? profile?.role : `${profile?.major} #${getStudentIdDisplay()}`}
                                </p>
                            </div>
                        </div>
                        <ChevronDown size={12} className={`text-white/70 transition-transform ${showMiniMenu ? "rotate-180" : ""}`} />
                    </button>

                    {showMiniMenu && (
                        <div className="absolute top-12 left-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up flex flex-col z-50">
                            <button onClick={() => { setShowAvatarModal(true); setShowMiniMenu(false); }} className="p-3 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 group">
                                <div className={`p-1 rounded-md ${theme.bgMain} ${theme.text}`}><Edit3 size={14} /></div> Change Avatar
                            </button>
                            <div className="h-[1px] bg-gray-100 mx-2"></div>
                            <button onClick={() => { setShowLogoutConfirm(true); setShowMiniMenu(false); }} className="p-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2">
                                <LogOut size={14} /> Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        <nav className={`fixed bottom-0 w-full border-t flex justify-around py-3 pb-5 z-40 text-xs font-bold transition-colors backdrop-blur-md ${theme.bgNav} ${theme.border} ${theme.textLight}`}>
          {isAdmin ? (
             <>
                <NavItemMobile href="/admin" icon={ShieldAlert} label="Admin" active={pathname === "/admin"} theme={theme} />
                <NavItemMobile href="/profile" icon={User} label="Profile" active={pathname === "/profile"} theme={theme} />
             </>
          ) : (
             <>
                <NavItemMobile href="/" icon={Home} label="Home" active={pathname === "/"} theme={theme} />
                <NavItemMobile href="/insider" icon={Rss} label="Insider" active={pathname === "/insider"} theme={theme} />
                <NavItemMobile href="/schedule" icon={Calendar} label="Schedule" active={pathname === "/schedule"} theme={theme} />
                <NavItemMobile href="/tools" icon={Settings} label="Tools" active={pathname === "/tools"} theme={theme} />
                <NavItemMobile href="/profile" icon={User} label="Profile" active={pathname === "/profile"} theme={theme} />
             </>
          )}
        </nav>
      </div>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className={`hidden md:flex flex-col w-64 h-screen border-r fixed left-0 top-0 p-6 z-50 transition-colors ${theme.bgMain} ${theme.border}`}>
        <div className="flex items-center gap-3 mb-10 pl-2">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm overflow-hidden relative">
                <img src={profile?.avatar} className="w-full h-full object-cover" />
                {profile?.role === 'OWNER' && <div className="absolute top-0 right-0 bg-yellow-400 rounded-full p-0.5 border border-white"><Crown size={8} className="text-white fill-white"/></div>}
            </div>
            <div>
                <p className="font-bold text-gray-800 text-lg leading-tight">{profile?.first_name}</p>
                {/* ✅ DESKTOP: แก้ให้โชว์ 3 ตัวท้ายเหมือนกัน */}
                <p className={`text-xs font-bold ${theme.text}`}>
                    {isAdmin ? profile?.role : `${profile?.major} #${getStudentIdDisplay()}`}
                </p>
            </div>
        </div>

        <nav className="flex-1 space-y-1">
          {isAdmin ? (
             <>
                <NavItemDesktop href="/admin" icon={ShieldAlert} label="Admin Console" active={pathname === "/admin"} theme={theme} />
                <NavItemDesktop href="/profile" icon={User} label="My Profile" active={pathname === "/profile"} theme={theme} />
             </>
          ) : (
             <>
                <NavItemDesktop href="/" icon={Home} label="Home" active={pathname === "/"} theme={theme} />
                <NavItemDesktop href="/insider" icon={Rss} label="Insider" active={pathname === "/insider"} theme={theme} />
                <NavItemDesktop href="/schedule" icon={Calendar} label="Schedule" active={pathname === "/schedule"} theme={theme} />
                <NavItemDesktop href="/tools" icon={Settings} label="Tools" active={pathname === "/tools"} theme={theme} />
                <NavItemDesktop href="/profile" icon={User} label="Profile" active={pathname === "/profile"} theme={theme} />
             </>
          )}
        </nav>

        <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-3 p-3 rounded-xl text-red-500 font-bold hover:bg-red-50 transition-all mt-auto pl-4 group">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> Logout
        </button>
      </div>

      {/* ================= MODALS ================= */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Edit3 size={18} className={theme.text}/> Choose New Avatar</h2>
                    <button onClick={() => setShowAvatarModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {AVATAR_SEEDS.map((seed) => {
                            const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
                            const isSelected = profile?.avatar === url;
                            return (
                                <button key={seed} disabled={loading} onClick={() => handleQuickAvatarChange(url)} className={`relative rounded-xl overflow-hidden border-2 aspect-square transition-all ${isSelected ? `${theme.border} ring-2 ring-offset-1 scale-105` : "border-transparent bg-gray-50 hover:bg-gray-100"}`}>
                                    <img src={url} className="w-full h-full" />
                                    {isSelected && <div className={`absolute top-1 right-1 ${theme.text}`}><CheckCircle size={16} fill="white" /></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>
             </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center relative overflow-hidden">
                <div className={`w-32 h-32 mx-auto mb-4 rounded-full border-4 border-white shadow-lg animate-bounce ${theme.bgMain}`}>
                    <img src={profile?.avatar} className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Leaving already?</h2>
                <p className="text-gray-500 mb-8">See you later, {profile?.first_name}! 👋</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                    <button onClick={performLogout} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">Yes, Bye!</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}

function NavItemMobile({ href, icon: Icon, label, active, theme }) {
    return (
        <Link href={href} className={`flex flex-col items-center gap-1 transition-all ${active ? theme.text : "hover:text-gray-600"}`}>
            <Icon size={24} className={active ? "scale-110" : ""} /> 
            <span>{label}</span>
        </Link>
    )
}

function NavItemDesktop({ href, icon: Icon, label, active, theme, customClass }) {
  return (
    <Link href={href} className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${active ? `${theme.active} shadow-lg` : `text-gray-500 hover:bg-white/50 ${customClass || ""}`}`}>
      <Icon size={20} /> {label}
    </Link>
  );
}