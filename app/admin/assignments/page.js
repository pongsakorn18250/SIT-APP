"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase"; 
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, BookOpen, Trash2, Calendar } from "lucide-react";

export default function AdminAssignments() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]); // รายชื่อวิชา
  const [assignments, setAssignments] = useState([]); // การบ้านที่มีอยู่
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [form, setForm] = useState({
    class_id: "",
    title: "",
    description: "",
    due_date: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/register"); return; }

    // 1. ดึงวิชาทั้งหมดมาใส่ Dropdown
    const { data: classData } = await supabase.from("classes").select("id, subject_code, subject_name").order("subject_code");
    setClasses(classData || []);

    // 2. ดึงการบ้านเดิม
    fetchAssignments();
    setLoading(false);
  };

  const fetchAssignments = async () => {
      const { data } = await supabase.from("assignments").select("*, classes(subject_code)").order("due_date", { ascending: true });
      setAssignments(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.class_id || !form.title || !form.due_date) return alert("Please fill all required fields");

    setIsSubmitting(true);
    const { error } = await supabase.from("assignments").insert({
        class_id: form.class_id,
        title: form.title,
        description: form.description,
        due_date: new Date(form.due_date).toISOString()
    });

    if (!error) {
        alert("Assignment Posted! 📚");
        setForm({ ...form, title: "", description: "" }); // Clear form
        fetchAssignments();
    } else {
        alert(error.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
      if(!confirm("Delete assignment?")) return;
      await supabase.from("assignments").delete().eq("id", id);
      fetchAssignments();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center pb-20">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BookOpen className="text-blue-500"/> Manage Assignments
                </h1>
                <p className="text-gray-500 text-sm">Post homework linked to subjects.</p>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            
            {/* Left: Create Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Calendar size={18}/> New Task</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* เลือกวิชา */}
                    <div>
                        <label className="text-xs font-bold text-gray-400">Select Class (Subject)</label>
                        <select 
                            className="w-full p-3 border rounded-xl bg-gray-50 font-bold text-gray-700"
                            value={form.class_id}
                            onChange={e => setForm({...form, class_id: e.target.value})}
                        >
                            <option value="">-- Choose Subject --</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.subject_code} - {c.subject_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400">Assignment Title</label>
                        <input 
                            className="w-full p-3 border rounded-xl" 
                            placeholder="e.g. Lab 1: UI Design" 
                            value={form.title}
                            onChange={e => setForm({...form, title: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400">Description</label>
                        <textarea 
                            className="w-full p-3 border rounded-xl h-24" 
                            placeholder="Details..." 
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400">Due Date</label>
                        <input 
                            type="datetime-local"
                            className="w-full p-3 border rounded-xl" 
                            value={form.due_date}
                            onChange={e => setForm({...form, due_date: e.target.value})}
                        />
                    </div>

                    <button disabled={isSubmitting} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin"/> : <><Save size={18}/> Post Assignment</>}
                    </button>
                </form>
            </div>

            {/* Right: List */}
            <div className="space-y-3">
                <h2 className="font-bold text-gray-700">All Assignments</h2>
                {assignments.length === 0 ? <p className="text-gray-400 text-sm">No assignments posted.</p> : 
                    assignments.map(ass => (
                        <div key={ass.id} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                            <div>
                                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded">{ass.classes?.subject_code}</span>
                                <h4 className="font-bold text-gray-800 mt-1">{ass.title}</h4>
                                <p className="text-xs text-red-500">Due: {new Date(ass.due_date).toLocaleString()}</p>
                            </div>
                            <button onClick={() => handleDelete(ass.id)} className="text-red-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                        </div>
                    ))
                }
            </div>

        </div>
      </div>
    </div>
  );
}