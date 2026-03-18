"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import PageSkeleton from "../../../components/PageSkeleton";
import { ArrowLeft, FileText, Download, Loader2, Folder, ChevronRight, BookOpen, User } from "lucide-react";

export default function AdminGrading() {
  const router = useRouter();
  
  // --- States ---
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0); // 0 = เลือกวิชา, 1 = เลือกงาน, 2 = ตรวจงาน
  
  const [assignments, setAssignments] = useState([]); // ข้อมูลดิบทั้งหมด
  const [selectedClass, setSelectedClass] = useState(null); // วิชานี้ที่เลือก
  const [selectedAssignment, setSelectedAssignment] = useState(null); // งานที่เลือก
  const [submissions, setSubmissions] = useState([]); // คนส่งงาน

  useEffect(() => {
    fetchAssignments();
  }, []);

  // 1. ดึงข้อมูลการบ้านทั้งหมดมาก่อน
  const fetchAssignments = async () => {
    const { data } = await supabase
        .from("assignments")
        .select("*, classes(id, subject_code, subject_name)")
        .order("created_at", { ascending: false });
    setAssignments(data || []);
    setLoading(false);
  };

  // 2. แยกรายชื่อวิชา (ไม่ให้ซ้ำ)
  const getUniqueClasses = () => {
    const classMap = new Map();
    assignments.forEach(ass => {
        if (ass.classes) {
            classMap.set(ass.classes.id, ass.classes);
        }
    });
    return Array.from(classMap.values());
  };

  // 3. เมื่อเลือกวิชา -> ไป Step 1
  const handleSelectClass = (cls) => {
      setSelectedClass(cls);
      setStep(1);
  };

  // 4. เมื่อเลือกงาน -> ไป Step 2 (ดึงคนส่งงาน)
  const handleSelectAssignment = async (ass) => {
      setLoading(true);
      setSelectedAssignment(ass);
      
      const { data } = await supabase
          .from("submissions")
          .select("*, profiles(first_name, student_id, avatar)")
          .eq("assignment_id", ass.id)
          .order("submitted_at", { ascending: true });
      
      setSubmissions(data || []);
      setLoading(false);
      setStep(2);
  };

  // 5. บันทึกคะแนน และ ส่ง Noti 🔔 (ฉบับ Pro: แยกประเภท Update ได้)
  const handleSaveScore = async (submissionId, newScore, studentId, assignmentTitle) => {
      if (!newScore) return; 

      // ✅ A. เช็คก่อนว่า "เป็นการให้คะแนนครั้งแรก" หรือ "แก้ไข"
      // (โดยดูจาก State ปัจจุบันก่อนที่จะอัปเดต)
      const currentSub = submissions.find(s => s.id === submissionId);
      const isUpdate = currentSub?.score ? true : false; // ถ้ามีคะแนนเก่า = Update

      // B. บันทึกคะแนนลง DB
      const { error } = await supabase
          .from("submissions")
          .update({ score: newScore, status: 'graded' })
          .eq("id", submissionId);
      
      if (!error) {
          console.log("Score Saved"); 

          // ✅ C. อัปเดต State หน้าจอทันที 
          // (สำคัญ! เพื่อให้ UI จำค่าล่าสุดไว้ ถ้าอาจารย์แก้ซ้ำอีกรอบ ระบบจะได้รู้ว่าเป็น Update)
          setSubmissions(prev => prev.map(s => 
              s.id === submissionId ? { ...s, score: newScore, status: 'graded' } : s
          ));

          // ✅ D. เลือกคำที่จะใช้แจ้งเตือน
          const notiTitle = isUpdate ? "Score Updated ✏️" : "Assignment Graded 📋";
          const notiMsg = isUpdate 
              ? `Your score for "${assignmentTitle}" has been updated to ${newScore}.` // กรณีแก้ไข
              : `You received ${newScore} points for "${assignmentTitle}".`; // กรณีตรวจครั้งแรก

          // E. ส่ง Noti
          await supabase.from("notifications").insert({
              user_id: studentId, 
              type: 'grade',      
              title: notiTitle,
              message: notiMsg
          });
          
      } else {
          toast.error("Error saving score");
      }
  };
  

  // ปุ่มย้อนกลับ (Back Logic)
  const handleBack = () => {
      if (step === 2) {
          setStep(1);
          setSelectedAssignment(null);
      } else if (step === 1) {
          setStep(0);
          setSelectedClass(null);
      } else {
          router.push('/admin');
      }
  };

  if (loading && !selectedAssignment) return <PageSkeleton />;

  // กรองงานตามวิชาที่เลือก (สำหรับ Step 1)
  const filteredAssignments = assignments.filter(a => a.classes?.id === selectedClass?.id);

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20 flex justify-center">
      <div className="w-full max-w-5xl space-y-6">
        
        {/* Header with Dynamic Breadcrumb */}
        <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    Work Console 📝
                </h1>
                <p className="text-gray-500 text-sm flex items-center gap-2">
                    <span className={step === 0 ? "font-bold text-blue-600" : ""}>Subjects</span>
                    {step >= 1 && <><ChevronRight size={14}/> <span className={step === 1 ? "font-bold text-blue-600" : ""}>{selectedClass?.subject_code}</span></>}
                    {step >= 2 && <><ChevronRight size={14}/> <span className={step === 2 ? "font-bold text-blue-600" : ""}>Grading</span></>}
                </p>
            </div>
        </div>

        {/* --- STEP 0: SELECT CLASS (รายวิชา) --- */}
        {step === 0 && (
            <div className="grid md:grid-cols-3 gap-4 animate-fade-in">
                {getUniqueClasses().map(cls => (
                    <div key={cls.id} onClick={() => handleSelectClass(cls)} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Folder size={24}/>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800">{cls.subject_code}</h3>
                        <p className="text-sm text-gray-500">{cls.subject_name}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 p-2 rounded-lg w-fit">
                            <BookOpen size={14}/>
                            {assignments.filter(a => a.classes?.id === cls.id).length} Assignments
                        </div>
                    </div>
                ))}
                {getUniqueClasses().length === 0 && <p className="text-gray-400 col-span-3 text-center py-10">No assignments created yet.</p>}
            </div>
        )}

        {/* --- STEP 1: SELECT ASSIGNMENT (เลือกงาน) --- */}
        {step === 1 && (
            <div className="grid md:grid-cols-2 gap-4 animate-fade-in">
                {filteredAssignments.map(ass => (
                    <div key={ass.id} onClick={() => handleSelectAssignment(ass)} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BookOpen size={60} className="text-blue-600"/>
                        </div>
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold tracking-wider">
                                {new Date(ass.due_date).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] font-bold bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">
                                Max: {ass.max_score || 10} pts
                            </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors relative z-10">{ass.title}</h3>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1 relative z-10">{ass.description || "No description"}</p>
                    </div>
                ))}
            </div>
        )}

        {/* --- STEP 2: GRADING TABLE (ตรวจงาน) --- */}
        {step === 2 && selectedAssignment && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{selectedAssignment.title}</h2>
                        <p className="text-xs text-gray-500 font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded w-fit mt-1">
                            Full Score: {selectedAssignment.max_score || 10}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{submissions.length}</p>
                        <p className="text-xs text-gray-400 uppercase font-bold">Submissions</p>
                    </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                    {submissions.length === 0 ? <p className="p-10 text-center text-gray-400">No students have submitted yet.</p> : 
                        submissions.map(sub => (
                            <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                
                                {/* Student Info */}
                                <div className="flex items-center gap-3 w-1/3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border shrink-0">
                                        {sub.profiles?.avatar ? <img src={sub.profiles.avatar} className="w-full h-full object-cover"/> : <User className="p-2 text-gray-400"/>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">{sub.profiles?.first_name || "Unknown"}</p>
                                        <p className="text-xs text-gray-400 font-mono">{sub.profiles?.student_id}</p>
                                    </div>
                                </div>

                                {/* File & Status */}
                                <div className="flex flex-col gap-1 w-1/4">
                                    {sub.file_url && (
                                        <a href={sub.file_url} target="_blank" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                                            <FileText size={14}/> View File
                                        </a>
                                    )}
                                    {sub.link_url && (
                                        <a href={sub.link_url} target="_blank" className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline">
                                            <Download size={14}/> View Link
                                        </a>
                                    )}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit ${sub.status === 'late' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {sub.status === 'late' ? 'Late' : 'On Time'}
                                    </span>
                                </div>

                                {/* Grading Input (ส่ง Noti หาเด็ก) */}
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col items-end">
                                        <label className="text-[10px] font-bold text-gray-400 mb-1">SCORE</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                defaultValue={sub.score} 
                                                // ✅ ส่ง student_id และ ชื่อการบ้าน ไปด้วย เพื่อให้ส่ง Noti ถูกคน
                                                onBlur={(e) => handleSaveScore(sub.id, e.target.value, sub.student_id, selectedAssignment.title)}
                                                className="w-16 p-2 border rounded-lg text-center font-bold text-gray-800 focus:ring-2 ring-blue-500 outline-none bg-gray-50 focus:bg-white"
                                                placeholder="-"
                                            />
                                            <span className="text-gray-400 font-bold text-sm">/ {selectedAssignment.max_score || 10}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ))
                    }
                </div>
            </div>
        )}

      </div>
    </div>
  );
}