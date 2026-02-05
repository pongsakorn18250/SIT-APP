export default function Home() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div className="bg-sit-primary text-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <h1 className="text-4xl font-bold mb-2">SIT App</h1>
        <p className="text-blue-100">Config Success! 🚀</p>
      </div>
      <div className="mt-4 flex gap-2">
         <span className="bg-sit-secondary text-white px-4 py-2 rounded-lg">Blue Theme</span>
         <span className="bg-sit-neutral text-white px-4 py-2 rounded-lg">Neutral</span>
      </div>
    </div>
  );
}