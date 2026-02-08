"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, Trash2, Book, Trophy, Search, Save, 
  AlertTriangle, ArrowLeft, Users, User, X, Edit3, Crown, Calendar, Loader2,
  PieChart, List, Award, CheckCircle
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  
  // --- STATES ---
  const [activeTab, setActiveTab] = useState("users"); // 'users', 'grade', 'activity', 'schedule'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState(""); 
  
  // Modal & Detail States (สำหรับหน้าดูข้อมูลละเอียด)
  const [viewingUser, setViewingUser] = useState(null);
  const [modalTab, setModalTab] = useState("profile"); // 'profile', 'transcript', 'activity'
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Deep Data States (ข้อมูลลึก: เกรดรายเทอม / กิจกรรมรายปี)
  const [studentGrades, setStudentGrades] = useState({}); // เก็บแบบ Group: { "1/1": [..], "1/2": [..] }
  const [studentActivities, setStudentActivities] = useState([]); 
  const [activityProgress, setActivityProgress] = useState({ 1:0, 2:0, 3:0, 4:0 }); // ชั่วโมงรายปี

  // Add Data Form States (สำหรับฟอร์มเพิ่มข้อมูล)
  const [selectedUserId, setSelectedUserId] = useState("");
  const [targetStudent, setTargetStudent] = useState(null);
  
  // Grade Form Inputs
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [grade, setGrade] = useState("A");
  const [credit, setCredit] = useState(3);
  const [year, setYear] = useState(1);
  const [term, setTerm] = useState(1);

  // Activity Form Inputs
  const [actName, setActName] = useState("");
  const [actHours, setActHours] = useState(3);
  const [actCategory, setActCategory] = useState("Tech");
  const [actDesc, setActDesc] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- INITIALIZE ---
  useEffect(() => {
    const initAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/register"); return; }
      
      const { data: myProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      
      if (!myProfile || myProfile.role === 'STUDENT') {
         // ถ้าเป็น Student ดีดออกไป Home
         router.push("/"); 
         return;
      }

      setMyRole(myProfile.role);

      // ถ้าเป็น Owner เห็นหมด / ถ้าเป็น Admin อื่นๆ เห็นแค่ Student
      let query = supabase.from("profiles").select("*").order("student_id", { ascending: true });
      if (myProfile.role !== 'OWNER') {
          query = query.eq('role', 'STUDENT');
      }
      
      const { data: userList, error } = await query;
      if (error) console.error(error);
      
      setUsers(userList || []);
      setLoading(false);
    };
    initAdmin();
  }, []);

  // --- LOGIC: Select Student for Adding Data ---
  const handleSelectStudent = (id) => {
      setSelectedUserId(id);
      const student = users.find(u => u.id === id);
      setTargetStudent(student);
      setYear(1); 
  };

  // --- PERMISSION & THEME ---
  const isOwner = myRole === 'OWNER';
  const canEditUser = isOwner || myRole === 'REGISTRAR';
  const canAddGrade = isOwner || myRole === 'ACADEMIC';
  const canSchedule = isOwner || myRole === 'SCHEDULER';
  
  const theme = isOwner ? {
      bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200",
      header: "bg-gradient-to-r from-yellow-500 to-orange-500",
      btn: "bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200",
      activeTab: "text-yellow-700 border-yellow-600 bg-yellow-50",
  } : {
      bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200",
      header: "bg-rose-900",
      btn: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
      activeTab: "text-rose-600 border-rose-600 bg-rose-50",
  };

  // --- 🔥 LOGIC: VIEW USER DETAIL (Deep Dive) ---
  const handleViewUser = async (user) => {
    setLoading(true);
    
    // 1. Fetch Deep Data (ดึงเกรดและกิจกรรมทั้งหมดของคนนี้)
    const { data: grades } = await supabase.from("grades").select("*").eq("user_id", user.id).order('study_year', { ascending: true }).order('study_term', { ascending: true });
    const { data: activities } = await supabase.from("activities").select("*").eq("user_id", user.id).order('academic_year', { ascending: true });
    
    // 2. Process Grades (จัดกลุ่มเกรดตาม ปี/เทอม)
    const groupedGrades = {};
    let totalScore = 0, totalCredit = 0;
    const gradeMap = { "A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D+": 1.5, "D": 1, "F": 0, "I": 0 };
    
    grades?.forEach(g => {
        // สร้าง Key เช่น "1/1", "1/2"
        const key = `${g.study_year}/${g.study_term}`;
        if (!groupedGrades[key]) groupedGrades[key] = [];
        groupedGrades[key].push(g);
        
        // คำนวณ GPAX รวม
        if (g.grade !== "I") {
            totalScore += (gradeMap[g.grade] || 0) * g.credit;
            totalCredit += g.credit;
        }
    });

    // 3. Process Activities (รวมชั่วโมงตามปี)
    const actProgress = { 1: 0, 2: 0, 3: 0, 4: 0 };
    activities?.forEach(a => {
        const y = a.academic_year || 1; 
        if (actProgress[y] !== undefined) actProgress[y] += a.hours;
    });

    // 4. Set State ทั้งหมด
    const gpax = totalCredit ? (totalScore / totalCredit).toFixed(2) : "0.00";
    const totalHours = activities?.reduce((sum, a) => sum + a.hours, 0) || 0;

    setViewingUser({ ...user, gpax, totalHours });
    setStudentGrades(groupedGrades);
    setStudentActivities(activities || []);
    setActivityProgress(actProgress);
    
    setEditForm(user);
    setIsEditing(false);
    setModalTab("profile"); // เปิดมาเจอหน้า Profile ก่อน
    setLoading(false);
  };

  // --- CRUD HANDLERS ---
  const handleSaveChanges = async () => {
    if (!canEditUser) return;
    const { error } = await supabase.from("profiles").update({
        first_name: editForm.first_name,
        major: editForm.major,
        year: editForm.year,
        role: editForm.role 
    }).eq("id", viewingUser.id);

    if (!error) {
        alert("Updated! ✅");
        setUsers(users.map(u => u.id === viewingUser.id ? { ...u, ...editForm } : u));
        setViewingUser(null);
    } else {
        alert("Error: " + error.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!isOwner) return;
    const confirmDelete = confirm(`Are you sure you want to delete ${viewingUser.first_name}?`);
    if (!confirmDelete) return;

    setIsSubmitting(true);
    // ลบแม่ลูก (ถึง DB จะ Cascade แล้ว แต่สั่งลบเผื่อไว้เพื่อความชัวร์ในฝั่ง Client logic)
    await supabase.from("grades").delete().eq("user_id", viewingUser.id);
    await supabase.from("activities").delete().eq("user_id", viewingUser.id);
    const { error } = await supabase.from("profiles").delete().eq("id", viewingUser.id);

    setIsSubmitting(false);

    if (!error) {
        setUsers(users.filter(u => u.id !== viewingUser.id));
        setViewingUser(null);
    } else {
        alert("Error: " + error.message);
    }
  };

  const handleAddGrade = async () => {
    if (!selectedUserId || !subjectCode) return alert("Please fill data");
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
        alert("Grade Added! ✅"); 
        setSubjectCode(""); setSubjectName(""); 
    } else {
        alert("Error: " + error.message);
    }
  };

  const handleAddActivity = async () => {
    if (!selectedUserId || !actName) return alert("Please fill data");
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
        alert("Activity Added! 🏆"); 
        setActName(""); setActDesc(""); 
    } else {
        alert("Error: " + error.message);
    }
  };

  // Helper: คำนวณ GPA รายเทอม
  const calculateTermGPA = (grades) => {
    let score = 0, credit = 0;
    const map = { "A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D+": 1.5, "D": 1, "F": 0, "I": 0 };
    grades.forEach(g => { 
        if(g.grade !== "I") { 
            score += (map[g.grade] || 0) * g.credit; 
            credit += g.credit; 
        } 
    });
    return credit ? (score / credit).toFixed(2) : "0.00";
  };

  if (loading && !viewingUser) return <div className={`min-h-screen flex items-center justify-center font-bold ${theme.text}`}>Loading...</div>;

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

        {/* === MAIN TABS === */}
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

        {/* === CONTENT AREA === */}
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

            {/* 📚 TAB 2: GRADE FORM (Add Data) */}
            {activeTab === "grade" && (
                <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
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
                         <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Code</label><input placeholder="GEN111" className="w-full p-3 border rounded-xl" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} /></div>
                         <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Name</label><input placeholder="Subject Name" className="w-full p-3 border rounded-xl" value={subjectName} onChange={e => setSubjectName(e.target.value)} /></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500">Year</label>
                             <select className="w-full p-3 border rounded-xl" value={year} onChange={e => setYear(Number(e.target.value))} disabled={!targetStudent}>
                                {Array.from({ length: Number(targetStudent?.year) || 1 }, (_, i) => i + 1).map(y => (
                                    <option key={y} value={y}>Year {y}</option>
                                ))}
                             </select>
                         </div>
                         <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Term</label><select className="w-full p-3 border rounded-xl" value={term} onChange={e => setTerm(Number(e.target.value))}><option value={1}>Term 1</option><option value={2}>Term 2</option></select></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Grade</label><select className="w-full p-3 border rounded-xl" value={grade} onChange={e => setGrade(e.target.value)}><option>A</option><option>B+</option><option>B</option><option>C+</option><option>C</option><option>D+</option><option>D</option><option>F</option><option>I</option></select></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Credit</label><input type="number" className="w-full p-3 border rounded-xl" value={credit} onChange={e => setCredit(e.target.value)} /></div>
                    </div>
                    
                    <button onClick={handleAddGrade} disabled={isSubmitting} className={`w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex justify-center ${theme.btn} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}>
                        {isSubmitting ? <Loader2 className="animate-spin"/> : "Save Grade Record"}
                    </button>
                </div>
            )}

            {/* 🏆 TAB 3: ACTIVITY FORM (Add Data) */}
            {activeTab === "activity" && (
                <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">Target Student</label>
                        <select className="w-full p-3 bg-gray-50 border rounded-xl" value={selectedUserId} onChange={(e) => handleSelectStudent(e.target.value)}>
                            <option value="">-- Choose Student --</option>
                            {users.filter(u => u.role === 'STUDENT').map(u => (<option key={u.id} value={u.id}>{u.student_id} - {u.first_name}</option>))}
                        </select>
                     </div>

                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Activity Name</label><input placeholder="SIT Camp 2026" className="w-full p-3 border rounded-xl" value={actName} onChange={e => setActName(e.target.value)} /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Description</label><textarea placeholder="Details about activity..." className="w-full p-3 border rounded-xl h-24" value={actDesc} onChange={e => setActDesc(e.target.value)} /></div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Hours</label><input type="number" placeholder="Hours" className="w-full p-3 border rounded-xl" value={actHours} onChange={e => setActHours(e.target.value)} /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Category</label><select className="w-full p-3 border rounded-xl" value={actCategory} onChange={e => setActCategory(e.target.value)}><option value="Tech">Tech</option><option value="Staff">Staff</option><option value="Social">Social</option></select></div>
                    </div>

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

      {/* ================= 🔥 NEW MODAL: TABBED INTERFACE 🔥 ================= */}
      {viewingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className={`p-4 flex justify-between items-center text-white ${theme.header}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden border border-white/50">
                            <img src={viewingUser.avatar} className="w-full h-full object-cover"/>
                        </div>
                        <div>
                            <h3 className="font-bold leading-tight">{viewingUser.first_name}</h3>
                            <p className="text-xs opacity-90">{viewingUser.student_id}</p>
                        </div>
                    </div>
                    <button onClick={() => setViewingUser(null)} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
                </div>

                {/* Modal Tabs Navigation */}
                <div className="flex border-b">
                    <button onClick={() => setModalTab("profile")} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${modalTab === "profile" ? "text-gray-800 border-b-2 border-gray-800" : "text-gray-400 hover:bg-gray-50"}`}>Profile</button>
                    <button onClick={() => setModalTab("transcript")} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${modalTab === "transcript" ? "text-gray-800 border-b-2 border-gray-800" : "text-gray-400 hover:bg-gray-50"}`}>Transcript</button>
                    <button onClick={() => setModalTab("activity")} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${modalTab === "activity" ? "text-gray-800 border-b-2 border-gray-800" : "text-gray-400 hover:bg-gray-50"}`}>Activity</button>
                </div>

                {/* Modal Content Area */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    
                    {/* TAB 1: PROFILE EDIT */}
                    {modalTab === "profile" && (
                        <>
                            {isEditing && canEditUser ? (
                                <div className="space-y-3 animate-fade-in">
                                    <div className="space-y-1"><label className="text-xs font-bold text-gray-400">First Name</label><input className="w-full p-2 border rounded-lg" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} /></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1"><label className="text-xs font-bold text-gray-400">Major</label><select className="w-full p-2 border rounded-lg" value={editForm.major} onChange={e => setEditForm({...editForm, major: e.target.value})}><option value="IT">IT</option><option value="CS">CS</option><option value="DSI">DSI</option></select></div>
                                        <div className="space-y-1"><label className="text-xs font-bold text-gray-400">Year</label><input type="number" className="w-full p-2 border rounded-lg" value={editForm.year} onChange={e => setEditForm({...editForm, year: e.target.value})} /></div>
                                    </div>
                                    {isOwner && (
                                        <div className="space-y-1"><label className="text-xs font-bold text-gray-400">Role (Owner Only)</label><select className="w-full p-2 border rounded-lg bg-yellow-50" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}><option value="STUDENT">Student</option><option value="REGISTRAR">Registrar</option><option value="ACADEMIC">Academic</option><option value="SCHEDULER">Scheduler</option><option value="OWNER">Owner</option></select></div>
                                    )}
                                    <button onClick={handleSaveChanges} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg mt-2">Save Changes</button>
                                </div>
                            ) : (
                                <div className="text-center space-y-4 animate-fade-in">
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <p className="text-sm text-gray-500 font-bold mb-1">Current Status</p>
                                        <p className="text-xl font-bold text-gray-800">{viewingUser.major} Student</p>
                                        <p className="text-sm text-gray-400">Year {viewingUser.year}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-blue-50 p-3 rounded-xl">
                                            <p className="text-xs text-blue-400 font-bold uppercase">GPAX</p>
                                            <p className="text-2xl font-bold text-blue-600">{viewingUser.gpax}</p>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded-xl">
                                            <p className="text-xs text-green-400 font-bold uppercase">Activity</p>
                                            <p className="text-2xl font-bold text-green-600">{viewingUser.totalHours} <span className="text-xs">hrs</span></p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        {canEditUser && (
                                            <button onClick={() => setIsEditing(true)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                                                <Edit3 size={16}/> Edit
                                            </button>
                                        )}
                                        {isOwner && (
                                            <button onClick={handleDeleteUser} disabled={isSubmitting} className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                                                {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <><Trash2 size={16}/> Delete</>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* TAB 2: TRANSCRIPT (Deep Grade View - New Logic) */}
                    {modalTab === "transcript" && (
                        <div className="space-y-4 animate-fade-in">
                            {Object.keys(studentGrades).length === 0 ? (
                                <div className="text-center text-gray-400 py-10 flex flex-col items-center">
                                    <Book size={48} className="opacity-20 mb-2"/>
                                    <p>No grades recorded yet.</p>
                                </div>
                            ) : (
                                Object.keys(studentGrades).map((termKey) => (
                                    <div key={termKey} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                            <span className="font-bold text-sm text-gray-700 flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400"/>
                                                Year {termKey.split('/')[0]} / Term {termKey.split('/')[1]}
                                            </span>
                                            <span className="text-xs font-bold bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600 shadow-sm">
                                                GPA: {calculateTermGPA(studentGrades[termKey])}
                                            </span>
                                        </div>
                                        <table className="w-full text-left">
                                            <tbody className="divide-y divide-gray-100">
                                                {studentGrades[termKey].map((g, i) => (
                                                    <tr key={i} className="text-xs hover:bg-gray-50">
                                                        <td className="p-3 text-gray-500 font-mono font-bold w-20">{g.subject_code}</td>
                                                        <td className="p-3 font-bold text-gray-700">{g.subject_name}</td>
                                                        <td className="p-3 font-bold text-right w-16">
                                                            <span className={`px-2 py-1 rounded-md ${g.grade === 'F' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                                                {g.grade}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* TAB 3: ACTIVITY DASHBOARD (Yearly Progress - New Logic) */}
                    {modalTab === "activity" && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Progress Bars Section */}
                            <div className="space-y-4 bg-white p-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Yearly Goals (Target: 25h)</h4>
                                {[1, 2, 3, 4].map(y => {
                                    const hrs = activityProgress[y] || 0;
                                    const percent = Math.min((hrs / 25) * 100, 100);
                                    
                                    // Logic สีหลอด: เขียว (ครบ), เหลือง (เริ่มทำ), เทา (ยังไม่ทำ)
                                    let color = "bg-gray-200";
                                    if (percent >= 100) color = "bg-green-500";
                                    else if (percent > 0) color = "bg-yellow-400";

                                    return (
                                        <div key={y} className="flex items-center gap-3">
                                            <div className="w-10 text-right">
                                                <span className="text-xs font-bold text-gray-500">Year {y}</span>
                                            </div>
                                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                <div className={`h-full ${color} transition-all duration-700 ease-out`} style={{ width: `${percent}%` }}></div>
                                            </div>
                                            <div className="w-12 text-right">
                                                <span className={`text-xs font-bold ${percent >= 100 ? 'text-green-600' : 'text-gray-600'}`}>{hrs}/25</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            
                            <hr className="border-gray-100"/>

                            {/* Activity History List */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Activity Log</h4>
                                {studentActivities.length === 0 ? (
                                    <div className="text-center text-gray-300 text-xs italic py-4">No activities found.</div>
                                ) : (
                                    studentActivities.map((act, i) => (
                                        <div key={i} className="flex justify-between items-start bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{act.name}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[10px] font-bold bg-white border px-1.5 py-0.5 rounded text-gray-500 uppercase">{act.category}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 py-0.5">Year {act.academic_year}</span>
                                                </div>
                                                {act.description && <p className="text-xs text-gray-500 mt-2 italic">"{act.description}"</p>}
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-lg">+{act.hours} Hrs</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                </div>
             </div>
        </div>
      )}
    </div>
  );
}