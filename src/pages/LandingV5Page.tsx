import aim from '../assets/v4/aim.webp';
import heroM from '../assets/v4/hero-m.webp';
import hero from '../assets/v4/hero.webp';
import memory from '../assets/v4/memory.webp';
import { ScanSteps } from '../features/landing-v2/ScanSteps';
import { Flow, Gift, Story, V2Cta, V2Footer, V2Header, V2Hero } from '../features/landing-v2/Sections';
import { TouchSceneV5 } from '../features/landing-v5/TouchSceneV5';

/**
 * Landing V5: như V4, nhưng cảnh "Chạm" theo video tham chiếu: cả hai bàn tay cùng tiến vào và chạm nhau.
 * Chạy song song với "/", "/v2", "/v3", "/v4".
 */
export function LandingV5Page() {
  return (
    <div className="min-h-screen bg-[#F7F1E7]">
      <V2Header home="/v5" />
      <main id="main">
        <V2Hero
          img={hero}
          imgM={heroM}
          pos="80% 50%"
          alt="Người con trao khung ảnh kỷ niệm cho mẹ bên bàn gỗ, cạnh hộp quà thắt nơ, nắng chiều qua cửa sổ."
          altM="Người con trao khung ảnh kỷ niệm cho mẹ."
        />
        <TouchSceneV5 />
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
