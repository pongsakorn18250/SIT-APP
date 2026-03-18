"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { Code, Cpu, Globe, ChevronLeft } from "lucide-react"; // เพิ่ม ChevronLeft // ใช้ไอคอนสื่อความหมาย
import toast from "react-hot-toast";
export default function SelectMajor() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // 1. เช็คว่า Login อยู่จริงไหม
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/register"); // ถ้าหลุด ให้กลับไปเริ่มใหม่
      setUser(user);
    };
    getUser();
  }, [router]);

  // 2. ฟังก์ชันบันทึกสาขา
  const handleSelectMajor = async (majorId) => {
    if (!user) return;
    setLoading(true);

    // อัปเดตตาราง profiles
    const { error } = await supabase
      .from("profiles")
      .update({ major: majorId }) // บันทึกค่า IT, CS, หรือ DSI
      .eq("id", user.id);

    if (error) {
      toast.error("Error: " + error.message);
      setLoading(false);
    } else {
      // 🎉 เสร็จสิ้นกระบวนการ! ไปหน้าแรกกันเลย
      router.push("/");
      router.refresh(); // รีเฟรชเพื่อให้ Navbar เห็นข้อมูลใหม่
    }
  };

  // ข้อมูลสาขา (ถ้ามี DSI หรือสาขาอื่นแก้ตรงนี้ได้เลย)
  const majors = [
    { 
      id: "IT", 
      name: "Information Technology", 
      icon: Globe, 
      color: "bg-blue-500", 
      desc: "Network, System, Dev" 
    },
    { 
      id: "CS", 
      name: "Computer Science", 
      icon: Code, 
      color: "bg-indigo-600", 
      desc: "Algo, AI, Data" 
    },
    { 
      id: "DSI", 
      name: "Digital Service Innovation", 
      icon: Cpu, 
      color: "bg-cyan-500", 
      desc: "Business, UX/UI, Tech" 
    },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <button 
        onClick={() => router.push("/select-character")} // ถอยกลับไปหน้าเลือกตัวละคร
        className="md:hidden absolute top-6 left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-sit-primary z-10"
      >
        <ChevronLeft size={24} />
      </button>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-sit-primary mb-2">Select Your Major</h1>
        <p className="text-gray-500">Which path are you taking?</p>
      </div>

      {/* Grid การ์ดสาขา */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {majors.map((major) => (
          <button
            key={major.id}
            disabled={loading}
            onClick={() => handleSelectMajor(major.id)}
            className="group relative flex flex-col items-center p-8 rounded-3xl bg-white border-4 border-transparent hover:border-sit-secondary shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Icon Circle */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-md ${major.color} text-white group-hover:scale-110 transition-transform`}>
              <major.icon size={36} />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{major.id}</h2>
            <p className="text-sm text-gray-400 mb-4">{major.name}</p>
            
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full group-hover:bg-sit-primary group-hover:text-white transition-colors">
              {major.desc}
            </span>

            {/* Loading Spinner (เฉพาะปุ่มที่กด) */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                <div className="w-8 h-8 border-4 border-sit-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
        ))}
      </div>
      
    </div>
  );
}