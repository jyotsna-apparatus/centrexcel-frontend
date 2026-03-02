'use client'
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";

const Hero = () => {
  return (
    <section id="hero" className="parent py-12 md:py-[100px] h-[100dvh] relative">
      <video
        src="/hero-video.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover -z-[1] saturate-0 brightness-50"
        aria-hidden
      />
      <div className="container flex flex-col items-center justify-center gap-8 px-4 relative">
        <div className="relative inline-block" data-aos="fade-up">
        <Image
            src="/w.png"
            alt="wifi"
            width={120}
            height={120}
            className="absolute -top-4 -right-4 md:-top-8 md:-right-8 z-20 satellite-float w-12 h-12 md:w-[120px] md:h-[120px]"

          />
          <Image
            src="/r.png"
            alt="robot"
            width={120}
            height={120}
            className="absolute -top-4 -left-4 md:-top-8 md:-left-8 z-20 rocket-float w-12 h-12 md:w-[120px] md:h-[120px]"

          />

          <Image
            src="/c.png"
            alt="trophy"
            width={120}
            height={120}
            className="absolute -bottom-8 -left-1 md:-bottom-16 md:-left-2 z-20 trophy-float w-12 h-12 md:w-[120px] md:h-[120px]"

          />

          <Image
            src="/t.png"
            alt="target"
            width={120}
            height={120}
            className="absolute -bottom-8 -right-1 md:-bottom-16 md:-right-2 z-20 brain-float w-12 h-12 md:w-[120px] md:h-[120px]"

          />

          <h1 className="h1 text-center !text-2xl sm:!text-3xl md:!text-4xl lg:!text-[4.5rem]">
            Ship at Hackathons. <span className="text-cs-primary">Get Hired</span> by Top Companies.
          </h1>
        </div>
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