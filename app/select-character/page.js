"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
  import { ChevronLeft } from "lucide-react";
// รวมมิตรตัวละครน่ารักๆ (ใช้ API DiceBear)
const characters = [
  { id: "felix", name: "Felix", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" },
  { id: "coco", name: "Coco", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Coco" },
  { id: "zack", name: "Zack", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Zack" },
  { id: "mia", name: "Mia", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Mia" },
  { id: "abby", name: "Abby", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Abby" },
  { id: "max", name: "Max", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Max" },
];

export default function SelectCharacter() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedChar, setSelectedChar] = useState(null);
  const [user, setUser] = useState(null);
 // เพิ่ม ChevronLeft // ใช้ไอคอนสื่อความหมาย

  // 1. เช็ค Login
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/register");
      setUser(user);
    };
    getUser();
  }, [router]);

  // 2. บันทึกตัวละคร
  const handleSaveCharacter = async () => {
    if (!user || !selectedChar) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ avatar: selectedChar.url }) // บันทึก URL รูปภาพ
      .eq("id", user.id);

    if (error) {
      alert("Error: " + error.message);
      setLoading(false);
    } else {
      // เสร็จแล้วไปเลือกสาขาต่อ
      router.push("/select-major");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <button 
        onClick={() => router.push("/register")} // ถอยกลับไปหน้าเลือกตัวละคร
        className="md:hidden absolute top-6 left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-sit-primary z-10"
      >
        <ChevronLeft size={24} />
      </button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sit-primary mb-2">Choose Your Avatar</h1>
        <p className="text-gray-500">Pick a character that represents you!</p>
      </div>

      {/* Grid ตัวละคร */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10 w-full max-w-2xl">
        {characters.map((char) => (
          <button
            key={char.id}
            onClick={() => setSelectedChar(char)}
            className={`relative p-4 rounded-3xl transition-all duration-300 flex flex-col items-center gap-2 group border-4 
              ${selectedChar?.id === char.id 
                ? "bg-white border-sit-secondary shadow-xl scale-105" 
                : "bg-white/50 border-transparent hover:scale-105 hover:bg-white"}`}
          >
            <img src={char.url} alt={char.name} className="w-24 h-24 rounded-full bg-blue-50" />
            <span className={`font-bold ${selectedChar?.id === char.id ? "text-sit-primary" : "text-gray-400"}`}>
              {char.name}
            </span>
            
            {/* วงกลมติ๊กถูก */}
            {selectedChar?.id === char.id && (
              <div className="absolute -top-2 -right-2 bg-sit-secondary text-white rounded-full p-1 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ปุ่ม Confirm */}
      <button
        disabled={!selectedChar || loading}
        onClick={handleSaveCharacter}
        className="w-full max-w-xs bg-sit-primary text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-sit-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "Saving..." : "Confirm Character"}
      </button>

    </div>
  );
}