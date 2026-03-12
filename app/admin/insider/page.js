"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import PageSkeleton from "../../../components/PageSkeleton";
import { 
    ArrowLeft, Building2, Calendar, Users, Save, Trash2, 
    Plus, Loader2, Image as ImageIcon, Briefcase, ListChecks, Check, X,
    GripVertical, Edit3, RotateCcw, Upload, Link as LinkIcon, Crown
} from "lucide-react";

export default function AdminInsider() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("companies"); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());

  // Data Lists
  const [companies, setCompanies] = useState([]);
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);

  // Form States
  const [compForm, setCompForm] = useState({ name: "", logo_url: "", daily_wage: "", positions: "", description: "" });
  const [eventForm, setEventForm] = useState({ title: "", image_url: "", event_date: "", location: "", category: "Tech", activity_hours: 3, description: "" });
  const [clubForm, setClubForm] = useState({ name: "", logo_url: "", description: "", member_count: 0, social_link: "" });

  // File Upload States
  const [compFile, setCompFile] = useState(null);
  const [eventFile, setEventFile] = useState(null);
  const [clubFile, setClubFile] = useState(null);

  // States สำหรับ Approval & Members
  const [selectedEventForReq, setSelectedEventForReq] = useState(null);
  const [eventRequests, setEventRequests] = useState([]);
  
  const [selectedClubForReq, setSelectedClubForReq] = useState(null);
  const [clubRequests, setClubRequests] = useState([]);
  const [clubActiveMembers, setClubActiveMembers] = useState([]);
  const [clubReqTab, setClubReqTab] = useState('pending'); 

  // States สำหรับ Edit / Renew Modals
  const [editingComp, setEditingComp] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingClub, setEditingClub] = useState(null);
  const [renewingEvent, setRenewingEvent] = useState(null);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => setCurrentTime(new Date().toISOString()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const [compRes, eventRes, clubRes] = await Promise.all([
        supabase.from('companies').select('*').order('rank', { ascending: true }), 
        supabase.from('events').select('*').order('event_date', { ascending: false }), 
        supabase.from('clubs').select('*').order('created_at', { ascending: false })
    ]);
    setCompanies(compRes.data || []);
    setEvents(eventRes.data || []);
    setClubs(clubRes.data || []);
    setLoading(false);
  };

  // 🌟 ฟังก์ชันตัวช่วย: ส่ง Noti ให้เด็กทุกคน (Broadcast)
  const broadcastNotification = async (title, message, type) => {
      // ดึงรายชื่อนักศึกษาทั้งหมด (ไม่เอา OWNER/ADMIN)
      const { data: students } = await supabase.from('profiles').select('id').eq('role', 'STUDENT');
      if (!students || students.length === 0) return;

      const notis = students.map(student => ({
          user_id: student.id,
          title: title,
          message: message,
          type: type
      }));

      await supabase.from('notifications').insert(notis);
  };

  const uploadImage = async (file) => {
      if (!file) return null;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('insider').upload(fileName, file);
      if (error) { alert("Upload failed: " + error.message); return null; }
      const { data: publicUrlData } = supabase.storage.from('insider').getPublicUrl(fileName);
      return publicUrlData.publicUrl;
  };

  const handleSort = async () => {
    let _companies = [...companies];
    const draggedItemContent = _companies.splice(dragItem.current, 1)[0];
    _companies.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null; dragOverItem.current = null;
    setCompanies(_companies);
    for (let i = 0; i < _companies.length; i++) {
        await supabase.from('companies').update({ rank: i + 1 }).eq('id', _companies[i].id);
    }
  };

  const handleCompSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    let finalUrl = compForm.logo_url;
    if (compFile) { const uploadedUrl = await uploadImage(compFile); if (uploadedUrl) finalUrl = uploadedUrl; }
    
    const { error } = await supabase.from('companies').insert({
        ...compForm, logo_url: finalUrl, rank: 999, 
        positions: compForm.positions.split(',').map(p => p.trim())
    });
    if (!error) { 
        setCompForm({ name: "", logo_url: "", daily_wage: "", positions: "", description: "" }); 
        setCompFile(null); fetchData(); 
        // 🌟 ส่ง Noti ประกาศบริษัทใหม่
        broadcastNotification('New Company! 🏢', `${compForm.name} is looking for interns!`, 'company');
    }
    setIsSubmitting(false);
  };

  const handleEditCompSave = async (e) => {
      e.preventDefault(); setIsSubmitting(true);
      let finalUrl = editingComp.logo_url;
      if (compFile) { const uploadedUrl = await uploadImage(compFile); if (uploadedUrl) finalUrl = uploadedUrl; }
      
      const posArray = typeof editingComp.positions === 'string' ? editingComp.positions.split(',').map(p => p.trim()) : editingComp.positions;
      
      await supabase.from('companies').update({ ...editingComp, logo_url: finalUrl, positions: posArray }).eq('id', editingComp.id);
      setEditingComp(null); setCompFile(null); fetchData(); setIsSubmitting(false);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    let finalUrl = eventForm.image_url;
    if (eventFile) { const uploadedUrl = await uploadImage(eventFile); if (uploadedUrl) finalUrl = uploadedUrl; }

    const { error } = await supabase.from('events').insert({ ...eventForm, image_url: finalUrl, event_date: new Date(eventForm.event_date).toISOString() });
    if(!error) {
        setEventForm({ title: "", image_url: "", event_date: "", location: "", category: "Tech", activity_hours: 3, description: "" }); 
        setEventFile(null); fetchData(); 
        // 🌟 ส่ง Noti ประกาศ Event ใหม่
        broadcastNotification('New Event! 🎪', `${eventForm.title} is coming up. Join now!`, 'event');
    }
    setIsSubmitting(false);
  };

  const handleEditEventSave = async (e) => {
      e.preventDefault(); setIsSubmitting(true);
      let finalUrl = editingEvent.image_url;
      if (eventFile) { const uploadedUrl = await uploadImage(eventFile); if (uploadedUrl) finalUrl = uploadedUrl; }

      await supabase.from('events').update({ ...editingEvent, image_url: finalUrl, event_date: new Date(editingEvent.event_date).toISOString() }).eq('id', editingEvent.id);
      setEditingEvent(null); setEventFile(null); fetchData(); setIsSubmitting(false);
  };

  const handleRenewSave = async (e) => {
      e.preventDefault(); setIsSubmitting(true);
      await supabase.from('events').update({ event_date: new Date(renewingEvent.event_date).toISOString() }).eq('id', renewingEvent.id);
      setRenewingEvent(null); fetchData(); setIsSubmitting(false);
  };

  const openEventRequests = async (event) => {
      setSelectedEventForReq(event);
      const { data } = await supabase.from('event_participants').select('id, user_id, profiles(first_name, student_id, avatar)').eq('event_id', event.id).eq('status', 'pending');
      setEventRequests(data || []);
  };

  const handleApproveEvent = async (reqId, userId, event) => {
      await supabase.from('event_participants').update({ status: 'approved' }).eq('id', reqId);
      await supabase.from('activities').insert({ user_id: userId, name: event.title, category: event.category || 'General', hours: event.activity_hours });
      setEventRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleClubSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    let finalUrl = clubForm.logo_url;
    if (clubFile) { const uploadedUrl = await uploadImage(clubFile); if (uploadedUrl) finalUrl = uploadedUrl; }

    await supabase.from('clubs').insert({ ...clubForm, logo_url: finalUrl });
    setClubForm({ name: "", logo_url: "", description: "", member_count: 0, social_link: "" }); 
    setClubFile(null); fetchData(); setIsSubmitting(false);
  };

  const handleEditClubSave = async (e) => {
      e.preventDefault(); setIsSubmitting(true);
      let finalUrl = editingClub.logo_url;
      if (clubFile) { const uploadedUrl = await uploadImage(clubFile); if (uploadedUrl) finalUrl = uploadedUrl; }

      await supabase.from('clubs').update({ ...editingClub, logo_url: finalUrl }).eq('id', editingClub.id);
      setEditingClub(null); setClubFile(null); fetchData(); setIsSubmitting(false);
  };

  const openClubRequests = async (club) => {
      setSelectedClubForReq(club);
      setClubReqTab('pending');
      const [pendingRes, activeRes] = await Promise.all([
          supabase.from('club_members').select('id, user_id, profiles(first_name, student_id, avatar)').eq('club_id', club.id).eq('status', 'pending'),
          supabase.from('club_members').select('id, user_id, profiles(first_name, student_id, avatar)').eq('club_id', club.id).eq('status', 'approved')
      ]);
      setClubRequests(pendingRes.data || []);
      setClubActiveMembers(activeRes.data || []);
  };

  // 🌟 อัปเดต: ให้รับ userId และ club มาด้วย เพื่อส่ง Noti
  const handleApproveClub = async (reqId, userId, club) => {
      await supabase.from('club_members').update({ status: 'approved' }).eq('id', reqId);
      
      // 🌟 ยิง Noti หา User คนที่โดน Approve
      await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Club Approved! 🎉',
          message: `Welcome to ${club.name}!`,
          type: 'club'
      });

      const approvedUser = clubRequests.find(r => r.id === reqId);
      setClubRequests(prev => prev.filter(r => r.id !== reqId));
      if (approvedUser) setClubActiveMembers(prev => [...prev, approvedUser]);
  };

  const handleDelete = async (table, id) => {
      if (!confirm("Are you sure you want to delete this item?")) return;
      await supabase.from(table).delete().eq('id', id);
      fetchData();
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-24 flex justify-center">
      <div className="w-full max-w-5xl space-y-6">
        
        <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">SIT Insider Admin 🛠️</h1>
                <p className="text-gray-500 text-xs md:text-sm">Manage companies, events, and clubs.</p>
            </div>
        </div>

        <div className="flex bg-white p-1 rounded-2xl shadow-sm border overflow-x-auto no-scrollbar">
            <TabBtn active={activeTab === 'companies'} onClick={() => setActiveTab('companies')} icon={Building2} label="Companies"/>
            <TabBtn active={activeTab === 'events'} onClick={() => setActiveTab('events')} icon={Calendar} label="Events"/>
            <TabBtn active={activeTab === 'clubs'} onClick={() => setActiveTab('clubs')} icon={Users} label="Clubs"/>
        </div>

        {/* 🏢 TAB: COMPANIES */}
        {activeTab === 'companies' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                <div className="lg:col-span-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-100 h-fit space-y-4">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2"><Plus size={18}/> New Company</h2>
                    <form onSubmit={handleCompSubmit} className="space-y-3">
                        <Input label="Company Name" required value={compForm.name} onChange={e => setCompForm({...compForm, name: e.target.value})}/>
                        <FileInput label="Upload Logo (Or Paste URL)" onChange={e => setCompFile(e.target.files[0])} file={compFile} />
                        <Input placeholder="https://..." value={compForm.logo_url} onChange={e => setCompForm({...compForm, logo_url: e.target.value})}/>
                        <Input label="Positions (comma separated)" placeholder="Frontend, BA, SA" value={compForm.positions} onChange={e => setCompForm({...compForm, positions: e.target.value})}/>
                        <Input label="Wage (e.g. 500 THB/Day)" value={compForm.daily_wage} onChange={e => setCompForm({...compForm, daily_wage: e.target.value})}/>
                        <TextArea label="Job Description" value={compForm.description} onChange={e => setCompForm({...compForm, description: e.target.value})}/>
                        <button disabled={isSubmitting} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Save Company
                        </button>
                    </form>
                </div>
                <div className="lg:col-span-2 space-y-3">
                    {companies.map((c, index) => (
                        <div key={c.id} draggable onDragStart={() => (dragItem.current = index)} onDragEnter={() => (dragOverItem.current = index)} onDragEnd={handleSort} onDragOver={(e) => e.preventDefault()}
                            className="bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap md:flex-nowrap items-center gap-3 cursor-grab hover:border-blue-300">
                            <div className="text-gray-300 flex flex-col items-center shrink-0">
                                <GripVertical size={20}/><span className="text-[10px] font-bold mt-1">#{index + 1}</span>
                            </div>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                                {c.logo_url ? <img src={c.logo_url} className="w-full h-full object-cover pointer-events-none"/> : <ImageIcon className="text-gray-300" size={20}/>}
                            </div>
                            <div className="flex-1 min-w-[150px] pointer-events-none">
                                <h4 className="font-bold text-gray-800 text-sm truncate">{c.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{c.daily_wage}</p>
                            </div>
                            <div className="flex items-center gap-1 w-full md:w-auto justify-end mt-2 md:mt-0 border-t md:border-t-0 pt-2 md:pt-0">
                                <button onClick={() => setEditingComp(c)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg flex items-center gap-1 text-xs font-bold"><Edit3 size={14}/> Edit</button>
                                <button onClick={() => handleDelete('companies', c.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 🎪 TAB: EVENTS */}
        {activeTab === 'events' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                <div className="lg:col-span-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-100 h-fit space-y-4">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2"><Plus size={18}/> New Event</h2>
                    <form onSubmit={handleEventSubmit} className="space-y-3">
                        <Input label="Event Title" required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})}/>
                        <FileInput label="Upload Image (Or Paste URL)" onChange={e => setEventFile(e.target.files[0])} file={eventFile} />
                        <Input placeholder="https://..." value={eventForm.image_url} onChange={e => setEventForm({...eventForm, image_url: e.target.value})}/>
                        <Input label="Date & Time" type="datetime-local" required value={eventForm.event_date} onChange={e => setEventForm({...eventForm, event_date: e.target.value})}/>
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
                        <TextArea label="Event Details" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})}/>
                        <button disabled={isSubmitting} className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 flex items-center justify-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Post Event
                        </button>
                    </form>
                </div>
                <div className="lg:col-span-2 space-y-3">
                    {events.map(e => {
                        const isExpired = new Date(e.event_date) < new Date(currentTime);
                        return (
                        <div key={e.id} className={`bg-white p-3 md:p-4 rounded-2xl border ${isExpired ? 'border-red-200 bg-red-50/30' : 'border-gray-100'} shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3`}>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center relative">
                                    {e.image_url ? <img src={e.image_url} className="w-full h-full object-cover"/> : <ImageIcon className="text-gray-300" size={20}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-800 text-sm truncate">{e.title}</h4>
                                        {isExpired && <span className="bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded-md font-bold">Expired</span>}
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase truncate">{new Date(e.event_date).toLocaleString()} | {e.activity_hours} Hrs</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1 w-full md:w-auto justify-end mt-2 md:mt-0 border-t md:border-t-0 pt-2 md:pt-0">
                                {isExpired && (
                                    <button onClick={() => setRenewingEvent(e)} className="px-2 py-1.5 text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1 text-xs font-bold border border-green-200">
                                        <RotateCcw size={14}/> Renew
                                    </button>
                                )}
                                <button onClick={() => setEditingEvent(e)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg flex items-center gap-1 text-xs font-bold"><Edit3 size={14}/></button>
                                <button onClick={() => openEventRequests(e)} className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 flex items-center gap-1">
                                    <ListChecks size={14}/> Requests
                                </button>
                                <button onClick={() => handleDelete('events', e.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        )}

        {/* 🎸 TAB: CLUBS */}
        {activeTab === 'clubs' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                <div className="lg:col-span-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-100 h-fit space-y-4">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2"><Plus size={18}/> New Club</h2>
                    <form onSubmit={handleClubSubmit} className="space-y-3">
                        <Input label="Club Name" required value={clubForm.name} onChange={e => setClubForm({...clubForm, name: e.target.value})}/>
                        <FileInput label="Upload Logo (Or Paste URL)" onChange={e => setClubFile(e.target.files[0])} file={clubFile} />
                        <Input placeholder="https://..." value={clubForm.logo_url} onChange={e => setClubForm({...clubForm, logo_url: e.target.value})}/>
                        <Input label="Social Group Link (Line/Discord)" placeholder="https://line.me/..." value={clubForm.social_link} onChange={e => setClubForm({...clubForm, social_link: e.target.value})}/>
                        <Input label="Member Count" type="number" value={clubForm.member_count} onChange={e => setClubForm({...clubForm, member_count: e.target.value})}/>
                        <TextArea label="Club Description" value={clubForm.description} onChange={e => setClubForm({...clubForm, description: e.target.value})}/>
                        <button disabled={isSubmitting} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 flex items-center justify-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Create Club
                        </button>
                    </form>
                </div>
                <div className="lg:col-span-2 space-y-3">
                    {clubs.map(c => (
                        <div key={c.id} className="bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                    {c.logo_url ? <img src={c.logo_url} className="w-full h-full object-cover"/> : <ImageIcon className="text-gray-300" size={20}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 text-sm truncate">{c.name}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{c.member_count} Members</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1 w-full md:w-auto justify-end mt-2 md:mt-0 border-t md:border-t-0 pt-2 md:pt-0">
                                {c.social_link && <a href={c.social_link} target="_blank" className="p-2 text-gray-400 hover:text-blue-500"><LinkIcon size={16}/></a>}
                                <button onClick={() => setEditingClub(c)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg flex items-center gap-1 text-xs font-bold"><Edit3 size={14}/></button>
                                <button onClick={() => openClubRequests(c)} className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100 flex items-center gap-1">
                                    <Users size={14}/> Members
                                </button>
                                <button onClick={() => handleDelete('clubs', c.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>

      {/* 🛑 MODALS: จัดการคำขอ และแก้ไขข้อมูล */}
      {editingComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingComp(null)}>
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Edit Company</h2>
                    <button onClick={() => setEditingComp(null)} className="text-gray-400"><X size={20}/></button>
                </div>
                <form onSubmit={handleEditCompSave} className="space-y-3">
                    <Input label="Name" value={editingComp.name} onChange={e => setEditingComp({...editingComp, name: e.target.value})}/>
                    <FileInput label="Change Logo" onChange={e => setCompFile(e.target.files[0])} file={compFile} />
                    <Input label="Positions" value={typeof editingComp.positions === 'object' ? editingComp.positions.join(', ') : editingComp.positions} onChange={e => setEditingComp({...editingComp, positions: e.target.value})}/>
                    <Input label="Wage" value={editingComp.daily_wage} onChange={e => setEditingComp({...editingComp, daily_wage: e.target.value})}/>
                    <TextArea label="Description" value={editingComp.description} onChange={e => setEditingComp({...editingComp, description: e.target.value})}/>
                    <button disabled={isSubmitting} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4 flex justify-center">{isSubmitting ? <Loader2 className="animate-spin"/> : 'Save Changes'}</button>
                </form>
            </div>
        </div>
      )}

      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingEvent(null)}>
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Edit Event</h2>
                    <button onClick={() => setEditingEvent(null)} className="text-gray-400"><X size={20}/></button>
                </div>
                <form onSubmit={handleEditEventSave} className="space-y-3">
                    <Input label="Title" value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})}/>
                    <FileInput label="Change Image" onChange={e => setEventFile(e.target.files[0])} file={eventFile} />
                    <Input label="Date & Time" type="datetime-local" value={new Date(new Date(editingEvent.event_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16)} onChange={e => setEditingEvent({...editingEvent, event_date: e.target.value})}/>
                    <Input label="Location" value={editingEvent.location} onChange={e => setEditingEvent({...editingEvent, location: e.target.value})}/>
                    <Input label="Hours" type="number" value={editingEvent.activity_hours} onChange={e => setEditingEvent({...editingEvent, activity_hours: e.target.value})}/>
                    <TextArea label="Details" value={editingEvent.description} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})}/>
                    <button disabled={isSubmitting} className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold mt-4 flex justify-center">{isSubmitting ? <Loader2 className="animate-spin"/> : 'Save Changes'}</button>
                </form>
            </div>
        </div>
      )}

      {renewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setRenewingEvent(null)}>
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4"><RotateCcw size={24} className="text-green-500"/></div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Renew Event</h2>
                <p className="text-xs text-gray-500 mb-6">Select a new future date for "{renewingEvent.title}" to make it active again.</p>
                <form onSubmit={handleRenewSave}>
                    <div className="text-left mb-6">
                        <Input label="New Date & Time" type="datetime-local" required value={new Date(new Date(renewingEvent.event_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16)} onChange={e => setRenewingEvent({...renewingEvent, event_date: e.target.value})}/>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setRenewingEvent(null)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold flex justify-center">{isSubmitting ? <Loader2 className="animate-spin"/> : 'Renew Now'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {editingClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingClub(null)}>
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Edit Club</h2>
                    <button onClick={() => setEditingClub(null)} className="text-gray-400"><X size={20}/></button>
                </div>
                <form onSubmit={handleEditClubSave} className="space-y-3">
                    <Input label="Name" value={editingClub.name} onChange={e => setEditingClub({...editingClub, name: e.target.value})}/>
                    <FileInput label="Change Logo" onChange={e => setClubFile(e.target.files[0])} file={clubFile} />
                    <Input label="Social Link (Line/Discord)" value={editingClub.social_link || ''} onChange={e => setEditingClub({...editingClub, social_link: e.target.value})}/>
                    <Input label="Member Count" type="number" value={editingClub.member_count} onChange={e => setEditingClub({...editingClub, member_count: e.target.value})}/>
                    <TextArea label="Description" value={editingClub.description} onChange={e => setEditingClub({...editingClub, description: e.target.value})}/>
                    <button disabled={isSubmitting} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold mt-4 flex justify-center">{isSubmitting ? <Loader2 className="animate-spin"/> : 'Save Changes'}</button>
                </form>
            </div>
        </div>
      )}

      {selectedEventForReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEventForReq(null)}>
              <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                      <div><h2 className="text-lg font-bold text-gray-900">Approve Event: {selectedEventForReq.title}</h2><p className="text-xs text-gray-500">{eventRequests.length} Pending</p></div>
                      <button onClick={() => setSelectedEventForReq(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-2">
                      {eventRequests.length === 0 ? <p className="p-6 text-center text-gray-400 text-sm">No pending requests.</p> : 
                          eventRequests.map(req => (
                              <div key={req.id} className="p-3 m-2 border rounded-xl flex items-center justify-between bg-white shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <img src={req.profiles?.avatar} className="w-10 h-10 rounded-full object-cover border bg-gray-100"/>
                                      <div><p className="font-bold text-gray-800 text-sm">{req.profiles?.first_name}</p><p className="text-[10px] text-gray-400">{req.profiles?.student_id}</p></div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <button onClick={() => handleApproveEvent(req.id, req.user_id, selectedEventForReq)} className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100"><Check size={16}/></button>
                                  </div>
                              </div>
                          ))
                      }
                  </div>
              </div>
          </div>
      )}

      {/* 🌟 🛡️ Modal: Club Requests (เปลี่ยนให้ดึงข้อมูล User และ Club ไปด้วย) */}
      {selectedClubForReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedClubForReq(null)}>
              <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                      <div><h2 className="text-lg font-bold text-gray-900">Club: {selectedClubForReq.name}</h2></div>
                      <button onClick={() => setSelectedClubForReq(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <div className="flex border-b">
                      <button onClick={() => setClubReqTab('pending')} className={`flex-1 py-3 text-sm font-bold ${clubReqTab === 'pending' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-400'}`}>Pending ({clubRequests.length})</button>
                      <button onClick={() => setClubReqTab('active')} className={`flex-1 py-3 text-sm font-bold ${clubReqTab === 'active' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-400'}`}>Active Members ({clubActiveMembers.length})</button>
                  </div>
                  <div className="max-h-[50vh] overflow-y-auto p-2 bg-gray-50/50">
                      {clubReqTab === 'pending' ? (
                          clubRequests.length === 0 ? <p className="p-6 text-center text-gray-400 text-sm">No pending requests.</p> : 
                          clubRequests.map(req => (
                              <div key={req.id} className="p-3 m-2 border rounded-xl flex items-center justify-between bg-white shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <img src={req.profiles?.avatar} className="w-10 h-10 rounded-full object-cover border bg-gray-100"/>
                                      <div><p className="font-bold text-gray-800 text-sm">{req.profiles?.first_name}</p><p className="text-[10px] text-gray-400">{req.profiles?.student_id}</p></div>
                                  </div>
                                  {/* 🌟 ส่ง req.user_id และ selectedClubForReq ไปในฟังก์ชันด้วย! */}
                                  <button onClick={() => handleApproveClub(req.id, req.user_id, selectedClubForReq)} className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 text-xs font-bold hover:bg-purple-100">Approve</button>
                              </div>
                          ))
                      ) : (
                          clubActiveMembers.length === 0 ? <p className="p-6 text-center text-gray-400 text-sm">No members yet.</p> : 
                          clubActiveMembers.map(member => (
    <div key={member.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
        <div className="flex items-center gap-3">
            <img src={member.profiles?.avatar} className="w-10 h-10 rounded-full object-cover border bg-gray-100"/>
            <div>
                <p className="font-bold text-sm text-gray-800 flex items-center gap-1">
                    {member.profiles?.first_name} 
                    {member.role === 'president' && <span className="bg-yellow-100 text-yellow-600 text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1"><Crown size={12}/> Pres</span>}
                </p>
                <p className="text-[10px] text-gray-400">{member.profiles?.student_id}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            {/* 🌟 ปุ่มแต่งตั้งประธาน */}
            {member.role !== 'president' && (
                <button 
                    onClick={async () => {
                        if(!confirm(`Make ${member.profiles?.first_name} the President?`)) return;
                        await supabase.from('club_members').update({ role: 'president' }).eq('id', member.id);
                        alert("แต่งตั้งประธานเรียบร้อย! (กรุณาปิดหน้าต่างแล้วเปิดใหม่เพื่อรีเฟรช)");
                    }} 
                    className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    title="Make President"
                >
                    <Crown size={16}/>
                </button>
            )}
            <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">Member</span>
        </div>
    </div>
))
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
    return (
        <button onClick={onClick} className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${active ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
            <Icon size={16} className="md:w-4 md:h-4"/> <span>{label}</span>
        </button>
    )
}

function Input({ label, ...props }) {
    return (
        <div>
            {label && <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{label}</label>}
            <input className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 ring-blue-500 outline-none" {...props} />
        </div>
    )
}

function TextArea({ label, ...props }) {
    return (
        <div>
            {label && <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{label}</label>}
            <textarea className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 ring-blue-500 outline-none min-h-[80px]" {...props} />
        </div>
    )
}

function FileInput({ label, onChange, file }) {
    return (
        <div>
            {label && <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{label}</label>}
            <div className="mt-1">
                <label className="flex items-center justify-center w-full px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors border border-blue-100 border-dashed">
                    <Upload size={16} className="mr-2" />
                    <span className="text-sm font-bold truncate max-w-[200px]">{file ? file.name : "Choose File from Device"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={onChange} />
                </label>
            </div>
        </div>
    )
}