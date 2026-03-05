"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase"; 
import { useRouter } from "next/navigation";
import { 
    Building2, Calendar, Users, MapPin, Clock, 
    Briefcase, ArrowRight, Loader2, Trophy, CheckCircle, PlusCircle, X
} from "lucide-react";

export default function SITInsider() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [user, setUser] = useState(null);

  const [joinedEvents, setJoinedEvents] = useState({});
  const [joinedClubs, setJoinedClubs] = useState({});
  const [showAllCompanies, setShowAllCompanies] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/register"); return; }
    setUser(user);

    const currentTime = new Date().toISOString();

    const [compRes, eventRes, clubRes, joinedEvtRes, joinedClubRes] = await Promise.all([
        supabase.from('companies').select('*').order('rank', { ascending: true }),
        supabase.from('events').select('*').gte('event_date', currentTime).order('event_date', { ascending: true }),
        supabase.from('clubs').select('*').order('member_count', { ascending: false }),
        supabase.from('event_participants').select('event_id, status').eq('user_id', user.id),
        supabase.from('club_members').select('club_id, status').eq('user_id', user.id)
    ]);

    setCompanies(compRes.data || []);
    setEvents(eventRes.data || []);
    setClubs(clubRes.data || []);
    
    const evtStatusMap = {};
    joinedEvtRes.data?.forEach(e => evtStatusMap[e.event_id] = e.status);
    setJoinedEvents(evtStatusMap);

    const clubStatusMap = {};
    joinedClubRes.data?.forEach(c => clubStatusMap[c.club_id] = c.status);
    setJoinedClubs(clubStatusMap);
    
    setLoading(false);
  };

  const handleJoinEvent = async (e, eventId) => {
      e.stopPropagation(); 
      if (joinedEvents[eventId]) return;
      const { error } = await supabase.from('event_participants').insert({ event_id: eventId, user_id: user.id });
      if (!error) {
          setJoinedEvents(prev => ({ ...prev, [eventId]: 'pending' }));
          alert("ส่งคำขอเข้าร่วมแล้ว! รอ Admin อนุมัติเพื่อรับชั่วโมงกิจกรรม ⏳");
      }
  };

  const handleJoinClub = async (e, clubId) => {
      e.stopPropagation(); 
      if (joinedClubs[clubId]) return;
      const { error } = await supabase.from('club_members').insert({ club_id: clubId, user_id: user.id });
      if (!error) {
          setJoinedClubs(prev => ({ ...prev, [clubId]: 'pending' }));
          alert("ส่งคำขอเข้าชมรมแล้ว! รอประธาน/Admin อนุมัติ ⏳");
      }
  };

  // 🌟 ฟังก์ชันแปลงเวลา (ตัดวินาทีทิ้ง โชว์แค่ ชม:นาที)
  const formatDateTime = (isoString) => {
      const date = new Date(isoString);
      return date.toLocaleDateString('th-TH') + ' ' + date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const displayedCompanies = showAllCompanies ? companies : companies.slice(0, 3);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-10 pt-20 relative">
      <div className="max-w-4xl mx-auto p-6 space-y-10">
        
        {/* Header */}
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900">SIT Insider 🔥</h1>
            <p className="text-gray-500 font-medium mt-1">Discover companies, events, and clubs in our faculty.</p>
        </div>

        {/* 🏢 1. Top Company */}
        <section>
            <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Building2 className="text-blue-500"/> Top Company</h2>
                {companies.length > 3 && (
                    <button onClick={() => setShowAllCompanies(!showAllCompanies)} className="text-xs font-bold text-blue-600 hover:underline">
                        {showAllCompanies ? "Show Less" : "View All"}
                    </button>
                )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                {companies.length === 0 ? <EmptyState text="No companies listed yet."/> : 
                    displayedCompanies.map((comp, index) => (
                        <div key={comp.id} onClick={() => setSelectedCompany(comp)} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 cursor-pointer relative overflow-hidden">
                            {!showAllCompanies && index < 3 && (
                                <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold text-white rounded-bl-xl ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                                    Rank {index + 1}
                                </div>
                            )}
                            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                                {comp.logo_url ? <img src={comp.logo_url} className="w-full h-full object-cover"/> : <Briefcase className="text-gray-400"/>}
                            </div>
                            <div className="flex-1 mt-1">
                                <h3 className="font-bold text-gray-800 text-lg leading-tight">{comp.name}</h3>
                                <p className="text-[11px] font-bold text-green-600 mt-1">{comp.daily_wage || 'Negotiable'}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {comp.positions?.slice(0, 3).map((pos, idx) => (
                                        <span key={idx} className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{pos}</span>
                                    ))}
                                    {comp.positions?.length > 3 && <span className="text-[10px] text-gray-400">+{comp.positions.length - 3}</span>}
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </section>

        {/* 🎪 2. Events (🌟 อัปเดต UI เลื่อนซ้ายขวา และบีบขนาดให้พอดีจอ) */}
        <section>
            <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Calendar className="text-orange-500"/> Upcoming Events</h2>
            </div>
            {/* เอา md:grid ออก เปลี่ยนให้ใช้ flex เลื่อนซ้ายขวาล้วนๆ */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar">
                {events.length === 0 ? <div className="w-full"><EmptyState text="No upcoming events."/></div> : 
                    events.map(evt => {
                        const userStatus = joinedEvents[evt.id]; 
                        const isJoinedOrPending = userStatus === 'pending' || userStatus === 'approved';

                        return (
                            // 🌟 บังคับความกว้าง (Mobile 280px / Desktop 300px) การ์ดจะได้ไม่ล้นจอ
                            <div key={evt.id} onClick={() => setSelectedEvent(evt)} className="w-[280px] md:w-[300px] shrink-0 snap-start bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-all">
                                <div className="h-32 bg-gray-200 relative w-full">
                                    {evt.image_url ? <img src={evt.image_url} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gradient-to-tr from-orange-200 to-red-300"></div>}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 text-orange-600 shadow-sm">
                                        <Trophy size={12}/> +{evt.activity_hours} Hrs
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{evt.category || 'General'}</span>
                                    <h3 className="font-bold text-gray-800 leading-tight mb-3 line-clamp-2">{evt.title}</h3>
                                    
                                    <div className="space-y-1 mb-4 mt-auto">
                                        <p className="text-xs text-gray-500 flex items-center gap-2"><Clock size={12}/> {formatDateTime(evt.event_date)}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-2"><MapPin size={12}/> {evt.location || 'TBA'}</p>
                                    </div>

                                    <button 
                                        onClick={(e) => handleJoinEvent(e, evt.id)}
                                        disabled={isJoinedOrPending}
                                        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all 
                                            ${userStatus === 'approved' ? 'bg-green-50 text-green-600' 
                                            : userStatus === 'pending' ? 'bg-orange-50 text-orange-600' 
                                            : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                                    >
                                        {userStatus === 'approved' ? <><CheckCircle size={16}/> Joined</> 
                                         : userStatus === 'pending' ? <><Clock size={16}/> Requested</> 
                                         : 'Quick Join'}
                                    </button>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </section>

        {/* 📚 3. SIT Elective & Cert */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold mb-1">SIT Electives & Certs</h2>
                    <p className="text-sm text-blue-100 opacity-90">Find easy-A subjects and free certifications.</p>
                </div>
                <button onClick={() => alert("Coming Soon! 🚀")} className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors">
                    Explore
                </button>
            </div>
        </section>

        {/* 🎸 4. All Clubs */}
        <section>
            <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Users className="text-purple-500"/> All Clubs</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {clubs.length === 0 ? <div className="col-span-full"><EmptyState text="No clubs available."/></div> : 
                    clubs.map(club => {
                        const userStatus = joinedClubs[club.id];
                        const isJoinedOrPending = userStatus === 'pending' || userStatus === 'approved';

                        return (
                            <div key={club.id} onClick={() => setSelectedClub(club)} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col items-center hover:shadow-md transition-all cursor-pointer">
                                <div className="w-16 h-16 bg-purple-50 rounded-full mb-3 flex items-center justify-center overflow-hidden">
                                    {club.logo_url ? <img src={club.logo_url} className="w-full h-full object-cover"/> : <Users className="text-purple-300" size={24}/>}
                                </div>
                                <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">{club.name}</h3>
                                <p className="text-[10px] text-gray-400 font-bold mb-4">{club.member_count} Members</p>
                                
                                <button 
                                    onClick={(e) => handleJoinClub(e, club.id)}
                                    disabled={isJoinedOrPending}
                                    className={`w-full mt-auto py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all 
                                        ${userStatus === 'approved' ? 'bg-green-50 text-green-600' 
                                        : userStatus === 'pending' ? 'bg-purple-50 text-purple-600' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    {userStatus === 'approved' ? <><CheckCircle size={14}/> Joined</> 
                                     : userStatus === 'pending' ? <><Clock size={14}/> Requested</> 
                                     : <><PlusCircle size={14}/> Join</>}
                                </button>
                            </div>
                        )
                    })
                }
            </div>
        </section>
      </div>

      {/* ========================================= */}
      {/* 🛑 MODALS */}
      {/* ========================================= */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedCompany(null)}>
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex items-start gap-4 relative">
                    <button onClick={() => setSelectedCompany(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                        {selectedCompany.logo_url ? <img src={selectedCompany.logo_url} className="w-full h-full object-cover"/> : <Briefcase size={32} className="text-gray-300"/>}
                    </div>
                    <div className="pt-2">
                        <h2 className="text-2xl font-bold text-gray-900">{selectedCompany.name}</h2>
                        <p className="text-sm font-bold text-green-600 mt-1">{selectedCompany.daily_wage || 'Salary Negotiable'}</p>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 max-h-[60vh] overflow-y-auto">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Available Roles</h4>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {selectedCompany.positions?.map((pos, idx) => (
                            <span key={idx} className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200">{pos}</span>
                        ))}
                    </div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About Company</h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {selectedCompany.description || "No description provided."}
                    </p>
                </div>
            </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedEvent(null)}>
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="h-48 bg-gray-200 relative">
                    <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 text-white bg-black/30 p-1.5 rounded-full hover:bg-black/50 z-10"><X size={20}/></button>
                    {selectedEvent.image_url ? <img src={selectedEvent.image_url} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gradient-to-tr from-orange-300 to-red-400"></div>}
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-gray-900 pr-4">{selectedEvent.title}</h2>
                        <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full shrink-0 flex items-center gap-1">
                            <Trophy size={12}/> +{selectedEvent.activity_hours} Hrs
                        </span>
                    </div>
                    <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-sm text-gray-600 flex items-center gap-3"><Clock size={16} className="text-gray-400"/> <strong>Date:</strong> {formatDateTime(selectedEvent.event_date)}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-3"><MapPin size={16} className="text-gray-400"/> <strong>Location:</strong> {selectedEvent.location || 'TBA'}</p>
                    </div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event Details</h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-6">
                        {selectedEvent.description || "No description provided."}
                    </p>
                    
                    <button 
                        onClick={(e) => { handleJoinEvent(e, selectedEvent.id); setSelectedEvent(null); }}
                        disabled={joinedEvents[selectedEvent.id] === 'pending' || joinedEvents[selectedEvent.id] === 'approved'}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all 
                            ${joinedEvents[selectedEvent.id] === 'approved' ? 'bg-green-50 text-green-600' 
                            : joinedEvents[selectedEvent.id] === 'pending' ? 'bg-orange-50 text-orange-600' 
                            : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                    >
                        {joinedEvents[selectedEvent.id] === 'approved' ? <><CheckCircle size={20}/> You're In! (Joined)</>
                         : joinedEvents[selectedEvent.id] === 'pending' ? <><Clock size={20}/> Requested (Pending)</>
                         : 'Request to Join Event'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {selectedClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedClub(null)}>
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl text-center p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedClub(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
                <div className="w-24 h-24 bg-purple-50 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                    {selectedClub.logo_url ? <img src={selectedClub.logo_url} className="w-full h-full object-cover"/> : <Users className="text-purple-300" size={32}/>}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedClub.name}</h2>
                <p className="text-xs font-bold text-purple-600 bg-purple-50 w-fit mx-auto px-3 py-1 rounded-full mb-6">{selectedClub.member_count} Members Active</p>
                
                <p className="text-sm text-gray-600 leading-relaxed mb-8">
                    {selectedClub.description || "Join us to learn, share, and grow together!"}
                </p>

                <button 
                    onClick={(e) => { handleJoinClub(e, selectedClub.id); setSelectedClub(null); }}
                    disabled={joinedClubs[selectedClub.id] === 'pending' || joinedClubs[selectedClub.id] === 'approved'}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all 
                        ${joinedClubs[selectedClub.id] === 'approved' ? 'bg-green-50 text-green-600' 
                        : joinedClubs[selectedClub.id] === 'pending' ? 'bg-purple-50 text-purple-600' 
                        : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                >
                    {joinedClubs[selectedClub.id] === 'approved' ? <><CheckCircle size={18}/> Member</>
                     : joinedClubs[selectedClub.id] === 'pending' ? <><Clock size={18}/> Request Sent</>
                     : 'Join this Club'}
                </button>
            </div>
        </div>
      )}

    </div>
  );
}

function EmptyState({text}) {
    return (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400">
            <p className="text-sm font-bold">{text}</p>
        </div>
    )
}