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
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState(""); 
  
  // Modal & Detail States
  const [viewingUser, setViewingUser] = useState(null);
  const [modalTab, setModalTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Deep Data States
  const [studentGrades, setStudentGrades] = useState({});
  const [studentActivities, setStudentActivities] = useState([]); 
  const [activityProgress, setActivityProgress] = useState({ 1:0, 2:0, 3:0, 4:0 });

  // ✅ State สำหรับระบบเกรดจริง
  const [studentEnrollments, setStudentEnrollments] = useState([]); 
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(""); 

  // Add Data Form States
  const [selectedUserId, setSelectedUserId] = useState("");
  const [targetStudent, setTargetStudent] = useState(null);
  
  // Grade Form Inputs
  const [grade, setGrade] = useState("A");
  const [year, setYear] = useState(1);
  const [term, setTerm] = useState(1);
  const [subjectCode, setSubjectCode] = useState(""); 
  const [subjectName, setSubjectName] = useState(""); 
  const [credit, setCredit] = useState(3);

  // Activity Form Inputs
  const [actName, setActName] = useState("");
  const [actHours, setActHours] = useState(3);
  const [actCategory, setActCategory] = useState("Tech");
  const [actDesc, setActDesc] = useState(""); 
  const [actYear, setActYear] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- INITIALIZE ---
  useEffect(() => {
    const initAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/register"); return; }
      
      const { data: myProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      
      if (!myProfile || myProfile.role === 'STUDENT') {
         router.push("/"); 
         return;
      }

      setMyRole(myProfile.role);

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

  // --- LOGIC: Select Student (ดึงวิชาแบบชัวร์ๆ) ---
  const handleSelectStudent = async (id) => {
      setSelectedUserId(id);
      const student = users.find(u => u.id === id);
      setTargetStudent(student);
      setYear(student?.year ? Number(student.year) : 1);
      setActYear(student?.year ? Number(student.year) : 1);

      if (id) {
        // 1. ดึง Enrollment
        const { data: enrolls } = await supabase
            .from("enrollments")
            .select("id, grade, status, class_id")
            .eq("user_id", id);

        if (enrolls && enrolls.length > 0) {
            const classIds = enrolls.map(e => e.class_id);
            
            // 2. ดึงรายละเอียดวิชา
            const { data: classesData } = await supabase
                .from("classes")
                .select(`id, subject_code, subjects (name, credit)`)
                .in("id", classIds);

            // 3. รวมร่างข้อมูล
            const combined = enrolls.map(e => {
                const cls = classesData?.find(c => c.id === e.class_id);
                return { ...e, classes: cls };
            });
            setStudentEnrollments(combined);
        } else {
            setStudentEnrollments([]);
        }
        setSelectedEnrollmentId(""); 
      } else {
        setStudentEnrollments([]);
      }
  };

  // --- THEME ---
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

  // --- VIEW USER DETAIL ---
  const handleViewUser = async (user) => {
    setLoading(true);
    
    // 1. ดึงข้อมูล Enrollment + Activity
    const { data: enrolls } = await supabase.from("enrollments").select("id, grade, class_id").eq("user_id", user.id);
    const { data: activities } = await supabase.from("activities").select("*").eq("user_id", user.id).order('academic_year', { ascending: true });
    
    let processedGrades = [];
    if (enrolls && enrolls.length > 0) {
        const classIds = enrolls.map(e => e.class_id);
        const { data: classesData } = await supabase
            .from("classes")
            .select(`id, subject_code, study_year, study_term, subjects (name, credit)`)
            .in("id", classIds);

        processedGrades = enrolls.map(e => {
            const cls = classesData?.find(c => c.id === e.class_id);
            return { ...e, classes: cls };
        });
    }

    // Process Grades & GPA Calculation
    const groupedGrades = {};
    let totalScore = 0, totalCredit = 0;
    const gradeMap = { "A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D+": 1.5, "D": 1, "F": 0, "I": 0 };
    
    processedGrades.forEach(e => {
        const cls = e.classes;
        const subj = cls?.subjects;
        if(!cls || !subj) return;

        const key = `${cls.study_year || 1}/${cls.study_term || 1}`;
        if (!groupedGrades[key]) groupedGrades[key] = [];
        
        groupedGrades[key].push({
            subject_code: cls.subject_code,
            subject_name: subj.name,
            grade: e.grade || "Studying",
            credit: subj.credit
        });
        
        if (e.grade && gradeMap[e.grade] !== undefined) {
            totalScore += (gradeMap[e.grade] * subj.credit);
            totalCredit += subj.credit;
        }
    });

    const actProgress = { 1: 0, 2: 0, 3: 0, 4: 0 };
    activities?.forEach(a => {
        const y = a.academic_year || 1; 
        if (actProgress[y] !== undefined) actProgress[y] += a.hours;
    });

    const gpax = totalCredit ? (totalScore / totalCredit).toFixed(2) : "0.00";
    const totalHours = activities?.reduce((sum, a) => sum + a.hours, 0) || 0;

    setViewingUser({ ...user, gpax, totalHours });
    setStudentGrades(groupedGrades);
    setStudentActivities(activities || []);
    setActivityProgress(actProgress);
    
    setEditForm(user);
    setIsEditing(false);
    setModalTab("profile");
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
    if (!confirm(`Delete ${viewingUser.first_name}?`)) return;

    setIsSubmitting(true);
    await supabase.from("enrollments").delete().eq("user_id", viewingUser.id);
    await supabase.from("activities").delete().eq("user_id", viewingUser.id);
    await supabase.from("notifications").delete().eq("user_id", viewingUser.id); 
    const { error } = await supabase.from("profiles").delete().eq("id", viewingUser.id);

    setIsSubmitting(false);

    if (!error) {
        setUsers(users.filter(u => u.id !== viewingUser.id));
        setViewingUser(null);
    } else {
        alert("Error: " + error.message);
    }
  };

  // ✅ SAVE GRADE (Update ลง Enrollments)
  const handleSaveGrade = async () => {
    if (!selectedUserId || !selectedEnrollmentId) return alert("Please select student and class");
    setIsSubmitting(true);

    const { error } = await supabase
        .from("enrollments")
        .update({ grade: grade, status: 'completed' })
        .eq("id", selectedEnrollmentId);

    if (!error) { 
        const targetClass = studentEnrollments.find(e => e.id === selectedEnrollmentId);
        const subjName = targetClass?.classes?.subjects?.name || "Subject";

        await supabase.from("notifications").insert({
            user_id: selectedUserId,
            title: "Grade Released",
            message: `วิชา ${subjName} เกรดออกแล้ว! เกรด: ${grade}`,
            type: "grade",
            is_read: false
        });

        alert("Grade Updated! ✅"); 
        handleSelectStudent(selectedUserId); 
    } else {
        alert("Error: " + error.message);
    }
    setIsSubmitting(false);
  };

  // ✅ ADD ACTIVITY
  const handleAddActivity = async () => {
    if (!selectedUserId || !actName) return alert("Please fill data");
    setIsSubmitting(true);

    const { error: actError } = await supabase.from("activities").insert({ 
        user_id: selectedUserId, name: actName, hours: actHours, category: actCategory, 
        date: new Date(), academic_year: actYear, description: actDesc 
    });

    if (!actError) { 
        await supabase.from("notifications").insert({
            user_id: selectedUserId, title: "Activity Recorded",
            message: `บันทึกกิจกรรม "${actName}" เรียบร้อย! (+${actHours} hrs)`, type: "activity", is_read: false
        });
        alert("Activity Added! 🏆"); 
        setActName(""); setActDesc(""); 
    } else {
        alert("Error: " + actError.message);
    }
    setIsSubmitting(false);
  };

  const calculateTermGPA = (grades) => {
    let score = 0, credit = 0;
    const map = { "A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D+": 1.5, "D": 1, "F": 0 };
    grades.forEach(g => { 
        if(map[g.grade] !== undefined) { score += (map[g.grade] * g.credit); credit += g.credit; } 
    });
    return credit ? (score / credit).toFixed(2) : "0.00";
  };

  // ✅ แก้ไข Loading: ใช้ text-gray-500 แทน theme.text เพื่อเลี่ยง ReferenceError
  if (loading && !viewingUser) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading...</div>;

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center p-4 md:p-6 transition-colors`}>
      <div className={`w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border ${theme.border} flex flex-col h-[85vh]`}>
        
        {/* HEADER */}
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

        {/* TABS */}
        <div className="flex border-b border-gray-100 shrink-0 overflow-x-auto">
            <button onClick={() => setActiveTab("users")} className={`flex-1 min-w-[100px] py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === "users" ? theme.activeTab : "text-gray-400"}`}><Users size={18} /> Users</button>
            {canAddGrade && <button onClick={() => setActiveTab("grade")} className={`flex-1 min-w-[100px] py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === "grade" ? theme.activeTab : "text-gray-400"}`}><Book size={18} /> Grading</button>}
            {canAddGrade && <button onClick={() => setActiveTab("activity")} className={`flex-1 min-w-[100px] py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === "activity" ? theme.activeTab : "text-gray-400"}`}><Trophy size={18} /> Activity</button>}
            {canSchedule && <button onClick={() => setActiveTab("schedule")} className={`flex-1 min-w-[100px] py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === "schedule" ? theme.activeTab : "text-gray-400"}`}><Calendar size={18} /> Plan</button>}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
            
            {/* USERS LIST */}
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

            {/* ✅ GRADING TAB (แก้ UI ให้เลือกวิชาได้จริง) */}
            {activeTab === "grade" && (
                <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h3 className="text-blue-700 font-bold flex items-center gap-2 mb-1"><Book size={18}/> Grading System</h3>
                        <p className="text-xs text-blue-500">Select a student and their enrolled class to assign a grade.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">1. Select Student</label>
                            <select className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" value={selectedUserId} onChange={(e) => handleSelectStudent(e.target.value)}>
                                <option value="">-- Select Student --</option>
                                {users.filter(u => u.role === 'STUDENT').map(u => (
                                    <option key={u.id} value={u.id}>{u.student_id} - {u.first_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">2. Select Enrolled Class</label>
                            <select 
                                className="w-full p-3 border rounded-xl bg-white disabled:bg-gray-100" 
                                value={selectedEnrollmentId} 
                                onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                                disabled={!selectedUserId}
                            >
                                <option value="">-- Choose Class to Grade --</option>
                                {studentEnrollments.map(e => (
                                    <option key={e.id} value={e.id}>
                                        {e.classes?.subject_code} - {e.classes?.subjects?.name} (Current: {e.grade || '-'})
                                    </option>
                                ))}
                            </select>
                            {selectedUserId && studentEnrollments.length === 0 && <p className="text-xs text-red-400 mt-1">This student has no enrolled classes.</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">3. Assign Grade</label>
                            <div className="grid grid-cols-4 gap-2">
                                {["A", "B+", "B", "C+", "C", "D+", "D", "F"].map(g => (
                                    <button 
                                        key={g} 
                                        onClick={() => setGrade(g)}
                                        className={`py-3 rounded-lg text-sm font-bold border transition-all ${grade === g ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <button onClick={handleSaveGrade} disabled={isSubmitting || !selectedEnrollmentId} className={`w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex justify-center mt-4 ${theme.btn} ${(isSubmitting || !selectedEnrollmentId) ? "opacity-50 cursor-not-allowed" : ""}`}>
                            {isSubmitting ? <Loader2 className="animate-spin"/> : "Confirm & Release Grade"}
                        </button>
                    </div>
                </div>
            )}

            {/* ACTIVITY FORM */}
            {activeTab === "activity" && (
                <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">Target Student</label>
                        <select className="w-full p-3 bg-gray-50 border rounded-xl" value={selectedUserId} onChange={(e) => handleSelectStudent(e.target.value)}>
                            <option value="">-- Choose Student --</option>
                            {users.filter(u => u.role === 'STUDENT').map(u => (<option key={u.id} value={u.id}>{u.student_id} - {u.first_name}</option>))}
                        </select>
                     </div>
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Activity Name</label><input placeholder="Event Name" className="w-full p-3 border rounded-xl" value={actName} onChange={e => setActName(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Hours</label><input type="number" placeholder="Hours" className="w-full p-3 border rounded-xl" value={actHours} onChange={e => setActHours(e.target.value)} /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Category</label><select className="w-full p-3 border rounded-xl" value={actCategory} onChange={e => setActCategory(e.target.value)}><option value="Tech">Tech</option><option value="Staff">Staff</option><option value="Social">Social</option></select></div>
                    </div>
                    <div className="w-full space-y-1">
                         <label className="text-xs text-gray-500 font-bold block">Activity Year</label>
                         <select className="w-full p-3 border rounded-xl" value={actYear} onChange={e => setActYear(Number(e.target.value))} disabled={!targetStudent}>
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
            
            {/* PLAN MOCKUP */}
            {activeTab === "schedule" && (
                <div className="text-center py-10 opacity-60">
                    <Calendar size={64} className="mx-auto mb-4 text-gray-300"/>
                    <h3 className="text-xl font-bold text-gray-700">Course Scheduler</h3>
                    <p className="text-sm text-gray-400">Class schedule management for future implementation.</p>
                </div>
            )}

        </div>
      </div>

      {/* MODAL: VIEW USER */}
      {viewingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className={`p-4 flex justify-between items-center text-white ${theme.header}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden border border-white/50">
                            <img src={viewingUser.avatar} className="w-full h-full object-cover"/>
                        </div>
                        <div><h3 className="font-bold leading-tight">{viewingUser.first_name}</h3><p className="text-xs opacity-90">{viewingUser.student_id}</p></div>
                    </div>
                    <button onClick={() => setViewingUser(null)} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
                </div>

                <div className="flex border-b">
                    <button onClick={() => setModalTab("profile")} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${modalTab === "profile" ? "text-gray-800 border-b-2 border-gray-800" : "text-gray-400 hover:bg-gray-50"}`}>Profile</button>
                    <button onClick={() => setModalTab("transcript")} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${modalTab === "transcript" ? "text-gray-800 border-b-2 border-gray-800" : "text-gray-400 hover:bg-gray-50"}`}>Transcript</button>
                    <button onClick={() => setModalTab("activity")} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${modalTab === "activity" ? "text-gray-800 border-b-2 border-gray-800" : "text-gray-400 hover:bg-gray-50"}`}>Activity</button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* PROFILE TAB */}
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
                                        <div className="bg-blue-50 p-3 rounded-xl"><p className="text-xs text-blue-400 font-bold uppercase">GPAX</p><p className="text-2xl font-bold text-blue-600">{viewingUser.gpax}</p></div>
                                        <div className="bg-green-50 p-3 rounded-xl"><p className="text-xs text-green-400 font-bold uppercase">Activity</p><p className="text-2xl font-bold text-green-600">{viewingUser.totalHours} <span className="text-xs">hrs</span></p></div>
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

                    {/* TAB 2: TRANSCRIPT */}
                    {modalTab === "transcript" && (
                        <div className="space-y-4 animate-fade-in">
                            {Object.keys(studentGrades).length === 0 ? (
                                <div className="text-center text-gray-400 py-10 flex flex-col items-center"><Book size={48} className="opacity-20 mb-2"/><p>No grades recorded yet.</p></div>
                            ) : (
                                Object.keys(studentGrades).sort().map((termKey) => (
                                    <div key={termKey} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                            <span className="font-bold text-sm text-gray-700 flex items-center gap-2"><Calendar size={14} className="text-gray-400"/> Year {termKey.split('/')[0]} / Term {termKey.split('/')[1]}</span>
                                            <span className="text-xs font-bold bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600 shadow-sm">GPA: {calculateTermGPA(studentGrades[termKey])}</span>
                                        </div>
                                        <table className="w-full text-left">
                                            <tbody className="divide-y divide-gray-100">
                                                {studentGrades[termKey].map((g, i) => (
                                                    <tr key={i} className="text-xs hover:bg-gray-50">
                                                        <td className="p-3 text-gray-500 font-mono font-bold w-20">{g.subject_code}</td>
                                                        <td className="p-3 font-bold text-gray-700">{g.subject_name}</td>
                                                        <td className="p-3 font-bold text-right w-16">
                                                            <span className={`px-2 py-1 rounded-md ${g.grade === 'Studying' ? 'bg-gray-100 text-gray-500' : g.grade === 'F' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{g.grade}</span>
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

                    {/* TAB 3: ACTIVITY */}
                    {modalTab === "activity" && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="space-y-3">
                                {studentActivities.length === 0 ? <div className="text-center text-gray-300 text-xs italic py-4">No activities found.</div> : 
                                    studentActivities.map((act, i) => (
                                        <div key={i} className="flex justify-between items-start bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div><p className="text-sm font-bold text-gray-800">{act.name}</p><span className="text-[10px] font-bold bg-white border px-1.5 py-0.5 rounded text-gray-500 uppercase">{act.category}</span></div>
                                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-lg">+{act.hours} Hrs</span>
                                        </div>
                                    ))
                                }
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