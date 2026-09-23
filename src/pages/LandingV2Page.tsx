import { ScanSteps } from '../features/landing-v2/ScanSteps';
import { Flow, Gift, OnePhoto, Story, V2Cta, V2Footer, V2Header, V2Hero } from '../features/landing-v2/Sections';

/**
 * Landing V2 (bản thử nghiệm chuyển động), chạy song song với landing cũ ở "/".
 * Mạch: trao quà, phép màu, người nhận 3 bước, bạn duyệt trước, món quà, câu chuyện, cảm ơn ai.
 */
export function LandingV2Page() {
  return (
    <div className="min-h-screen bg-[#F7F1E7]">
      <V2Header />
      <main id="main">
        <V2Hero />
        <OnePhoto />
        <ScanSteps />
        <Flow />
        <Gift />
        <Story />
        <V2Cta />
      </main>
      <V2Footer />
    </div>
  );
}
