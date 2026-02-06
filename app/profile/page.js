"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { Trophy, Clock, Star, BookOpen, X, ChevronRight, FileText, Edit3, CheckCircle, Crown, LogOut } from "lucide-react";

// --- CONSTANTS ---
// 🎨 Avatar สไตล์ Adventurer (หน้ากวนๆ) จัดให้ 30 แบบ!
const AVATAR_SEEDS = [
  "Felix", "Aneka", "Zoe", "Jack", "Abby", "Liam", 
  "Molly", "Pepper", "Sugar", "Dusty", "Ginger", "Bandit",
  "Midnight", "Rocky", "Cuddles", "Snuggles", "Boots", "Whiskers",
  "Socks", "Tiger", "Shadow", "Coco", "Missy", "Jasper",
  "Smokey", "Loki", "Sasha", "Oscar", "Sammy", "Misty"
];

// Avatar ลับ Admin (ราชาผู้พิชิต)
const ADMIN_AVATAR = "https://api.dicebear.com/7.x/adventurer/svg?seed=KingSlayer&backgroundColor=b6e3f4"; 

// อีเมล Admin
const ADMIN_EMAIL = "Admin1@gmail.com"; 

export default function ProfilePage() {
  const router = useRouter();
  
  // States
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false); 

  // Edit States
  const [editName, setEditName] = useState(""); 
  const [selectedAvatar, setSelectedAvatar] = useState("");

  // Filters
  const [filterYear, setFilterYear] = useState(1);
  const [filterTerm, setFilterTerm] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/register"); return; }
      
      setUserEmail(user.email);

      // Fetch Profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData);
      
      setEditName(profileData?.first_name || "");
      setSelectedAvatar(profileData?.avatar || "");

      // Fetch Others
      const { data: actData } = await supabase.from("activities").select("*").eq("user_id", user.id).order('date', { ascending: false });
      setActivities(actData || []);
      const { data: gradeData } = await supabase.from("grades").select("*").eq("user_id", user.id);
      setGrades(gradeData || []);

      setLoading(false);
    };
    fetchData();
  }, []);

  // --- LOGIC ---
  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
        await supabase.auth.signOut();
        router.push("/register"); 
        router.refresh();      
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return alert("Name cannot be empty!");
    
    setLoading(true);
    const { error } = await supabase
        .from("profiles")
        .update({ first_name: editName, avatar: selectedAvatar }) 
        .eq("id", profile.id);

    if (error) {
        alert("Error: " + error.message);
    } else {
        setProfile({ ...profile, first_name: editName, avatar: selectedAvatar });
        setShowEditModal(false);
        window.location.reload(); 
    }
    setLoading(false);
  };

  const calculateGPA = (list) => {
    if (!list || list.length === 0) return 0.00;
    let p = 0, c = 0;
    const map = { "A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D+": 1.5, "D": 1, "F": 0 };
    list.forEach(g => { p += (map[g.grade] || 0) * (Number(g.credit) || 0); c += (Number(g.credit) || 0); });
    return c === 0 ? 0.00 : (p / c);
  };
  
  const gpax = calculateGPA(grades);
  const filteredGrades = grades.filter(g => Number(g.study_year) === Number(filterYear) && Number(g.study_term) === Number(filterTerm));
  const semesterGPA = calculateGPA(filteredGrades);
  
  const totalHours = activities.reduce((sum, act) => sum + act.hours, 0);
  const progressPercent = Math.min((totalHours / 25) * 100, 100);
  
  const getThemeColor = () => {
    switch (profile?.major) {
      case "IT": return "from-blue-500 to-cyan-400";
      case "CS": return "from-indigo-600 to-purple-500";
      case "DSI": return "from-teal-400 to-emerald-500";
      default: return "from-gray-700 to-gray-900";
    }
  };

  const isAdmin = userEmail && (userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-10">
      
      {/* HEADER */}
      <div className={`h-48 md:h-60 w-full bg-gradient-to-r ${getThemeColor()} relative`}>
        <button 
            onClick={handleLogout}
            className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full hover:bg-white/30 transition-all font-bold text-xs border border-white/30"
        >
            <LogOut size={16} /> Logout
        </button>
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">

          {/* LEFT: USER CARD */}
          <div className="md:w-1/3 flex flex-col gap-4">
            <div className="bg-white rounded-3xl shadow-xl p-6 flex flex-col items-center text-center relative animate-fade-in-up">
              
              <button 
                onClick={() => setShowEditModal(true)}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors z-10"
              >
                <Edit3 size={18} />
              </button>

              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-100 mb-4 overflow-hidden relative group">
                <img src={profile?.avatar} className="w-full h-full object-cover" />
              </div>

              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 justify-center">
                {profile?.first_name}
                {isAdmin && <Crown size={20} className="text-yellow-500 fill-yellow-500" />}
              </h1>
              
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getThemeColor()} mb-4 mt-1`}>
                {profile?.major} Student
              </span>

              <div className="w-full border-t pt-4 grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400 uppercase">ID</p><p className="font-mono font-bold text-gray-700">{profile?.student_id || "-"}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Year</p><p className="font-bold text-gray-700">{profile?.year || "1"}</p></div>
              </div>
            </div>

            <button onClick={() => setShowGradeModal(true)} className="w-full bg-white rounded-3xl shadow-lg p-6 flex items-center justify-between border-l-8 border-yellow-400 relative overflow-hidden transition-transform hover:scale-105 active:scale-95 group">
                <div className="z-10 text-left">
                   <p className="text-gray-400 text-xs font-bold tracking-wider group-hover:text-yellow-600 uppercase">Current GPAX</p>
                   <h2 className="text-5xl font-extrabold text-gray-800">{gpax ? gpax.toFixed(2) : "0.00"}</h2>
                   <p className="text-[10px] text-gray-400 mt-1">Click for Transcript</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-full text-yellow-600 z-10"><Star size={36} fill="currentColor" /></div>
            </button>
          </div>

          {/* RIGHT: ACTIVITY */}
          <div className="md:w-2/3 flex flex-col gap-6">
             <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-gray-800 font-bold"><Trophy className="text-orange-500" /> Activity Hours</div>
                    <span className="text-sm font-bold text-gray-500">{totalHours} / 25 Hrs</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${getThemeColor()} transition-all duration-1000`} style={{ width: `${progressPercent}%` }}></div>
                </div>
             </div>

             <div className="bg-white rounded-3xl shadow-lg p-6 flex-1 min-h-[300px]">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock size={20} /> Activity History</h3>
                <div className="space-y-3">
                    {activities.length === 0 ? <p className="text-center text-gray-400 py-10">No activities.</p> : activities.map(act => (
                        <button key={act.id} onClick={() => setSelectedActivity(act)} className="w-full flex justify-between items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-lg border border-gray-100">
                                    {act.category === 'Tech' ? '💻' : act.category === 'Staff' ? '👕' : '❤️'}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-800 group-hover:text-sit-primary transition-colors">{act.name}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(act.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-sit-primary">+{act.hours} Hrs</span>
                        </button>
                    ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Edit3 size={20}/> Edit Profile</h2>
                    <button onClick={() => setShowEditModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Username / Display Name</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-3 border rounded-xl mb-6 bg-gray-50" />

                    <label className="block text-sm font-bold text-gray-700 mb-2">Choose Avatar (30 Styles)</label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-6">
                        {AVATAR_SEEDS.map((seed) => {
                            // กลับมาใช้ Adventurer Style!
                            const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
                            return (
                                <button key={seed} onClick={() => setSelectedAvatar(url)} className={`relative rounded-xl overflow-hidden border-2 aspect-square ${selectedAvatar === url ? "border-sit-primary ring-2 ring-blue-100 scale-105" : "border-transparent bg-gray-50"}`}>
                                    <img src={url} className="w-full h-full bg-gray-50" alt="avatar" />
                                    {selectedAvatar === url && <div className="absolute top-1 right-1 text-sit-primary"><CheckCircle size={16} fill="white" /></div>}
                                </button>
                            );
                        })}
                        {isAdmin && (
                            <button onClick={() => setSelectedAvatar(ADMIN_AVATAR)} className={`relative rounded-xl overflow-hidden border-2 aspect-square ${selectedAvatar === ADMIN_AVATAR ? "border-yellow-500 ring-2 ring-yellow-100" : "bg-yellow-50"}`}>
                                <img src={ADMIN_AVATAR} className="w-full h-full bg-yellow-50" alt="admin" />
                                <div className="absolute bottom-0 w-full bg-yellow-500 text-white text-[8px] font-bold text-center">LIMITED</div>
                            </button>
                        )}
                    </div>
                    <button onClick={handleSaveProfile} className="w-full bg-sit-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all">Save Changes</button>
                </div>
            </div>
        </div>
      )}

      {/* TRANSCRIPT MODAL (เหมือนเดิม) */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><BookOpen/> Transcript</h2>
                    <button onClick={() => setShowGradeModal(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"><X size={20} /></button>
                </div>
                <div className="p-6">
                    <div className="flex gap-4 mb-6">
                        <div className="w-1/2">
                            <label className="text-xs font-bold text-gray-400 block mb-1">Year</label>
                            <select className="w-full p-2 border rounded-lg bg-gray-50" value={filterYear} onChange={e => setFilterYear(e.target.value)}><option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option></select>
                        </div>
                        <div className="w-1/2">
                            <label className="text-xs font-bold text-gray-400 block mb-1">Term</label>
                            <select className="w-full p-2 border rounded-lg bg-gray-50" value={filterTerm} onChange={e => setFilterTerm(e.target.value)}><option value="1">Sem 1</option><option value="2">Sem 2</option></select>
                        </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4 flex justify-between items-center">
                        <span className="text-blue-800 font-bold text-sm">Semester GPA</span>
                        <span className="text-3xl font-extrabold text-blue-600">{semesterGPA.toFixed(2)}</span>
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-60 custom-scrollbar pr-1">
                        {filteredGrades.length === 0 ? <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl bg-gray-50">No grades found.</div> : filteredGrades.map(g => (
                            <div key={g.id} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                                <div><div className="flex items-center gap-2"><span className="font-mono font-bold text-gray-500 text-xs bg-gray-100 px-1.5 rounded border">{g.subject_code}</span><span className="font-bold text-gray-800 text-sm">{g.subject_name}</span></div><p className="text-[10px] text-gray-400 ml-1">{g.credit} Cr.</p></div>
                                <div className={`text-lg font-bold ${['A', 'B+'].includes(g.grade) ? 'text-green-600' : 'text-gray-600'}`}>{g.grade}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ACTIVITY MODAL (เหมือนเดิม) */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center relative">
                <button onClick={() => setSelectedActivity(null)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
                <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-4 text-4xl shadow-sm ring-4 ring-orange-50">{selectedActivity.category === 'Tech' ? '💻' : selectedActivity.category === 'Staff' ? '👕' : '❤️'}</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedActivity.name}</h2>
                <div className="mt-6 flex justify-center gap-8 border-t border-b py-4">
                    <div><p className="text-xs text-gray-400 uppercase">Hours</p><p className="text-3xl font-bold text-sit-primary">+{selectedActivity.hours}</p></div>
                    <div><p className="text-xs text-gray-400 uppercase">Date</p><p className="text-xl font-bold text-gray-700">{new Date(selectedActivity.date).toLocaleDateString()}</p></div>
                </div>
                <div className="mt-4 text-left"><p className="text-xs text-gray-400 mb-2 font-bold flex items-center gap-1"><FileText size={12}/> Description</p><div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl min-h-[80px] border border-gray-100">{selectedActivity.description || <span className="text-gray-400 italic">No description.</span>}</div></div>
            </div>
        </div>
      )}

    </div>
  );
}