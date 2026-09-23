import playMp4 from '../assets/v3/play.mp4';
import playWebm from '../assets/v3/play.webm';
import { ScanSteps } from '../features/landing-v2/ScanSteps';
import { Flow, Gift, OnePhoto, Story, V2Cta, V2Footer, V2Header } from '../features/landing-v2/Sections';
import { HeroV3 } from '../features/landing-v3/HeroV3';

/**
 * Landing V3: thử 3 kỹ thuật lấy từ prompt motionsites (video lặp mờ dần, tiêu đề hiện từng từ,
 * hero mobile dồn xuống đáy). Chạy song song với "/" và "/v2"; các phần dưới hero dùng chung với V2.
 * Video hiện là clip tạm dựng từ ảnh tĩnh, thay bằng video thật khi có.
 */
export function LandingV3Page() {
  return (
    <div className="min-h-screen bg-[#F7F1E7]">
      <V2Header home="/v3" />
      <main id="main">
        <HeroV3 />
        <OnePhoto />
        <ScanSteps video={{ mp4: playMp4, webm: playWebm }} />
        <Flow />
        <Gift />
        <Story />
        <V2Cta />
      </main>
      <V2Footer />
    </div>
  );
}
