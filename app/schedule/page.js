"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase"; 
import { useRouter } from "next/navigation";
import { 
  Calendar, MapPin, Clock, Plus, BookOpen, AlertCircle, Loader2, RefreshCw 
} from "lucide-react";

export default function SchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  
  const [viewMode, setViewMode] = useState("class"); 
  const [selectedDay, setSelectedDay] = useState("Mon"); 

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayIndex = new Date().getDay();
  
  useEffect(() => {
    setSelectedDay(days[todayIndex]);
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ✅ แก้ Query ดึงข้อมูลจาก classes โดยตรง
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        id, grade, status,
        classes (
          id, day_of_week, start_time, end_time, room, teacher, exam_date,
          subject_code, subject_name, credit
        )
      `)
      .eq("user_id", user.id);

    if (error) console.error(error);
    setEnrollments(data || []);
    setLoading(false);
  };

  const classSchedule = enrollments.filter(e => 
    e.classes?.day_of_week === selectedDay
  ).sort((a, b) => a.classes.start_time.localeCompare(b.classes.start_time));

  const examSchedule = enrollments.filter(e => 
    e.classes?.exam_date
  ).sort((a, b) => new Date(a.classes.exam_date) - new Date(b.classes.exam_date));

  const formatExamDate = (dateString) => {
    const date = new Date(dateString);
    return {
        day: date.getDate(),
        month: date.toLocaleString('default', { month: 'short' }),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32}/>
          <p className="text-xs font-bold text-gray-400 animate-pulse">Loading Schedule...</p>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-10 pt-28 md:pt-10">
      
      <div className="max-w-5xl mx-auto px-4 md:px-8">

          {/* --- Header --- */}
          <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                    My Schedule
                </h1>
                <p className="text-sm text-gray-500 mt-1 ml-1">Manage your classes & exams</p>
            </div>
            
            <button 
                onClick={fetchSchedule} 
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-sm text-gray-500"
                title="Refresh Data"
            >
                <RefreshCw size={20}/>
            </button>
          </div>

          {/* --- Toggle Switch (Center) --- */}
          <div className="flex justify-center mb-10">
            <div className="bg-gray-200 p-1.5 rounded-2xl flex relative w-full max-w-md shadow-inner">
                <div className={`absolute top-1.5 bottom-1.5 w-[48%] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${viewMode === 'exam' ? 'left-[50.5%]' : 'left-[1.5%]'}`}></div>
                <button 
                    onClick={() => setViewMode("class")}
                    className={`flex-1 py-3 text-sm font-bold z-10 text-center transition-colors ${viewMode === 'class' ? 'text-gray-900' : 'text-gray-500'}`}
                >
                    Class Schedule
                </button>
                <button 
                    onClick={() => setViewMode("exam")}
                    className={`flex-1 py-3 text-sm font-bold z-10 text-center transition-colors ${viewMode === 'exam' ? 'text-red-600' : 'text-gray-500'}`}
                >
                    Exam Mode
                </button>
            </div>
          </div>

          {/* === CLASS SCHEDULE === */}
          {viewMode === "class" && (
              <div className="animate-fade-in">
                  
                  {/* Grid Days */}
                  <div className="grid grid-cols-7 gap-2 md:gap-4 mb-8 w-full">
                      {days.map((day, index) => {
                          const isSelected = selectedDay === day;
                          const isToday = index === todayIndex;
                          return (
                              <button 
                                  key={day} 
                                  onClick={() => setSelectedDay(day)}
                                  className={`flex flex-col items-center justify-center w-full h-20 rounded-2xl transition-all border
                                      ${isSelected ? 'bg-gray-900 text-white border-gray-900 shadow-xl scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300 hover:bg-gray-50'}
                                      ${isToday && !isSelected ? 'border-blue-300 text-blue-600 bg-blue-50/50' : ''}
                                  `}
                              >
                                  <span className="text-[10px] font-bold uppercase tracking-wider mb-1">{day}</span>
                                  <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>{10 + index}</span>
                              </button>
                          )
                      })}
                  </div>

                  {/* Timeline */}
                  <div className="space-y-5 max-w-3xl mx-auto">
                      {classSchedule.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 opacity-50 bg-white rounded-3xl border border-dashed border-gray-200">
                              <BookOpen size={56} className="mb-3 text-gray-300"/>
                              <p className="text-gray-500 font-medium">No classes on {selectedDay}</p>
                              <button onClick={() => router.push('/schedule/register')} className="mt-5 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                                  + Register New Class
                              </button>
                          </div>
                      ) : (
                          classSchedule.map((item, i) => (
                              <div key={i} className="flex gap-6 group">
                                  {/* Time */}
                                  <div className="w-16 text-right pt-4 shrink-0">
                                      <p className="text-lg font-bold text-gray-800 leading-none">{item.classes.start_time?.slice(0,5)}</p>
                                      <p className="text-xs text-gray-400 mt-1 font-medium">{item.classes.end_time?.slice(0,5)}</p>
                                  </div>
                                  
                                  {/* Card */}
                                  <div className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all relative overflow-hidden group-hover:-translate-y-0.5">
                                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                                      
                                      <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                                  {item.classes.subject_code}
                                              </span>
                                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">Lecture</span>
                                          </div>
                                          <span className="text-xs font-bold text-gray-400">{item.classes.credit} Credits</span>
                                      </div>
                                      
                                      <h3 className="text-lg font-bold text-gray-800 mb-4 leading-tight">
                                          {item.classes.subject_name}
                                      </h3>
                                      
                                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-gray-500 pt-3 border-t border-gray-50">
                                          <div className="flex items-center gap-2"><MapPin size={16} className="text-red-500"/> <span className="font-semibold text-gray-700">{item.classes.room}</span></div>
                                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div> Aj. {item.classes.teacher}</div>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          )}

          {/* === EXAM SCHEDULE === */}
          {viewMode === "exam" && (
              <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
                  {examSchedule.length === 0 ? (
                      <div className="col-span-full text-center py-24 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                          <AlertCircle className="mx-auto mb-3 opacity-30" size={56}/>
                          <p className="text-base font-medium">No exams scheduled yet.</p>
                      </div>
                  ) : (
                      examSchedule.map((item, i) => {
                          const dateInfo = formatExamDate(item.classes.exam_date);
                          return (
                              <div key={i} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex hover:shadow-lg transition-all hover:-translate-y-1 group">
                                  {/* Left: Date Box */}
                                  <div className="w-24 bg-red-50 flex flex-col items-center justify-center text-red-600 border-r border-red-100 relative">
                                      <span className="text-3xl font-black leading-none tracking-tighter group-hover:scale-110 transition-transform">{dateInfo.day}</span>
                                      <span className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">{dateInfo.month}</span>
                                  </div>
                                  
                                  {/* Right: Details */}
                                  <div className="flex-1 p-5">
                                      <div className="flex justify-between items-start mb-2">
                                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.classes.subject_code}</span>
                                          <span className="text-[10px] font-bold text-white bg-red-500 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md shadow-red-200">
                                              <Clock size={12}/> {dateInfo.time}
                                          </span>
                                      </div>
                                      <h3 className="text-base font-bold text-gray-800 mb-4 line-clamp-1 group-hover:text-red-600 transition-colors">{item.classes.subject_name}</h3>
                                      
                                      <div className="flex justify-between items-end text-xs pt-3 border-t border-gray-50">
                                          <span className="text-gray-500">Room: <b className="text-gray-800 text-sm">{item.classes.room}</b></span>
                                          <div className="flex flex-col items-end">
                                             <span className="text-[10px] text-gray-400 mb-0.5">Seat No.</span>
                                             <span className="font-black text-lg text-gray-800 leading-none bg-gray-100 px-2 py-1 rounded-md min-w-[36px] text-center border border-gray-200">15</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )
                      })
                  )}
              </div>
          )}

      </div>

      {/* --- FAB (Register) --- */}
      <button 
        onClick={() => router.push('/schedule/register')}
        className="fixed bottom-28 md:bottom-10 right-6 w-16 h-16 bg-gray-900 text-white rounded-full shadow-2xl shadow-gray-400 flex items-center justify-center hover:bg-black hover:scale-110 active:scale-95 transition-all z-30 group"
        title="Register New Class"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300"/>
      </button>

    </div>
  );
}