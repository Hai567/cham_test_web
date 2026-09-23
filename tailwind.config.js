/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bảng màu chính thức của Chạm.
        cocoa: { DEFAULT: '#4A3A35', deep: '#3A2D29', soft: '#7A6A60' },
        ivory: '#F7F1E8',
        cream: '#FCF9F4',
        blush: { DEFAULT: '#E8C9BE', soft: '#F3E1DA' },
        taupe: { DEFAULT: '#B9A69B', line: '#E0D6CA' },
        sand: '#DCC9B8',

        // Token dùng chung toàn app, ánh xạ sang palette Chạm để mọi luồng
        // (đặt hàng, vận hành, AR) tự kế thừa tông ấm mà không phải sửa từng file.
        navy: '#4A3A35', // chữ chính, nút, mốc thời gian
        ink: '#3A2D29', // trạng thái hover đậm hơn
        paper: '#FCF9F4', // nền chính
        line: '#E0D6CA', // đường kẻ, viền
        muted: '#7A6A60', // chữ phụ (đạt tương phản trên nền kem)
        // Nhấn ấm thay cho tím/xanh cũ, giữ tên biến để không vỡ giao diện.
        lavender: { DEFAULT: '#B9A69B', ink: '#6E574E', soft: '#EFE6DD' },
        sky: '#F1E7DC',
        mint: { DEFAULT: '#E6EBE0', ink: '#4B5B44' },
        coral: { DEFAULT: '#C57B52', ink: '#9A5334' },
        danger: { DEFAULT: '#A23D2A', soft: '#F3E0D9' },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        // Tiêu đề theo bộ nhận diện chốt (Fraunces), dùng cho các trang mới.
        display: ['Fraunces', 'Georgia', '"Times New Roman"', 'serif'],
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
      },
      letterSpacing: {
        brand: '0.35em',
      },
      boxShadow: {
        frame: '0 1px 0 rgba(74,58,53,.06), 0 24px 60px -24px rgba(74,58,53,.45)',
        soft: '0 20px 50px -30px rgba(74,58,53,.4)',
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};
