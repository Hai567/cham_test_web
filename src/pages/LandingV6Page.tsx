import aim from '../assets/v4/aim.webp';
import heroM from '../assets/v4/hero-m.webp';
import hero from '../assets/v4/hero.webp';
import memory from '../assets/v4/memory.webp';
import { ScanSteps } from '../features/landing-v2/ScanSteps';
import { Flow, Gift, V2Cta, V2Footer, V2Header, V2Hero } from '../features/landing-v2/Sections';
import { StoryV6 } from '../features/landing-v6/StoryV6';
import { TouchSceneV5 } from '../features/landing-v5/TouchSceneV5';

/**
 * Landing V6: như V5, thêm phần "Vì sao có Chạm?" với dải ảnh thật của đội ngũ trôi như cuộn camera.
 * Chạy song song với các bản trước.
 */
export function LandingV6Page() {
  return (
    <div className="min-h-screen bg-[#F7F1E7]">
      <V2Header home="/v6" />
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
        <StoryV6 />
        <V2Cta />
      </main>
      <V2Footer />
    </div>
  );
}
