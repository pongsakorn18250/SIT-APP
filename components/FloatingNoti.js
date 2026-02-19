"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase"; 
import { 
  Bell, X, BookOpen, Trophy, Info, CheckCircle, Trash2, MoreHorizontal 
} from "lucide-react";
import { usePathname } from "next/navigation"; 

export default function FloatingNoti() {
  const pathname = usePathname(); 

  // --- States ---
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNoti, setSelectedNoti] = useState(null); 
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const longPressTimer = useRef(null);

  // --- 1. Fetch Data ---
  const fetchNotis = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching notis:", error);
      return;
    }

    const formattedNotis = (data || []).map(n => ({
        id: n.id,
        type: n.type || 'info',
        title: n.title,
        desc: n.message,
        timestamp: n.created_at,
        isRead: n.is_read
    }));

    setNotifications(formattedNotis);
    setUnreadCount(formattedNotis.filter(n => !n.isRead).length);
  }, []);

  // --- 2. Realtime Subscription Logic (NEW!) ---
  useEffect(() => {
    // 2.1 โหลดข้อมูลครั้งแรก
    fetchNotis();

    // 2.2 ตั้งค่า Realtime Listener
    let channel;
    const setupRealtime = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        channel = supabase
            .channel('realtime-noti')
            .on(
                'postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}` // ดักฟังเฉพาะของ User เรา
                }, 
                (payload) => {
                    // console.log("New Noti Arrived!", payload.new);
                    
                    const newNoti = {
                        id: payload.new.id,
                        type: payload.new.type || 'info',
                        title: payload.new.title,
                        desc: payload.new.message,
                        timestamp: payload.new.created_at,
                        isRead: false
                    };

                    // Update UI ทันที
                    setNotifications((prev) => [newNoti, ...prev]);
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe();
    };

    setupRealtime();

    // Cleanup เมื่อปิด Component
    return () => {
        if (channel) supabase.removeChannel(channel);
    };

  }, [fetchNotis]); // เอา dependency อื่นออก เพื่อป้องกันการ Re-subscribe บ่อยเกินไป

  // --- Actions ---
  const toggleOpen = () => {
      setIsOpen(!isOpen);
      if (isOpen) {
          setIsSelectionMode(false);
          setSelectedIds([]);
      }
  };

  const deleteFromDB = async (idsToDelete) => {
      setNotifications(prev => prev.filter(n => !idsToDelete.includes(n.id)));
      setUnreadCount(prev => prev - notifications.filter(n => idsToDelete.includes(n.id) && !n.isRead).length);
      await supabase.from('notifications').delete().in('id', idsToDelete);
  };
  
  const handleDeleteSingle = (e, id) => {
      e.stopPropagation(); 
      if (window.confirm("Delete this notification?")) {
        deleteFromDB([id]);
      }
  };

  const handleClearAll = () => {
      if (window.confirm("Clear all notifications?")) {
          const allIds = notifications.map(n => n.id);
          deleteFromDB(allIds);
      }
  };

  const handleDeleteSelected = () => {
      if (window.confirm(`Delete ${selectedIds.length} items?`)) {
          deleteFromDB(selectedIds);
          setIsSelectionMode(false);
          setSelectedIds([]);
      }
  };

  const markAsReadDB = async (id) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const handleRead = (noti) => {
      setSelectedNoti(noti); 
      if (!noti.isRead) markAsReadDB(noti.id);
  };

  const startLongPress = (id) => {
      longPressTimer.current = setTimeout(() => {
          setIsSelectionMode(true);
          toggleSelection(id);
      }, 500);
  };

  const cancelLongPress = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
  };

  const toggleSelection = (id) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleClickItem = (n) => {
      if (isSelectionMode) toggleSelection(n.id);
      else handleRead(n);
  };

  const getBadgeDisplay = (count) => {
      if (count <= 0) return null;
      if (count > 9) return "9+";
      return count;
  };

  // --- Check Page Visibility ---
  // เช็คว่าถ้าไม่ใช่ Admin ให้แสดงผล (Admin มี Navbar ของตัวเอง หรือถ้าอยากซ่อนบางหน้าเพิ่มก็ใส่ใน array นี้)
  if (["/login", "/register", "/select-character", "/select-major", "/select-role", "/admin", "/admin/assignments", "/admin/grading"].includes(pathname)) return null;

  return (
    <>
      {/* Floating Button */}
      <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2 md:top-6 md:right-8">
          <div className="relative">
            <button 
                onClick={toggleOpen} 
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full shadow-md transition-all active:scale-95 flex items-center justify-center relative ${isOpen ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
                {isOpen ? <X size={20} /> : <Bell size={20} />}
                {!isOpen && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                        {getBadgeDisplay(unreadCount)}
                    </span>
                )}
            </button>

            {/* Popup */}
            {isOpen && (
                <div className="absolute top-14 right-0 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up origin-top-right z-50 select-none">
                    <div className={`p-3 border-b flex justify-between items-center ${isSelectionMode ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        {isSelectionMode ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => {setIsSelectionMode(false); setSelectedIds([])}} className="p-1 hover:bg-blue-100 rounded text-gray-500"><X size={16}/></button>
                                    <span className="font-bold text-blue-700 text-xs">{selectedIds.length} Selected</span>
                                </div>
                                <button onClick={handleDeleteSelected} disabled={selectedIds.length === 0} className={`text-xs font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 ${selectedIds.length > 0 ? 'text-red-600 hover:bg-red-100' : 'text-gray-300'}`}>
                                    <Trash2 size={14}/> Delete
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-700 text-xs">Notifications</span>
                                    {unreadCount > 0 && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
                                </div>
                                <div className="flex gap-2">
                                    {notifications.length > 0 && <button onClick={() => setIsSelectionMode(true)} className="text-gray-400 hover:text-gray-600 p-1"><MoreHorizontal size={16}/></button>}
                                    {notifications.length > 0 && <button onClick={handleClearAll} className="text-[10px] font-bold text-gray-400 hover:text-red-500">Clear All</button>}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-white">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-300 gap-1">
                                <Bell size={32} className="opacity-20"/>
                                <p className="text-[10px]">No notifications</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    onMouseDown={() => startLongPress(n.id)} onMouseUp={cancelLongPress} onMouseLeave={cancelLongPress} onTouchStart={() => startLongPress(n.id)} onTouchEnd={cancelLongPress}
                                    onClick={() => handleClickItem(n)}
                                    className={`relative p-3 border-b border-gray-50 cursor-pointer transition-all flex gap-3 items-center ${isSelectionMode && selectedIds.includes(n.id) ? 'bg-blue-50 border-blue-100' : !n.isRead ? 'bg-blue-50/30 hover:bg-blue-50/60' : 'bg-white hover:bg-gray-50 opacity-60'}`}
                                >
                                    {isSelectionMode && (
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedIds.includes(n.id) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                            {selectedIds.includes(n.id) && <CheckCircle size={12} className="text-white"/>}
                                        </div>
                                    )}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${n.type === 'grade' ? 'bg-blue-100 text-blue-600' : n.type === 'activity' ? 'bg-orange-100 text-orange-600' : n.type === 'assignment' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                        {n.type === 'grade' ? <Trophy size={16}/> : n.type === 'assignment' ? <BookOpen size={16}/> : <Info size={16}/>}
                                    </div>
                                    <div className="flex-1 pr-2 select-none">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{n.type}</p>
                                            {!n.isRead && !isSelectionMode && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                        </div>
                                        <p className={`text-xs text-gray-800 leading-tight mb-1 ${n.isRead ? 'font-medium' : 'font-bold'}`}>{n.title}</p>
                                        <p className="text-[10px] text-gray-500 truncate w-48">{n.desc}</p>
                                    </div>
                                    {!isSelectionMode && (
                                        <button onClick={(e) => handleDeleteSingle(e, n.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><X size={14}/></button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
          </div>
      </div>
      
      {selectedNoti && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm relative">
                  <button onClick={() => setSelectedNoti(null)} className="absolute top-4 right-4"><X/></button>
                  <h3 className="font-bold text-lg mb-2">{selectedNoti.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{selectedNoti.desc}</p>
                  <p className="text-xs text-gray-400">{new Date(selectedNoti.timestamp).toLocaleString()}</p>
              </div>
          </div>
      )}
    </>
  );
}