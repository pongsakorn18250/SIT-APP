"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { 
  BookOpen, Clock, MapPin, User as UserIcon, 
  CheckCircle, AlertCircle, Loader2, Filter 
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  
  // --- STATES ---
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [enrolledClassIds, setEnrolledClassIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  // --- FETCH DATA ---
  useEffect(() => {
    const initData = async () => {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/register"); return; }
      setUser(user);

      // 2. Get Profile (Major & Year)
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(profile);

      // 3. Get Enrolled Classes (เช็คว่าลงอะไรไปแล้วบ้าง)
      const { data: enrolls } = await supabase.from("enrollments").select("class_id").eq("user_id", user.id);
      const enrolledIds = enrolls ? enrolls.map(e => e.class_id) : [];
      setEnrolledClassIds(enrolledIds);

      // 4. Get Open Classes (ดึงตรงจาก classes ไม่ต้อง Join subjects แล้ว)
      // เรียงตามรหัสวิชา
      const { data: classList, error } = await supabase
        .from("classes")
        .select("*") 
        .order('subject_code', { ascending: true });

      if (error) {
        console.error("Error fetching classes:", error);
      } else {
        // 5. Filter Logic (กรองตาม Major)
        const myMajor = profile?.major || "";
        
        const filtered = classList.filter(cls => {
            const code = cls.subject_code?.toUpperCase() || "";
            const prefix = code.substring(0, 3);

            // กฎการมองเห็น (Visibility Rules)
            const isGeneral = ["GEN", "LNG", "SSC"].includes(prefix); // วิชาเสรี/พื้นฐาน
            const isIT = prefix === "INT" && myMajor === "IT";
            const isCS = prefix === "CSC" && myMajor === "CS";
            const isDSI = prefix === "DSI" && myMajor === "DSI";

            return isGeneral || isIT || isCS || isDSI;
        });

        setClasses(filtered);
      }
      
      setLoading(false);
    };

    initData();
  }, [router]);

  // --- ENROLL ACTION ---
  const handleEnroll = async (classItem) => {
    // เช็คเงื่อนไขชั้นปี (Client-side Check)
    const myYear = Number(profile?.year || 1);
    const targetYear = Number(classItem.target_year || 0);

    if (targetYear !== 0 && targetYear !== myYear) {
       return alert(`วิชานี้เปิดสำหรับนักศึกษาชั้นปีที่ ${targetYear} เท่านั้น`);
    }

    if (!confirm(`Confirm enrollment for ${classItem.subject_code}?`)) return;

    setSubmittingId(classItem.id);

    // Insert ลง Enrollments
    const { error } = await supabase.from("enrollments").insert({
      user_id: user.id,
      class_id: classItem.id,
      status: "enrolled",
      grade: null // เกรดเริ่มต้นเป็น null
    });

    if (error) {
      alert("Failed to enroll: " + error.message);
    } else {
      alert("Enrollment Successful! 🎉");
      setEnrolledClassIds([...enrolledClassIds, classItem.id]); // Update state ทันที
      
      // Auto Notification
      await supabase.from("notifications").insert({
          user_id: user.id,
          title: "Registration Confirmed",
          message: `ลงทะเบียนวิชา ${classItem.subject_name} เรียบร้อยแล้ว`,
          type: "info"
      });
    }
    setSubmittingId(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading Classes...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
              <BookOpen className="text-blue-600"/>
              <div>
                  <h1 className="text-xl font-bold text-gray-800">Course Registration</h1>
                  <p className="text-xs text-gray-500">Student: <span className="font-bold text-blue-600">{profile?.first_name}</span> | Major: <span className="font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px]">{profile?.major}</span></p>
              </div>
          </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Filter size={48} className="mb-4 opacity-20"/>
                <p>No classes open for your major yet.</p>
            </div>
        ) : (
            <div className="grid gap-6">
                {classes.map((cls) => {
                    const isEnrolled = enrolledClassIds.includes(cls.id);
                    const myYear = Number(profile?.year || 1);
                    const targetYear = Number(cls.target_year || 0);
                    // เงื่อนไข: ลงทะเบียนไม่ได้ถ้าปีไม่ตรง (แต่ยังมองเห็น)
                    const isLocked = targetYear !== 0 && targetYear !== myYear; 

                    return (
                        <div key={cls.id} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${isEnrolled ? "border-green-200 ring-1 ring-green-100" : isLocked ? "border-gray-200 opacity-60 grayscale-[0.5]" : "border-gray-100 hover:shadow-md"}`}>
                            
                            {/* Header Card */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${isEnrolled ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-600"}`}>
                                            {cls.subject_code}
                                        </span>
                                        {targetYear > 0 && (
                                            <span className="text-[10px] font-bold border border-orange-200 text-orange-500 px-2 py-0.5 rounded-full bg-orange-50">
                                                Year {targetYear} Only
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">{cls.subject_name}</h3>
                                </div>
                                <span className="text-sm font-bold text-gray-400">{cls.credit || 3} Credits</span>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-6 bg-gray-50 p-4 rounded-xl">
                                <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-500"><Clock size={16}/></div> <div><p className="text-[10px] text-gray-400 font-bold uppercase">Time</p><p className="font-bold">{cls.day_of_week} {cls.start_time?.slice(0,5)}-{cls.end_time?.slice(0,5)}</p></div></div>
                                <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-red-500"><MapPin size={16}/></div> <div><p className="text-[10px] text-gray-400 font-bold uppercase">Room</p><p className="font-bold">{cls.room || "TBA"}</p></div></div>
                                <div className="flex items-center gap-2 md:col-span-2"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-purple-500"><UserIcon size={16}/></div> <div><p className="text-[10px] text-gray-400 font-bold uppercase">Teacher</p><p className="font-bold">{cls.teacher || "Staff"}</p></div></div>
                            </div>

                            {/* Button Action */}
                            {isEnrolled ? (
                                <button disabled className="w-full py-3 rounded-xl bg-green-100 text-green-700 font-bold flex items-center justify-center gap-2 cursor-default">
                                    <CheckCircle size={20}/> Enrolled
                                </button>
                            ) : isLocked ? (
                                <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                                    <AlertCircle size={20}/> Locked (Year {targetYear} Only)
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleEnroll(cls)} 
                                    disabled={submittingId === cls.id}
                                    className="w-full py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
                                >
                                    {submittingId === cls.id ? <Loader2 className="animate-spin mx-auto"/> : "Enroll Class"}
                                </button>
                            )}

                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
}