"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, useParams } from "next/navigation"; // ใช้ useParams เพื่อดึง id การบ้าน
import { ArrowLeft, Clock, Upload, Link as LinkIcon, FileText, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function AssignmentDetail() {
  const router = useRouter();
  const { id } = useParams(); // ดึง ID การบ้านจาก URL
  
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [user, setUser] = useState(null);

  // Form State
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if(id) fetchData();
  }, [id]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/register"); return; }
    setUser(user);

    // 1. ดึงรายละเอียดการบ้าน
    const { data: assData, error } = await supabase
      .from("assignments")
      .select("*, classes(subject_code, subject_name)")
      .eq("id", id)
      .single();
    
    if (error) {
        alert("Assignment not found!");
        router.push("/");
        return;
    }
    setAssignment(assData);

    // 2. เช็คว่าเคยส่งงานไปรึยัง
    const { data: subData } = await supabase
      .from("submissions")
      .select("*")
      .eq("assignment_id", id)
      .eq("student_id", user.id)
      .single();
    
    if (subData) setSubmission(subData);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!file && !linkUrl) return alert("Please attach a file or link.");
    setIsSubmitting(true);

    let uploadedFileUrl = "";

    // 1. Upload File (ถ้ามี)
    if (file) {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from("assignments") // ชื่อ Bucket ที่สร้างใน Step 2
            .upload(fileName, file);
        
        if (error) {
            alert("Upload failed: " + error.message);
            setIsSubmitting(false);
            return;
        }
        // สร้าง Public URL
        const { data: publicUrlData } = supabase.storage.from("assignments").getPublicUrl(fileName);
        uploadedFileUrl = publicUrlData.publicUrl;
    }

    // 2. เช็คสถานะส่งช้า (Late Check)
    const isLate = new Date() > new Date(assignment.due_date);
    const status = isLate ? "late" : "submitted";

    // 3. บันทึกลง Database
    const { error: subError } = await supabase.from("submissions").insert({
        assignment_id: id,
        student_id: user.id,
        file_url: uploadedFileUrl,
        link_url: linkUrl,
        status: status,
        submitted_at: new Date().toISOString()
    });

    if (!subError) {
        alert(isLate ? "Submitted Late! 😅" : "Turned in successfully! 🎉");
        fetchData(); // โหลดหน้าใหม่เพื่อโชว์สถานะ
    } else {
        alert(subError.message);
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  const isLate = new Date() > new Date(assignment.due_date);

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center pb-20">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Header */}
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-800 transition-colors">
            <ArrowLeft size={20}/> Back to Home
        </button>

        {/* Assignment Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-2 h-full ${isLate ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold tracking-wider uppercase">
                        {assignment.classes?.subject_code}
                    </span>
                    <h1 className="text-3xl font-extrabold text-gray-900 mt-3 mb-1">{assignment.title}</h1>
                    <p className="text-gray-500 text-sm font-bold">{assignment.classes?.subject_name}</p>
                </div>
                {/* Due Date Badge */}
                <div className={`flex flex-col items-end ${isLate ? 'text-red-500' : 'text-gray-400'}`}>
                    <div className="flex items-center gap-1 font-bold text-sm">
                        <Clock size={16}/> {isLate ? "Overdue" : "Due"}
                    </div>
                    <p className="text-xs">{new Date(assignment.due_date).toLocaleString()}</p>
                </div>
            </div>

            <hr className="border-gray-100 my-6"/>

            <div className="prose prose-sm text-gray-600 mb-8">
                <h3 className="text-gray-800 font-bold mb-2">Instructions</h3>
                <p className="whitespace-pre-wrap">{assignment.description || "No instructions provided."}</p>
            </div>

            {/* --- SUBMISSION SECTION --- */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText size={20}/> Your Work
                </h3>

                {submission ? (
                    // ✅ กรณีส่งงานแล้ว
                    <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <CheckCircle size={32}/>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-gray-800">
                                {submission.status === 'late' ? 'Turned in late' : 'Turned in'}
                            </h4>
                            <p className="text-sm text-gray-400">
                                Submitted on {new Date(submission.submitted_at).toLocaleString()}
                            </p>
                        </div>
                        
                        {/* Score Display */}
                        <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 inline-block min-w-[200px]">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Score</p>
                            <p className="text-3xl font-extrabold text-blue-600">
                                {submission.score || "-/10"}
                            </p>
                            {submission.feedback && (
                                <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">"{submission.feedback}"</p>
                            )}
                        </div>
                    </div>
                ) : (
                    // 📝 กรณีเปลี่ยนส่งงาน (Form)
                    <div className="space-y-4">
                        {/* Link Input */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-1 block">Attach Link (Optional)</label>
                            <div className="flex items-center gap-2 bg-white p-3 border rounded-xl">
                                <LinkIcon size={18} className="text-gray-400"/>
                                <input 
                                    className="flex-1 outline-none text-sm font-bold text-gray-700 placeholder-gray-300"
                                    placeholder="https://github.com/..."
                                    value={linkUrl}
                                    onChange={e => setLinkUrl(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* File Input */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-1 block">Upload File (Optional)</label>
                            <div className="relative">
                                <input 
                                    type="file" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={e => setFile(e.target.files[0])}
                                />
                                <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                                    <Upload size={24} className="mb-2"/>
                                    <span className="text-xs font-bold">{file ? file.name : "Click to upload file"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            onClick={handleUpload} 
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                                ${isLate ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}
                            `}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin"/> : (isLate ? "Mark as Done (Late)" : "Turn In")}
                        </button>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}