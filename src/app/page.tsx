import { AOSProvider } from "@/components/aos-provider";
import SiteHeader from "@/components/siteHeader/SiteHeader";
import Hero from "@/components/sections/Hero";
import StatsSection from "@/components/sections/StatsSection";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import Hackathons from "@/components/sections/Hackathons";
import Faqs from "@/components/sections/Faqs";
import FooterSection from "@/components/sections/FooterSection";
import SecondSection from "@/components/sections/secondSection/SecondSection";
import ThirdSection from "@/components/sections/thirdSection/ThirdSection";
import FourthSection from "@/components/sections/fourthSection/FourthSection";
import FifthSection from "@/components/sections/fifthSection/FifthSection";
import SixthSection from "@/components/sections/sixthSection/SixthSection";

export default function LandingPage() {
  return (
    <>
     <AOSProvider>
      <SiteHeader />
      <Hero />
      <SecondSection/>
      <SixthSection/>
      <ThirdSection/>
      <FourthSection/>
      <FifthSection/>
      
      {/* <StatsSection /> */}
      {/* <Features /> */}
      {/* <HowItWorks /> */}
      {/* <Hackathons /> */}
      {/* <Faqs />   */}
      <FooterSection />
    </AOSProvider>
    </>
  );
}





