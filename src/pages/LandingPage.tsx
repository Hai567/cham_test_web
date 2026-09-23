import { ExperienceTypes } from '../features/landing/ExperienceTypes';
import { FinalCta } from '../features/landing/FinalCta';
import { Hero } from '../features/landing/Hero';
import { HowItWorks } from '../features/landing/HowItWorks';
import { LandingFooter } from '../features/landing/LandingFooter';
import { LandingHeader } from '../features/landing/LandingHeader';
import { OnePhoto } from '../features/landing/OnePhoto';
import { ProductWhy } from '../features/landing/ProductWhy';
import { Story } from '../features/landing/Story';

/** Trang giới thiệu công khai, dựng theo mockup chính thức của Chạm. */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F1E7]">
      <LandingHeader />
      <main id="main">
        <Hero />
        <OnePhoto />
        <HowItWorks />
        <ProductWhy />
        <ExperienceTypes />
        <Story />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
