"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase"; 
import { 
  Bell, X, BookOpen, Trophy, Info, CheckCircle, FileText, Trash2, MoreHorizontal 
} from "lucide-react";
import { usePathname } from "next/navigation"; 

export default function FloatingNoti() {
  const pathname = usePathname(); 

  // --- States ---
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNoti, setSelectedNoti] = useState(null); 
  
  // Selection Mode States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const longPressTimer = useRef(null); // ตัวจับเวลากดค้าง

  // --- Fetch & Logic ---
  useEffect(() => {
    const fetchNotis = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: grades } = await supabase.from("grades").select("*").eq("user_id", user.id).order('id', { ascending: false }).limit(5);
      const { data: acts } = await supabase.from("activities").select("*").eq("user_id", user.id).order('date', { ascending: false }).limit(5);

      // Format Data
      const formattedGrades = (grades || []).map(g => ({
          id: `grade-${g.id}`,
          type: 'grade',
          title: 'New Grade Released',
          subtitle: g.subject_code,
          desc: `${g.subject_name}`,
          value: `Grade: ${g.grade}`,
          detail: `You received grade ${g.grade} in ${g.subject_name}.`,
          timestamp: new Date().toISOString(), 
          isRead: false
      }));

      const formattedActs = (acts || []).map(a => ({
          id: `act-${a.id}`,
          type: 'activity',
          title: 'Activity Recorded',
          subtitle: a.category,
          desc: a.name,
          value: `+${a.hours} hrs`,
          detail: a.description || "No description.",
          timestamp: a.date,
          isRead: false
      }));

      let allNotifs = [...formattedActs, ...formattedGrades];

      // 1. กรองอันที่ "ถูกลบ" ออกไป (Deleted IDs)
      const deletedIds = JSON.parse(localStorage.getItem('sit_deleted_notis') || '[]');
      allNotifs = allNotifs.filter(n => !deletedIds.includes(n.id));

      // 2. เช็คสถานะ "อ่านแล้ว" (Read IDs)
      const readIds = JSON.parse(localStorage.getItem('sit_read_notis') || '[]');
      const finalNotifs = allNotifs.map(n => ({
          ...n,
          isRead: readIds.includes(n.id)
      }));

      // 3. นับจำนวนที่ยังไม่อ่าน
      setUnreadCount(finalNotifs.filter(n => !n.isRead).length);
      setNotifications(finalNotifs);
    };

    fetchNotis();
  }, [isOpen, pathname]);

  // --- Normal Actions ---
  const toggleOpen = () => {
      setIsOpen(!isOpen);
      // ออกจากโหมดเลือกของเมื่อปิด popup
      if (isOpen) {
          setIsSelectionMode(false);
          setSelectedIds([]);
      }
  };

  // --- Delete Logic (ลบถาวร) ---
  const persistDelete = (idsToDelete) => {
      // 1. บันทึกลง LocalStorage
      const oldDeletedIds = JSON.parse(localStorage.getItem('sit_deleted_notis') || '[]');
      const newDeletedIds = [...oldDeletedIds, ...idsToDelete];
      localStorage.setItem('sit_deleted_notis', JSON.stringify(newDeletedIds));

      // 2. Update UI
      setNotifications(prev => prev.filter(n => !idsToDelete.includes(n.id)));
      
      // 3. Recalculate Unread Count
      const remaining = notifications.filter(n => !idsToDelete.includes(n.id));
      setUnreadCount(remaining.filter(n => !n.isRead).length);
  };

  const handleDeleteSingle = (e, id) => {
      e.stopPropagation(); 
      if (window.confirm("Delete this notification?")) {
        persistDelete([id]);
      }
  };

  const handleClearAll = () => {
      if (confirm("Clear all notifications?")) {
          const allIds = notifications.map(n => n.id);
          persistDelete(allIds);
      }
  };

  const handleDeleteSelected = () => {
      if (confirm(`Delete ${selectedIds.length} items?`)) {
          persistDelete(selectedIds);
          setIsSelectionMode(false);
          setSelectedIds([]);
      }
  };

  // --- Selection Mode Logic (Long Press) ---
  const startLongPress = (id) => {
      longPressTimer.current = setTimeout(() => {
          setIsSelectionMode(true);
          toggleSelection(id); // Select ตัวที่กดค้างด้วย
      }, 500); // กดค้าง 0.5 วิ
  };

  const cancelLongPress = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
  };

  const toggleSelection = (id) => {
      setSelectedIds(prev => 
          prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
  };

  const handleClickItem = (n) => {
      if (isSelectionMode) {
          // ถ้าอยู่ในโหมดเลือก -> ให้เป็นการติ๊กถูก
          toggleSelection(n.id);
      } else {
          // ถ้าโหมดปกติ -> กดอ่าน (Mark as Read & Open Modal)
          handleRead(n);
      }
  };

  const handleRead = (noti) => {
      setSelectedNoti(noti); 
      if (noti.isRead) return;

      const newReadIds = JSON.parse(localStorage.getItem('sit_read_notis') || '[]');
      if (!newReadIds.includes(noti.id)) {
          newReadIds.push(noti.id);
          localStorage.setItem('sit_read_notis', JSON.stringify(newReadIds));
      }

      setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Badge Display
  const getBadgeDisplay = (count) => {
      if (count <= 0) return null;
      if (count > 9) return "9+";
      return count;
  };

  if (pathname === "/profile" || pathname === "/login" || pathname === "/register") return null;

  return (
    <>
      {/* ================= FLOATING BUTTON ================= */}
      <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2 md:top-6 md:right-8">
          
          <div className="relative">
            {/* BUTTON */}
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

            {/* POPUP CONTAINER */}
            {isOpen && (
                <div className="absolute top-14 right-0 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up origin-top-right z-50 select-none">
                    
                    {/* Header: เปลี่ยนตามโหมด (Selection vs Normal) */}
                    <div className={`p-3 border-b flex justify-between items-center ${isSelectionMode ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        {isSelectionMode ? (
                            // Header ตอนเลือกของ
                            <>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => {setIsSelectionMode(false); setSelectedIds([])}} className="p-1 hover:bg-blue-100 rounded text-gray-500"><X size={16}/></button>
                                    <span className="font-bold text-blue-700 text-xs">{selectedIds.length} Selected</span>
                                </div>
                                <button 
                                    onClick={handleDeleteSelected} 
                                    disabled={selectedIds.length === 0}
                                    className={`text-xs font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 ${selectedIds.length > 0 ? 'text-red-600 hover:bg-red-100' : 'text-gray-300'}`}
                                >
                                    <Trash2 size={14}/> Delete
                                </button>
                            </>
                        ) : (
                            // Header ปกติ
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-700 text-xs">Notifications</span>
                                    {unreadCount > 0 && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
                                </div>
                                <div className="flex gap-2">
                                    {notifications.length > 0 && (
                                        <button onClick={() => setIsSelectionMode(true)} className="text-gray-400 hover:text-gray-600 p-1" title="Select">
                                            <MoreHorizontal size={16}/>
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button onClick={handleClearAll} className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors">
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Body List */}
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
                                    // Logic กดค้าง
                                    onMouseDown={() => startLongPress(n.id)}
                                    onMouseUp={cancelLongPress}
                                    onMouseLeave={cancelLongPress}
                                    onTouchStart={() => startLongPress(n.id)}
                                    onTouchEnd={cancelLongPress}
                                    // Logic คลิกปกติ
                                    onClick={() => handleClickItem(n)}
                                    
                                    className={`relative p-3 border-b border-gray-50 cursor-pointer transition-all flex gap-3 items-center 
                                        ${isSelectionMode && selectedIds.includes(n.id) ? 'bg-blue-50 border-blue-100' : 
                                          !n.isRead ? 'bg-blue-50/30 hover:bg-blue-50/60' : 'bg-white hover:bg-gray-50 opacity-60'}
                                    `}
                                >
                                    {/* Selection Checkbox (Show only in Selection Mode) */}
                                    {isSelectionMode && (
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedIds.includes(n.id) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                            {selectedIds.includes(n.id) && <CheckCircle size={12} className="text-white"/>}
                                        </div>
                                    )}

                                    {/* Icon Type */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 
                                        ${n.type === 'grade' ? 'bg-blue-100 text-blue-600' : 
                                          n.type === 'activity' ? 'bg-orange-100 text-orange-600' : 
                                          'bg-purple-100 text-purple-600'}`}>
                                        {n.type === 'grade' ? <BookOpen size={16}/> : 
                                         n.type === 'activity' ? <Trophy size={16}/> : 
                                         <FileText size={16}/>}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pr-2 select-none">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{n.subtitle}</p>
                                            {!n.isRead && !isSelectionMode && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                        </div>
                                        <p className={`text-xs text-gray-800 leading-tight mb-1 ${n.isRead ? 'font-medium' : 'font-bold'}`}>{n.desc}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${n.type === 'grade' ? 'bg-blue-100 text-blue-700' : n.type === 'activity' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {n.value}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Delete Single Button (Only in Normal Mode) */}
                                    {!isSelectionMode && (
                                        <button 
                                            onClick={(e) => handleDeleteSingle(e, n.id)} 
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                        >
                                            <X size={14}/>
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
          </div>
      </div>

      {/* ================= DETAIL MODAL (เหมือนเดิม) ================= */}
      {selectedNoti && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-zoom-in relative">
                  <button onClick={() => setSelectedNoti(null)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10 transition-colors">
                      <X size={20}/>
                  </button>
                  <div className={`h-24 w-full flex items-center justify-center ${selectedNoti.type === 'grade' ? 'bg-blue-500' : selectedNoti.type === 'activity' ? 'bg-orange-500' : 'bg-purple-500'}`}>
                       <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-3xl shadow-inner">
                          {selectedNoti.type === 'grade' ? <BookOpen/> : selectedNoti.type === 'activity' ? <Trophy/> : <FileText/>}
                       </div>
                  </div>
                  <div className="p-6 text-center">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{selectedNoti.title}</h3>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{selectedNoti.subtitle}</p>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4 text-left">
                          <p className="text-gray-700 text-sm leading-relaxed">{selectedNoti.detail}</p>
                      </div>
                      <div className="flex justify-between items-center border-t pt-4">
                           <div className="text-left">
                               <p className="text-[10px] text-gray-400 uppercase font-bold">Date Record</p>
                               <p className="text-xs font-bold text-gray-600">{new Date(selectedNoti.timestamp).toLocaleDateString()}</p>
                           </div>
                           <div className={`px-3 py-1.5 rounded-lg font-bold text-lg ${selectedNoti.type === 'grade' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                               {selectedNoti.value}
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
}