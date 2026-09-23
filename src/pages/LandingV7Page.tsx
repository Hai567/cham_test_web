import aim from '../assets/v4/aim.webp';
import heroM from '../assets/v4/hero-m.webp';
import hero from '../assets/v4/hero.webp';
import memory from '../assets/v4/memory.webp';
import logo from '../assets/v7/logo.png';
import { ScanSteps } from '../features/landing-v2/ScanSteps';
import { V2Cta, V2Footer, V2Header, V2Hero } from '../features/landing-v2/Sections';
import { TouchSceneV5 } from '../features/landing-v5/TouchSceneV5';
import { StoryV6 } from '../features/landing-v6/StoryV6';
import { FaqV7 } from '../features/landing-v7/FaqV7';
import { FlowV7 } from '../features/landing-v7/FlowV7';

/**
 * Landing V7: như V6, cộng
 * - logo chính thức CHẠM và câu "Để ký ức ở lại." dùng thống nhất,
 * - bỏ phần "Trong hộp quà" (hộp quà chưa phát triển),
 * - font tiêu đề Fraunces (số không bị tụt dòng), chữ thường Be Vietnam Pro,
 * - câu chữ theo góp ý, phần duyệt trước có hình, hỏi đáp, nhắc dịp 20/10, nút Zalo (khi có số).
 * Chạy song song với các bản trước.
 */
const TAGLINE = 'Để ký ức ở lại.';
const NOTE_2010 = 'Tặng mẹ dịp 20/10? Đặt sớm để kịp nhận quà trước ngày lễ.';

export function LandingV7Page() {
  return (
    <div className="v7 min-h-screen bg-[#F7F1E7]">
      <V2Header home="/" logoSrc={logo} logoW={813} logoH={262} tagline={TAGLINE} logoClass="w-[clamp(96px,8vw,128px)]" />
      <main id="main">
        <V2Hero
          img={hero}
          imgM={heroM}
          pos="80% 50%"
          alt="Người con trao khung ảnh kỷ niệm cho mẹ bên bàn gỗ, cạnh hộp quà thắt nơ, nắng chiều qua cửa sổ."
          altM="Người con trao khung ảnh kỷ niệm cho mẹ."
          sub="Biến kỷ niệm giữa bạn và người ấy thành một khung ảnh biết kể chuyện."
          note={<p className="text-[14px] text-cocoa/75">{NOTE_2010}</p>}
        />
        <TouchSceneV5 captionText="Nhìn bằng mắt, đó là tấm ảnh. Nhìn qua điện thoại, ảnh sống lại." />
        <ScanSteps
          images={{ aim, photo: memory, logo }}
          copy={{
            heading: 'Người nhận chỉ cần ba bước',
            steps: [
              { n: '01', title: 'Quét mã sau khung', body: 'Không cần cài ứng dụng.' },
              { n: '02', title: 'Hướng camera vào tấm ảnh', body: 'Giữ yên vài giây.' },
              { n: '03', title: 'Khoảnh khắc sống lại', body: 'Chạm để bật âm thanh.' },
            ],
          }}
        />
        <FlowV7 />
        <StoryV6 text="Hàng nghìn tấm ảnh trong điện thoại, chưa một lần được in ra. Chạm đưa chúng ra khỏi màn hình, thành món quà cầm được trên tay cho người bạn thương." />
        <FaqV7 />
        <V2Cta heading="Bạn muốn gửi lời thương đến ai?" note={NOTE_2010} />
      </main>
      <V2Footer logoSrc={logo} logoW={813} logoH={262} tagline={TAGLINE} />
    </div>
  );
}
