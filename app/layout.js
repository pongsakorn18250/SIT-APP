import "./globals.css";
import Navbar from "../components/navbar"; // นำเข้า Navbar ที่เพิ่งสร้าง

export const metadata = {
  title: "SIT App",
  description: "Survival Hub for SIT Students",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans text-gray-900 bg-bg pb-24 md:pb-0 md:pl-64">
        {/* - pb-24: มือถือเว้นที่ด้านล่างกันเนื้อหาโดน Navbar บัง
           - md:pl-64: จอใหญ่เว้นที่ด้านซ้ายให้ Sidebar 
        */}
        
        <Navbar />
        
        {/* ส่วนเนื้อหาของแต่ละหน้าจะมาโผล่ตรงนี้ */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}