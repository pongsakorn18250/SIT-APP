"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import {
  MapPin, QrCode, CreditCard, Award, Zap, ChevronRight,
  BookOpen, Monitor, X, Loader2, ExternalLink, Clock
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  // --- STATES ---
  const [profile, setProfile] = useState(null);
  const [nextClass, setNextClass] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [gpax, setGpax] = useState("0.00");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // เก็บ Class IDs ไว้ใน Ref เพื่อให้ Realtime เข้าถึงค่าล่าสุดได้โดยไม่ต้องใส่ dependency
  const myClassIdsRef = useRef([]); 
  const userRef = useRef(null);

  // Modals States
  const [showCardModal, setShowCardModal] = useState(false);
  const [showGPAModal, setShowGPAModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  // --- FUNCTION: ดึงการบ้าน (แยกออกมาเพื่อให้เรียกซ้ำได้ตอน Realtime เด้ง) ---
  const fetchMyAssignments = useCallback(async () => {
      const classIds = myClassIdsRef.current;
      const user = userRef.current;
      if (classIds.length === 0 || !user) return;

      // A. ดึงการบ้านทั้งหมด
      const { data: assData } = await supabase.from("assignments")
          .select("*, classes(subject_code, subject_name)")
          .in("class_id", classIds)
          .order("due_date", { ascending: true });
      
      // B. ดึงงานที่ส่งแล้ว
      const { data: mySubs } = await supabase.from("submissions").select("assignment_id").eq("student_id", user.id);
      const submittedIds = mySubs ? mySubs.map(s => s.assignment_id) : [];

      // C. กรองเอาเฉพาะงานที่ "ยังไม่ส่ง"
      const pendingAssignments = assData ? assData.filter(a => !submittedIds.includes(a.id)) : [];
      
      setAssignments(pendingAssignments.slice(0, 5)); // เอาแค่ 5 อันแรก
  }, []);

  // --- FETCH DATA INITIAL ---
  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/register"); return; }
      userRef.current = user;

      // 1. Get Profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData);

      // 2. Get Enrollments & Class IDs
      const { data: myEnrolls } = await supabase.from("enrollments").select("class_id, grade").eq("user_id", user.id);
      const myClassIds = myEnrolls ? myEnrolls.map(e => e.class_id) : [];
      myClassIdsRef.current = myClassIds; // เก็บใส่ Ref ไว้ใช้ใน Realtime

      // 3. Fetch Stories
      const { data: annData } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("start_date", { ascending: false });
      setAnnouncements(annData || []);

      // 4. Fetch Assignments (เรียกฟังก์ชันที่แยกไว้)
      if (myClassIds.length > 0) {
        await fetchMyAssignments();
      }

      // 5. Fetch Rooms
      const { data: roomData } = await supabase.from("rooms").select("*").order("name");
      setRooms(roomData || []);

      // 6. Calculate GPAX & Next Class
      calculateGPAX(myEnrolls, myClassIds);
      if (myClassIds.length > 0) calculateNextClass(myClassIds);

      setLoading(false);
    };

    initData();
  }, [fetchMyAssignments, router]);

  // --- REALTIME LISTENER (Assignment Updates) ---
  useEffect(() => {
    // ตั้งค่า Realtime
    const channel = supabase.channel('realtime-assignments-home')
        .on(
            'postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'assignments' }, 
            (payload) => {
                // เช็คว่างานใหม่ที่เด้งมา เป็นของวิชาที่เราเรียนไหม?
                if (myClassIdsRef.current.includes(payload.new.class_id)) {
                    console.log("New Assignment Incoming! 📚 refreshing list...");
                    // ถ้าใช่ ให้ดึงข้อมูลใหม่ทันที (เพื่อจะได้ชื่อวิชามาด้วย เพราะ Realtime ส่งมาแค่ ID)
                    fetchMyAssignments();
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [fetchMyAssignments]);


  // --- Helper Functions ---
  const calculateGPAX = async (enrolls, classIds) => {
    if (!enrolls || enrolls.length === 0) return setGpax("0.00");
    const { data: classes } = await supabase.from("classes").select("id, credit").in("id", classIds);
    let totalScore = 0; let totalCredit = 0;
    const map = { "A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D+": 1.5, "D": 1, "F": 0 };
    enrolls.forEach(e => {
      if (e.grade && map[e.grade] !== undefined) {
        const cls = classes?.find(c => c.id === e.class_id);
        const credit = cls?.credit || 3;
        totalScore += map[e.grade] * credit;
        totalCredit += credit;
      }
    });
    setGpax(totalCredit > 0 ? (totalScore / totalCredit).toFixed(2) : "0.00");
  };

  const calculateNextClass = async (classIds) => {
    const { data: classes } = await supabase.from("classes").select("*").in("id", classIds);
    const dayMap = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const todaysClasses = classes?.filter(c => dayMap[c.day_of_week] === currentDay);

    let upcoming = null; let minDiff = Infinity;

    todaysClasses?.forEach(cls => {
      const [startH, startM] = cls.start_time.split(':').map(Number);
      const [endH, endM] = cls.end_time.split(':').map(Number);
      const classStart = startH * 60 + startM;
      const classEnd = endH * 60 + endM;

      if (currentTime < classEnd) {
        const diff = classStart - currentTime;
        if (diff < minDiff) {
          minDiff = diff;
          let timeText = "Now";
          if (diff > 0) {
            const h = Math.floor(diff / 60);
            const m = diff % 60;
            timeText = h > 0 ? `in ${h}hr ${m}m` : `in ${m} min`;
          }
          upcoming = { ...cls, status: timeText };
        }
      }
    });
    setNextClass(upcoming);
  };

  const getStudentIdDisplay = () => profile?.student_id || "xxxxxxxxxxx";

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-10 pt-20">

      <div className="p-6 space-y-6 max-w-lg mx-auto">

        {/* 1. STORIES */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-blue-300 flex items-center justify-center bg-blue-50 text-blue-400">
              <Zap size={24} />
            </div>
            <span className="text-[10px] font-bold text-gray-500">Updates</span>
          </div>
          {announcements.length > 0 ? announcements.map((ann) => (
            <div
              key={ann.id}
              onClick={() => setSelectedStory(ann)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <img src={ann.image_url || `https://ui-avatars.com/api/?name=${ann.title}`} className="w-full h-full rounded-full object-cover" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-600 truncate w-16 text-center">{ann.title}</span>
            </div>
          )) : (
            [1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-16 h-16 rounded-full p-0.5 bg-gray-300">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs text-gray-300">Empty</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 2. NEXT CLASS HERO CARD */}
        {nextClass ? (
          <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${nextClass.status === 'Now' ? 'bg-red-500 animate-pulse' : 'bg-blue-600'}`}>
                    {nextClass.status.startsWith('in') ? `Starts ${nextClass.status}` : 'Happening Now'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{nextClass.start_time.slice(0, 5)}</p>
                  <p className="text-xs text-gray-400">To {nextClass.end_time.slice(0, 5)}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm font-bold tracking-wider mb-1">{nextClass.subject_code}</p>
                <h2 className="text-2xl font-bold mb-4 line-clamp-1">{nextClass.subject_name}</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <MapPin size={16} className="text-blue-400" />
                    <span>{nextClass.room || "TBA"}</span>
                  </div>
                  <button className="bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-2">
                    Navigate <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-sm py-10">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 text-green-500">
              <Zap size={32} fill="currentColor" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Free Time! 🎉</h2>
            <p className="text-sm text-gray-400">No classes left for today.</p>
          </div>
        )}

        {/* 3. QUICK ACTIONS */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 px-1">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-3">
            <QuickBtn icon={CreditCard} label="ID Card" color="text-blue-600" bg="bg-blue-50" onClick={() => setShowCardModal(true)} />
            <QuickBtn icon={Award} label="GPAX" color="text-purple-600" bg="bg-purple-50" onClick={() => setShowGPAModal(true)} />
            <QuickBtn icon={Monitor} label="Lab Status" color="text-emerald-600" bg="bg-emerald-50" onClick={() => setShowLabModal(true)} />
            <QuickBtn icon={QrCode} label="Pass Key" color="text-orange-600" bg="bg-orange-50" onClick={() => setShowQRModal(true)} />
          </div>
        </div>

        {/* 4. UPCOMING ASSIGNMENTS */}
        <div>
          <div className="flex justify-between items-end mb-3 px-1">
            <h3 className="text-sm font-bold text-gray-800">Upcoming</h3>
            {/* ✅ ปุ่ม View All */}
            <button onClick={() => router.push('/assignment')} className="text-xs font-bold text-blue-600 hover:underline">
               View All / History
            </button>
          </div>

          {assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map(ass => (
                <div
                  key={ass.id}
                  onClick={() => router.push(`/assignment/${ass.id}`)}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 font-bold shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{ass.title}</h4>
                    <p className="text-xs text-gray-500">{ass.classes?.subject_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                      Due {new Date(ass.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 text-center">
              <p className="text-sm text-gray-400 mb-2">You're all caught up! 🎉</p>
              <button onClick={() => router.push('/assignment')} className="text-xs font-bold text-blue-500 hover:underline">Check History</button>
            </div>
          )}
        </div>

      </div>

      {/* MODALS */}
      {selectedStory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setSelectedStory(null)}>
          <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedStory(null)} className="absolute -top-12 right-0 text-white p-2 hover:bg-white/20 rounded-full transition-colors"><X size={28} /></button>
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
              <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                <img src={selectedStory.image_url} className="w-full h-full object-contain" />
              </div>
              <div className="p-6 bg-white shrink-0">
                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{selectedStory.title}</h3>
                <p className="text-xs text-gray-400 mb-4 font-mono">Posted on {new Date(selectedStory.start_date).toLocaleDateString()}</p>
                {selectedStory.link_url && selectedStory.link_url !== "EMPTY" && (
                  <a href={selectedStory.link_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                    <ExternalLink size={18} /> Read More / Join
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID Card, GPA, QR, Lab Modals -> Same as before */}
      {showCardModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setShowCardModal(false)}><div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col" onClick={e => e.stopPropagation()}><div className="bg-blue-600 h-32 relative p-5 flex justify-between items-start shrink-0"><div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><span className="text-white font-bold text-xs tracking-widest">KMUTT</span></div><div className="text-right text-white/90"><p className="text-[10px] font-bold tracking-widest uppercase mb-1">Student ID Card</p><p className="text-[10px] opacity-75">SIT Faculty</p></div></div><div className="px-6 pb-8 text-center -mt-16 relative z-10 flex flex-col items-center"><div className="w-28 h-28 rounded-full border-4 border-white bg-gray-200 shadow-lg overflow-hidden mb-3 shrink-0"><img src={profile?.avatar} className="w-full h-full object-cover" /></div><h2 className="text-2xl font-extrabold text-gray-800 leading-tight mb-1">{profile?.first_name}</h2><p className="text-gray-500 font-bold text-sm mb-6 bg-gray-100 px-3 py-1 rounded-full">{profile?.major} Student</p><div className="bg-white border-2 border-dashed border-gray-200 p-4 rounded-xl w-full flex flex-col items-center gap-2 shadow-sm"><p className="text-2xl font-mono font-bold text-blue-600 tracking-widest">{getStudentIdDisplay()}</p><div className="bg-white p-1"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${profile?.student_id}`} className="w-32 h-32 mix-blend-multiply opacity-90" /></div><p className="text-[9px] text-gray-400 uppercase tracking-wide mt-1">Scan to Verify</p></div></div></div></div>)}
      {showGPAModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowGPAModal(false)}><div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-xs w-full animate-pop-in" onClick={e => e.stopPropagation()}><div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600"><Award size={32} /></div><h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Current GPAX</h3><p className="text-5xl font-extrabold text-gray-800 mb-6">{gpax}</p><button onClick={() => { setShowGPAModal(false); router.push('/profile'); }} className="w-full py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200">View Transcript</button></div></div>)}
      {showQRModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowQRModal(false)}><div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-xs w-full" onClick={e => e.stopPropagation()}><h3 className="text-xl font-bold text-gray-800 mb-4">Access Pass Key</h3><div className="bg-white p-2 border-2 border-dashed border-gray-300 rounded-xl mb-4"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ACCESS:${profile?.student_id}:${new Date().toISOString()}`} className="w-full aspect-square" /></div><p className="text-xs text-gray-400">Scan this QR to enter Library or Lab rooms.</p></div></div>)}
      {showLabModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowLabModal(false)}><div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}><div className="p-5 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Monitor size={18} className="text-emerald-500" /> Computer Labs</h3><button onClick={() => setShowLabModal(false)}><X size={20} className="text-gray-400" /></button></div><div className="p-4 overflow-y-auto custom-scrollbar space-y-3">{rooms.length > 0 ? rooms.map(room => (<div key={room.id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-gray-50"><div><h4 className="font-bold text-gray-800">{room.name}</h4><p className="text-xs text-gray-500">Capacity: {room.capacity}</p></div><span className={`px-3 py-1 rounded-full text-xs font-bold ${room.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{room.is_available ? 'Available' : 'Occupied'}</span></div>)) : (<p className="text-center text-gray-400 py-4">No lab info available.</p>)}</div></div></div>)}
    </div>
  );
}

function QuickBtn({ icon: Icon, label, color, bg, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 bg-white p-3 py-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95">
      <div className={`w-10 h-10 rounded-full ${bg} ${color} flex items-center justify-center`}>
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-bold text-gray-600">{label}</span>
    </button>
  );
}