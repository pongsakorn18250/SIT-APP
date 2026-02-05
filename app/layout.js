import "./globals.css";
import ClientLayout from "../components/ClientLayout"; // 👈 เรียกตัวใหม่มาใช้

export const metadata = {
  title: "SIT App",
  description: "Survival Hub for SIT Students",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* 👇 ลบ class md:pl-64 และ pb-24 ออกจาก body ให้หมด ให้เหลือแค่สีพื้นหลังพอ */}
      <body className="font-sans text-gray-900 bg-bg">
        
        {/* 👇 เอา ClientLayout มาห่อ children แทน Navbar เดิม */}
        <ClientLayout>
          {children}
        </ClientLayout>

      </body>
    </html>
  );
}