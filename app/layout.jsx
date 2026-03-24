import "./globals.css";
import ClientLayout from "../components/ClientLayout"; // 👈 เรียกตัวใหม่มาใช้
import FloatingNoti from"../components/FloatingNoti"; 
import MiniProfile from "../components/MiniProfile"; 
import { Toaster } from 'react-hot-toast';

export const viewport = {
  themeColor: "#ffffff",
};

export const metadata = {
  title: "SIT App",
  description: "SIT Student Portal",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SIT App",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* 👇 ลบ class md:pl-64 และ pb-24 ออกจาก body ให้หมด ให้เหลือแค่สีพื้นหลังพอ */}
      <body className="font-sans text-gray-900 bg-bg">
       
        {/* 👇 เอา ClientLayout มาห่อ children แทน Navbar เดิม */}
        <ClientLayout>
            <MiniProfile />
          {children}
          
        {/* ย้าย MiniProfile มาไว้ที่นี่ เพื่อให้มันแยกการทำงานกับ Navbar และไม่โดนเงื่อนไขซ่อนบนหน้า Profile */}
        <FloatingNoti />
        <Toaster position="top-right" reverseOrder={false} />
        </ClientLayout>

      </body>
    </html>
  );
}