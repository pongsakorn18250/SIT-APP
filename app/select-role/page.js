"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { Crown, ShieldAlert, BookOpen, Calendar, Lock, ArrowRight } from "lucide-react";

export default function SelectRolePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Security
  const [accessCode, setAccessCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isOwnerCandidate, setIsOwnerCandidate] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/register"); return; }
      setUser(user);
      
      const email = user.email?.toLowerCase() || "";
      const metaName = user.user_metadata?.full_name?.toLowerCase() || "";
      
      if (email.includes("owner") || metaName.includes("owner")) {
          setIsOwnerCandidate(true);
      } else if (!email.includes("admin") && !metaName.includes("admin")) {
          router.push("/select-major"); 
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const handleSelectRole = async (role, majorName) => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
        role: role,
        major: majorName
    }).eq("id", user.id);

    if (!error) {
        router.push("/admin"); // เสร็จแล้วไป Admin Console
    } else {
        alert("Error: " + error.message);
    }
    setLoading(false);
  };

  const verifyCode = () => {
      if (accessCode === "SIT2026") setIsVerified(true);
      else { alert("Access Denied."); setAccessCode(""); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 font-bold">Checking Clearance...</div>;

  // 1. GATE
  if (!isVerified) {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white relative">
               <div className="w-full max-w-md bg-gray-800/80 backdrop-blur-md p-8 rounded-3xl border border-gray-700 shadow-2xl text-center">
                  <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-600">
                      <Lock size={32} className="text-rose-500" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2 text-rose-500 tracking-wider">RESTRICTED AREA</h1>
                  <input type="password" placeholder="ENTER CODE" className="w-full p-4 bg-gray-900/50 border border-gray-600 rounded-xl text-center text-xl font-mono font-bold tracking-[0.5em] mb-6 focus:ring-2 focus:ring-rose-500 outline-none text-white" value={accessCode} onChange={(e) => setAccessCode(e.target.value)}/>
                  <button onClick={verifyCode} className="w-full py-4 bg-rose-600 hover:bg-rose-700 rounded-xl font-bold transition-all shadow-lg shadow-rose-900/50">VERIFY IDENTITY</button>
              </div>
          </div>
      );
  }

  // 2. SELECTION
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {isOwnerCandidate ? "My Lord" : "Staff"}</h1>
          <p className="text-gray-500">Please select your operational position.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
        {isOwnerCandidate ? (
            <div className="md:col-span-3 flex justify-center">
                <button onClick={() => handleSelectRole("OWNER", "GOD MODE")} className="group relative w-full max-w-md bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-8 rounded-3xl shadow-xl hover:scale-105 transition-all text-left overflow-hidden">
                    <Crown size={180} className="absolute -top-10 -right-10 opacity-20"/>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm shadow-inner"><Crown size={32} className="text-white fill-white"/></div>
                        <h2 className="text-3xl font-bold mb-2">OWNER (God Mode)</h2>
                        <p className="text-yellow-50 text-sm mb-8">Full system access granted.</p>
                        <div className="flex items-center gap-2 font-bold bg-white/20 w-fit px-5 py-3 rounded-xl backdrop-blur-md hover:bg-white/30 transition-colors">Claim Throne <ArrowRight size={18}/></div>
                    </div>
                </button>
            </div>
        ) : (
            <>
                {/* REGISTRAR */}
                <button onClick={() => handleSelectRole("REGISTRAR", "Registrar")} className="bg-white p-6 rounded-3xl shadow-lg hover:border-blue-500 hover:shadow-blue-100 border-2 border-transparent transition-all text-left group flex flex-col h-full">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><ShieldAlert size={28}/></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">Registrar</h3>
                    <p className="text-xs text-gray-400 mb-4 font-bold uppercase">User Management</p>
                    <div className="mt-auto w-full py-2 bg-gray-50 rounded-lg text-center text-xs font-bold text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">Select Position</div>
                </button>
                {/* ACADEMIC */}
                <button onClick={() => handleSelectRole("ACADEMIC", "Academic")} className="bg-white p-6 rounded-3xl shadow-lg hover:border-green-500 hover:shadow-green-100 border-2 border-transparent transition-all text-left group flex flex-col h-full">
                    <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4"><BookOpen size={28}/></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">Academic</h3>
                    <p className="text-xs text-gray-400 mb-4 font-bold uppercase">Score & Events</p>
                    <div className="mt-auto w-full py-2 bg-gray-50 rounded-lg text-center text-xs font-bold text-gray-400 group-hover:bg-green-500 group-hover:text-white transition-colors">Select Position</div>
                </button>
                {/* SCHEDULER */}
                <button onClick={() => handleSelectRole("SCHEDULER", "Scheduler")} className="bg-white p-6 rounded-3xl shadow-lg hover:border-purple-500 hover:shadow-purple-100 border-2 border-transparent transition-all text-left group flex flex-col h-full">
                    <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4"><Calendar size={28}/></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">Scheduler</h3>
                    <p className="text-xs text-gray-400 mb-4 font-bold uppercase">Class & Time</p>
                    <div className="mt-auto w-full py-2 bg-gray-50 rounded-lg text-center text-xs font-bold text-gray-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">Select Position</div>
                </button>
            </>
        )}
      </div>
    </div>
  );
}