"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Trophy, BookOpen, X, Edit3, CheckCircle, Crown, 
  ChevronRight, BarChart3, FileText, Star
} from "lucide-react";

// Avatar Seeds
const AVATAR_SEEDS = [
  "Felix", "Aneka", "Zoe", "Jack", "Abby", "Liam", 
  "Molly", "Pepper", "Sugar", "Dusty", "Ginger", "Bandit",
  "Midnight", "Rocky", "Cuddles", "Snuggles", "Boots", "Whiskers",
  "Socks", "Tiger", "Shadow", "Coco", "Missy", "Jasper",
  "Smokey", "Loki", "Sasha", "Oscar", "Sammy", "Misty"
];

export default function ProfilePage() {
  const router = useRouter();
  
  // --- STATES ---
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); 

  // Modals
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Activity Flow States
  const [showActivityModal, setShowActivityModal] = useState(false); // Modal ใหญ่ (เลือกปี)
  const [selectedActivityYear, setSelectedActivityYear] = useState(null); // Modal ลิสต์กิจกรรมในปี
  const [selectedActivity, setSelectedActivity] = useState(null); // Modal รายละเอียดเจาะจง (Detail)

  // Edit States
  const [editName, setEditName] = useState(""); 
  const [selectedAvatar, setSelectedAvatar] = useState("");
  
  // Grade Filter States
  const [filterYear, setFilterYear] = useState(1);
  const [filterTerm, setFilterTerm] = useState(1);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/register"); return; }
      
      // 1. Profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      
      const email = user.email?.toLowerCase() || "";
      const name = profileData?.first_name?.toLowerCase() || "";
      if (email.includes("admin") || name.includes("admin")) setIsAdmin(true);

      setProfile(profileData);
      setEditName(profileData?.first_name || "");
      setSelectedAvatar(profileData?.avatar || "");

      // 2. Activities
      const { data: actData } = await supabase.from("activities").select("*").eq("user_id", user.id).order('date', { ascending: false });
      setActivities(actData || []);

      // 3. Grades
      const { data: gradeData } = await supabase.from("grades").select("*").eq("user_id", user.id).order('id', { ascending: false });
      setGrades(gradeData || []);

      setLoading(false);
    };
    fetchData();
  }, []);

  // --- ACTIONS ---
  const handleSaveProfile = async () => {
    if (!editName.trim()) return alert("Name cannot be empty!");
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ first_name: editName, avatar: selectedAvatar }).eq("id", profile.id);
    if (!error) window.location.reload(); 
    else alert("Error: " + error.message);
    setLoading(false);
  };

  // --- CALCULATIONS ---
  const calculateGPA = (list) => {
    if (!list || list.length === 0) return 0.00;
    let p = 0, c = 0;
    const map = { "A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D+": 1.5, "D": 1, "F": 0 };
    list.forEach(g => { 
        if(g.grade !== 'I') { 
            p += (map[g.grade] || 0) * (Number(g.credit) || 0); 
            c += (Number(g.credit) || 0); 
        }
    });
    return c === 0 ? 0.00 : (p / c);
  };

  const gpax = calculateGPA(grades);
  const filteredGrades = grades.filter(g => Number(g.study_year) === Number(filterYear) && Number(g.study_term) === Number(filterTerm));
  const semesterGPA = calculateGPA(filteredGrades);

  // Helper: Activity Logic
  const currentStudentYear = Number(profile?.year) || 1;
  const getActivitiesByYear = (year) => activities.filter(a => Number(a.academic_year || 1) === year);
  const totalAllHours = activities.reduce((sum, a) => sum + a.hours, 0);

  // Theme Color
  const getThemeColor = () => {
    if (isAdmin) return "from-rose-600 to-red-800";
    switch (profile?.major) {
      case "IT": return "from-blue-500 to-cyan-400";
      case "CS": return "from-indigo-600 to-purple-500";
      case "DSI": return "from-emerald-400 to-teal-500";
      default: return "from-gray-700 to-gray-900";
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-10">
      
      {/* === HEADER BACKGROUND === */}
      <div className={`h-48 md:h-60 w-full bg-gradient-to-r ${getThemeColor()} relative shadow-lg`}>
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">

          {/* === LEFT COLUMN: USER INFO + ACTIVITY (Small) === */}
          <div className="md:w-1/3 flex flex-col gap-4">
            
            {/* 1. Profile Card */}
            <div className="bg-white rounded-3xl shadow-xl p-6 flex flex-col items-center text-center relative animate-fade-in-up">
              <button onClick={() => setShowEditModal(true)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors z-10"><Edit3 size={18} /></button>
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-100 mb-4 overflow-hidden relative"><img src={profile?.avatar} className="w-full h-full object-cover" /></div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 justify-center">{profile?.first_name} {isAdmin && <Crown size={24} className="text-yellow-500 fill-yellow-500" />}</h1>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getThemeColor()} mb-4 mt-1 shadow-md`}>{isAdmin ? "System Admin 🛡️" : `${profile?.major} Student`}</span>
              <div className="w-full border-t pt-4 grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400 uppercase">ID</p><p className="font-mono font-bold text-gray-700">{profile?.student_id || "-"}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Year</p><p className="font-bold text-gray-700">{profile?.year || "1"}</p></div>
              </div>
            </div>

            {/* 2. ACTIVITY CARD (Small - ย้ายมาซ้าย) */}
            <button onClick={() => setShowActivityModal(true)} className="w-full bg-white rounded-3xl shadow-lg p-6 flex items-center justify-between border-l-8 border-orange-400 relative overflow-hidden transition-transform hover:scale-105 active:scale-95 group">
                <div className="z-10 text-left">
                   <p className="text-gray-400 text-xs font-bold tracking-wider group-hover:text-orange-600 uppercase">Activity Hours</p>
                   <h2 className="text-4xl font-extrabold text-gray-800">{totalAllHours} <span className="text-sm font-bold text-gray-400">Hrs</span></h2>
                   <p className="text-[10px] text-gray-400 mt-1">Click for Details</p>
                </div>
                <div className="bg-orange-100 p-4 rounded-full text-orange-600 z-10"><Trophy size={32} fill="currentColor" /></div>
            </button>
          </div>

          {/* === RIGHT COLUMN: GPAX (Big Box - ย้ายมาขวา) === */}
          <div className="md:w-2/3 flex flex-col gap-6">
              
              {/* GPAX OVERVIEW CARD (Big Box) */}
              <button onClick={() => setShowGradeModal(true)} className="w-full h-full bg-white rounded-3xl shadow-lg p-8 text-left hover:shadow-xl transition-all group relative overflow-hidden active:scale-[0.98] border border-transparent hover:border-yellow-100 flex flex-col justify-center min-h-[300px]">
                  {/* Background Icon Decoration */}
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <BookOpen size={180} className="text-yellow-500"/>
                  </div>
                  
                  <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="bg-yellow-100 p-3 rounded-2xl text-yellow-600"><Star size={32} fill="currentColor"/></div>
                          <h3 className="text-2xl font-bold text-gray-700">Academic Performance</h3>
                      </div>
                      
                      <div className="flex items-baseline gap-2 mt-4">
                          <h2 className="text-8xl font-extrabold text-gray-800 tracking-tight">{gpax ? gpax.toFixed(2) : "0.00"}</h2>
                          <span className="text-2xl font-bold text-gray-400">GPAX</span>
                      </div>
                      
                      <div className="mt-8 flex items-center gap-2 text-sm font-bold text-yellow-600 bg-yellow-50 w-fit px-4 py-2 rounded-xl group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                          View Full Transcript <ChevronRight size={16}/>
                      </div>
                  </div>
              </button>

          </div>

        </div>
      </div>

      {/* --- MODALS (เหมือนเดิม) --- */}
      
      {/* 1. EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Edit3 size={20}/> Edit Profile</h2>
                    <button onClick={() => setShowEditModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-3 border rounded-xl mb-6 bg-gray-50" />
                    <label className="block text-sm font-bold text-gray-700 mb-2">Choose Avatar</label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-6">
                        {AVATAR_SEEDS.map((seed) => {
                            const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
                            return (
                                <button key={seed} onClick={() => setSelectedAvatar(url)} className={`relative rounded-xl overflow-hidden border-2 aspect-square ${selectedAvatar === url ? "border-rose-500 ring-2 ring-rose-100 scale-105" : "border-transparent bg-gray-50"}`}>
                                    <img src={url} className="w-full h-full" />
                                    {selectedAvatar === url && <div className="absolute top-1 right-1 text-rose-500"><CheckCircle size={16} fill="white" /></div>}
                                </button>
                            );
                        })}
                    </div>
                    <button onClick={handleSaveProfile} className="w-full text-white font-bold py-3 rounded-xl bg-sit-primary hover:bg-blue-700">Save Changes</button>
                </div>
            </div>
        </div>
      )}

      {/* 2. TRANSCRIPT MODAL */}
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
                            <select className="w-full p-2 border rounded-lg bg-gray-50 font-bold text-gray-700" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                                {Array.from({ length: currentStudentYear }, (_, i) => i + 1).map(y => (
                                    <option key={y} value={y}>Year {y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-1/2">
                            <label className="text-xs font-bold text-gray-400 block mb-1">Term</label>
                            <select className="w-full p-2 border rounded-lg bg-gray-50 font-bold text-gray-700" value={filterTerm} onChange={e => setFilterTerm(e.target.value)}><option value="1">Sem 1</option><option value="2">Sem 2</option></select>
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
                                <div className={`text-lg font-bold ${['A', 'B+'].includes(g.grade) ? 'text-green-600' : g.grade === 'F' ? 'text-red-500' : 'text-gray-600'}`}>{g.grade}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 3. ACTIVITY PROGRESSION MODAL */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Trophy className="text-orange-500"/> Activity Progression</h2>
                    <button onClick={() => setShowActivityModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50">
                    <div className="grid gap-4">
                        {Array.from({ length: currentStudentYear }, (_, i) => i + 1).map((year) => {
                            const yearActs = getActivitiesByYear(year);
                            const totalHours = yearActs.reduce((sum, a) => sum + a.hours, 0);
                            const percent = Math.min((totalHours / 25) * 100, 100);
                            
                            return (
                                <button key={year} onClick={() => setSelectedActivityYear(year)} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200 hover:border-orange-400 hover:shadow-md transition-all text-left group">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-lg font-bold text-gray-700">Year {year} Goal</h3>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${percent >= 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>{percent >= 100 ? "Completed" : "In Progress"}</span>
                                    </div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-3xl font-bold text-gray-800">{totalHours} <span className="text-sm font-normal text-gray-400">/ 25 Hrs</span></span>
                                        <ChevronRight className="text-gray-300 group-hover:text-orange-500 transition-colors"/>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className={`h-full rounded-full ${percent >= 100 ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 4. ACTIVITY LIST MODAL */}
      {selectedActivityYear && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">Year {selectedActivityYear} Activities</h2>
                        <p className="text-xs text-gray-400">Tap to see details</p>
                    </div>
                    <button onClick={() => setSelectedActivityYear(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
                </div>
                <div className="p-4 overflow-y-auto custom-scrollbar">
                    {getActivitiesByYear(selectedActivityYear).length === 0 ? (
                        <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-xl bg-gray-50">No activities recorded.</div>
                    ) : (
                        <div className="space-y-3">
                            {getActivitiesByYear(selectedActivityYear).map((act) => (
                                <button key={act.id} onClick={() => setSelectedActivity(act)} className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 hover:bg-gray-100 hover:border-gray-300 transition-all text-left flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{act.category === 'Tech' ? '💻' : act.category === 'Staff' ? '👕' : '❤️'}</div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm group-hover:text-sit-primary transition-colors">{act.name}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(act.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-green-600 bg-white px-2 py-1 rounded border border-gray-100">+{act.hours}h</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* 5. ACTIVITY DETAIL MODAL */}
      {selectedActivity && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center relative animate-fade-in-up">
                <button onClick={() => setSelectedActivity(null)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
                
                <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-4 text-4xl shadow-sm ring-4 ring-orange-50">
                    {selectedActivity.category === 'Tech' ? '💻' : selectedActivity.category === 'Staff' ? '👕' : '❤️'}
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedActivity.name}</h2>
                <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500 mb-6">{selectedActivity.category} Category</div>

                <div className="flex justify-center gap-8 border-t border-b py-4 mb-4">
                    <div><p className="text-xs text-gray-400 uppercase font-bold">Hours</p><p className="text-3xl font-bold text-sit-primary">+{selectedActivity.hours}</p></div>
                    <div><p className="text-xs text-gray-400 uppercase font-bold">Date</p><p className="text-xl font-bold text-gray-700">{new Date(selectedActivity.date).toLocaleDateString()}</p></div>
                </div>
                
                <div className="text-left">
                    <p className="text-xs text-gray-400 mb-2 font-bold flex items-center gap-1"><FileText size={12}/> Description</p>
                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl min-h-[80px] border border-gray-100">
                        {selectedActivity.description || <span className="text-gray-400 italic">No description provided.</span>}
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}