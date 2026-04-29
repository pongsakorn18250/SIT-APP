'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "../../../lib/supabase";

export default function AdminDemoLogin() {
    const router = useRouter();

    useEffect(() => {
        const autoLogin = async () => {
            const { error } = await supabase.auth.signInWithPassword({
                email: 'owner_demo@sit.kmutt.ac.th', // ใส่อีเมลจำลองฝั่งแอดมิน
                password: '123456',
            });

            if (!error) {
                // ล็อกอินผ่านปุ๊บ เด้งไปหน้า admin
                window.location.href = '/admin';
            } else {
                alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบจำลอง กรุณาลองใหม่อีกครั้ง');
                console.error(error);
            }
        };

        autoLogin();
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center bg-zinc-950 text-white font-sans">
            <div className="text-center flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="text-xl font-semibold animate-pulse">กำลังเตรียม Control Room ให้กรรมการ... 🛠️</p>
            </div>
        </div>
    );
}