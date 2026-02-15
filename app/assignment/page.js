"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Clock, FileText, Loader2, AlertCircle } from "lucide-react";

export default function StudentAssignments() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("todo"); // 'todo' | 'completed'
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/register"); return; }

    // 1. ดึงวิชาที่ลงทะเบียน
    const { data: enrolls } = await supabase.from("enrollments").select("class_id").eq("user_id", user.id);
    const classIds = enrolls.map(e => e.class_id);

    if (classIds.length > 0) {
        // 2. ดึงการบ้านทั้งหมดของวิชาเหล่านั้น
        const { data: allAss } = await supabase
            .from("assignments")
            .select("*, classes(subject_code, subject_name)")
            .in("class_id", classIds)
            .order("due_date", { ascending: true });

        // 3. ดึงการส่งงานของนักเรียนคนนี้
        const { data: mySubs } = await supabase
            .from("submissions")
            .select("*")
            .eq("student_id", user.id);
        
        setAssignments(allAss || []);
        setSubmissions(mySubs || []);
    }
    setLoading(false);
  };

  // กรองงาน
  const submittedIds = submissions.map(s => s.assignment_id);
  const todoList = assignments.filter(a => !submittedIds.includes(a.id));
  const completedList = assignments.filter(a => submittedIds.includes(a.id));

  // Helper หา Submission ของงานนั้นๆ
  const getSubmission = (assId) => submissions.find(s => s.assignment_id === assId);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100">
                <ArrowLeft size={20}/>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">My Assignments</h1>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-white rounded-xl shadow-sm border">
            <button 
                onClick={() => setTab("todo")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'todo' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
                To Do ({todoList.length})
            </button>
            <button 
                onClick={() => setTab("completed")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'completed' ? 'bg-green-50 text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Completed ({completedList.length})
            </button>
        </div>

        {/* List */}
        <div className="space-y-3">
            {tab === 'todo' ? (
                todoList.length > 0 ? todoList.map(ass => (
                    <div key={ass.id} onClick={() => router.push(`/assignment/${ass.id}`)} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-[10px] font-bold tracking-wider">{ass.classes?.subject_code}</span>
                            <span className={`text-xs font-bold ${new Date() > new Date(ass.due_date) ? 'text-red-500' : 'text-gray-400'}`}>
                                {new Date() > new Date(ass.due_date) ? 'Overdue' : 'Due ' + new Date(ass.due_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                            </span>
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">{ass.title}</h3>
                        <p className="text-xs text-gray-400 line-clamp-1">{ass.classes?.subject_name}</p>
                    </div>
                )) : <EmptyState text="No pending tasks! 🎉"/>
            ) : (
                completedList.length > 0 ? completedList.map(ass => {
                    const sub = getSubmission(ass.id);
                    return (
                        <div key={ass.id} onClick={() => router.push(`/assignment/${ass.id}`)} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer opacity-75 hover:opacity-100">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-green-50 text-green-600 px-2 py-1 rounded text-[10px] font-bold tracking-wider flex items-center gap-1">
                                    <CheckCircle size={10}/> SENT
                                </span>
                                <span className="text-xs font-bold text-gray-400">
                                    {new Date(sub.submitted_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-1">{ass.title}</h3>
                            <div className="flex justify-between items-end mt-3">
                                <p className="text-xs text-gray-400">{ass.classes?.subject_code}</p>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Score</span>
                                    <p className={`text-lg font-extrabold ${sub.score ? 'text-blue-600' : 'text-gray-300'}`}>
                                        {sub.score ? `${sub.score}/${ass.max_score}` : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                }) : <EmptyState text="No completed tasks yet."/>
            )}
        </div>

      </div>
    </div>
  );
}

function EmptyState({text}) {
    return (
        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                <FileText size={24}/>
            </div>
            <p className="text-gray-400 text-sm font-bold">{text}</p>
        </div>
    )
}