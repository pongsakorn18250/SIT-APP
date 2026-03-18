'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useAnimation, AnimatePresence, useInView } from 'framer-motion';
import { FaGithub, FaReact, FaDatabase, FaBolt, FaCloud, FaShieldAlt } from 'react-icons/fa';
import { SiNextdotjs, SiTailwindcss, SiSupabase, SiVercel, SiFigma } from 'react-icons/si';

// ข้อมูลโลโก้สำหรับ Marquee
const logos = [
  { icon: SiNextdotjs, name: "Next.js" },
  { icon: FaReact, name: "React" },
  { icon: SiTailwindcss, name: "Tailwind CSS" },
  { icon: SiSupabase, name: "Supabase" },
  { icon: SiVercel, name: "Vercel" },
  { icon: SiFigma, name: "Figma" },
];

// ข้อมูล Section สำหรับ Nav
// ข้อมูล Section สำหรับ Nav (Minimalist)
const sections = [
  { id: 'hero', label: 'Home' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'ecosystem', label: 'Ecosystem' },
  { id: 'community', label: 'Community' },
  { id: 'control', label: 'Control Room' },
];

// 🎨 Component สำหรับทำ Scroll Animation (Fade In & Slide Up)
const ScrollAnimateSection = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.1 }); // false = ให้แอนิเมชันทำงานทุกครั้งที่เลื่อนมาเจอ, 0.3 = โชว์ 30% ของกล่องถึงเริ่มทำงาน

  const variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut", delay: delay } }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className="scroll-animate-wrapper"
    >
      {children}
    </motion.div>
  );
};

export default function ShowcasePage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // 📍 State สำหรับ Hero Section
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]); // ให้ Hero ค่อยๆ หายไปอย่างรวดเร็ว
  const scale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  // 📍 State สำหรับ Navigation และ Active Section
  const [activeSection, setActiveSection] = useState('hero');

  // 📍 State สำหรับ Smart Dashboard
  const [activeTab, setActiveTab] = useState(0);
  const dashboardFeatures = [
    { id: "home", title: "Home & Updates", headline: "Your Campus, Centralized.", description: "แดชบอร์ดอัจฉริยะที่รวมทุกความเคลื่อนไหวในรั้ว SIT ไว้ในที่เดียว อัปเดตข่าวสารจากคณะ และเช็คตารางเรียนแบบ Real-time", color: "bg-blue-500", textColor: "text-blue-600", image: "/showcase/Home-mockup.png" },
    { id: "schedule", title: "Schedule & Enroll", headline: "Seamless Course Registration.", description: "บอกลาความวุ่นวายตอนลงทะเบียนเรียน ด้วยระบบ Enroll ที่อัปเดตตารางสอนทันที พร้อม Date Picker ที่ลื่นไหลสไตล์ Calendar ระดับโลก", color: "bg-purple-500", textColor: "text-purple-600", image: "/showcase/Schedule-mockup.png"  },
    { id: "assignments", title: "Assignments & Grading", headline: "End-to-End Tracking.", description: "จัดการชีวิตการเรียนง่ายขึ้น ด้วยระบบส่งการบ้านที่เชื่อมต่อกับหลังบ้าน เมื่ออาจารย์ตรวจให้คะแนน ระบบจะคำนวณและแสดงผลทันที", color: "bg-green-500", textColor: "text-green-600", image: "/showcase/Homework-mockup.png" }
  ];

  // 📍 State สำหรับ The Community
  const [activeCommunityTab, setActiveCommunityTab] = useState(0);
  const communityFeatures = [
    { id: "career", title: "Career Hub", icon: "💼", headline: "Crowdsourced Career Opportunities.", description: "ค้นหาบริษัทฝึกงานและตำแหน่งงานฮิตที่รุ่นพี่ SIT แนะนำ เพื่อเป็นไกด์ไลน์ในการวางแผนเส้นทางอาชีพ", mockupText: "[ Top Company & Career UI ]", color: "bg-blue-600" },
    { id: "events", title: "Dynamic Events", icon: "🎉", headline: "Time-Aware Event Management.", description: "ระบบกิจกรรมที่ชาญฉลาด เมื่อกด Quick Join ข้อมูลจะซิงค์กับตารางส่วนตัวบนหน้า Home อัตโนมัติ", mockupText: "[ Upcoming Events UI ]", color: "bg-orange-500" },
    { id: "clubs", title: "Club Ecosystem", icon: "🤝", headline: "Decentralized Club Management.", description: "ให้อำนาจประธานชมรมในการบริหารจัดการสมาชิก พร้อมพื้นที่ประกาศข่าวสาร (Feed) ของแต่ละชมรม", mockupText: "[ Join Club & Manage UI ]", color: "bg-purple-600" }
  ];

  // 📍 Logic สำหรับ Dynamic Typing Hero
  const [dynamicText, setDynamicText] = useState("STUDENTS");
  const words = ["STUDENTS.", "PROFESSORS.", "ADMINS.", "YOU."];
  const typingSpeed = 150;
  const wordDelay = 1500;

  useEffect(() => {
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let currentWord = "";
    let typingInterval;

    const type = () => {
      currentWord = words[wordIndex];
      if (isDeleting) {
        setDynamicText(currentWord.substring(0, charIndex - 1));
        charIndex--;
      } else {
        setDynamicText(currentWord.substring(0, charIndex + 1));
        charIndex++;
      }

      if (!isDeleting && charIndex === currentWord.length) {
        isDeleting = true;
        clearInterval(typingInterval);
        setTimeout(() => {
          typingInterval = setInterval(type, typingSpeed);
        }, wordDelay);
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        clearInterval(typingInterval);
        setTimeout(() => {
          typingInterval = setInterval(type, typingSpeed);
        }, typingSpeed * 3);
      }
    };

    typingInterval = setInterval(type, typingSpeed);
    return () => clearInterval(typingInterval);
  }, []);

  // 📍 Logic สำหรับ Smooth Scrolling ตอนกด Nav และ Highlight Active Section
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      // 💡 เพิ่ม offset จาก Nav สูง 64px
      const navOffset = 64; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveSection(id);
    }
  };

  // 💡 Highlight Active Section ตอน Scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-70px 0px -40% 0px', // เวิร์คเวิลตรงNav และ พื้นที่ช่วงล่างจอ
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="bg-black text-white min-h-screen font-sans selection:bg-orange-500 selection:text-white">
      
    {/* 📍 0. STICKY NAV (Minimal Floating Pill) */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        className="fixed top-6 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4"
      >
        {/* Container: Glassmorphism Pill */}
        <div className="flex items-center gap-1 p-1.5 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl pointer-events-auto overflow-x-auto max-w-full">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeSection === section.id 
                  ? 'bg-white text-black shadow-md' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </motion.nav>

      {/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */}

      {/* 📍 1. THE HOOK (Hero - Custom Scroll Animation kept) */}
      <section id="hero" className="h-screen flex flex-col justify-center items-center text-center px-4 relative overflow-hidden pt-16">
        <motion.div style={{ opacity, scale }} className="h-screen flex flex-col justify-center items-center text-center px-4 relative overflow-hidden w-full">
            {/* Vercel Glow */}
            <div className="absolute inset-0 z-0 opacity-40 blur-3xl" style={{
                background: `radial-gradient(600px circle at center, rgba(30, 144, 255, 0.2), rgba(255, 69, 0, 0.15), transparent)`
            }}></div>

           {/* Typing Headline */}
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter leading-tight z-10 mb-4 md:mb-6 text-white px-2">
              SIT Student Platform.
              <span className="block text-gray-400 text-3xl sm:text-4xl md:text-6xl mt-2">
                The All-in-One Digital Campus <br className="hidden md:block" /> Experience for
                <span className="inline-block relative ml-3 text-orange-500">
                  {dynamicText}
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="absolute -right-2 bottom-1 w-1 h-8 sm:h-10 md:h-16 bg-orange-500 inline-block"></motion.span>
                </span>
              </span>
            </motion.h1>

            {/* CTA Buttons */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="flex flex-col sm:flex-row w-full sm:w-auto items-center justify-center gap-4 sm:gap-6 mt-8 md:mt-12 z-20 px-6">
              <motion.button whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(249, 115, 22, 0.6)" }} className="w-full sm:w-auto px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-full text-lg flex items-center justify-center gap-3 transition-all duration-300">
                <FaShieldAlt className="text-xl" /> [ Try Admin Demo ]
              </motion.button>
              <motion.button whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(59, 130, 246, 0.6)" }} className="w-full sm:w-auto px-8 py-4 bg-gray-900 border border-gray-700 hover:border-blue-500 text-white font-semibold rounded-full text-lg flex items-center justify-center gap-3 transition-all duration-300">
                <FaReact className="text-xl text-blue-400" /> [ Try Student Demo ]
              </motion.button>
            </motion.div>

            {/* Floating App Mockup */}
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 1, type: "spring", stiffness: 50 }} className="absolute bottom-[-100px] sm:bottom-[-200px] left-1/2 -translate-x-1/2 w-[90%] md:w-[60%] aspect-[16/9] bg-gray-900/80 rounded-t-3xl border border-gray-800 p-4 shadow-2xl z-10">
              <div className="w-full h-full bg-black rounded-xl overflow-hidden flex items-center justify-center text-gray-600 font-mono text-xl border border-gray-800">
               <img src="/showcase/Home-mockup.png" alt="App Mockup" className="w-full h-full object-cover object-top"/>
              </div>
            </motion.div>
        </motion.div>
      </section>

      {/* 📍 Tech Stack Marquee (Always Visible) */}
      <section className="bg-gray-950/50 py-10 border-y border-gray-800 overflow-hidden relative">
        <div className="flex w-[200%] marquee-container">
          {[...logos, ...logos, ...logos, ...logos].map((logo, index) => (
            <motion.div key={index} whileHover={{ scale: 1.1, filter: "grayscale(0%)", color: "#f97316" }} className="flex-none flex items-center justify-center gap-4 text-5xl text-gray-500 w-[250px] transition-all duration-300 grayscale select-none cursor-pointer">
              <logo.icon className="text-5xl" />
              <span className="text-2xl font-semibold tracking-tight text-white">{logo.name}</span>
            </motion.div>
          ))}
        </div>
        <style jsx global>{`
          @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
          .marquee-container { animation: marquee 30s linear infinite; }
          .marquee-container:hover { animation-play-state: paused; }
        `}</style>
      </section>

      {/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */}
      {/* 📍 2. THE ONBOARDING (Scroll Animated) */}
      <section id="onboarding" className="bg-black py-32 px-4 sm:px-8 md:px-16 relative z-10 scroll-margin-top-16">
        <ScrollAnimateSection>
            <div className="max-w-7xl mx-auto">
              
              <div className="mb-12 md:mb-16">
                <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tighter leading-tight">First Impressions <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Matter.</span></h2>
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl">
                  เริ่มต้นประสบการณ์ในรั้ว SIT ด้วยการ Onboarding ที่ออกแบบมาเพื่อคุณโดยเฉพาะ รองรับ Personalization และระบบตรวจสอบสิทธิ์ตั้งแต่ก้าวแรก
                </p>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,_auto)]">
                {/* 📦 Box 1 */}
                <motion.div whileHover={{ scale: 1.02 }} className="md:row-span-2 bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <h3 className="text-2xl font-bold text-white mb-2 z-10">Your Digital Persona</h3>
                  <p className="text-gray-400 text-sm mb-6 z-10 leading-relaxed">ก้าวแรกสู่ SIT Campus ด้วยการเลือก Avatar ที่บ่งบอกความเป็นตัวคุณ สร้างประสบการณ์ที่เป็นมิตรและสนุกสนาน</p>
                  <div className="flex-1 bg-black/50 rounded-xl border border-gray-800 flex items-center justify-center relative overflow-hidden group-hover:border-blue-500/50 transition-colors z-10">
                   <img src="/showcase/Avatar-Mockup.png" alt="Avatar Mockup" className="w-full h-full object-cover object-top"/>
                  </div>
                </motion.div>
                {/* 📦 Box 2 */}
                <motion.div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col relative overflow-hidden group">
                  <h3 className="text-2xl font-bold text-white mb-2 z-10">Path of Specialization</h3>
                  <p className="text-gray-400 text-sm mb-6 z-10 max-w-lg leading-relaxed">ไม่ใช่แค่เลือกสาขา แต่คือการเปลี่ยน 'Vibe' ของแอปด้วย Dynamic Theming สี Accent จะเปลี่ยนอัตโนมัติตาม Major ที่คุณเลือก</p>
                  <div className="flex-1 flex flex-col sm:flex-row gap-4 items-center justify-center z-10">
                    {/* IT Card */}
                    <motion.div whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(59, 130, 246, 0.4)" }} className="w-full sm:w-1/3 bg-black border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-blue-500">
                       <div className="w-12 h-12 rounded-full bg-blue-500 mb-3 flex items-center justify-center text-white font-bold">IT</div>
                       <span className="text-gray-400 text-xs">Information Tech</span>
                    </motion.div>
                    {/* CS Card */}
                    <motion.div whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(168, 85, 247, 0.4)" }} className="w-full sm:w-1/3 bg-black border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-purple-500">
                       <div className="w-12 h-12 rounded-full bg-purple-500 mb-3 flex items-center justify-center text-white font-bold">CS</div>
                       <span className="text-gray-400 text-xs">Computer Science</span>
                    </motion.div>
                    {/* DSI Card */}
                    <motion.div whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(34, 197, 94, 0.4)" }} className="w-full sm:w-1/3 bg-black border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-green-500">
                       <div className="w-12 h-12 rounded-full bg-green-500 mb-3 flex items-center justify-center text-white font-bold">DSI</div>
                       <span className="text-gray-400 text-xs">Digital Service</span>
                    </motion.div>
                  </div>
                </motion.div>
                {/* 📦 Box 3 */}
                <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col relative overflow-hidden group">
                  <h3 className="text-xl font-bold text-white mb-2">Dynamic Routing</h3>
                  <p className="text-gray-400 text-xs mb-4">ระบบตรวจสอบ Email Prefix แยกสิทธิ์ Student / Admin อัตโนมัติ</p>
                  <div className="flex-1 bg-black/50 rounded-xl border border-gray-800 flex items-center justify-center"><img src="/showcase/DynamicRouting-mockup.png" alt="Dynamic Routing Mockup" className="w-full h-full object-cover object-top"/></div>
                </motion.div>
                {/* 📦 Box 4 */}
                <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <h3 className="text-xl font-bold text-white mb-2 z-10">Owner Verification</h3>
                  <p className="text-gray-400 text-xs mb-4 z-10 leading-relaxed">ขั้นกว่าของความปลอดภัยด้วย Secret Code สำหรับ God Mode</p>
                  <div className="flex-1 bg-black/50 rounded-xl border border-gray-800 flex items-center justify-center z-10 group-hover:border-orange-500/50 transition-colors">
                     <span className="text-orange-500 text-xl font-mono tracking-widest font-bold">***2026</span>
                  </div>
                </motion.div>
              </div>
            </div>
        </ScrollAnimateSection>
      </section>

      {/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */}
      {/* 📍 3. SMART DASHBOARD (Scroll Animated) */}
      <section id="dashboard" className="bg-gray-50 py-32 px-4 sm:px-8 md:px-16 relative z-10 text-gray-900 border-t border-gray-200 scroll-margin-top-16">
        <ScrollAnimateSection>
            <div className="max-w-7xl mx-auto">
              
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">The Smart <span className="text-blue-600">Dashboard.</span></h2>
                <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto">
                  ศูนย์กลางการใช้ชีวิตในมหาวิทยาลัย ที่ออกแบบ UX/UI มาให้สะอาดตา ใช้งานง่าย และตอบสนองทุก Action ของคุณในเสี้ยววินาที
                </p>
              </div>

              <div className="flex flex-col lg:flex-row gap-12 items-center">
                {/* 🖥️ Left Side (iPad) */}
                <div className="w-full lg:w-3/5 order-2 lg:order-1 relative group">
                  <motion.div initial={{ rotateY: -10, rotateX: 5, perspective: 1000 }} whileInView={{ rotateY: 0, rotateX: 0 }} transition={{ duration: 1 }} className="relative mx-auto w-full max-w-[800px] aspect-[4/3] bg-white rounded-[2rem] border-[12px] border-gray-900 shadow-3xl overflow-hidden flex items-center justify-center p-0">
                    {/* Bezel */}
                    <div className="absolute top-0 bottom-0 left-0 w-4 bg-gray-900 z-20 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div></div>
                    {/* Screen Content */}
                    <div className="w-full h-full bg-gray-100 relative overflow-hidden shadow-inner">
                      <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="absolute inset-0 flex items-center justify-center bg-white border-l border-gray-200"
                        >
                          <img 
      src={dashboardFeatures[activeTab].image} 
      alt={dashboardFeatures[activeTab].title} 
      className="w-full h-full object-cover object-top" 
    />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>

                {/* 🖱️ Right Side (Tabs) */}
                <div className="w-full lg:w-2/5 flex flex-col gap-5 order-1 lg:order-2">
                  {dashboardFeatures.map((feature, index) => (
                    <motion.div key={feature.id} onClick={() => setActiveTab(index)} className={`cursor-pointer rounded-2xl p-7 transition-all duration-300 border-2 ${ activeTab === index ? `bg-white border-transparent shadow-2xl scale-105 z-10` : `bg-transparent border-transparent hover:bg-gray-100 opacity-60 hover:opacity-100 scale-100` }`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`w-1.5 h-9 rounded-full transition-colors ${activeTab === index ? feature.color : 'bg-gray-300'}`}></div>
                        <h3 className={`text-2xl font-bold ${activeTab === index ? 'text-gray-900' : 'text-gray-500'}`}>{feature.title}</h3>
                      </div>
                      <AnimatePresence>
                        {activeTab === index && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden pl-5"
                          >
                            <h4 className={`font-semibold mb-2 text-lg ${feature.textColor}`}>{feature.headline}</h4>
                            <p className="text-gray-600 text-base leading-relaxed">{feature.description}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
        </ScrollAnimateSection>
      </section>

      {/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */}
      {/* 📍 4. CAMPUS ECOSYSTEM (Scroll Animated) */}
      <section id="ecosystem" className="bg-white py-32 px-4 sm:px-8 md:px-16 relative z-10 border-t border-gray-100 scroll-margin-top-16">
        <ScrollAnimateSection>
            <div className="max-w-7xl mx-auto">
              
              <div className="mb-12 md:mb-16 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tighter leading-tight">One App. <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Every Campus Service.</span></h2>
                  <p className="text-gray-500 text-lg max-w-2xl leading-relaxed">
                    ย่อทุกบริการของคณะ SIT มาไว้ในมือคุณ ตั้งแต่การจัดการเอกสารไปจนถึงระบบเบิกจ่ายอุปกรณ์ ด้วย Workflow ที่จบในแอปเดียว (End-to-End Workflow)
                  </p>
                </div>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(220px,_auto)] px-2">
                {/* 📦 Box 1 */}
                <motion.div whileHover={{ y: -5, boxShadow: "0px 20px 40px rgba(0,0,0,0.12)", borderColor: 'rgba(30,144,255,0.3)' }} className="md:col-span-2 lg:col-span-2 md:row-span-2 bg-gray-50 border border-gray-200 rounded-[2.5rem] p-9 flex flex-col relative overflow-hidden group transition-all duration-300 shadow-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4 z-10">Auto-Generated Documents</h3>
                  <p className="text-gray-500 text-base mb-10 z-10 max-w-sm leading-relaxed">ลดขั้นตอนที่ยุ่งยากด้วย <strong>Instant PDF Generation</strong> ดึงข้อมูลผลการเรียนมาสร้างเอกสาร Transcript ชั่วคราวได้ทันที พร้อมระบบขอเอกสารตัวจริงแบบ Paperless</p>
                  <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-lg flex items-center justify-center relative overflow-hidden group-hover:border-blue-400 transition-colors z-10">
                    <span className="text-gray-400 text-base font-mono font-medium">[ Unofficial Transcript UI ]</span>
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-gray-100/50 to-transparent blur-xl"></div>
                  </div>
                </motion.div>
                {/* 📦 Box 2 */}
                <motion.div whileHover={{ y: -5, boxShadow: "0px 20px 40px rgba(0,0,0,0.12)", borderColor: 'rgba(34,197,94,0.3)' }} className="md:col-span-1 lg:col-span-2 bg-gray-50 border border-gray-200 rounded-[2.5rem] p-9 flex flex-col relative overflow-hidden group transition-all duration-300 shadow-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex justify-between items-start z-10 mb-5">
                    <h3 className="text-2xl font-bold text-gray-900">Smart Inventory <br/>& Booking</h3>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl">📱</div>
                  </div>
                  <p className="text-gray-500 text-base mb-8 z-10 leading-relaxed">ยืมอุปกรณ์และจองห้องล่วงหน้า ผูกกับ Database แบบ Real-time พร้อมรับ <strong>Digital E-Voucher (QR Code)</strong> ทันทีที่ Admin อนุมัติ</p>
                  <div className="flex-1 bg-white rounded-xl border border-gray-200 flex items-center justify-center z-10 group-hover:border-green-400 transition-colors px-10"><span className="text-green-500 text-sm font-mono font-semibold">[ E-Voucher QR Code ]</span></div>
                </motion.div>
                {/* 📦 Box 3 */}
                <motion.div whileHover={{ y: -5, boxShadow: "0px 20px 40px rgba(0,0,0,0.12)", borderColor: 'rgba(168,85,247,0.3)' }} className="md:col-span-1 lg:col-span-1 bg-gray-50 border border-gray-200 rounded-[2.5rem] p-7 flex flex-col relative overflow-hidden group transition-all duration-300 shadow-sm"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-3 z-10 tracking-tight">Software Licenses</h3>
                  <p className="text-gray-500 text-xs mb-5 z-10 leading-relaxed">เบิกจ่าย License นักศึกษาแบบอัตโนมัติ (เช่น Figma, GitHub) ผ่านระบบ Notification</p>
                  <div className="flex-1 bg-white rounded-xl border border-gray-200 flex items-center justify-center z-10 group-hover:border-purple-400 transition-colors"><span className="text-gray-400 text-xs font-mono tracking-tight">[ License Redeem ]</span></div>
                </motion.div>
                {/* 📦 Box 4 */}
                <motion.div whileHover={{ y: -5, boxShadow: "0px 20px 40px rgba(0,0,0,0.12)", borderColor: 'rgba(249,115,22,0.3)' }} className="md:col-span-1 lg:col-span-1 bg-zinc-900 border border-gray-800 rounded-[2.5rem] p-7 flex flex-col relative overflow-hidden group transition-all duration-300 shadow-sm text-white"
                >
                  <h3 className="text-xl font-bold mb-3 z-10 text-orange-400 tracking-tight">Micro-Community</h3>
                  <p className="text-gray-400 text-xs mb-5 z-10 leading-relaxed">ระบบประกาศตามหาของหาย (Lost & Found) และแจ้งซ่อมอุปกรณ์ (Maintenance) 24 ชม.</p>
                  <div className="flex-1 bg-black/50 rounded-xl border border-gray-700 flex items-center justify-center z-10 group-hover:border-orange-500 transition-colors"><span className="text-gray-500 text-xs font-mono tracking-tight">[ Lost & Found Feed ]</span></div>
                </motion.div>
              </div>
            </div>
        </ScrollAnimateSection>
      </section>

      {/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */}
      {/* 📍 5. THE COMMUNITY (Scroll Animated) */}
      <section id="community" className="bg-slate-50 py-32 px-4 sm:px-8 md:px-16 relative z-10 border-t border-gray-200 overflow-hidden scroll-margin-top-16">
        <ScrollAnimateSection>
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-100/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">Engage & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Discover.</span></h2>
                <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto">
                  มากกว่าแค่แอปจัดการการเรียน แต่เป็น Hub สำหรับชาว SIT ในการค้นหาโอกาส เข้าร่วมกิจกรรม และขับเคลื่อนคอมมูนิตี้ไปพร้อมกัน
                </p>
              </div>

              <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
                {/* 🖱️ Left Side (Tabs Nav) */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                  {communityFeatures.map((feature, index) => (
                    <button key={feature.id} onClick={() => setActiveCommunityTab(index)} className={`flex items-center gap-5 p-6 rounded-2xl text-left transition-all duration-300 w-full hover:scale-102 ${ activeCommunityTab === index ? `${feature.color} text-white shadow-3xl scale-105 z-10 border-2 border-transparent` : `bg-white text-gray-600 hover:bg-gray-100 border border-gray-200` }`}
                    >
                      <div className={`text-3xl w-14 h-14 flex items-center justify-center rounded-full ${activeCommunityTab === index ? 'bg-white/20' : 'bg-gray-100 text-gray-400 group-hover:text-blue-500'}`}>{feature.icon}</div>
                      <div>
                        <h3 className={`font-extrabold text-xl ${activeCommunityTab === index ? 'text-white' : 'text-gray-900 group-hover:text-blue-600 transition-colors'}`}>{feature.title}</h3>
                        {activeCommunityTab === index && (
                          <motion.div layoutId="communityTabUnderline" className="w-9 h-1 bg-white/60 rounded-full mt-1.5"></motion.div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* 🖥️ Right Side (Content) */}
                <div className="w-full lg:w-2/3 relative">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeCommunityTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="w-full bg-white rounded-[2.5rem] border border-gray-200 shadow-3xl overflow-hidden p-9 lg:p-14 min-h-[500px] flex flex-col relative"
                    >
                        {/* Content Header */}
                        <div className="mb-10 relative">
                          <span className={`inline-block px-5 py-2 rounded-full text-sm font-semibold mb-5 text-white ${communityFeatures[activeCommunityTab].color} shadow-sm`}>{communityFeatures[activeCommunityTab].title}</span>
                          <h3 className="text-3xl font-extrabold text-gray-900 mb-5 leading-snug">{communityFeatures[activeCommunityTab].headline}</h3>
                          <p className="text-gray-500 leading-relaxed text-lg max-w-2xl">{communityFeatures[activeCommunityTab].description}</p>
                          <div className={`absolute -top-10 -right-10 w-40 h-40 ${communityFeatures[activeCommunityTab].color} rounded-full opacity-5 blur-2xl z-0`}></div>
                        </div>
                        {/* Mockup Image Area */}
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.3 }} className="flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center p-8 mt-auto group transition-colors hover:border-dashed hover:border-gray-300"
                        >
                          <span className="text-gray-400 font-mono font-medium text-xl transition-colors group-hover:text-gray-500">{communityFeatures[activeCommunityTab].mockupText}</span>
                        </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
        </ScrollAnimateSection>
      </section>

      {/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */}
      {/* 📍 6. THE CONTROL ROOM (Scroll Animated) */}
      <section id="control" className="bg-zinc-950 py-32 px-4 sm:px-8 md:px-16 relative z-10 border-t border-zinc-900 scroll-margin-top-16">
        <ScrollAnimateSection>
            <div className="max-w-7xl mx-auto">
              
              <div className="mb-16 text-center">
                <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tighter leading-tight">
                  Absolute Control. <br className="hidden md:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Real-time Impact.</span>
                </h2>
                <p className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                  เหนือกว่าด้วยระบบจัดการหลังบ้าน (Admin Dashboard) ที่ครอบคลุมทุกมิติ ตั้งแต่การวางแผนการศึกษาไปจนถึงการบริหารทรัพยากร เปลี่ยนความซับซ้อนให้เป็นเรื่องง่ายในคลิกเดียว
                </p>
              </div>

              {/* Grid Cards 2x2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7 lg:gap-9 px-2">
                
                {/* 👑 Card 1 */}
                <motion.div whileHover={{ scale: 1.03, borderColor: "rgba(249, 115, 22, 0.45)", boxShadow: "0px 20px 40px rgba(0,0,0,0.5)" }} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-9 flex flex-col transition-all duration-300 group shadow-lg"
                >
                  <div className="flex items-center gap-5 mb-5">
                    <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 text-3xl group-hover:bg-orange-500 group-hover:text-white transition-colors">🔐</div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Role-Based Access</h3>
                  </div>
                  <p className="text-zinc-400 text-base mb-10 flex-1 leading-relaxed">ระบบจำกัดสิทธิ์ (RBAC) ระหว่าง User และ Admin (Owner Mode) พร้อมแผงควบคุมหลักที่สามารถจัดการข้อมูลนักศึกษา สิทธิ์การเข้าถึง และการทำ CRUD Operations ได้อย่างปลอดภัย</p>
                  <div className="w-full h-48 bg-black rounded-xl border border-zinc-800 flex items-center justify-center relative overflow-hidden group-hover:border-zinc-700 transition-colors">
                    <span className="text-zinc-600 font-mono text-sm">[ Owner Command / Users UI ]</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-900/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </motion.div>

                {/* 👑 Card 2 */}
                <motion.div whileHover={{ scale: 1.03, borderColor: "rgba(249, 115, 22, 0.45)", boxShadow: "0px 20px 40px rgba(0,0,0,0.5)" }} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-9 flex flex-col transition-all duration-300 group shadow-lg"
                >
                  <div className="flex items-center gap-5 mb-5">
                    <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 text-3xl group-hover:bg-orange-500 group-hover:text-white transition-colors">📚</div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Academic Orchestration</h3>
                  </div>
                  <p className="text-zinc-400 text-base mb-10 flex-1 leading-relaxed">จากเปิดรายวิชาถึงการตัดเกรด — Admin สามารถสร้างคลาสเรียนใหม่ (Plan) ให้ User ลงทะเบียน และมีระบบให้เกรด (Grading) ที่จะคำนวณและอัปเดต GPAX ของนักศึกษาโดยอัตโนมัติ</p>
                  <div className="w-full h-48 bg-black rounded-xl border border-zinc-800 flex items-center justify-center relative overflow-hidden group-hover:border-zinc-700 transition-colors">
                    <span className="text-zinc-600 font-mono text-sm">[ Plan & Grading UI ]</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-900/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </motion.div>

                {/* 👑 Card 3 */}
                <motion.div whileHover={{ scale: 1.03, borderColor: "rgba(249, 115, 22, 0.45)", boxShadow: "0px 20px 40px rgba(0,0,0,0.5)" }} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-9 flex flex-col transition-all duration-300 group shadow-lg"
                >
                  <div className="flex items-center gap-5 mb-5">
                    <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 text-3xl group-hover:bg-orange-500 group-hover:text-white transition-colors">🛠️</div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Centralized Operations</h3>
                  </div>
                  <p className="text-zinc-400 text-base mb-10 flex-1 leading-relaxed">ศูนย์กลางการรับเรื่อง (Ticket System) จากฟีเจอร์ Tools ทั้งหมด ไม่ว่าจะเป็นการขอเอกสาร จองห้อง หรือยืมของ ตรวจสอบ Approve/Reject และอัปเดตสถานะได้จากหน้าจอเดียว</p>
                  <div className="w-full h-48 bg-black rounded-xl border border-zinc-800 flex items-center justify-center relative overflow-hidden group-hover:border-zinc-700 transition-colors">
                    <span className="text-zinc-600 font-mono text-sm">[ Admin Tools Console UI ]</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-900/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </motion.div>

                {/* 👑 Card 4 */}
                <motion.div whileHover={{ scale: 1.03, borderColor: "rgba(249, 115, 22, 0.45)", boxShadow: "0px 20px 40px rgba(0,0,0,0.5)" }} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-9 flex flex-col transition-all duration-300 group shadow-lg"
                >
                  <div className="flex items-center gap-5 mb-5">
                    <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 text-3xl group-hover:bg-orange-500 group-hover:text-white transition-colors">📝</div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Work Console</h3>
                  </div>
                  <p className="text-zinc-400 text-base mb-10 flex-1 leading-relaxed">ระบบสั่งและตรวจการบ้านครบวงจร สร้างงาน (Task), กำหนด Deadline, และเข้าสู่ Work Console เพื่อตรวจงานพร้อมให้คะแนน ซึ่งจะยิง Notification กลับไปยังนักศึกษาทันที</p>
                  <div className="w-full h-48 bg-black rounded-xl border border-zinc-800 flex items-center justify-center relative overflow-hidden group-hover:border-zinc-700 transition-colors">
                    <span className="text-zinc-600 font-mono text-sm">[ Work Console UI ]</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-900/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </motion.div>

              </div>
            </div>
        </ScrollAnimateSection>
      </section>

      {/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */}
      {/* 📍 7. TECH STACK & FOOTER (Always Visible) */}
      <footer id="footer" className="bg-black py-20 px-6 sm:px-10 md:px-16 border-t border-zinc-900 relative z-10 scroll-margin-top-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-12">
          {/* Left: Info */}
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center text-black font-bold text-xl">S</div>
              <h2 className="text-3xl font-extrabold text-white tracking-tighter">SIT<span className='text-orange-500'>PLATFORM</span> Showcase</h2>
            </div>
            <p className="text-zinc-500 text-base max-w-sm mb-7 leading-relaxed">
              A comprehensive digital campus experience built for KMUTT students. Designed with passion and engineered for performance.
            </p>
            {/* Tech Stack Outline */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 max-w-sm">
              <span className="px-3.5 py-2 bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs rounded-full font-mono flex items-center gap-2 shadow-sm"><SiNextdotjs className="text-white"/> Next.js 14+</span>
              <span className="px-3.5 py-2 bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs rounded-full font-mono flex items-center gap-2 shadow-sm"><SiTailwindcss className="text-sky-400"/> Tailwind CSS</span>
              <span className="px-3.5 py-2 bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs rounded-full font-mono flex items-center gap-2 shadow-sm"><SiSupabase className="text-green-500"/> Supabase</span>
              <span className="px-3.5 py-2 bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs rounded-full font-mono shadow-sm">✨ Framer Motion</span>
            </div>
          </div>

          {/* Right: CTA & Credits */}
          <div className="flex flex-col items-center md:items-end gap-7">
            <div className="flex gap-4">
              <motion.a whileHover={{ scale: 1.05 }} href="https://github.com/..." target="_blank" className="flex items-center gap-2.5 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full transition-colors border border-zinc-800 hover:border-zinc-700 shadow-xl"
              >
                <FaGithub className="text-2xl" />
                <span className="text-base font-semibold">View Source on GitHub</span>
              </motion.a>
              <motion.a whileHover={{ scale: 1.05 }} href="#" className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors shadow-2xl shadow-blue-500/30"
              >
                <span className="text-base font-semibold">My Resume</span>
              </motion.a>
            </div>
            <p className="text-zinc-600 text-sm text-center md:text-right mt-3 leading-relaxed">
              © 2026 Pongsakorn (Aon). All rights reserved.<br/>
              Crafted for School of Information Technology (SIT), <br/>
              King Mongkut&apos;s University of Technology Thonburi (KMUTT).
            </p>
          </div>
        </div>
      </footer>
      {/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */}
    </div>
  );
}