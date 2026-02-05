"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link"; 

export default function AuthPage() {
  const router = useRouter();
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- States ---
  // loginInput รับได้ทั้ง Email, Username, Student ID
  const [loginInput, setLoginInput] = useState(""); 
  const [signInPassword, setSignInPassword] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "", // เพิ่ม confirm password
    firstName: "",
    lastName: "",
    username: "",
    studentId: "",       // เพิ่ม student id
    year: "1",
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleMode = () => {
    setIsSignUpActive(!isSignUpActive);
    setError(null);
  };

  // --- 🟢 SIGN IN Logic (ระบบ Login อัจฉริยะ) ---
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    
    let finalEmail = loginInput.trim();

    // 1. ถ้าสิ่งที่กรอก "ไม่ใช่" รูปแบบ Email -> ให้ไปค้นหา Email จาก Username/Student ID
    const isEmailFormat = /\S+@\S+\.\S+/.test(finalEmail);
    
    if (!isEmailFormat) {
        console.log("🔍 กำลังค้นหา Email จาก Username/Student ID...");
        const { data: foundEmail, error: rpcError } = await supabase.rpc('get_email_by_identity', { 
            identity_input: finalEmail 
        });

        if (rpcError || !foundEmail) {
            setError("Username or Student ID not found.");
            setLoading(false);
            return;
        }
        console.log("✅ เจอ Email แล้ว:", foundEmail);
        finalEmail = foundEmail; // เปลี่ยนจาก username เป็น email เพื่อใช้ login
    }

    // 2. Login ด้วย Email (ที่อาจจะแปลงมาแล้ว) + Password
    const { error } = await supabase.auth.signInWithPassword({
      email: finalEmail,
      password: signInPassword,
    });

    if (error) { 
        setError(error.message); 
        setLoading(false); 
    } else { 
        router.push("/"); 
        router.refresh(); 
    }
  };

  // --- 🔵 SIGN UP Logic ---
  const handleSignUp = async (e) => {
    e.preventDefault();
    
    const cleanEmail = formData.email.trim();
    const cleanPassword = formData.password.trim();
    const cleanConfirm = formData.confirmPassword.trim();
    const cleanStudentId = formData.studentId.trim();

    // Validations
    if (!cleanEmail || !cleanPassword || !formData.firstName || !formData.username || !cleanStudentId) {
        setError("Please fill in all required fields"); return;
    }
    if (cleanPassword !== cleanConfirm) {
        setError("Passwords do not match!"); return;
    }
    if (cleanStudentId.length !== 11) {
        setError("Student ID must be 11 digits."); return;
    }

    setLoading(true); setError(null);

    // 1. สร้าง User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (authError) { 
        setError(authError.message); 
        setLoading(false); 
        return; 
    }

    // 2. บันทึก Profile
    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").insert([{
        id: authData.user.id,
        email: cleanEmail,
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        student_id: cleanStudentId, // บันทึกรหัสนักศึกษา
        year: formData.year,
      }]);

      if (profileError) { 
        setError("Account created but profile failed: " + profileError.message); 
        setLoading(false); 
      } else { 
        alert("Account created successfully!"); 
        router.push("/select-character"); 
      }
    }
  };

  // Styles
  const inputStyle = "bg-gray-100 border-none p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-sit-secondary text-sm mb-3 shadow-inner";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4">
      
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
                <input name="studentId" placeholder="Student ID (11 digits)" className={inputStyle} value={formData.studentId || ""} onChange={handleInputChange} required maxLength={11} />
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
                <input name="studentId" placeholder="Student ID (11 digits)" className={inputStyle} value={formData.studentId || ""} onChange={handleInputChange} required maxLength={11} />
                
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
      
       {/* CSS ซ่อน scrollbar สำหรับฟอร์มยาว */}
       <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}