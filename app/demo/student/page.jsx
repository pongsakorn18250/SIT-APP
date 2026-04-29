'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { supabase } from "../../../lib/supabase";

export default function StudentDemoLogin() {
    const router = useRouter();

    useEffect(() => {
        const autoLogin = async () => {
            // 1. สั่งล็อกอินอัตโนมัติ
            const { error } = await supabase.auth.signInWithPassword({
                email: 'student_demo@sit.kmutt.ac.th', // ใส่อีเมลจำลองที่สร้างไว้
                password: '123456', // ใส่รหัสผ่านที่สร้างไว้
            });

            if (!error) {
                // 2. ล็อกอินผ่านปุ๊บ เด้งไปหน้าแรก (หรือหน้า dashboard ของ user)
                window.location.href = '/';
            } else {
                alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบจำลอง กรุณาลองใหม่อีกครั้ง');
                console.error(error);
            }
        };

        autoLogin();
    }, [router]);

    // หน้าจอโหลดดิ้งระหว่างรอ Redirect
    return (
        <div className="flex h-screen items-center justify-center bg-black text-white font-sans">
            <div className="text-center flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                <p className="text-xl font-semibold animate-pulse">กำลังพากรรมการเข้าสู่ระบบฝั่ง Student... 🚀</p>
            </div>
        </div>
    );
}