import { AOSProvider } from "@/components/aos-provider";
import Faqs from "@/components/sections/Faqs";
import Features from "@/components/sections/Features";
import FooterSection from "@/components/sections/FooterSection";
import FifthSection from "@/components/sections/fifthSection/FifthSection";
import FourthSection from "@/components/sections/fourthSection/FourthSection";
import FeaturedChallenges from "@/components/sections/Hackathons";
import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import StatsSection from "@/components/sections/StatsSection";
import SecondSection from "@/components/sections/secondSection/SecondSection";
import SixthSection from "@/components/sections/sixthSection/SixthSection";
import ThirdSection from "@/components/sections/thirdSection/ThirdSection";
import SiteHeader from "@/components/siteHeader/SiteHeader";

export default function LandingPage() {
  return (
    <AOSProvider>
      <SiteHeader />
      <Hero />
      <SecondSection />
      <FeaturedChallenges />
      <HowItWorks />

      {/* <SixthSection /> */}
      <ThirdSection />
      <FourthSection />
      <FifthSection />
      <StatsSection />
      <Features />
      <Faqs />
      <FooterSection />
    </AOSProvider>
  );
}


