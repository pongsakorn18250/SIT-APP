"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase"; // ถอย 3 ชั้นเพื่อหา lib
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Plus, Trash2, Eye, EyeOff, Image as ImageIcon, 
  Save, Loader2, Megaphone 
} from "lucide-react";

export default function AdminAnnouncements() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: "",
    image_url: "",
    link_url: "",
    is_active: true
  });

  useEffect(() => {
    fetchStories();
  }, []);

 const fetchStories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/register"); return; }

    // เช็คสิทธิ์ Admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === 'STUDENT') { router.push("/"); return; }

    // ✅ แก้ไข: เปลี่ยนจาก created_at เป็น start_date
    const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("start_date", { ascending: false }); // <-- แก้ตรงนี้
    
    if (error) {
        console.error("Error fetching stories:", error);
    } else {
        setStories(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return alert("Please enter a title");
    
    setIsSubmitting(true);
    // ใช้รูป Default ถ้าไม่ได้ใส่
    const finalImage = form.image_url || `https://ui-avatars.com/api/?name=${form.title}&background=random`;

    const { error } = await supabase.from("announcements").insert({
        title: form.title,
        image_url: finalImage,
        link_url: form.link_url,
        is_active: form.is_active
    });

    if (!error) {
        alert("Posted! 🎉");
        setForm({ title: "", image_url: "", link_url: "", is_active: true }); // Reset Form
        fetchStories(); // Refresh List
    } else {
        alert(error.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this story?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    fetchStories();
  };

  const toggleStatus = async (id, currentStatus) => {
    await supabase.from("announcements").update({ is_active: !currentStatus }).eq("id", id);
    fetchStories();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center pb-20">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Megaphone className="text-orange-500"/> Manage Announcements
                </h1>
                <p className="text-gray-500 text-sm">Post updates to the Home Screen (Stories)</p>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            
            {/* Left: Create Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Plus size={18}/> New Post</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400">Title (Required)</label>
                        <input 
                            className="w-full p-3 border rounded-xl bg-gray-50" 
                            placeholder="e.g. Welcome Freshmen!" 
                            value={form.title}
                            onChange={e => setForm({...form, title: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400">Image URL (Optional)</label>
                        <div className="flex gap-2">
                            <input 
                                className="w-full p-3 border rounded-xl bg-gray-50" 
                                placeholder="https://..." 
                                value={form.image_url}
                                onChange={e => setForm({...form, image_url: e.target.value})}
                            />
                            {form.image_url && <img src={form.image_url} className="w-12 h-12 rounded-lg object-cover border"/>}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">*Tip: Copy image address from Google or Unsplash</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400">Link URL (Optional)</label>
                        <input 
                            className="w-full p-3 border rounded-xl bg-gray-50" 
                            placeholder="https://kmutt.ac.th/news/..." 
                            value={form.link_url}
                            onChange={e => setForm({...form, link_url: e.target.value})}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 accent-green-500"
                            checked={form.is_active}
                            onChange={e => setForm({...form, is_active: e.target.checked})}
                        />
                        <span className="text-sm font-bold text-gray-600">Active Immediately</span>
                    </div>

                    <button disabled={isSubmitting} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin"/> : <><Save size={18}/> Post Story</>}
                    </button>
                </form>
            </div>

            {/* Right: Preview List */}
            <div className="space-y-4">
                <h2 className="font-bold text-gray-700 flex items-center gap-2"><ImageIcon size={18}/> Active Stories</h2>
                {stories.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed text-gray-400">No stories yet.</div>
                ) : (
                    stories.map(story => (
                        <div key={story.id} className={`bg-white p-3 rounded-xl border flex gap-3 items-center shadow-sm ${!story.is_active && 'opacity-60 grayscale'}`}>
                            <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 border">
                                <img src={story.image_url} className="w-full h-full object-cover"/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 truncate">{story.title}</h3>
                                <p className="text-xs text-gray-400 truncate">{story.link_url || "No link attached"}</p>
                                <div className={`text-[10px] font-bold mt-1 inline-block px-2 py-0.5 rounded ${story.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {story.is_active ? 'Active' : 'Hidden'}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <button onClick={() => toggleStatus(story.id, story.is_active)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                                    {story.is_active ? <Eye size={16}/> : <EyeOff size={16}/>}
                                </button>
                                <button onClick={() => handleDelete(story.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
      </div>
    </div>
  );
}