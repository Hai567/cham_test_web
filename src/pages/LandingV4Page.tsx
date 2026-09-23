import aim from '../assets/v4/aim.webp';
import heroM from '../assets/v4/hero-m.webp';
import hero from '../assets/v4/hero.webp';
import memory from '../assets/v4/memory.webp';
import { ScanSteps } from '../features/landing-v2/ScanSteps';
import { Flow, Gift, Story, V2Cta, V2Footer, V2Header, V2Hero } from '../features/landing-v2/Sections';
import { TouchScene } from '../features/landing-v4/TouchScene';

/**
 * Landing V4: nền V2 (bản chính), thêm ảnh hero mới (con trao khung ảnh cho mẹ)
 * và cảnh "Chạm" ngay sau hero, thay cho phần "Một bức ảnh. Hai cách để nhớ.".
 * Chạy song song với "/", "/v2", "/v3".
 */
export function LandingV4Page() {
  return (
    <div className="min-h-screen bg-[#F7F1E7]">
      <V2Header home="/v4" />
      <main id="main">
        <V2Hero
          img={hero}
          imgM={heroM}
          pos="80% 50%"
          alt="Người con trao khung ảnh kỷ niệm cho mẹ bên bàn gỗ, cạnh hộp quà thắt nơ, nắng chiều qua cửa sổ."
          altM="Người con trao khung ảnh kỷ niệm cho mẹ."
        />
        <TouchScene />
        <ScanSteps images={{ aim, photo: memory }} />
        <Flow />
        <Gift />
        <Story />
        <V2Cta />
      </main>
      <V2Footer />
    </div>
  );
}
