"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase"; 
import { useRouter } from "next/navigation";
import { 
  Calendar, Clock, MapPin, CheckCircle, AlertCircle, ArrowLeft, BookOpen, Loader2 
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // 1. ดึง Profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setUserProfile(profile);

      // 2. ดึงวิชาที่ลงทะเบียนแล้ว
      const { data: enrolled } = await supabase.from("enrollments").select("class_id").eq("user_id", user.id);
      const enrolledIds = enrolled?.map(e => e.class_id) || [];
      setMyEnrollments(enrolledIds);

      // 3. ดึงตารางเรียนทั้งหมด
      const { data: classes, error } = await supabase
        .from("classes")
        .select(`
          *,
          subjects ( name, credit ) 
        `)
        .order('subject_code', { ascending: true });

      if (error) console.error("Error fetching classes:", error);
      
      // 4. กรองวิชาตาม Major
      const filtered = (classes || []).filter(c => {
        if (!profile) return true;
        const code = c.subject_code.toUpperCase();
        
        // วิชาสามัญเรียนได้ทุกคน
        if (code.startsWith("GEN") || code.startsWith("LNG")) return true;

        // วิชาภาค (กรองตาม Major)
        if (profile.major === "DSI" && code.startsWith("DSI")) return true;
        if (profile.major === "CS" && (code.startsWith("CSC") || code.startsWith("CS"))) return true;
        if (profile.major === "IT" && (code.startsWith("INT") || code.startsWith("IT"))) return true;

        return false;
      });

      setAvailableClasses(filtered);
      setLoading(false);
    };

    initData();
  }, []);

  const handleEnroll = async (classId, subjectName) => {
    if (!confirm(`Confirm registration for ${subjectName}?`)) return;
    setSubmitting(classId);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("enrollments").insert({
      user_id: user.id,
      class_id: classId,
      status: 'enrolled'
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      setMyEnrollments([...myEnrollments, classId]);
      
      // ส่ง Noti แจ้งเตือน
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Registration Confirmed",
        message: `ลงทะเบียนวิชา ${subjectName} เรียบร้อยแล้ว`,
        type: "info"
      });
    }
    setSubmitting(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 gap-2">
      <Loader2 className="animate-spin"/> Loading Schedule...
    </div>
  );

  return (
    // ✅ 1. เพิ่ม pt-24 เพื่อไม่ให้เนื้อหาโดน Header บังใน Mobile
    <div className="min-h-screen bg-gray-50 pb-20 pt-24 md:pt-6">
      
      {/* Header */}
      {/* ✅ 2. สร้างแถบสีขาวเต็มจอ (sticky) แต่เนื้อหาข้างในจัดกึ่งกลาง (max-w-5xl) */}
      <div className="bg-white sticky top-0 z-10 shadow-sm border-b left-0 right-0">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={20} className="text-gray-600"/>
            </button>
            <div>
                <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-600"/> Course Registration
                </h1>
                {userProfile && (
                    <p className="text-xs text-gray-500 font-medium">
                    Student: <span className="text-blue-600">{userProfile.first_name}</span> | Major: <span className="bg-blue-100 text-blue-700 px-1.5 rounded">{userProfile.major}</span>
                    </p>
                )}
            </div>
        </div>
      </div>

      {/* Course List */}
      {/* ✅ 3. ใช้ max-w-5xl เพื่อให้ความกว้างเท่ากับ Header และหน้า Schedule */}
      <div className="max-w-5xl mx-auto p-4 space-y-4 animate-fade-in">
        {availableClasses.length === 0 ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center">
            <AlertCircle className="mb-2 opacity-20" size={48}/>
            <p>No classes open for your major yet.</p>
          </div>
        ) : (
          availableClasses.map((cls) => {
            const isEnrolled = myEnrollments.includes(cls.id);
            const subjectName = cls.subjects?.name || "Unknown Subject"; 
            const credit = cls.subjects?.credit || 3;

            return (
              <div key={cls.id} className={`bg-white rounded-xl border p-5 shadow-sm transition-all duration-200 ${isEnrolled ? 'border-green-200 bg-green-50/20' : 'hover:shadow-md hover:border-blue-200'}`}>
                
                {/* Subject Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isEnrolled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {cls.subject_code}
                    </span>
                    <h3 className="text-base font-bold text-gray-800 mt-1 leading-tight">{subjectName}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-400 block">{credit} Credits</span>
                  </div>
                </div>

                {/* Class Details */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-gray-600 mb-5 bg-gray-50 p-3 rounded-lg">
                   <div className="flex items-center gap-2"><Calendar size={14} className="text-blue-500"/> <span className="font-medium">{cls.day_of_week}</span></div>
                   <div className="flex items-center gap-2"><Clock size={14} className="text-orange-500"/> {cls.start_time?.slice(0,5)} - {cls.end_time?.slice(0,5)}</div>
                   <div className="flex items-center gap-2"><MapPin size={14} className="text-red-500"/> {cls.room}</div>
                   <div className="flex items-center gap-2 text-gray-500">👨‍🏫 {cls.lecturer}</div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => !isEnrolled && handleEnroll(cls.id, subjectName)}
                  disabled={isEnrolled || submitting === cls.id}
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm
                    ${isEnrolled 
                      ? 'bg-green-100 text-green-700 cursor-default border border-green-200' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 active:scale-95'}
                  `}
                >
                  {submitting === cls.id ? (
                    <><Loader2 size={16} className="animate-spin"/> Processing...</>
                  ) : isEnrolled ? (
                    <><CheckCircle size={16}/> Enrolled</>
                  ) : (
                    "Enroll Class"
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}