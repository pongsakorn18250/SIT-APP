"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

// 🎨 รายชื่อ Avatar สไตล์ Adventurer (30 แบบ)
const AVATARS = [
  "Felix", "Aneka", "Zoe", "Jack", "Abby", "Liam", 
  "Molly", "Pepper", "Sugar", "Dusty", "Ginger", "Bandit",
  "Midnight", "Rocky", "Cuddles", "Snuggles", "Boots", "Whiskers",
  "Socks", "Tiger", "Shadow", "Coco", "Missy", "Jasper",
  "Smokey", "Loki", "Sasha", "Oscar", "Sammy", "Misty"
];

export default function SelectCharacter() {
  const router = useRouter();
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedAvatar) return alert("Please select an avatar!");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // อัปเดต Avatar ลง Database
      const { error } = await supabase
        .from("profiles")
        .update({ avatar: selectedAvatar })
        .eq("id", user.id);

      if (!error) {
        // ✅ แก้แล้ว: ไปหน้า Select Major ต่อ
        router.push("/select-major"); 
      } else {
        alert(error.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      
      <div className="text-center mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Choose Your Avatar</h1>
        <p className="text-gray-500">Pick a character that represents you! (You can change it later)</p>
      </div>

      {/* Grid เลือกตัวละคร */}
      <div className="w-full max-w-5xl h-[60vh] overflow-y-auto custom-scrollbar p-2 mb-8">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {AVATARS.map((seed) => {
                const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
                const isSelected = selectedAvatar === avatarUrl;

                return (
                    <button
                        key={seed}
                        onClick={() => setSelectedAvatar(avatarUrl)}
                        className={`
                            relative group flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200
                            ${isSelected 
                                ? "border-sit-primary bg-blue-50 scale-105 shadow-xl ring-2 ring-blue-200" 
                                : "border-transparent bg-white hover:border-gray-200 hover:shadow-md hover:-translate-y-1"
                            }
                        `}
                    >
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-2 bg-gray-100">
                            <img src={avatarUrl} alt={seed} className="w-full h-full object-cover" />
                        </div>
                        <span className={`text-sm font-bold ${isSelected ? "text-sit-primary" : "text-gray-400 group-hover:text-gray-600"}`}>
                            {seed}
                        </span>
                        
                        {isSelected && (
                            <div className="absolute top-2 right-2 bg-sit-primary text-white rounded-full p-1 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
      </div>

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={loading || !selectedAvatar}
        className={`
            w-full max-w-sm py-4 rounded-xl font-bold text-lg shadow-lg transition-all
            ${!selectedAvatar 
                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                : "bg-sit-primary text-white hover:bg-blue-700 hover:shadow-blue-200 active:scale-95"
            }
        `}
      >
        {loading ? "Saving..." : "Next: Select Major →"}
      </button>

    </div>
  );
}