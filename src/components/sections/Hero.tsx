'use client'
import Link from "next/link";
import { Button } from "../ui/button";

const Hero = () => {
  return (
    <section className="parent py-[100px] h-[100dvh] relative">
      <video
        src="/bg1.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover -z-[1] saturate-0 brightness-50"
        aria-hidden
      />
      <div className="container flex flex-col items-center justify-center gap-8 px-4 relative">
        <h1 className="h1 text-center" data-aos="fade-up">
          Where <span>Hackathons</span> Meet Opportunity.
        </h1>
        <p className="p1 text-center max-w-2xl" data-aos="fade-up" data-aos-delay="100">
          Join world-class hackathons, solve real challenges from top companies, and launch your career — all in one platform.
        </p>
        <Link href="/auth/sign-in" data-aos="fade-up" data-aos-delay="200">
          <Button variant="default" size="lg">Get Started</Button>
        </Link>
      </div>
    </section>
  );
};

export default Hero;