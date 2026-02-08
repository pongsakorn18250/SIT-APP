import "./globals.css";
import ClientLayout from "../components/ClientLayout"; // 👈 เรียกตัวใหม่มาใช้
import FloatingNoti from"../components/FloatingNoti"; 

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* 👇 ลบ class md:pl-64 และ pb-24 ออกจาก body ให้หมด ให้เหลือแค่สีพื้นหลังพอ */}
      <body className="font-sans text-gray-900 bg-bg">
        
        {/* 👇 เอา ClientLayout มาห่อ children แทน Navbar เดิม */}
        <ClientLayout>
          {children}
        <FloatingNoti />
        </ClientLayout>

      </body>
    </html>
  );
}