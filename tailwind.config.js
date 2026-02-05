/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sit: {
          primary: '#336699',   // น้ำเงินเข้ม
          secondary: '#3399CC', // ฟ้าอ่อน
          neutral: '#919191',   // เทา
        },
        bg: '#F3F4F6', // พื้นหลังเทาจางๆ
      },
    },
  },
  plugins: [],
}