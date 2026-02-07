"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

const AVATAR_SEEDS = [
  "Felix", "Aneka", "Zoe", "Jack", "Abby", "Liam", 
  "Molly", "Pepper", "Sugar", "Dusty", "Ginger", "Bandit",
  "Midnight", "Rocky", "Cuddles", "Snuggles", "Boots", "Whiskers",
  "Socks", "Tiger", "Shadow", "Coco", "Missy", "Jasper",
  "Smokey", "Loki", "Sasha", "Oscar", "Sammy", "Misty"
];

export default function SelectCharacterPage() {
  const router = useRouter();
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/register"); return; }
      setUser(user);
    };
    fetchUser();
  }, []);

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) return;
    setLoading(true);

    const { error } = await supabase.from("profiles").update({ avatar: selectedAvatar }).eq("id", user.id);

    if (error) {
        alert(error.message);
        setLoading(false);
    } else {
        // 🕵️‍♂️ CHECK ROLE AGAIN (เพื่อส่งไปห้องลับ)
        const email = user.email?.toLowerCase() || "";
        const name = user.user_metadata?.full_name?.toLowerCase() || "";
        
        if (email.includes("admin") || email.includes("owner") || 
            name.includes("admin") || name.includes("owner")) {
            
            // 🚪 ไปห้องลับ
            router.push("/select-role"); 
        } else {
            // 🎓 ไปเลือกสาขา
            router.push("/select-major"); 
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Choose Your Avatar</h1>
        <p className="text-gray-500">Pick a character that represents you!</p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 mb-8 max-w-3xl">
        {AVATAR_SEEDS.map((seed) => {
          const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
          const isSelected = selectedAvatar === url;
          return (
            <button 
              key={seed} 
              onClick={() => setSelectedAvatar(url)} 
              className={`relative rounded-2xl overflow-hidden border-4 aspect-square transition-all duration-200 ${isSelected ? "border-sit-primary scale-110 shadow-xl ring-4 ring-blue-100" : "border-transparent bg-white hover:scale-105 hover:shadow-md"}`}
            >
              <img src={url} alt={seed} className="w-full h-full object-cover" />
              {isSelected && (
                <div className="absolute top-1 right-1 bg-sit-primary rounded-full p-0.5 border-2 border-white shadow-sm">
                   <CheckCircle size={16} className="text-white fill-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button 
        onClick={handleSaveAvatar} 
        disabled={!selectedAvatar || loading}
        className="px-12 py-4 bg-sit-primary text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin"/> : "Continue"}
      </button>
    </div>
  );
}