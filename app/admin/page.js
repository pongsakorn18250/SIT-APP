"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, Trash2, Book, Trophy, Search, Save, 
  AlertTriangle, ArrowLeft, Users, User, X, Edit3, Crown, Calendar, Loader2 
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  
  // --- STATES ---
  const [activeTab, setActiveTab] = useState("users"); // 'users', 'grade', 'activity', 'schedule'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState(""); 
  
  // Modal & Edit States
  const [viewingUser, setViewingUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Add Data States (ใช้ร่วมกันทั้ง Grade/Activity)
  const [selectedUserId, setSelectedUserId] = useState("");
  const [targetStudent, setTargetStudent] = useState(null); // เก็บ Object นักเรียนที่เลือก (เพื่อเอาข้อมูลชั้นปี)

  // Grade Form States
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [grade, setGrade] = useState("A");
  const [credit, setCredit] = useState(3);
  const [year, setYear] = useState(1);
  const [term, setTerm] = useState(1);

  // Activity Form States
  const [actName, setActName] = useState("");
  const [actHours, setActHours] = useState(3);
  const [actCategory, setActCategory] = useState("Tech");
  const [actDesc, setActDesc] = useState(""); // เพิ่ม Description
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- INITIALIZE ---
  useEffect(() => {
    const initAdmin = async () => {
      // 1. Check Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/register"); return; }
      
      // 2. Check Role
      const { data: myProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      
      if (!myProfile || myProfile.role === 'STUDENT') {
         // ถ้าเป็น Student ดีดออกไป Home
         router.push("/"); 
         return;
      }

      setMyRole(myProfile.role);

      // 3. Fetch Users
      // ถ้าเป็น Owner เห็นหมด / ถ้าเป็น Admin อื่นๆ เห็นแค่ Student
      let query = supabase.from("profiles").select("*").order("student_id", { ascending: true });
      
      if (myProfile.role !== 'OWNER') {
          query = query.eq('role', 'STUDENT');
      }
      
      const { data: userList, error } = await query;
      if (error) console.error("Error fetching users:", error);
      
      setUsers(userList || []);
      setLoading(false);
    };
    initAdmin();
  }, []);

  // --- LOGIC: เลือกนักเรียนแล้ว Auto-Limit ปี ---
  const handleSelectStudent = (id) => {
      setSelectedUserId(id);
      const student = users.find(u => u.id === id);
      setTargetStudent(student);
      
      // Reset ปีเป็น 1 เสมอเมื่อเปลี่ยนคน
      setYear(1); 
  };

  // --- PERMISSION CHECKER 🛡️ ---
  const isOwner = myRole === 'OWNER';
  const canEditUser = isOwner || myRole === 'REGISTRAR';
  const canAddGrade = isOwner || myRole === 'ACADEMIC';
  const canSchedule = isOwner || myRole === 'SCHEDULER';
  
  // --- THEME COLOR ENGINE (แยกทอง/แดง) 🎨 ---
  const theme = isOwner ? {
      bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200",
      header: "bg-gradient-to-r from-yellow-500 to-orange-500",
      btn: "bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200",
      activeTab: "text-yellow-700 border-yellow-600 bg-yellow-50",
      icon: "text-yellow-600"
  } : {
      bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200",
      header: "bg-rose-900",
      btn: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
      activeTab: "text-rose-600 border-rose-600 bg-rose-50",
      icon: "text-rose-500"
  };

  // --- HANDLERS ---

  // 1. ดูข้อมูล User (View Detail)
  const handleViewUser = async (user) => {
    // ดึงเกรด & กิจกรรม
    const { data: grades } = await supabase.from("grades").select("*").eq("user_id", user.id);
    const { data: activities } = await supabase.from("activities").select("*").eq("user_id", user.id);
    
    // คำนวณ GPAX
    let totalScore = 0, totalCredit = 0;
    const gradeMap = { "A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D+": 1.5, "D": 1, "F": 0, "I": 0 };
    grades?.forEach(g => { 
        if (g.grade !== "I") { // ถ้า I ยังไม่เอามาคิด
            totalScore += (gradeMap[g.grade] || 0) * g.credit; 
            totalCredit += g.credit; 
        }
    });
    const gpax = totalCredit ? (totalScore / totalCredit).toFixed(2) : "0.00";
    const totalHours = activities?.reduce((sum, a) => sum + a.hours, 0) || 0;

    setViewingUser({ ...user, gpax, totalHours });
    setEditForm(user);
    setIsEditing(false);
  };

  // 2. บันทึกแก้ไข User (Edit User)
  const handleSaveChanges = async () => {
    if (!canEditUser) return;
    
    const { error } = await supabase.from("profiles").update({
        first_name: editForm.first_name,
        major: editForm.major,
        year: editForm.year,
        role: editForm.role 
    }).eq("id", viewingUser.id);

    if (!error) {
        alert("User Updated Successfully! ✅");
        // Update State หน้าจอ
        setUsers(users.map(u => u.id === viewingUser.id ? { ...u, ...editForm } : u));
        setViewingUser(null);
    } else {
        alert("Error: " + error.message);
    }
  };

  // 3. 🛑 ลบ User (Delete User)
  const handleDeleteUser = async () => {
    if (!isOwner) return;
    
    const confirmDelete = confirm(`⚠️ DANGER ZONE ⚠️\n\nAre you sure you want to delete "${viewingUser.first_name}"?\nThis will remove ALL their grades, activities, and profile permanently.`);
    if (!confirmDelete) return;

    setIsSubmitting(true);

    // Step 1: ลบข้อมูลลูกก่อน
    await supabase.from("grades").delete().eq("user_id", viewingUser.id);
    await supabase.from("activities").delete().eq("user_id", viewingUser.id);

    // Step 2: ลบ Profile
    const { error } = await supabase.from("profiles").delete().eq("id", viewingUser.id);

    setIsSubmitting(false);

    if (error) {
        alert("❌ Failed to delete from Database: " + error.message);
    } else {
        alert("User deleted permanently. 🗑️");
        setUsers(users.filter(u => u.id !== viewingUser.id));
        setViewingUser(null);
    }
  };

  // 4. เพิ่มเกรด (Add Grade)
  const handleAddGrade = async () => {
    if (!selectedUserId || !subjectCode) return alert("Please select student and fill subject code");
    setIsSubmitting(true);

    const { error } = await supabase.from("grades").insert({ 
        user_id: selectedUserId, 
        subject_code: subjectCode, 
        subject_name: subjectName, 
        grade, 
        credit, 
        study_year: year, 
        study_term: term 
    });

    setIsSubmitting(false);

    if (!error) { 
        alert("Grade Added Successfully! ✅"); 
        setSubjectCode(""); setSubjectName(""); 
    } else {
        alert("Error adding grade: " + error.message);
    }
  };

  // 5. เพิ่มกิจกรรม (Add Activity)
  const handleAddActivity = async () => {
    if (!selectedUserId || !actName) return alert("Please select student and fill activity name");
    setIsSubmitting(true);

    const { error } = await supabase.from("activities").insert({ 
        user_id: selectedUserId, 
        name: actName, 
        hours: actHours, 
        category: actCategory, 
        date: new Date(), 
        academic_year: year, 
        description: actDesc 
    });

    setIsSubmitting(false);

    if (!error) { 
        alert("Activity Added Successfully! 🏆"); 
        setActName(""); setActDesc(""); 
    } else {
        alert("Error adding activity: " + error.message);
    }
  };

  if (loading) return <div className={`min-h-screen flex items-center justify-center font-bold ${theme.text}`}>Verifying Clearance...</div>;

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center p-4 md:p-6 transition-colors`}>
      
      <div className={`w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border ${theme.border} flex flex-col h-[85vh]`}>
        
        {/* === HEADER === */}
        <div className={`${theme.header} text-white p-6 flex justify-between items-center shrink-0`}>
            <div className="flex items-center gap-3">
                {isOwner ? <Crown size={32} className="text-white"/> : <ShieldAlert size={32} className="text-white"/>}
                <div>
                    <h1 className="text-2xl font-bold">{isOwner ? "Owner Command" : "Admin Console"}</h1>
                    <p className="text-xs opacity-80 uppercase font-bold tracking-wider">{myRole}</p>
                </div>
            </div>
             <button onClick={() => router.push("/profile")} className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
                <User size={14}/> My Profile
            </button>
        </div>

        {/* === TABS === */}
        <div className="flex border-b border-gray-100 shrink-0 overflow-x-auto">
            <button onClick={() => setActiveTab("users")} className={`flex-1 min-w-[100px] py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === "users" ? theme.activeTab : "text-gray-400"}`}>
                <Users size={18} /> Users
            </button>
            
            {canAddGrade && (
                <button onClick={() => setActiveTab("grade")} className={`flex-1 min-w-[100px] py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === "grade" ? theme.activeTab : "text-gray-400"}`}>
                    <Book size={18} /> Grade
                </button>
            )}

            {canAddGrade && (
                <button onClick={() => setActiveTab("activity")} className={`flex-1 min-w-[100px] py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === "activity" ? theme.activeTab : "text-gray-400"}`}>
                    <Trophy size={18} /> Activity
                </button>
            )}
            
            {canSchedule && (
                <button onClick={() => setActiveTab("schedule")} className={`flex-1 min-w-[100px] py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === "schedule" ? theme.activeTab : "text-gray-400"}`}>
                    <Calendar size={18} /> Plan
                </button>
            )}
        </div>

        {/* === CONTENT === */}
        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
            
            {/* 👥 TAB 1: USERS LIST */}
            {activeTab === "users" && (
                <div className="space-y-4">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className={`text-lg font-bold flex items-center gap-2 ${theme.text}`}><Users/> User Database</h2>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{users.length} records</span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3 text-right">Role</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(u => (
                                    <tr key={u.id} onClick={() => handleViewUser(u)} className="hover:bg-gray-50 cursor-pointer group transition-colors">
                                        <td className="p-3 font-mono text-xs font-bold text-gray-500">{u.student_id}</td>
                                        <td className="p-3 font-bold text-gray-800 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden"><img src={u.avatar} className="w-full h-full object-cover"/></div>
                                            {u.first_name}
                                        </td>
                                        <td className="p-3 text-right text-xs font-bold text-gray-400 group-hover:text-gray-600">{u.role}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 📚 TAB 2: GRADE FORM */}
            {activeTab === "grade" && (
                <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
                    <h2 className={`text-lg font-bold ${theme.text} mb-4 flex items-center gap-2`}><Book/> Add Student Grade</h2>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">Target Student</label>
                        <select className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" value={selectedUserId} onChange={(e) => handleSelectStudent(e.target.value)}>
                            <option value="">-- Select Student --</option>
                            {users.filter(u => u.role === 'STUDENT').map(u => (
                                <option key={u.id} value={u.id}>{u.student_id} - {u.first_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500">Subject Code</label>
                             <input placeholder="GEN111" className="w-full p-3 border rounded-xl" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} />
                         </div>
                         <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500">Subject Name</label>
                             <input placeholder="Man and Ethics" className="w-full p-3 border rounded-xl" value={subjectName} onChange={e => setSubjectName(e.target.value)} />
                         </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500">Year</label>
                             {/* ✅ FIX: ใช้ Number() แปลงค่า year และ length เพื่อความชัวร์ */}
                             <select className="w-full p-3 border rounded-xl" value={year} onChange={e => setYear(Number(e.target.value))} disabled={!targetStudent}>
                                {Array.from({ length: Number(targetStudent?.year) || 1 }, (_, i) => i + 1).map(y => (
                                    <option key={y} value={y}>Year {y}</option>
                                ))}
                             </select>
                         </div>
                         <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500">Term</label>
                             <select className="w-full p-3 border rounded-xl" value={term} onChange={e => setTerm(Number(e.target.value))}><option value={1}>Term 1</option><option value={2}>Term 2</option></select>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">Grade</label>
                            <select className="w-full p-3 border rounded-xl" value={grade} onChange={e => setGrade(e.target.value)}>
                                <option>A</option><option>B+</option><option>B</option><option>C+</option><option>C</option><option>D+</option><option>D</option><option>F</option>
                                <option>I</option> 
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">Credit</label>
                            <input type="number" className="w-full p-3 border rounded-xl" value={credit} onChange={e => setCredit(e.target.value)} />
                        </div>
                    </div>
                    
                    <button onClick={handleAddGrade} disabled={isSubmitting} className={`w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex justify-center ${theme.btn} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}>
                        {isSubmitting ? <Loader2 className="animate-spin"/> : "Save Grade Record"}
                    </button>
                </div>
            )}

            {/* 🏆 TAB 3: ACTIVITY FORM */}
            {activeTab === "activity" && (
                <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
                     <h2 className={`text-lg font-bold ${theme.text} mb-4 flex items-center gap-2`}><Trophy/> Add Student Activity</h2>

                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">Target Student</label>
                        <select className="w-full p-3 bg-gray-50 border rounded-xl" value={selectedUserId} onChange={(e) => handleSelectStudent(e.target.value)}>
                            <option value="">-- Choose Student --</option>
                            {users.filter(u => u.role === 'STUDENT').map(u => (<option key={u.id} value={u.id}>{u.student_id} - {u.first_name}</option>))}
                        </select>
                     </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">Activity Name</label>
                        <input placeholder="SIT Camp 2026" className="w-full p-3 border rounded-xl" value={actName} onChange={e => setActName(e.target.value)} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">Description</label>
                        <textarea placeholder="Details about activity..." className="w-full p-3 border rounded-xl h-24" value={actDesc} onChange={e => setActDesc(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">Hours</label>
                            <input type="number" placeholder="Hours" className="w-full p-3 border rounded-xl" value={actHours} onChange={e => setActHours(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">Category</label>
                            <select className="w-full p-3 border rounded-xl" value={actCategory} onChange={e => setActCategory(e.target.value)}><option value="Tech">Tech</option><option value="Staff">Staff</option><option value="Social">Social</option></select>
                        </div>
                    </div>

                    {/* ✅ FIX: Activity Year Logic */}
                    <div className="w-full space-y-1">
                         <label className="text-xs text-gray-500 font-bold block">Activity Year</label>
                         <select className="w-full p-3 border rounded-xl" value={year} onChange={e => setYear(Number(e.target.value))} disabled={!targetStudent}>
                            {Array.from({ length: Number(targetStudent?.year) || 1 }, (_, i) => i + 1).map(y => (
                                <option key={y} value={y}>Year {y}</option>
                            ))}
                         </select>
                    </div>

                    <button onClick={handleAddActivity} disabled={isSubmitting} className={`w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex justify-center ${theme.btn} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}>
                        {isSubmitting ? <Loader2 className="animate-spin"/> : "Save Activity Record"}
                    </button>
                </div>
            )}
            
            {/* 🗓️ TAB 4: PLAN MOCKUP */}
            {activeTab === "schedule" && (
                <div className="text-center py-10 opacity-60">
                    <Calendar size={64} className="mx-auto mb-4 text-gray-300"/>
                    <h3 className="text-xl font-bold text-gray-700">Course Scheduler</h3>
                    <p className="text-sm text-gray-400">Class schedule management for future implementation.</p>
                </div>
            )}

        </div>
      </div>

      {/* ================= USER DETAIL MODAL ================= */}
      {viewingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className={`p-4 flex justify-between items-center text-white ${theme.header}`}>
                    <h3 className="font-bold flex items-center gap-2"><User size={18}/> {viewingUser.first_name}</h3>
                    <button onClick={() => setViewingUser(null)} className="hover:bg-white/20 p-1 rounded-full"><X size={18}/></button>
                </div>

                <div className="p-6">
                    {/* User Stats */}
                    <div className="flex justify-center mb-6">
                         <div className="w-24 h-24 rounded-full border-4 border-gray-100 overflow-hidden shadow-inner"><img src={viewingUser.avatar} className="w-full h-full object-cover"/></div>
                    </div>

                    {/* EDIT FORM (Only for Owner/Registrar) */}
                    {isEditing && canEditUser ? (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400">First Name</label>
                                <input className="w-full p-2 border rounded-lg" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400">Major</label>
                                    <select className="w-full p-2 border rounded-lg" value={editForm.major} onChange={e => setEditForm({...editForm, major: e.target.value})}>
                                        <option value="IT">IT</option><option value="CS">CS</option><option value="DSI">DSI</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400">Year</label>
                                    <input type="number" className="w-full p-2 border rounded-lg" value={editForm.year} onChange={e => setEditForm({...editForm, year: e.target.value})} />
                                </div>
                            </div>

                            {isOwner && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400">Role (Owner Only)</label>
                                    <select className="w-full p-2 border rounded-lg bg-yellow-50" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                                        <option value="STUDENT">Student</option><option value="REGISTRAR">Registrar</option><option value="ACADEMIC">Academic</option><option value="SCHEDULER">Scheduler</option><option value="OWNER">Owner</option>
                                    </select>
                                </div>
                            )}
                            <button onClick={handleSaveChanges} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg mt-2">Save Changes</button>
                        </div>
                    ) : (
                        <div className="text-center space-y-2">
                            <p className="text-lg font-bold text-gray-800">{viewingUser.first_name}</p>
                            <p className="text-sm text-gray-500 font-bold">{viewingUser.major} - Year {viewingUser.year}</p>
                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide ${viewingUser.role === 'STUDENT' ? 'bg-gray-100 text-gray-500' : 'bg-rose-100 text-rose-500'}`}>{viewingUser.role}</span>
                            
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-400 font-bold uppercase">GPAX</p>
                                    <p className="text-xl font-bold text-gray-800">{viewingUser.gpax}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-400 font-bold uppercase">Activity</p>
                                    <p className="text-xl font-bold text-green-600">{viewingUser.totalHours} <span className="text-xs text-gray-400">hrs</span></p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-2 mt-6">
                        {canEditUser && !isEditing && (
                            <button onClick={() => setIsEditing(true)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                                <Edit3 size={16}/> Edit User
                            </button>
                        )}
                        {isOwner && (
                            <button onClick={handleDeleteUser} disabled={isSubmitting} className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                                {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <><Trash2 size={16}/> Delete</>}
                            </button>
                        )}
                    </div>
                </div>
             </div>
        </div>
      )}

    </div>
  );
}