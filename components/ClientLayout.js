"use client";
import { usePathname } from "next/navigation";
import Navbar from "./navbar";


export default function ClientLayout({ children }) {
  const pathname = usePathname();
  
  // รายชื่อหน้าที่ "ไม่ต้องมี Navbar" และ "ไม่ต้องเว้นที่"
  const isAuthPage = ["/login", "/register", "/select-major", "/select-character"].includes(pathname);

  return (
    <>
      {/* 1. แสดง Navbar เฉพาะตอนที่ไม่ใช่หน้า Auth */}
      {!isAuthPage && <Navbar />
      
      }
      

      {/* 2. จัดการพื้นที่เนื้อหา (Main Content) */}
      {/* ถ้าเป็นหน้า Auth: ไม่ต้องมี padding */}
      {/* ถ้าหน้าปกติ: ให้มี md:pl-64 (เว้นซ้าย) และ pb-24 (เว้นล่างมือถือ) */}
      <main className={`min-h-screen ${isAuthPage ? "" : "md:pl-64 pb-24 md:pb-0"}`}>
        {children}
      </main>
    </>
  );
}