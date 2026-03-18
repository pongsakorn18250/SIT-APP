"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  ArrowLeft, MessageSquare, Calendar, Users, 
  Crown, Send, Trash2, CheckCircle, X, Clock, MapPin, 
  MoreVertical, Edit3, Pin, BellRing
} from "lucide-react";

export default function ClubBoard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  const [club, setClub] = useState(null);
  const [isPresident, setIsPresident] = useState(false);
  const [activeTab, setActiveTab] = useState("feed"); 

  const [posts, setPosts] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const [newPost, setNewPost] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const [meetingForm, setMeetingForm] = useState({ title: "", meeting_date: "", location: "" });
  
  // 🌟 States สำหรับ Edit Post
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState("");

  useEffect(() => {
    fetchClubData();
  }, []);

  const fetchClubData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    setUser(user);

    const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(userProfile);

    const { data: memberData } = await supabase.from('club_members').select('club_id, role, status').eq('user_id', user.id).single();
    if (!memberData || memberData.status !== 'approved') {
      toast.error("คุณยังไม่ได้เป็นสมาชิกชมรมใดเลย!");
      router.push("/");
      return;
    }

    setIsPresident(memberData.role === 'president');

    const { data: clubData } = await supabase.from('clubs').select('*').eq('id', memberData.club_id).single();
    setClub(clubData);

    // 🌟 ดึงโพสต์และจัดเรียง (ปักหมุดอยู่บนสุด -> ตามด้วยเวลาล่าสุด)
    const { data: postsData } = await supabase
      .from('club_posts')
      .select(`*, profiles:author_id(first_name, avatar), club_comments(*, profiles:author_id(first_name, avatar))`)
      .eq('club_id', clubData.id)
      .order('is_pinned', { ascending: false }) // ปักหมุดขึ้นก่อน
      .order('created_at', { ascending: false }); // แล้วเรียงเวลา
    
    const sortedPosts = postsData?.map(p => ({
        ...p,
        club_comments: p.club_comments.sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
    }));
    setPosts(sortedPosts || []);

    const { data: meetingsData } = await supabase.from('club_meetings').select('*').eq('club_id', clubData.id).order('meeting_date', { ascending: true });
    setMeetings(meetingsData || []);

    const { data: allMembers } = await supabase.from('club_members').select('*, profiles(first_name, student_id, avatar)').eq('club_id', clubData.id);
    setMembers(allMembers.filter(m => m.status === 'approved') || []);
    
    if (memberData.role === 'president') {
        setPendingRequests(allMembers.filter(m => m.status === 'pending') || []);
    }

    setLoading(false);
  };

  const notifyClubMembers = async (title, message, type) => {
      const notis = members.filter(m => m.user_id !== user.id).map(m => ({ user_id: m.user_id, title, message, type }));
      if (notis.length > 0) await supabase.from('notifications').insert(notis);
  };

  // ==================== FEED ACTIONS ====================
  const handleCreatePost = async (e) => {
      e.preventDefault();
      if (!newPost.trim()) return;
      await supabase.from('club_posts').insert({ club_id: club.id, author_id: user.id, content: newPost });
      await notifyClubMembers('📢 New Club Announcement', `${profile.first_name} posted: ${newPost.substring(0, 20)}...`, 'club');
      setNewPost(""); fetchClubData(); 
  };

  // 🌟 ฟังก์ชันจัดการโพสต์ (ลบ/ปักหมุด/แก้)
  const handleDeletePost = async (postId) => {
      if(!confirm("ลบประกาศนี้ใช่หรือไม่?")) return;
      await supabase.from('club_posts').delete().eq('id', postId);
      fetchClubData();
  };

  const handlePinPost = async (postId, currentPinStatus) => {
      await supabase.from('club_posts').update({ is_pinned: !currentPinStatus }).eq('id', postId);
      fetchClubData();
  };

  const handleSaveEditPost = async (postId) => {
      if(!editPostContent.trim()) return;
      await supabase.from('club_posts').update({ content: editPostContent }).eq('id', postId);
      setEditingPostId(null); fetchClubData();
  };

  // 🌟 ฟังก์ชันจัดการคอมเมนต์
  const handleCreateComment = async (e, postId) => {
      e.preventDefault();
      const content = commentInputs[postId];
      if (!content?.trim()) return;
      await supabase.from('club_comments').insert({ post_id: postId, author_id: user.id, content });
      
      const post = posts.find(p => p.id === postId);
      if (post && post.author_id !== user.id) {
          await supabase.from('notifications').insert({ user_id: post.author_id, title: '💬 New Comment', message: `${profile.first_name} commented on your post.`, type: 'club' });
      }
      setCommentInputs({ ...commentInputs, [postId]: "" }); fetchClubData();
  };

  const handleDeleteComment = async (commentId) => {
      if(!confirm("ลบคอมเมนต์นี้ใช่หรือไม่?")) return;
      await supabase.from('club_comments').delete().eq('id', commentId);
      fetchClubData();
  };

  // ==================== SCHEDULE ACTIONS ====================
  const handleCreateMeeting = async (e) => {
      e.preventDefault();
      await supabase.from('club_meetings').insert({ club_id: club.id, title: meetingForm.title, meeting_date: new Date(meetingForm.meeting_date).toISOString(), location: meetingForm.location });
      await notifyClubMembers('📅 New Club Meeting!', `${meetingForm.title} on ${new Date(meetingForm.meeting_date).toLocaleDateString()}`, 'event');
      setMeetingForm({ title: "", meeting_date: "", location: "" }); fetchClubData();
  };

  // 🌟 ปั๊มหัวใจ (ยิง Noti เตือนนัดหมายด้วยมือ)
  const handleSendReminder = async (meeting) => {
      if(!confirm(`ส่งแจ้งเตือนเตือนความจำนัดหมาย "${meeting.title}" ไปหาสมาชิกทุกคนไหม?`)) return;
      await notifyClubMembers('⏰ Meeting Reminder!', `Don't forget: ${meeting.title} is starting soon at ${meeting.location || 'TBA'}!`, 'event');
      toast.success("ส่งการแจ้งเตือนเตือนความจำสำเร็จ!");
  };

  // ==================== MANAGE ACTIONS ====================
  const handleApprove = async (reqId, targetUserId) => {
      await supabase.from('club_members').update({ status: 'approved' }).eq('id', reqId);
      await supabase.from('notifications').insert({ user_id: targetUserId, title: '🎉 Welcome to the Club!', message: `Your request to join ${club.name} was approved!`, type: 'club' });
      fetchClubData();
  };

  const handleRejectOrKick = async (reqId) => {
      if (!confirm("Are you sure?")) return;
      await supabase.from('club_members').delete().eq('id', reqId);
      fetchClubData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        
        {/* Header ชมรม */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 blur-[80px] opacity-20 rounded-full"></div>
            <button onClick={() => router.push('/')} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 z-10"><ArrowLeft size={20}/></button>
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md z-10 bg-purple-50 shrink-0">
                <img src={club?.logo_url} className="w-full h-full object-cover"/>
            </div>
            <div className="z-10">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight flex items-center gap-2">
                    {club?.name}
                    {isPresident && <span className="bg-yellow-100 text-yellow-600 text-[10px] px-2 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider"><Crown size={12}/> President</span>}
                </h1>
                <p className="text-xs text-gray-500 mt-1">{members.length > 0 ? members.length : club?.member_count} Members Active</p>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border overflow-x-auto no-scrollbar sticky top-4 z-40">
            <TabBtn active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} icon={MessageSquare} label="Feed"/>
            <TabBtn active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={Calendar} label="Schedule"/>
            {/* 🌟 เปลี่ยนชื่อ Tab เป็น Members สำหรับคนทั่วไป */}
            <TabBtn active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} icon={Users} label={isPresident ? "Manage" : "Members"}/>
        </div>

        {/* 1. FEED TAB */}
        {activeTab === 'feed' && (
            <div className="space-y-4 animate-fade-in">
                {isPresident && (
                    <form onSubmit={handleCreatePost} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3">
                        <img src={profile?.avatar} className="w-10 h-10 rounded-full bg-gray-200 shrink-0 object-cover"/>
                        <div className="flex-1 flex flex-col gap-2">
                            <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Announce something to the club..." className="w-full bg-gray-50 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-purple-100 resize-none min-h-[80px]"/>
                            <button type="submit" disabled={!newPost.trim()} className="self-end bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50"><Send size={14}/> Post</button>
                        </div>
                    </form>
                )}

                {posts.length === 0 ? <p className="text-center text-gray-400 py-10 text-sm">No announcements yet.</p> : 
                    posts.map(post => (
                        <div key={post.id} className={`bg-white p-5 rounded-2xl shadow-sm border space-y-4 ${post.is_pinned ? 'border-yellow-400 bg-yellow-50/10' : 'border-gray-100'}`}>
                            
                            {/* ส่วนหัวโพสต์ */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={post.profiles?.avatar} className="w-10 h-10 rounded-full bg-gray-200 object-cover"/>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm flex items-center gap-1">
                                            {post.profiles?.first_name} {post.author_id === club?.owner_id || true && <Crown size={12} className="text-yellow-500"/>}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-gray-400">{new Date(post.created_at).toLocaleString()}</p>
                                            {post.is_pinned && <span className="text-[10px] font-bold text-yellow-600 flex items-center gap-0.5"><Pin size={10}/> Pinned</span>}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* 🌟 จัดการโพสต์ (เฉพาะประธาน หรือ เจ้าของโพสต์) */}
                                {(isPresident || post.author_id === user.id) && (
                                    <div className="flex items-center gap-1">
                                        {isPresident && (
                                            <button onClick={() => handlePinPost(post.id, post.is_pinned)} className={`p-2 rounded-lg transition-colors ${post.is_pinned ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200' : 'text-gray-400 hover:bg-gray-100'}`}>
                                                <Pin size={14}/>
                                            </button>
                                        )}
                                        <button onClick={() => {setEditingPostId(post.id); setEditPostContent(post.content);}} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={14}/></button>
                                        <button onClick={() => handleDeletePost(post.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                                    </div>
                                )}
                            </div>

                            {/* เนื้อหาโพสต์ (ถ้ากด Edit ให้เปลี่ยนเป็นช่องกรอก) */}
                            {editingPostId === post.id ? (
                                <div className="flex flex-col gap-2">
                                    <textarea value={editPostContent} onChange={e => setEditPostContent(e.target.value)} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none resize-none min-h-[80px]" autoFocus/>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingPostId(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                                        <button onClick={() => handleSaveEditPost(post.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Save</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.content}</p>
                            )}
                            
                            {/* คอมเมนต์ */}
                            <div className="bg-gray-50 p-3 rounded-xl space-y-3">
                                {post.club_comments?.map(comment => (
                                    <div key={comment.id} className="flex gap-2 group relative">
                                        <img src={comment.profiles?.avatar} className="w-6 h-6 rounded-full shrink-0 object-cover mt-1"/>
                                        <div className="bg-white px-3 py-2 rounded-xl rounded-tl-none shadow-sm border border-gray-100 text-sm w-full relative pr-8">
                                            <p className="font-bold text-xs text-gray-800">{comment.profiles?.first_name}</p>
                                            <p className="text-gray-600">{comment.content}</p>
                                            
                                            {/* 🌟 ลบคอมเมนต์ (ประธาน หรือ คนพิมพ์) */}
                                            {(isPresident || comment.author_id === user.id) && (
                                                <button onClick={() => handleDeleteComment(comment.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={12}/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <form onSubmit={(e) => handleCreateComment(e, post.id)} className="flex gap-2 pt-2">
                                    <input type="text" placeholder="Write a comment..." value={commentInputs[post.id] || ""} onChange={e => setCommentInputs({...commentInputs, [post.id]: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs outline-none focus:ring-2 ring-purple-100" />
                                    <button type="submit" disabled={!commentInputs[post.id]?.trim()} className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center hover:bg-purple-200 shrink-0"><Send size={14}/></button>
                                </form>
                            </div>
                        </div>
                    ))
                }
            </div>
        )}

        {/* 2. SCHEDULE TAB */}
        {activeTab === 'schedule' && (
            <div className="space-y-4 animate-fade-in">
                {isPresident && (
                    <form onSubmit={handleCreateMeeting} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-2"><Calendar size={16}/> Create Meeting</h3>
                        <input type="text" placeholder="Meeting Title (e.g. ซ้อมบอล)" required value={meetingForm.title} onChange={e => setMeetingForm({...meetingForm, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none"/>
                        <div className="flex gap-3">
                            <input type="datetime-local" required value={meetingForm.meeting_date} onChange={e => setMeetingForm({...meetingForm, meeting_date: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none"/>
                            <input type="text" placeholder="Location" value={meetingForm.location} onChange={e => setMeetingForm({...meetingForm, location: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none"/>
                        </div>
                        <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-700">Schedule Meeting</button>
                    </form>
                )}

                {meetings.length === 0 ? <p className="text-center text-gray-400 py-10 text-sm">No upcoming meetings.</p> : 
                    meetings.map(m => {
                        const isPast = new Date(m.meeting_date) < new Date();
                        if (isPast && !isPresident) return null; 
                        
                        return (
                        <div key={m.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-4 ${isPast ? 'opacity-50 grayscale border-gray-200' : 'border-purple-100'}`}>
                            <div className="w-14 h-14 bg-purple-50 rounded-xl flex flex-col items-center justify-center text-purple-600 shrink-0">
                                <span className="text-xs font-bold">{new Date(m.meeting_date).toLocaleString('en-US', { month: 'short' })}</span>
                                <span className="text-xl font-extrabold leading-none">{new Date(m.meeting_date).getDate()}</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800">{m.title} {isPast && "(Ended)"}</h4>
                                <p className="text-xs text-gray-500 flex items-center gap-2 mt-1"><Clock size={12}/> {new Date(m.meeting_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-2"><MapPin size={12}/> {m.location || 'TBA'}</p>
                            </div>
                            
                            {/* 🌟 ปุ่มยิง Noti แจ้งเตือนนัดหมายแบบ Manual (เฉพาะประธาน และงานยังไม่จบ) */}
                            {isPresident && !isPast && (
                                <button onClick={() => handleSendReminder(m)} className="p-2.5 bg-orange-50 text-orange-500 rounded-xl hover:bg-orange-100 transition-colors shrink-0" title="Send Reminder Noti">
                                    <BellRing size={18}/>
                                </button>
                            )}
                        </div>
                    )})}
            </div>
        )}

        {/* 3. MANAGE / MEMBERS TAB */}
        {activeTab === 'manage' && (
            <div className="space-y-6 animate-fade-in">
                {/* คำขอเข้าชมรม (เห็นเฉพาะประธาน) */}
                {isPresident && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100">
                        <h3 className="font-bold text-gray-800 text-sm mb-4 flex justify-between items-center">
                            Pending Requests <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px]">{pendingRequests.length}</span>
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {pendingRequests.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">No requests.</p> : 
                                pendingRequests.map(req => (
                                    <div key={req.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <img src={req.profiles?.avatar} className="w-10 h-10 rounded-full object-cover"/>
                                            <div><p className="font-bold text-sm text-gray-800">{req.profiles?.first_name}</p><p className="text-[10px] text-gray-400">{req.profiles?.student_id}</p></div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleApprove(req.id, req.user_id)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><CheckCircle size={16}/></button>
                                            <button onClick={() => handleRejectOrKick(req.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><X size={16}/></button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}

                {/* สมาชิกปัจจุบัน (เห็นทุกคน) */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm mb-4 flex justify-between items-center">
                        Active Members <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{members.length}</span>
                    </h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <img src={member.profiles?.avatar} className="w-10 h-10 rounded-full object-cover"/>
                                    <div>
                                        <p className="font-bold text-sm text-gray-800 flex items-center gap-1">
                                            {member.profiles?.first_name} {member.role === 'president' && <Crown size={12} className="text-yellow-500"/>}
                                        </p>
                                        <p className="text-[10px] text-gray-400">{member.profiles?.student_id}</p>
                                    </div>
                                </div>
                                {/* ประธานเตะคนอื่นได้ */}
                                {isPresident && member.user_id !== user.id && (
                                    <button onClick={() => handleRejectOrKick(member.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
    return (
        <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Icon size={18}/> {label}
        </button>
    )
}