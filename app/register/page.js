"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link"; 
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdminPopup, setShowAdminPopup] = useState(false);

  // States
  const [loginInput, setLoginInput] = useState(""); 
  const [signInPassword, setSignInPassword] = useState("");
  
  const [formData, setFormData] = useState({
    email: "", password: "", confirmPassword: "", firstName: "", lastName: "", username: "", studentId: "", year: "1",
  });

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const toggleMode = () => { setIsSignUpActive(!isSignUpActive); setError(null); };

  // --- 🟢 SIGN IN Logic ---
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    
    let finalEmail = loginInput.trim();
    const isEmailFormat = /\S+@\S+\.\S+/.test(finalEmail);
    
    if (!isEmailFormat) {
        const { data: foundEmail } = await supabase.rpc('get_email_by_identity', { identity_input: finalEmail });
        if (!foundEmail) { setError("User not found."); setLoading(false); return; }
        finalEmail = foundEmail; 
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: finalEmail, password: signInPassword });

    if (error) { 
        setError(error.message); setLoading(false); 
    } else { 
        // 🕵️‍♂️ Check Role เพื่อ Redirect (ห้ามเข้าหน้า Home ถ้าเป็น Staff)
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
        
        if (profile?.role === 'STUDENT') {
            router.push("/");
        } else {
            router.push("/admin");
        }
        router.refresh(); 
    }
  };

  // --- 🔵 SIGN UP Logic (แก้ใหม่ให้ฉลาด) ---
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { setError("Passwords mismatch"); return; }
    
    setLoading(true); setError(null);
    
    const lowerEmail = formData.email.toLowerCase();
    const lowerName = formData.firstName.toLowerCase();
    const isAdminOrOwner = lowerEmail.includes("admin") || lowerName.includes("admin") || 
                           lowerEmail.includes("owner") || lowerName.includes("owner");

    // ⚠️ VALIDATION: เช็ค 11 หลัก (เฉพาะ User ปกติ)
    if (!isAdminOrOwner) {
        if (!formData.studentId || formData.studentId.length !== 11) {
            setError("Student ID must be exactly 11 digits."); 
            setLoading(false); 
            return;
        }
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email, password: formData.password,
      options: { data: { full_name: formData.firstName } }
    });

    if (authError) { setError(authError.message); setLoading(false); return; }

    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").insert([{
        id: authData.user.id,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        // Admin ให้เลขมั่วไปก่อน User ปกติใช้เลขจริง
        student_id: isAdminOrOwner ? `STAFF-${Math.floor(Math.random()*10000)}` : formData.studentId, 
        year: isAdminOrOwner ? 0 : formData.year,
        role: 'STUDENT', 
        major: 'PENDING'
      }]);

      if (profileError) { 
        setError(profileError.message); setLoading(false); 
      } else { 
        if (isAdminOrOwner) setShowAdminPopup(true);
        else router.push("/select-character"); 
      }
    }
  };

  // Styles
  const inputStyle = "bg-gray-100 border-none p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-sit-secondary text-sm mb-3 shadow-inner";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4">
      
      {/* 🛑 POPUP ADMIN/OWNER */}
      {showAdminPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-gray-900 border border-gray-700 p-8 rounded-3xl shadow-2xl max-w-sm text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse border border-gray-600">
                    <ShieldCheck size={40} className="text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">SYSTEM DETECTED</h2>
                <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                    Privileged account identified.<br/>
                    Initiating secure sequence to <span className="text-green-400 font-bold">Secret Command Center</span>.
                </p>
                <button 
                    onClick={() => router.push("/select-character")} 
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/50"
                >
                    Proceed to Avatar Setup <ArrowRight size={18}/>
                </button>
            </div>
        </div>
      )}

      {/* 📱 MOBILE VIEW */}
      <div className="md:hidden bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-8 relative">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-sit-primary">
            {isSignUpActive ? "Create Account" : "Welcome Back"}
          </h1>
        </div>

        {error && <div className="bg-red-50 text-red-500 text-xs p-2 rounded mb-4 text-center">{error}</div>}

        {isSignUpActive ? (
             <form onSubmit={handleSignUp} className="flex flex-col">
                <div className="flex gap-2">
                   <input name="firstName" placeholder="First Name" className={inputStyle} value={formData.firstName || ""} onChange={handleInputChange} required />
                   <input name="lastName" placeholder="Last Name" className={inputStyle} value={formData.lastName || ""} onChange={handleInputChange} required />
                </div>
                <input name="username" placeholder="Username" className={inputStyle} value={formData.username || ""} onChange={handleInputChange} required />
                <input name="studentId" placeholder="Student ID (11 digits for Student)" className={inputStyle} value={formData.studentId || ""} onChange={handleInputChange} maxLength={11} />
                
                <select name="year" className={inputStyle} value={formData.year || ""} onChange={handleInputChange} required>
                   <option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option>
                </select>
                <input name="email" type="email" placeholder="Email (KMUTT)" className={inputStyle} value={formData.email || ""} onChange={handleInputChange} required />
                <input name="password" type="password" placeholder="Password" className={inputStyle} value={formData.password || ""} onChange={handleInputChange} required />
                <input name="confirmPassword" type="password" placeholder="Confirm Password" className={inputStyle} value={formData.confirmPassword || ""} onChange={handleInputChange} required />
                
                <button disabled={loading} className="bg-sit-primary text-white font-bold py-3 rounded-xl mt-2 hover:bg-sit-secondary transition-all">
                    {loading ? "Processing..." : "Sign Up"}
                </button>
             </form>
           ) : (
             <form onSubmit={handleSignIn} className="flex flex-col">
                <input type="text" placeholder="Email, Username or Student ID" className={inputStyle} value={loginInput || ""} onChange={e => setLoginInput(e.target.value)} required />
                <input type="password" placeholder="Password" className={inputStyle} value={signInPassword || ""} onChange={e => setSignInPassword(e.target.value)} required />
                <div className="text-right mb-4"><Link href="#" className="text-xs text-gray-400">Forgot Password?</Link></div>
                <button disabled={loading} className="bg-sit-primary text-white font-bold py-3 rounded-xl hover:bg-sit-secondary transition-all">
                    {loading ? "Checking..." : "Sign In"}
                </button>
             </form>
        )}
        
        <div className="mt-6 text-center border-t pt-4">
          <button type="button" onClick={toggleMode} className="text-sm text-sit-secondary font-bold hover:underline">
            {isSignUpActive ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>

      {/* 💻 DESKTOP VIEW */}
      <div className="hidden md:block bg-white rounded-[2rem] shadow-2xl relative overflow-hidden w-full max-w-[900px] h-[550px]">
        
        {/* --- SIGN IN FORM (Left) --- */}
        <div className={`absolute top-0 left-0 h-full w-1/2 flex flex-col items-center justify-center p-12 transition-all duration-700 ${isSignUpActive ? 'opacity-0 pointer-events-none' : 'opacity-100 z-10'}`}>
            <form onSubmit={handleSignIn} className="w-full flex flex-col items-center">
                <h1 className="text-3xl font-bold mb-4 text-sit-primary">Sign In</h1>
                
                {error && !isSignUpActive && <p className="text-red-500 text-xs mb-2 bg-red-50 p-2 rounded w-full text-center">{error}</p>}
                
                <input type="text" placeholder="Email, Username or Student ID" className={inputStyle} value={loginInput || ""} onChange={e => setLoginInput(e.target.value)} required />
                <input type="password" placeholder="Password" className={inputStyle} value={signInPassword || ""} onChange={e => setSignInPassword(e.target.value)} required />
                <Link href="#" className="text-xs text-gray-400 hover:text-sit-primary mb-4 self-end">Forgot Password?</Link>
                <button disabled={loading} className="bg-sit-primary text-white font-bold py-3 px-10 rounded-full hover:bg-sit-secondary transition-all shadow-lg">
                    {loading ? "..." : "Sign In"}
                </button>
            </form>
        </div>

        {/* --- SIGN UP FORM (Right) --- */}
        <div className={`absolute top-0 left-1/2 h-full w-1/2 flex flex-col items-center justify-center p-12 transition-all duration-700 ${!isSignUpActive ? 'opacity-0 pointer-events-none' : 'opacity-100 z-10'}`}>
            <form onSubmit={handleSignUp} className="w-full flex flex-col items-center overflow-y-auto max-h-[480px] no-scrollbar pt-4">
                <h1 className="text-3xl font-bold mb-2 text-sit-primary">Create Account</h1>

                {error && isSignUpActive && <p className="text-red-500 text-xs mb-2 bg-red-50 p-2 rounded w-full text-center">{error}</p>}

                <div className="w-full flex gap-2">
                   <input name="firstName" placeholder="First Name" className={inputStyle} value={formData.firstName || ""} onChange={handleInputChange} required />
                   <input name="lastName" placeholder="Last Name" className={inputStyle} value={formData.lastName || ""} onChange={handleInputChange} required />
                </div>
                <input name="username" placeholder="Username" className={inputStyle} value={formData.username || ""} onChange={handleInputChange} required />
                <input name="studentId" placeholder="Student ID (11 Digits for Student)" className={inputStyle} value={formData.studentId || ""} onChange={handleInputChange} />
                
                <div className="w-full flex gap-2">
                   <select name="year" className={inputStyle} value={formData.year || ""} onChange={handleInputChange} required>
                     <option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option>
                   </select>
                   <input name="email" placeholder="Email (KMUTT)" className={inputStyle} value={formData.email || ""} onChange={handleInputChange} required />
                </div>

                <input name="password" type="password" placeholder="Password" className={inputStyle} value={formData.password || ""} onChange={handleInputChange} required />
                <input name="confirmPassword" type="password" placeholder="Confirm Password" className={inputStyle} value={formData.confirmPassword || ""} onChange={handleInputChange} required />
                
                <button disabled={loading} className="bg-sit-primary text-white font-bold py-3 px-10 rounded-full mt-2 hover:bg-sit-secondary transition-all shadow-lg">
                    {loading ? "Creating..." : "Sign Up"}
                </button>
            </form>
        </div>

        {/* --- SLIDING OVERLAY --- */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-50 rounded-l-[2rem] ${isSignUpActive ? '-translate-x-full rounded-r-[2rem] rounded-l-none' : ''}`}>
          <div className="bg-gradient-to-r from-sit-primary to-sit-secondary text-white h-full w-full flex flex-col items-center justify-center text-center px-10">
                <h1 className="text-3xl font-bold mb-4">
                  {isSignUpActive ? "Welcome Back!" : "New Here?"}
                </h1>
                <p className="text-sm mb-8 text-blue-100 leading-relaxed">
                  {isSignUpActive 
                    ? "To keep connected with us please login with your personal info"
                    : "Join SIT App community, please sign up with your personal info"}
                </p>
                <button 
                  type="button" 
                  onClick={toggleMode} 
                  className="border-2 border-white text-white font-bold py-3 px-10 rounded-full hover:bg-white hover:text-sit-primary transition-all uppercase text-xs tracking-widest"
                >
                  {isSignUpActive ? "Sign In" : "Sign Up"}
                </button>
          </div>
        </div>

      </div>
      
       <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}