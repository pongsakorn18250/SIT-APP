"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import PageSkeleton from "../../components/PageSkeleton";
import { 
  ArrowLeft, Wrench, Package, Key, Users, Monitor, 
  FileText, Printer, CheckCircle, Clock, X, 
  MapPin, Loader2, Calendar as CalendarIcon, Send, ChevronDown, QrCode, Download
} from "lucide-react";

export default function ToolsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTool, setActiveTool] = useState(null);

  const [maintenances, setMaintenances] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [myBorrows, setMyBorrows] = useState([]);
  const [softwares, setSoftwares] = useState([]);
  const [mySoftwareReqs, setMySoftwareReqs] = useState([]);
  const [labRooms, setLabRooms] = useState([]);
  const [myLabUsage, setMyLabUsage] = useState(null);
  const [projectRooms, setProjectRooms] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [lostFounds, setLostFounds] = useState([]);
  const [docRequests, setDocRequests] = useState([]);
  const [myGrades, setMyGrades] = useState([]);
  const [gpax, setGpax] = useState("0.00");

  const [showTranscript, setShowTranscript] = useState(false);
  const [expandedSwId, setExpandedSwId] = useState(null);
  const [swRequestModal, setSwRequestModal] = useState({ isOpen: false, softwareId: null, softwareName: "", email: "", reason: "" });
  const [roomScheduleModal, setRoomScheduleModal] = useState({ isOpen: false, roomId: null, date: "", schedules: [] });
  const [voucherModal, setVoucherModal] = useState({ isOpen: false, booking: null });
  
  const [docMode, setDocMode] = useState('unofficial'); 
  const [officialDocDate, setOfficialDocDate] = useState("");

  const [maintForm, setMaintForm] = useState({ room: "", title: "", description: "" });
  const [redeemInputs, setRedeemInputs] = useState({});
  const [lostForm, setLostForm] = useState({ post_type: "lost", item_name: "", location: "", description: "" });
  const [lfCommentInputs, setLfCommentInputs] = useState({}); 
  const [docForm, setDocForm] = useState({ doc_type: "Transcript", reason: "" });
  const [borrowForm, setBorrowForm] = useState({ equipment_id: "", borrow_date: "", return_date: "" });
  const [bookingForm, setBookingForm] = useState({ room_id: "", booking_date: "", start_time: "", end_time: "", purpose: "" });

  useEffect(() => { fetchBaseData(); }, []);

  const fetchBaseData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    setUser(user);
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profileData); setLoading(false);
  };

  const loadToolData = async (tool) => {
      setActiveTool(tool); setLoading(true);
      if (tool === 'maintenance') {
          const { data } = await supabase.from('maintenance').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); setMaintenances(data || []);
      } else if (tool === 'equipment') {
          const { data: eq } = await supabase.from('equipments').select('*').order('name');
          const { data: req } = await supabase.from('equipment_borrows').select('*, equipments(name, image_url)').eq('user_id', user.id).order('created_at', { ascending: false });
          setEquipments(eq || []); setMyBorrows(req || []);
      } else if (tool === 'software') {
          const { data: sw } = await supabase.from('software_licenses').select('*').order('name');
          const { data: req } = await supabase.from('software_requests').select('*, software_licenses(name, icon_url, description, validity_period)').eq('user_id', user.id);
          setSoftwares(sw || []); setMySoftwareReqs(req || []);
      } else if (tool === 'booking') {
          const { data: rm } = await supabase.from('rooms').select('*').eq('room_type', 'project').order('name');
          const { data: bk } = await supabase.from('bookings').select('*, rooms(name)').eq('user_id', user.id).order('booking_date', { ascending: false });
          setProjectRooms(rm || []); setMyBookings(bk || []);
      } else if (tool === 'lab') {
          const { data: rm } = await supabase.from('rooms').select('*').eq('room_type', 'lab').order('name');
          const { data: myUse } = await supabase.from('lab_usage').select('*').eq('user_id', user.id).eq('status', 'active').single();
          const { data: allActive } = await supabase.from('lab_usage').select('room_id').eq('status', 'active');
          const roomCounts = {}; allActive?.forEach(a => { roomCounts[a.room_id] = (roomCounts[a.room_id] || 0) + 1; });
          setLabRooms(rm?.map(r => ({ ...r, active_users: roomCounts[r.id] || 0 })) || []); setMyLabUsage(myUse);
      } else if (tool === 'lostfound') {
          const { data } = await supabase.from('lost_and_found').select('*, profiles:user_id(first_name, avatar), lost_and_found_comments(*, profiles:user_id(first_name, avatar))').eq('status', 'active').order('created_at', { ascending: false });
          const sortedData = data?.map(post => ({ ...post, lost_and_found_comments: post.lost_and_found_comments.sort((a,b) => new Date(a.created_at) - new Date(b.created_at)) }));
          setLostFounds(sortedData || []);
      } else if (tool === 'document') {
          const { data } = await supabase.from('document_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); setDocRequests(data || []);
          const { data: enrolls } = await supabase.from('enrollments').select('grade, classes(subject_code, subject_name, credit)').eq('user_id', user.id);
          if (enrolls) {
              const validGrades = enrolls.filter(e => e.grade && e.grade !== 'W'); setMyGrades(validGrades);
              let tScore = 0, tCredit = 0; const map = { "A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D+": 1.5, "D": 1, "F": 0 };
              validGrades.forEach(e => { const credit = e.classes?.credit || 3; if (map[e.grade] !== undefined) { tScore += map[e.grade] * credit; tCredit += credit; } });
              setGpax(tCredit > 0 ? (tScore / tCredit).toFixed(2) : "0.00");
          }
      }
      setLoading(false);
  };

  const checkRoomSchedule = async () => {
      if (!bookingForm.room_id || !bookingForm.booking_date) return alert("กรุณาเลือกห้องและวันที่ เพื่อเช็คคิวครับ");
      const { data } = await supabase.from('bookings').select('start_time, end_time, status').eq('room_id', bookingForm.room_id).eq('booking_date', bookingForm.booking_date).in('status', ['pending', 'approved']).order('start_time');
      setRoomScheduleModal({ isOpen: true, roomId: bookingForm.room_id, date: bookingForm.booking_date, schedules: data || [] });
  };
  const submitBooking = async (e) => {
      e.preventDefault(); if (!bookingForm.room_id) return alert("กรุณาเลือกห้องก่อนครับ!");
      const { data: existing } = await supabase.from('bookings').select('*').eq('room_id', bookingForm.room_id).eq('booking_date', bookingForm.booking_date).in('status', ['pending', 'approved']);
      const isOverlap = existing.some(b => (bookingForm.start_time < b.end_time && bookingForm.end_time > b.start_time));
      if (isOverlap) return alert("❌ เวลาดังกล่าวมีการจองไปแล้ว กรุณาเลือกเวลาใหม่ หรือเช็คคิวห้องก่อนครับ");
      await supabase.from('bookings').insert({ ...bookingForm, user_id: user.id, status: 'pending' });
      setBookingForm({ room_id: "", booking_date: "", start_time: "", end_time: "", purpose: "" }); alert("จองห้องเรียบร้อย รอ Admin อนุมัติ"); loadToolData('booking');
  };
  const submitSoftwareRequest = async (e) => { e.preventDefault(); await supabase.from('software_requests').insert({ user_id: user.id, software_id: swRequestModal.softwareId, university_email: swRequestModal.email, request_reason: swRequestModal.reason }); setSwRequestModal({ isOpen: false, softwareId: null, softwareName: "", email: "", reason: "" }); alert(`ส่งคำขอ ${swRequestModal.softwareName} เรียบร้อย!`); loadToolData('software'); };
  const handleRedeem = async (req) => { const inputCode = redeemInputs[req.id]; if (!inputCode) return alert("กรุณากรอกโค้ด"); if (inputCode.trim() !== req.license_key) return alert("❌ โค้ดไม่ถูกต้อง (Invalid Code)"); await supabase.from('software_requests').update({ status: 'redeemed' }).eq('id', req.id); await supabase.from('notifications').insert({ user_id: user.id, title: '🎉 Software Redeemed!', message: `เปิดใช้งาน ${req.software_licenses?.name} แล้ว`, type: 'info' }); alert("✅ Redeem โค้ดสำเร็จ!"); loadToolData('software'); };
  const submitMaintenance = async (e) => { e.preventDefault(); await supabase.from('maintenance').insert({ ...maintForm, user_id: user.id }); setMaintForm({ room: "", title: "", description: "" }); alert("แจ้งซ่อมเรียบร้อย!"); loadToolData('maintenance'); };
  const submitBorrow = async (e) => { e.preventDefault(); if (!borrowForm.equipment_id) return alert("กรุณาเลือกอุปกรณ์"); await supabase.from('equipment_borrows').insert({ ...borrowForm, user_id: user.id }); setBorrowForm({ equipment_id: "", borrow_date: "", return_date: "" }); alert("ส่งคำขอยืมเรียบร้อย รอ Admin อนุมัติ"); loadToolData('equipment'); };
  const toggleLabCheckIn = async (roomId, action) => { if (action === 'checkin') { if(myLabUsage) return alert("คุณใช้งานห้องอื่นอยู่ ต้อง Check-out ก่อน"); await supabase.from('lab_usage').insert({ room_id: roomId, user_id: user.id, status: 'active' }); } else { await supabase.from('lab_usage').update({ status: 'completed', check_out_time: new Date().toISOString() }).eq('id', myLabUsage.id); } loadToolData('lab'); };
  const submitDocRequest = async (e) => { e.preventDefault(); await supabase.from('document_requests').insert({ ...docForm, user_id: user.id }); setDocForm({ doc_type: "Transcript", reason: "" }); alert("ส่งคำร้องเรียบร้อย!"); loadToolData('document'); };
  const submitLostFound = async (e) => { e.preventDefault(); await supabase.from('lost_and_found').insert({ ...lostForm, user_id: user.id }); setLostForm({ post_type: "lost", item_name: "", location: "", description: "" }); alert("โพสต์ประกาศเรียบร้อย!"); loadToolData('lostfound'); };
  const handleResolveLF = async (postId) => { if(!confirm("คุณเจอของสิ่งนี้แล้วใช่หรือไม่? (โพสต์จะถูกซ่อน)")) return; await supabase.from('lost_and_found').update({ status: 'resolved' }).eq('id', postId); loadToolData('lostfound'); };
  const handleCreateLFComment = async (e, postId) => { e.preventDefault(); const content = lfCommentInputs[postId]; if (!content?.trim()) return; await supabase.from('lost_and_found_comments').insert({ post_id: postId, user_id: user.id, content }); setLfCommentInputs({ ...lfCommentInputs, [postId]: "" }); loadToolData('lostfound'); };

  if (loading && !activeTool) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-10 pt-20">
      <div className="max-w-lg mx-auto p-4 space-y-6 relative">
        
        {!activeTool && (
            <div className="animate-fade-in space-y-6">
                <div className="text-center mb-6"><h1 className="text-2xl font-black text-gray-900">SIT Tools</h1><p className="text-sm text-gray-500">All-in-one services for SIT students</p></div>
                <div onClick={() => loadToolData('document')} className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div><FileText size={32} className="mb-3 opacity-90"/><h2 className="text-xl font-bold mb-1">Document Request</h2><p className="text-xs text-blue-100">ขอ Transcript, ใบรับรองสภาพ นศ. แบบออนไลน์</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ToolCard icon={Wrench} title="Maintenance" desc="แจ้งซ่อมอุปกรณ์" color="orange" onClick={() => loadToolData('maintenance')} />
                    <ToolCard icon={Package} title="Equipment" desc="ยืม-คืนอุปกรณ์" color="sky" onClick={() => loadToolData('equipment')} />
                    <ToolCard icon={Key} title="Licenses" desc="รับโค้ดซอฟต์แวร์" color="purple" onClick={() => loadToolData('software')} />
                    <ToolCard icon={Users} title="Room Booking" desc="จองห้องทำโปรเจกต์" color="emerald" onClick={() => loadToolData('booking')} />
                    <ToolCard icon={Monitor} title="Computer Lab" desc="เช็คที่นั่ง & Check-in" color="pink" onClick={() => loadToolData('lab')} />
                    <ToolCard icon={CalendarIcon} title="Lost & Found" desc="ของหายได้คืน" color="red" onClick={() => loadToolData('lostfound')} />
                </div>
            </div>
        )}

        {activeTool === 'maintenance' && (<div className="animate-slide-in-right space-y-6"><ToolHeader title="Maintenance" onClickBack={() => setActiveTool(null)} color="orange"/><form onSubmit={submitMaintenance} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4"><input required placeholder="ห้อง (เช่น CB2301)" value={maintForm.room} onChange={e => setMaintForm({...maintForm, room: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none"/><input required placeholder="ปัญหา (เช่น แอร์น้ำหยด)" value={maintForm.title} onChange={e => setMaintForm({...maintForm, title: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none"/><textarea placeholder="รายละเอียดเพิ่มเติม..." value={maintForm.description} onChange={e => setMaintForm({...maintForm, description: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none min-h-[80px]"/><button type="submit" className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl shadow-md hover:bg-orange-600">Send Report</button></form><div className="space-y-3">{maintenances.map(m => (<div key={m.id} className="bg-white p-4 rounded-2xl border flex gap-3"><div className="p-2 bg-gray-50 rounded-xl h-fit"><Wrench size={20} className="text-orange-400"/></div><div><p className="text-xs font-bold text-gray-500">{m.room}</p><h4 className="font-bold text-gray-800 text-sm">{m.title}</h4><p className="text-[10px] text-gray-400 mt-1">Status: {m.status.toUpperCase()}</p></div></div>))}</div></div>)}
        {activeTool === 'equipment' && (<div className="animate-slide-in-right space-y-6"><ToolHeader title="Equipment Borrowing" onClickBack={() => setActiveTool(null)} color="sky"/><div><h3 className="font-bold text-sm text-gray-800 mb-3 px-1">1. เลือกอุปกรณ์ที่ต้องการยืม</h3>{equipments.length === 0 ? <p className="text-sm text-gray-400 ml-1">ไม่มีอุปกรณ์ในระบบ</p> : (<div className="grid grid-cols-2 gap-3">{equipments.map(eq => { const isAvailable = eq.available_quantity > 0; const isSelected = borrowForm.equipment_id === eq.id; return (<div key={eq.id} onClick={() => isAvailable && setBorrowForm({...borrowForm, equipment_id: eq.id})} className={`bg-white p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${!isAvailable ? 'opacity-50 grayscale cursor-not-allowed' : isSelected ? 'border-sky-500 ring-4 ring-sky-50 shadow-md' : 'border-gray-100 hover:border-sky-200'}`}><img src={eq.image_url} className="w-12 h-12 mb-2 object-contain" /><h4 className="font-bold text-gray-800 text-xs line-clamp-1">{eq.name}</h4><span className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${isAvailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{isAvailable ? `ว่าง ${eq.available_quantity} ชิ้น` : 'ของหมด'}</span></div>)})}</div>)}</div>{borrowForm.equipment_id && (<form onSubmit={submitBorrow} className="bg-white p-5 rounded-3xl shadow-sm border border-sky-100 space-y-4 animate-fade-in-up"><h3 className="font-bold text-sm text-gray-800">2. ระบุวันเวลา</h3><div className="flex items-center gap-2 mb-2 p-2 bg-sky-50 rounded-xl text-sky-700 text-xs font-bold"><Package size={16}/> เลือก: {equipments.find(e => e.id === borrowForm.equipment_id)?.name}</div><div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-gray-500 ml-1">วันที่ยืม</label><input type="date" required value={borrowForm.borrow_date} onChange={e => setBorrowForm({...borrowForm, borrow_date: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none"/></div><div><label className="text-[10px] font-bold text-gray-500 ml-1">กำหนดคืน</label><input type="date" required value={borrowForm.return_date} onChange={e => setBorrowForm({...borrowForm, return_date: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none"/></div></div><button type="submit" className="w-full py-3 bg-sky-500 text-white font-bold rounded-xl shadow-md hover:bg-sky-600">Submit Request</button></form>)}<div className="space-y-3"><h3 className="font-bold text-sm text-gray-800 px-1">ประวัติการยืมของฉัน</h3>{myBorrows.length === 0 ? <p className="text-center text-gray-400 py-4 text-sm">ยังไม่มีประวัติการยืม</p> : myBorrows.map(b => (<div key={b.id} className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-3"><img src={b.equipments?.image_url} className="w-10 h-10 object-contain p-1 bg-gray-50 rounded-lg"/><div className="flex-1"><h4 className="font-bold text-gray-800 text-sm">{b.equipments?.name}</h4><p className="text-[10px] text-gray-500 mt-1">ยืม: {b.borrow_date} | คืน: {b.return_date}</p></div><span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${b.status === 'approved' || b.status === 'borrowed' ? 'bg-blue-100 text-blue-600' : b.status === 'returned' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{b.status.toUpperCase()}</span></div>))}</div></div>)}
        {activeTool === 'software' && (<div className="animate-slide-in-right space-y-6"><ToolHeader title="Software Licenses" onClickBack={() => setActiveTool(null)} color="purple"/>{mySoftwareReqs.length > 0 && (<div className="space-y-3"><h3 className="font-bold text-sm text-gray-800 px-1">My Licenses</h3>{mySoftwareReqs.map(req => { const isExpanded = expandedSwId === req.id; return (<div key={req.id} className={`bg-white rounded-2xl border shadow-sm transition-all overflow-hidden ${isExpanded ? 'border-purple-300 ring-2 ring-purple-50' : 'border-purple-100 hover:border-purple-200'}`}><div onClick={() => setExpandedSwId(isExpanded ? null : req.id)} className="p-4 flex items-center justify-between cursor-pointer bg-white"><div className="flex items-center gap-3">{req.software_licenses?.icon_url ? <img src={req.software_licenses.icon_url} className="w-10 h-10 object-contain rounded-xl bg-gray-50 p-1"/> : <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center font-bold text-purple-600">{req.software_licenses?.name[0]}</div>}<div><h4 className="font-bold text-gray-900">{req.software_licenses?.name}</h4><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${req.status === 'approved' ? 'bg-green-100 text-green-600' : req.status === 'redeemed' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>Status: {req.status.toUpperCase()}</span></div></div><div className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}><ChevronDown size={20}/></div></div>{isExpanded && (<div className="p-4 border-t border-purple-50 bg-purple-50/20 space-y-4 animate-fade-in"><div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{req.software_licenses?.description || "ซอฟต์แวร์สนับสนุนการเรียนการสอนสำหรับนักศึกษา"}</div><div className="text-[10px] text-purple-600 bg-purple-100/50 px-2 py-1 rounded inline-block font-bold">⏱️ อายุใช้งาน: {req.software_licenses?.validity_period || "ตลอดการเป็นนักศึกษา"}</div>{req.status === 'approved' && (<div className="bg-white p-3 rounded-xl border border-dashed border-purple-300"><p className="text-[10px] text-gray-500 mb-2">Admin ส่งโค้ดให้แล้ว กรอกเพื่อเปิดใช้งาน:</p><div className="flex gap-2"><input placeholder="Enter License Key..." value={redeemInputs[req.id] || ""} onChange={e => setRedeemInputs({...redeemInputs, [req.id]: e.target.value})} className="flex-1 border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 ring-purple-100"/><button onClick={() => handleRedeem(req)} className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700">Redeem</button></div></div>)}{req.status === 'redeemed' && (<div className="bg-green-50/60 border border-green-100 p-3 rounded-xl text-center"><p className="text-[10px] font-bold text-green-700 mb-1">Your License Key:</p><code className="bg-white px-3 py-2 rounded-lg text-sm font-mono text-gray-800 border border-green-200 select-all tracking-widest block">{req.license_key}</code></div>)}</div>)}</div>)})}</div>)}<div className="space-y-3 mt-6"><h3 className="font-bold text-sm text-gray-800 px-1">Available Softwares</h3>{softwares.filter(sw => !mySoftwareReqs.some(r => r.software_id === sw.id)).length === 0 ? (<div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 text-center"><p className="text-sm text-gray-500">คุณได้ขอใช้งานซอฟต์แวร์ครบทั้งหมดแล้ว 🎉</p></div>) : (softwares.filter(sw => !mySoftwareReqs.some(r => r.software_id === sw.id)).map(sw => (<div key={sw.id} className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-4">{sw.icon_url ? <img src={sw.icon_url} className="w-12 h-12 object-contain rounded-xl bg-gray-50 p-1"/> : <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-400">{sw.name[0]}</div>}<div className="flex-1"><h4 className="font-bold text-gray-900 text-sm">{sw.name}</h4><p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">⏱️ {sw.validity_period || "ตลอดการเป็นนักศึกษา"}</p></div><button onClick={() => setSwRequestModal({ isOpen: true, softwareId: sw.id, softwareName: sw.name, email: `${profile?.student_id || ''}@kmutt.ac.th`, reason: "" })} className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-50 text-purple-600 hover:bg-purple-100 hover:shadow-sm transition-all">Request</button></div>)))}</div></div>)}
        {activeTool === 'booking' && (<div className="animate-slide-in-right space-y-6"><ToolHeader title="Room Booking" onClickBack={() => setActiveTool(null)} color="emerald"/><div><h3 className="font-bold text-sm text-gray-800 mb-3 px-1">1. เลือกห้องที่ต้องการ (Select Room)</h3>{projectRooms.length === 0 ? <p className="text-sm text-gray-400 ml-1">ยังไม่มีห้องให้จองในระบบ</p> : (<div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">{projectRooms.map(r => (<div key={r.id} onClick={() => setBookingForm({...bookingForm, room_id: r.id})} className={`min-w-[200px] w-[200px] snap-start bg-white rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${bookingForm.room_id === r.id ? 'border-emerald-500 shadow-md ring-4 ring-emerald-50' : 'border-gray-100 hover:border-emerald-200'}`}><div className="h-28 bg-gray-200 relative">{r.image_url ? <img src={r.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-emerald-100"></div>}{bookingForm.room_id === r.id && <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-sm"><CheckCircle size={16}/></div>}</div><div className="p-3"><h4 className="font-bold text-gray-800 text-sm truncate">{r.name}</h4><p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Users size={12}/> ความจุ {r.capacity} คน</p></div></div>))}</div>)}</div>{bookingForm.room_id && (<form onSubmit={submitBooking} className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-100 space-y-4 animate-fade-in-up"><div className="flex justify-between items-end"><h3 className="font-bold text-sm text-gray-800">2. ระบุวันเวลาและจุดประสงค์</h3><button type="button" onClick={checkRoomSchedule} className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-emerald-100"><CalendarIcon size={12}/> ดูคิววันนี้</button></div><div className="flex items-center gap-2 mb-2 p-2 bg-emerald-50 rounded-xl text-emerald-700 text-xs font-bold"><MapPin size={16}/> เลือก: {projectRooms.find(r => r.id === bookingForm.room_id)?.name}</div><input type="date" required value={bookingForm.booking_date} onChange={e => setBookingForm({...bookingForm, booking_date: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none"/><div className="grid grid-cols-2 gap-3"><input type="time" required value={bookingForm.start_time} onChange={e => setBookingForm({...bookingForm, start_time: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none"/><input type="time" required value={bookingForm.end_time} onChange={e => setBookingForm({...bookingForm, end_time: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none"/></div><input required placeholder="จุดประสงค์ (เช่น ติวข้อสอบ Database)" value={bookingForm.purpose} onChange={e => setBookingForm({...bookingForm, purpose: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none"/><button type="submit" className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-md hover:bg-emerald-600">Book Room</button></form>)}<div className="space-y-3"><h3 className="font-bold text-sm text-gray-800 px-1">ประวัติการจองห้องของฉัน</h3>{myBookings.length === 0 ? <p className="text-center text-gray-400 py-4 text-sm">ยังไม่มีประวัติการจอง</p> : myBookings.map(b => (<div key={b.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-center transition-all ${b.status === 'approved' ? 'border-emerald-300 ring-2 ring-emerald-50' : ''}`}><div><h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">{b.rooms?.name}{b.status === 'approved' && <span className="flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}</h4><p className="text-[10px] text-gray-500 mt-1">{b.booking_date} | {b.start_time?.slice(0,5)} - {b.end_time?.slice(0,5)}</p></div><div className="flex flex-col items-end gap-2"><span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${b.status === 'approved' ? 'bg-green-100 text-green-600' : b.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{b.status.toUpperCase()}</span>{b.status === 'approved' && (<button onClick={() => setVoucherModal({ isOpen: true, booking: b })} className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-1 rounded-lg shadow-sm hover:bg-emerald-700 flex items-center gap-1">🎟️ E-Voucher</button>)}</div></div>))}</div></div>)}
        {activeTool === 'lab' && (<div className="animate-slide-in-right space-y-6"><ToolHeader title="Computer Labs" onClickBack={() => setActiveTool(null)} color="pink"/>{myLabUsage && (<div className="bg-pink-600 text-white p-5 rounded-3xl shadow-lg flex justify-between items-center"><div><p className="text-[10px] font-bold uppercase mb-1">Currently Using</p><h3 className="text-xl font-bold">{labRooms.find(r => r.id === myLabUsage.room_id)?.name}</h3></div><button onClick={() => toggleLabCheckIn(myLabUsage.room_id, 'checkout')} className="bg-white text-pink-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-pink-50">Check Out</button></div>)}<div className="space-y-4">{labRooms.length === 0 ? <p className="text-center text-gray-400 py-6 text-sm">ไม่มีห้อง Lab ในระบบ</p> : labRooms.map(room => { const isFull = room.active_users >= room.capacity; return (<div key={room.id} className="bg-white rounded-3xl border shadow-sm overflow-hidden">{room.image_url && <div className="w-full h-32 bg-gray-200"><img src={room.image_url} className="w-full h-full object-cover"/></div>}<div className="p-5"><div className="flex justify-between items-start mb-3"><div><h4 className="font-bold text-gray-900 text-lg">{room.name}</h4><p className="text-xs text-gray-500">Capacity: {room.capacity} seats</p></div><span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{isFull ? 'Full' : 'Available'}</span></div><div className="w-full bg-gray-100 rounded-full h-2 mb-4"><div className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min((room.active_users / room.capacity) * 100, 100)}%` }}></div></div><div className="flex justify-between items-center"><p className="text-sm font-bold text-gray-700">{room.capacity - room.active_users} <span className="text-xs font-normal text-gray-500">seats left</span></p>{!myLabUsage && !isFull && (<button onClick={() => toggleLabCheckIn(room.id, 'checkin')} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800">Check In Here</button>)}</div></div></div>)})}</div></div>)}
        {activeTool === 'lostfound' && (<div className="animate-slide-in-right space-y-6"><ToolHeader title="Lost & Found" onClickBack={() => setActiveTool(null)} color="red"/><form onSubmit={submitLostFound} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3"><div className="flex gap-2 mb-2"><button type="button" onClick={() => setLostForm({...lostForm, post_type: 'lost'})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${lostForm.post_type === 'lost' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}>ตามหาของ (Lost)</button><button type="button" onClick={() => setLostForm({...lostForm, post_type: 'found'})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${lostForm.post_type === 'found' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>เก็บของได้ (Found)</button></div><input required placeholder="ชื่อสิ่งของ (เช่น iPad Air สีฟ้า)" value={lostForm.item_name} onChange={e => setLostForm({...lostForm, item_name: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none"/><input required placeholder="สถานที่ (เช่น ห้องน้ำชั้น 2)" value={lostForm.location} onChange={e => setLostForm({...lostForm, location: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none"/><button type="submit" className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-md hover:bg-gray-800">Post Item</button></form><div className="space-y-4">{lostFounds.length === 0 ? <p className="text-center text-gray-400 text-sm py-4">ไม่มีประกาศค้นหาของ</p> : lostFounds.map(item => (<div key={item.id} className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${item.post_type === 'lost' ? 'border-red-100' : 'border-green-100'}`}><div className="p-4 border-b"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><img src={item.profiles?.avatar} className="w-8 h-8 rounded-full bg-gray-200 object-cover"/><div><span className="text-xs font-bold text-gray-800 block">{item.profiles?.first_name}</span><span className="text-[9px] text-gray-400">{new Date(item.created_at).toLocaleString()}</span></div></div><span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${item.post_type === 'lost' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{item.post_type === 'lost' ? 'LOST (ของหาย)' : 'FOUND (เก็บของได้)'}</span></div><h4 className="font-bold text-gray-900 text-lg">{item.item_name}</h4><p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={14}/> {item.location}</p>{item.user_id === user.id && (<button onClick={() => handleResolveLF(item.id)} className="mt-3 w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-800"><CheckCircle size={14}/> Mark as Resolved (ปิดประกาศ)</button>)}</div><div className="bg-gray-50 p-4 space-y-3">{item.lost_and_found_comments?.map(comment => (<div key={comment.id} className="flex gap-2"><img src={comment.profiles?.avatar} className="w-6 h-6 rounded-full shrink-0 object-cover"/><div className="bg-white px-3 py-2 rounded-xl rounded-tl-none shadow-sm border border-gray-100 text-sm"><p className="font-bold text-xs text-gray-800">{comment.profiles?.first_name}</p><p className="text-gray-600">{comment.content}</p></div></div>))}<form onSubmit={(e) => handleCreateLFComment(e, item.id)} className="flex gap-2 pt-2"><input type="text" placeholder="พิมพ์เบาะแส / คอมเมนต์..." value={lfCommentInputs[item.id] || ""} onChange={e => setLfCommentInputs({...lfCommentInputs, [item.id]: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs outline-none focus:ring-2 ring-gray-200"/><button type="submit" disabled={!lfCommentInputs[item.id]?.trim()} className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 shrink-0"><Send size={12}/></button></form></div></div>))}</div></div>)}

        {/* 🌟 7. DOCUMENT REQUEST & OFFICIAL PDF (อัปเกรดระบบโหลดไฟล์) 🌟 */}
        {activeTool === 'document' && (
            <div className="animate-slide-in-right space-y-6">
                <ToolHeader title="Document Request" onClickBack={() => setActiveTool(null)} color="blue"/>
                
                {/* ปุ่มขอ Unofficial Transcript (กดได้ตลอด) */}
                <div onClick={() => { setDocMode('unofficial'); setShowTranscript(true); }} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-5 cursor-pointer hover:shadow-md transition-all flex items-center justify-between group">
                    <div>
                        <h3 className="font-bold text-blue-900 flex items-center gap-2"><Printer size={18}/> Unofficial Transcript</h3>
                        <p className="text-xs text-blue-700 mt-1">ดูเกรดและสร้างใบ Transcript รูปแบบ PDF ทันที</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><ArrowLeft size={18} className="rotate-180"/></div>
                </div>

                <form onSubmit={submitDocRequest} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-bold text-sm text-gray-800">ยื่นคำร้องขอเอกสารทางการ</h3>
                    <select value={docForm.doc_type} onChange={e => setDocForm({...docForm, doc_type: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none">
                        <option value="Transcript">Official Transcript (ฉบับจริง)</option>
                        <option value="Certificate">ใบรับรองสภาพนักศึกษา</option>
                    </select>
                    <textarea required placeholder="เหตุผลที่ขอ (เช่น ใช้ยื่นฝึกงาน)" value={docForm.reason} onChange={e => setDocForm({...docForm, reason: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none min-h-[80px]"/>
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700">Submit Request</button>
                </form>

                <div className="space-y-3">
                    <h3 className="font-bold text-sm text-gray-800 px-1">ประวัติคำร้อง</h3>
                    {docRequests.length === 0 ? <p className="text-center text-gray-400 py-4 text-sm">ยังไม่มีประวัติ</p> : 
                        docRequests.map(doc => (
                        <div 
                            key={doc.id} 
                            onClick={() => {
                                if (doc.status === 'ready') {
                                    setDocMode(doc.doc_type);
                                    setOfficialDocDate(new Date(doc.created_at).toLocaleDateString());
                                    setShowTranscript(true);
                                }
                            }}
                            className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${doc.status === 'ready' ? 'bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 shadow-sm' : 'bg-white border-gray-100'}`}
                        >
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                    {doc.doc_type}
                                    {doc.status === 'ready' && <span className="flex w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                                </h4>
                                <p className="text-[10px] text-gray-400 mt-1">{new Date(doc.created_at).toLocaleDateString()}</p>
                            </div>
                            
                            {/* เปลี่ยนหน้าตาป้ายสถานะ ถ้า Ready ให้เป็นปุ่มโหลด */}
                            {doc.status === 'ready' ? (
                                <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-green-600 text-white flex items-center gap-1 shadow-sm"><Download size={12}/> โหลด PDF</span>
                            ) : (
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${doc.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{doc.status.toUpperCase()}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* ================= 🌟 MODALS SECTION 🌟 ================= */}

      {/* 🌟 1. Modal: PDF Document Generator 🌟 */}
      {showTranscript && (
          <div className="fixed inset-0 z-[100] bg-gray-900/90 overflow-y-auto flex justify-center py-10 px-4 print:p-0 print:bg-white print:overflow-visible">
              <div className="w-full max-w-2xl bg-white min-h-[297mm] shadow-2xl relative print:shadow-none print:w-[210mm] print:h-[297mm]">
                  
                  {/* 🌟 FIX Z-INDEX ตรงนี้: ให้ปุ่มลอยขึ้นมาเหนือพื้นที่เอกสาร */}
                  <div className="absolute top-4 right-4 flex gap-2 print:hidden z-50">
                      <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 cursor-pointer"><Printer size={16}/> Print / Save PDF</button>
                      <button onClick={() => setShowTranscript(false)} className="bg-gray-200 text-gray-700 w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-300 cursor-pointer"><X size={20}/></button>
                  </div>
                  
                  <div className="p-10 md:p-16 space-y-8 relative">
                      
                      {/* ตราประทับจำลอง ถ้าเป็นเอกสาร Official (ซ่อนในโหมดดูเล่น) */}
                      {docMode !== 'unofficial' && (
                          <div className="absolute top-12 right-12 border-[5px] border-red-600/80 text-red-600/80 rounded-full w-32 h-32 flex flex-col items-center justify-center -rotate-[15deg] print:opacity-100 opacity-90 z-10 pointer-events-none">
                              <span className="font-black text-xl uppercase tracking-widest">OFFICIAL</span>
                              <span className="text-[8px] font-bold uppercase mt-1">SIT KMUTT</span>
                          </div>
                      )}

                      <div className="text-center border-b-2 border-gray-800 pb-6">
                          <h1 className="text-2xl font-serif font-black uppercase tracking-widest text-gray-900">King Mongkut's University of Technology Thonburi</h1>
                          <h2 className="text-lg font-serif text-gray-700 mt-1">School of Information Technology</h2>
                          <p className="text-sm font-bold uppercase mt-4 tracking-wider bg-gray-100 inline-block px-4 py-1 border border-gray-300">
                              {docMode === 'Certificate' ? 'Certificate of Student Status' : 
                               docMode === 'unofficial' ? 'Unofficial Transcript of Academic Record' : 
                               'Official Transcript of Academic Record'}
                          </p>
                      </div>

                      {/* ข้อมูลนักศึกษา */}
                      <div className="flex gap-6 items-start">
                          <img src={profile?.avatar} className="w-24 h-32 object-cover border-4 border-double border-gray-300 print:border-gray-800 bg-gray-50"/>
                          <div className="flex-1 grid grid-cols-2 gap-y-4 text-sm font-mono">
                              <div><p className="text-gray-500 text-[10px] uppercase">Name</p><p className="font-bold text-base">{profile?.first_name}</p></div>
                              <div><p className="text-gray-500 text-[10px] uppercase">Student ID</p><p className="font-bold text-base">{profile?.student_id}</p></div>
                              <div><p className="text-gray-500 text-[10px] uppercase">Faculty</p><p className="font-bold">Information Technology</p></div>
                              <div><p className="text-gray-500 text-[10px] uppercase">Major</p><p className="font-bold">{profile?.major}</p></div>
                          </div>
                      </div>

                      {/* เนื้อหาเอกสาร: แยกตามประเภทที่ขอ */}
                      {docMode === 'Certificate' ? (
                          <div className="py-12 px-4 space-y-8 text-center min-h-[300px] flex flex-col justify-center">
                              <p className="text-lg font-serif leading-relaxed text-gray-800">
                                  This is to certify that<br/>
                                  <span className="font-bold text-2xl text-gray-900 mt-2 inline-block">{profile?.first_name}</span><br/>
                                  Student ID: <span className="font-bold">{profile?.student_id}</span>
                              </p>
                              <p className="text-lg font-serif leading-relaxed text-gray-800">
                                  is currently a registered student in the<br/>
                                  <span className="font-bold text-gray-900">School of Information Technology</span>,<br/>
                                  majoring in <span className="font-bold">{profile?.major}</span>.
                              </p>
                          </div>
                      ) : (
                          <table className="w-full text-sm font-mono border-collapse">
                              <thead>
                                  <tr className="border-y-2 border-gray-800 text-left">
                                      <th className="py-2 px-2">Course Code</th>
                                      <th className="py-2 px-2">Course Title</th>
                                      <th className="py-2 text-center">Credit</th>
                                      <th className="py-2 text-center">Grade</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {myGrades.map((g, idx) => (
                                      <tr key={idx} className="border-b border-gray-100">
                                          <td className="py-2 px-2 font-bold">{g.classes?.subject_code}</td>
                                          <td className="py-2 px-2 text-xs truncate max-w-[200px]">{g.classes?.subject_name}</td>
                                          <td className="py-2 text-center">{g.classes?.credit || 3}</td>
                                          <td className="py-2 text-center font-bold">{g.grade}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      )}

                      {/* ส่วนท้ายเอกสาร (Footer) */}
                      <div className="pt-8 border-t-2 border-gray-800 flex justify-between items-end">
                          <div>
                              {docMode === 'unofficial' ? (
                                  <p className="text-xs text-gray-500 font-mono">* This document is auto-generated for personal use only.</p>
                              ) : (
                                  <p className="text-xs text-gray-500 font-mono">Date Issued: {officialDocDate}</p>
                              )}
                              <p className="text-xs text-gray-500 font-mono mt-1">
                                  {docMode === 'unofficial' ? `Date Printed: ${new Date().toLocaleDateString()}` : 'Registrar Office, SIT KMUTT'}
                              </p>
                          </div>
                          
                          {/* โชว์เกรดเฉลี่ยถ้าเป็นใบเกรด / โชว์ลายเซ็นถ้าเป็นตัวจริง */}
                          {docMode === 'unofficial' ? (
                              <div className="text-right">
                                  <p className="text-xs uppercase tracking-wider text-gray-500">Cumulative GPAX</p>
                                  <p className="text-4xl font-serif font-black">{gpax}</p>
                              </div>
                          ) : (
                              <div className="text-center w-48">
                                  {/* 🌟 FIX SIGNATURE: ใช้ Base64 แทนการดึงรูปจากเน็ต เพื่อกันเว็บล่มและเซฟลง PDF ได้ชัวร์ๆ */}
                                  <img src="data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDMwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMCwyNSBDMjAsMTAgMzAsMTAgNDAsMjAgQzUwLDMwIDYwLDUgNzAsMTUgQzgwLDI1IDkwLDEwIDk1LDIwIiBmaWxsPSJub25lIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==" className="h-10 mx-auto mb-1 opacity-80" alt="signature"/>
                                  <div className="w-full border-t border-gray-800 mb-1"></div>
                                  <p className="text-[10px] font-serif uppercase tracking-widest text-gray-600">Authorized Signature</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 2. Modal: Software Request Form */}
      {swRequestModal.isOpen && (
          <div className="fixed inset-0 z-[100] bg-gray-900/60 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex justify-between items-start">
                      <div><h3 className="text-lg font-bold text-gray-900">Request License</h3><p className="text-xs text-purple-600 font-bold mt-1">{swRequestModal.softwareName}</p></div>
                      <button onClick={() => setSwRequestModal({ isOpen: false })} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer z-50"><X size={16}/></button>
                  </div>
                  <form onSubmit={submitSoftwareRequest} className="space-y-4">
                      <div><label className="text-xs font-bold text-gray-700 ml-1">University Email (KMUTT)</label><input type="email" required placeholder="@kmutt.ac.th" value={swRequestModal.email} onChange={e => setSwRequestModal({...swRequestModal, email: e.target.value})} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-purple-200"/></div>
                      <div><label className="text-xs font-bold text-gray-700 ml-1">Reason for Request</label><textarea required placeholder="ระบุเหตุผล หรือวิชาที่ต้องใช้งาน..." value={swRequestModal.reason} onChange={e => setSwRequestModal({...swRequestModal, reason: e.target.value})} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none min-h-[80px] focus:ring-2 ring-purple-200"/></div>
                      <button type="submit" className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl shadow-md hover:bg-purple-700">Submit Request</button>
                  </form>
              </div>
          </div>
      )}

      {/* 3. Modal: Room Schedule Checker */}
      {roomScheduleModal.isOpen && (
          <div className="fixed inset-0 z-[100] bg-gray-900/60 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex justify-between items-start border-b pb-3">
                      <div><h3 className="text-lg font-bold text-gray-900">ตารางคิวห้อง</h3><p className="text-xs text-emerald-600 font-bold mt-1">วันที่ {roomScheduleModal.date}</p></div>
                      <button onClick={() => setRoomScheduleModal({ isOpen: false })} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer z-50"><X size={16}/></button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pt-2">{roomScheduleModal.schedules.length === 0 ? (<div className="text-center py-6 text-gray-400 text-sm">✅ ห้องว่างตลอดทั้งวัน สามารถจองได้เลย!</div>) : (roomScheduleModal.schedules.map((s, idx) => (<div key={idx} className="flex justify-between items-center p-3 bg-gray-50 border rounded-xl"><span className="font-bold text-gray-800 text-sm"><Clock size={14} className="inline mr-2 text-gray-400"/>{s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</span><span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${s.status === 'approved' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{s.status === 'approved' ? 'จองแล้ว' : 'รอคิว'}</span></div>)))}</div>
                  <button onClick={() => setRoomScheduleModal({ isOpen: false })} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800">รับทราบ</button>
              </div>
          </div>
      )}

      {/* 4. Modal: E-Voucher */}
      {voucherModal.isOpen && (
          <div className="fixed inset-0 z-[100] bg-gray-900/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative">
                  <div className="bg-emerald-600 p-6 text-white text-center relative">
                      <div className="absolute top-4 right-4 z-50"><button onClick={() => setVoucherModal({ isOpen: false })} className="text-white/70 hover:text-white cursor-pointer"><X size={24}/></button></div>
                      <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mb-2">Confirmed Booking</p>
                      <h2 className="text-2xl font-black">{voucherModal.booking?.rooms?.name}</h2>
                  </div>
                  <div className="relative h-6 bg-white"><div className="absolute -left-3 top-0 w-6 h-6 bg-gray-900/80 rounded-full"></div><div className="absolute -right-3 top-0 w-6 h-6 bg-gray-900/80 rounded-full"></div><div className="w-full h-[1px] border-t-2 border-dashed border-gray-200 absolute top-3"></div></div>
                  <div className="p-6 space-y-6 bg-white"><div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100"><div className="text-center w-full"><p className="text-[10px] text-gray-500 uppercase font-bold">Date</p><p className="font-bold text-emerald-700 mt-1">{voucherModal.booking?.booking_date}</p></div><div className="w-[1px] h-8 bg-gray-300"></div><div className="text-center w-full"><p className="text-[10px] text-gray-500 uppercase font-bold">Time</p><p className="font-bold text-emerald-700 mt-1">{voucherModal.booking?.start_time?.slice(0,5)} - {voucherModal.booking?.end_time?.slice(0,5)}</p></div></div><div className="space-y-3"><div><p className="text-[10px] text-gray-400">Reserved By</p><p className="text-sm font-bold text-gray-800">{profile?.first_name} ({profile?.student_id})</p></div><div><p className="text-[10px] text-gray-400">Major / Department</p><p className="text-sm font-bold text-gray-800">{profile?.major || "IT"}</p></div><div><p className="text-[10px] text-gray-400">Purpose</p><p className="text-sm font-bold text-gray-800">{voucherModal.booking?.purpose}</p></div></div><div className="pt-6 border-t border-gray-100 flex flex-col items-center justify-center"><div className="p-3 bg-gray-50 rounded-2xl border"><QrCode size={64} className="text-gray-800"/></div><p className="text-[10px] text-gray-400 mt-3 text-center">โปรดแสดงหน้าจอนี้ต่อเจ้าหน้าที่เพื่อขอเปิดห้อง<br/>ID: {voucherModal.booking?.id?.split('-')[0].toUpperCase()}</p></div></div>
              </div>
          </div>
      )}

    </div>
  );
}

function ToolCard({ icon: Icon, title, desc, color, onClick }) {
    const colorStyles = { orange: "bg-orange-50 text-orange-600 border-orange-100", sky: "bg-sky-50 text-sky-600 border-sky-100", purple: "bg-purple-50 text-purple-600 border-purple-100", emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", pink: "bg-pink-50 text-pink-600 border-pink-100", red: "bg-red-50 text-red-600 border-red-100" };
    return (
        <div onClick={onClick} className={`p-4 md:p-5 rounded-3xl border cursor-pointer transition-all active:scale-95 flex flex-col items-start gap-3 shadow-sm hover:brightness-95 ${colorStyles[color]}`}>
            <div className={`p-3 rounded-xl bg-white/60 shadow-sm`}><Icon size={24}/></div>
            <div><h3 className="font-bold text-gray-900 text-sm leading-tight">{title}</h3><p className="text-[10px] font-medium opacity-80 mt-0.5">{desc}</p></div>
        </div>
    )
}
function ToolHeader({ title, onClickBack, color }) {
    const bgColors = { orange: 'bg-orange-100', sky: 'bg-sky-100', purple: 'bg-purple-100', emerald: 'bg-emerald-100', pink: 'bg-pink-100', red: 'bg-red-100', blue: 'bg-blue-100' };
    const textColors = { orange: 'text-orange-600', sky: 'text-sky-600', purple: 'text-purple-600', emerald: 'text-emerald-600', pink: 'text-pink-600', red: 'text-red-600', blue: 'text-blue-600' };
    return (
        <div className="flex items-center gap-3">
            <button onClick={onClickBack} className={`p-2 rounded-xl hover:bg-gray-200 transition-colors shadow-sm ${bgColors[color]} ${textColors[color]}`}><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
    )
}