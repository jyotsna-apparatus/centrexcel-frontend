import { AOSProvider } from "@/components/aos-provider";
import SiteHeader from "@/components/siteHeader/SiteHeader";
import Hero from "@/components/sections/Hero";
import StatsSection from "@/components/sections/StatsSection";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import Hackathons from "@/components/sections/Hackathons";
import Faqs from "@/components/sections/Faqs";
import FooterSection from "@/components/sections/FooterSection";

export default function LandingPage() {
  return (
    <>
     <AOSProvider>
      <SiteHeader />
      <Hero />
      <StatsSection />
      <Features />
      <HowItWorks />
      <Hackathons />
      <Faqs />  
      <FooterSection />
    </AOSProvider>
    </>
  );
}





