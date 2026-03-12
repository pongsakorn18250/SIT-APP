"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { 
  FileText, Wrench, Package, Key, Users, Monitor, 
  CheckCircle, XCircle, Clock, Send, Plus, Trash2, Loader2, ArrowLeft,
  MapPin, Edit3, Save, X
} from "lucide-react";

export default function AdminToolsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("equipment"); // 🌟 เปิดมาหน้า Equipment ให้เทสง่ายๆ

  // ================= DATA STATES =================
  const [docs, setDocs] = useState([]);
  const [maints, setMaints] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [softwares, setSoftwares] = useState([]);
  const [softReqs, setSoftReqs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [labUsers, setLabUsers] = useState([]);

  // ================= FORM STATES =================
  const [newEq, setNewEq] = useState({ name: "", description: "", total_quantity: 1, available_quantity: 1, image_url: "" });
  const [newSw, setNewSw] = useState({ name: "", description: "", icon_url: "", validity_period: "ตลอดการเป็นนักศึกษา" });

  const [editingEq, setEditingEq] = useState(null);
  const [editingSw, setEditingSw] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    
    const { data: dData } = await supabase.from('document_requests').select('*, profiles(first_name, student_id)').order('created_at', { ascending: false });
    setDocs(dData || []);

    const { data: mData } = await supabase.from('maintenance').select('*, profiles(first_name, student_id)').order('created_at', { ascending: false });
    setMaints(mData || []);

    const { data: eqData } = await supabase.from('equipments').select('*').order('name');
    const { data: bData } = await supabase.from('equipment_borrows').select('*, profiles(first_name, student_id), equipments(name)').order('created_at', { ascending: false });
    setEquipments(eqData || []); setBorrows(bData || []);

    const { data: swData } = await supabase.from('software_licenses').select('*').order('name');
    const { data: srData } = await supabase.from('software_requests').select('*, profiles(first_name, student_id), software_licenses(name)').order('created_at', { ascending: false });
    setSoftwares(swData || []); setSoftReqs(srData || []);

    const { data: bkData, error: bkError } = await supabase.from('bookings').select('*, profiles(first_name, student_id), rooms(name)').order('booking_date', { ascending: false });
    if (bkError) console.error("🚨 บั๊กการดึงข้อมูลจองห้อง:", bkError);
    setBookings(bkData || []);

    const { data: labData } = await supabase.from('lab_usage').select('*, profiles(first_name, student_id, avatar), rooms(name)').eq('status', 'active');
    setLabUsers(labData || []);

    setLoading(false);
  };

  const sendNoti = async (userId, title, message, type = 'info', actionLink = null) => {
      const payload = { user_id: userId, title, message, type };
      if (actionLink) payload.action_link = actionLink;
      await supabase.from('notifications').insert(payload);
  };

  // ================= ACTIONS =================
  const updateDocStatus = async (id, userId, status, docType) => {
      await supabase.from('document_requests').update({ status }).eq('id', id);
      const msg = status === 'ready' ? `เอกสาร ${docType} ของคุณพร้อมแล้ว! ตรวจสอบในแอปได้เลย` : `คำร้องขอเอกสาร ${docType} ถูกปฏิเสธ`;
      await sendNoti(userId, '📄 Document Update', msg, status === 'ready' ? 'success' : 'alert'); fetchAdminData();
  };

  const updateMaintStatus = async (id, userId, status, title) => {
      const note = prompt("Admin Note (เช่น กำลังเรียกช่าง / ซ่อมเสร็จแล้ว):");
      await supabase.from('maintenance').update({ status, admin_note: note }).eq('id', id);
      let statusThai = status === 'in_progress' ? 'กำลังดำเนินการซ่อมแซม 👨‍🔧' : 'ซ่อมแซมเสร็จสิ้นเรียบร้อย ✅';
      let msg = `แจ้งซ่อม: ${title}\nสถานะ: ${statusThai}`; if(note) msg += `\nหมายเหตุ: ${note}`;
      await sendNoti(userId, '🔧 อัปเดตสถานะแจ้งซ่อม', msg, status === 'done' ? 'success' : 'info'); fetchAdminData();
  };

  // 🌟 FIX: ระบบตัดสต๊อกของคลังอุปกรณ์
  const updateBorrowStatus = async (id, userId, status, eqName, eqId) => {
      await supabase.from('equipment_borrows').update({ status }).eq('id', id);
      
      const eq = equipments.find(e => e.id === eqId); // ดึงข้อมูลของชิ้นนั้นมาเช็คสต๊อกปัจจุบัน

      if (status === 'approved') {
          // 📉 หักสต๊อก (-1) ตอนแอดมินกดอนุมัติ
          if(eq && eq.available_quantity > 0) {
              await supabase.from('equipments').update({ available_quantity: eq.available_quantity - 1 }).eq('id', eqId);
          }
          await sendNoti(userId, '📦 Equipment Approved', `คำขอยืม ${eqName} ได้รับการอนุมัติแล้ว มารับของได้เลย!`, 'success');
      }
      else if (status === 'rejected') {
          await sendNoti(userId, '📦 Equipment Rejected', `คำขอยืม ${eqName} ถูกปฏิเสธ`, 'alert');
      }
      else if (status === 'returned') {
          // 📈 คืนสต๊อก (+1) ตอนเด็กเอาของมาคืน
          if(eq) {
              // กันเหนียวไม่ให้ของเกินจำนวนที่มีทั้งหมด
              const newQty = Math.min(eq.available_quantity + 1, eq.total_quantity);
              await supabase.from('equipments').update({ available_quantity: newQty }).eq('id', eqId);
          }
          await sendNoti(userId, '📦 Equipment Returned', `ระบบได้รับคืน ${eqName} เรียบร้อยแล้ว ขอบคุณครับ`, 'success');
      }
      
      fetchAdminData();
  };

  const addEquipment = async (e) => {
      e.preventDefault(); await supabase.from('equipments').insert(newEq);
      setNewEq({ name: "", description: "", total_quantity: 1, available_quantity: 1, image_url: "" }); alert("เพิ่มอุปกรณ์สำเร็จ!"); fetchAdminData();
  };

  const saveEditEquipment = async () => {
      await supabase.from('equipments').update({ name: editingEq.name, image_url: editingEq.image_url, total_quantity: editingEq.total_quantity, available_quantity: editingEq.available_quantity }).eq('id', editingEq.id);
      setEditingEq(null); fetchAdminData();
  };

  const deleteEquipment = async (id) => {
      if(!confirm("แน่ใจหรือไม่ว่าจะลบอุปกรณ์นี้ออกจากระบบ?")) return;
      await supabase.from('equipments').delete().eq('id', id); fetchAdminData();
  };

  const updateBookingStatus = async (id, userId, status, roomName) => {
      await supabase.from('bookings').update({ status }).eq('id', id);
      const msg = status === 'approved' ? `อนุมัติการจองห้อง ${roomName} แล้ว! (คลิกเพื่อดู E-Voucher 🎟️)` : `คำขอจองห้อง ${roomName} ถูกปฏิเสธ`;
      const link = status === 'approved' ? '/tools' : null;
      await sendNoti(userId, '📅 Booking Update', msg, status === 'approved' ? 'success' : 'alert', link); 
      fetchAdminData();
  };

  const approveSoftware = async (id, userId, swName) => {
      const key = prompt(`กรุณาระบุ License Key สำหรับ ${swName} \n(หรือปล่อยว่างให้ระบบสุ่มรหัสให้):`);
      if (key === null) return; 
      const finalKey = key.trim() || `SIT-${swName.substring(0,3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await supabase.from('software_requests').update({ status: 'approved', license_key: finalKey }).eq('id', id);
      await sendNoti(userId, '🔑 Software License Approved!', `Admin อนุมัติ ${swName} ให้แล้ว!\n👉 รหัสของคุณคือ: ${finalKey}`, 'success', '/tools'); fetchAdminData();
  };

  const rejectSoftware = async (id, userId, swName) => {
      await supabase.from('software_requests').update({ status: 'rejected' }).eq('id', id);
      await sendNoti(userId, '🔑 Software Request Rejected', `คำขอใช้งาน ${swName} ถูกปฏิเสธ`, 'alert'); fetchAdminData();
  };

  const addSoftware = async (e) => {
      e.preventDefault(); await supabase.from('software_licenses').insert(newSw);
      setNewSw({ name: "", description: "", icon_url: "", validity_period: "ตลอดการเป็นนักศึกษา" }); alert("เพิ่ม Software สำเร็จ!"); fetchAdminData();
  };

  const saveEditSoftware = async () => {
      await supabase.from('software_licenses').update({ 
          name: editingSw.name, 
          icon_url: editingSw.icon_url, 
          description: editingSw.description,
          validity_period: editingSw.validity_period
      }).eq('id', editingSw.id);
      setEditingSw(null); fetchAdminData();
  };

  const deleteSoftware = async (id) => {
      if(!confirm("แน่ใจหรือไม่ว่าจะลบซอฟต์แวร์นี้ออกจากระบบ?")) return;
      await supabase.from('software_licenses').delete().eq('id', id); fetchAdminData();
  };

  const forceCheckout = async (id, userId, roomName, userName) => {
      if(!confirm(`เตะ ${userName} ออกจากห้อง ${roomName} ใช่หรือไม่?`)) return;
      await supabase.from('lab_usage').update({ status: 'completed', check_out_time: new Date().toISOString() }).eq('id', id);
      await sendNoti(userId, '💻 Lab Force Check-out', `คุณถูกแอดมินบังคับ Check-out ออกจากห้อง ${roomName} เนื่องจากลืมกดออก`, 'alert'); fetchAdminData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
            
            <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <button onClick={() => router.push('/admin')} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-200"><ArrowLeft size={20}/></button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Admin Tools Console</h1>
                    <p className="text-sm text-gray-500">จัดการคำร้องและฟีเจอร์ Tools ทั้งหมดของคณะ</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-64 space-y-2 shrink-0">
                    <TabBtn active={activeTab==='documents'} onClick={()=>setActiveTab('documents')} icon={FileText} label="Documents" color="blue" count={docs.filter(d=>d.status==='pending').length}/>
                    <TabBtn active={activeTab==='maints'} onClick={()=>setActiveTab('maints')} icon={Wrench} label="Maintenance" color="orange" count={maints.filter(m=>m.status==='pending').length}/>
                    <TabBtn active={activeTab==='equipment'} onClick={()=>setActiveTab('equipment')} icon={Package} label="Equipment" color="sky" count={borrows.filter(b=>b.status==='pending').length}/>
                    <TabBtn active={activeTab==='bookings'} onClick={()=>setActiveTab('bookings')} icon={Users} label="Room Booking" color="emerald" count={bookings.filter(b=>b.status==='pending').length}/>
                    <TabBtn active={activeTab==='software'} onClick={()=>setActiveTab('software')} icon={Key} label="Software Keys" color="purple" count={softReqs.filter(s=>s.status==='pending').length}/>
                    <TabBtn active={activeTab==='lab'} onClick={()=>setActiveTab('lab')} icon={Monitor} label="Lab Monitor" color="pink" count={labUsers.length}/>
                </div>

                <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[500px]">
                    
                    {activeTab === 'documents' && (
                        <div className="space-y-4 animate-fade-in">
                            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><FileText className="text-blue-500"/> Document Requests</h2>
                            {docs.length === 0 ? <p className="text-gray-400">ไม่มีคำร้อง</p> : docs.map(d => (
                                <div key={d.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-gray-50">
                                    <div><h4 className="font-bold text-gray-900">{d.doc_type} <span className={`text-[10px] px-2 py-0.5 rounded-full ${d.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>{d.status}</span></h4><p className="text-xs text-gray-500">โดย: {d.profiles?.first_name} ({d.profiles?.student_id})</p><p className="text-xs text-gray-600 mt-1">เหตุผล: {d.reason}</p></div>
                                    {d.status === 'pending' && (<div className="flex gap-2"><button onClick={() => updateDocStatus(d.id, d.user_id, 'ready', d.doc_type)} className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200">Approve</button><button onClick={() => updateDocStatus(d.id, d.user_id, 'rejected', d.doc_type)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200">Reject</button></div>)}
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'maints' && (
                        <div className="space-y-4 animate-fade-in">
                            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Wrench className="text-orange-500"/> Maintenance Reports</h2>
                            {maints.length === 0 ? <p className="text-gray-400">ไม่มีแจ้งซ่อม</p> : maints.map(m => (
                                <div key={m.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-gray-50">
                                    <div><h4 className="font-bold text-gray-900">[{m.room}] {m.title} <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{m.status}</span></h4><p className="text-xs text-gray-500">โดย: {m.profiles?.first_name} | รายละเอียด: {m.description}</p>{m.admin_note && <p className="text-[10px] text-orange-600 mt-1 bg-orange-50 p-1 rounded inline-block">Note: {m.admin_note}</p>}</div>
                                    <div className="flex gap-2 flex-col">{m.status === 'pending' && <button onClick={() => updateMaintStatus(m.id, m.user_id, 'in_progress', m.title)} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200">รับเรื่อง</button>}{(m.status === 'pending' || m.status === 'in_progress') && <button onClick={() => updateMaintStatus(m.id, m.user_id, 'done', m.title)} className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200">ซ่อมเสร็จ</button>}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 🌟 TAB: EQUIPMENT 🌟 */}
                    {activeTab === 'equipment' && (
                        <div className="space-y-8 animate-fade-in">
                            <div><h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2"><Package className="text-sky-500"/> Borrow Requests (คำขอยืม)</h2>
                                <div className="space-y-2">{borrows.length === 0 ? <p className="text-gray-400">ไม่มีคำขอยืม</p> : borrows.map(b => (<div key={b.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-gray-50"><div><h4 className="font-bold text-gray-900">{b.equipments?.name} <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100">{b.status}</span></h4><p className="text-xs text-gray-500">ผู้ยืม: {b.profiles?.first_name} | วันที่: {b.borrow_date} ถึง {b.return_date}</p></div><div className="flex gap-2">{b.status === 'pending' && (<><button onClick={() => updateBorrowStatus(b.id, b.user_id, 'approved', b.equipments?.name, b.equipment_id)} className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200">Approve</button><button onClick={() => updateBorrowStatus(b.id, b.user_id, 'rejected', b.equipments?.name, b.equipment_id)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200">Reject</button></>)}{b.status === 'approved' && <button onClick={() => updateBorrowStatus(b.id, b.user_id, 'borrowed', b.equipments?.name, b.equipment_id)} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200">มารับของแล้ว</button>}{b.status === 'borrowed' && <button onClick={() => updateBorrowStatus(b.id, b.user_id, 'returned', b.equipments?.name, b.equipment_id)} className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-700">รับของคืน</button>}</div></div>))}</div>
                            </div>
                            <div className="bg-sky-50/50 p-6 rounded-3xl border border-sky-100 space-y-4">
                                <h3 className="font-bold text-base text-sky-900 flex items-center gap-2"><Package size={20}/> Equipment Inventory (คลังอุปกรณ์)</h3>
                                <form onSubmit={addEquipment} className="flex flex-wrap gap-2 bg-white p-3 rounded-2xl shadow-sm border border-sky-100"><input required placeholder="ชื่ออุปกรณ์" value={newEq.name} onChange={e => setNewEq({...newEq, name: e.target.value})} className="flex-1 bg-gray-50 border rounded-xl px-3 py-2 text-sm outline-none"/><input type="number" required placeholder="จำนวน" value={newEq.total_quantity} onChange={e => setNewEq({...newEq, total_quantity: parseInt(e.target.value), available_quantity: parseInt(e.target.value)})} className="w-20 bg-gray-50 border rounded-xl px-3 py-2 text-sm outline-none"/><input placeholder="Image URL (Icon)" value={newEq.image_url} onChange={e => setNewEq({...newEq, image_url: e.target.value})} className="flex-1 bg-gray-50 border rounded-xl px-3 py-2 text-sm outline-none"/><button type="submit" className="bg-sky-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-sky-700 flex items-center gap-2"><Plus size={16}/> Add</button></form>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{equipments.map(eq => (<div key={eq.id} className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-3">{editingEq?.id === eq.id ? (<div className="flex-1 space-y-2 w-full"><input value={editingEq.name} onChange={e => setEditingEq({...editingEq, name: e.target.value})} className="w-full border rounded p-1 text-sm"/><div className="flex gap-2"><span className="text-[10px] text-gray-500">All:</span><input type="number" value={editingEq.total_quantity} onChange={e => setEditingEq({...editingEq, total_quantity: parseInt(e.target.value)})} className="w-16 border rounded p-1 text-xs"/><span className="text-[10px] text-gray-500">Free:</span><input type="number" value={editingEq.available_quantity} onChange={e => setEditingEq({...editingEq, available_quantity: parseInt(e.target.value)})} className="w-16 border rounded p-1 text-xs"/></div><input placeholder="Image URL" value={editingEq.image_url} onChange={e => setEditingEq({...editingEq, image_url: e.target.value})} className="w-full border rounded p-1 text-xs"/><div className="flex gap-2 mt-2"><button onClick={saveEditEquipment} className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">Save</button><button onClick={() => setEditingEq(null)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs">Cancel</button></div></div>) : (<><img src={eq.image_url || 'https://via.placeholder.com/50'} className="w-10 h-10 object-contain p-1 bg-gray-50 rounded-lg"/><div className="flex-1"><h4 className="font-bold text-gray-800 text-sm">{eq.name}</h4><p className="text-[10px] text-gray-500">ว่าง <span className="font-bold text-blue-600">{eq.available_quantity}</span> / ทั้งหมด {eq.total_quantity} ชิ้น</p></div><div className="flex gap-1"><button onClick={() => setEditingEq(eq)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg"><Edit3 size={14}/></button><button onClick={() => deleteEquipment(eq.id)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button></div></>)}</div>))}</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <div className="space-y-4 animate-fade-in">
                            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Users className="text-emerald-500"/> Project Room Bookings</h2>
                            {bookings.length === 0 ? <p className="text-gray-400">ไม่มีคำขอจองห้อง</p> : bookings.map(b => (
                                <div key={b.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-gray-50">
                                    <div>
                                        <h4 className="font-bold text-gray-900">{b.rooms?.name || 'Unknown Room'} <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100'}`}>{b.status}</span></h4>
                                        <p className="text-xs text-gray-500">โดย: {b.profiles?.first_name} | {b.booking_date} เวลา {b.start_time?.slice(0,5)} - {b.end_time?.slice(0,5)}</p>
                                        <p className="text-xs text-emerald-600 mt-1">จุดประสงค์: {b.purpose}</p>
                                    </div>
                                    {b.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => updateBookingStatus(b.id, b.user_id, 'approved', b.rooms?.name)} className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200"><CheckCircle size={16}/></button>
                                            <button onClick={() => updateBookingStatus(b.id, b.user_id, 'rejected', b.rooms?.name)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200"><XCircle size={16}/></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'software' && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2"><Key className="text-purple-500"/> Software License Requests</h2>
                                <div className="space-y-2">
                                    {softReqs.length === 0 ? <p className="text-gray-400">ไม่มีคำขอ</p> : softReqs.map(sr => (
                                        <div key={sr.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-gray-50">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{sr.software_licenses?.name} <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100">{sr.status}</span></h4>
                                                <p className="text-xs text-gray-500 mt-1">ผู้ขอ: <span className="font-bold">{sr.profiles?.first_name}</span> | เมล: {sr.university_email || '-'}</p>
                                                <p className="text-xs text-gray-500">เหตุผล: {sr.request_reason}</p>
                                                {sr.license_key && <p className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-1 rounded inline-block mt-1">Key: {sr.license_key}</p>}
                                            </div>
                                            {sr.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => approveSoftware(sr.id, sr.user_id, sr.software_licenses?.name)} className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-200">Approve & Send Key</button>
                                                    <button onClick={() => rejectSoftware(sr.id, sr.user_id, sr.software_licenses?.name)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200">Reject</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-purple-50/50 p-6 rounded-3xl border border-purple-100 space-y-4">
                                <h3 className="font-bold text-base text-purple-900 flex items-center gap-2"><Key size={20}/> Software Catalog (คลังซอฟต์แวร์)</h3>
                                <form onSubmit={addSoftware} className="flex flex-col gap-2 bg-white p-4 rounded-2xl shadow-sm border border-purple-100">
                                    <div className="flex flex-col md:flex-row gap-2">
                                        <input required placeholder="ชื่อโปรแกรม" value={newSw.name} onChange={e => setNewSw({...newSw, name: e.target.value})} className="w-full md:w-1/3 bg-gray-50 border rounded-xl px-3 py-2 text-sm outline-none"/>
                                        <input placeholder="อายุการใช้งาน (เช่น 1 ปี, ตลอดชีพ)" value={newSw.validity_period} onChange={e => setNewSw({...newSw, validity_period: e.target.value})} className="w-full md:w-1/3 bg-gray-50 border rounded-xl px-3 py-2 text-sm outline-none"/>
                                        <input placeholder="Image URL (Logo)" value={newSw.icon_url} onChange={e => setNewSw({...newSw, icon_url: e.target.value})} className="w-full md:w-1/3 bg-gray-50 border rounded-xl px-3 py-2 text-sm outline-none"/>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-2">
                                        <input placeholder="รายละเอียด / ฟีเจอร์ (รองรับเว้นบรรทัด)" value={newSw.description} onChange={e => setNewSw({...newSw, description: e.target.value})} className="flex-1 bg-gray-50 border rounded-xl px-3 py-2 text-sm outline-none"/>
                                        <button type="submit" className="bg-purple-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 flex items-center justify-center gap-2 shrink-0"><Plus size={16}/> Add Software</button>
                                    </div>
                                </form>
                                <div className="space-y-3">
                                    {softwares.map(sw => (
                                        <div key={sw.id} className="bg-white p-4 rounded-2xl border shadow-sm flex items-start gap-4">
                                            {editingSw?.id === sw.id ? (
                                                <div className="flex-1 space-y-2 w-full">
                                                    <input value={editingSw.name} onChange={e => setEditingSw({...editingSw, name: e.target.value})} className="w-full border rounded p-1 text-sm font-bold" placeholder="ชื่อโปรแกรม"/>
                                                    <input value={editingSw.validity_period || ''} onChange={e => setEditingSw({...editingSw, validity_period: e.target.value})} className="w-full border rounded p-1 text-xs text-purple-600" placeholder="อายุการใช้งาน (เช่น 1 ปี)"/>
                                                    <textarea value={editingSw.description} onChange={e => setEditingSw({...editingSw, description: e.target.value})} className="w-full border rounded p-2 text-xs min-h-[60px]" placeholder="รายละเอียด/ฟีเจอร์"/>
                                                    <input placeholder="Image URL (Logo)" value={editingSw.icon_url} onChange={e => setEditingSw({...editingSw, icon_url: e.target.value})} className="w-full border rounded p-1 text-xs"/>
                                                    <div className="flex gap-2 pt-2">
                                                        <button onClick={saveEditSoftware} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Save</button>
                                                        <button onClick={() => setEditingSw(null)} className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <img src={sw.icon_url || 'https://via.placeholder.com/50'} className="w-12 h-12 object-contain p-1 bg-gray-50 rounded-xl shrink-0"/>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-800 text-sm">{sw.name}</h4>
                                                        <p className="text-[10px] font-bold text-purple-600 mt-1">⏱️ {sw.validity_period || 'ตลอดการเป็นนักศึกษา'}</p>
                                                        <p className="text-[10px] text-gray-500 whitespace-pre-wrap mt-1">{sw.description || 'ไม่มีรายละเอียด'}</p>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button onClick={() => setEditingSw(sw)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg"><Edit3 size={16}/></button>
                                                        <button onClick={() => deleteSoftware(sw.id)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'lab' && (
                        <div className="space-y-4 animate-fade-in">
                            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2"><Monitor className="text-pink-500"/> Live Lab Monitor</div>
                                <span className="text-xs bg-pink-100 text-pink-600 px-3 py-1 rounded-full">{labUsers.length} Users Active</span>
                            </h2>
                            {labUsers.length === 0 ? <p className="text-gray-400">ตอนนี้ไม่มีใครใช้งานห้อง Lab</p> : 
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {labUsers.map(lu => (
                                        <div key={lu.id} className="p-4 border border-pink-100 bg-pink-50/30 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <img src={lu.profiles?.avatar} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"/>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-sm">{lu.profiles?.first_name}</h4>
                                                    <p className="text-[10px] text-gray-500"><MapPin size={10} className="inline"/> {lu.rooms?.name}</p>
                                                    <p className="text-[10px] text-pink-500">In since: {new Date(lu.check_in_time).toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => forceCheckout(lu.id, lu.user_id, lu.rooms?.name, lu.profiles?.first_name)} className="bg-white border border-gray-200 text-red-500 p-2 rounded-xl hover:bg-red-50 hover:border-red-200" title="Force Check-out">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>
                    )}

                </div>
            </div>
        </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label, color, count }) {
    const activeColors = { blue: "bg-blue-600 text-white shadow-md", orange: "bg-orange-500 text-white shadow-md", sky: "bg-sky-500 text-white shadow-md", emerald: "bg-emerald-500 text-white shadow-md", purple: "bg-purple-600 text-white shadow-md", pink: "bg-pink-500 text-white shadow-md" };
    return (
        <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${active ? activeColors[color] : 'bg-white text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'}`}>
            <div className="flex items-center gap-3"><Icon size={18}/> {label}</div>
            {count > 0 && <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>{count}</span>}
        </button>
    )
}