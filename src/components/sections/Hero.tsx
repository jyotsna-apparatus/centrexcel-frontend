"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import {  ScrollIcon } from "lucide-react";

const Hero = () => {

  const popText= ["Think Big!", "Act Small!", "Fail Fast!"]


  return (
    <section
      id="hero"
      className="parent py-12 md:py-[100px] h-[100dvh] relative"
    >
      <div className="container flex flex-col items-center justify-center gap-8 px-4 relative">
        <div className="relative inline-block" data-aos="fade-up">

          <h1 className="h1 text-center !text-2xl sm:!text-3xl md:!text-4xl lg:!text-[4.5rem]">
          Solve Real-World Challenges from Top Companies{" "}
            <br></br>
            {popText.map((text, index) => (
              <span key={index} className="text-cs-primary m-2 mt-6" data-aos="zoom-up" data-aos-delay={String(1000 + index * 600)}>
                {text}
              </span>
            ))}
          </h1>
        </div>
        <p
          className="p1 text-center max-w-2xl"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          Join world-class hackathons, solve real challenges from top companies,
          and launch your career — all in one platform.
        </p>
        <Link href="/auth/sign-in" data-aos="fade-up" data-aos-delay="200">
          <Button variant="default" size="lg">
            Get Started
          </Button>
        </Link>

        <span className="absolute bottom-0 left-0 right-0 flex justify-center items-center animate-bounce opacity-50">
          <span className="h-10 w-6  rounded-[100px] border-2 border-white flex items-start justify-center ">

            <span className="h-3 w-1 rounded-full bg-white mt-2"></span>
          </span>
        </span>
      </div>
    </section>
  );
};

export default Hero;
