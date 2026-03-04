"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, Building2, Calendar, Users, Save, Trash2, 
    Plus, Loader2, Image as ImageIcon, Briefcase, ListChecks, Check, X,
    GripVertical // ไอคอนสำหรับจับลาก
} from "lucide-react";

export default function AdminInsider() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("companies"); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data Lists
  const [companies, setCompanies] = useState([]);
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);

  // Form States 🌟 เพิ่ม description ให้ครบแล้ว
  const [compForm, setCompForm] = useState({ name: "", logo_url: "", daily_wage: "", positions: "", description: "" });
  const [eventForm, setEventForm] = useState({ title: "", image_url: "", event_date: "", location: "", category: "Tech", activity_hours: 3, description: "" });
  const [clubForm, setClubForm] = useState({ name: "", logo_url: "", description: "", member_count: 0 });

  // States สำหรับระบบ Approval
  const [selectedEventForReq, setSelectedEventForReq] = useState(null);
  const [eventRequests, setEventRequests] = useState([]);
  const [selectedClubForReq, setSelectedClubForReq] = useState(null);
  const [clubRequests, setClubRequests] = useState([]);

  // 🌟 ตัวแปรสำหรับ Drag and Drop
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [compRes, eventRes, clubRes] = await Promise.all([
        supabase.from('companies').select('*').order('rank', { ascending: true }), 
        supabase.from('events').select('*').order('created_at', { ascending: false }),
        supabase.from('clubs').select('*').order('created_at', { ascending: false })
    ]);
    setCompanies(compRes.data || []);
    setEvents(eventRes.data || []);
    setClubs(clubRes.data || []);
    setLoading(false);
  };

  // ==========================================
  // 🏢 1. ระบบ Drag & Drop (สลับอันดับบริษัท)
  // ==========================================
  const handleSort = async () => {
    // 1. จำลองการสลับตำแหน่งใน Array
    let _companies = [...companies];
    const draggedItemContent = _companies.splice(dragItem.current, 1)[0];
    _companies.splice(dragOverItem.current, 0, draggedItemContent);

    // ล้างค่า
    dragItem.current = null;
    dragOverItem.current = null;

    // 2. อัปเดตหน้าจอทันทีให้ดูลื่นไหล
    setCompanies(_companies);

    // 3. วนลูปเซฟลง Database (กำหนด Rank ใหม่ 1, 2, 3...)
    for (let i = 0; i < _companies.length; i++) {
        await supabase.from('companies').update({ rank: i + 1 }).eq('id', _companies[i].id);
    }
  };

  // ==========================================
  // 🎪 2. ระบบอนุมัติ Event
  // ==========================================
  const openEventRequests = async (event) => {
      setSelectedEventForReq(event);
      const { data } = await supabase
          .from('event_participants')
          .select('id, user_id, profiles(first_name, student_id, avatar)')
          .eq('event_id', event.id)
          .eq('status', 'pending');
      setEventRequests(data || []);
  };

  const handleApproveEvent = async (reqId, userId, event) => {
      await supabase.from('event_participants').update({ status: 'approved' }).eq('id', reqId);
      await supabase.from('activities').insert({
          user_id: userId,
          name: event.title,
          category: event.category || 'General',
          hours: event.activity_hours
      });
      setEventRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleRejectEvent = async (reqId) => {
      await supabase.from('event_participants').update({ status: 'rejected' }).eq('id', reqId);
      setEventRequests(prev => prev.filter(r => r.id !== reqId));
  };

  // ==========================================
  // 🎸 3. ระบบอนุมัติ ชมรม
  // ==========================================
  const openClubRequests = async (club) => {
      setSelectedClubForReq(club);
      const { data } = await supabase
          .from('club_members')
          .select('id, user_id, profiles(first_name, student_id, avatar)')
          .eq('club_id', club.id)
          .eq('status', 'pending');
      setClubRequests(data || []);
  };

  const handleApproveClub = async (reqId) => {
      await supabase.from('club_members').update({ status: 'approved' }).eq('id', reqId);
      setClubRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleRejectClub = async (reqId) => {
      await supabase.from('club_members').update({ status: 'rejected' }).eq('id', reqId);
      setClubRequests(prev => prev.filter(r => r.id !== reqId));
  };

  // --- Submit Handlers ---
  const handleCompSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // เซ็ตให้ Rank เริ่มต้นเป็น 999 (ไปต่อท้ายแถว)
    const { error } = await supabase.from('companies').insert({
        ...compForm,
        rank: 999, 
        positions: compForm.positions.split(',').map(p => p.trim())
    });
    if (!error) { setCompForm({ name: "", logo_url: "", daily_wage: "", positions: "", description: "" }); fetchData(); }
    setIsSubmitting(false);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('events').insert({
        ...eventForm,
        event_date: new Date(eventForm.event_date).toISOString()
    });
    if (!error) { setEventForm({ title: "", image_url: "", event_date: "", location: "", category: "Tech", activity_hours: 3, description: "" }); fetchData(); }
    setIsSubmitting(false);
  };

  const handleClubSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('clubs').insert(clubForm);
    if (!error) { setClubForm({ name: "", logo_url: "", description: "", member_count: 0 }); fetchData(); }
    setIsSubmitting(false);
  };

  const handleDelete = async (table, id) => {
      if (!confirm("Are you sure you want to delete this item?")) return;
      await supabase.from(table).delete().eq('id', id);
      fetchData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-800">SIT Insider Admin 🛠️</h1>
                <p className="text-gray-500 text-sm">Manage companies, events, and clubs.</p>
            </div>
        </div>

        {/* Tabs Menu */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border overflow-x-auto no-scrollbar">
            <TabBtn active={activeTab === 'companies'} onClick={() => setActiveTab('companies')} icon={Building2} label="Companies"/>
            <TabBtn active={activeTab === 'events'} onClick={() => setActiveTab('events')} icon={Calendar} label="Events"/>
            <TabBtn active={activeTab === 'clubs'} onClick={() => setActiveTab('clubs')} icon={Users} label="Clubs"/>
        </div>

        {/* --- Tab Content: COMPANIES --- */}
        {activeTab === 'companies' && (
            <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
                <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit space-y-4">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2"><Plus size={18}/> New Company</h2>
                    <form onSubmit={handleCompSubmit} className="space-y-3">
                        <Input label="Company Name" value={compForm.name} onChange={e => setCompForm({...compForm, name: e.target.value})}/>
                        <Input label="Logo URL" value={compForm.logo_url} onChange={e => setCompForm({...compForm, logo_url: e.target.value})}/>
                        <Input label="Positions (comma separated)" placeholder="Frontend, BA, SA" value={compForm.positions} onChange={e => setCompForm({...compForm, positions: e.target.value})}/>
                        <Input label="Wage (e.g. 500 THB/Day)" value={compForm.daily_wage} onChange={e => setCompForm({...compForm, daily_wage: e.target.value})}/>
                        {/* 🌟 ช่องใส่ Description */}
                        <TextArea label="Job Description" placeholder="Details about this company..." value={compForm.description} onChange={e => setCompForm({...compForm, description: e.target.value})}/>
                        
                        <button disabled={isSubmitting} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Save Company
                        </button>
                    </form>
                </div>
                <div className="md:col-span-2 space-y-3">
                    {companies.map((c, index) => (
                        <div 
                            key={c.id} 
                            // 🌟 ระบบลากวาง (Drag & Drop)
                            draggable
                            onDragStart={(e) => (dragItem.current = index)}
                            onDragEnter={(e) => (dragOverItem.current = index)}
                            onDragEnd={handleSort}
                            onDragOver={(e) => e.preventDefault()}
                            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-grab active:cursor-grabbing hover:border-blue-300 transition-colors"
                        >
                            <div className="text-gray-300 flex flex-col items-center">
                                <GripVertical size={20}/>
                                <span className="text-[10px] font-bold text-gray-400 mt-1">#{index + 1}</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                {c.logo_url ? <img src={c.logo_url} className="w-full h-full object-cover pointer-events-none"/> : <ImageIcon className="text-gray-300" size={20}/>}
                            </div>
                            <div className="flex-1 pointer-events-none">
                                <h4 className="font-bold text-gray-800 text-sm">{c.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{c.daily_wage}</p>
                            </div>
                            <button onClick={() => handleDelete('companies', c.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    ))}
                    <p className="text-xs text-gray-400 text-center mt-4">Tip: Drag and drop cards to reorder rankings.</p>
                </div>
            </div>
        )}

        {/* --- Tab Content: EVENTS --- */}
        {activeTab === 'events' && (
            <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
                <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit space-y-4">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2"><Plus size={18}/> New Event</h2>
                    <form onSubmit={handleEventSubmit} className="space-y-3">
                        <Input label="Event Title" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})}/>
                        <Input label="Image URL" value={eventForm.image_url} onChange={e => setEventForm({...eventForm, image_url: e.target.value})}/>
                        <Input label="Date & Time" type="datetime-local" value={eventForm.event_date} onChange={e => setEventForm({...eventForm, event_date: e.target.value})}/>
                        <Input label="Location" value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})}/>
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Hours" type="number" value={eventForm.activity_hours} onChange={e => setEventForm({...eventForm, activity_hours: e.target.value})}/>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Category</label>
                                <select className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm font-bold text-gray-600" value={eventForm.category} onChange={e => setEventForm({...eventForm, category: e.target.value})}>
                                    <option value="Tech">Tech</option><option value="Social">Social</option><option value="Staff">Staff</option>
                                </select>
                            </div>
                        </div>
                        {/* 🌟 ช่องใส่ Description */}
                        <TextArea label="Event Details" placeholder="What will we do?" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})}/>

                        <button disabled={isSubmitting} className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Post Event
                        </button>
                    </form>
                </div>
                <div className="md:col-span-2 space-y-3">
                    {events.map(e => (
                        <div key={e.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                {e.image_url ? <img src={e.image_url} className="w-full h-full object-cover"/> : <ImageIcon className="text-gray-300" size={20}/>}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 text-sm">{e.title}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{e.activity_hours} Hours | {e.location}</p>
                            </div>
                            <button onClick={() => openEventRequests(e)} className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 flex items-center gap-1">
                                <ListChecks size={14}/> Requests
                            </button>
                            <button onClick={() => handleDelete('events', e.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- Tab Content: CLUBS --- */}
        {activeTab === 'clubs' && (
            <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
                <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit space-y-4">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2"><Plus size={18}/> New Club</h2>
                    <form onSubmit={handleClubSubmit} className="space-y-3">
                        <Input label="Club Name" value={clubForm.name} onChange={e => setClubForm({...clubForm, name: e.target.value})}/>
                        <Input label="Logo URL" value={clubForm.logo_url} onChange={e => setClubForm({...clubForm, logo_url: e.target.value})}/>
                        <Input label="Member Count" type="number" value={clubForm.member_count} onChange={e => setClubForm({...clubForm, member_count: e.target.value})}/>
                        
                        {/* 🌟 ช่องใส่ Description */}
                        <TextArea label="Club Description" placeholder="Welcome message..." value={clubForm.description} onChange={e => setClubForm({...clubForm, description: e.target.value})}/>

                        <button disabled={isSubmitting} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Create Club
                        </button>
                    </form>
                </div>
                <div className="md:col-span-2 space-y-3">
                    {clubs.map(c => (
                        <div key={c.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                {c.logo_url ? <img src={c.logo_url} className="w-full h-full object-cover"/> : <ImageIcon className="text-gray-300" size={20}/>}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 text-sm">{c.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{c.member_count} Members</p>
                            </div>
                            <button onClick={() => openClubRequests(c)} className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100 flex items-center gap-1">
                                <ListChecks size={14}/> Requests
                            </button>
                            <button onClick={() => handleDelete('clubs', c.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>

      {/* 🛑 MODALS: จัดการคำขอ (Approvals) (เหมือนเดิม) */}
      {selectedEventForReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedEventForReq(null)}>
              <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                      <div>
                          <h2 className="text-lg font-bold text-gray-900">Approve Event: {selectedEventForReq.title}</h2>
                          <p className="text-xs text-gray-500">{eventRequests.length} Pending Requests</p>
                      </div>
                      <button onClick={() => setSelectedEventForReq(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-2">
                      {eventRequests.length === 0 ? <p className="p-6 text-center text-gray-400 text-sm">No pending requests.</p> : 
                          eventRequests.map(req => (
                              <div key={req.id} className="p-3 m-2 border rounded-xl flex items-center justify-between bg-white shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden shrink-0 border">
                                          {req.profiles?.avatar ? <img src={req.profiles.avatar} className="w-full h-full object-cover"/> : <Users className="p-2 text-gray-400"/>}
                                      </div>
                                      <div>
                                          <p className="font-bold text-gray-800 text-sm">{req.profiles?.first_name || 'Unknown'}</p>
                                          <p className="text-[10px] text-gray-400 font-mono">{req.profiles?.student_id}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <button onClick={() => handleApproveEvent(req.id, req.user_id, selectedEventForReq)} className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 hover:scale-110 transition-all"><Check size={16}/></button>
                                      <button onClick={() => handleRejectEvent(req.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 hover:scale-110 transition-all"><X size={16}/></button>
                                  </div>
                              </div>
                          ))
                      }
                  </div>
              </div>
          </div>
      )}

      {selectedClubForReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedClubForReq(null)}>
              <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                      <div>
                          <h2 className="text-lg font-bold text-gray-900">Approve Club: {selectedClubForReq.name}</h2>
                          <p className="text-xs text-gray-500">{clubRequests.length} Pending Requests</p>
                      </div>
                      <button onClick={() => setSelectedClubForReq(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-2">
                      {clubRequests.length === 0 ? <p className="p-6 text-center text-gray-400 text-sm">No pending requests.</p> : 
                          clubRequests.map(req => (
                              <div key={req.id} className="p-3 m-2 border rounded-xl flex items-center justify-between bg-white shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden shrink-0 border">
                                          {req.profiles?.avatar ? <img src={req.profiles.avatar} className="w-full h-full object-cover"/> : <Users className="p-2 text-gray-400"/>}
                                      </div>
                                      <div>
                                          <p className="font-bold text-gray-800 text-sm">{req.profiles?.first_name || 'Unknown'}</p>
                                          <p className="text-[10px] text-gray-400 font-mono">{req.profiles?.student_id}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <button onClick={() => handleApproveClub(req.id)} className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 hover:scale-110 transition-all"><Check size={16}/></button>
                                      <button onClick={() => handleRejectClub(req.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 hover:scale-110 transition-all"><X size={16}/></button>
                                  </div>
                              </div>
                          ))
                      }
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

// --- Internal Components ---
function TabBtn({ active, onClick, icon: Icon, label }) {
    return (
        <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
            <Icon size={18}/> {label}
        </button>
    )
}

function Input({ label, ...props }) {
    return (
        <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{label}</label>
            <input className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 ring-blue-500 outline-none" {...props} />
        </div>
    )
}

// 🌟 Component ใหม่สำหรับ Textarea (รายละเอียดแบบยาว)
function TextArea({ label, ...props }) {
    return (
        <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{label}</label>
            <textarea className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 ring-blue-500 outline-none min-h-[80px]" {...props} />
        </div>
    )
}