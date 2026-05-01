'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useInView } from 'framer-motion';
import { FaGithub, FaReact, FaShieldAlt, FaChevronLeft, FaChevronRight, FaSearch, FaExternalLinkAlt, FaTimes } from 'react-icons/fa';
import { SiNextdotjs, SiTailwindcss, SiSupabase, SiVercel, SiFigma } from 'react-icons/si';

// =========================================================================
// 🍏 PREMIUM PHYSICS & ANIMATION CONSTANTS (ตามคำแนะนำที่ปรึกษา)
// =========================================================================

// สูตรลับ Custom Easing แบบ Apple (พุ่งเร็ว เบรกนุ่ม)
const appleEase = [0.22, 1, 0.36, 1];

// Stagger Container (สำหรับให้ของข้างในโผล่ไล่ระดับกัน)
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: appleEase } }
};

const scaleItem = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: appleEase } }
};

// =========================================================================
// 🗄️ STATIC DATA
// =========================================================================

const logos = [
  { icon: SiNextdotjs, name: "Next.js" }, { icon: FaReact, name: "React" },
  { icon: SiTailwindcss, name: "Tailwind CSS" }, { icon: SiSupabase, name: "Supabase" },
  { icon: SiVercel, name: "Vercel" }, { icon: SiFigma, name: "Figma" },
];

const sections = [
  { id: 'hero', label: 'Home' }, { id: 'onboarding', label: 'Onboarding' },
  { id: 'dashboard', label: 'Dashboard' }, { id: 'ecosystem', label: 'Ecosystem' },
  { id: 'community', label: 'Community' }, { id: 'control', label: 'Control Room' },
  { id: 'works', label: 'Selected Works' } // ✨ เพิ่มเมนูใหม่สำหรับโปรเจกต์อื่นๆ
];

const dashboardFeatures = [
  { id: "home", title: "Home & Updates", headline: "Your Campus, Centralized.", description: "แดชบอร์ดอัจฉริยะที่รวมทุกความเคลื่อนไหวในรั้ว SIT ไว้ในที่เดียว อัปเดตข่าวสารจากคณะ และเช็คตารางเรียนแบบ Real-time", color: "bg-blue-500", textColor: "text-blue-600", images: ["/showcase/Home-mockup.png", "/showcase/Home2-mockup.jpg"] },
  { id: "schedule", title: "Schedule & Enroll", headline: "Seamless Course Registration.", description: "บอกลาความวุ่นวายตอนลงทะเบียนเรียน ด้วยระบบ Enroll ที่อัปเดตตารางสอนทันที พร้อม Date Picker ที่ลื่นไหลสไตล์ Calendar ระดับโลก", color: "bg-purple-500", textColor: "text-purple-600", images: ["/showcase/Schedule-mockup.png", "/showcase/Enroll-mockup.jpg"] },
  { id: "assignments", title: "Assignments & Grading", headline: "End-to-End Tracking.", description: "จัดการชีวิตการเรียนง่ายขึ้น ด้วยระบบส่งการบ้านที่เชื่อมต่อกับหลังบ้าน เมื่ออาจารย์ตรวจให้คะแนน ระบบจะคำนวณและแสดงผลทันที", color: "bg-green-500", textColor: "text-green-600", images: ["/showcase/Assign-mockup.jpg", "/showcase/Assign2-mockup.jpg", "/showcase/Assign3-mockup.jpg"] }
];

const communityFeatures = [
  { id: "career", title: "Career Hub", icon: "💼", headline: "Crowdsourced Career Opportunities.", description: "ค้นหาบริษัทฝึกงานและตำแหน่งงานฮิตที่รุ่นพี่ SIT แนะนำ เพื่อเป็นไกด์ไลน์ในการวางแผนเส้นทางอาชีพ", color: "bg-blue-600", images: ['/showcase/company1-mockup.png', '/showcase/company2-mockup.png'] },
  { id: "events", title: "Dynamic Events", icon: "🎉", headline: "Time-Aware Event Management.", description: "ระบบกิจกรรมที่ชาญฉลาด เมื่อกด Quick Join ข้อมูลจะซิงค์กับตารางส่วนตัวบนหน้า Home อัตโนมัติ พร้อมระบบ Auto-Hide เมื่อหมดเวลากิจกรรม", color: "bg-orange-500", images: ['/showcase/event1-mockup.png', '/showcase/event2-mockup.png', '/showcase/event3-mockup.png'] },
  { id: "clubs", title: "Club Ecosystem", icon: "🤝", headline: "Decentralized Club Management.", description: "ให้อำนาจประธานชมรมในการบริหารจัดการสมาชิก พร้อมพื้นที่ประกาศข่าวสาร (Feed) ของแต่ละชมรม", color: "bg-purple-600", images: ['/showcase/club1-mockup.png', '/showcase/club2-mockup.png', '/showcase/club3-mockup.png', '/showcase/club4-mockup.png' , '/showcase/club5-mockup.png'] }
];

const ecosystemTabsData = [
  {
    id: 'docs', title: 'Auto-Generated Docs', icon: '📄', headline: 'Instant PDF Generation.',
    description: 'ลดขั้นตอนยุ่งยาก ดึงข้อมูลผลการเรียนมาสร้าง Transcript ชั่วคราวได้ทันที พร้อมระบบขอเอกสารตัวจริงแบบ Paperless',
    accentColor: 'text-blue-600', hoverBg: 'hover:bg-blue-50', images: ['/showcase/Doc0-mockup.jpg','/showcase/Document-mockup.png','/showcase/Doc2-mockup.jpg'],
  },
  {
    id: 'inventory', title: 'Smart Inventory', icon: '📱', headline: 'Real-time Booking & Management.',
    description: 'ยืมอุปกรณ์และจองห้องล่วงหน้า ผูกกับ Database แบบ Real-time พร้อมรับ Digital E-Voucher (QR Code)',
    accentColor: 'text-green-600', hoverBg: 'hover:bg-green-50', images: ['/showcase/eq-mockup.jpg', '/showcase/booking-mockup.jpg','/showcase/booking2-mockup.jpg'],
  },
  {
    id: 'license', title: 'Software Licenses', icon: '🔑', headline: 'Software Delivery.',
    description: 'เบิกจ่าย License  ผ่านระบบ Notification ',
    accentColor: 'text-purple-600', hoverBg: 'hover:bg-purple-50', images: ['/showcase/Lic-mockup.jpg', '/showcase/Lic2-mockup.jpg', '/showcase/Lic3-mockup.jpg', '/showcase/Lic4-mockup.jpg','/showcase/Lic5-mockup.jpg'],
  },
  {
    id: 'lostAndFound', title: 'Lost & Found Hub', icon: '🔍', headline: 'Centralized Lost & Found Feed.',
    description: 'ศูนย์กลางประกาศตามหาของหายและส่งคืนสิ่งของภายในคณะ ช่วยให้ชาว SIT ได้ของคืนอย่างรวดเร็ว',
    accentColor: 'text-orange-500', hoverBg: 'hover:bg-orange-50', images: ['/showcase/lost-mockup.jpg', '/showcase/lost2-mockup.jpg'],
  },
];

// ✨ ข้อมูลสำหรับ Control Room (ทำรองรับหลายรูป)
const controlRoomFeatures = [
  { id: "rbac", icon: "🔐", title: "Role-Based Access", desc: "ระบบจำกัดสิทธิ์ (RBAC) ระหว่าง User และ Admin (Owner Mode) พร้อมแผงควบคุมหลักที่สามารถจัดการข้อมูลนักศึกษา สิทธิ์การเข้าถึง และการทำ CRUD Operations ได้อย่างปลอดภัย", color: "bg-red-500", images: ["/showcase/admin1-mockup.png", "/showcase/admin2-mockup.png","/showcase/admin3-mockup.png", ] },
  { id: "academic", icon: "📚", title: "Academic Orchestration", desc: "จากเปิดรายวิชาถึงการตัดเกรด — Admin สามารถสร้างคลาสเรียนใหม่ (Plan) ให้ User ลงทะเบียน และมีระบบให้เกรด (Grading) ที่จะคำนวณและอัปเดต GPAX ของนักศึกษาโดยอัตโนมัติ", color: "bg-orange-500", images: ["/showcase/admin4-mockup.png", "/showcase/admin5-mockup.png" ,"/showcase/admin6-mockup.png"] },
  { id: "operations", icon: "🛠️", title: "Centralized Operations", desc: "ศูนย์กลางการรับเรื่อง (Ticket System) จากฟีเจอร์ Tools ทั้งหมด ไม่ว่าจะเป็นการขอเอกสาร จองห้อง หรือยืมของ ตรวจสอบ Approve/Reject และอัปเดตสถานะได้จากหน้าจอเดียว", color: "bg-amber-500", images: ["/showcase/admin7-mockup.png","/showcase/admin8-mockup.png","/showcase/admin9-mockup.png","/showcase/admin10-mockup.png", "/showcase/admin11-mockup.png"] },
  { id: "work", icon: "📝", title: "Work Console", desc: "ระบบสั่งและตรวจการบ้านครบวงจร สร้างงาน (Task), กำหนด Deadline, และเข้าสู่ Work Console เพื่อตรวจงานพร้อมให้คะแนน ซึ่งจะยิง Notification กลับไปยังนักศึกษาทันที", color: "bg-yellow-500", images: ["/showcase/admin12-mockup.png", "/showcase/admin13-mockup.png","/showcase/admin14-mockup.png" , "/showcase/admin15-mockup.png"] }
];

// ✨ ข้อมูลสำหรับ Selected Works (เวอร์ชันอัปเดตลิงก์และรูป Pad1-Pad9)
const selectedWorks = [
  { 
    id: "padlaek", title: "Padlaek", subtitle: "AI-Powered Sustainable Clothing Swap", 
    desc: "แพลตฟอร์มแลกเปลี่ยนเสื้อผ้าเพื่อความยั่งยืน พัฒนาด้วย Next.js และ Tailwind CSS เน้นการออกแบบ UI สไตล์ Tinder-swipe เพื่อประสบการณ์ที่ใช้งานง่ายและลื่นไหล", 
    fullDetails: "แอปพลิเคชันที่มีกลไกแบบ Tinder-swipe ให้ผู้ใช้สามารถ 'ปัด' เพื่อค้นหาและ Match เสื้อผ้าที่ต้องการแลกเปลี่ยนกันได้ หาก Match สำเร็จระบบจะเปิดให้ตกลงรายละเอียด (Deal) ความโดดเด่นคือการผสานการทำงานกับ AI โดยระบบจะใช้ข้อมูลสถานที่ (Location-based) มาประมวลผลและแสดงผลสิ่งของที่อยู่ใกล้เคียงขึ้นมาก่อน เพื่อความสะดวกในการแลกเปลี่ยนตามความเป็นจริง",
    tech: ["Next.js", "Tailwind CSS", "Front-End", "AI Integration"], linkLabel: "View Details", icon: <FaExternalLinkAlt />, 
    images: ["/showcase/pad1-mockup.png", "/showcase/pad2-mockup.png", "/showcase/pad3-mockup.png", "/showcase/pad4-mockup.png", "/showcase/pad5-mockup.png", "/showcase/pad6-mockup.png", "/showcase/pad7-mockup.png", "/showcase/pad8-mockup.png", "/showcase/pad9-mockup.png"],
    links: [
        { url: "https://github.com/pongsapak-dsi/Padlaek.git", label: "View GitHub Repo", icon: <FaGithub /> },
        { url: "https://padlaek.vercel.app", label: "Try Live Website", icon: <FaExternalLinkAlt /> } 
    ],
    gradient: "from-pink-500/20 to-rose-600/20", borderColor: "hover:border-rose-500/50" 
  },
  { 
    id: "webearbears", title: "We Bear Bears", subtitle: "Local Experience Travel Planner", 
    desc: "โปรเจกต์ด้าน UX/UI Research แก้ปัญหาการวางแผนท่องเที่ยวด้วยการออกแบบแอปพลิเคชันที่ปรับแต่ง Itinerary ได้ตามงบประมาณของผู้ใช้แบบ Real-time", 
    fullDetails: "ออกแบบระบบเพื่อแก้ปัญหาการท่องเที่ยวแบบเดิมๆ สำหรับชาวต่างชาติที่ต้องการเปิดประสบการณ์เที่ยวแบบ Local เหมือนคนไทย ด้วยฟีเจอร์ Budget-Aligned Itinerary ให้สามารถระบุงบประมาณ เลือกวัน และแพ็กเกจ (Bundle) ที่เหมาะสมได้ พร้อมระบบ In-app Collaboration ที่มีฟังก์ชันแชร์ทริปและพูดคุยกับเพื่อนในกลุ่มได้โดยตรง",
    tech: ["UX Research", "UI Design", "Figma", "Prototyping"], linkLabel: "View Details", icon: <FaExternalLinkAlt />, 
    images: ["/showcase/bear-mockup.png", "/showcase/bear1-mockup.png", "/showcase/bear2-mockup.png", "/showcase/bear3-mockup.png", "/showcase/bear4-mockup.png", "/showcase/bear5-mockup.png", "/showcase/bear6-mockup.png", "/showcase/bear7-mockup.png", "/showcase/bear8-mockup.png"], 
    links: [
        { url: "https://www.figma.com/proto/iRlN4gKVOtISYrqZHgRswb/Webearbears-Travel-Project?node-id=103-1075&p=f&viewport=143%2C488%2C0.13&t=JF9bhJnCvpV2piD0-1&scaling=min-zoom&content-scaling=fixed&starting-point-node-id=103%3A1075&show-proto-sidebar=1&page-id=47%3A428", label: "View Figma Prototype", icon: <SiFigma /> } 
    ],
    gradient: "from-emerald-400/20 to-teal-500/20", borderColor: "hover:border-teal-500/50" 
  }
];

// =========================================================================
// 🚀 MAIN PAGE COMPONENT
// =========================================================================

export default function ShowcasePage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Parallax / Scroll Effects for Hero
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]); 
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, 100]); // เพิ่ม Parallax เลื่อนลงนิดๆ

  const [activeSection, setActiveSection] = useState('hero');
  const [activeTab, setActiveTab] = useState(0);
  const [currentDashboardImageIndex, setCurrentDashboardImageIndex] = useState(0);
  const [activeCommunityTab, setActiveCommunityTab] = useState(0);
  const [currentCommunityImageIndex, setCurrentCommunityImageIndex] = useState(0);
  const [activeEcosystemTab, setActiveEcosystemTab] = useState(0);
  const [currentEcosystemImageIndex, setCurrentEcosystemImageIndex] = useState(0);
  
  // ✨ State สำหรับ Control Room
  const [activeControlTab, setActiveControlTab] = useState(0);
  const [currentControlImageIndex, setCurrentControlImageIndex] = useState(0);

  // ✨ State สำหรับ Modal ของ Selected Works
  const [activeModal, setActiveModal] = useState(null); // เก็บ id ของ project ที่เปิดอยู่, null คือปิด
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const [dynamicText, setDynamicText] = useState("STUDENTS");

  // Reset indices when tabs change
  useEffect(() => setCurrentDashboardImageIndex(0), [activeTab]);
  useEffect(() => setCurrentCommunityImageIndex(0), [activeCommunityTab]);
  useEffect(() => setCurrentEcosystemImageIndex(0), [activeEcosystemTab]);
  useEffect(() => setCurrentControlImageIndex(0), [activeControlTab]); 
  useEffect(() => setModalImageIndex(0), [activeModal]); // Reset รูปเมื่อเปลี่ยน Project ใน Modal

  // 🔥 1. อัปเกรด Dynamic Typing ด้วย requestAnimationFrame
  useEffect(() => {
    const words = ["STUDENTS.", "PROFESSORS.", "ADMINS.", "YOU."];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let lastTime = performance.now();
    let typingDelay = 150;
    let reqId;

    const type = (time) => {
      if (time - lastTime > typingDelay) {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
          setDynamicText(currentWord.substring(0, charIndex - 1));
          charIndex--;
          typingDelay = 50; 
        } else {
          setDynamicText(currentWord.substring(0, charIndex + 1));
          charIndex++;
          typingDelay = 150; 
        }

        if (!isDeleting && charIndex === currentWord.length) {
          isDeleting = true;
          typingDelay = 1500; 
        } else if (isDeleting && charIndex === 0) {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          typingDelay = 400; 
        }
        lastTime = time;
      }
      reqId = requestAnimationFrame(type);
    };
    
    reqId = requestAnimationFrame(type);
    return () => cancelAnimationFrame(reqId);
  }, []);

  const changeImage = (setter, arrayLength, direction) => {
    setter((prev) => (prev + direction + arrayLength) % arrayLength);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) { window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - 64, behavior: "smooth" }); setActiveSection(id); }
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); }); }, { rootMargin: '-70px 0px -40% 0px', threshold: 0 });
    sections.forEach((section) => { const el = document.getElementById(section.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  // ฟังก์ชันช่วยเหลือสำหรับ Modal
  const openModal = (project) => {
    setActiveModal(project);
    document.body.style.overflow = 'hidden'; // ล็อคหน้าจอไม่ให้เลื่อนตอนเปิด Popup
  };

  const closeModal = () => {
    setActiveModal(null);
    document.body.style.overflow = 'auto'; // ปลดล็อคหน้าจอ
  };

  return (
    <div ref={containerRef} className="bg-black text-white min-h-screen font-sans selection:bg-orange-500 selection:text-white overflow-hidden">
      
      {/* 📍 0. STICKY NAV */}
      <motion.nav initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.5, ease: appleEase }} className="fixed top-6 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
        <div className="flex items-center gap-1 p-1.5 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl pointer-events-auto overflow-x-auto max-w-full">
          {sections.map((section) => (
            <motion.button 
              key={section.id} 
              onClick={() => scrollToSection(section.id)} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }} 
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${ activeSection === section.id ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/10' }`}
            >
              {section.label}
            </motion.button>
          ))}
        </div>
      </motion.nav>

      {/* 📍 1. THE HOOK */}
      <section id="hero" className="h-screen flex flex-col justify-center items-center text-center px-4 relative overflow-hidden pt-16">
        <motion.div style={{ opacity: heroOpacity, scale: heroScale, y: heroY }} className="h-screen flex flex-col justify-center items-center text-center px-4 relative overflow-hidden w-full">
            <div className="absolute inset-0 z-0 opacity-40 blur-3xl" style={{ background: `radial-gradient(600px circle at center, rgba(30, 144, 255, 0.2), rgba(255, 69, 0, 0.15), transparent)` }}></div>
            
            <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: appleEase }} className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter leading-tight z-10 mb-4 md:mb-6 text-white px-2">
              SIT Student Platform.
              <span className="block text-gray-400 text-3xl sm:text-4xl md:text-6xl mt-2">
                The All-in-One Digital Campus <br className="hidden md:block" /> Experience for
                <span className="inline-block relative ml-3 text-orange-500">
                  {dynamicText}
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-2 bottom-1 w-1 h-8 sm:h-10 md:h-16 bg-orange-500 inline-block rounded-full"></motion.span>
                </span>
              </span>
            </motion.h1>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }} className="relative z-50 flex flex-col sm:flex-row w-full sm:w-auto items-center justify-center gap-4 sm:gap-6 mt-8 md:mt-12 px-6">
              {/* ✨ เปลี่ยนเป็น tag <a> เพื่อใส่ลิงก์ */}
              <motion.a href="https://sit-app-sandy.vercel.app/demo/admin" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(249, 115, 22, 0.6)" }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-full text-lg flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-xl">
                <FaShieldAlt className="text-xl" /> [ Try Admin Demo ]
              </motion.a>
              <motion.a href="https://sit-app-sandy.vercel.app/demo/student" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(59, 130, 246, 0.6)" }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto px-8 py-4 bg-gray-900 border border-gray-700 hover:border-blue-500 text-white font-semibold rounded-full text-lg flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-xl">
                <FaReact className="text-xl text-blue-400" /> [ Try Student Demo ]
              </motion.a>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 1.2, ease: appleEase }} className="absolute bottom-[-100px] sm:bottom-[-200px] left-1/2 -translate-x-1/2 w-[90%] md:w-[60%] aspect-[16/9] bg-gray-900/80 rounded-t-3xl border border-gray-800 p-4 shadow-2xl z-10 overflow-visible group">
              <div className="w-full h-full bg-black rounded-xl overflow-hidden flex items-center justify-center text-gray-600 font-mono text-xl border border-gray-800 relative z-10 transition-transform duration-700 group-hover:scale-[1.02]">
                <img src="/showcase/Home-mockup.png" alt="App Mockup" className="w-full h-full object-cover object-top"/>
              </div>
              <div className="absolute inset-0 bg-blue-500 blur-3xl rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-700 -z-10 scale-90"></div>
            </motion.div>
        </motion.div>
      </section>

      {/* 📍 Marquee */}
      <section className="bg-gray-950/50 py-10 border-y border-gray-800 overflow-hidden relative">
        <div className="flex w-[200%] marquee-container">
          {[...logos, ...logos, ...logos, ...logos].map((logo, index) => (
            <motion.div key={index} whileHover={{ scale: 1.1, filter: "grayscale(0%)", color: "#f97316" }} className="flex-none flex items-center justify-center gap-4 text-5xl text-gray-500 w-[250px] transition-all duration-300 grayscale select-none cursor-pointer"><logo.icon className="text-5xl" /><span className="text-2xl font-semibold tracking-tight text-white">{logo.name}</span></motion.div>
          ))}
        </div>
        <style jsx global>{` @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } } .marquee-container { animation: marquee 30s linear infinite; } .marquee-container:hover { animation-play-state: paused; } `}</style>
      </section>

      {/* 📍 2. THE ONBOARDING (กลับมาสมบูรณ์ 100% ตามโค้ดต้นฉบับ) */}
      <section id="onboarding" className="bg-black py-32 px-4 sm:px-8 md:px-16 relative z-10 scroll-margin-top-16">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }} className="max-w-7xl mx-auto">
          
          <motion.div variants={fadeUpItem} className="mb-12 md:mb-16">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tighter leading-tight">First Impressions <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Matter.</span></h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl">เริ่มต้นประสบการณ์ในรั้ว SIT ด้วยการ Onboarding ที่ออกแบบมาเพื่อคุณโดยเฉพาะ รองรับ Personalization และระบบตรวจสอบสิทธิ์ตั้งแต่ก้าวแรก</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,_auto)]">
            <motion.div variants={fadeUpItem} whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 30, 30, 1)' }} className="md:row-span-2 bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col relative overflow-hidden group">
              <h3 className="text-2xl font-bold text-white mb-2 z-10">Your Digital Persona</h3>
              <p className="text-gray-400 text-sm mb-6 z-10 leading-relaxed">ก้าวแรกสู่ SIT Campus ด้วยการเลือก Avatar ที่บ่งบอกความเป็นตัวคุณ สร้างประสบการณ์ที่เป็นมิตรและสนุกสนาน</p>
              <div className="flex-1 bg-black/50 rounded-xl border border-gray-800 flex items-center justify-center relative overflow-hidden group-hover:border-blue-500/50 transition-colors z-10 p-2">
                <img src="/showcase/Avatar-Mockup.png" alt="Avatar Mockup" className="w-full h-full object-contain"/>
              </div>
            </motion.div>
            
            <motion.div variants={fadeUpItem} className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col relative overflow-hidden group">
              <h3 className="text-2xl font-bold text-white mb-2 z-10">Path of Specialization</h3>
              <p className="text-gray-400 text-sm mb-6 z-10 max-w-lg leading-relaxed">ไม่ใช่แค่เลือกสาขา แต่คือการเปลี่ยน 'Vibe' ของแอปด้วย Dynamic Theming สี Accent จะเปลี่ยนอัตโนมัติตาม Major ที่คุณเลือก</p>
              <div className="flex-1 flex flex-col sm:flex-row gap-4 items-center justify-center z-10">
                <motion.div whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(59, 130, 246, 0.4)" }} whileTap={{ scale: 0.95 }} className="w-full sm:w-1/3 bg-black border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-blue-500"><div className="w-12 h-12 rounded-full bg-blue-500 mb-3 flex items-center justify-center text-white font-bold">IT</div><span className="text-gray-400 text-xs hover:text-white">Information Tech</span></motion.div>
                <motion.div whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(168, 85, 247, 0.4)" }} whileTap={{ scale: 0.95 }} className="w-full sm:w-1/3 bg-black border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-purple-500"><div className="w-12 h-12 rounded-full bg-purple-500 mb-3 flex items-center justify-center text-white font-bold">CS</div><span className="text-gray-400 text-xs hover:text-white">Computer Science</span></motion.div>
                <motion.div whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(34, 197, 94, 0.4)" }} whileTap={{ scale: 0.95 }} className="w-full sm:w-1/3 bg-black border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-green-500"><div className="w-12 h-12 rounded-full bg-green-500 mb-3 flex items-center justify-center text-white font-bold">DSI</div><span className="text-gray-400 text-xs hover:text-white">Digital Service</span></motion.div>
              </div>
            </motion.div>

            <motion.div variants={fadeUpItem} whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 30, 30, 1)' }} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col relative overflow-hidden group">
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Dynamic Routing</h3>
              <p className="text-gray-400 text-xs mb-4">ระบบตรวจสอบ Email Prefix แยกสิทธิ์ Student / Admin อัตโนมัติ</p>
              <div className="flex-1 bg-black/50 rounded-xl border border-gray-800 flex items-center justify-center group-hover:border-white/20 p-1"><img src="/showcase/DynamicRouting-mockup.png" alt="Dynamic Routing Mockup" className="w-full h-full object-contain object-center"/></div>
            </motion.div>
            
            <motion.div variants={fadeUpItem} whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 30, 30, 1)' }} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col relative overflow-hidden group">
              <h3 className="text-xl font-bold text-white mb-2 z-10 tracking-tight hover:text-orange-300">Owner Verification</h3>
              <p className="text-gray-400 text-xs mb-4 z-10 leading-relaxed group-hover:text-zinc-300">ขั้นกว่าของความปลอดภัยด้วย Secret Code สำหรับ God Mode</p>
              <div className="flex-1 bg-black/50 rounded-xl border border-gray-800 flex items-center justify-center z-10 group-hover:border-orange-500 transition-colors"><span className="text-orange-500 text-2xl font-mono tracking-widest font-bold group-hover:text-white">***2026</span></div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 📍 3. SMART DASHBOARD */}
      <section id="dashboard" className="bg-gray-50 py-32 px-4 sm:px-8 md:px-16 relative z-10 text-gray-900 border-t border-gray-200 scroll-margin-top-16">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }} className="max-w-7xl mx-auto overflow-visible">
          <motion.div variants={fadeUpItem} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">The Smart <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-sky-500">Dashboard.</span></h2>
            <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto">ศูนย์กลางการใช้ชีวิตในมหาวิทยาลัย ที่ออกแบบ UX/UI มาให้สะอาดตา ใช้งานง่าย และตอบสนองทุก Action ของคุณในเสี้ยววินาที</p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-12 items-center">
            
            <motion.div variants={scaleItem} className="w-full lg:w-3/5 order-2 lg:order-1 relative group/dashboard-mockup">
              <motion.div initial={{ rotateY: -10, rotateX: 5, perspective: 1000 }} whileInView={{ rotateY: 0, rotateX: 0 }} transition={{ duration: 1, ease: appleEase }} className="relative mx-auto w-full max-w-[800px] aspect-[4/3] bg-gray-900 rounded-[2.5rem] p-[12px] shadow-3xl overflow-visible transition-transform duration-500 hover:scale-[1.01]">
                <div className="w-full h-full bg-white rounded-[1.8rem] relative overflow-hidden flex flex-row shadow-inner border border-gray-800/50">
                  <div className="w-6 h-full bg-gray-900 flex items-center justify-center shrink-0 z-20 border-r border-gray-800"><div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div></div>
                  <div className="flex-1 relative bg-gray-50">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={`${activeTab}-${currentDashboardImageIndex}`} 
                        initial={{ opacity: 0, x: 30, scale: 0.98 }} 
                        animate={{ opacity: 1, x: 0, scale: 1 }} 
                        exit={{ opacity: 0, x: -30, scale: 0.98 }} 
                        transition={{ duration: 0.45, ease: appleEase }} 
                        className="absolute inset-0 flex items-center justify-center p-2"
                      >
                        <img src={dashboardFeatures[activeTab].images[currentDashboardImageIndex]} alt={`${dashboardFeatures[activeTab].title}`} className="w-full h-full object-contain drop-shadow-sm" />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                {dashboardFeatures[activeTab].images.length > 1 && (
                  <>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => changeImage(setCurrentDashboardImageIndex, dashboardFeatures[activeTab].images.length, -1)} className="absolute left-[-25px] top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 text-zinc-900 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm opacity-0 group-hover/dashboard-mockup:opacity-100 transition-opacity duration-300 z-30 hover:text-blue-600"><FaChevronLeft className="text-xl pr-1" /></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => changeImage(setCurrentDashboardImageIndex, dashboardFeatures[activeTab].images.length, 1)} className="absolute right-[-25px] top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 text-zinc-900 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm opacity-0 group-hover/dashboard-mockup:opacity-100 transition-opacity duration-300 z-30 hover:text-blue-600"><FaChevronRight className="text-xl pl-1" /></motion.button>
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-30 bg-black/40 px-3 py-2 rounded-full backdrop-blur-md">
                      {dashboardFeatures[activeTab].images.map((_, i) => (<button key={i} onClick={() => setCurrentDashboardImageIndex(i)} className={`h-2 rounded-full transition-all ${currentDashboardImageIndex === i ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white'}`} />))}
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>

            <motion.div variants={fadeUpItem} className="w-full lg:w-2/5 flex flex-col gap-5 order-1 lg:order-2">
              {dashboardFeatures.map((feature, index) => (
                <motion.div 
                  key={feature.id} 
                  onClick={() => setActiveTab(index)} 
                  whileTap={{ scale: 0.98 }}
                  className={`cursor-pointer rounded-2xl p-7 transition-all duration-300 border-2 ${ activeTab === index ? `bg-white border-transparent shadow-2xl scale-105 z-10` : `bg-transparent border-transparent hover:bg-gray-100 opacity-60 hover:opacity-100 scale-100` }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-1.5 h-9 rounded-full transition-colors ${activeTab === index ? feature.color : 'bg-gray-300'}`}></div>
                    <h3 className={`text-2xl font-bold ${activeTab === index ? 'text-gray-900 group-hover:text-gray-950 transition-colors' : 'text-gray-500'}`}>{feature.title}</h3>
                  </div>
                  <AnimatePresence>
                    {activeTab === index && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: appleEase }} className="overflow-hidden pl-5 group-hover:text-gray-900 transition-colors">
                        <h4 className={`font-semibold mb-2 text-lg ${feature.textColor}`}>{feature.headline}</h4>
                        <p className="text-gray-600 text-base leading-relaxed">{feature.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* 📍 4. CAMPUS ECOSYSTEM */}
      <section id="ecosystem" className="bg-white py-32 px-4 sm:px-8 md:px-16 relative z-10 border-t border-gray-100 scroll-margin-top-16">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }} className="max-w-7xl mx-auto">
          
          <motion.div variants={fadeUpItem} className="mb-16 text-center">
            <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tighter leading-tight">One App.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Every Campus Service.</span></h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">ย่อทุกบริการของคณะ SIT มาไว้ในมือคุณ ตั้งแต่การจัดการเอกสารไปจนถึงระบบเบิกจ่ายอุปกรณ์ ด้วย Workflow ที่จบในแอปเดียว (End-to-End Workflow)</p>
          </motion.div>

          {/* Horizontal Tabs */}
          <motion.div variants={fadeUpItem} className="flex justify-start md:justify-center items-center gap-3 mb-12 border border-gray-100 p-2 rounded-full bg-gray-50/50 backdrop-blur-sm shadow-inner overflow-x-auto max-w-full mx-auto scrollbar-hide">
            {ecosystemTabsData.map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveEcosystemTab(index)}
                whileTap={{ scale: 0.95 }}
                className={`whitespace-nowrap flex items-center gap-3 px-6 md:px-7 py-3.5 rounded-full text-sm md:text-base font-semibold transition-all duration-300 shadow-sm ${ activeEcosystemTab === index ? 'bg-zinc-900 text-white shadow-xl scale-105' : `bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${tab.hoverBg}` }`}
              >
                <span className="text-xl">{tab.icon}</span>
                {tab.title}
              </motion.button>
            ))}
          </motion.div>

          {/* Big Showcase Area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeEcosystemTab}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 1.02 }}
              transition={{ duration: 0.45, ease: appleEase }}
              className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-gray-100 flex flex-col gap-8 items-center"
            >
              <div className="text-center mb-2 md:mb-6">
                <h4 className={`text-2xl md:text-3xl font-bold mb-3 tracking-tight ${ecosystemTabsData[activeEcosystemTab].accentColor}`}>
                  {ecosystemTabsData[activeEcosystemTab].headline}
                </h4>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
                  {ecosystemTabsData[activeEcosystemTab].description}
                </p>
              </div>

              <div className="w-full relative group/ecosystem-img overflow-visible">
                <div className="relative mx-auto w-full max-w-[1000px] aspect-[16/10] sm:aspect-[16/9] bg-white rounded-2xl border border-gray-100 p-2 shadow-lg flex flex-col shadow-inner overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeEcosystemTab}-${currentEcosystemImageIndex}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.45, ease: appleEase }}
                      className="absolute inset-2 flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden"
                    >
                      <img 
                        src={ecosystemTabsData[activeEcosystemTab].images[currentEcosystemImageIndex]} 
                        alt="Feature Showcase" 
                        className="max-w-full max-h-full object-contain p-2 drop-shadow-md"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {ecosystemTabsData[activeEcosystemTab].images.length > 1 && (
                  <>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => changeImage(setCurrentEcosystemImageIndex, ecosystemTabsData[activeEcosystemTab].images.length, -1)} className={`absolute left-[-15px] md:left-[-25px] top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm opacity-0 group-hover/ecosystem-img:opacity-100 transition-opacity duration-300 z-30 border border-gray-100 ${ecosystemTabsData[activeEcosystemTab].accentColor}`}><FaChevronLeft className="text-lg md:text-xl pr-1" /></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => changeImage(setCurrentEcosystemImageIndex, ecosystemTabsData[activeEcosystemTab].images.length, 1)} className={`absolute right-[-15px] md:right-[-25px] top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm opacity-0 group-hover/ecosystem-img:opacity-100 transition-opacity duration-300 z-30 border border-gray-100 ${ecosystemTabsData[activeEcosystemTab].accentColor}`}><FaChevronRight className="text-lg md:text-xl pl-1" /></motion.button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md opacity-0 group-hover/ecosystem-img:opacity-100 transition-opacity">
                      {ecosystemTabsData[activeEcosystemTab].images.map((_, index) => (<button key={index} onClick={() => setCurrentEcosystemImageIndex(index)} className={`h-2.5 rounded-full transition-all duration-300 ${currentEcosystemImageIndex === index ? 'w-7 bg-white' : 'w-2.5 bg-white/50 hover:bg-white'}`} />))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </section>

      {/* 📍 5. THE COMMUNITY */}
      <section id="community" className="bg-slate-50 py-32 px-4 sm:px-8 md:px-16 relative z-10 border-t border-gray-200 overflow-visible scroll-margin-top-16">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }} className="max-w-7xl mx-auto relative z-10">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-100/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 -z-10"></div>

            <motion.div variants={fadeUpItem} className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">Engage & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 leading-tight">Discover.</span></h2>
              <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto">มากกว่าแค่แอปจัดการการเรียน แต่เป็น Hub สำหรับชาว SIT ในการค้นหาโอกาส เข้าร่วมกิจกรรม และขับเคลื่อนคอมมูนิตี้ไปพร้อมกัน</p>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-12 items-center overflow-visible">
              
              <motion.div variants={fadeUpItem} className="w-full lg:w-2/5 flex flex-col gap-4 order-2 lg:order-1">
                {communityFeatures.map((feature, index) => (
                  <motion.button 
                    key={feature.id} 
                    onClick={() => setActiveCommunityTab(index)} 
                    whileTap={{ scale: 0.97 }}
                    className={`flex items-center gap-5 p-6 rounded-2xl text-left transition-all duration-300 w-full group ${ activeCommunityTab === index ? `${feature.color} text-white shadow-3xl scale-[1.02] z-10 border-2 border-transparent` : `bg-white text-gray-600 hover:bg-gray-50 border border-gray-200` }`}
                  >
                    <div className={`text-3xl w-14 h-14 flex items-center justify-center rounded-full transition-transform duration-300 ${activeCommunityTab === index ? 'bg-white/20 scale-110' : 'bg-gray-100 text-gray-400 group-hover:text-sky-500'}`}>{feature.icon}</div>
                    <div>
                      <h3 className={`font-extrabold text-xl ${activeCommunityTab === index ? 'text-white' : 'text-gray-900 group-hover:text-gray-950 transition-colors'}`}>{feature.title}</h3>
                      {activeCommunityTab === index && <motion.div layoutId="communityTabUnderline" className="w-9 h-1 bg-white/60 rounded-full mt-1.5"></motion.div>}
                      <AnimatePresence>
                        {activeCommunityTab === index && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: appleEase }} className="text-white/80 text-sm mt-3 leading-relaxed pr-4">{feature.description}</motion.p>}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              <motion.div variants={scaleItem} className="w-full lg:w-3/5 order-1 lg:order-2 relative group/macbook-mockup">
                <motion.div initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 100, damping: 20 }} className="relative mx-auto w-full aspect-[16/10] bg-[#2C2C2E] rounded-t-2xl rounded-b-lg border-[8px] border-[#2C2C2E] shadow-2xl flex flex-col p-0 transition-transform duration-500 hover:scale-[1.02]">
                  <div className="h-6 w-full bg-[#1C1C1E] flex items-center px-3 gap-1.5 rounded-t-xl shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div><div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div><div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
                  </div>
                  <div className="flex-1 bg-gray-100 relative overflow-hidden rounded-b-md">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={`${activeCommunityTab}-${currentCommunityImageIndex}`} 
                        initial={{ opacity: 0, y: 40, scale: 0.9 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: -40, scale: 0.9 }} 
                        transition={{ type: "spring", stiffness: 300, damping: 25 }} 
                        className="absolute inset-0 flex items-center justify-center bg-gray-50"
                      >
                        <img src={communityFeatures[activeCommunityTab].images[currentCommunityImageIndex]} alt={`${communityFeatures[activeCommunityTab].title}`} className="w-full h-full object-contain p-1 drop-shadow-md" />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  {communityFeatures[activeCommunityTab].images.length > 1 && (
                    <>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => changeImage(setCurrentCommunityImageIndex, communityFeatures[activeCommunityTab].images.length, -1)} className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 text-zinc-900 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md opacity-0 group-hover/macbook-mockup:opacity-100 transition-all duration-300 z-30 hover:text-blue-600"><FaChevronLeft className="text-xl pr-1" /></motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => changeImage(setCurrentCommunityImageIndex, communityFeatures[activeCommunityTab].images.length, 1)} className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 text-zinc-900 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md opacity-0 group-hover/macbook-mockup:opacity-100 transition-all duration-300 z-30 hover:text-blue-600"><FaChevronRight className="text-xl pl-1" /></motion.button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-30 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                        {communityFeatures[activeCommunityTab].images.map((_, i) => (<button key={i} onClick={() => setCurrentCommunityImageIndex(i)} className={`h-1.5 rounded-full transition-all ${currentCommunityImageIndex === i ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`} />))}
                      </div>
                    </>
                  )}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[120%] h-3 bg-gradient-to-b from-[#8E8E93] to-[#48484A] rounded-b-full blur-[2px] opacity-30 -z-10"></div>
                </motion.div>
              </motion.div>

            </div>
        </motion.div>
      </section>

      {/* ✨ 📍 6. THE CONTROL ROOM */}
      <section id="control" className="bg-zinc-950 py-32 px-4 sm:px-8 md:px-16 relative z-10 border-t border-zinc-900 scroll-margin-top-16">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }} className="max-w-7xl mx-auto">
          <motion.div variants={fadeUpItem} className="mb-16 text-center">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tighter leading-tight">Absolute Control. <br className="hidden md:block"/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 leading-tight">Real-time Impact.</span></h2>
            <p className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">เหนือกว่าด้วยระบบจัดการหลังบ้าน (Admin Dashboard) เปลี่ยนความซับซ้อนให้เป็นเรื่องง่ายในคลิกเดียว</p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
            
            {/* Control Sidebar Tabs */}
            <motion.div variants={fadeUpItem} className="w-full lg:w-1/3 flex flex-col gap-4">
              {controlRoomFeatures.map((item, index) => (
                <motion.div 
                  key={item.id} 
                  onClick={() => setActiveControlTab(index)} 
                  whileTap={{ scale: 0.98 }}
                  className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 border border-zinc-800 ${ activeControlTab === index ? `bg-zinc-900/80 shadow-[0_0_30px_rgba(249,115,22,0.15)] scale-105 z-10 border-orange-500/30` : `bg-black/50 hover:bg-zinc-900 opacity-70 hover:opacity-100` }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors ${activeControlTab === index ? `${item.color} text-white shadow-lg` : 'bg-zinc-800 text-zinc-400'}`}>{item.icon}</div>
                    <h3 className={`text-xl font-bold ${activeControlTab === index ? 'text-white' : 'text-zinc-400'}`}>{item.title}</h3>
                  </div>
                  <AnimatePresence>
                    {activeControlTab === index && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden">
                        <p className="text-zinc-400 text-sm leading-relaxed mt-2">{item.desc}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>

            {/* Control Main Display */}
            <motion.div variants={scaleItem} className="w-full lg:w-2/3 relative group/control-mockup">
               <div className="relative mx-auto w-full aspect-[16/10] bg-black rounded-2xl border border-zinc-800 p-2 shadow-2xl flex flex-col shadow-inner overflow-hidden hover:scale-[1.01] transition-transform duration-500">
                 <div className="w-full h-8 bg-zinc-900 rounded-t-lg border-b border-zinc-800 flex items-center px-4 justify-between mb-2 shrink-0">
                    <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-zinc-700"></div><div className="w-3 h-3 rounded-full bg-zinc-700"></div><div className="w-3 h-3 rounded-full bg-zinc-700"></div></div>
                    <div className="text-[10px] font-mono text-zinc-500 bg-black px-4 py-1 rounded-full border border-zinc-800">admin.sit.kmutt.ac.th</div>
                 </div>
                 
                 <div className="flex-1 relative bg-zinc-950 rounded-b-lg overflow-hidden flex items-center justify-center border border-zinc-800/50">
                    <AnimatePresence mode="wait">
                      <motion.div key={`${activeControlTab}-${currentControlImageIndex}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.45, ease: appleEase }} className="absolute inset-0 flex items-center justify-center">
                        <img src={controlRoomFeatures[activeControlTab].images[currentControlImageIndex]} alt="Admin Mockup" className="w-full h-full object-contain p-1" />
                      </motion.div>
                    </AnimatePresence>
                 </div>

                 {controlRoomFeatures[activeControlTab].images.length > 1 && (
                  <>
                    <button onClick={() => changeImage(setCurrentControlImageIndex, controlRoomFeatures[activeControlTab].images.length, -1)} className="absolute left-[-15px] md:left-[-25px] top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-zinc-800 text-white rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover/control-mockup:opacity-100 transition-opacity z-30 border border-zinc-700 hover:bg-orange-600"><FaChevronLeft /></button>
                    <button onClick={() => changeImage(setCurrentControlImageIndex, controlRoomFeatures[activeControlTab].images.length, 1)} className="absolute right-[-15px] md:right-[-25px] top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-zinc-800 text-white rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover/control-mockup:opacity-100 transition-opacity z-30 border border-zinc-700 hover:bg-orange-600"><FaChevronRight /></button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30 bg-black/80 border border-zinc-800 px-4 py-2 rounded-full opacity-0 group-hover/control-mockup:opacity-100 transition-opacity">
                      {controlRoomFeatures[activeControlTab].images.map((_, index) => (<button key={index} onClick={() => setCurrentControlImageIndex(index)} className={`h-2.5 rounded-full transition-all ${currentControlImageIndex === index ? 'w-7 bg-orange-500' : 'w-2.5 bg-zinc-600 hover:bg-zinc-400'}`} />))}
                    </div>
                  </>
                )}
               </div>
            </motion.div>

          </div>
        </motion.div>
      </section>

            {/* ✨ 📍 7. SELECTED WORKS (อัปเกรด Card ให้รูปใหญ่ขึ้น + Popup) */}
      <section id="works" className="bg-black py-32 px-4 sm:px-8 md:px-16 relative z-10 border-t border-zinc-900 scroll-margin-top-16">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }} className="max-w-7xl mx-auto">
          <motion.div variants={fadeUpItem} className="mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tighter">Explore My <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-400">Selected Works.</span></h2>
            <p className="text-zinc-500 text-lg max-w-2xl">ผลงานอื่นๆ ที่โดดเด่นในด้าน Front-End Development และ UX/UI Design</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {selectedWorks.map((work) => (
              <motion.div 
                key={work.id} 
                variants={fadeUpItem} 
                whileHover={{ y: -8 }} 
                onClick={() => {
                  setActiveModal(work);
                  document.body.style.overflow = 'hidden';
                }}
                className={`cursor-pointer bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col group transition-all duration-300 ${work.borderColor}`}
              >
                {/* ✨ แก้ไข h-64 เป็น h-80 และ p-6 เป็น p-2 ให้รูปใหญ่ขึ้น */}
                <div className={`w-full h-80 relative bg-gradient-to-br ${work.gradient} flex items-center justify-center p-2 sm:p-4 overflow-hidden`}>
                   <div className="absolute inset-0 z-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                   <img src={work.images[0]} alt={work.title} className="w-full h-full object-cover rounded-xl shadow-2xl z-10 group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{work.title}</h3>
                  <h4 className="text-zinc-400 text-sm font-medium mb-4">{work.subtitle}</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">{work.desc}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                    {work.tech.map((t, i) => (
                      <span key={i} className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full font-mono">{t}</span>
                    ))}
                  </div>

                  <div className="inline-flex items-center gap-2 text-sm font-bold text-white bg-zinc-800 group-hover:bg-white group-hover:text-black px-6 py-3 rounded-full w-fit transition-colors duration-300">
                    {work.icon} {work.linkLabel} <FaExternalLinkAlt className="text-[10px]" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ✨ Modal Popup สำหรับ Selected Works */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => {
              setActiveModal(null);
              document.body.style.overflow = 'auto';
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} 
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col lg:flex-row shadow-2xl relative"
            >
              <button onClick={() => { setActiveModal(null); document.body.style.overflow = 'auto'; }} className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-zinc-800 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors border border-zinc-700">
                <FaTimes />
              </button>

              {/* ฝั่งซ้าย: รูปภาพ Slideshow (แยกการแสดงผลตามโปรเจกต์) */}
              <div className="w-full lg:w-3/5 bg-black p-4 sm:p-8 flex items-center justify-center relative min-h-[400px] lg:min-h-full border-b lg:border-b-0 lg:border-r border-zinc-800">
                
                {/* 📱 กรณีเป็น We Bear Bears โชว์กรอบ iPhone */}
                {activeModal.id === 'webearbears' ? (
                  <div className="relative w-[300px] h-[600px] bg-zinc-900 rounded-[40px] border-[12px] border-zinc-800 shadow-2xl overflow-hidden flex flex-col group/modal-slider">
                    {/* รอยบาก iPhone (Dynamic Island) */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-20 flex justify-center items-end pb-1">
                       <div className="w-12 h-1.5 bg-black/50 rounded-full"></div>
                    </div>
                    
                    <div className="w-full h-full relative">
                      <AnimatePresence mode="wait">
                        <motion.div 
                          key={modalImageIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 flex items-center justify-center bg-zinc-900"
                        >
                          {/* บังคับเป็น object-cover ให้เต็มจอมือถือ */}
                          <img src={activeModal.images[modalImageIndex]} alt={activeModal.title} className="w-full h-full object-cover" />
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* ✨ แก้ไขลูกศรให้อยู่ในกรอบจอ iPhone และกดง่ายขึ้น ✨ */}
                    {activeModal.images.length > 1 && (
                      <>
                        {/* ปุ่มซ้าย */}
                        <button 
                            onClick={() => changeImage(setModalImageIndex, activeModal.images.length, -1)} 
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover/modal-slider:opacity-100 transition-all hover:bg-white hover:text-black border border-zinc-700 z-30"
                        >
                            <FaChevronLeft className="text-sm pr-0.5" />
                        </button>
                        
                        {/* ปุ่มขวา */}
                        <button 
                            onClick={() => changeImage(setModalImageIndex, activeModal.images.length, 1)} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover/modal-slider:opacity-100 transition-all hover:bg-white hover:text-black border border-zinc-700 z-30"
                        >
                            <FaChevronRight className="text-sm pl-0.5" />
                        </button>

                        {/* จุดบอกตำแหน่ง เลื่อนลงมาล่างสุดของจอมือถือ */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm z-30">
                          {activeModal.images.map((_, i) => (
                              <button 
                                key={i} 
                                onClick={() => setModalImageIndex(i)} 
                                className={`h-1.5 rounded-full transition-all ${modalImageIndex === i ? 'w-4 bg-white' : 'w-1.5 bg-zinc-500'}`} 
                              />
                           ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  
                  /* 💻 กรณีเป็นโปรเจกต์อื่นๆ โชว์กรอบสี่เหลี่ยมแนวนอนปกติ */
                  <div className="w-full aspect-[16/10] sm:aspect-video relative rounded-xl overflow-hidden border border-zinc-800/50 group/modal-slider">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={modalImageIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center bg-zinc-900"
                      >
                        {/* ✨ เปลี่ยนเป็น object-contain เพื่อไม่ให้รูปโดนตัด */}
                        <img src={activeModal.images[modalImageIndex]} alt={activeModal.title} className="w-full h-full object-contain p-2" />
                      </motion.div>
                    </AnimatePresence>

                    {/* ลูกศรเลื่อนรูปใน Modal */}
                    {activeModal.images.length > 1 && (
                      <>
                        <button onClick={() => setModalImageIndex((prev) => (prev - 1 + activeModal.images.length) % activeModal.images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover/modal-slider:opacity-100 transition-all hover:bg-white hover:text-black backdrop-blur-sm border border-zinc-700"><FaChevronLeft className="pr-0.5" /></button>
                        <button onClick={() => setModalImageIndex((prev) => (prev + 1) % activeModal.images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover/modal-slider:opacity-100 transition-all hover:bg-white hover:text-black backdrop-blur-sm border border-zinc-700"><FaChevronRight className="pl-0.5" /></button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 px-3 py-2 rounded-full backdrop-blur-sm">
                          {activeModal.images.map((_, i) => (<button key={i} onClick={() => setModalImageIndex(i)} className={`h-2 rounded-full transition-all ${modalImageIndex === i ? 'w-6 bg-white' : 'w-2 bg-zinc-500'}`} />))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ฝั่งขวา: รายละเอียดโปรเจกต์ */}
              <div className="w-full lg:w-2/5 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">{activeModal.title}</h2>
                <h3 className="text-lg text-blue-400 font-medium mb-6">{activeModal.subtitle}</h3>
                
                <p className="text-zinc-300 leading-relaxed mb-8">
                  {activeModal.fullDetails}
                </p>

                <div className="mb-10">
                  <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Technologies Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeModal.tech.map((t, i) => (
                      <span key={i} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg font-mono">{t}</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-auto">
                  {activeModal.links.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-bold transition-all shadow-lg ${i === 0 ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700'}`}>
                      {link.icon} {link.label}
                    </a>
                  ))}
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📍 8. FOOTER */}
      <footer id="footer" className="bg-zinc-950 py-20 px-6 sm:px-10 md:px-16 border-t border-zinc-900 relative z-10 scroll-margin-top-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-12">
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-4 group cursor-pointer"><div className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center text-black font-bold text-xl group-hover:bg-white transition-colors">S</div><h2 className="text-3xl font-extrabold text-white tracking-tighter group-hover:text-orange-500 transition-colors leading-none">SIT<span className='text-orange-500 group-hover:text-white'>PLATFORM</span> Showcase</h2></div>
            <p className="text-zinc-500 text-base max-w-sm mb-7 leading-relaxed group-hover:text-zinc-300 transition-colors">A comprehensive digital campus experience built for KMUTT students. Designed with passion and engineered for performance.</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 max-w-sm">
              {[{ icon: SiNextdotjs, name: "Next.js 14+", c: "text-white" }, { icon: SiTailwindcss, name: "Tailwind CSS", c: "text-sky-400" }, { icon: SiSupabase, name: "Supabase", c: "text-green-500" }].map((tech, i) => (
                <span key={i} className="px-3.5 py-2 bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs rounded-full font-mono flex items-center gap-2 shadow-sm hover:border-zinc-600 hover:text-white cursor-pointer"><tech.icon className={tech.c}/> {tech.name}</span>
              ))}
              <span className="px-3.5 py-2 bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs rounded-full font-mono shadow-sm hover:border-zinc-600 hover:text-white cursor-pointer">✨ Framer Motion</span>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-7">
            <div className="flex gap-4">
              <motion.a whileHover={{ scale: 1.05, backgroundColor: 'rgba(39, 39, 42, 1)', borderColor: 'rgba(82, 82, 91, 1)' }} whileTap={{ scale: 0.95 }} href="https://github.com/pongsakorn18250" target="_blank" className="flex items-center gap-2.5 px-6 py-3.5 bg-zinc-900 text-white rounded-full transition-all border border-zinc-800 shadow-xl"><FaGithub className="text-2xl" /><span className="text-base font-semibold">View My GitHub</span></motion.a>
              <motion.a whileHover={{ scale: 1.05, backgroundColor: 'rgba(29, 78, 216, 1)' }} whileTap={{ scale: 0.95 }} href="/Resume_Pongsakorn_J.pdf" target="_blank" className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-full transition-all shadow-2xl shadow-blue-500/30"><span className="text-base font-semibold hover:text-sky-100 transition-colors">My Resume</span></motion.a>
            </div>
            <p className="text-zinc-600 text-sm text-center md:text-right mt-3 leading-relaxed">© 2026 Pongsakorn (Aon). All rights reserved.<br/>Crafted with <span className='text-orange-500 hover:text-white transition-colors cursor-default'>passion</span> for School of Information Technology (SIT), <br/>King Mongkut&apos;s University of Technology Thonburi (KMUTT).</p>
          </div>
        </div>
      </footer>
    </div>
  );
}