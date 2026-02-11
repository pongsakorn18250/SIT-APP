"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, Trash2, Book, Trophy, Search, Save, 
  AlertTriangle, ArrowLeft, Users, User, X, Edit3, Crown, Calendar, Loader2,
  PieChart, List, Award, CheckCircle, PlusCircle, Clock, MapPin
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  
  // --- STATES ---
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [allClasses, setAllClasses] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState(""); 
  
  // Modal States
  const [viewingUser, setViewingUser] = useState(null);
  const [modalTab, setModalTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Data States
  const [studentGrades, setStudentGrades] = useState({});
  const [studentActivities, setStudentActivities] = useState([]); 
  
  // Grading States
  const [studentEnrollments, setStudentEnrollments] = useState([]); 
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(""); 
  const [selectedUserId, setSelectedUserId] = useState("");
  const [targetStudent, setTargetStudent] = useState(null);
  const [grade, setGrade] = useState("A");

  // Plan Form (เพิ่มวิชา)
  const [planForm, setPlanForm] = useState({
      subject_code: "",
      subject_name: "",
      credit: 3,
      day_of_week: "Mon",
      start_time: "09:00",
      end_time: "12:00",
      room: "",
      teacher: "",
      semester: "1/2026",
      target_year: 0 
  });

  // Activity Form
  const [actName, setActName] = useState("");
  const [actHours, setActHours] = useState(3);
  const [actCategory, setActCategory] = useState("Tech");
  const [actDesc, setActDesc] = useState(""); 
  const [actYear, setActYear] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- THEME ---
  const isOwner = myRole === 'OWNER';
  const canPlan = isOwner || myRole === 'SCHEDULER';
  const canGrade = isOwner || myRole === 'ACADEMIC';
  const canEditUser = isOwner || myRole === 'REGISTRAR';
  
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

  // --- INITIALIZE ---
  useEffect(() => {
    const initAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/register"); return; }
      
      const { data: myProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!myProfile || myProfile.role === 'STUDENT') { router.push("/"); return; }

      setMyRole(myProfile.role);

      const { data: userList } = await supabase.from("profiles").select("*").eq("role", "STUDENT").order("student_id", { ascending: true });
      setUsers(userList || []);

      fetchClasses();
      setLoading(false);
    };
    initAdmin();
  }, []);

  const fetchClasses = async () => {
      // ดึงจาก classes โดยตรง (เพราะเราจะบันทึกชื่อลง classes แล้ว)
      const { data } = await supabase.from("classes").select("*").order("subject_code", { ascending: true });
      setAllClasses(data || []);
  };

  // --- LOGIC: Select Student ---
  const handleSelectStudent = async (id) => {
      setSelectedUserId(id);
      const foundStudent = users.find(u => u.id === id);
      setTargetStudent(foundStudent);
      if (foundStudent) setActYear(Number(foundStudent.year) || 1);

      if (id) {
        // ดึงข้อมูล Enrollment พร้อม Classes
        const { data: enrolls } = await supabase.from("enrollments").select("id, grade, status, class_id").eq("user_id", id);
        
        if (enrolls && enrolls.length > 0) {
            const classIds = enrolls.map(e => e.class_id);
            const { data: classesData } = await supabase.from("classes").select(`id, subject_code, subject_name`).in("id", classIds);

            const combined = enrolls.map(e => {
                const cls = classesData?.find(c => c.id === e.class_id);
                return { 
                    ...e, 
                    classes: cls || {}
                };
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

  // --- VIEW USER DETAIL (Transcript Fix) ---
  const handleViewUser = async (user) => {
    setLoading(true);
    
    const { data: enrolls } = await supabase.from("enrollments").select("id, grade, class_id").eq("user_id", user.id);
    const { data: activities } = await supabase.from("activities").select("*").eq("user_id", user.id).order('academic_year', { ascending: true });
    
    let processedGrades = [];
    if (enrolls && enrolls.length > 0) {
        const classIds = enrolls.map(e => e.class_id);
        const { data: classesData } = await supabase.from("classes").select("*").in("id", classIds);
        
        processedGrades = enrolls.map(e => {
            const cls = classesData?.find(c => c.id === e.class_id);
            
            // ✅ Logic ปีการศึกษา: ถ้า target_year = 0 ให้เดาจากรหัสวิชา (เช่น DSI354 -> 3)
            let derivedYear = cls?.target_year;
            if (!derivedYear || derivedYear === 0) {
                const codeNum = cls?.subject_code?.match(/\d+/)?.[0]; 
                derivedYear = codeNum ? parseInt(codeNum.substring(0, 1)) : 1; // DSI3xx -> Year 3
            }

            return {
                ...e,
                subject_code: cls?.subject_code,
                subject_name: cls?.subject_name || "Unknown Subject",
                credit: cls?.credit || 3,
                derived_year: derivedYear,
                semester: cls?.semester
            };
        });
    }

    // Grouping
    const groupedGrades = {};
    let totalScore = 0, totalCredit = 0;
    const gradeMap = { "A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D+": 1.5, "D": 1, "F": 0 };
    
    processedGrades.forEach(g => {
        // Group Key: Year X / Sem Y
        const term = g.semester ? g.semester.split('/')[0] : '1';
        const key = `Year ${g.derived_year} / Sem ${term}`; // ใช้ derived_year ที่คำนวณมา

        if (!groupedGrades[key]) groupedGrades[key] = [];
        groupedGrades[key].push(g);

        if (g.grade && gradeMap[g.grade] !== undefined) {
            totalScore += (gradeMap[g.grade] * g.credit);
            totalCredit += g.credit;
        }
    });

    const gpax = totalCredit ? (totalScore / totalCredit).toFixed(2) : "0.00";
    const totalHours = activities?.reduce((sum, a) => sum + a.hours, 0) || 0;

    setViewingUser({ ...user, gpax, totalHours });
    setStudentGrades(groupedGrades);
    setStudentActivities(activities || []);
    setEditForm(user);
    setIsEditing(false);
    setModalTab("profile");
    setLoading(false);
  };

  // --- ACTIONS ---
  const handleSaveChanges = async () => { 
    const { error } = await supabase.from("profiles").update({
        first_name: editForm.first_name, major: editForm.major, year: editForm.year, role: editForm.role 
    }).eq("id", viewingUser.id);
    if (!error) { alert("Updated! ✅"); setUsers(users.map(u => u.id === viewingUser.id ? { ...u, ...editForm } : u)); setViewingUser(null); }
  };

  const handleDeleteUser = async () => {
    if (!confirm(`Delete ${viewingUser.first_name}?`)) return;
    setIsSubmitting(true);
    await supabase.from("enrollments").delete().eq("user_id", viewingUser.id);
    await supabase.from("activities").delete().eq("user_id", viewingUser.id);
    await supabase.from("notifications").delete().eq("user_id", viewingUser.id); 
    const { error } = await supabase.from("profiles").delete().eq("id", viewingUser.id);
    setIsSubmitting(false);
    if (!error) { setUsers(users.filter(u => u.id !== viewingUser.id)); setViewingUser(null); }
  };

  const handleDeleteEnrollment = async (enrollmentId) => {
      if(!confirm("Remove course?")) return;
      const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
      if(!error) { alert("Removed!"); handleViewUser(viewingUser); } 
  };

  // ✅ ACTION: ADD CLASS (Fix: บันทึกข้อมูลลง DB ให้ครบ & ถูกชื่อคอลัมน์)
  const handleAddClass = async () => {
      if(!planForm.subject_code || !planForm.subject_name) return alert("Please fill Subject Code and Name");
      setIsSubmitting(true);
      
      const { error } = await supabase.from("classes").insert({
          subject_code: planForm.subject_code.toUpperCase(),
          subject_name: planForm.subject_name, // บันทึกชื่อวิชา
          credit: Number(planForm.credit),     // บันทึกหน่วยกิต
          target_year: Number(planForm.target_year), // บันทึกปีเป้าหมาย
          day_of_week: planForm.day_of_week,
          start_time: planForm.start_time,
          end_time: planForm.end_time,
          room: planForm.room,
          teacher: planForm.teacher, // ✅ แก้จาก lecturer เป็น teacher
          semester: planForm.semester
      });

      if(!error) { 
          alert("Class Opened! 🎉"); 
          // Reset form บางส่วน
          setPlanForm({ ...planForm, subject_code: "", subject_name: "" }); 
          fetchClasses(); 
      } else { 
          alert("Error: " + error.message); 
      }
      setIsSubmitting(false);
  };

  const handleDeleteClass = async (classId) => {
      if(!confirm("Delete class?")) return;
      const { error } = await supabase.from("classes").delete().eq("id", classId);
      if(!error) fetchClasses();
  };

  const handleSaveGrade = async () => {
    if (!selectedUserId || !selectedEnrollmentId) return alert("Select student & class");
    setIsSubmitting(true);
    const { error } = await supabase.from("enrollments").update({ grade: grade, status: 'completed' }).eq("id", selectedEnrollmentId);
    if (!error) { 
        alert("Grade Updated! ✅"); handleSelectStudent(selectedUserId); 
    }
    setIsSubmitting(false);
  };

  const handleAddActivity = async () => { 
      if (!selectedUserId || !actName) return alert("Fill data");
      setIsSubmitting(true);
      const { error } = await supabase.from("activities").insert({ 
          user_id: selectedUserId, name: actName, hours: actHours, category: actCategory, 
          date: new Date(), academic_year: actYear, description: actDesc 
      });
      if(!error) { alert("Activity Added!"); setActName(""); setActDesc(""); }
      setIsSubmitting(false);
  };

  const calculateTermGPA = (grades) => {
    let score = 0, credit = 0;
    const map = { "A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D+": 1.5, "D": 1, "F": 0 };
    grades.forEach(g => { if(map[g.grade] !== undefined) { score += (map[g.grade] * g.credit); credit += g.credit; } });
    return credit ? (score / credit).toFixed(2) : "0.00";
  };

  if (loading && !viewingUser) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading...</div>;

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center p-4 md:p-6 transition-colors`}>
      <div className={`w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border ${theme.border} flex flex-col h-[90vh]`}>
        
        {/* HEADER */}
        <div className={`${theme.header} text-white p-6 flex justify-between items-center shrink-0`}>
            <div className="flex items-center gap-3">
                {isOwner ? <Crown size={32}/> : <ShieldAlert size={32}/>}
                <div>
                    <h1 className="text-2xl font-bold">{isOwner ? "Owner Command" : "Admin Console"}</h1>
                    <p className="text-xs opacity-80 uppercase font-bold tracking-wider">{myRole}</p>
                </div>
            </div>
             <button onClick={() => router.push("/profile")} className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <User size={14}/> My Profile
            </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-100 shrink-0 overflow-x-auto">
            <button onClick={() => setActiveTab("users")} className={`flex-1 min-w-[100px] py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === "users" ? theme.activeTab : "text-gray-400"}`}><Users size={18} /> Users</button>
            {canPlan && <button onClick={() => setActiveTab("plan")} className={`flex-1 min-w-[100px] py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === "plan" ? theme.activeTab : "text-gray-400"}`}><Calendar size={18} /> Plan</button>}
            {canGrade && <button onClick={() => setActiveTab("grade")} className={`flex-1 min-w-[100px] py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === "grade" ? theme.activeTab : "text-gray-400"}`}><Book size={18} /> Grading</button>}
            {canGrade && <button onClick={() => setActiveTab("activity")} className={`flex-1 min-w-[100px] py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === "activity" ? theme.activeTab : "text-gray-400"}`}><Trophy size={18} /> Activity</button>}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
            
            {/* 1. USERS LIST */}
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
                                        <td className="p-3 font-bold text-gray-800 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden"><img src={u.avatar} className="w-full h-full object-cover"/></div>{u.first_name}</td>
                                        <td className="p-3 text-right text-xs font-bold text-gray-400 group-hover:text-gray-600">{u.role}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 2. PLAN (NEW FORM) */}
            {activeTab === "plan" && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><PlusCircle/> Open New Class</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div><label className="text-xs font-bold text-gray-400">Subject Code</label><input placeholder="e.g. INT101" className="w-full p-2 border rounded-lg uppercase" value={planForm.subject_code} onChange={e => setPlanForm({...planForm, subject_code: e.target.value})}/></div>
                            <div><label className="text-xs font-bold text-gray-400">Subject Name</label><input placeholder="Name" className="w-full p-2 border rounded-lg" value={planForm.subject_name} onChange={e => setPlanForm({...planForm, subject_name: e.target.value})}/></div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div><label className="text-xs font-bold text-gray-400">Credit</label><input type="number" className="w-full p-2 border rounded-lg" value={planForm.credit} onChange={e => setPlanForm({...planForm, credit: e.target.value})}/></div>
                            <div>
                                <label className="text-xs font-bold text-orange-500">Target Year</label>
                                <select className="w-full p-2 border border-orange-200 bg-orange-50 rounded-lg text-orange-700 font-bold" value={planForm.target_year} onChange={e => setPlanForm({...planForm, target_year: e.target.value})}>
                                    <option value="0">All Years</option>
                                    <option value="1">Year 1 Only</option>
                                    <option value="2">Year 2 Only</option>
                                    <option value="3">Year 3 Only</option>
                                    <option value="4">Year 4 Only</option>
                                </select>
                            </div>
                            <div><label className="text-xs font-bold text-gray-400">Semester</label><input className="w-full p-2 border rounded-lg" value={planForm.semester} onChange={e => setPlanForm({...planForm, semester: e.target.value})}/></div>
                            <div><label className="text-xs font-bold text-gray-400">Day</label><select className="w-full p-2 border rounded-lg" value={planForm.day_of_week} onChange={e => setPlanForm({...planForm, day_of_week: e.target.value})}><option>Mon</option><option>Tue</option><option>Wed</option><option>Thu</option><option>Fri</option><option>Sat</option></select></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div><label className="text-xs font-bold text-gray-400">Time</label><div className="flex gap-2"><input type="time" className="w-full p-2 border rounded-lg" value={planForm.start_time} onChange={e => setPlanForm({...planForm, start_time: e.target.value})}/><input type="time" className="w-full p-2 border rounded-lg" value={planForm.end_time} onChange={e => setPlanForm({...planForm, end_time: e.target.value})}/></div></div>
                            <div><label className="text-xs font-bold text-gray-400">Room</label><input className="w-full p-2 border rounded-lg" value={planForm.room} onChange={e => setPlanForm({...planForm, room: e.target.value})}/></div>
                            <div><label className="text-xs font-bold text-gray-400">Teacher</label><input className="w-full p-2 border rounded-lg" value={planForm.teacher} onChange={e => setPlanForm({...planForm, teacher: e.target.value})}/></div>
                        </div>
                        <button onClick={handleAddClass} disabled={isSubmitting} className={`w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg ${theme.btn}`}>{isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : "Confirm Open Class"}</button>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700 mb-2">Existing Classes</h3>
                        <div className="space-y-2">
                            {allClasses.map(cls => (
                                <div key={cls.id} className="flex justify-between items-center p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold bg-gray-100 px-2 rounded text-gray-600">{cls.subject_code}</span>
                                            <span className="font-bold text-gray-800">{cls.subject_name}</span>
                                            {cls.target_year > 0 && <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 rounded-full border border-orange-200">Year {cls.target_year} Only</span>}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1 flex gap-3">
                                            <span className="flex items-center gap-1"><Clock size={12}/> {cls.day_of_week} {cls.start_time?.slice(0,5)}-{cls.end_time?.slice(0,5)}</span>
                                            <span className="flex items-center gap-1"><MapPin size={12}/> {cls.room}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteClass(cls.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. GRADING */}
            {activeTab === "grade" && (
                <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h3 className="text-blue-700 font-bold flex items-center gap-2 mb-1"><Book size={18}/> Grading System</h3>
                        <p className="text-xs text-blue-500">Select a student and their enrolled class to assign a grade.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">1. Select Student</label>
                            <select className="w-full p-3 bg-gray-50 border rounded-xl" value={selectedUserId} onChange={(e) => handleSelectStudent(e.target.value)}>
                                <option value="">-- Select Student --</option>
                                {users.filter(u => u.role === 'STUDENT').map(u => (<option key={u.id} value={u.id}>{u.student_id} - {u.first_name}</option>))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">2. Select Enrolled Class</label>
                            <select className="w-full p-3 border rounded-xl" value={selectedEnrollmentId} onChange={(e) => setSelectedEnrollmentId(e.target.value)} disabled={!selectedUserId}>
                                <option value="">-- Choose Class --</option>
                                {studentEnrollments.map(e => (
                                    <option key={e.id} value={e.id}>{e.classes?.subject_code} - {e.classes?.subject_name} (Current: {e.grade || '-'})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">3. Assign Grade</label>
                            <div className="grid grid-cols-4 gap-2">
                                {["A", "B+", "B", "C+", "C", "D+", "D", "F"].map(g => (
                                    <button key={g} onClick={() => setGrade(g)} className={`py-2 rounded-lg font-bold border ${grade === g ? 'bg-gray-800 text-white' : 'bg-white text-gray-500'}`}>{g}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSaveGrade} disabled={isSubmitting} className={`w-full text-white font-bold py-3 rounded-xl shadow-lg ${theme.btn}`}>{isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : "Confirm & Release Grade"}</button>
                </div>
            )}

            {/* 4. ACTIVITY */}
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
                    <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Description</label><textarea placeholder="Details..." className="w-full p-3 border rounded-xl h-24" value={actDesc} onChange={e => setActDesc(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Hours</label><input type="number" className="w-full p-3 border rounded-xl" value={actHours} onChange={e => setActHours(e.target.value)} /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500">Category</label><select className="w-full p-3 border rounded-xl" value={actCategory} onChange={e => setActCategory(e.target.value)}><option value="Tech">Tech</option><option value="Staff">Staff</option><option value="Social">Social</option></select></div>
                    </div>
                    <div className="w-full space-y-1"><label className="text-xs text-gray-500 font-bold block">Activity Year</label><select className="w-full p-3 border rounded-xl" value={actYear} onChange={e => setActYear(Number(e.target.value))} disabled={!targetStudent}>{Array.from({ length: 4 }, (_, i) => i + 1).map(y => (<option key={y} value={y}>Year {y}</option>))}</select></div>
                    <button onClick={handleAddActivity} disabled={isSubmitting} className={`w-full text-white font-bold py-3 rounded-xl shadow-lg ${theme.btn}`}>{isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : "Save Activity Record"}</button>
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
                        <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden border border-white/50"><img src={viewingUser.avatar} className="w-full h-full object-cover"/></div>
                        <div><h3 className="font-bold leading-tight">{viewingUser.first_name}</h3><p className="text-xs opacity-90">{viewingUser.student_id}</p></div>
                    </div>
                    <button onClick={() => setViewingUser(null)} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
                </div>
                <div className="flex border-b">
                    <button onClick={() => setModalTab("profile")} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${modalTab === "profile" ? "text-orange-600 border-b-2 border-orange-600" : "text-gray-400"}`}>Profile</button>
                    <button onClick={() => setModalTab("transcript")} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${modalTab === "transcript" ? "text-orange-600 border-b-2 border-orange-600" : "text-gray-400"}`}>Transcript</button>
                    <button onClick={() => setModalTab("activity")} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${modalTab === "activity" ? "text-orange-600 border-b-2 border-orange-600" : "text-gray-400"}`}>Activity</button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {modalTab === "profile" && (
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
                                {canEditUser && <button onClick={() => setIsEditing(true)} className="flex-1 py-2.5 bg-gray-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Edit3 size={16}/> Edit</button>}
                                {isOwner && <button onClick={handleDeleteUser} className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Trash2 size={16}/> Delete</button>}
                            </div>
                        </div>
                    )}
                    {modalTab === "transcript" && (
                        <div className="space-y-4 animate-fade-in">
                            {Object.keys(studentGrades).length === 0 ? <div className="text-center text-gray-400 py-10"><Book size={48} className="mx-auto mb-2 opacity-20"/><p>No courses found.</p></div> : 
                                Object.keys(studentGrades).sort().map(termKey => (
                                    <div key={termKey} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center"><span className="font-bold text-sm text-gray-700">{termKey}</span><span className="text-xs bg-white px-2 py-1 rounded border font-bold">GPA: {calculateTermGPA(studentGrades[termKey])}</span></div>
                                        <div className="divide-y divide-gray-100">
                                            {studentGrades[termKey].map(g => (
                                                <div key={g.id} className="flex justify-between items-center p-3 hover:bg-gray-50 group">
                                                    <div><span className="font-mono text-xs font-bold text-gray-500 mr-2">{g.subject_code}</span><span className="text-sm font-bold text-gray-800">{g.subject_name}</span></div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded ${g.grade ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-600'}`}>{g.grade || "Studying"}</span>
                                                        {isOwner && <button onClick={() => handleDeleteEnrollment(g.id)} className="text-red-300 hover:text-red-500"><Trash2 size={14}/></button>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                    {modalTab === "activity" && (
                        <div className="space-y-3">
                            {studentActivities.map(act => (
                                <div key={act.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div className="flex justify-between">
                                        <p className="font-bold text-gray-800 text-sm">{act.name}</p>
                                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">+{act.hours}h</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{act.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </div>
        </div>
      )}
    </div>
  );
}