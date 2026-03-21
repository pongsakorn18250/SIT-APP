// ไฟล์: app/components/PageSkeleton.js
export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-10 pt-20">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        
        {/* หัวกระดาษ */}
        <div className="flex flex-col items-center mb-6 space-y-2">
            <div className="w-32 h-6 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-48 h-3 bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        {/* แบนเนอร์ใหญ่ */}
        <div className="w-full h-32 bg-gray-200 rounded-3xl animate-pulse"></div>

        {/* กล่องเมนูย่อย (Grid) */}
        <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-3xl animate-pulse flex flex-col p-4 justify-between">
                    <div className="w-10 h-10 bg-gray-300 rounded-xl"></div>
                    <div className="w-2/3 h-3 bg-gray-300 rounded-full"></div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}