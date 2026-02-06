"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { Trash2, ShieldAlert, UserX } from "lucide-react"; // เพิ่มไอคอนใหม่

// อีเมล Admin
const ADMIN_EMAIL = "Admin1@gmail.com"; 

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  
  // เพิ่ม Tab 'delete' เข้ามา
  const [activeTab, setActiveTab] = useState("grade"); 

  // Form State
  const [gradeForm, setGradeForm] = useState({ 
    subject_code: "", subject_name: "", credit: 3, grade: "A", 
    study_year: 1, study_term: 1 
  });
  const [activityForm, setActivityForm] = useState({ name: "", category: "Tech", hours: 3, description: "" });

  // ฟังก์ชันดึงรายชื่อ (ใช้บ่อย เลยแยกออกมา)
  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, first_name, major, student_id, email");
    setUsers(data || []);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        alert("⛔ Access Denied!");
        router.push("/"); 
      } else {
        setAuthorized(true);
        fetchUsers();
      }
    };
    checkAdmin();
  }, [router]);

  // --- DELETE FUNCTION ---
  const handleDeleteUser = async (userId, userName) => {
    // กันพลาด: ถามย้ำก่อนลบ
    if (!confirm(`⚠️ WARNING: Are you sure you want to delete "${userName}"?\nThis action CANNOT be undone!`)) return;

    setLoading(true);
    
    // เรียกใช้ Function ลับที่เราเพิ่งสร้างใน SQL
    const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });

    if (error) {
        alert("Error deleting user: " + error.message);
    } else {
        alert(`✅ User "${userName}" has been deleted.`);
        fetchUsers(); // โหลดรายชื่อใหม่
        setSelectedUser(""); // เคลียร์ช่องเลือก
    }
    setLoading(false);
  };

  // --- ADD FUNCTIONS ---
  const handleAddGrade = async (e) => {
    e.preventDefault();
    if (!selectedUser) return alert("Select User first!");
    setLoading(true);
    const { error } = await supabase.from("grades").insert([{ user_id: selectedUser, ...gradeForm }]);
    if (error) alert(error.message); else alert("✅ Grade Added!");
    setLoading(false);
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!selectedUser) return alert("Select User first!");
    setLoading(true);
    const { error } = await supabase.from("activities").insert([{ user_id: selectedUser, ...activityForm }]);
    if (error) alert(error.message); else alert("✅ Activity Added!");
    setLoading(false);
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-6 pb-24">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="bg-gray-800 p-6 text-white flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert /> Admin Tool</h1>
          <button onClick={() => router.push("/")} className="text-xs bg-gray-700 px-3 py-1 rounded">Back Home</button>
        </div>

        <div className="p-6">
          
          {/* TABS MENU */}
          <div className="flex border-b mb-6">
            <button onClick={() => setActiveTab("grade")} className={`flex-1 py-3 font-bold text-sm ${activeTab === "grade" ? "text-sit-primary border-b-2 border-sit-primary" : "text-gray-400"}`}>📚 Grade</button>
            <button onClick={() => setActiveTab("activity")} className={`flex-1 py-3 font-bold text-sm ${activeTab === "activity" ? "text-sit-primary border-b-2 border-sit-primary" : "text-gray-400"}`}>🏆 Activity</button>
            {/* ปุ่มเมนู Delete สีแดง */}
            <button onClick={() => setActiveTab("delete")} className={`flex-1 py-3 font-bold text-sm ${activeTab === "delete" ? "text-red-500 border-b-2 border-red-500" : "text-gray-400"}`}>💀 Delete User</button>
          </div>

          {/* === 1. GRADE FORM === */}
          {activeTab === "grade" && (
            <>
              <label className="block text-sm font-bold text-gray-700 mb-2">Select Student</label>
              <select className="w-full p-3 bg-gray-50 border rounded-xl mb-6 text-sm" onChange={(e) => setSelectedUser(e.target.value)} value={selectedUser}>
                <option value="">-- Choose --</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.first_name} ({u.major}) #{u.student_id?.slice(-3)}</option>)}
              </select>

              <form onSubmit={handleAddGrade} className="space-y-4">
                <input placeholder="Code (e.g. DSI101)" className="w-full p-3 border rounded-lg" required onChange={e => setGradeForm({...gradeForm, subject_code: e.target.value})} />
                <input placeholder="Name (e.g. Intro to DSI)" className="w-full p-3 border rounded-lg" required onChange={e => setGradeForm({...gradeForm, subject_name: e.target.value})} />
                <div className="flex gap-2">
                  <select className="w-1/2 p-3 border rounded-lg" onChange={e => setGradeForm({...gradeForm, study_year: e.target.value})}><option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option></select>
                  <select className="w-1/2 p-3 border rounded-lg" onChange={e => setGradeForm({...gradeForm, study_term: e.target.value})}><option value="1">Term 1</option><option value="2">Term 2</option></select>
                </div>
                <div className="flex gap-2">
                  <input type="number" placeholder="Credit" className="w-1/2 p-3 border rounded-lg" defaultValue={3} onChange={e => setGradeForm({...gradeForm, credit: e.target.value})} />
                  <select className="w-1/2 p-3 border rounded-lg" onChange={e => setGradeForm({...gradeForm, grade: e.target.value})}><option value="A">A</option><option value="B+">B+</option><option value="B">B</option><option value="C+">C+</option><option value="C">C</option><option value="D">D</option><option value="F">F</option></select>
                </div>
                <button disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">Save Grade</button>
              </form>
            </>
          )}

          {/* === 2. ACTIVITY FORM === */}
          {activeTab === "activity" && (
            <>
               <label className="block text-sm font-bold text-gray-700 mb-2">Select Student</label>
               <select className="w-full p-3 bg-gray-50 border rounded-xl mb-6 text-sm" onChange={(e) => setSelectedUser(e.target.value)} value={selectedUser}>
                 <option value="">-- Choose --</option>
                 {users.map((u) => <option key={u.id} value={u.id}>{u.first_name} ({u.major}) #{u.student_id?.slice(-3)}</option>)}
               </select>

               <form onSubmit={handleAddActivity} className="space-y-4">
                 <input placeholder="Activity Name" className="w-full p-3 border rounded-lg" required onChange={e => setActivityForm({...activityForm, name: e.target.value})} />
                 <div className="flex gap-4">
                   <select className="w-1/2 p-3 border rounded-lg" onChange={e => setActivityForm({...activityForm, category: e.target.value})}><option value="Tech">Tech</option><option value="Staff">Staff</option><option value="Social">Social</option></select>
                   <input type="number" placeholder="Hours" className="w-1/2 p-3 border rounded-lg" defaultValue={3} onChange={e => setActivityForm({...activityForm, hours: e.target.value})} />
                 </div>
                 <textarea placeholder="Description..." className="w-full p-3 border rounded-lg h-24" onChange={e => setActivityForm({...activityForm, description: e.target.value})}></textarea>
                 <button disabled={loading} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700">Save Activity</button>
               </form>
            </>
          )}

          {/* === 3. DELETE USER LIST (ส่วนใหม่!) === */}
          {activeTab === "delete" && (
            <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4 text-red-700 text-sm flex gap-3 items-center">
                    <UserX size={24} />
                    <div>
                        <p className="font-bold">Danger Zone</p>
                        <p className="text-xs">Deleting a user will permanently remove their profile, grades, and login data.</p>
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {users.map((u) => (
                        <div key={u.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-colors group">
                            <div>
                                <p className="font-bold text-gray-800">{u.first_name} <span className="text-xs text-gray-400 font-mono">({u.email})</span></p>
                                <p className="text-xs text-gray-500">{u.major} #{u.student_id}</p>
                            </div>
                            {/* ปุ่มลบ */}
                            <button 
                                onClick={() => handleDeleteUser(u.id, u.first_name)}
                                disabled={u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()} // ห้ามลบตัวเอง!
                                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-600 hover:border-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}